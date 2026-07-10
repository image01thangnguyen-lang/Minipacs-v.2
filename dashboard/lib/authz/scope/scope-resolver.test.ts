/**
 * Comprehensive tests for PR 5 — Scope Resolver Core.
 *
 * Uses the project's existing test pattern (no framework, inline assert/run).
 * All DB access is mocked via dependency injection.
 */

import { resolveAeTitle, type AeTitleResolverDeps } from "./ae-title-resolver";
import { resolveResourceContext, type ResourceContextDeps } from "./resource-context";
import { loadPrincipal, type PrincipalLoaderDeps } from "./principal-loader";
import { evaluateGrants, type GrantRepositoryDeps, type AccessScopeGrantRow } from "./grant-repository";
import { evaluateLegacyPermissions, type LegacyAdapterDeps } from "./legacy-scope-adapter";
import { resolveScope, type ScopeResolverDeps } from "./scope-resolver";
import { ScopeRequestContext } from "./scope-request-context";
import { OrganizationTree } from "./organization-tree";
import type { ScopeCapability } from "./capability-registry";
import type { ScopePrincipal, ResourceContextInput } from "./scope-decision";

// ─── Test helpers ──────────────────────────────────────────────────────────────

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

let passCount = 0;
let failCount = 0;

async function run(name: string, test: () => Promise<void> | void) {
  try {
    await test();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (error: any) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`    ${error.message}`);
    failCount++;
  }
}

// ─── Mock helpers ──────────────────────────────────────────────────────────────

function makeTree(units: { id: string; type: string; parentId: string | null }[]): OrganizationTree {
  return new OrganizationTree(units);
}

const defaultTree = makeTree([
  { id: "chain1", type: "CHAIN", parentId: null },
  { id: "hosp1", type: "HOSPITAL", parentId: "chain1" },
  { id: "dept1", type: "DEPARTMENT", parentId: "hosp1" },
  { id: "room1", type: "ROOM", parentId: "dept1" },
  { id: "room2", type: "ROOM", parentId: "dept1" },
  { id: "dept2", type: "DEPARTMENT", parentId: "hosp1" },
  { id: "room3", type: "ROOM", parentId: "dept2" },
]);

function makeGrant(overrides: Partial<AccessScopeGrantRow> = {}): AccessScopeGrantRow {
  return {
    id: overrides.id || "grant-" + Math.random().toString(36).substr(2, 6),
    userId: null,
    roleProfileId: null,
    facilityUnitId: null,
    dicomNodeId: null,
    capability: "READ_STUDY",
    effect: "ALLOW",
    includeDescendants: true,
    validFrom: null,
    validUntil: null,
    ...overrides,
  };
}

function makePrincipal(overrides: Partial<ScopePrincipal> = {}): ScopePrincipal {
  return {
    userId: "user1",
    baseRole: "DOCTOR",
    roleProfileId: null,
    globalPermissions: ["studies.read", "reports.read", "reports.write", "reports.finalize"],
    isActive: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AE TITLE RESOLVER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
console.log("\n--- AE Title Resolver ---");
  
  await run("returns MISSING_IDENTIFIER for null aeTitle", async () => {
    const deps: AeTitleResolverDeps = { findDicomNodesByAeTitle: async () => [] };
    const result = await resolveAeTitle(null, deps);
    assert(result.status === "MISSING_IDENTIFIER", `Expected MISSING_IDENTIFIER, got ${result.status}`);
    assert(result.dicomNodeId === null, "dicomNodeId should be null");
  });
  
  await run("returns MISSING_IDENTIFIER for empty string", async () => {
    const deps: AeTitleResolverDeps = { findDicomNodesByAeTitle: async () => [] };
    const result = await resolveAeTitle("  ", deps);
    assert(result.status === "MISSING_IDENTIFIER", `Expected MISSING_IDENTIFIER, got ${result.status}`);
  });
  
  await run("returns MATCHED for exactly one active node", async () => {
    const deps: AeTitleResolverDeps = {
      findDicomNodesByAeTitle: async () => [{ id: "node1", aeTitle: "CT1", isActive: true, facilityId: "hosp1" }],
    };
    const result = await resolveAeTitle("CT1", deps);
    assert(result.status === "MATCHED", `Expected MATCHED, got ${result.status}`);
    assert(result.dicomNodeId === "node1", "dicomNodeId mismatch");
    assert(result.facilityUnitId === "hosp1", "facilityUnitId mismatch");
  });
  
  await run("returns AMBIGUOUS for multiple active nodes", async () => {
    const deps: AeTitleResolverDeps = {
      findDicomNodesByAeTitle: async () => [
        { id: "node1", aeTitle: "CT1", isActive: true, facilityId: "hosp1" },
        { id: "node2", aeTitle: "CT1", isActive: true, facilityId: "hosp2" },
      ],
    };
    const result = await resolveAeTitle("CT1", deps);
    assert(result.status === "AMBIGUOUS", `Expected AMBIGUOUS, got ${result.status}`);
    assert(result.dicomNodeId === null, "AMBIGUOUS should have null dicomNodeId");
  });
  
  await run("returns NO_MATCH when no nodes found", async () => {
    const deps: AeTitleResolverDeps = { findDicomNodesByAeTitle: async () => [] };
    const result = await resolveAeTitle("NONEXISTENT", deps);
    assert(result.status === "NO_MATCH", `Expected NO_MATCH, got ${result.status}`);
  });
  
  await run("returns RESOURCE_INACTIVE when only inactive nodes found", async () => {
    const deps: AeTitleResolverDeps = {
      findDicomNodesByAeTitle: async () => [{ id: "node1", aeTitle: "CT1", isActive: false, facilityId: "hosp1" }],
    };
    const result = await resolveAeTitle("CT1", deps);
    assert(result.status === "RESOURCE_INACTIVE", `Expected RESOURCE_INACTIVE, got ${result.status}`);
  });
  
  await run("caches results in ScopeRequestContext", async () => {
    let callCount = 0;
    const deps: AeTitleResolverDeps = {
      findDicomNodesByAeTitle: async () => { callCount++; return [{ id: "n1", aeTitle: "CT1", isActive: true, facilityId: "h1" }]; },
    };
    const ctx = ScopeRequestContext.create();
    await resolveAeTitle("CT1", deps, ctx);
    await resolveAeTitle("CT1", deps, ctx);
    assert(callCount === 1, `Expected 1 DB call, got ${callCount}`);
  });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RESOURCE CONTEXT RESOLVER TESTS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  console.log("\n--- Resource Context Resolver ---");
  
  await run("uses performingUnitId when available", async () => {
    const deps: ResourceContextDeps = {
      findDicomNodesByAeTitle: async () => [],
      findDicomNodeById: async () => null,
      findFacilityUnitExists: async (id) => id === "dept1",
    };
    const result = await resolveResourceContext(
      { resourceType: "STUDY", performingUnitId: "dept1" },
      defaultTree, deps
    );
    assert(result.classified === true, "Should be classified");
    assert(result.facilityUnitId === "dept1", "facilityUnitId mismatch");
    assert(result.ancestorUnitIds.includes("hosp1"), "Should include hosp1 as ancestor");
    assert(result.ancestorUnitIds.includes("chain1"), "Should include chain1 as ancestor");
  });
  
  await run("falls back to stationAeTitle when no performingUnitId", async () => {
    const deps: ResourceContextDeps = {
      findDicomNodesByAeTitle: async () => [{ id: "node1", aeTitle: "CT1", isActive: true, facilityId: "room1" }],
      findDicomNodeById: async () => null,
      findFacilityUnitExists: async () => false,
    };
    const result = await resolveResourceContext(
      { resourceType: "STUDY", stationAeTitle: "CT1" },
      defaultTree, deps
    );
    assert(result.classified === true, "Should be classified via AE");
    assert(result.facilityUnitId === "room1", "facilityUnitId mismatch");
    assert(result.dicomNodeId === "node1", "dicomNodeId mismatch");
  });
  
  await run("returns unclassified when nothing resolves", async () => {
    const deps: ResourceContextDeps = {
      findDicomNodesByAeTitle: async () => [],
      findDicomNodeById: async () => null,
      findFacilityUnitExists: async () => false,
    };
    const result = await resolveResourceContext(
      { resourceType: "STUDY" },
      defaultTree, deps
    );
    assert(result.classified === false, "Should be unclassified");
  });
  
  await run("uses machineId for NonDicom when no performingUnitId", async () => {
    const deps: ResourceContextDeps = {
      findDicomNodesByAeTitle: async () => [],
      findDicomNodeById: async (id) => id === "machine1" ? { id: "machine1", facilityId: "dept1", aeTitle: "ND1", isActive: true } : null,
      findFacilityUnitExists: async () => false,
    };
    const result = await resolveResourceContext(
      { resourceType: "NON_DICOM", machineId: "machine1" },
      defaultTree, deps
    );
    assert(result.classified === true, "Should be classified via machineId");
    assert(result.facilityUnitId === "dept1", "facilityUnitId mismatch");
  });
  
  await run("facilityId valid + machineId inactive => classified=false and RESOURCE_INACTIVE", async () => {
    const deps: ResourceContextDeps = {
      findDicomNodesByAeTitle: async () => [],
      findDicomNodeById: async (id) => id === "machine1" ? { id: "machine1", facilityId: "dept1", aeTitle: "ND1", isActive: false } : null,
      findFacilityUnitExists: async () => true,
    };
    const result = await resolveResourceContext(
      { resourceType: "NON_DICOM", facilityId: "dept1", machineId: "machine1" },
      defaultTree, deps
    );
    assert(result.classified === false, "Should be unclassified due to inactive machine");
    assert(result.aeResolution.status === "RESOURCE_INACTIVE", "Status should be RESOURCE_INACTIVE");
  });
  
  await run("machineId inactive + stationAeTitle active => deny RESOURCE_INACTIVE", async () => {
    const deps: ResourceContextDeps = {
      findDicomNodesByAeTitle: async (ae) => ae === "CT1" ? [{ id: "node2", aeTitle: "CT1", isActive: true, facilityId: "room1" }] : [],
      findDicomNodeById: async (id) => id === "machine1" ? { id: "machine1", facilityId: "dept1", aeTitle: "ND1", isActive: false } : null,
      findFacilityUnitExists: async () => true,
    };
    const result = await resolveResourceContext(
      { resourceType: "STUDY", machineId: "machine1", stationAeTitle: "CT1" },
      defaultTree, deps
    );
    assert(result.classified === false, "Should be unclassified due to inactive machine");
    assert(result.aeResolution.status === "RESOURCE_INACTIVE", "Status should be RESOURCE_INACTIVE and not overwritten by AE resolver");
  });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PRINCIPAL LOADER TESTS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  console.log("\n--- Principal Loader ---");
  
  await run("loads principal with correct permissions", async () => {
    const deps: PrincipalLoaderDeps = {
      findUserById: async () => ({
        id: "user1", role: "DOCTOR", isActive: true,
        roleProfileId: null, roleProfile: null,
      }),
    };
    const p = await loadPrincipal("user1", deps);
    assert(p !== null, "Principal should not be null");
    assert(p!.baseRole === "DOCTOR", "baseRole mismatch");
    assert(p!.globalPermissions.includes("studies.read"), "Should have studies.read");
  });
  
  await run("returns null for non-existent user", async () => {
    const deps: PrincipalLoaderDeps = { findUserById: async () => null };
    const p = await loadPrincipal("unknown", deps);
    assert(p === null, "Should return null");
  });
  
  await run("uses roleProfile permissions when active", async () => {
    const deps: PrincipalLoaderDeps = {
      findUserById: async () => ({
        id: "user1", role: "DOCTOR", isActive: true,
        roleProfileId: "rp1",
        roleProfile: { id: "rp1", permissions: ["studies.read", "reports.read"], isActive: true, baseRole: "DOCTOR" },
      }),
    };
    const p = await loadPrincipal("user1", deps);
    assert(p !== null, "Principal should not be null");
    assert(p!.globalPermissions.length === 2, `Expected 2 permissions, got ${p!.globalPermissions.length}`);
  });
  
  await run("caches principal in request context", async () => {
    let callCount = 0;
    const deps: PrincipalLoaderDeps = {
      findUserById: async () => { callCount++; return { id: "u1", role: "DOCTOR", isActive: true, roleProfileId: null, roleProfile: null }; },
    };
    const ctx = ScopeRequestContext.create();
    await loadPrincipal("u1", deps, ctx);
    await loadPrincipal("u1", deps, ctx);
    assert(callCount === 1, `Expected 1 DB call, got ${callCount}`);
  });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // GRANT REPOSITORY TESTS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  console.log("\n--- Grant Repository ---");
  
  await run("ALLOW grant at resource's facility → allowed", async () => {
    const deps: GrantRepositoryDeps = {
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "dept1", effect: "ALLOW" }),
      ],
      findGrantsByRoleProfileAndCapability: async () => [],
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1", "chain1"],
      dicomNodeId: null, facilityUnitId: "dept1",
      aeResolution: { status: "MISSING_IDENTIFIER" as const, dicomNodeId: null, facilityUnitId: null, aeTitle: null },
      classified: true,
    };
    const result = await evaluateGrants(makePrincipal(), "READ_STUDY", resourceCtx, defaultTree, deps);
    assert(result.allowed === true, "Should be allowed");
    assert(result.hasMatchingOpinion === true, "Should have opinion");
  });
  
  await run("DENY always wins over ALLOW", async () => {
    const deps: GrantRepositoryDeps = {
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "hosp1", effect: "ALLOW", includeDescendants: true }),
        makeGrant({ userId: "user1", facilityUnitId: "dept1", effect: "DENY" }),
      ],
      findGrantsByRoleProfileAndCapability: async () => [],
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1", "chain1"],
      dicomNodeId: null, facilityUnitId: "dept1",
      aeResolution: { status: "MISSING_IDENTIFIER" as const, dicomNodeId: null, facilityUnitId: null, aeTitle: null },
      classified: true,
    };
    const result = await evaluateGrants(makePrincipal(), "READ_STUDY", resourceCtx, defaultTree, deps);
    assert(result.allowed === false, "DENY should win");
    assert(result.traces.some(t => t.effect === "DENY"), "Should have DENY trace");
  });
  
  await run("Grant at parent with includeDescendants applies to child", async () => {
    const deps: GrantRepositoryDeps = {
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "hosp1", effect: "ALLOW", includeDescendants: true }),
      ],
      findGrantsByRoleProfileAndCapability: async () => [],
    };
    const resourceCtx = {
      performingUnitId: "room1", ancestorUnitIds: ["dept1", "hosp1", "chain1"],
      dicomNodeId: null, facilityUnitId: "room1",
      aeResolution: { status: "MISSING_IDENTIFIER" as const, dicomNodeId: null, facilityUnitId: null, aeTitle: null },
      classified: true,
    };
    const result = await evaluateGrants(makePrincipal(), "READ_STUDY", resourceCtx, defaultTree, deps);
    assert(result.allowed === true, "Inherited grant should allow");
    assert(result.traces[0].matchType === "INHERITED", "Match should be INHERITED");
  });
  
  await run("Grant at parent without includeDescendants does NOT apply to child", async () => {
    const deps: GrantRepositoryDeps = {
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "hosp1", effect: "ALLOW", includeDescendants: false }),
      ],
      findGrantsByRoleProfileAndCapability: async () => [],
    };
    const resourceCtx = {
      performingUnitId: "room1", ancestorUnitIds: ["dept1", "hosp1", "chain1"],
      dicomNodeId: null, facilityUnitId: "room1",
      aeResolution: { status: "MISSING_IDENTIFIER" as const, dicomNodeId: null, facilityUnitId: null, aeTitle: null },
      classified: true,
    };
    const result = await evaluateGrants(makePrincipal(), "READ_STUDY", resourceCtx, defaultTree, deps);
    assert(result.allowed === false, "Should not inherit without includeDescendants");
  });
  
  await run("DENY at child blocks resource in that subtree even with parent ALLOW", async () => {
    const deps: GrantRepositoryDeps = {
      findGrantsByUserAndCapability: async () => [
        makeGrant({ id: "g1", userId: "user1", facilityUnitId: "chain1", effect: "ALLOW", includeDescendants: true }),
        makeGrant({ id: "g2", userId: "user1", facilityUnitId: "dept1", effect: "DENY", includeDescendants: true }),
      ],
      findGrantsByRoleProfileAndCapability: async () => [],
    };
    // Resource in room1 under dept1
    const resourceCtx = {
      performingUnitId: "room1", ancestorUnitIds: ["dept1", "hosp1", "chain1"],
      dicomNodeId: null, facilityUnitId: "room1",
      aeResolution: { status: "MISSING_IDENTIFIER" as const, dicomNodeId: null, facilityUnitId: null, aeTitle: null },
      classified: true,
    };
    const result = await evaluateGrants(makePrincipal(), "READ_STUDY", resourceCtx, defaultTree, deps);
    assert(result.allowed === false, "DENY at dept1 should block room1");
  });
  
  await run("Expired grant is ignored", async () => {
    const past = new Date(Date.now() - 86400000);
    const deps: GrantRepositoryDeps = {
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "dept1", effect: "ALLOW", validUntil: past }),
      ],
      findGrantsByRoleProfileAndCapability: async () => [],
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1", "chain1"],
      dicomNodeId: null, facilityUnitId: "dept1",
      aeResolution: { status: "MISSING_IDENTIFIER" as const, dicomNodeId: null, facilityUnitId: null, aeTitle: null },
      classified: true,
    };
    const result = await evaluateGrants(makePrincipal(), "READ_STUDY", resourceCtx, defaultTree, deps);
    assert(result.allowed === false, "Expired grant should be ignored");
  });
  
  await run("Future grant is ignored", async () => {
    const future = new Date(Date.now() + 86400000);
    const deps: GrantRepositoryDeps = {
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "dept1", effect: "ALLOW", validFrom: future }),
      ],
      findGrantsByRoleProfileAndCapability: async () => [],
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1", "chain1"],
      dicomNodeId: null, facilityUnitId: "dept1",
      aeResolution: { status: "MISSING_IDENTIFIER" as const, dicomNodeId: null, facilityUnitId: null, aeTitle: null },
      classified: true,
    };
    const result = await evaluateGrants(makePrincipal(), "READ_STUDY", resourceCtx, defaultTree, deps);
    assert(result.allowed === false, "Future grant should be ignored");
  });
  
  await run("User grant combined with roleProfile grant — DENY from roleProfile wins", async () => {
    const deps: GrantRepositoryDeps = {
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "hosp1", effect: "ALLOW", includeDescendants: true }),
      ],
      findGrantsByRoleProfileAndCapability: async () => [
        makeGrant({ roleProfileId: "rp1", facilityUnitId: "dept1", effect: "DENY" }),
      ],
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1", "chain1"],
      dicomNodeId: null, facilityUnitId: "dept1",
      aeResolution: { status: "MISSING_IDENTIFIER" as const, dicomNodeId: null, facilityUnitId: null, aeTitle: null },
      classified: true,
    };
    const principal = makePrincipal({ roleProfileId: "rp1" });
    const result = await evaluateGrants(principal, "READ_STUDY", resourceCtx, defaultTree, deps);
    assert(result.allowed === false, "DENY from roleProfile should win");
  });
  
  await run("Grant with inactive facilityUnit is skipped", async () => {
    const deps: GrantRepositoryDeps = {
      findGrantsByUserAndCapability: async () => [
        makeGrant({
          userId: "user1", facilityUnitId: "dept1", effect: "ALLOW",
          facilityUnit: { isActive: false },
        }),
      ],
      findGrantsByRoleProfileAndCapability: async () => [],
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1", "chain1"],
      dicomNodeId: null, facilityUnitId: "dept1",
      aeResolution: { status: "MISSING_IDENTIFIER" as const, dicomNodeId: null, facilityUnitId: null, aeTitle: null },
      classified: true,
    };
    const result = await evaluateGrants(makePrincipal(), "READ_STUDY", resourceCtx, defaultTree, deps);
    assert(result.allowed === false, "Grant with inactive facility should be skipped");
  });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // LEGACY ADAPTER TESTS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  console.log("\n--- Legacy Scope Adapter ---");
  
  await run("No row = no opinion (not DENY)", async () => {
    const deps: LegacyAdapterDeps = {
      findLegacyPermissions: async () => [],
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1"],
      dicomNodeId: "node1", facilityUnitId: "dept1",
      aeResolution: { status: "MATCHED" as const, dicomNodeId: "node1", facilityUnitId: "dept1", aeTitle: "CT1" },
      classified: true,
    };
    const result = await evaluateLegacyPermissions(makePrincipal(), "READ_STUDY", resourceCtx, deps);
    assert(result.hasMatchingOpinion === false, "No row should mean no opinion");
    assert(result.allowed === false, "allowed should be false (no opinion default)");
  });
  
  await run("allow=true row → explicit ALLOW", async () => {
    const deps: LegacyAdapterDeps = {
      findLegacyPermissions: async () => [
        { id: "lp1", doctorId: "user1", dicomNodeId: "node1", actionKey: "READ_STUDY", allow: true },
      ],
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1"],
      dicomNodeId: "node1", facilityUnitId: "dept1",
      aeResolution: { status: "MATCHED" as const, dicomNodeId: "node1", facilityUnitId: "dept1", aeTitle: "CT1" },
      classified: true,
    };
    const result = await evaluateLegacyPermissions(makePrincipal(), "READ_STUDY", resourceCtx, deps);
    assert(result.hasMatchingOpinion === true, "Should have opinion");
    assert(result.allowed === true, "Should be allowed");
    assert(result.traces[0].source === "LEGACY", "Source should be LEGACY");
  });
  
  await run("allow=false row → explicit DENY", async () => {
    const deps: LegacyAdapterDeps = {
      findLegacyPermissions: async () => [
        { id: "lp1", doctorId: "user1", dicomNodeId: "node1", actionKey: "READ_STUDY", allow: false },
      ],
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1"],
      dicomNodeId: "node1", facilityUnitId: "dept1",
      aeResolution: { status: "MATCHED" as const, dicomNodeId: "node1", facilityUnitId: "dept1", aeTitle: "CT1" },
      classified: true,
    };
    const result = await evaluateLegacyPermissions(makePrincipal(), "READ_STUDY", resourceCtx, deps);
    assert(result.hasMatchingOpinion === true, "Should have opinion");
    assert(result.allowed === false, "Should be denied");
    assert(result.traces[0].effect === "DENY", "Effect should be DENY");
  });
  
  await run("Non-DICOM capability returns no opinion (no legacy mapping)", async () => {
    const deps: LegacyAdapterDeps = {
      findLegacyPermissions: async () => [],
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1"],
      dicomNodeId: null, facilityUnitId: "dept1",
      aeResolution: { status: "MISSING_IDENTIFIER" as const, dicomNodeId: null, facilityUnitId: null, aeTitle: null },
      classified: true,
    };
    const result = await evaluateLegacyPermissions(makePrincipal(), "NON_DICOM_READ", resourceCtx, deps);
    assert(result.hasMatchingOpinion === false, "Non-DICOM should have no legacy opinion");
  });
  
  await run("Legacy perms cached in request context", async () => {
    let callCount = 0;
    const deps: LegacyAdapterDeps = {
      findLegacyPermissions: async () => { callCount++; return []; },
    };
    const resourceCtx = {
      performingUnitId: "dept1", ancestorUnitIds: ["hosp1"],
      dicomNodeId: "node1", facilityUnitId: "dept1",
      aeResolution: { status: "MATCHED" as const, dicomNodeId: "node1", facilityUnitId: "dept1", aeTitle: "CT1" },
      classified: true,
    };
    const ctx = ScopeRequestContext.create();
    await evaluateLegacyPermissions(makePrincipal(), "READ_STUDY", resourceCtx, deps, ctx);
    await evaluateLegacyPermissions(makePrincipal(), "READ_STUDY", resourceCtx, deps, ctx);
    assert(callCount === 1, `Expected 1 DB call, got ${callCount}`);
  });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SCOPE RESOLVER (INTEGRATION) TESTS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  console.log("\n--- Scope Resolver ---");
  
  // Override the loadOrganizationTree module for tests
  // We mock it by setting tree in the context
  function makeScopeResolverDeps(overrides: Partial<ScopeResolverDeps> = {}): ScopeResolverDeps {
    return {
      findUserById: async () => ({
        id: "user1", role: "DOCTOR", isActive: true,
        roleProfileId: null, roleProfile: null,
      }),
      findDicomNodesByAeTitle: async () => [],
      findDicomNodeById: async () => null,
      findFacilityUnitExists: async (id) => ["chain1", "hosp1", "dept1", "dept2", "room1", "room2", "room3"].includes(id),
      findGrantsByUserAndCapability: async () => [],
      findGrantsByRoleProfileAndCapability: async () => [],
      findLegacyPermissions: async () => [],
      ...overrides,
    };
  }
  
  await run("OFF mode: effectiveAllowed = baselineAllowed regardless of scope", async () => {
    const originalMode = process.env.AUTHORIZATION_MODE;
    process.env.AUTHORIZATION_MODE = "";
  
    const deps = makeScopeResolverDeps();
    const ctx = ScopeRequestContext.create();
    ctx.setTree(defaultTree);
  
    const result = await resolveScope("user1", "READ_STUDY", { resourceType: "STUDY", performingUnitId: "dept1" }, deps, ctx);
    assert(result.effectiveAllowed === true, "OFF: baseline has studies.read, so effectiveAllowed should be true");
    assert(result.baselineAllowed === true, "baseline should be true");
    assert(result.mode === "OFF", `Mode should be OFF, got ${result.mode}`);
  
    process.env.AUTHORIZATION_MODE = originalMode || "";
  });
  
  await run("SHADOW mode: effectiveAllowed = baselineAllowed, logs divergence", async () => {
    const originalMode = process.env.AUTHORIZATION_MODE;
    process.env.AUTHORIZATION_MODE = "SHADOW";
  
    const warnMessages: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => { warnMessages.push(args.join(" ")); };
  
    const deps = makeScopeResolverDeps({
      findGrantsByUserAndCapability: async () => [
        // Grant that would DENY in ENFORCE
        makeGrant({ userId: "user1", facilityUnitId: "dept1", effect: "DENY" }),
      ],
    });
    const ctx = ScopeRequestContext.create();
    ctx.setTree(defaultTree);
  
    const result = await resolveScope("user1", "READ_STUDY", { resourceType: "STUDY", performingUnitId: "dept1" }, deps, ctx);
    assert(result.effectiveAllowed === true, "SHADOW: effectiveAllowed should still be baselineAllowed=true");
    assert(result.proposedAllowed === false, "proposed should be false (DENY grant)");
    assert(warnMessages.some(m => m.includes("SHADOW divergence")), "Should log divergence");
  
    console.warn = originalWarn;
    process.env.AUTHORIZATION_MODE = originalMode || "";
  });
  
  await run("ENFORCE mode: effectiveAllowed = baselineAllowed && proposedAllowed", async () => {
    const originalMode = process.env.AUTHORIZATION_MODE;
    process.env.AUTHORIZATION_MODE = "ENFORCE";
  
    const deps = makeScopeResolverDeps({
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "dept1", effect: "ALLOW" }),
      ],
    });
    const ctx = ScopeRequestContext.create();
    ctx.setTree(defaultTree);
  
    const result = await resolveScope("user1", "READ_STUDY", { resourceType: "STUDY", performingUnitId: "dept1" }, deps, ctx);
    assert(result.effectiveAllowed === true, "ENFORCE: baseline + ALLOW grant = allowed");
    assert(result.proposedAllowed === true, "proposed should be true");
  
    process.env.AUTHORIZATION_MODE = originalMode || "";
  });
  
  await run("ENFORCE mode: denied by scope even with global permission", async () => {
    const originalMode = process.env.AUTHORIZATION_MODE;
    process.env.AUTHORIZATION_MODE = "ENFORCE";
  
    const deps = makeScopeResolverDeps({
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "dept1", effect: "DENY" }),
      ],
    });
    const ctx = ScopeRequestContext.create();
    ctx.setTree(defaultTree);
  
    const result = await resolveScope("user1", "READ_STUDY", { resourceType: "STUDY", performingUnitId: "dept1" }, deps, ctx);
    assert(result.effectiveAllowed === false, "ENFORCE: DENY grant should block");
    assert(result.baselineAllowed === true, "baseline still true");
    assert(result.proposedAllowed === false, "proposed false");
  
    process.env.AUTHORIZATION_MODE = originalMode || "";
  });
  
  await run("ADMIN always allowed", async () => {
    const originalMode = process.env.AUTHORIZATION_MODE;
    process.env.AUTHORIZATION_MODE = "ENFORCE";
  
    const deps = makeScopeResolverDeps({
      findUserById: async () => ({
        id: "admin1", role: "ADMIN", isActive: true,
        roleProfileId: null, roleProfile: null,
      }),
    });
    const ctx = ScopeRequestContext.create();
    ctx.setTree(defaultTree);
  
    const result = await resolveScope("admin1", "READ_STUDY", { resourceType: "STUDY", performingUnitId: "dept1" }, deps, ctx);
    assert(result.effectiveAllowed === true, "ADMIN should always be allowed");
    assert(result.reasonCode === "ADMIN_BYPASS", "Reason should be ADMIN_BYPASS");
  
    process.env.AUTHORIZATION_MODE = originalMode || "";
  });
  
  await run("ENFORCE: unclassified resource is denied", async () => {
    const originalMode = process.env.AUTHORIZATION_MODE;
    process.env.AUTHORIZATION_MODE = "ENFORCE";
  
    const deps = makeScopeResolverDeps({
      findFacilityUnitExists: async () => false,
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "hosp1", effect: "ALLOW", includeDescendants: true }),
      ],
    });
    const ctx = ScopeRequestContext.create();
    ctx.setTree(defaultTree);
  
    const result = await resolveScope("user1", "READ_STUDY", { resourceType: "STUDY" }, deps, ctx);
    assert(result.effectiveAllowed === false, "ENFORCE: unclassified resource should be denied");
    assert(result.reasonCode === "RESOURCE_UNCLASSIFIED" || result.reasonCode === "NO_SCOPE_GRANT",
      `Reason should indicate unclassified, got ${result.reasonCode}`);
  
    process.env.AUTHORIZATION_MODE = originalMode || "";
  });
  
  await run("ENFORCE: ambiguous AE title is denied", async () => {
    const originalMode = process.env.AUTHORIZATION_MODE;
    process.env.AUTHORIZATION_MODE = "ENFORCE";
  
    const deps = makeScopeResolverDeps({
      findFacilityUnitExists: async () => false,
      findDicomNodesByAeTitle: async () => [
        { id: "n1", aeTitle: "CT1", isActive: true, facilityId: "dept1" },
        { id: "n2", aeTitle: "CT1", isActive: true, facilityId: "dept2" },
      ],
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "hosp1", effect: "ALLOW", includeDescendants: true }),
      ],
    });
    const ctx = ScopeRequestContext.create();
    ctx.setTree(defaultTree);
  
    const result = await resolveScope("user1", "READ_STUDY", { resourceType: "STUDY", stationAeTitle: "CT1" }, deps, ctx);
    assert(result.effectiveAllowed === false, "ENFORCE: ambiguous AE should be denied");
    assert(result.reasonCode === "AMBIGUOUS_MACHINE", `Reason should be AMBIGUOUS_MACHINE, got ${result.reasonCode}`);
  
    process.env.AUTHORIZATION_MODE = originalMode || "";
  });
  
  await run("Missing global permission → denied regardless of mode", async () => {
    const originalMode = process.env.AUTHORIZATION_MODE;
    process.env.AUTHORIZATION_MODE = "ENFORCE";
  
    const deps = makeScopeResolverDeps({
      findUserById: async () => ({
        id: "user1", role: "RECEPTION", isActive: true,
        roleProfileId: "rp1",
        roleProfile: { id: "rp1", permissions: ["worklist.manage"], isActive: true, baseRole: "RECEPTION" },
      }),
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "dept1", effect: "ALLOW" }),
      ],
    });
    const ctx = ScopeRequestContext.create();
    ctx.setTree(defaultTree);
  
    const result = await resolveScope("user1", "READ_STUDY", { resourceType: "STUDY", performingUnitId: "dept1" }, deps, ctx);
    assert(result.effectiveAllowed === false, "No global permission → denied");
    assert(result.reasonCode === "GLOBAL_PERMISSION_MISSING", `Reason should be GLOBAL_PERMISSION_MISSING, got ${result.reasonCode}`);
  
    process.env.AUTHORIZATION_MODE = originalMode || "";
  });
  
  await run("DicomNode grant does not match facility-only resource", async () => {
    const originalMode = process.env.AUTHORIZATION_MODE;
    process.env.AUTHORIZATION_MODE = "ENFORCE";

    const deps = makeScopeResolverDeps({
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", dicomNodeId: "nodeA", effect: "ALLOW" }),
      ],
      findFacilityUnitExists: async () => true,
    });
    const ctx = ScopeRequestContext.create();
    ctx.setTree(defaultTree);

    // Resource only has facilityUnitId="D1"
    const result = await resolveScope("user1", "READ_STUDY", { resourceType: "STUDY", performingUnitId: "dept1" }, deps, ctx);
    
    // Evaluation shouldn't match
    assert(result.effectiveAllowed === false, "Should not be allowed based on dicomNode grant only");
    assert(result.reasonCode === "NO_SCOPE_GRANT", "Should result in NO_SCOPE_GRANT because no grants matched the resource");

    process.env.AUTHORIZATION_MODE = originalMode || "";
  });

  await run("ENFORCE mode: denies if machineId is inactive even with performingUnitId and facility ALLOW", async () => {
    const originalMode = process.env.AUTHORIZATION_MODE;
    process.env.AUTHORIZATION_MODE = "ENFORCE";

    const deps = makeScopeResolverDeps({
      findGrantsByUserAndCapability: async () => [
        makeGrant({ userId: "user1", facilityUnitId: "dept1", effect: "ALLOW", includeDescendants: true }),
      ],
      findFacilityUnitExists: async () => true,
      findDicomNodeById: async (id) => id === "machine1" ? { id: "machine1", facilityId: "dept1", aeTitle: "ND1", isActive: false } : null,
    });
    const ctx = ScopeRequestContext.create();
    ctx.setTree(defaultTree);

    // Resource has valid performingUnitId="dept1" AND machineId="machine1" (which is inactive)
    const result = await resolveScope("user1", "READ_STUDY", { resourceType: "STUDY", performingUnitId: "dept1", machineId: "machine1" }, deps, ctx);
    
    assert(result.effectiveAllowed === false, "Should be denied due to inactive machine");
    assert(result.reasonCode === "RESOURCE_INACTIVE", `Reason should be RESOURCE_INACTIVE, got ${result.reasonCode}`);

    process.env.AUTHORIZATION_MODE = originalMode || "";
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // REQUEST CONTEXT ISOLATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  console.log("\n--- Request Context Isolation ---");
  
  await run("Separate contexts do not share cached data", async () => {
    const ctx1 = ScopeRequestContext.create();
    const ctx2 = ScopeRequestContext.create();
  
    const principal = makePrincipal({ userId: "testuser" });
    ctx1.setPrincipal("testuser", principal);
  
    assert(ctx1.getPrincipal("testuser") !== undefined, "ctx1 should have cached principal");
    assert(ctx2.getPrincipal("testuser") === undefined, "ctx2 should NOT have ctx1's principal");
  });
  
  await run("Context does not leak tree between requests", () => {
    const ctx1 = ScopeRequestContext.create();
    const ctx2 = ScopeRequestContext.create();
  
    ctx1.setTree(defaultTree);
    assert(ctx1.getTree() !== null, "ctx1 should have tree");
    assert(ctx2.getTree() === null, "ctx2 should NOT have ctx1's tree");
  });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════════
  
  console.log(`\n═══ RESULTS: ${passCount} passed, ${failCount} failed ═══\n`);
  if (failCount > 0) {
    process.exitCode = 1;
  }
  
}
main().catch(e => { console.error(e); process.exitCode = 1; });
