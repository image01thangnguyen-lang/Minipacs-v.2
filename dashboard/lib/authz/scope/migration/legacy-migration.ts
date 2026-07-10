import { prisma } from "../../../../app/db";
import { getPermissionsForRole } from "../../../permissions";
import { ScopeCapability, CAPABILITY_TO_GLOBAL_PERMISSION } from "../capability-registry";

// Maps MachineActionKey to ScopeCapability
const LEGACY_TO_CAPABILITY: Record<string, ScopeCapability> = {
  READ_STUDY: "READ_STUDY",
  EDIT_CLINICAL: "EDIT_CLINICAL",
  ASSIGN_CASE: "ASSIGN_CASE",
  DRAFT_REPORT: "DRAFT_REPORT",
  SIGN_REPORT: "SIGN_REPORT",
  APPROVE_REPORT: "APPROVE_REPORT",
  UNFINALIZE_REPORT: "UNFINALIZE_REPORT",
  CANCEL_DRAFT: "CANCEL_DRAFT",
  DELIVER_RESULT: "DELIVER_RESULT",
  SYNC_HIS: "SYNC_HIS",
};

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function capabilitiesForPermissions(permissions: readonly string[]): ScopeCapability[] {
  const permissionSet = new Set(permissions);
  return (Object.entries(CAPABILITY_TO_GLOBAL_PERMISSION) as Array<[ScopeCapability, string]>)
    .filter(([, permission]) => permissionSet.has(permission))
    .map(([capability]) => capability);
}

/**
 * Migrates existing DoctorMachinePermission records into AccessScopeGrants.
 * Safe to run multiple times (idempotent).
 */
export async function migrateLegacyPermissionsToGrants() {
  const legacyPerms = await prisma.doctorMachinePermission.findMany();

  const existingGrants = await prisma.accessScopeGrant.findMany({
    where: { dicomNodeId: { not: null } },
    select: { userId: true, dicomNodeId: true, capability: true, effect: true },
  });

  const existingSet = new Set(
    existingGrants.map((g) => `${g.userId}:${g.dicomNodeId}:${g.capability}`),
  );

  let migratedCount = 0;
  let skippedCount = 0;

  for (const perm of legacyPerms) {
    const capability = LEGACY_TO_CAPABILITY[perm.actionKey];
    if (!capability) {
      skippedCount++;
      continue;
    }

    const key = `${perm.doctorId}:${perm.dicomNodeId}:${capability}`;
    if (existingSet.has(key)) {
      skippedCount++;
      continue;
    }

    try {
      await prisma.accessScopeGrant.create({
        data: {
          userId: perm.doctorId,
          dicomNodeId: perm.dicomNodeId,
          capability,
          effect: perm.allow ? "ALLOW" : "DENY",
          includeDescendants: false,
        },
      });
      migratedCount++;
      existingSet.add(key);
    } catch (error) {
      // A concurrent migration runner may have inserted the same partial-unique row.
      if (!isUniqueConstraintError(error)) throw error;
      skippedCount++;
      existingSet.add(key);
    }
  }

  return { migratedCount, skippedCount };
}

/**
 * Creates global root grants for users and roles based on their global permissions.
 * These grants have facilityUnitId = null and dicomNodeId = null.
 */
export async function createRootCompatibilityGrants() {
  const roles = await prisma.appRoleProfile.findMany({
    where: { isActive: true },
  });

  const existingRoleGrants = await prisma.accessScopeGrant.findMany({
    where: { facilityUnitId: null, dicomNodeId: null, roleProfileId: { not: null } },
  });
  const existingRoleSet = new Set(
    existingRoleGrants.map((g) => `${g.roleProfileId}:${g.capability}`),
  );

  let rolesMigrated = 0;
  for (const role of roles) {
    const permissions = getPermissionsForRole(role.baseRole, role.permissions);
    for (const capability of capabilitiesForPermissions(permissions)) {
      const key = `${role.id}:${capability}`;
      if (!existingRoleSet.has(key)) {
        try {
          await prisma.accessScopeGrant.create({
            data: {
              roleProfileId: role.id,
              capability,
              effect: "ALLOW",
              includeDescendants: true,
            },
          });
          existingRoleSet.add(key);
          rolesMigrated++;
        } catch (error) {
          if (!isUniqueConstraintError(error)) throw error;
          existingRoleSet.add(key);
        }
      }
    }
  }

  // Direct user grants preserve the exact current authorization baseline even for
  // users without a profile, with an inactive profile, or with a profile changed later.
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: { roleProfile: true },
  });

  const existingUserGrants = await prisma.accessScopeGrant.findMany({
    where: { facilityUnitId: null, dicomNodeId: null, userId: { not: null } },
  });
  const existingUserSet = new Set(
    existingUserGrants.map((g) => `${g.userId}:${g.capability}`),
  );

  let usersMigrated = 0;
  for (const user of users) {
    const activeProfile = user.roleProfile?.isActive ? user.roleProfile : null;
    const permissions = getPermissionsForRole(user.role, activeProfile?.permissions);
    for (const capability of capabilitiesForPermissions(permissions)) {
      const key = `${user.id}:${capability}`;
      if (!existingUserSet.has(key)) {
        try {
          await prisma.accessScopeGrant.create({
            data: {
              userId: user.id,
              capability,
              effect: "ALLOW",
              includeDescendants: true,
            },
          });
          existingUserSet.add(key);
          usersMigrated++;
        } catch (error) {
          if (!isUniqueConstraintError(error)) throw error;
          existingUserSet.add(key);
        }
      }
    }
  }

  return { rolesMigrated, usersMigrated };
}
