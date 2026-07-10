import type { ScopeDecision, ResourceContextInput, ResolvedResourceContext, ScopeTraceEntry, ScopePrincipal } from "./scope-decision";
import type { ScopeCapability } from "./capability-registry";
import { CAPABILITY_TO_GLOBAL_PERMISSION } from "./capability-registry";
import { getAuthorizationMode, type AuthorizationMode } from "./authorization-mode";
import { ScopeRequestContext } from "./scope-request-context";
import { loadPrincipal, type PrincipalLoaderDeps } from "./principal-loader";
import { resolveResourceContext, type ResourceContextDeps } from "./resource-context";
import { evaluateGrants, type GrantRepositoryDeps } from "./grant-repository";
import { evaluateLegacyPermissions, type LegacyAdapterDeps } from "./legacy-scope-adapter";
import { loadOrganizationTree } from "./organization-tree-loader";
import type { OrganizationTree } from "./organization-tree";

// ─── Combined dependencies ────────────────────────────────────────────────────

export type ScopeResolverDeps = PrincipalLoaderDeps & ResourceContextDeps & GrantRepositoryDeps & LegacyAdapterDeps;

// ─── Main resolver ────────────────────────────────────────────────────────────

/**
 * The single authoritative API for scope-based authorization.
 *
 * Resolves "Can user X perform capability Y on resource Z?" considering:
 * 1. Global permissions (baseline)
 * 2. AccessScopeGrant records
 * 3. Legacy DoctorMachinePermission
 * 4. Authorization mode (OFF / SHADOW / ENFORCE)
 *
 * Mode behavior:
 * - OFF:     effectiveAllowed = baselineAllowed (scope computed but not enforced)
 * - SHADOW:  effectiveAllowed = baselineAllowed (divergence logged)
 * - ENFORCE: effectiveAllowed = baselineAllowed && proposedAllowed
 *
 * Safety guarantees:
 * - ADMIN bypass with full trace for audit
 * - DENY always wins over ALLOW
 * - Ambiguous AE in ENFORCE → deny
 * - Unclassified resource in ENFORCE → deny
 * - Never trusts client-provided role/permission data
 */
export async function resolveScope(
  userId: string,
  capability: ScopeCapability,
  resourceInput: ResourceContextInput,
  deps: ScopeResolverDeps,
  ctx?: ScopeRequestContext
): Promise<ScopeDecision> {
  const mode = getAuthorizationMode();
  const effectiveCtx = ctx || ScopeRequestContext.create();

  // ── Step 1: Load principal from DB ──────────────────────────────────
  const principal = await loadPrincipal(userId, deps, effectiveCtx);
  if (!principal || !principal.isActive) {
    return makeDecision({
      baselineAllowed: false,
      proposedAllowed: false,
      effectiveAllowed: false,
      mode,
      reasonCode: "GLOBAL_PERMISSION_MISSING",
      scopeTrace: [],
      resourceContext: makeEmptyResourceContext(resourceInput),
    });
  }

  // ── Step 2: Check baseline (global permission) ─────────────────────
  const globalPerm = CAPABILITY_TO_GLOBAL_PERMISSION[capability];
  const baselineAllowed = principal.globalPermissions.includes(globalPerm);

  // ── Step 3: ADMIN bypass ───────────────────────────────────────────
  if (principal.baseRole === "ADMIN") {
    return makeDecision({
      baselineAllowed: true,
      proposedAllowed: true,
      effectiveAllowed: true,
      mode,
      reasonCode: "ADMIN_BYPASS",
      scopeTrace: [],
      resourceContext: makeEmptyResourceContext(resourceInput),
    });
  }

  // ── Step 4: Load organization tree ─────────────────────────────────
  let tree: OrganizationTree;
  if (effectiveCtx.getTree()) {
    tree = effectiveCtx.getTree()!;
  } else {
    tree = await loadOrganizationTree();
    effectiveCtx.setTree(tree);
  }

  // ── Step 5: Resolve resource context ───────────────────────────────
  const resourceCtx = await resolveResourceContext(resourceInput, tree, deps, effectiveCtx);

  // ── Step 6: If baseline not allowed, no point checking scope ───────
  if (!baselineAllowed) {
    return makeDecision({
      baselineAllowed: false,
      proposedAllowed: false,
      effectiveAllowed: false,
      mode,
      reasonCode: "GLOBAL_PERMISSION_MISSING",
      scopeTrace: [],
      resourceContext: resourceCtx,
    });
  }

  // ── Step 7: Evaluate scope grants ──────────────────────────────────
  const grantResult = await evaluateGrants(principal, capability, resourceCtx, tree, deps, effectiveCtx);

  // ── Step 8: Evaluate legacy machine permission ─────────────────────
  const legacyResult = await evaluateLegacyPermissions(principal, capability, resourceCtx, deps, effectiveCtx);

  // ── Step 9: Combine traces ─────────────────────────────────────────
  const allTraces: ScopeTraceEntry[] = [...grantResult.traces, ...legacyResult.traces];

  // ── Step 10: Compute proposedAllowed ────────────────────────────────
  let proposedAllowed: boolean;
  let reasonCode: ScopeDecision["reasonCode"];

  if (grantResult.hasMatchingOpinion && legacyResult.hasMatchingOpinion) {
    // Both have opinions — combined: DENY from either source wins
    const grantDeny = grantResult.traces.some(t => t.effect === "DENY");
    const legacyDeny = legacyResult.traces.some(t => t.effect === "DENY");
    if (grantDeny || legacyDeny) {
      proposedAllowed = false;
      reasonCode = "EXPLICIT_DENY";
    } else {
      proposedAllowed = grantResult.allowed && legacyResult.allowed;
      reasonCode = proposedAllowed ? "ALLOWED_BY_GRANT" : "NO_SCOPE_GRANT";
    }
  } else if (grantResult.hasMatchingOpinion) {
    proposedAllowed = grantResult.allowed;
    reasonCode = grantResult.allowed ? "ALLOWED_BY_GRANT" : (
      grantResult.traces.some(t => t.effect === "DENY") ? "EXPLICIT_DENY" : "NO_SCOPE_GRANT"
    );
  } else if (legacyResult.hasMatchingOpinion) {
    proposedAllowed = legacyResult.allowed;
    reasonCode = legacyResult.allowed ? "ALLOWED_BY_GRANT" : "EXPLICIT_DENY";
  } else {
    // Neither has opinion — no scope grants exist for this user/capability
    proposedAllowed = false;
    reasonCode = "NO_SCOPE_GRANT";
  }

  // ── Step 11: Handle resource classification edge cases ─────────────
  if (!resourceCtx.classified && mode === "ENFORCE") {
    // Resource has no determinable scope — cannot safely allow in ENFORCE
    if (resourceCtx.aeResolution.status === "AMBIGUOUS") {
      reasonCode = "AMBIGUOUS_MACHINE";
    } else {
      reasonCode = "RESOURCE_UNCLASSIFIED";
    }
    proposedAllowed = false;
  }

  if (resourceCtx.aeResolution.status === "AMBIGUOUS" && mode === "ENFORCE") {
    proposedAllowed = false;
    reasonCode = "AMBIGUOUS_MACHINE";
  }

  if (resourceCtx.aeResolution.status === "RESOURCE_INACTIVE" && mode === "ENFORCE") {
    proposedAllowed = false;
    reasonCode = "RESOURCE_INACTIVE";
  }

  // ── Step 12: Apply mode rules ──────────────────────────────────────
  let effectiveAllowed: boolean;

  switch (mode) {
    case "OFF":
      effectiveAllowed = baselineAllowed;
      if (reasonCode === "NO_SCOPE_GRANT" && !grantResult.hasMatchingOpinion && !legacyResult.hasMatchingOpinion) {
        reasonCode = "MODE_OFF";
      }
      break;

    case "SHADOW":
      effectiveAllowed = baselineAllowed;
      // Log divergence if proposedAllowed differs from baselineAllowed
      if (proposedAllowed !== baselineAllowed) {
        console.warn(
          `[scope-resolver] SHADOW divergence: user=${userId} capability=${capability} ` +
          `baseline=${baselineAllowed} proposed=${proposedAllowed} reason=${reasonCode} ` +
          `resource=${JSON.stringify({
            performingUnitId: resourceCtx.performingUnitId,
            aeTitle: resourceCtx.aeResolution.aeTitle,
            aeStatus: resourceCtx.aeResolution.status,
          })}`
        );
      }
      if (reasonCode === "NO_SCOPE_GRANT" && !grantResult.hasMatchingOpinion && !legacyResult.hasMatchingOpinion) {
        reasonCode = "MODE_SHADOW";
      }
      break;

    case "ENFORCE":
      effectiveAllowed = baselineAllowed && proposedAllowed;
      break;

    default:
      effectiveAllowed = baselineAllowed;
      break;
  }

  return makeDecision({
    baselineAllowed,
    proposedAllowed,
    effectiveAllowed,
    mode,
    reasonCode,
    scopeTrace: allTraces,
    resourceContext: resourceCtx,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDecision(decision: ScopeDecision): ScopeDecision {
  return decision;
}

function makeEmptyResourceContext(input: ResourceContextInput): ResolvedResourceContext {
  return {
    performingUnitId: input.performingUnitId || null,
    ancestorUnitIds: [],
    dicomNodeId: null,
    facilityUnitId: null,
    aeResolution: {
      status: "MISSING_IDENTIFIER",
      dicomNodeId: null,
      facilityUnitId: null,
      aeTitle: null,
    },
    classified: false,
  };
}
