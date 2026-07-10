"use server";

import { revalidatePath } from "next/cache";
import { getUserPermissionsAction } from "../actions";
import { syncOrderFromHis, sendReportToHis } from "../../lib/his/hisSyncService";
import { prisma } from "@/app/db";
import { auth } from "@/auth";
import { requireScopedStudyMutation } from "@/lib/authz/scope/require-scoped-access";

// Check if user has scope for an existing study
async function checkStudyScopeSafe(userId: string, studyInstanceUid: string, capability: "SYNC_HIS" | "READ_STUDY"): Promise<boolean> {
  try {
    await requireScopedStudyMutation({ userId, studyInstanceUid, capability });
    return true;
  } catch {
    return false;
  }
}

export async function updateOrderFromHisAction(accessionNumber: string) {
  const { permissions, userId } = await getUserPermissionsAction();
  if (!permissions.includes("his.sync")) {
    return { success: false, error: "Access Denied: Missing his.sync permission" };
  }

  // Trust boundary exception: updateOrderFromHisAction imports data.
  // If order/study already exists locally, check scope.
  const existingOrder = await prisma.worklistOrder.findUnique({
    where: { accessionNumber },
    include: { imagingStudies: true }
  });

  if (existingOrder && existingOrder.imagingStudies.length > 0) {
    const studyInstanceUid = existingOrder.imagingStudies[0].studyInstanceUid;
    const allowed = await checkStudyScopeSafe(userId, studyInstanceUid, "READ_STUDY");
    if (!allowed) {
      return { success: false, error: "Access Denied: Study exists but is outside your permitted scope" };
    }
  }

  const result = await syncOrderFromHis(accessionNumber, userId);
  if (result.success) {
    revalidatePath("/worklist");
    revalidatePath("/");
  }
  return result;
}

export async function sendReportToHisAction(studyInstanceUid: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await requireScopedStudyMutation({
      userId: session.user.id,
      studyInstanceUid,
      capability: "SYNC_HIS",
    });
  } catch (err: any) {
    return { success: false, error: err.message || "Access Denied" };
  }

  const result = await sendReportToHis(studyInstanceUid, session.user.id);
  if (result.success) {
    revalidatePath("/");
    revalidatePath(`/report/${studyInstanceUid}`);
    revalidatePath("/archive");
  }
  return result;
}

export async function retryHisSyncAction(syncLogId: string) {
  const { permissions, userId } = await getUserPermissionsAction();
  if (!permissions.includes("his.retry")) {
    return { success: false, error: "Access Denied: Missing his.retry permission" };
  }

  const log = await prisma.hisSyncLog.findUnique({ where: { id: syncLogId } });
  if (!log) {
    return { success: false, error: "Sync log not found" };
  }

  if (log.action === "UPDATE_ORDER" && log.accessionNumber) {
    const existingOrder = await prisma.worklistOrder.findUnique({
      where: { accessionNumber: log.accessionNumber },
      include: { imagingStudies: true }
    });

    if (existingOrder && existingOrder.imagingStudies.length > 0) {
      const allowed = await checkStudyScopeSafe(userId, existingOrder.imagingStudies[0].studyInstanceUid, "READ_STUDY");
      if (!allowed) {
        return { success: false, error: "Access Denied: Study is outside your permitted scope" };
      }
    }

    const result = await syncOrderFromHis(log.accessionNumber, userId);
    if (result.success) {
      revalidatePath("/worklist");
      revalidatePath("/");
    }
    return result;
  } else if (log.action === "SEND_RESULT" && log.studyInstanceUid) {
    const allowed = await checkStudyScopeSafe(userId, log.studyInstanceUid, "SYNC_HIS");
    if (!allowed) return { success: false, error: "Access Denied: Study is outside your permitted scope" };

    const result = await sendReportToHis(log.studyInstanceUid, userId);
    if (result.success) {
      revalidatePath("/");
      revalidatePath(`/report/${log.studyInstanceUid}`);
      revalidatePath("/archive");
    }
    return result;
  }

  return { success: false, error: "Unsupported retry action" };
}

export async function getHisSyncLogsAction(entityId?: string) {
  const { permissions } = await getUserPermissionsAction();
  if (!permissions.includes("his.read")) {
    throw new Error("Access Denied: Missing his.read permission");
  }

  const logs = await prisma.hisSyncLog.findMany({
    where: entityId ? {
      OR: [
        { entityId },
        { accessionNumber: entityId },
        { studyInstanceUid: entityId },
        { hisOrderId: entityId }
      ]
    } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return logs;
}
