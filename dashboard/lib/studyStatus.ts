import { prisma } from "@/app/db";

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

type ReportStatusValue = "DRAFT" | "FINAL" | "UNREAD" | "DRAFTING" | "COMPLETED";

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

export function mapReportStatusToStudyStatus(status?: string | null): StudyStatusValue | null {
  switch (status) {
    case "COMPLETED":
    case "FINAL":
      return "FINALIZED";
    case "DRAFTING":
    case "DRAFT":
      return "READING";
    case "UNREAD":
      return "READY_TO_READ";
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

function resolveSyncedStatus(
  currentStatus: StudyStatusValue | null | undefined,
  reportStatus: string | null | undefined,
  study: OrthancStudy
): StudyStatusValue {
  const reportDrivenStatus = mapReportStatusToStudyStatus(reportStatus);
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
}

export async function setStudyStatus(
  studyInstanceUid: string,
  nextStatus: StudyStatusValue,
  options: {
    source?: StatusSource;
    reason?: string;
    actorUserId?: string;
    metadata?: unknown;
  } = {}
) {
  const source = options.source || "SYSTEM";

  return prisma.$transaction(async tx => {
    const existing = await tx.imagingStudy.findUnique({
      where: { studyInstanceUid },
    });

    if (!existing) {
      const created = await tx.imagingStudy.create({
        data: {
          studyInstanceUid,
          status: nextStatus,
          finalizedAt: nextStatus === "FINALIZED" ? new Date() : undefined,
          deliveredAt: nextStatus === "DELIVERED" ? new Date() : undefined,
          archivedAt: nextStatus === "ARCHIVED" ? new Date() : undefined,
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
        finalizedAt: nextStatus === "FINALIZED" && !existing.finalizedAt ? new Date() : existing.finalizedAt,
        deliveredAt: nextStatus === "DELIVERED" && !existing.deliveredAt ? new Date() : existing.deliveredAt,
        archivedAt: nextStatus === "ARCHIVED" && !existing.archivedAt ? new Date() : existing.archivedAt,
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

export async function updateStudyStatusForReport(studyInstanceUid: string, reportStatus: ReportStatusValue) {
  const nextStatus = mapReportStatusToStudyStatus(reportStatus);
  if (!nextStatus) return null;

  return setStudyStatus(studyInstanceUid, nextStatus, {
    source: "REPORT",
    reason: `Report status changed to ${reportStatus}`,
    metadata: { reportStatus },
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

  const nextStatus = resolveSyncedStatus(existing?.status as StudyStatusValue | undefined, report?.status, study);

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
    reportStatus: report?.status || "UNREAD",
    orderStatus: order?.orderStatus || null,
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
