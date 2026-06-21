import { prisma } from "@/app/db";

export type ImagingStudyEventType =
  | "ORDER_CREATED"
  | "ORDER_CANCELLED"
  | "WORKLIST_REGENERATED"
  | "PATIENT_CHECKED_IN"
  | "SCAN_STARTED"
  | "SCAN_ENDED"
  | "DICOM_RECEIVED"
  | "STUDY_STABLE"
  | "QC_PASSED"
  | "QC_REJECTED"
  | "REPORT_OPENED"
  | "REPORT_DRAFTED"
  | "REPORT_FINALIZED"
  | "RESULT_DELIVERED"
  | "ASSIGNED_DOCTOR_CHANGED"
  | "STATUS_CHANGED"
  | "SYNCED_FROM_ORTHANC";

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

export type StudyEventInput = {
  imagingStudyId: string;
  eventType: ImagingStudyEventType | string;
  fromStatus?: StudyStatusValue | null;
  toStatus?: StudyStatusValue | null;
  actorUserId?: string | null;
  source?: string;
  metadata?: unknown;
  createdAt?: Date;
};

function serializeMetadata(metadata?: unknown) {
  if (metadata === undefined || metadata === null) return undefined;
  return JSON.stringify(metadata);
}

export function recordStudyEventInTx(tx: any, input: StudyEventInput) {
  return tx.imagingStudyEvent.create({
    data: {
      imagingStudyId: input.imagingStudyId,
      eventType: input.eventType,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      actorUserId: input.actorUserId || undefined,
      source: input.source || "SYSTEM",
      metadataJson: serializeMetadata(input.metadata),
      createdAt: input.createdAt,
    },
  });
}

export function recordStudyEvent(input: StudyEventInput) {
  return recordStudyEventInTx(prisma, input);
}

export async function getStudyTimeline(imagingStudyId: string) {
  return prisma.imagingStudyEvent.findMany({
    where: { imagingStudyId },
    orderBy: { createdAt: "asc" },
  });
}
