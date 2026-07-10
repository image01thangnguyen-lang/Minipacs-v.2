import type { Prisma } from "@prisma/client";
import type { MachineActionKey } from "../../machine-action-keys";

export type MatrixPermissionUpdate = {
  dicomNodeId: string;
  actionKey: MachineActionKey;
  state: "ALLOW" | "DENY" | "DEFAULT";
};

export async function dualWriteMachinePermission(
  tx: Prisma.TransactionClient,
  doctorId: string,
  actorUserId: string,
  update: MatrixPermissionUpdate,
): Promise<{ upserted: number; deleted: number }> {
  const grantWhere = {
    userId: doctorId,
    dicomNodeId: update.dicomNodeId,
    capability: update.actionKey,
  };

  if (update.state === "DEFAULT") {
    const legacyDelete = await tx.doctorMachinePermission.deleteMany({
      where: { doctorId, dicomNodeId: update.dicomNodeId, actionKey: update.actionKey },
    });
    await tx.accessScopeGrant.deleteMany({ where: grantWhere });
    return { upserted: 0, deleted: legacyDelete.count };
  }

  await tx.doctorMachinePermission.upsert({
    where: {
      doctorId_dicomNodeId_actionKey: {
        doctorId,
        dicomNodeId: update.dicomNodeId,
        actionKey: update.actionKey,
      },
    },
    update: { allow: update.state === "ALLOW", updatedByUserId: actorUserId },
    create: {
      doctorId,
      dicomNodeId: update.dicomNodeId,
      actionKey: update.actionKey,
      allow: update.state === "ALLOW",
      updatedByUserId: actorUserId,
    },
  });

  const updated = await tx.accessScopeGrant.updateMany({
    where: grantWhere,
    data: { effect: update.state, includeDescendants: false, updatedByUserId: actorUserId },
  });
  if (updated.count === 0) {
    await tx.accessScopeGrant.create({
      data: {
        ...grantWhere,
        effect: update.state,
        includeDescendants: false,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
  }

  return { upserted: 1, deleted: 0 };
}