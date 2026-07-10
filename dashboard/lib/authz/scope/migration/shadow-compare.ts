import { prisma } from "../../../../app/db";
export type DriftReport = {
  userId: string;
  missingGrants: string[];
  extraGrants: string[];
  effectMismatches: string[];
  inactiveNodeReferences: string[];
  duplicates: string[];
};

const LEGACY_TO_CAPABILITY: Record<string, string> = {
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

const LEGACY_CAPABILITIES = Object.values(LEGACY_TO_CAPABILITY);

/**
 * Compares DoctorMachinePermission and AccessScopeGrant for a given user.
 * Does not mutate any data.
 */
export async function generateDriftReport(userId: string): Promise<DriftReport> {
  const report: DriftReport = {
    userId,
    missingGrants: [],
    extraGrants: [],
    effectMismatches: [],
    inactiveNodeReferences: [],
    duplicates: [],
  };

  const legacyPerms = await prisma.doctorMachinePermission.findMany({
    where: { doctorId: userId },
    include: { dicomNode: true },
  });

  const grants = await prisma.accessScopeGrant.findMany({
    where: {
      userId,
      dicomNodeId: { not: null },
      capability: { in: LEGACY_CAPABILITIES },
    },
    include: { dicomNode: true },
  });

  const grantMap = new Map<string, typeof grants[0]>();
  const grantKeys = new Set<string>();

  for (const g of grants) {
    if (!g.dicomNode || !g.dicomNode.isActive) {
      report.inactiveNodeReferences.push(`Grant ${g.id} points to inactive/missing node ${g.dicomNodeId}`);
    }

    const key = `${g.dicomNodeId}:${g.capability}`;
    if (grantKeys.has(key)) {
      report.duplicates.push(`Duplicate grant for node ${g.dicomNodeId}, capability ${g.capability}`);
    } else {
      grantKeys.add(key);
      grantMap.set(key, g);
    }
  }

  const legacyKeys = new Set<string>();

  for (const perm of legacyPerms) {
    if (!perm.dicomNode || !perm.dicomNode.isActive) {
      report.inactiveNodeReferences.push(`Legacy perm points to inactive/missing node ${perm.dicomNodeId}`);
      continue;
    }

    const capability = LEGACY_TO_CAPABILITY[perm.actionKey];
    if (!capability) continue;

    const key = `${perm.dicomNodeId}:${capability}`;
    legacyKeys.add(key);

    const correspondingGrant = grantMap.get(key);
    if (!correspondingGrant) {
      report.missingGrants.push(`Missing grant for node ${perm.dicomNodeId}, capability ${capability}`);
    } else {
      const legacyEffect = perm.allow ? "ALLOW" : "DENY";
      if (correspondingGrant.effect !== legacyEffect) {
        report.effectMismatches.push(`Mismatch for node ${perm.dicomNodeId}, capability ${capability}: legacy=${legacyEffect}, grant=${correspondingGrant.effect}`);
      }
    }
  }

  grantKeys.forEach((key) => {
    if (!legacyKeys.has(key)) {
      report.extraGrants.push(`Extra grant found for ${key} that has no legacy equivalent`);
    }
  });

  return report;
}
