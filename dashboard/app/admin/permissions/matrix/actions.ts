"use server";

import { prisma } from "../../../db";
import { requirePermission } from "../../../../lib/authz";
import { MACHINE_ACTION_KEYS, MachineActionKey } from "../../../../lib/authz/machine-permissions";
import { dualWriteMachinePermission } from "../../../../lib/authz/scope/migration/matrix-dual-write";

export async function getDoctorsAndNodesAction() {
  await requirePermission("admin.permissions");
  const [doctors, nodes] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["DOCTOR", "ADMIN"] },
      },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, role: true }
    }),
    prisma.dicomNode.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, modality: true, isNonDicom: true }
    })
  ]);
  return { doctors, nodes };
}

export async function getMatrixAction(doctorId: string) {
  await requirePermission("admin.permissions");
  const permissions = await prisma.doctorMachinePermission.findMany({
    where: { doctorId }
  });
  return permissions;
}

export type PermissionUpdate = {
  dicomNodeId: string;
  actionKey: MachineActionKey;
  state: "ALLOW" | "DENY" | "DEFAULT";
};

export async function saveMatrixAction(doctorId: string, updates: PermissionUpdate[]) {
  const actor = await requirePermission("admin.permissions");
  
  // Validate doctor exists, active, and is a role that can have machine permissions
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId, isActive: true }
  });
  if (!doctor) {
    return { success: false, error: "Người dùng không tồn tại hoặc đã bị vô hiệu hóa." };
  }
  if (!["DOCTOR", "ADMIN", "TECHNICIAN"].includes(doctor.role)) {
    return { success: false, error: `Vai trò "${doctor.role}" không hỗ trợ phân quyền theo thiết bị.` };
  }

  // Validate each update
  const validActionKeys = new Set<string>(MACHINE_ACTION_KEYS);
  const validStates = new Set(["ALLOW", "DENY", "DEFAULT"]);

  // Collect all referenced dicomNodeIds and validate they exist + active
  const nodeIds = Array.from(new Set(updates.map(u => u.dicomNodeId)));
  const activeNodes = await prisma.dicomNode.findMany({
    where: { id: { in: nodeIds }, isActive: true },
    select: { id: true },
  });
  const activeNodeIds = new Set(activeNodes.map(n => n.id));

  for (const update of updates) {
    if (!validActionKeys.has(update.actionKey)) {
      return { success: false, error: `Action key không hợp lệ: ${update.actionKey}` };
    }
    if (!validStates.has(update.state)) {
      return { success: false, error: `Trạng thái không hợp lệ: ${update.state}. Chỉ chấp nhận ALLOW, DENY, DEFAULT.` };
    }
    if (!activeNodeIds.has(update.dicomNodeId)) {
      return { success: false, error: `Thiết bị với ID "${update.dicomNodeId}" không tồn tại hoặc đã bị vô hiệu hóa.` };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      let upsertCount = 0;
      let deleteCount = 0;

      for (const update of updates) {
        const result = await dualWriteMachinePermission(tx, doctorId, actor.id, update);
        upsertCount += result.upserted;
        deleteCount += result.deleted;
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: "UPDATE_MACHINE_PERMISSIONS",
          entityType: "User",
          entityId: doctorId,
          message: `Đã cập nhật ma trận phân quyền cho BS ${doctor.fullName} (${upsertCount} thêm/sửa, ${deleteCount} xóa/reset).`,
        }
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("saveMatrixAction error:", error);
    return { success: false, error: error.message || "Lỗi hệ thống khi lưu phân quyền." };
  }
}
