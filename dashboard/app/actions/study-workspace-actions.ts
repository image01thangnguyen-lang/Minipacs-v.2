"use server";

import { prisma } from "../db";
import { requirePermission } from "@/lib/authz";
import { getAllowedActionsForStudies, type StudyForActions } from "@/lib/authz/scope/allowed-actions";
import { StudyUidInputSchema, StudyWorkspaceDetailSchema, type StudyWorkspaceResult } from "@/lib/workspace/study-workspace";

/**
 * Fetch study workspace detail for Region 7 (PatientStudyContextPanel).
 *
 * Security invariants:
 * 1. requirePermission("studies.read") — fail-closed on missing global perm.
 * 2. Batch allowedActions via getAllowedActionsForStudies (O(1) DB for principal/grants/tree).
 * 3. If allowedActions.readStudy === false → DENIED (scope revoke).
 * 4. If allowedActions.readReport === false → report fields nulled (permission split).
 * 5. No report text/content is ever returned. That's PR2's responsibility.
 */
export async function getStudyWorkspaceAction(
  rawStudyUid: string
): Promise<StudyWorkspaceResult> {
  // 1. Authentication + global permission
  let actor: { id: string };
  try {
    actor = await requirePermission("studies.read");
  } catch {
    return { error: "UNAUTHORIZED" };
  }

  // 2. Input validation
  const uidParse = StudyUidInputSchema.safeParse(rawStudyUid);
  if (!uidParse.success) {
    return { error: "NOT_FOUND" };
  }
  const studyUid = uidParse.data;

  // 3. Bounded detail query: study + order + latest report.
  let study;
  try {
    study = await prisma.imagingStudy.findUnique({
      where: { studyInstanceUid: studyUid },
      include: {
        order: {
          select: {
            performingUnitId: true,
            scheduledStationAeTitle: true,
            sourceFacility: true,
            gender: true,
            dob: true,
            procedureDescription: true,
            referringDepartment: true,
            referringPhysician: true,
            hisVisitId: true,
          },
        },
        reports: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            updatedAt: true,
            cancelledAt: true,
            conclusion: true,
            doctorId: true,
          },
        },
      },
    });
  } catch {
    return { error: "UNAVAILABLE" };
  }

  if (!study) {
    return { error: "NOT_FOUND" };
  }

  // 4. Batch allowedActions (O(1) DB for principal/grants/tree)
  const studyForActions: StudyForActions = {
    id: studyUid,
    studyInstanceUid: studyUid,
    stationAeTitle: study.stationAeTitle || null,
    status: study.status || "READY_TO_READ",
    assignedDoctorId: study.assignedDoctorId || null,
    reportStatus: study.reports?.[0]?.status || null,
    performingUnitId: study.order?.performingUnitId || null,
    scheduledStationAeTitle: study.order?.scheduledStationAeTitle || null,
  };

  let actionsMap;
  try {
    actionsMap = await getAllowedActionsForStudies(actor.id, [studyForActions]);
  } catch {
    return { error: "DENIED" };
  }
  const allowedActions = actionsMap[studyUid];

  if (!allowedActions) {
    return { error: "DENIED" };
  }

  // 5. Scope revoke check: if user can't read this study, deny
  if (!allowedActions.readStudy) {
    return { error: "DENIED" };
  }

  // 6. Resolve report metadata (permission-split: null if no readReport)
  const report = study.reports?.[0] || null;
  const canReadReport = allowedActions.readReport;
  const reportStatus = canReadReport
    ? (report?.cancelledAt ? "CANCELLED" : (report?.status || null))
    : null;
  const reportRevision = canReadReport && report?.updatedAt
    ? report.updatedAt.getTime()
    : null;
  const reportUpdatedAt = canReadReport
    ? (report?.updatedAt ? report.updatedAt.toISOString() : null)
    : null;
  const reportConclusion = (canReadReport && report?.conclusion) ? report.conclusion : null;

  // 7. Resolve user names
  let assignedDoctorName: string | null = null;
  let technologistName: string | null = null;
  let reviewerName: string | null = null;

  const userIdsToFetch: string[] = [];
  if (study.assignedDoctorId) userIdsToFetch.push(study.assignedDoctorId);
  if (study.technologistId) userIdsToFetch.push(study.technologistId);
  let reviewEvent: { actorUserId: string | null } | null = null;
  if (canReadReport && report) {
    try {
      reviewEvent = await prisma.auditLog.findFirst({
        where: {
          entityType: "Report",
          entityId: report.id,
          action: { in: ["REPORT_APPROVED", "REPORT_FINALIZED"] },
        },
        select: { actorUserId: true },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      reviewEvent = null;
    }
  }
  if (reviewEvent?.actorUserId) userIdsToFetch.push(reviewEvent.actorUserId);

  if (userIdsToFetch.length > 0) {
    try {
      const users = await prisma.user.findMany({
        where: { id: { in: userIdsToFetch } },
        select: { id: true, fullName: true, username: true },
      });
      const doctor = users.find(u => u.id === study.assignedDoctorId);
      const tech = users.find(u => u.id === study.technologistId);
      const reviewer = users.find(u => u.id === reviewEvent?.actorUserId);

      assignedDoctorName = doctor?.fullName || doctor?.username || null;
      technologistName = tech?.fullName || tech?.username || null;
      reviewerName = reviewer?.fullName || reviewer?.username || null;
    } catch {
      assignedDoctorName = null;
      technologistName = null;
      reviewerName = null;
    }
  }

  // 8. Facility name
  const facilityName = study.order?.sourceFacility || null;

  // 9. Assemble detail (field-minimized, no report content)
  const detail = StudyWorkspaceDetailSchema.parse({
    studyUid,
    patientId: study.patientId || null,
    patientName: study.patientName || null,
    patientSex: study.order?.gender || null,
    patientBirthDate: study.order?.dob ? study.order.dob.toISOString().split("T")[0] : null,
    studyDate: study.scheduledAt ? study.scheduledAt.toISOString().split("T")[0] : (study.createdAt ? study.createdAt.toISOString().split("T")[0] : null),
    studyDescription: study.studyDescription || null,
    modality: study.modality || null,
    accessionNumber: study.accessionNumber || null,
    procedureDescription: study.procedureDescription || study.order?.procedureDescription || null,
    bodyPart: study.bodyPart || null,
    referringPhysician: study.order?.referringPhysician || null,
    referringDepartment: study.order?.referringDepartment || null,
    technologistName,
    machineName: study.stationAeTitle || null,
    stationAeTitle: study.stationAeTitle || undefined,
    status: study.status || "READY_TO_READ",
    reportStatus,
    reportRevision,
    reportUpdatedAt,
    reportConclusion,
    reviewerName,
    hisVisitId: study.order?.hisVisitId || null,
    aiStatus: null,
    aiFindingCount: null,
    aiSeverity: null,
    aiModelName: null,
    aiModelVersion: null,
    aiUpdatedAt: null,
    assignedDoctorName,
    facilityName,
    allowedActions,
  });

  return { data: detail };
}
