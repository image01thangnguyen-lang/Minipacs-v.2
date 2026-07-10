import assert from "assert";
import { buildBaseWhere } from "./query-builder";
import { WorklistQueryRequest } from "./contract";
import { Prisma } from "@prisma/client";

async function runTests() {
  console.log("--- Query Builder Tests ---");
  const scopeWhere: Prisma.ImagingStudyWhereInput = {
    performingUnitId: { in: ["unit-1"] }
  };

  const req: WorklistQueryRequest = {
    version: 1,
    from: "2023-01-01T00:00:00.000Z",
    to: "2023-01-02T00:00:00.000Z",
    timezone: "UTC",
    limit: 50,
    sort: { key: "createdAt", direction: "desc" }
  };

  // Test 1
  const result1 = buildBaseWhere(req, scopeWhere);
  assert.deepStrictEqual(result1.AND, [scopeWhere]);
  console.log("✅ PASS: applies scopeWhere");

  // Test 2
  const result2 = buildBaseWhere({ ...req, q: "test" }, scopeWhere);
  assert(result2.OR && Array.isArray(result2.OR) && result2.OR.length === 3);
  console.log("✅ PASS: applies text search");

  // Test 3
  const facetReq = {
    ...req,
    statuses: ["FINALIZED"],
    facilityUnitIds: ["unit-2"],
    priorities: ["STAT"],
  };
  const result3 = buildBaseWhere(facetReq, scopeWhere);
  assert.deepStrictEqual(result3.status, { in: ["FINALIZED"] });
  assert.deepStrictEqual(result3.performingUnitId, { in: ["unit-2"] });
  assert.deepStrictEqual(result3.priority, { in: ["STAT"] });
  console.log("✅ PASS: applies all facets when omitFacetKey is missing");

  // Test 4
  const resultStatus = buildBaseWhere(facetReq, scopeWhere, "statuses");
  assert.strictEqual(resultStatus.status, undefined);
  assert.deepStrictEqual(resultStatus.performingUnitId, { in: ["unit-2"] });
  console.log("✅ PASS: omits statuses facet for self-exclusion");

  // Test 5
  const resultFacility = buildBaseWhere(facetReq, scopeWhere, "facilityUnitIds");
  assert.strictEqual(resultFacility.performingUnitId, undefined);
  assert.deepStrictEqual(resultFacility.status, { in: ["FINALIZED"] });
  console.log("✅ PASS: omits facilityUnitIds facet for self-exclusion");

  // Test 6: every supported query filter must participate in list/facet parity.
  const resultPriority = buildBaseWhere(facetReq, scopeWhere, "priorities");
  assert.strictEqual(resultPriority.priority, undefined);
  assert.deepStrictEqual(resultPriority.status, { in: ["FINALIZED"] });
  console.log("✅ PASS: applies priorities and supports priority self-exclusion");
}

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
