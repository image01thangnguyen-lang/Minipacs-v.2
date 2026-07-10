"use server";

import { prisma } from "@/app/db";
import { upsertWorklistStudy, setStudyStatus, claimStudyLock } from "@/lib/studyStatus";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { recordStudyEvent } from "@/lib/studyEvents";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/authz";
import { worklistSchema, type WorklistInput } from "./schema";
import { createNonDicomExam } from "@/lib/nonDicomWorkflowService";
import { ScopeRequestContext } from "@/lib/authz/scope/scope-request-context";
import { buildScopeFilter, applyScopeFilterToPrisma } from "@/lib/authz/scope/scope-filter-builder";
import { getScopeDeps } from "@/lib/authz/scope/deps";

const orderStatusValues = ["REQUESTED", "SCHEDULED", "ARRIVED", "CANCELLED", "EXPIRED"] as const;

const WORKLIST_DIR =
  process.env.NODE_ENV === "production"
    ? "/app/pacs_data/worklists"
    : path.resolve(process.cwd(), "../pacs_data/worklists");

function readDateRange(date?: string) {
  const base = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
}

async function requireWorklistAccess() {
  return requirePermission("worklist.manage");
}

function cleanText(value?: string | null) {
  return (value || "").trim();
}

function toIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)));
}

function minutesSince(value?: Date | null) {
  if (!value) return null;
  const minutes = Math.round((Date.now() - value.getTime()) / 60000);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
}

function toDicomDate(date?: Date | null) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

function toDicomTime(date?: Date | null) {
  if (!date) return "000000.000";
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  const second = `${date.getSeconds()}`.padStart(2, "0");
  return `${hour}${minute}${second}.000`;
}

function generateAccessionNumber() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${`${now.getMonth() + 1}`.padStart(2, "0")}${`${now.getDate()}`.padStart(2, "0")}`;
  const hms = `${`${now.getHours()}`.padStart(2, "0")}${`${now.getMinutes()}`.padStart(2, "0")}${`${now.getSeconds()}`.padStart(2, "0")}`;
  return `ACC${ymd}${hms}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
}

function generateStudyInstanceUid(accessionNumber: string) {
  const numeric = `${Date.now()}${accessionNumber.replace(/\D/g, "").slice(-8)}`;
  return `1.2.826.0.1.3680043.10.9999.${numeric}`;
}

function buildWorklistDicomJson(order: {
  patientName: string;
  patientId: string;
  dob?: Date | null;
  gender?: string | null;
  phone?: string | null;
  referringPhysician?: string | null;
  modality: string;
  bodyPart?: string | null;
  procedureCode?: string | null;
  procedureDescription?: string | null;
  priority?: string | null;
  scheduledDate: Date;
  scheduledStationAeTitle?: string | null;
  scheduledStationName?: string | null;
  accessionNumber: string;
  requestedStudyInstanceUid?: string | null;
}) {
  const procedureDescription = cleanText(order.procedureDescription) || `Study_${order.accessionNumber}`;
  const stationAe = cleanText(order.scheduledStationAeTitle) || "AETITLE";

  return {
    "0010,0010": order.patientName,
    "0010,0020": order.patientId,
    "0010,0030": toDicomDate(order.dob),
    "0010,0040": order.gender || "O",
    "0010,2154": cleanText(order.phone),
    "0008,0050": order.accessionNumber,
    "0008,0090": cleanText(order.referringPhysician),
    "0018,0015": cleanText(order.bodyPart),
    "0020,000D": order.requestedStudyInstanceUid,
    "0032,1060": procedureDescription,
    "0040,1001": order.accessionNumber,
    "0040,1003": order.priority || "ROUTINE",
    "0040,0100": [
      {
        "0008,0060": order.modality,
        "0040,0001": stationAe,
        "0040,0002": toDicomDate(order.scheduledDate),
        "0040,0003": toDicomTime(order.scheduledDate),
        "0040,0006": cleanText(order.referringPhysician),
        "0040,0007": procedureDescription,
        "0040,0009": `STEP_${order.accessionNumber}`,
        "0040,0010": cleanText(order.scheduledStationName),
      },
    ],
    "0032,1064": order.procedureCode
      ? [
          {
            "0008,0100": order.procedureCode,
            "0008,0104": procedureDescription,
          },
        ]
      : [],
  };
}

async function writeWorklistFile(order: any) {
  await fs.mkdir(WORKLIST_DIR, { recursive: true });
  const filename = `${order.accessionNumber}.wl.json`;
  const filePath = path.join(WORKLIST_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(buildWorklistDicomJson(order), null, 2), "utf8");
  return filename;
}

async function removeWorklistFile(filename?: string | null) {
  if (!filename || !/^[a-zA-Z0-9_.-]+\.wl\.json$/.test(filename)) return;
  const resolvedPath = path.resolve(WORKLIST_DIR, filename);
  if (!resolvedPath.startsWith(path.resolve(WORKLIST_DIR))) return;
  await fs.unlink(resolvedPath).catch(() => undefined);
}

function serializeOrder(order: any, context?: {
  usersById?: Map<string, { fullName: string | null; username: string }>;
  procedureByCode?: Map<string, any>;
  nodeByAeTitle?: Map<string, any>;
}) {
  const study = order.imagingStudies?.[0] || null;
  const report = study?.reports?.[0] || null;
  const usersById = context?.usersById || new Map();
  const assignedDoctor = study?.assignedDoctorId ? usersById.get(study.assignedDoctorId) : null;
  const reportDoctor = report?.doctorId ? usersById.get(report.doctorId) : null;
  const technologist = study?.technologistId ? usersById.get(study.technologistId) : null;
  const stationAeTitle = cleanText(study?.stationAeTitle || order.scheduledStationAeTitle);
  const node = stationAeTitle ? context?.nodeByAeTitle?.get(stationAeTitle) : null;
  const procedureCode = cleanText(study?.procedureCode || order.procedureCode || node?.defaultProcedure?.code);
  const procedure = procedureCode ? context?.procedureByCode?.get(procedureCode) || node?.defaultProcedure : node?.defaultProcedure;
  const waitingSince = study?.receivedAt || study?.stableAt || order.arrivedAt || order.scheduledDate || order.createdAt || null;
  const noDicomOverdue = !study?.orthancStudyId && order.createdAt && Date.now() - order.createdAt.getTime() > 24 * 60 * 60 * 1000;

  return {
    id: order.id,
    patientName: order.patientName,
    patientId: order.patientId,
    dob: order.dob?.toISOString() || null,
    gender: order.gender || "",
    phone: order.phone || "",
    referringPhysician: order.referringPhysician || "",
    referringDepartment: order.referringDepartment || "",
    sourceFacility: order.sourceFacility || "",
    modality: order.modality,
    bodyPart: study?.bodyPart || order.bodyPart || procedure?.bodyPart || "",
    procedureCode: procedureCode || "",
    procedureName: procedure?.name || "",
    procedureDescription: study?.procedureDescription || order.procedureDescription || procedure?.description || "",
    serviceTypeName: procedure?.serviceType?.name || node?.serviceType?.name || "",
    clinicalInfo: study?.clinicalInfo || "",
    technologistId: study?.technologistId || "",
    technologistName: technologist?.fullName || technologist?.username || "",
    assignedDoctorId: study?.assignedDoctorId || "",
    assignedDoctorName: assignedDoctor?.fullName || assignedDoctor?.username || "",
    reportDoctorId: report?.doctorId || "",
    reportDoctorName: reportDoctor?.fullName || reportDoctor?.username || "",
    reportStatus: report?.cancelledAt ? "CANCELLED" : (report?.status || ""),
    price: order.price ? Number(order.price) : null,
    paymentStatus: order.paymentStatus || "",
    priority: order.priority || "ROUTINE",
    scheduledStationAeTitle: order.scheduledStationAeTitle || "",
    scheduledStationName: order.scheduledStationName || "",
    accessionNumber: order.accessionNumber,
    requestedStudyInstanceUid: order.requestedStudyInstanceUid || "",
    scheduledDate: order.scheduledDate?.toISOString() || null,
    arrivedAt: order.arrivedAt?.toISOString() || null,
    cancelledAt: order.cancelledAt?.toISOString() || null,
    notes: order.notes || "",
    orderStatus: order.orderStatus,
    legacyStatus: order.status,
    createdAt: order.createdAt?.toISOString() || null,
    updatedAt: order.updatedAt?.toISOString() || null,
    studyStatus: study?.status || null,
    orthancStudyId: study?.orthancStudyId || null,
    studyInstanceUid: study?.studyInstanceUid || order.requestedStudyInstanceUid || "",
    isDicomMatched: Boolean(study?.orthancStudyId),
    noDicomOverdue,
    waitingMinutes: minutesSince(waitingSince),
    waitingSince: toIso(waitingSince),
    stationAeTitle,
    machineName: node?.name || order.scheduledStationName || "",
    facilityName: node?.facility?.name || order.sourceFacility || "",
    room: node?.room || "",
    hisSyncStatus: order.hisSyncStatus || null,
    hisResultStatus: study?.hisResultStatus || report?.hisResultStatus || null,
    hisLastError: study?.hisLastError || order.hisLastError || report?.hisResultError || null,
    hisLastSyncedAt: toIso(order.hisLastSyncedAt || study?.hisLastSyncedAt),
    hisLastResultSentAt: toIso(study?.hisLastResultSentAt || report?.hisResultSentAt),
    hisOrderId: order.hisOrderId || null,
    isNonDicomEligible: Boolean(procedure?.isNonDicomEligible || node?.isNonDicom),
    isNonDicom: study?.isNonDicom || false,
    nonDicomExamId: (study as any)?.nonDicomExam?.id || null,
  };
}

export async function getWorklistOrdersAction(filters: {
  date?: string;
  status?: string;
  search?: string;
} = {}) {
  const actor = await requireWorklistAccess();
  const { start, end } = readDateRange(filters.date);
  const status = orderStatusValues.includes(filters.status as any) ? filters.status : undefined;
  const search = cleanText(filters.search);

  const ctx = ScopeRequestContext.create();
  const filterResult = await buildScopeFilter(
    actor.id,
    "READ_STUDY",
    "ORDER",
    getScopeDeps(),
    ctx
  );
  const scopeWhere = applyScopeFilterToPrisma(
    filterResult,
    "performingUnitId",
    "scheduledStationAeTitle"
  );

  const where: any = {
    scheduledDate: {
      gte: start,
      lt: end,
    },
    ...scopeWhere
  };

  if (status) where.orderStatus = status;
  if (search) {
    where.OR = [
      { patientName: { contains: search, mode: "insensitive" } },
      { patientId: { contains: search, mode: "insensitive" } },
      { accessionNumber: { contains: search, mode: "insensitive" } },
      { procedureDescription: { contains: search, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.worklistOrder.findMany({
    where,
    include: {
      imagingStudies: {
        select: {
          status: true,
          orthancStudyId: true,
          studyInstanceUid: true,
          assignedDoctorId: true,
          stationAeTitle: true,
          clinicalInfo: true,
          technologistId: true,
          procedureCode: true,
          procedureDescription: true,
          bodyPart: true,
          receivedAt: true,
          stableAt: true,
          hisSyncStatus: true,
          hisResultStatus: true,
          hisLastError: true,
          hisLastSyncedAt: true,
          hisLastResultSentAt: true,
          isNonDicom: true,
          nonDicomExam: { select: { id: true } },
          reports: {
            select: {
              doctorId: true,
              status: true,
              cancelledAt: true,
              hisResultStatus: true,
              hisResultError: true,
              hisResultSentAt: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ priority: "desc" }, { scheduledDate: "asc" }, { createdAt: "asc" }],
  });

  const userIds = uniqueValues(
    orders.flatMap(order => {
      const study = order.imagingStudies?.[0];
      const report = study?.reports?.[0];
      return [study?.assignedDoctorId, study?.technologistId, report?.doctorId];
    })
  );
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true, username: true },
      })
    : [];
  const usersById = new Map(users.map(user => [user.id, user]));

  const stationAes = uniqueValues(
    orders.flatMap(order => [order.imagingStudies?.[0]?.stationAeTitle, order.scheduledStationAeTitle])
  );
  const nodes = stationAes.length
    ? await prisma.dicomNode.findMany({
        where: { aeTitle: { in: stationAes }, isActive: true },
        include: {
          facility: true,
          serviceType: true,
          defaultProcedure: { include: { serviceType: true } },
        },
      })
    : [];
  const nodeByAeTitle = new Map<string, typeof nodes[number]>();
  nodes.forEach(node => {
    if (!nodeByAeTitle.has(node.aeTitle)) nodeByAeTitle.set(node.aeTitle, node);
  });

  const procedureCodes = uniqueValues(
    orders.flatMap(order => {
      const study = order.imagingStudies?.[0];
      const node = nodeByAeTitle.get(cleanText(study?.stationAeTitle || order.scheduledStationAeTitle));
      return [study?.procedureCode, order.procedureCode, node?.defaultProcedure?.code];
    })
  );
  const procedures = procedureCodes.length
    ? await prisma.procedureCatalog.findMany({
        where: { code: { in: procedureCodes } },
        include: { serviceType: true },
      })
    : [];
  const procedureByCode = new Map(procedures.map(procedure => [procedure.code, procedure]));

  return orders.map(order => serializeOrder(order, { usersById, procedureByCode, nodeByAeTitle }));
}

export async function createWorklistAction(data: WorklistInput) {
  const actor = await requireWorklistAccess();

  try {
    const validatedData = worklistSchema.parse(data);
    const accessionNumber = generateAccessionNumber();
    const studyInstanceUid = generateStudyInstanceUid(accessionNumber);
    const scheduledDate = validatedData.scheduledDateTime
      ? new Date(validatedData.scheduledDateTime)
      : new Date();
    const dobDate = validatedData.dob ? new Date(validatedData.dob) : null;
    const procedureDescription = cleanText(validatedData.procedureDescription) || `${validatedData.modality} ${cleanText(validatedData.bodyPart) || "Routine procedure"}`;

    const order = await prisma.worklistOrder.create({
      data: {
        patientName: validatedData.patientName,
        patientId: validatedData.patientId,
        dob: dobDate,
        gender: validatedData.gender || "O",
        phone: cleanText(validatedData.phone) || null,
        referringPhysician: cleanText(validatedData.referringPhysician) || null,
        referringDepartment: cleanText(validatedData.referringDepartment) || null,
        sourceFacility: cleanText(validatedData.sourceFacility) || null,
        modality: validatedData.modality,
        bodyPart: cleanText(validatedData.bodyPart) || null,
        procedureCode: cleanText(validatedData.procedureCode) || null,
        procedureDescription,
        price: validatedData.price === undefined ? null : validatedData.price,
        paymentStatus: cleanText(validatedData.paymentStatus) || null,
        priority: validatedData.priority || "ROUTINE",
        scheduledStationAeTitle: cleanText(validatedData.scheduledStationAeTitle) || "AETITLE",
        scheduledStationName: cleanText(validatedData.scheduledStationName) || null,
        accessionNumber,
        requestedStudyInstanceUid: studyInstanceUid,
        scheduledDate,
        notes: cleanText(validatedData.notes) || null,
        orderStatus: "SCHEDULED",
        status: "SCHEDULED",
      },
    });

    const worklistFilePath = await writeWorklistFile(order);
    const savedOrder = await prisma.worklistOrder.update({
      where: { id: order.id },
      data: { worklistFilePath },
      include: { imagingStudies: true },
    });

    await upsertWorklistStudy({
      studyInstanceUid,
      orderId: order.id,
      accessionNumber,
      patientId: validatedData.patientId,
      patientName: validatedData.patientName,
      modality: validatedData.modality,
      priority: validatedData.priority || "ROUTINE",
      stationAeTitle: cleanText(validatedData.scheduledStationAeTitle) || "AETITLE",
      bodyPart: cleanText(validatedData.bodyPart),
      studyDescription: procedureDescription,
      scheduledAt: scheduledDate,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "WORKLIST_ORDER_CREATED",
        entityType: "WorklistOrder",
        entityId: order.id,
        message: `Created worklist order ${accessionNumber}`,
        metadataJson: JSON.stringify({
          accessionNumber,
          modality: validatedData.modality,
          priority: validatedData.priority,
          stationAe: savedOrder.scheduledStationAeTitle,
        }),
      },
    });

    revalidatePath("/worklist");
    return { success: true, order: serializeOrder(savedOrder), accessionNumber };
  } catch (err: any) {
    console.error("Error creating worklist:", err);
    return { success: false, error: err.message };
  }
}

export async function checkInWorklistOrderAction(orderId: string) {
  const actor = await requireWorklistAccess();
  const arrivedAt = new Date();
  const order = await prisma.worklistOrder.update({
    where: { id: orderId },
    data: {
      orderStatus: "ARRIVED",
      status: "ARRIVED",
      arrivedAt,
    },
    include: { imagingStudies: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "WORKLIST_ORDER_CHECKED_IN",
      entityType: "WorklistOrder",
      entityId: order.id,
      message: `Checked in worklist order ${order.accessionNumber}`,
    },
  });

  await prisma.imagingStudy.updateMany({
    where: { orderId: order.id, checkedInAt: null },
    data: { checkedInAt: arrivedAt },
  });

  await Promise.all(order.imagingStudies.map(study => recordStudyEvent({
    imagingStudyId: study.id,
    eventType: "PATIENT_CHECKED_IN",
    fromStatus: study.status,
    toStatus: study.status,
    actorUserId: actor.id,
    source: "WORKLIST",
    createdAt: arrivedAt,
    metadata: {
      orderId: order.id,
      accessionNumber: order.accessionNumber,
    },
  })));

  revalidatePath("/worklist");
  return { success: true, order: serializeOrder(order) };
}

export async function cancelWorklistOrderAction(orderId: string) {
  const actor = await requireWorklistAccess();
  const existing = await prisma.worklistOrder.findUnique({
    where: { id: orderId },
  });

  if (!existing) return { success: false, error: "Order không tồn tại." };

  await removeWorklistFile(existing.worklistFilePath);
  const order = await prisma.worklistOrder.update({
    where: { id: orderId },
    data: {
      orderStatus: "CANCELLED",
      status: "CANCELLED",
      cancelledAt: new Date(),
      worklistFilePath: null,
    },
    include: { imagingStudies: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "WORKLIST_ORDER_CANCELLED",
      entityType: "WorklistOrder",
      entityId: order.id,
      message: `Cancelled worklist order ${order.accessionNumber}`,
    },
  });

  await Promise.all(order.imagingStudies.map(study => recordStudyEvent({
    imagingStudyId: study.id,
    eventType: "ORDER_CANCELLED",
    fromStatus: study.status,
    toStatus: study.status,
    actorUserId: actor.id,
    source: "WORKLIST",
    createdAt: order.cancelledAt || new Date(),
    metadata: {
      orderId: order.id,
      accessionNumber: order.accessionNumber,
    },
  })));

  revalidatePath("/worklist");
  return { success: true, order: serializeOrder(order) };
}

export async function regenerateWorklistFileAction(orderId: string) {
  const actor = await requireWorklistAccess();
  const existing = await prisma.worklistOrder.findUnique({
    where: { id: orderId },
  });

  if (!existing) return { success: false, error: "Order không tồn tại." };
  if (existing.orderStatus === "CANCELLED") return { success: false, error: "Order đã hủy, không tạo lại worklist." };

  const worklistFilePath = await writeWorklistFile(existing);
  const order = await prisma.worklistOrder.update({
    where: { id: orderId },
    data: {
      worklistFilePath,
      orderStatus: existing.orderStatus === "REQUESTED" ? "SCHEDULED" : existing.orderStatus,
      status: existing.orderStatus === "REQUESTED" ? "SCHEDULED" : existing.status,
    },
    include: { imagingStudies: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "WORKLIST_FILE_REGENERATED",
      entityType: "WorklistOrder",
      entityId: order.id,
      message: `Regenerated worklist file ${order.accessionNumber}`,
      metadataJson: JSON.stringify({ worklistFilePath }),
    },
  });

  await Promise.all(order.imagingStudies.map(study => recordStudyEvent({
    imagingStudyId: study.id,
    eventType: "WORKLIST_REGENERATED",
    fromStatus: study.status,
    toStatus: study.status,
    actorUserId: actor.id,
    source: "WORKLIST",
    metadata: {
      orderId: order.id,
      accessionNumber: order.accessionNumber,
      worklistFilePath,
    },
  })));

  revalidatePath("/worklist");
  return { success: true, order: serializeOrder(order) };
}

export async function startReadingAction(orderId: string, studyInstanceUid: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const hasReportsWrite = hasPermission(session.user.role, "reports.write", session.user.permissions);
  const hasWorklistManage = hasPermission(session.user.role, "worklist.manage", session.user.permissions);

  if (!hasReportsWrite || !hasWorklistManage) {
    return { success: false, error: "Bạn không có quyền khóa ca đọc (yêu cầu quyền worklist.manage và reports.write)." };
  }

  const userId = session.user.id;
  const existing = await prisma.worklistOrder.findUnique({
    where: { id: orderId },
    include: { imagingStudies: true }
  });

  if (!existing) return { success: false, error: "Order không tồn tại." };

  const study = existing.imagingStudies.find(s => s.studyInstanceUid === studyInstanceUid);
  if (!study) return { success: false, error: "Study không tồn tại." };

  const claimRes = await claimStudyLock(studyInstanceUid, userId, { orderId });
  if (!claimRes.success) {
    return claimRes;
  }

  revalidatePath("/worklist");
  return { success: true };
}

export async function getTechnologistsAction() {
  await requirePermission("studies.updateClinical");
  const doctors = await prisma.user.findMany({
    where: {
      isActive: true,
      role: "TECHNICIAN",
    },
    select: { id: true, fullName: true, username: true }
  });
  return doctors.map(d => ({
    id: d.id,
    name: `${d.fullName} (${d.username})`
  }));
}

export async function checkCanReadStudiesAction() {
  const session = await auth();
  if (!session?.user) return false;
  return hasPermission(session.user.role, "reports.write", session.user.permissions);
}

export async function createNonDicomExamFromWorklistAction(orderId: string) {
  const session = await requirePermission("nonDicom.create");
  
  const order = await prisma.worklistOrder.findUnique({
    where: { id: orderId }
  });

  if (!order) return { success: false, error: "Không tìm thấy order." };

  const existingExam = await prisma.nonDicomExam.findFirst({
    where: { worklistOrderId: orderId }
  });
  if (existingExam) {
    return { success: true, examId: existingExam.id };
  }

  // Validate eligibility
  let isEligible = false;
  if (order.procedureCode) {
    const proc = await prisma.procedureCatalog.findUnique({ where: { code: order.procedureCode } });
    if (proc?.isNonDicomEligible) isEligible = true;
  }
  if (!isEligible && order.scheduledStationAeTitle) {
    const node = await prisma.dicomNode.findFirst({ where: { aeTitle: order.scheduledStationAeTitle } });
    if ((node as any)?.isNonDicom) isEligible = true;
  }
  
  if (!isEligible) {
    return { success: false, error: "Ca chụp này không được cấu hình hỗ trợ thu nhận Non-DICOM." };
  }

  try {
    const exam = await createNonDicomExam({
      worklistOrderId: order.id,
      patientId: order.patientId,
      patientName: order.patientName,
      patientBirthDate: order.dob || undefined,
      patientSex: order.gender || undefined,
      accessionNumber: order.accessionNumber,
      procedureCatalogId: order.procedureCode || undefined,
      createdByUserId: session.id,
    });
    return { success: true, examId: exam.id };
  } catch (error: any) {
    if (error.code === 'P2002') {
      const existingExam = await prisma.nonDicomExam.findUnique({
        where: { worklistOrderId: orderId }
      });
      if (existingExam) {
        return { success: true, examId: existingExam.id };
      }
    }
    console.error("Lỗi khi tạo ca Non-DICOM:", error);
    return { success: false, error: "Đã xảy ra lỗi khi tạo ca chụp." };
  }
}

export async function checkCanUpdateClinicalAction() {
  const session = await auth();
  if (!session?.user) return false;
  return hasPermission(session.user.role, "studies.updateClinical", session.user.permissions);
}
