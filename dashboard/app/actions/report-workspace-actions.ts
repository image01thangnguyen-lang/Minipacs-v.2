"use server";

import { prisma } from "../db";
import { requirePermission } from "@/lib/authz";
import { getAllowedActionsForStudies, type StudyForActions } from "@/lib/authz/scope/allowed-actions";
import {
  ReportWorkspaceDetailSchema,
  type ReportWorkspaceResult,
  type ReportPanelActions,
} from "@/lib/workspace/report-workspace";
import { StudyUidInputSchema } from "@/lib/workspace/study-workspace";

/**
 * Fetch report workspace detail for the report panel.
 *
 * Security invariants:
 * 1. requirePermission("reports.read") — fail-closed on missing global perm.
 * 2. Batch allowedActions via getAllowedActionsForStudies (O(1) DB).
 * 3. If allowedActions.readReport === false → DENIED.
 * 4. Response includes allowedActions subset so UI can gate edit/mutation controls.
 * 5. Report text is ONLY returned when readReport is true.
 * 6. No PHI in logs — only studyUid for correlation.
 */
export async function getReportWorkspaceAction(
  rawStudyUid: string
): Promise<ReportWorkspaceResult> {
  // 1. Authentication + global permission
  let actor: { id: string };
  try {
    actor = await requirePermission("reports.read");
  } catch {
    return { error: "UNAUTHORIZED" };
  }

  // 2. Input validation
  const uidParse = StudyUidInputSchema.safeParse(rawStudyUid);
  if (!uidParse.success) {
    return { error: "NOT_FOUND" };
  }
  const studyUid = uidParse.data;

  // 3. Bounded query: study + order (for scope) + latest report
  let study;
  try {
    study = await prisma.imagingStudy.findUnique({
      where: { studyInstanceUid: studyUid },
      include: {
        order: {
          select: {
            performingUnitId: true,
            scheduledStationAeTitle: true,
          },
        },
        reports: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            findings: true,
            conclusion: true,
            recommendation: true,
            printTemplateId: true,
            updatedAt: true,
            createdAt: true,
            cancelledAt: true,
            revision: true,
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

  let allowedActions;
  try {
    const actionsMap = await getAllowedActionsForStudies(actor.id, [studyForActions]);
    allowedActions = actionsMap[studyUid];
  } catch {
    return { error: "DENIED" };
  }

  // 5. Scope check: readReport required
  if (!allowedActions || !allowedActions.readReport) {
    return { error: "DENIED" };
  }

  // 6. Build report panel actions subset
  const panelActions: ReportPanelActions = {
    readReport: allowedActions.readReport,
    draftReport: allowedActions.draftReport,
    signReport: allowedActions.signReport,
    approveReport: allowedActions.approveReport,
    cancelDraft: allowedActions.cancelDraft,
    unfinalizeReport: allowedActions.unfinalizeReport,
    syncHis: allowedActions.syncHis,
    share: allowedActions.share,
    createConsultation: allowedActions.createConsultation,
  };

  // 7. Build and validate response
  const report = study.reports?.[0];
  const reportStatus = report?.cancelledAt
    ? "CANCELLED"
    : (report?.status || null);
  const revision = report?.revision ?? null;

  const payload = {
    studyUid,
    findings: report?.findings || null,
    conclusion: report?.conclusion || null,
    recommendation: report?.recommendation || null,
    printTemplateId: report?.printTemplateId || null,
    reportId: report?.id || null,
    reportStatus,
    revision,
    updatedAt: report?.updatedAt ? report.updatedAt.toISOString() : null,
    createdAt: report?.createdAt ? report.createdAt.toISOString() : null,
    allowedActions: panelActions,
  };

  const validated = ReportWorkspaceDetailSchema.parse(payload);
  return { data: validated };
}
