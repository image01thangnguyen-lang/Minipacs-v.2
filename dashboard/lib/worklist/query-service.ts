import { Prisma, StudyStatus } from "@prisma/client";
import { prisma } from "../../app/db";
import {
  WORKLIST_CONTRACT_VERSION,
  WorklistQueryRequest,
  WorklistQueryResponse,
  WorklistRow,
} from "./contract";
import { buildScopeFilter, applyScopeFilterToPrisma } from "../authz/scope/scope-filter-builder";
import { getScopeDeps } from "../authz/scope/deps";
import { getAllowedActionsForStudies } from "../authz/scope/allowed-actions";
import { ScopeRequestContext } from "../authz/scope/scope-request-context";
import { decodeWorklistCursor, encodeWorklistCursor } from "./cursor";

export { decodeWorklistCursor, encodeWorklistCursor } from "./cursor";
import { buildBaseWhere } from "./query-builder";
import { mapStudyToWorklistRow } from "./row-mapper";

/**
 * Executes a scoped worklist query against the database.
 *
 * Safety properties:
 * - Scoped to user's ALLOW grants via READ_STUDY capability.
 * - Keyset paginated using unique stable tie-breaker `id`.
 * - Prevents N+1 queries by batching includes.
 * - AllowedActions are batched evaluated to prevent cross-scope leak and N+1.
 */
export async function queryWorklist(
  request: WorklistQueryRequest,
  userId: string
): Promise<WorklistQueryResponse> {
  const deps = getScopeDeps();
  const ctx = ScopeRequestContext.create();

  // 1. Build Scope Filter (fail-closed)
  const scopeFilter = await buildScopeFilter(userId, "READ_STUDY", "STUDY", deps, ctx);
  const scopeWhere = applyScopeFilterToPrisma(
    scopeFilter,
    "performingUnitId",
    "stationAeTitle"
  );

  // If the filter resolved to a guaranteed empty set (force-empty-result)
  if (scopeWhere.id === "force-empty-result") {
    return {
      version: WORKLIST_CONTRACT_VERSION,
      rows: [],
      pageInfo: { hasNextPage: false },
      appliedQuery: request,
      dataFreshness: "FRESH",
    };
  }

  // 2. Build Query Filters using shared query-builder
  const where = buildBaseWhere(request, scopeWhere);

  // 3. Pagination & Cursor Setup
  const limit = request.limit ?? 50;

  const orderDir = request.sort?.direction || "desc";
  const orderKey = request.sort?.key || "createdAt";
  const decodedCursor = request.cursor ? decodeWorklistCursor(request.cursor, request.sort) : undefined;
  const cursorObj = decodedCursor ? { id: decodedCursor.id } : undefined;

  const orderBy: Prisma.ImagingStudyOrderByWithRelationInput[] = [
    { [orderKey]: orderDir },
    { id: orderDir } // stable tie-breaker
  ];

  // 4. Fetch from DB
  const rawStudies = await prisma.imagingStudy.findMany({
    where,
    take: limit + 1, // take + 1 to check if hasNextPage
    cursor: cursorObj,
    orderBy,
    skip: request.cursor ? 1 : 0, // skip the cursor itself
    include: {
      order: true,
      performingUnit: true,
      nonDicomExam: true,
      reports: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  const hasNextPage = rawStudies.length > limit;
  const itemsToMap = hasNextPage ? rawStudies.slice(0, limit) : rawStudies;
  const lastItem = itemsToMap[itemsToMap.length - 1];
  const endCursor = lastItem
    ? encodeWorklistCursor({
        v: WORKLIST_CONTRACT_VERSION,
        id: lastItem.id,
        sortKey: request.sort.key,
        sortDirection: request.sort.direction,
      })
    : undefined;

  // 5. Batch Allowed Actions
  const actionInputs = itemsToMap.map(study => ({
    id: study.id,
    studyInstanceUid: study.studyInstanceUid,
    stationAeTitle: study.stationAeTitle,
    status: study.status,
    assignedDoctorId: study.assignedDoctorId,
    reportStatus: study.reports?.[0]?.status || null,
    performingUnitId: study.performingUnitId,
    scheduledStationAeTitle: study.order?.scheduledStationAeTitle || null,
  }));
  const allowedActionsMap = await getAllowedActionsForStudies(userId, actionInputs, ctx);

  // 5.1 Batch Fetch Users for Doctors & Technologists
  const userIdsToFetch = new Set<string>();
  itemsToMap.forEach(study => {
    if (study.assignedDoctorId) userIdsToFetch.add(study.assignedDoctorId);
    if (study.technologistId) userIdsToFetch.add(study.technologistId);
  });

  const usersMap: Record<string, string> = {};
  if (userIdsToFetch.size > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIdsToFetch) } },
      select: { id: true, fullName: true }
    });
    users.forEach(u => usersMap[u.id] = u.fullName);
  }

  // 6. Map to Contract
  const rows: WorklistRow[] = itemsToMap.map(study => {
    const actions = allowedActionsMap[study.id] || {};
    return mapStudyToWorklistRow(study, actions, usersMap);
  });

  return {
    version: WORKLIST_CONTRACT_VERSION,
    rows,
    pageInfo: {
      hasNextPage,
      endCursor
    },
    appliedQuery: request,
    dataFreshness: "FRESH"
  };
}

