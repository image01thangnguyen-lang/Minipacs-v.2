"use server";

import { revalidatePath } from "next/cache";
import { getUserPermissionsAction } from "../actions";
import { syncOrderFromHis, sendReportToHis } from "../../lib/his/hisSyncService";
import { prisma } from "@/app/db";
import { canPerformMachineAction, resolveDicomNodeIdByAETitle } from "@/lib/authz/machine-permissions";
import { auth } from "@/auth";

export async function checkHisMatrixPerm(studyInstanceUid: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  let aeTitle = null;
  const study = await prisma.imagingStudy.findUnique({ where: { studyInstanceUid } });
  if (study) aeTitle = study.stationAeTitle;

  const dicomNodeId = await resolveDicomNodeIdByAETitle(aeTitle);
  return await canPerformMachineAction(session.user as any, dicomNodeId, "SYNC_HIS");
}

export async function updateOrderFromHisAction(accessionNumber: string) {
  const { permissions, userId } = await getUserPermissionsAction();
  if (!permissions.includes("his.sync")) {
    return { success: false, error: "Access Denied: Missing his.sync permission" };
  }

  const result = await syncOrderFromHis(accessionNumber, userId);
  if (result.success) {
    revalidatePath("/worklist");
    revalidatePath("/");
  }
  return result;
}

export async function sendReportToHisAction(studyInstanceUid: string) {
  const { permissions, userId } = await getUserPermissionsAction();
  if (!permissions.includes("his.sync")) {
    return { success: false, error: "Access Denied: Missing his.sync permission" };
  }
  const matrixAllowed = await checkHisMatrixPerm(studyInstanceUid);
  if (!matrixAllowed) {
    return { success: false, error: "Access Denied by Machine Permission Matrix" };
  }

  const result = await sendReportToHis(studyInstanceUid, userId);
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
    const result = await syncOrderFromHis(log.accessionNumber, userId);
    if (result.success) {
      revalidatePath("/worklist");
      revalidatePath("/");
    }
    return result;
  } else if (log.action === "SEND_RESULT" && log.studyInstanceUid) {
    const matrixAllowed = await checkHisMatrixPerm(log.studyInstanceUid);
    if (!matrixAllowed) return { success: false, error: "Access Denied by Machine Permission Matrix" };

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
