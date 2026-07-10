import type { ScopePrincipal, ResolvedResourceContext, GrantEvaluationResult, ScopeTraceEntry } from "./scope-decision";
import type { ScopeCapability } from "./capability-registry";
import type { OrganizationTree } from "./organization-tree";
import type { ScopeRequestContext } from "./scope-request-context";

// ─── Raw grant row from DB ────────────────────────────────────────────────────

export type AccessScopeGrantRow = {
  id: string;
  userId: string | null;
  roleProfileId: string | null;
  facilityUnitId: string | null;
  dicomNodeId: string | null;
  capability: string;
  effect: string; // "ALLOW" | "DENY"
  includeDescendants: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  facilityUnit?: { isActive: boolean } | null;
  dicomNode?: { isActive: boolean; facilityId: string | null } | null;
};

// ─── Dependencies ──────────────────────────────────────────────────────────────

export type GrantRepositoryDeps = {
  findGrantsByUserAndCapability: (userId: string, capability: string) => Promise<AccessScopeGrantRow[]>;
  findGrantsByRoleProfileAndCapability: (roleProfileId: string, capability: string) => Promise<AccessScopeGrantRow[]>;
};

// ─── Grant evaluation ──────────────────────────────────────────────────────────

/**
 * Checks if a grant is currently valid (not expired, not in a future window).
 */
function isGrantValid(grant: AccessScopeGrantRow, now: Date): boolean {
  if (grant.validFrom && grant.validFrom > now) return false;
  if (grant.validUntil && grant.validUntil <= now) return false;
  return true;
}

/**
 * Checks if the referenced scope entities are still active.
 */
function isScopeActive(grant: AccessScopeGrantRow): boolean {
  if (grant.facilityUnit && !grant.facilityUnit.isActive) return false;
  if (grant.dicomNode && !grant.dicomNode.isActive) return false;
  return true;
}

/**
 * Determines if a grant's scope matches the resource context.
 *
 * Match rules:
 * - Grant with dicomNodeId: matches if resource's dicomNodeId equals grant's dicomNodeId
 * - Grant with facilityUnitId: matches if resource's facilityUnitId equals grant's facilityUnitId (DIRECT),
 *   or if grant's facilityUnitId is in resource's ancestorUnitIds AND includeDescendants is true (INHERITED)
 * - Grant with neither: applies globally (matches all resources) — DIRECT
 */
function matchesResource(
  grant: AccessScopeGrantRow,
  resourceCtx: ResolvedResourceContext,
  tree: OrganizationTree
): { matches: boolean; matchType: "DIRECT" | "INHERITED" } {
  // Grant scoped to a specific DicomNode
  if (grant.dicomNodeId) {
    if (resourceCtx.dicomNodeId === grant.dicomNodeId) {
      return { matches: true, matchType: "DIRECT" };
    }
    return { matches: false, matchType: "DIRECT" };
  }

  // Grant scoped to a FacilityUnit
  if (grant.facilityUnitId) {
    // Direct match
    if (resourceCtx.facilityUnitId === grant.facilityUnitId) {
      return { matches: true, matchType: "DIRECT" };
    }

    // Inherited match: grant at an ancestor, includeDescendants must be true
    if (grant.includeDescendants && resourceCtx.ancestorUnitIds.includes(grant.facilityUnitId)) {
      return { matches: true, matchType: "INHERITED" };
    }

    // Check if grant's facility is a descendant of resource's facility
    // This handles DENY at child — does the resource fall within that subtree?
    if (resourceCtx.facilityUnitId) {
      const grantDescendants = tree.getDescendantIds(grant.facilityUnitId);
      if (grantDescendants.includes(resourceCtx.facilityUnitId)) {
        // The resource is under the grant's facility, and if includeDescendants
        // is true, this is an inherited match
        if (grant.includeDescendants) {
          return { matches: true, matchType: "INHERITED" };
        }
      }
    }

    return { matches: false, matchType: "DIRECT" };
  }

  // Grant has no facility/node scope — global scope grant (applies everywhere)
  return { matches: true, matchType: "DIRECT" };
}

/**
 * Evaluates all AccessScopeGrants for a principal against a resource context.
 *
 * Rules:
 * 1. Loads grants for both userId and roleProfileId
 * 2. Filters out expired/future grants
 * 3. Filters out grants with inactive scope references
 * 4. Checks each grant against resource context
 * 5. DENY always wins over ALLOW at any level
 * 6. Returns traced matches for audit
 */
export async function evaluateGrants(
  principal: ScopePrincipal,
  capability: ScopeCapability,
  resourceCtx: ResolvedResourceContext,
  tree: OrganizationTree,
  deps: GrantRepositoryDeps,
  ctx?: ScopeRequestContext
): Promise<GrantEvaluationResult> {
  const now = new Date();
  const traces: ScopeTraceEntry[] = [];
  let hasMatchingOpinion = false;
  let hasConfiguredGrant = false;
  let hasAllow = false;
  let hasDeny = false;

  // Load grants for user
  const userGrantsCacheKey = `user:${principal.userId}:${capability}`;
  let userGrants: AccessScopeGrantRow[];
  if (ctx) {
    const cached = ctx.getGrants(userGrantsCacheKey);
    if (cached) {
      userGrants = cached;
    } else {
      userGrants = await deps.findGrantsByUserAndCapability(principal.userId, capability);
      ctx.setGrants(userGrantsCacheKey, userGrants);
    }
  } else {
    userGrants = await deps.findGrantsByUserAndCapability(principal.userId, capability);
  }

  // Load grants for role profile
  let roleGrants: AccessScopeGrantRow[] = [];
  if (principal.roleProfileId) {
    const roleGrantsCacheKey = `role:${principal.roleProfileId}:${capability}`;
    if (ctx) {
      const cached = ctx.getGrants(roleGrantsCacheKey);
      if (cached) {
        roleGrants = cached;
      } else {
        roleGrants = await deps.findGrantsByRoleProfileAndCapability(principal.roleProfileId, capability);
        ctx.setGrants(roleGrantsCacheKey, roleGrants);
      }
    } else {
      roleGrants = await deps.findGrantsByRoleProfileAndCapability(principal.roleProfileId, capability);
    }
  }

  // Combine and evaluate
  const allGrants: Array<{ grant: AccessScopeGrantRow; source: "USER" | "ROLE_PROFILE" }> = [
    ...userGrants.map(g => ({ grant: g, source: "USER" as const })),
    ...roleGrants.map(g => ({ grant: g, source: "ROLE_PROFILE" as const })),
  ];

  for (const { grant, source } of allGrants) {
    // Skip expired/future grants
    if (!isGrantValid(grant, now)) continue;

    // Skip grants with inactive scope references
    if (!isScopeActive(grant)) continue;

    hasConfiguredGrant = true;

    // Check if this grant matches the resource
    const { matches, matchType } = matchesResource(grant, resourceCtx, tree);
    if (!matches) continue;

    const effect = grant.effect === "DENY" ? "DENY" : "ALLOW";

    traces.push({
      grantId: grant.id,
      source,
      effect,
      facilityUnitId: grant.facilityUnitId,
      dicomNodeId: grant.dicomNodeId,
      matchType,
      capability,
    });

    if (effect === "DENY") {
      hasDeny = true;
    } else {
      hasAllow = true;
    }
  }

  // DENY always wins
  if (hasDeny) {
    return { allowed: false, hasMatchingOpinion: true, hasConfiguredGrant, traces };
  }

  if (hasAllow) {
    return { allowed: true, hasMatchingOpinion: true, hasConfiguredGrant, traces };
  }

  // No matching grants found
  return { allowed: false, hasMatchingOpinion: false, hasConfiguredGrant, traces };
}
