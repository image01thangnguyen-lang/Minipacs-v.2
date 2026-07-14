import { prisma } from "../../app/db";
import { WorklistRow } from "../worklist/contract";
import { buildScopeFilter, applyScopeFilterToPrisma } from "../authz/scope/scope-filter-builder";
import { getScopeDeps } from "../authz/scope/deps";
import { getAllowedActionsForStudies } from "../authz/scope/allowed-actions";
import { ScopeRequestContext } from "../authz/scope/scope-request-context";
import { buildRelatedStudyDateFilter, type RelatedStudyRange } from "./related-studies-range";

function calculateSlaStatus(study: { status: string; createdAt: Date }) {
  if (study.status === "FINALIZED" || study.status === "DELIVERED") return "COMPLETED";
  if (!study.createdAt) return "NORMAL";
  const hoursSince = (Date.now() - study.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSince > 24) return "VIOLATED";
  if (hoursSince > 12) return "WARNING";
  return "NORMAL";
}

export async function queryRelatedStudies(
  anchorStudyInstanceUid: string,
  userId: string,
  limit: number = 50,
  range: RelatedStudyRange = "ALL"
): Promise<{ rows: WorklistRow[] }> {
  const deps = getScopeDeps();
  const ctx = ScopeRequestContext.create();

  // 1. Build Scope Filter (fail-closed)
  const scopeFilter = await buildScopeFilter(userId, "READ_STUDY", "STUDY", deps, ctx);
  const scopeWhere = applyScopeFilterToPrisma(
    scopeFilter,
    "performingUnitId",
    "stationAeTitle"
  );

  // 2. Fetch the anchor study AND enforce scope simultaneously
  const anchorStudy = await prisma.imagingStudy.findFirst({
    where: {
      studyInstanceUid: anchorStudyInstanceUid,
      AND: scopeWhere,
    },
    select: {
      id: true,
      patientId: true,
      patientName: true,
      performingUnitId: true,
      createdAt: true,
    },
  });

  if (!anchorStudy) {
    throw new Error("UNAUTHORIZED_OR_NOT_FOUND");
  }

  // Until IssuerOfPatientID is persisted, an unclassified anchor has no safe
  // identity namespace. Fail closed instead of matching the patient globally.
  if (!anchorStudy.patientId || !anchorStudy.patientName || !anchorStudy.performingUnitId) {
    return { rows: [] };
  }

  // 3. Apply range filter
  const createdAtFilter = buildRelatedStudyDateFilter(range, anchorStudy.createdAt);

  // 4. Find related studies using EXACT patientId and patientName, scoped securely
  const rawStudies = await prisma.imagingStudy.findMany({
    where: {
      patientId: anchorStudy.patientId,
      patientName: anchorStudy.patientName,
      // performingUnitId is the narrowest persisted identity boundary today.
      // This deliberately prefers false negatives over cross-facility leakage.
      performingUnitId: anchorStudy.performingUnitId,
      // NOT including the anchor study itself
      id: { not: anchorStudy.id },
      AND: scopeWhere,
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: limit,
    include: {
      order: {
        select: {
          procedureDescription: true,
          scheduledStationAeTitle: true,
        },
      },
      reports: {
        select: {
          id: true,
          status: true,
          finalizedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      performingUnit: {
        select: { name: true },
      },
      nonDicomExam: {
        select: { id: true },
      },
    },
  });

  if (rawStudies.length === 0) {
    return { rows: [] };
  }

  // 4. Batch Allowed Actions
  const actionInputs = rawStudies.map(study => ({
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

  // 5. Map to Contract
  const rows: WorklistRow[] = rawStudies.map(study => {
    const actions = allowedActionsMap[study.id];
    const allowedActionsList = Object.entries(actions || {})
      .filter(([_, allowed]) => allowed)
      .map(([key]) => key);
    
    const latestReport = study.reports?.[0];

    return {
      id: study.id,
      studyInstanceUid: study.studyInstanceUid,
      orderId: study.orderId || undefined,
      
      patientName: study.patientName || "Unknown",
      patientId: study.patientId || "Unknown",
      accessionNumber: study.accessionNumber || "Unknown",
      modality: study.modality || "Unknown",
      bodyPart: study.order?.procedureDescription || undefined,
      priority: study.priority || "NORMAL",
      status: study.status,
      
      createdAt: study.createdAt.toISOString(),
      scheduledAt: study.scheduledAt?.toISOString(),
      receivedAt: study.createdAt.toISOString(),
      finalizedAt: latestReport?.finalizedAt?.toISOString(),
      
      performingUnitId: study.performingUnitId || undefined,
      facilityName: study.performingUnit?.name || undefined,
      machineName: undefined,
      stationAeTitle: study.stationAeTitle || undefined,
      
      assignedDoctorId: study.assignedDoctorId || undefined,
      assignedDoctorName: null,
      
      reportStatus: latestReport?.status || null,
      reportRevision: null,
      reportUpdatedAt: null,
      reportConclusion: null,
      reviewerName: null,

      sourceType: study.sourceType === "NON_DICOM" ? "NON_DICOM" : "DICOM",
      mediaCount: study.mediaCount || 0,
      hisVisitId: null,

      aiStatus: null,
      aiFindingCount: null,
      aiSeverity: null,

      hisSyncStatus: study.hisSyncStatus || undefined,
      
      allowedActions: allowedActionsList,
      
      isNonDicom: !!study.nonDicomExam,
      nonDicomExamId: study.nonDicomExam?.id,
      slaStatus: calculateSlaStatus(study)
    };
  });

  return { rows };
}
