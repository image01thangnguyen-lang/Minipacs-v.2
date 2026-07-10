import { WORKLIST_CONTRACT_VERSION, WorklistFacetResponse, WorklistQueryRequest } from "./contract";
import { getScopeDeps } from "../authz/scope/deps";
import { buildScopeFilter, applyScopeFilterToPrisma } from "../authz/scope/scope-filter-builder";
import { ScopeRequestContext } from "../authz/scope/scope-request-context";
import { prisma } from "../../app/db";
import { buildBaseWhere } from "./query-builder";

/**
 * Executes a scoped facet query against the database.
 * 
 * Safety properties:
 * - Computes counts within the strict fail-closed boundary of the READ_STUDY capability.
 * - Implements "self-excluding" facets: filters for the specific facet are omitted
 *   from its count query, while all other filters are applied.
 * - Batch queries via parallel execution to avoid N+1.
 */
export async function queryWorklistFacets(
  request: WorklistQueryRequest,
  userId: string
): Promise<WorklistFacetResponse> {
  const deps = getScopeDeps();
  const ctx = ScopeRequestContext.create();

  // 1. Build Scope Filter (fail-closed)
  const scopeFilter = await buildScopeFilter(userId, "READ_STUDY", "STUDY", deps, ctx);
  const scopeWhere = applyScopeFilterToPrisma(
    scopeFilter,
    "performingUnitId",
    "stationAeTitle",
    "machineId"
  );

  // applyScopeFilterToPrisma owns the fail-closed sentinel representation.
  // Avoid inspecting other fields because the representation may evolve.
  if (scopeWhere.id === "force-empty-result") {
    return {
      version: WORKLIST_CONTRACT_VERSION,
      statuses: [],
      facilityUnitIds: [],
      appliedQuery: request,
      dataFreshness: "FRESH"
    };
  }

  // 2. Build Where for Facets (self-excluding)
  const statusWhere = buildBaseWhere(request, scopeWhere, "statuses");
  const facilityWhere = buildBaseWhere(request, scopeWhere, "facilityUnitIds");

  // 3. Execute GroupBy Queries in parallel
  const [statusAgg, facilityAgg] = await Promise.all([
    prisma.imagingStudy.groupBy({
      by: ['status'],
      where: statusWhere,
      _count: true
    }),
    prisma.imagingStudy.groupBy({
      by: ['performingUnitId'],
      where: facilityWhere,
      _count: true
    })
  ]);

  // 4. Map Results
  const statuses = statusAgg.map(s => ({
    value: s.status,
    count: s._count
  })).sort((a, b) => a.value.localeCompare(b.value));

  const facilityUnitIds = facilityAgg
    .filter(f => f.performingUnitId != null) // Only include non-null
    .map(f => ({
      value: f.performingUnitId!,
      count: f._count
    }))
    .sort((a, b) => a.value.localeCompare(b.value));

  return {
    version: WORKLIST_CONTRACT_VERSION,
    statuses,
    facilityUnitIds,
    appliedQuery: request,
    dataFreshness: "FRESH"
  };
}
