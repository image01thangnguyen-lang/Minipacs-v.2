import { prisma } from "@/app/db";

export async function createCriticalResultWithAudit(input: {
  studyId: string;
  finding: string;
  severity: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const study = await tx.imagingStudy.findUnique({
      where: { id: input.studyId },
      select: {
        id: true,
        studyInstanceUid: true,
        reports: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { id: true },
        },
      },
    });
    if (!study) throw new Error("Khong tim thay study de ghi critical result.");

    const result = await tx.criticalResult.create({
      data: {
        imagingStudyId: study.id,
        reportId: study.reports[0]?.id,
        createdByUserId: input.actorUserId,
        severity: input.severity,
        finding: input.finding,
        communicationStatus: "PENDING",
        status: "PENDING_ACK",
        message: input.finding,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "CRITICAL_RESULT_CREATED",
        entityType: "CriticalResult",
        entityId: result.id,
        message: "Created critical result for " + study.studyInstanceUid,
        metadataJson: JSON.stringify({ severity: result.severity }),
      },
    });

    return result;
  });
}

export async function acknowledgeCriticalResultWithAudit(input: {
  resultId: string;
  recipientName: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.criticalResult.findUnique({
      where: { id: input.resultId },
      select: { id: true, status: true, communicationStatus: true },
    });
    if (!existing) throw new Error("Khong tim thay critical result.");

    if (
      existing.status === "ACKNOWLEDGED" ||
      existing.communicationStatus === "COMMUNICATED"
    ) {
      return tx.criticalResult.findUniqueOrThrow({ where: { id: input.resultId } });
    }
    if (existing.status && !["PENDING_ACK", "ESCALATED"].includes(existing.status)) {
      throw new Error("Trang thai critical result khong cho phep xac nhan.");
    }

    const now = new Date();
    const result = await tx.criticalResult.update({
      where: { id: input.resultId },
      data: {
        communicationStatus: "COMMUNICATED",
        communicatedTo: input.recipientName,
        communicatedAt: now,
        communicatedByUserId: input.actorUserId,
        status: "ACKNOWLEDGED",
        recipientName: input.recipientName,
        acknowledgedAt: now,
        acknowledgedByUserId: input.actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "CRITICAL_RESULT_ACKNOWLEDGED",
        entityType: "CriticalResult",
        entityId: result.id,
        message: "Acknowledged critical result by " + input.recipientName,
        metadataJson: JSON.stringify({
          previousStatus: existing.status,
          previousCommunicationStatus: existing.communicationStatus,
        }),
      },
    });

    return result;
  });
}