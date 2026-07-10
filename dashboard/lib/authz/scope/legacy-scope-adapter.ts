import type { ScopePrincipal, ResolvedResourceContext, GrantEvaluationResult, ScopeTraceEntry } from "./scope-decision";
import type { ScopeCapability } from "./capability-registry";
import type { MachineActionKey } from "../machine-action-keys";
import { MACHINE_ACTION_KEYS } from "../machine-action-keys";
import type { ScopeRequestContext } from "./scope-request-context";

// ─── Types ─────────────────────────────────────────────────────────────────────

type LegacyPermRow = {
  id: string;
  doctorId: string;
  dicomNodeId: string;
  actionKey: string;
  allow: boolean;
};

export type LegacyAdapterDeps = {
  findLegacyPermissions: (userId: string, actionKey: string) => Promise<LegacyPermRow[]>;
};

// ─── Capability → legacy action key mapping ────────────────────────────────────

/**
 * Maps scope capabilities to their legacy machine action key equivalents.
 * Only capabilities that have a direct legacy counterpart are included.
 * Non-DICOM capabilities have no legacy equivalent.
 */
const CAPABILITY_TO_LEGACY_ACTION: Partial<Record<ScopeCapability, MachineActionKey>> = {
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

/**
 * Evaluates legacy DoctorMachinePermission records as a supplementary
 * authorization source.
 *
 * Key rules:
 * - No row = NO OPINION (not a deny). Returns hasMatchingOpinion=false.
 * - allow=true  → explicit ALLOW for that machine
 * - allow=false → explicit DENY for that machine
 * - Only used when the resource has a resolved dicomNodeId
 * - Only capabilities with a legacy mapping are checked
 * - DENY still wins over ALLOW
 */
export async function evaluateLegacyPermissions(
  principal: ScopePrincipal,
  capability: ScopeCapability,
  resourceCtx: ResolvedResourceContext,
  deps: LegacyAdapterDeps,
  ctx?: ScopeRequestContext
): Promise<GrantEvaluationResult> {
  const legacyAction = CAPABILITY_TO_LEGACY_ACTION[capability];

  // No legacy mapping for this capability — no opinion
  if (!legacyAction) {
    return { allowed: false, hasMatchingOpinion: false, hasConfiguredGrant: false, traces: [] };
  }

  // No resolved dicomNodeId — cannot check legacy permissions
  if (!resourceCtx.dicomNodeId) {
    return { allowed: false, hasMatchingOpinion: false, hasConfiguredGrant: false, traces: [] };
  }

  // Load legacy permissions
  const cacheKey = `legacy:${principal.userId}:${legacyAction}`;
  let perms: LegacyPermRow[];
  if (ctx) {
    const cached = ctx.getLegacyPerms(cacheKey);
    if (cached) {
      perms = cached;
    } else {
      perms = await deps.findLegacyPermissions(principal.userId, legacyAction);
      ctx.setLegacyPerms(cacheKey, perms);
    }
  } else {
    perms = await deps.findLegacyPermissions(principal.userId, legacyAction);
  }

  // Find the permission for the specific dicomNode
  const matchingPerm = perms.find(p => p.dicomNodeId === resourceCtx.dicomNodeId);

  if (!matchingPerm) {
    // No row for this machine = NO OPINION, not DENY
    return { allowed: false, hasMatchingOpinion: false, hasConfiguredGrant: false, traces: [] };
  }

  const trace: ScopeTraceEntry = {
    grantId: matchingPerm.id,
    source: "LEGACY",
    effect: matchingPerm.allow ? "ALLOW" : "DENY",
    facilityUnitId: null,
    dicomNodeId: matchingPerm.dicomNodeId,
    matchType: "LEGACY_MACHINE",
    capability,
  };

  return {
    allowed: matchingPerm.allow,
    hasMatchingOpinion: true,
    hasConfiguredGrant: true,
    traces: [trace],
  };
}
