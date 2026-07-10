import type { AeResolutionResult, ScopePrincipal } from "./scope-decision";
import type { OrganizationTree } from "./organization-tree";

/**
 * Per-request cache for scope resolution.
 *
 * Create one instance at the start of a request and pass it to all
 * resolver functions. This prevents duplicate DB queries within the
 * same request while ensuring no stale data leaks across requests.
 *
 * Usage:
 *   const ctx = ScopeRequestContext.create();
 *   const decision1 = await resolveScope(userId, cap1, resource1, ctx);
 *   const decision2 = await resolveScope(userId, cap2, resource2, ctx);
 *   // Both calls share cached principal, tree, grants, AE lookups.
 */
export class ScopeRequestContext {
  private principalCache: Map<string, ScopePrincipal> = new Map();
  private treeInstance: OrganizationTree | null = null;
  private grantsCache: Map<string, any[]> = new Map();
  private aeCache: Map<string, AeResolutionResult> = new Map();
  private legacyPermsCache: Map<string, any[]> = new Map();

  private constructor() {}

  static create(): ScopeRequestContext {
    return new ScopeRequestContext();
  }

  // ─── Principal cache ─────────────────────────────────────────────────

  getPrincipal(userId: string): ScopePrincipal | undefined {
    return this.principalCache.get(userId);
  }

  setPrincipal(userId: string, principal: ScopePrincipal): void {
    this.principalCache.set(userId, principal);
  }

  // ─── Organization tree cache ─────────────────────────────────────────

  getTree(): OrganizationTree | null {
    return this.treeInstance;
  }

  setTree(tree: OrganizationTree): void {
    this.treeInstance = tree;
  }

  // ─── AccessScopeGrant cache (keyed by `userId|roleProfileId`) ───────

  getGrants(cacheKey: string): any[] | undefined {
    return this.grantsCache.get(cacheKey);
  }

  setGrants(cacheKey: string, grants: any[]): void {
    this.grantsCache.set(cacheKey, grants);
  }

  // ─── AE Title resolution cache ──────────────────────────────────────

  getAeResolution(aeTitle: string): AeResolutionResult | undefined {
    return this.aeCache.get(aeTitle);
  }

  setAeResolution(aeTitle: string, result: AeResolutionResult): void {
    this.aeCache.set(aeTitle, result);
  }

  // ─── Legacy machine permission cache ────────────────────────────────

  getLegacyPerms(cacheKey: string): any[] | undefined {
    return this.legacyPermsCache.get(cacheKey);
  }

  setLegacyPerms(cacheKey: string, perms: any[]): void {
    this.legacyPermsCache.set(cacheKey, perms);
  }
}
