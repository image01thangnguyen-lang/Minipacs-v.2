import { prisma } from "@/app/db";
import { recordStudyEventInTx, type ImagingStudyEventType } from "@/lib/studyEvents";

type StudyStatusValue =
  | "ORDERED"
  | "READY_FOR_SCAN"
  | "IN_PROGRESS"
  | "RECEIVED"
  | "STABLE"
  | "NEEDS_QC"
  | "QC_REJECTED"
  | "READY_TO_READ"
  | "READING"
  | "REPORTED"
  | "FINALIZED"
  | "DELIVERED"
  | "ARCHIVED"
  | "DELETED_FROM_PACS"
  | "ERROR";

type ReportStatusValue = "DRAFT" | "PENDING_APPROVAL" | "FINAL";

type StatusSource = "ORTHANC_SYNC" | "REPORT" | "WORKLIST" | "SYSTEM" | "ADMIN";

type OrthancStudy = {
  ID?: string;
  IsStable?: boolean;
  MainDicomTags?: Record<string, string | undefined>;
  PatientMainDicomTags?: Record<string, string | undefined>;
  EnrichedModality?: string;
};

type WorklistStudyInput = {
  studyInstanceUid: string;
  orderId: string;
  accessionNumber: string;
  patientId: string;
  patientName: string;
  modality: string;
  priority?: string;
  stationAeTitle?: string;
  bodyPart?: string;
  studyDescription?: string;
  scheduledAt?: Date;
};

const FINAL_OR_ARCHIVE_STATUSES = new Set<StudyStatusValue>([
  "FINALIZED",
  "DELIVERED",
  "ARCHIVED",
  "DELETED_FROM_PACS",
]);

const MANUAL_REVIEW_STATUSES = new Set<StudyStatusValue>([
  "NEEDS_QC",
  "QC_REJECTED",
  "ERROR",
]);

export function mapReportStatusToStudyStatus(report?: { status?: string | null, cancelledAt?: Date | null } | null): StudyStatusValue | null {
  if (!report) return null;
  if (report.cancelledAt) return null;

  switch (report.status) {
    case "FINAL":
      return "FINALIZED";
    case "PENDING_APPROVAL":
    case "DRAFT":
      return "READING";
    default:
      return null;
  }
}

function parseDicomDateTime(date?: string, time?: string) {
  if (!date || !/^\d{8}$/.test(date)) return null;

  const cleanTime = (time || "000000").replace(/\D/g, "").padEnd(6, "0").slice(0, 6);
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6)) - 1;
  const day = Number(date.slice(6, 8));
  const hour = Number(cleanTime.slice(0, 2));
  const minute = Number(cleanTime.slice(2, 4));
  const second = Number(cleanTime.slice(4, 6));

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

function getInitialOrthancStatus(study: OrthancStudy): StudyStatusValue {
  return study.IsStable === false ? "RECEIVED" : "READY_TO_READ";
}

function metadataRecord(metadata?: unknown) {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {};
}

function cleanText(value?: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveSyncedStatus(
  currentStatus: StudyStatusValue | null | undefined,
  report: { status?: string | null, cancelledAt?: Date | null } | null | undefined,
  study: OrthancStudy
): StudyStatusValue {
  const reportDrivenStatus = mapReportStatusToStudyStatus(report);
  if (reportDrivenStatus) return reportDrivenStatus;

  if (currentStatus && (FINAL_OR_ARCHIVE_STATUSES.has(currentStatus) || MANUAL_REVIEW_STATUSES.has(currentStatus))) {
    return currentStatus;
  }

  if (currentStatus === "READING" || currentStatus === "REPORTED") {
    return currentStatus;
  }

  return getInitialOrthancStatus(study);
}

function buildOrthancSnapshot(study: OrthancStudy) {
  const main = study.MainDicomTags || {};
  const patient = study.PatientMainDicomTags || {};
  const studyInstanceUid = main.StudyInstanceUID;
  const studyDateTime = parseDicomDateTime(main.StudyDate, main.StudyTime);

  return {
    studyInstanceUid,
    orthancStudyId: study.ID || null,
    accessionNumber: main.AccessionNumber || null,
    patientId: patient.PatientID || null,
    patientName: patient.PatientName || null,
    modality: study.EnrichedModality || main.Modality || null,
    bodyPart: main.BodyPartExamined || null,
    studyDescription: main.StudyDescription || null,
    receivedAt: studyDateTime,
    stableAt: study.IsStable === false ? null : studyDateTime,
  };
}

async function writeStatusHistory(params: {
  tx: any;
  imagingStudyId: string;
  fromStatus?: StudyStatusValue | null;
  toStatus: StudyStatusValue;
  source: StatusSource;
  reason?: string;
  actorUserId?: string;
  metadata?: unknown;
}) {
  await params.tx.studyStatusHistory.create({
    data: {
      imagingStudyId: params.imagingStudyId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      source: params.source,
      reason: params.reason,
      actorUserId: params.actorUserId,
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : undefined,
    },
  });

  await recordStudyEventInTx(params.tx, {
    imagingStudyId: params.imagingStudyId,
    eventType: eventTypeForStatusChange(params.source, params.toStatus),
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    source: params.source,
    actorUserId: params.actorUserId,
    metadata: {
      reason: params.reason,
      ...(params.metadata && typeof params.metadata === "object" ? params.metadata as Record<string, unknown> : { metadata: params.metadata }),
    },
  });

  const metadata = metadataRecord(params.metadata);
  const isQcRejected = params.toStatus === "QC_REJECTED";
  const isQcPassed = params.toStatus === "READY_TO_READ" && params.source !== "ORTHANC_SYNC";
  if (isQcRejected || isQcPassed) {
    await params.tx.studyQcEvent.create({
      data: {
        imagingStudyId: params.imagingStudyId,
        status: isQcRejected ? "QC_REJECTED" : "QC_PASSED",
        reasonCode: cleanText(metadata.reasonCode) || cleanText(params.reason) || null,
        note: cleanText(metadata.note) || cleanText(params.reason) || null,
        actorUserId: params.actorUserId,
      },
    });
  }
}

function eventTypeForStatusChange(source: StatusSource, toStatus: StudyStatusValue): ImagingStudyEventType {
  if (source === "WORKLIST" && (toStatus === "ORDERED" || toStatus === "READY_FOR_SCAN")) return "ORDER_CREATED";
  if (source === "ORTHANC_SYNC" && toStatus === "RECEIVED") return "DICOM_RECEIVED";
  if (source === "ORTHANC_SYNC" && (toStatus === "STABLE" || toStatus === "READY_TO_READ")) return "STUDY_STABLE";
  if (source === "REPORT" && (toStatus === "READING" || toStatus === "REPORTED")) return "REPORT_DRAFTED";
  if (source === "REPORT" && toStatus === "FINALIZED") return "REPORT_FINALIZED";
  if (toStatus === "DELIVERED") return "RESULT_DELIVERED";
  if (toStatus === "QC_REJECTED") return "QC_REJECTED";
  if (toStatus === "READY_TO_READ") return "QC_PASSED";
  return "STATUS_CHANGED";
}

export async function setStudyStatus(
  studyInstanceUid: string,
  nextStatus: StudyStatusValue,
  options: {
    source?: StatusSource;
    reason?: string;
    actorUserId?: string;
    assignedDoctorId?: string;
    metadata?: unknown;
  } = {}
) {
  const source = options.source || "SYSTEM";
  if (nextStatus === "QC_REJECTED") {
    const metadata = metadataRecord(options.metadata);
    const reasonCode = cleanText(metadata.reasonCode) || cleanText(options.reason);
    if (!reasonCode) {
      throw new Error("QC reject bat buoc co ly do.");
    }
  }

  return prisma.$transaction(async tx => {
    const existing = await tx.imagingStudy.findUnique({
      where: { studyInstanceUid },
    });

    if (!existing) {
      const created = await tx.imagingStudy.create({
        data: {
          studyInstanceUid,
          status: nextStatus,
          assignedDoctorId: options.assignedDoctorId,
          finalizedAt: nextStatus === "FINALIZED" ? new Date() : undefined,
          deliveredAt: nextStatus === "DELIVERED" ? new Date() : undefined,
          archivedAt: nextStatus === "ARCHIVED" ? new Date() : undefined,
          firstOpenedAt: nextStatus === "READING" ? new Date() : undefined,
        },
      });

      await writeStatusHistory({
        tx,
        imagingStudyId: created.id,
        fromStatus: null,
        toStatus: nextStatus,
        source,
        reason: options.reason || "Initial study workflow status",
        actorUserId: options.actorUserId,
        metadata: options.metadata,
      });

      await tx.report.updateMany({
        where: { studyInstanceUid, imagingStudyId: null },
        data: { imagingStudyId: created.id },
      });

      return created;
    }

    const updated = await tx.imagingStudy.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        ...(options.assignedDoctorId ? { assignedDoctorId: options.assignedDoctorId } : {}),
        finalizedAt: nextStatus === "FINALIZED" && !existing.finalizedAt ? new Date() : existing.finalizedAt,
        deliveredAt: nextStatus === "DELIVERED" && !existing.deliveredAt ? new Date() : existing.deliveredAt,
        archivedAt: nextStatus === "ARCHIVED" && !existing.archivedAt ? new Date() : existing.archivedAt,
        firstOpenedAt: nextStatus === "READING" && !existing.firstOpenedAt ? new Date() : existing.firstOpenedAt,
      },
    });

    if (existing.status !== nextStatus) {
      await writeStatusHistory({
        tx,
        imagingStudyId: updated.id,
        fromStatus: existing.status,
        toStatus: nextStatus,
        source,
        reason: options.reason,
        actorUserId: options.actorUserId,
        metadata: options.metadata,
      });
    }

    await tx.report.updateMany({
      where: { studyInstanceUid, imagingStudyId: null },
      data: { imagingStudyId: updated.id },
    });

    return updated;
  });
}

export async function updateStudyStatusForReport(studyInstanceUid: string, report: { status: ReportStatusValue, cancelledAt: Date | null }) {
  const nextStatus = mapReportStatusToStudyStatus(report);
  if (!nextStatus) return null;

  return setStudyStatus(studyInstanceUid, nextStatus, {
    source: "REPORT",
    reason: `System synced to ${report.status}`,
    metadata: { reportStatus: report.status },
  });
}

export async function claimStudyLock(studyInstanceUid: string, actorUserId: string, options?: { orderId?: string }) {
  return prisma.$transaction(async tx => {
    const existing = await tx.imagingStudy.findUnique({
      where: { studyInstanceUid },
    });

    if (!existing) {
      return { success: false, error: "Study không tồn tại." };
    }

    const createAudit = async () => {
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "STUDY_READING_STARTED",
          entityType: "ImagingStudy",
          entityId: existing.id,
          message: `Started reading study ${studyInstanceUid}`,
          metadataJson: options?.orderId ? JSON.stringify({ orderId: options.orderId }) : null,
        },
      });
    };

    if (existing.status === "READING") {
      if (existing.assignedDoctorId && existing.assignedDoctorId !== actorUserId) {
        return { success: false, error: "Ca này đang được đọc bởi bác sĩ khác." };
      }
      
      if (!existing.assignedDoctorId) {
        const { count } = await tx.imagingStudy.updateMany({
          where: { id: existing.id, status: "READING", assignedDoctorId: null },
          data: { 
            assignedDoctorId: actorUserId,
            firstOpenedAt: existing.firstOpenedAt || new Date()
          },
        });
        if (count === 0) return { success: false, error: "Ca này đã bị khóa bởi người khác." };

        await writeStatusHistory({
          tx,
          imagingStudyId: existing.id,
          fromStatus: "READING",
          toStatus: "READING",
          source: "WORKLIST",
          reason: "Claimed ownership of unassigned reading study",
          actorUserId,
        });
        await createAudit();
      }
      
      return { success: true };
    }

    if (existing.status !== "READY_TO_READ") {
      return { success: false, error: "Chỉ có thể khóa các ca đang ở trạng thái READY_TO_READ." };
    }

    const { count } = await tx.imagingStudy.updateMany({
      where: { 
        id: existing.id, 
        status: "READY_TO_READ",
        OR: [{ assignedDoctorId: null }, { assignedDoctorId: actorUserId }]
      },
      data: {
        status: "READING",
        assignedDoctorId: actorUserId,
        firstOpenedAt: existing.firstOpenedAt || new Date(),
      },
    });

    if (count === 0) {
      if (existing.assignedDoctorId && existing.assignedDoctorId !== actorUserId) {
        return { success: false, error: "Ca này đã được phân công cho bác sĩ khác." };
      }
      return { success: false, error: "Ca này đã bị thay đổi trạng thái hoặc khóa bởi người khác." };
    }

    await writeStatusHistory({
      tx,
      imagingStudyId: existing.id,
      fromStatus: "READY_TO_READ",
      toStatus: "READING",
      source: "WORKLIST",
      reason: "Locked for dictation",
      actorUserId,
    });
    
    await createAudit();
    
    return { success: true };
  });
}

export async function syncOrthancStudyToRis(study: OrthancStudy) {
  const snapshot = buildOrthancSnapshot(study);
  if (!snapshot.studyInstanceUid) return null;

  const [existing, report, order] = await Promise.all([
    prisma.imagingStudy.findUnique({
      where: { studyInstanceUid: snapshot.studyInstanceUid },
    }),
    prisma.report.findUnique({
      where: { studyInstanceUid: snapshot.studyInstanceUid },
    }),
    snapshot.accessionNumber
      ? prisma.worklistOrder.findUnique({
          where: { accessionNumber: snapshot.accessionNumber },
        })
      : Promise.resolve(null),
  ]);

  const nextStatus = resolveSyncedStatus(existing?.status as StudyStatusValue | undefined, report, study);

  const saved = await prisma.$transaction(async tx => {
    if (!existing) {
      const created = await tx.imagingStudy.create({
        data: {
          studyInstanceUid: snapshot.studyInstanceUid!,
          orthancStudyId: snapshot.orthancStudyId,
          accessionNumber: snapshot.accessionNumber,
          patientId: snapshot.patientId,
          patientName: snapshot.patientName,
          modality: snapshot.modality,
          priority: order?.priority,
          stationAeTitle: order?.scheduledStationAeTitle,
          bodyPart: snapshot.bodyPart,
          studyDescription: snapshot.studyDescription,
          status: nextStatus,
          orderId: order?.id,
          receivedAt: snapshot.receivedAt,
          stableAt: snapshot.stableAt,
          finalizedAt: nextStatus === "FINALIZED" ? new Date() : undefined,
        },
      });

      await writeStatusHistory({
        tx,
        imagingStudyId: created.id,
        fromStatus: null,
        toStatus: nextStatus,
        source: "ORTHANC_SYNC",
        reason: "Initial sync from Orthanc",
        metadata: {
          orthancStudyId: snapshot.orthancStudyId,
          accessionNumber: snapshot.accessionNumber,
          reportStatus: report?.status,
        },
      });

      if (report && !report.imagingStudyId) {
        await tx.report.update({
          where: { id: report.id },
          data: { imagingStudyId: created.id },
        });
      }

      return created;
    }

    const updated = await tx.imagingStudy.update({
      where: { id: existing.id },
      data: {
        orthancStudyId: snapshot.orthancStudyId || existing.orthancStudyId,
        accessionNumber: snapshot.accessionNumber || existing.accessionNumber,
        patientId: snapshot.patientId || existing.patientId,
        patientName: snapshot.patientName || existing.patientName,
        modality: snapshot.modality || existing.modality,
        priority: existing.priority || order?.priority,
        stationAeTitle: existing.stationAeTitle || order?.scheduledStationAeTitle,
        bodyPart: snapshot.bodyPart || existing.bodyPart,
        studyDescription: snapshot.studyDescription || existing.studyDescription,
        status: nextStatus,
        orderId: existing.orderId || order?.id,
        receivedAt: existing.receivedAt || snapshot.receivedAt,
        stableAt: existing.stableAt || snapshot.stableAt,
        finalizedAt: nextStatus === "FINALIZED" && !existing.finalizedAt ? new Date() : existing.finalizedAt,
      },
    });

    if (existing.status !== nextStatus) {
      await writeStatusHistory({
        tx,
        imagingStudyId: updated.id,
        fromStatus: existing.status,
        toStatus: nextStatus,
        source: "ORTHANC_SYNC",
        reason: "Synced workflow status from Orthanc/report",
        metadata: {
          orthancStudyId: snapshot.orthancStudyId,
          accessionNumber: snapshot.accessionNumber,
          reportStatus: report?.status,
        },
      });
    }

    if (report && !report.imagingStudyId) {
      await tx.report.update({
        where: { id: report.id },
        data: { imagingStudyId: updated.id },
      });
    }

    return updated;
  });

  return {
    id: saved.id,
    status: saved.status,
    reportStatus: report?.cancelledAt ? "CANCELLED" : (report?.status || null),
    orderStatus: order?.orderStatus || null,
    hisSyncStatus: saved.hisSyncStatus || order?.hisSyncStatus || null,
    hisResultStatus: saved.hisResultStatus || report?.hisResultStatus || null,
    clinicalInfo: saved.clinicalInfo,
    procedureCode: saved.procedureCode,
    procedureDescription: saved.procedureDescription,
    technologistId: saved.technologistId,
    bodyPart: saved.bodyPart,
  };
}

export async function upsertWorklistStudy(input: WorklistStudyInput) {
  const existing = await prisma.imagingStudy.findUnique({
    where: { studyInstanceUid: input.studyInstanceUid },
  });
  const nextStatus: StudyStatusValue =
    existing && existing.status !== "ORDERED" && existing.status !== "READY_FOR_SCAN"
      ? (existing.status as StudyStatusValue)
      : "READY_FOR_SCAN";

  const saved = await prisma.$transaction(async tx => {
    if (!existing) {
      const created = await tx.imagingStudy.create({
        data: {
          studyInstanceUid: input.studyInstanceUid,
          accessionNumber: input.accessionNumber,
          patientId: input.patientId,
          patientName: input.patientName,
          modality: input.modality,
          priority: input.priority,
          stationAeTitle: input.stationAeTitle,
          bodyPart: input.bodyPart,
          studyDescription: input.studyDescription,
          orderId: input.orderId,
          scheduledAt: input.scheduledAt,
          status: nextStatus,
        },
      });

      await writeStatusHistory({
        tx,
        imagingStudyId: created.id,
        fromStatus: null,
        toStatus: nextStatus,
        source: "WORKLIST",
        reason: "Worklist order created",
        metadata: {
          accessionNumber: input.accessionNumber,
          orderId: input.orderId,
        },
      });

      return created;
    }

    const updated = await tx.imagingStudy.update({
      where: { id: existing.id },
      data: {
        accessionNumber: input.accessionNumber || existing.accessionNumber,
        patientId: input.patientId || existing.patientId,
        patientName: input.patientName || existing.patientName,
        modality: input.modality || existing.modality,
        priority: input.priority || existing.priority,
        stationAeTitle: input.stationAeTitle || existing.stationAeTitle,
        bodyPart: input.bodyPart || existing.bodyPart,
        studyDescription: input.studyDescription || existing.studyDescription,
        orderId: existing.orderId || input.orderId,
        scheduledAt: existing.scheduledAt || input.scheduledAt,
        status: nextStatus,
      },
    });

    if (existing.status !== nextStatus) {
      await writeStatusHistory({
        tx,
        imagingStudyId: updated.id,
        fromStatus: existing.status,
        toStatus: nextStatus,
        source: "WORKLIST",
        reason: "Worklist order refreshed",
        metadata: {
          accessionNumber: input.accessionNumber,
          orderId: input.orderId,
        },
      });
    }

    return updated;
  });

  return saved;
}
