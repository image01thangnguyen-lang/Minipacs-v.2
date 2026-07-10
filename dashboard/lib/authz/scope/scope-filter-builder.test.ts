import { applyScopeFilterToPrisma, buildScopeFilter } from "./scope-filter-builder";
import { OrganizationTree } from "./organization-tree";
import type { ScopePrincipal } from "./scope-decision";
import type { AccessScopeGrantRow } from "./grant-repository";
import type { FilterBuilderDeps } from "./scope-filter-builder";

// --- Mocks & Data ---
function makeDeps(overrides?: Partial<FilterBuilderDeps>): FilterBuilderDeps {
  return {
    findUserById: async () =>
      ({
        id: "u1",
        fullName: "User 1",
        role: "DOCTOR",
        roleProfileId: null,
        globalPermissions: ["studies.read"],
        isActive: true,
        clinicProfileId: null,
        signatureImageId: null,
        twoFactorEnabled: false,
      }) as any,
    findRoleProfileById: async () => null,
    findGrantsByUserAndCapability: async () => [],
    findGrantsByRoleProfileAndCapability: async () => [],
    findAllGrantsForUser: async () => [],
    findAllGrantsForRoleProfile: async () => [],
    findDeniedAeTitles: async () => [],
    findAllowedLegacyAeTitles: async () => [],
    findUniqueActiveAeTitles: async () => ["A", "B", "C"],
    ...overrides,
  } as unknown as FilterBuilderDeps;
}

import { ScopeRequestContext } from "./scope-request-context";

function makeCtx(): ScopeRequestContext {
  const ctx = ScopeRequestContext.create();
  ctx.setTree(tree);
  return ctx;
}

const defaultTreeData = [
  { id: "C1", parentId: null, type: "CHAIN" },
  { id: "H1", parentId: "C1", type: "HOSPITAL" },
  { id: "D1", parentId: "H1", type: "DEPARTMENT" }, // H1 -> D1
  { id: "D2", parentId: "H1", type: "DEPARTMENT" }, // H1 -> D2
];
const tree = new OrganizationTree(defaultTreeData as any[]);

function makeGrant(
  effect: "ALLOW" | "DENY",
  overrides?: Partial<AccessScopeGrantRow>,
): AccessScopeGrantRow {
  const facilityUnitId = overrides?.facilityUnitId || null;
  const dicomNodeId = overrides?.dicomNodeId || null;
  return {
    id: "g1",
    userId: "u1",
    roleProfileId: null,
    capability: "READ_STUDY",
    effect,
    includeDescendants: true,
    facilityUnitId,
    dicomNodeId,
    validFrom: null,
    validUntil: null,
    facilityUnit: facilityUnitId ? { isActive: true } : undefined,
    dicomNode: dicomNodeId ? { isActive: true, facilityId: null } : undefined,
    ...overrides,
  } as AccessScopeGrantRow;
}

// --- Test Runner ---
let passed = 0;
let failed = 0;

async function run(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } catch (err: any) {
    failed++;
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// --- Tests ---
async function main() {
  console.log("\n--- Scope Filter Builder ---");
  process.env.AUTHORIZATION_MODE = "ENFORCE";

  await run("OFF/SHADOW không filter", async () => {
    process.env.AUTHORIZATION_MODE = "OFF";
    const result = await buildScopeFilter(
      "u1",
      "READ_STUDY",
      "STUDY",
      makeDeps(),
      makeCtx(),
    );
    assert(result.shouldFilter === false, "OFF mode should not filter");

    process.env.AUTHORIZATION_MODE = "SHADOW";
    const result2 = await buildScopeFilter(
      "u1",
      "READ_STUDY",
      "STUDY",
      makeDeps(),
      makeCtx(),
    );
    assert(result2.shouldFilter === false, "SHADOW mode should not filter");
    process.env.AUTHORIZATION_MODE = "ENFORCE";
  });

  await run(
    "ENFORCE user inactive/missing global permission => empty filter",
    async () => {
      const deps = makeDeps({
        findUserById: async () =>
          ({
            id: "u1",
            fullName: "User 1",
            role: "DOCTOR",
            roleProfileId: null,
            isActive: false, // User inactive
          }) as any,
      });
      const result = await buildScopeFilter(
        "u1",
        "READ_STUDY",
        "STUDY",
        deps,
        makeCtx(),
      );
      assert(result.shouldFilter === true, "Should filter");
      assert(result.allowedUnitIds.length === 0, "No units allowed");
      assert(
        result.reason.includes("inactive"),
        "Reason should indicate inactive user",
      );
    },
  );

  await run("parent ALLOW + child DENY => exclude child", async () => {
    const deps = makeDeps({
      findAllGrantsForUser: async () => [
        makeGrant("ALLOW", { facilityUnitId: "H1", includeDescendants: true }),
        makeGrant("DENY", { facilityUnitId: "D2", includeDescendants: true }),
      ],
    });
    const result = await buildScopeFilter(
      "u1",
      "READ_STUDY",
      "STUDY",
      deps,
      makeCtx(),
    );
    assert(result.shouldFilter === true, "Should filter");
    assert(result.globalAllow === false, "Not global allow");
    // H1 and D1 should be allowed, D2 is denied
    assert(result.allowedUnitIds.includes("H1"), "H1 allowed");
    assert(result.allowedUnitIds.includes("D1"), "D1 allowed");
    assert(!result.allowedUnitIds.includes("D2"), "D2 removed from allowed");
    assert(result.deniedUnitIds.includes("D2"), "D2 in denied");
  });

  await run("global ALLOW + DENY hole => không noFilter", async () => {
    const deps = makeDeps({
      findAllGrantsForUser: async () => [
        makeGrant("ALLOW", { facilityUnitId: null, dicomNodeId: null }), // Global allow
        makeGrant("DENY", { facilityUnitId: "D2", includeDescendants: true }),
      ],
    });
    const result = await buildScopeFilter(
      "u1",
      "READ_STUDY",
      "STUDY",
      deps,
      makeCtx(),
    );
    assert(result.shouldFilter === true, "Should filter because of DENY hole");
    assert(result.globalAllow === true, "globalAllow is true");
    assert(result.deniedUnitIds.includes("D2"), "D2 denied");
  });

  await run("global ALLOW vẫn lọc resource chưa phân loại", async () => {
    const deps = makeDeps({
      findAllGrantsForUser: async () => [
        makeGrant("ALLOW", { facilityUnitId: null, dicomNodeId: null }), // Global allow
      ],
    });
    const result = await buildScopeFilter(
      "u1",
      "READ_STUDY",
      "STUDY",
      deps,
      makeCtx(),
    );
    assert(result.shouldFilter === true, "Global grant must still classify rows");
    assert(result.globalAllow === true, "globalAllow remains explicit");
    assert(result.allowedUnitIds.includes("H1"), "Active tree units are allowed");
  });

  await run("global ALLOW Prisma filter requires an active classification", async () => {
    const where = applyScopeFilterToPrisma(
      {
        mode: "ENFORCE",
        globalAllow: true,
        shouldFilter: true,
        allowedUnitIds: ["H1", "D1"],
        deniedUnitIds: ["D2"],
        allowedAeTitles: ["A"],
        deniedAeTitles: ["B"],
        allowedDicomNodeIds: [],
        deniedDicomNodeIds: [],
        reason: "test",
      },
      "performingUnitId",
      "stationAeTitle",
    ) as any;

    assert(Array.isArray(where.AND), "Expected an AND clause");
    assert(
      where.AND.some((condition: any) => Array.isArray(condition.OR)
        && condition.OR.some((item: any) => item.performingUnitId?.in?.includes("H1"))
        && condition.OR.some((item: any) => item.stationAeTitle?.in?.includes("A"))),
      "Global ALLOW must require a known unit or AE Title",
    );
  });

  await run("empty ENFORCE scope creates a fail-closed Prisma filter", async () => {
    const where = applyScopeFilterToPrisma(
      {
        mode: "ENFORCE",
        globalAllow: false,
        shouldFilter: true,
        allowedUnitIds: [],
        deniedUnitIds: [],
        allowedAeTitles: [],
        deniedAeTitles: [],
        allowedDicomNodeIds: [],
        deniedDicomNodeIds: [],
        reason: "test",
      },
      "performingUnitId",
      "stationAeTitle",
    );
    assert(where.id === "force-empty-result", "Empty scope must not produce an unfiltered query");
  });

  await run("ambiguous AE title không lọt vào allowedAeTitles", async () => {
    const deps = makeDeps({
      findAllGrantsForUser: async () => [],
      findAllowedLegacyAeTitles: async () => [
        { aeTitle: "A", dicomNodeId: "n1" },
        { aeTitle: "AMBIGUOUS", dicomNodeId: "n2" },
      ],
      findUniqueActiveAeTitles: async () => ["A", "B", "C"], // AMBIGUOUS is missing from unique list
    });
    const result = await buildScopeFilter(
      "u1",
      "READ_STUDY",
      "STUDY",
      deps,
      makeCtx(),
    );
    assert(result.allowedAeTitles.includes("A"), "A is allowed");
    assert(
      !result.allowedAeTitles.includes("AMBIGUOUS"),
      "AMBIGUOUS is excluded",
    );
  });

  await run("denied AE loại khỏi allowed AE", async () => {
    const deps = makeDeps({
      findAllGrantsForUser: async () => [],
      findAllowedLegacyAeTitles: async () => [
        { aeTitle: "A", dicomNodeId: "n1" },
      ],
      findDeniedAeTitles: async () => ["A"],
      findUniqueActiveAeTitles: async () => ["A", "B", "C"],
    });
    const result = await buildScopeFilter(
      "u1",
      "READ_STUDY",
      "STUDY",
      deps,
      makeCtx(),
    );
    assert(!result.allowedAeTitles.includes("A"), "A is excluded due to deny");
    assert(result.deniedAeTitles.includes("A"), "A is in denied list");
  });

  await run(
    "DicomNode grant is isolated and does not expand to facility",
    async () => {
      const deps = makeDeps({
        findAllGrantsForUser: async () => [
          makeGrant("ALLOW", {
            facilityUnitId: null,
            dicomNodeId: "nodeA",
            dicomNode: {
              id: "nodeA",
              facilityId: "D1",
              isActive: true,
              aeTitle: "NODE_A",
              classified: true,
            } as any,
          }),
        ],
      });
      const result = await buildScopeFilter(
        "u1",
        "READ_STUDY",
        "STUDY",
        deps,
        makeCtx(),
      );

      assert(result.shouldFilter === true, "Should filter");
      assert(
        result.allowedDicomNodeIds.includes("nodeA"),
        "nodeA should be in allowedDicomNodeIds",
      );
      assert(
        !result.allowedUnitIds.includes("D1"),
        "D1 should NOT be in allowedUnitIds",
      );
    },
  );

  await run("tree cycle khi expand DENY không được fail-open", async () => {
    // Create tree with cycle
    const cycleData = [
      { id: "A", parentId: "B", type: "DEPARTMENT" },
      { id: "B", parentId: "A", type: "DEPARTMENT" },
    ];
    const cycleTree = new OrganizationTree(cycleData as any[]);

    const deps = makeDeps({
      findAllGrantsForUser: async () => [
        makeGrant("ALLOW", { facilityUnitId: null, dicomNodeId: null }),
        makeGrant("DENY", { facilityUnitId: "A", includeDescendants: true }),
      ],
    });
    const ctx = ScopeRequestContext.create();
    ctx.setTree(cycleTree);
    const result = await buildScopeFilter(
      "u1",
      "READ_STUDY",
      "STUDY",
      deps,
      ctx,
    );

    // The filter builder should catch the cycle when expanding "A" descendants
    // and fail closed (return empty filter)
    assert(result.shouldFilter === true, "Should filter");
    assert(result.globalAllow === false, "Fail closed: not global allow");
    assert(result.allowedUnitIds.length === 0, "Fail closed: no allowed units");
    assert(result.reason.includes("Tree cycle detected"), "Reason notes cycle");
  });

  console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══`);
  if (failed > 0) process.exit(1);
}

main().catch(console.error);
