"use server";

import { prisma } from "@/app/db";
import { setStudyStatus } from "@/lib/studyStatus";
import { requirePermission } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import {
  archiveStudyStatuses,
  finalReportStatuses,
  type ArchiveDoctorOption,
  type ArchiveReportDetail,
  type ArchiveSearchFilters,
  type ArchiveStudyRow,
} from "./types";

async function requireArchiveAccess() {
  return requirePermission("archive.read");
}

function cleanText(value?: string | null) {
  return (value || "").trim();
}

function normalizePatientName(value?: string | null) {
  return cleanText(value).replace(/\^/g, " ") || "Unknown Patient";
}

function toIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function readDayBoundary(value?: string, end = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (end) date.setDate(date.getDate() + 1);
  return date;
}

function dateRangeFilter(filters: ArchiveSearchFilters) {
  const gte = readDayBoundary(filters.dateFrom);
  const lt = readDayBoundary(filters.dateTo, true);
  if (!gte && !lt) return null;
  return {
    ...(gte ? { gte } : {}),
    ...(lt ? { lt } : {}),
  };
}

function reportDrivenStudyStatus(status?: string | null) {
  if (status === "FINAL" || status === "COMPLETED") return "FINALIZED";
  return "READY_TO_READ";
}

function getDoctorPrintInfo(report: any) {
  const doctor = report?.doctor;
  const profile = doctor?.doctorProfile;
  if (!doctor) return {};

  return {
    doctorName: doctor.fullName || "",
    doctorTitle: profile?.title || "",
    doctorSpecialty: profile?.specialty || "",
    doctorLicenseNumber: profile?.licenseNumber || "",
    doctorSignatureImagePath: profile?.signatureImagePath || "",
  };
}

function serializeClinicProfile(profile: any) {
  return {
    clinicName: profile?.name || "Mini PACS",
    clinicLegalName: profile?.legalName || "",
    clinicAddress: profile?.address || "",
    clinicPhone: profile?.phone || "",
    clinicEmail: profile?.email || "",
    clinicWebsite: profile?.website || "",
    clinicLogoPath: profile?.logoPath || "",
    clinicHeaderText: profile?.headerText || "He thong chan doan hinh anh",
    clinicFooterText: profile?.footerText || "Phieu ket qua duoc phat hanh tu he thong Mini PACS.",
    clinicLicenseNumber: profile?.licenseNumber || "",
  };
}

async function getDefaultPrintTemplate() {
  const template = await prisma.printTemplate.findFirst({
    where: { isDefault: true },
    orderBy: { createdAt: "desc" },
  });
  if (template) return template.htmlContent;

  const anyTemplate = await prisma.printTemplate.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (anyTemplate) return anyTemplate.htmlContent;

  return `
    {{CLINIC_HEADER}}
    <h2>KET QUA CHAN DOAN HINH ANH</h2>
    <p><strong>Benh nhan:</strong> {{PATIENT_NAME}} - {{PATIENT_ID}}</p>
    <p><strong>Ngay chup:</strong> {{STUDY_DATE}}</p>
    <p><strong>Chi dinh:</strong> {{STUDY_DESC}}</p>
    <hr />
    <h3>MO TA (FINDINGS)</h3>
    <p>{{REPORT_CONTENT}}</p>
    <h3>KET LUAN (CONCLUSION)</h3>
    <p>{{CONCLUSION}}</p>
    <h3>DE NGHI (RECOMMENDATION)</h3>
    <p>{{RECOMMENDATION}}</p>
    {{CLINIC_FOOTER}}
  `;
}

async function checkOrthancStudy(orthancStudyId?: string | null, studyStatus?: string | null) {
  if (studyStatus === "DELETED_FROM_PACS") {
    return {
      canOpenViewer: false,
      imageWarning: "Anh da duoc xoa khoi PACS. Chi con metadata RIS va bao cao.",
    };
  }

  if (!orthancStudyId) {
    return {
      canOpenViewer: false,
      imageWarning: "Chua co ma Orthanc study de mo anh.",
    };
  }

  const orthancUrl = process.env.ORTHANC_API_URL || "http://orthanc:8042";
  const username = process.env.ORTHANC_USERNAME || "admin";
  const password = process.env.ORTHANC_PASSWORD || "admin_password";

  try {
    const response = await fetch(`${orthancUrl}/studies/${encodeURIComponent(orthancStudyId)}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      return { canOpenViewer: true, imageWarning: "" };
    }

    return {
      canOpenViewer: false,
      imageWarning: "Khong tim thay anh trong Orthanc. Co the anh da duoc xoa khoi PACS.",
    };
  } catch (error) {
    return {
      canOpenViewer: false,
      imageWarning: "Khong kiem tra duoc trang thai anh tren Orthanc.",
    };
  }
}

function serializeArchiveRow(report: any): ArchiveStudyRow {
  const study = report.imagingStudy;
  const studyStatus = study?.status || reportDrivenStudyStatus(report.status);
  const studyDate = study?.receivedAt || study?.stableAt || study?.scheduledAt || study?.createdAt || report.updatedAt;
  const imageWarning =
    studyStatus === "DELETED_FROM_PACS"
      ? "Anh da duoc xoa khoi PACS. Chi con metadata RIS va bao cao."
      : !study?.orthancStudyId
        ? "Chua co ma Orthanc study de mo anh."
        : "";

  return {
    id: report.id,
    studyInstanceUid: report.studyInstanceUid,
    reportStatus: report.status,
    studyStatus,
    patientName: normalizePatientName(study?.patientName),
    patientId: cleanText(study?.patientId) || "-",
    accessionNumber: cleanText(study?.accessionNumber) || "-",
    modality: cleanText(study?.modality) || "-",
    bodyPart: cleanText(study?.bodyPart) || "",
    studyDescription: cleanText(study?.studyDescription) || "-",
    studyDate: toIso(studyDate),
    finalizedAt: toIso(study?.finalizedAt || (report.status === "FINAL" || report.status === "COMPLETED" ? report.updatedAt : null)),
    deliveredAt: toIso(study?.deliveredAt),
    doctorName: report.doctor?.fullName || "-",
    doctorId: report.doctorId || "",
    canOpenViewer: Boolean(study?.orthancStudyId && studyStatus !== "DELETED_FROM_PACS"),
    imageWarning,
  };
}

function buildArchiveWhere(filters: ArchiveSearchFilters) {
  const and: any[] = [
    {
      OR: [
        { status: { in: [...finalReportStatuses] } },
        { imagingStudy: { is: { status: { in: [...archiveStudyStatuses] } } } },
      ],
    },
  ];

  const patientName = cleanText(filters.patientName);
  if (patientName) {
    and.push({
      imagingStudy: {
        is: {
          patientName: { contains: patientName, mode: "insensitive" },
        },
      },
    });
  }

  const patientId = cleanText(filters.patientId);
  if (patientId) {
    and.push({
      imagingStudy: {
        is: {
          patientId: { contains: patientId, mode: "insensitive" },
        },
      },
    });
  }

  const accessionNumber = cleanText(filters.accessionNumber);
  if (accessionNumber) {
    and.push({
      OR: [
        {
          imagingStudy: {
            is: {
              accessionNumber: { contains: accessionNumber, mode: "insensitive" },
            },
          },
        },
        { studyInstanceUid: { contains: accessionNumber, mode: "insensitive" } },
      ],
    });
  }

  const range = dateRangeFilter(filters);
  if (range) {
    and.push({
      imagingStudy: {
        is: {
          OR: [
            { receivedAt: range },
            { stableAt: range },
            { scheduledAt: range },
            { finalizedAt: range },
            { createdAt: range },
          ],
        },
      },
    });
  }

  const modality = cleanText(filters.modality);
  if (modality && modality !== "ALL") {
    and.push({
      imagingStudy: {
        is: {
          modality,
        },
      },
    });
  }

  const doctorId = cleanText(filters.doctorId);
  if (doctorId && doctorId !== "ALL") {
    and.push({ doctorId });
  }

  const status = cleanText(filters.status);
  if (status && status !== "ALL") {
    if (status === "REPORT_FINAL") {
      and.push({ status: { in: [...finalReportStatuses] } });
    } else {
      and.push({
        imagingStudy: {
          is: {
            status,
          },
        },
      });
    }
  }

  return { AND: and };
}

export async function getArchiveDoctorsAction(): Promise<ArchiveDoctorOption[]> {
  await requireArchiveAccess();

  const doctors = await prisma.user.findMany({
    where: {
      reports: {
        some: {
          OR: [
            { status: { in: [...finalReportStatuses] } },
            { imagingStudy: { is: { status: { in: [...archiveStudyStatuses] } } } },
          ],
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      username: true,
    },
    orderBy: { fullName: "asc" },
  });

  return doctors.map(doctor => ({
    id: doctor.id,
    name: doctor.fullName || doctor.username,
  }));
}

export async function searchArchiveStudiesAction(filters: ArchiveSearchFilters = {}): Promise<ArchiveStudyRow[]> {
  await requireArchiveAccess();

  const reports = await prisma.report.findMany({
    where: buildArchiveWhere(filters),
    include: {
      imagingStudy: true,
      doctor: true,
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 150,
  });

  return reports.map(serializeArchiveRow);
}

export async function getArchiveReportAction(studyInstanceUid: string) {
  await requireArchiveAccess();

  const report = await prisma.report.findUnique({
    where: { studyInstanceUid },
    include: {
      imagingStudy: {
        include: {
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
      doctor: {
        include: { doctorProfile: true },
      },
    },
  });

  if (!report) {
    return { success: false, error: "Khong tim thay bao cao." };
  }

  if (!finalReportStatuses.includes(report.status as any) && !archiveStudyStatuses.includes(report.imagingStudy?.status as any)) {
    return { success: false, error: "Bao cao chua final nen chua nam trong Archive." };
  }

  const [templateHtml, clinicProfile, imageState] = await Promise.all([
    getDefaultPrintTemplate(),
    prisma.clinicProfile.findFirst({ orderBy: { createdAt: "asc" } }),
    checkOrthancStudy(report.imagingStudy?.orthancStudyId, report.imagingStudy?.status),
  ]);

  const row = serializeArchiveRow(report);
  const detail: ArchiveReportDetail = {
    ...row,
    ...imageState,
    findings: report.findings || "",
    conclusion: report.conclusion || "",
    recommendation: report.recommendation || "",
    templateHtml,
    clinicProfile: serializeClinicProfile(clinicProfile),
    doctorPrintInfo: getDoctorPrintInfo(report),
    statusHistory: (report.imagingStudy?.statusHistory || []).map(history => ({
      id: history.id,
      fromStatus: history.fromStatus || null,
      toStatus: history.toStatus,
      reason: history.reason || null,
      source: history.source,
      createdAt: history.createdAt.toISOString(),
    })),
  };

  return { success: true, detail };
}

export async function logArchivePrintAction(studyInstanceUid: string, mode: "PRINT" | "PDF") {
  const actor = await requireArchiveAccess();

  const report = await prisma.report.findUnique({
    where: { studyInstanceUid },
    include: { imagingStudy: true },
  });

  if (!report) return { success: false, error: "Khong tim thay bao cao de ghi log." };

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: mode === "PDF" ? "ARCHIVE_REPORT_EXPORTED_PDF" : "ARCHIVE_REPORT_REPRINTED",
      entityType: "Report",
      entityId: report.id,
      message: `${mode === "PDF" ? "Exported PDF" : "Reprinted"} report ${studyInstanceUid}`,
      metadataJson: JSON.stringify({
        studyInstanceUid,
        imagingStudyId: report.imagingStudyId,
        mode,
      }),
    },
  });

  return { success: true };
}

export async function markArchiveDeliveredAction(studyInstanceUid: string) {
  const actor = await requireArchiveAccess();

  if (!hasPermission(actor.role, "archive.deliver", actor.permissions)) {
    return { success: false, error: "Chi le tan hoac admin duoc ghi nhan tra ket qua." };
  }

  const report = await prisma.report.findUnique({
    where: { studyInstanceUid },
  });

  if (!report) return { success: false, error: "Khong tim thay bao cao." };

  const study = await setStudyStatus(studyInstanceUid, "DELIVERED", {
    source: "SYSTEM",
    reason: "Result delivered from archive screen",
    actorUserId: actor.id,
    metadata: { reportId: report.id },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "ARCHIVE_RESULT_DELIVERED",
      entityType: "ImagingStudy",
      entityId: study.id,
      message: `Delivered result ${studyInstanceUid}`,
      metadataJson: JSON.stringify({ reportId: report.id, studyInstanceUid }),
    },
  });

  revalidatePath("/archive");
  return { success: true };
}
