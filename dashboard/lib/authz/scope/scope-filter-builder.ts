import type { ResourceType } from "./scope-decision";
import type { ScopeCapability } from "./capability-registry";
import { CAPABILITY_TO_GLOBAL_PERMISSION } from "./capability-registry";
import { getAuthorizationMode, type AuthorizationMode } from "./authorization-mode";
import { ScopeRequestContext } from "./scope-request-context";
import { loadPrincipal, type PrincipalLoaderDeps } from "./principal-loader";
import { evaluateGrants, type GrantRepositoryDeps, type AccessScopeGrantRow } from "./grant-repository";
import { evaluateLegacyPermissions, type LegacyAdapterDeps } from "./legacy-scope-adapter";
import { loadOrganizationTree } from "./organization-tree-loader";
import type { OrganizationTree } from "./organization-tree";

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * Filter result suitable for building Prisma where clauses.
 * The caller constructs the actual Prisma query using these sets of IDs.
 */
export type ScopeFilterResult = {
  mode: AuthorizationMode;
  /** True if the user has a global ALLOW grant (not restricted to a facility/node). If true, the filter should only exclude the denied items. */
  globalAllow: boolean;
  /** True if the filter should be applied (ENFORCE mode, non-admin user) */
  shouldFilter: boolean;
  /** Facility unit IDs the user can access (including subtree expansion) */
  allowedUnitIds: string[];
  /** Facility unit IDs explicitly denied (DENY holes in allowed subtrees) */
  deniedUnitIds: string[];
  /** AE Titles allowed via legacy — only unique, active, non-ambiguous */
  allowedAeTitles: string[];
  /** AE Titles explicitly denied */
  deniedAeTitles: string[];
  /** DicomNode IDs explicitly allowed by scope grants */
  allowedDicomNodeIds: string[];
  /** DicomNode IDs explicitly denied by scope grants */
  deniedDicomNodeIds: string[];
  /** Debug: reason why filter is or isn't applied */
  reason: string;
};

export type FilterBuilderDeps = PrincipalLoaderDeps & GrantRepositoryDeps & LegacyAdapterDeps & {
  findAllGrantsForUser: (userId: string, capability: string) => Promise<AccessScopeGrantRow[]>;
  findAllGrantsForRoleProfile: (roleProfileId: string, capability: string) => Promise<AccessScopeGrantRow[]>;
  findDeniedAeTitles: (userId: string, actionKey: string) => Promise<string[]>;
  findAllowedLegacyAeTitles: (userId: string, actionKey: string) => Promise<Array<{ aeTitle: string; dicomNodeId: string }>>;
  /** Returns AE Titles that are active and unique (not shared by multiple active nodes) */
  findUniqueActiveAeTitles: () => Promise<string[]>;
};

// ─── Capability → legacy action key ────────────────────────────────────────────

const CAPABILITY_TO_LEGACY_ACTION: Partial<Record<ScopeCapability, string>> = {
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

// ─── Builder ───────────────────────────────────────────────────────────────────

/**
 * Builds authorization filter data for list queries (worklist, study list, etc).
 *
 * Safety guarantees:
 * - In ENFORCE mode, only returns resources the user has explicit ALLOW for
 * - DENY holes: if user has ALLOW at parent but DENY at child, the child
 *   subtree is excluded
 * - Never uses "performingUnitId IS NOT NULL OR stationAeTitle IS NOT NULL"
 *   as a pass condition
 * - Legacy AE titles are only included if active and unique (non-ambiguous)
 * - Does NOT fail-open on missing scope data
 */
export async function buildScopeFilter(
  userId: string,
  capability: ScopeCapability,
  resourceType: ResourceType,
  deps: FilterBuilderDeps,
  ctx?: ScopeRequestContext
): Promise<ScopeFilterResult> {
  const mode = getAuthorizationMode();
  const effectiveCtx = ctx || ScopeRequestContext.create();

  const noFilter: ScopeFilterResult = {
    mode,
    globalAllow: false,
    shouldFilter: false,
    allowedUnitIds: [],
    deniedUnitIds: [],
    allowedAeTitles: [],
    deniedAeTitles: [],
    allowedDicomNodeIds: [],
    deniedDicomNodeIds: [],
    reason: "",
  };

  // Only apply filter in ENFORCE mode
  if (mode !== "ENFORCE") {
    return { ...noFilter, reason: `Mode is ${mode}, no filter applied` };
  }

  // Load principal
  const principal = await loadPrincipal(userId, deps, effectiveCtx);
  if (!principal || !principal.isActive) {
    return {
      ...noFilter,
      shouldFilter: true,
      reason: "User not found or inactive — filter to empty set",
    };
  }

  // Check global permission
  const globalPerm = CAPABILITY_TO_GLOBAL_PERMISSION[capability];
  if (!principal.globalPermissions.includes(globalPerm)) {
    return {
      ...noFilter,
      shouldFilter: true,
      reason: `Missing global permission ${globalPerm}`,
    };
  }

  // ADMIN bypass
  if (principal.baseRole === "ADMIN") {
    return { ...noFilter, reason: "ADMIN bypass — no filter" };
  }

  // Load organization tree
  let tree: OrganizationTree;
  if (effectiveCtx.getTree()) {
    tree = effectiveCtx.getTree()!;
  } else {
    tree = await loadOrganizationTree();
    effectiveCtx.setTree(tree);
  }

  // Load all grants for this user + capability
  let userGrants = await deps.findAllGrantsForUser(userId, capability);
  let roleGrants: AccessScopeGrantRow[] = [];
  if (principal.roleProfileId) {
    roleGrants = await deps.findAllGrantsForRoleProfile(principal.roleProfileId, capability);
  }

  const now = new Date();
  const allGrants = [...userGrants, ...roleGrants].filter(g => {
    if (g.validFrom && g.validFrom > now) return false;
    if (g.validUntil && g.validUntil <= now) return false;
    // Check scope activity
    if (g.facilityUnitId && !g.facilityUnit) return false;
    if (g.facilityUnit && !g.facilityUnit.isActive) return false;
    if (g.dicomNodeId && !g.dicomNode) return false;
    if (g.dicomNode && !g.dicomNode.isActive) return false;
    return true;
  });

  // Separate ALLOW and DENY grants
  const allowGrants = allGrants.filter(g => g.effect === "ALLOW");
  const denyGrants = allGrants.filter(g => g.effect === "DENY");

  // Build allowed unit IDs with subtree expansion
  let hasGlobalAllow = false;
  const allowedUnitIdsSet = new Set<string>();
  const allowedDicomNodeIds = new Set<string>();

  for (const grant of allowGrants) {
    if (grant.facilityUnitId) {
      allowedUnitIdsSet.add(grant.facilityUnitId);
      if (grant.includeDescendants) {
        try {
          const descendants = tree.getDescendantIds(grant.facilityUnitId);
          for (const d of descendants) allowedUnitIdsSet.add(d);
        } catch {
          // Cycle in tree — don't expand
        }
      }
    }
    if (grant.dicomNodeId) {
      allowedDicomNodeIds.add(grant.dicomNodeId);
    }
    // Global grant (no facility/node scope) — allow all
    if (!grant.facilityUnitId && !grant.dicomNodeId) {
      hasGlobalAllow = true;
    }
  }

  // Global ALLOW remains constrained to active, classified units.
  if (hasGlobalAllow) {
    for (const unitId of tree.getAllNodeIds()) allowedUnitIdsSet.add(unitId);
  }

  // Build denied unit IDs (DENY holes)
  const deniedUnitIdsSet = new Set<string>();
  const deniedDicomNodeIds = new Set<string>();

  for (const grant of denyGrants) {
    if (grant.facilityUnitId) {
      deniedUnitIdsSet.add(grant.facilityUnitId);
      if (grant.includeDescendants) {
        try {
          const descendants = tree.getDescendantIds(grant.facilityUnitId);
          for (const d of descendants) deniedUnitIdsSet.add(d);
        } catch {
          // Cycle in tree — fail closed
          return {
            ...noFilter,
            mode,
            shouldFilter: true,
            reason: "Tree cycle detected during DENY expansion — filter to empty set for safety",
          };
        }
      }
    }
    if (grant.dicomNodeId) {
      deniedDicomNodeIds.add(grant.dicomNodeId);
    }
    // Global DENY — deny everything
    if (!grant.facilityUnitId && !grant.dicomNodeId) {
      return {
        mode,
        globalAllow: false,
        shouldFilter: true,
        allowedUnitIds: [],
        deniedUnitIds: [],
        allowedAeTitles: [],
        deniedAeTitles: [],
        allowedDicomNodeIds: [],
        deniedDicomNodeIds: [],
        reason: "Global DENY grant — filter to empty set",
      };
    }
  }

  // Remove denied from allowed (DENY holes)
  Array.from(deniedUnitIdsSet).forEach(denied => {
    allowedUnitIdsSet.delete(denied);
  });
  Array.from(deniedDicomNodeIds).forEach(denied => {
    allowedDicomNodeIds.delete(denied);
  });

  // Build legacy AE title lists
  let allowedAeTitles: string[] = [];
  let deniedAeTitles: string[] = [];

  const legacyAction = CAPABILITY_TO_LEGACY_ACTION[capability];
  if (legacyAction) {
    // Get unique active AE titles to filter out ambiguous ones
    const uniqueActiveAeTitles = new Set(await deps.findUniqueActiveAeTitles());

    // Get allowed legacy AE titles
    const legacyAllowed = await deps.findAllowedLegacyAeTitles(userId, legacyAction);
    allowedAeTitles = legacyAllowed
      .map(l => l.aeTitle)
      .filter(ae => uniqueActiveAeTitles.has(ae));

    // Get denied AE titles
    const rawDeniedAeTitles = await deps.findDeniedAeTitles(userId, legacyAction);
    deniedAeTitles = rawDeniedAeTitles.filter(ae => uniqueActiveAeTitles.has(ae));

    // Models persist stationAeTitle rather than DicomNode FK. Translate
    // node-scoped grants only when their AE Title is unique and active.
    for (const grant of allowGrants) {
      const ae = grant.dicomNode?.aeTitle;
      if (grant.dicomNodeId && ae && uniqueActiveAeTitles.has(ae)) allowedAeTitles.push(ae);
    }
    for (const grant of denyGrants) {
      const ae = grant.dicomNode?.aeTitle;
      if (grant.dicomNodeId && ae && uniqueActiveAeTitles.has(ae)) deniedAeTitles.push(ae);
    }
    if (hasGlobalAllow) allowedAeTitles.push(...Array.from(uniqueActiveAeTitles));
  }

  // Remove denied AE titles from allowed
  deniedAeTitles = Array.from(new Set(deniedAeTitles));
  const deniedAeSet = new Set(deniedAeTitles);
  allowedAeTitles = Array.from(new Set(allowedAeTitles)).filter(ae => !deniedAeSet.has(ae));

  const hasAnyAllowedScope = hasGlobalAllow || allowedUnitIdsSet.size > 0 || allowedDicomNodeIds.size > 0 || allowedAeTitles.length > 0;

  // Do not return noFilter for a non-admin global grant: ENFORCE must still
  // exclude stale/unknown AE Titles and resources without classification.

  return {
    mode,
    globalAllow: hasGlobalAllow,
    shouldFilter: true,
    allowedUnitIds: Array.from(allowedUnitIdsSet),
    deniedUnitIds: Array.from(deniedUnitIdsSet),
    allowedAeTitles,
    deniedAeTitles,
    allowedDicomNodeIds: Array.from(allowedDicomNodeIds),
    deniedDicomNodeIds: Array.from(deniedDicomNodeIds),
    reason: hasAnyAllowedScope
      ? `ENFORCE: ${hasGlobalAllow ? "Global ALLOW, " : ""}${allowedUnitIdsSet.size} units, ${allowedDicomNodeIds.size} nodes, ${allowedAeTitles.length} AE titles allowed`
      : "ENFORCE: no allowed scope — filter to empty set",
  };
}

/**
 * Converts a ScopeFilterResult into a Prisma WHERE clause.
 * Applies strict ENFORCE rules (e.g. unclassified/inactive/ambiguous resources).
 */
export function applyScopeFilterToPrisma(
  filter: ScopeFilterResult,
  unitField: string,
  aeField: string,
  nodeField?: string
): Record<string, unknown> {
  if (!filter.shouldFilter) return {};

  if (!filter.globalAllow && filter.allowedUnitIds.length === 0 && filter.allowedAeTitles.length === 0 && filter.allowedDicomNodeIds.length === 0) {
    // No scopes allowed -> fail closed
    return { id: "force-empty-result" };
  }

  const and: Record<string, unknown>[] = [];

  if (filter.globalAllow) {
    const classified: Record<string, unknown>[] = [];
    if (filter.allowedUnitIds.length > 0) classified.push({ [unitField]: { in: filter.allowedUnitIds } });
    if (filter.allowedAeTitles.length > 0) classified.push({ [aeField]: { in: filter.allowedAeTitles } });
    if (nodeField && filter.allowedDicomNodeIds.length > 0) classified.push({ [nodeField]: { in: filter.allowedDicomNodeIds } });
    if (classified.length === 0) return { id: "force-empty-result" };
    and.push({ OR: classified });
    // Global allow: only exclude explicit DENY holes
    if (filter.deniedUnitIds.length > 0) {
      and.push({
        OR: [
          { [unitField]: { notIn: filter.deniedUnitIds } },
          { [unitField]: null }
        ]
      });
    }
    if (filter.deniedAeTitles.length > 0) {
      and.push({
        OR: [
          { [aeField]: { notIn: filter.deniedAeTitles } },
          { [aeField]: null }
        ]
      });
    }
    if (nodeField && filter.deniedDicomNodeIds.length > 0) {
      and.push({
        OR: [
          { [nodeField]: { notIn: filter.deniedDicomNodeIds } },
          { [nodeField]: null }
        ]
      });
    }
  } else {
    // Specific ALLOW: must match one of the allowed scopes
    const orConditions: Record<string, unknown>[] = [];
    if (filter.allowedUnitIds.length > 0) {
      orConditions.push({ [unitField]: { in: filter.allowedUnitIds } });
    }
    if (filter.allowedAeTitles.length > 0) {
      orConditions.push({ [aeField]: { in: filter.allowedAeTitles } });
    }
    if (nodeField && filter.allowedDicomNodeIds.length > 0) {
      orConditions.push({ [nodeField]: { in: filter.allowedDicomNodeIds } });
    }

    if (orConditions.length > 0) {
      // Must also exclude any denied holes (if a parent was allowed but child was denied)
      if (filter.deniedUnitIds.length > 0) {
        and.push({
          OR: [
            { [unitField]: { notIn: filter.deniedUnitIds } },
            { [unitField]: null }
          ]
        });
      }
      if (filter.deniedAeTitles.length > 0) {
        and.push({
          OR: [
            { [aeField]: { notIn: filter.deniedAeTitles } },
            { [aeField]: null }
          ]
        });
      }
      if (nodeField && filter.deniedDicomNodeIds.length > 0) {
        and.push({
          OR: [
            { [nodeField]: { notIn: filter.deniedDicomNodeIds } },
            { [nodeField]: null }
          ]
        });
      }

      and.push({ OR: orConditions });
    }
  }

  return and.length > 0 ? { AND: and } : {};
}
