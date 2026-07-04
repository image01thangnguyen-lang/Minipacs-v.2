import { prisma } from "@/app/db";

export async function detectHisConflict(entityType: string, entityId: string | null, accessionNumber: string | null, studyInstanceUid: string | null, fieldName: string, currentValue: any, incomingValue: any) {
  // Simple check
  if (currentValue === incomingValue) return false;
  if (!currentValue && incomingValue) return false; // Not a conflict if current is empty

  // If different, create a conflict record
  await prisma.hisConflict.create({
    data: {
      entityType,
      entityId,
      accessionNumber,
      studyInstanceUid,
      fieldName,
      currentValue: String(currentValue),
      incomingValue: String(incomingValue),
      status: "OPEN",
    }
  });

  return true;
}

export async function resolveConflict(conflictId: string, resolution: "ACCEPTED" | "IGNORED" | "MERGED", userId: string, note?: string) {
  const conflict = await prisma.hisConflict.findUnique({ where: { id: conflictId } });
  if (!conflict) throw new Error("Conflict not found");

  if (resolution === "ACCEPTED" && conflict.entityId && conflict.incomingValue !== null) {
    if (conflict.entityType === "WorklistOrder") {
      await prisma.worklistOrder.update({
        where: { id: conflict.entityId },
        data: { [conflict.fieldName]: conflict.incomingValue }
      });
    } else if (conflict.entityType === "ImagingStudy") {
      await prisma.imagingStudy.update({
        where: { id: conflict.entityId },
        data: { [conflict.fieldName]: conflict.incomingValue }
      });
    }
  }

  return await prisma.hisConflict.update({
    where: { id: conflictId },
    data: {
      status: resolution,
      resolvedByUserId: userId,
      resolvedAt: new Date(),
      resolutionNote: note
    }
  });
}
