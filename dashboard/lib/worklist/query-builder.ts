import { Prisma, StudyStatus } from "@prisma/client";
import { WorklistQueryRequest } from "./contract";

export type WorklistFacetKey =
  | "statuses"
  | "facilityUnitIds"
  | "modality"
  | "assignedDoctorIds"
  | "hisStatuses"
  | "priorities";

/**
 * Builds the Prisma where clause for the worklist query, applying all filters
 * from the request. It merges the scope-level where clause with the user's
 * requested filters.
 *
 * @param request The user's query request
 * @param scopeWhere The fail-closed scope where clause (must be evaluated beforehand)
 * @param omitFacetKey An optional key to skip when applying filters. This is used
 *                     for facet calculation to enable self-excluding semantics
 *                     (e.g., when grouping by status, do not filter by status).
 */
export function buildBaseWhere(
  request: WorklistQueryRequest,
  scopeWhere: Prisma.ImagingStudyWhereInput,
  omitFacetKey?: WorklistFacetKey
): Prisma.ImagingStudyWhereInput {
  const where: Prisma.ImagingStudyWhereInput = {
    AND: [scopeWhere],
  };

  // Date boundaries
  if (request.from || request.to) {
    const createdAtFilter: Prisma.DateTimeFilter = {};
    if (request.from) createdAtFilter.gte = new Date(request.from);
    if (request.to) createdAtFilter.lte = new Date(request.to);
    where.createdAt = createdAtFilter;
  }

  // Facets
  if (omitFacetKey !== "statuses" && request.statuses?.length) {
    where.status = { in: request.statuses as StudyStatus[] };
  }
  
  if (omitFacetKey !== "facilityUnitIds" && request.facilityUnitIds?.length) {
    where.performingUnitId = { in: request.facilityUnitIds };
  }
  
  if (omitFacetKey !== "modality" && request.modality?.length) {
    where.modality = { in: request.modality };
  }
  
  if (omitFacetKey !== "assignedDoctorIds" && request.assignedDoctorIds?.length) {
    where.assignedDoctorId = { in: request.assignedDoctorIds };
  }
  
  if (omitFacetKey !== "hisStatuses" && request.hisStatuses?.length) {
    where.hisSyncStatus = { in: request.hisStatuses };
  }

  if (omitFacetKey !== "priorities" && request.priorities?.length) {
    where.priority = { in: request.priorities };
  }

  // Text search
  if (request.q) {
    const q = request.q;
    where.OR = [
      { patientName: { contains: q } },
      { patientId: { contains: q } },
      { accessionNumber: { contains: q } },
    ];
  }

  return where;
}
