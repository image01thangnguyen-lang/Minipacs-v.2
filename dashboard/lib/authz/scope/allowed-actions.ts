/**
 * Batch evaluator for study allowed actions.
 *
 * Loads principal, grants, and organization tree ONCE per request via
 * ScopeRequestContext, then evaluates each study's scope for all
 * capabilities without N+1 queries.
 *
 * The result is purely advisory for UI rendering.
 * Server mutations MUST re-check via requireScopedStudyMutation.
 */

import type { ScopeCapability } from "./capability-registry";
import { resolveScope } from "./scope-resolver";
import { ScopeRequestContext } from "./scope-request-context";
import { getScopeDeps } from "./deps";
import { getAuthorizationMode } from "./authorization-mode";
import { loadPrincipal } from "./principal-loader";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type AllowedStudyActions = {
  readStudy: boolean;
  readReport: boolean;
  editClinical: boolean;
  assignCase: boolean;
  draftReport: boolean;
  signReport: boolean;
  approveReport: boolean;
  cancelDraft: boolean;
  unfinalizeReport: boolean;
  deliverResult: boolean;
  syncHis: boolean;
  createConsultation: boolean;
  share: boolean;
  export: boolean;
  editViewerArtifacts: boolean;
};

export type StudyForActions = {
  id: string; // The UI row ID, can be order.id or studyInstanceUid
  studyInstanceUid?: string | null;
  stationAeTitle: string | null;
  status: string;
  assignedDoctorId: string | null;
  reportStatus: string | null;
  performingUnitId: string | null;
  scheduledStationAeTitle: string | null;
};

// ─── Capability → AllowedStudyActions field mapping ─────────────────────────────

const CAPABILITY_FIELDS: Array<{
  field: keyof AllowedStudyActions;
  capability: ScopeCapability;
  globalPermission: string;
}> = [
  { field: "readStudy", capability: "READ_STUDY", globalPermission: "studies.read" },
  { field: "readReport", capability: "READ_REPORT", globalPermission: "reports.read" },
  { field: "editClinical", capability: "EDIT_CLINICAL", globalPermission: "studies.updateClinical" },
  { field: "assignCase", capability: "ASSIGN_CASE", globalPermission: "studies.assign" },
  { field: "draftReport", capability: "DRAFT_REPORT", globalPermission: "reports.write" },
  { field: "signReport", capability: "SIGN_REPORT", globalPermission: "reports.finalize" },
  { field: "approveReport", capability: "APPROVE_REPORT", globalPermission: "reports.finalize" },
  { field: "cancelDraft", capability: "CANCEL_DRAFT", globalPermission: "reports.cancelDraft" },
  { field: "unfinalizeReport", capability: "UNFINALIZE_REPORT", globalPermission: "reports.unfinalize" },
  { field: "deliverResult", capability: "DELIVER_RESULT", globalPermission: "archive.deliver" },
  { field: "syncHis", capability: "SYNC_HIS", globalPermission: "his.sync" },
  { field: "createConsultation", capability: "CREATE_CONSULT", globalPermission: "consult.create" },
];

// Fields that use READ_STUDY scope + dedicated global permission (no separate scope capability)
const READ_STUDY_PLUS_GLOBAL: Array<{
  field: keyof AllowedStudyActions;
  globalPermission: string;
}> = [
  { field: "share", globalPermission: "share.create" },
  { field: "export", globalPermission: "export.create" },
  { field: "editViewerArtifacts", globalPermission: "studies.read" },
];

// ─── Workflow state constraints ─────────────────────────────────────────────────

function applyWorkflowConstraints(
  actions: AllowedStudyActions,
  study: StudyForActions
): AllowedStudyActions {
  const result = { ...actions };
  const { status, reportStatus } = study;

  // Draft only possible if report is not FINAL
  if (reportStatus === "FINAL") {
    result.draftReport = false;
  }

  // Sign only possible if report is DRAFT
  if (reportStatus !== "DRAFT") {
    result.signReport = false;
  }

  // Approve only possible if report is PENDING_APPROVAL
  if (reportStatus !== "PENDING_APPROVAL") {
    result.approveReport = false;
  }

  // Cancel draft only possible if report is DRAFT or PENDING_APPROVAL
  if (reportStatus !== "DRAFT" && reportStatus !== "PENDING_APPROVAL") {
    result.cancelDraft = false;
  }

  // Unfinalize only possible if report is FINAL
  if (reportStatus !== "FINAL") {
    result.unfinalizeReport = false;
  }

  // Deliver only possible if study is FINALIZED or REPORTED
  if (status !== "FINALIZED" && status !== "REPORTED") {
    result.deliverResult = false;
  }

  return result;
}

// ─── Batch evaluator ────────────────────────────────────────────────────────────

/**
 * Evaluate allowed actions for multiple studies in a single batch.
 *
 * Loads principal, grants, and tree ONCE via the shared ScopeRequestContext.
 * Then iterates studies, calling resolveScope for each (which uses cached data).
 *
 * This is O(studies × capabilities) for scope resolution but O(1) for
 * DB queries (principal, grants, tree are all cached in ctx).
 */
export async function getAllowedActionsForStudies(
  userId: string,
  studies: StudyForActions[],
  ctx?: ScopeRequestContext
): Promise<Record<string, AllowedStudyActions>> {
  const effectiveCtx = ctx || ScopeRequestContext.create();
  const deps = getScopeDeps();
  const mode = getAuthorizationMode();
  const result: Record<string, AllowedStudyActions> = {};
  // Load fresh, authoritative permissions once. Never derive authorization UI
  // from potentially stale role/permission claims in the client session.
  const principal = await loadPrincipal(userId, deps, effectiveCtx);
  const globalPermissions = new Set(principal?.globalPermissions || []);

  for (const study of studies) {
    const actions: AllowedStudyActions = {
      readStudy: false,
      readReport: false,
      editClinical: false,
      assignCase: false,
      draftReport: false,
      signReport: false,
      approveReport: false,
      cancelDraft: false,
      unfinalizeReport: false,
      deliverResult: false,
      syncHis: false,
      createConsultation: false,
      share: false,
      export: false,
      editViewerArtifacts: false,
    };

    const resourceInput = {
      resourceType: "STUDY" as const,
      performingUnitId: study.performingUnitId || null,
      stationAeTitle: study.stationAeTitle || study.scheduledStationAeTitle || null,
    };

    // Evaluate each capability with dedicated scope
    for (const { field, capability, globalPermission } of CAPABILITY_FIELDS) {
      // Quick pre-check: if no global permission, skip scope resolution
      if (!globalPermissions.has(globalPermission)) {
        continue;
      }

      if (mode === "OFF") {
        actions[field] = true;
        continue;
      }

      try {
        const decision = await resolveScope(userId, capability, resourceInput, deps, effectiveCtx);
        actions[field] = decision.effectiveAllowed;
      } catch {
        // On error, deny (fail-closed)
        actions[field] = false;
      }
    }

    // Evaluate fields that use READ_STUDY scope + global permission
    for (const { field, globalPermission } of READ_STUDY_PLUS_GLOBAL) {
      if (!globalPermissions.has(globalPermission)) {
        continue;
      }
      // These inherit the READ_STUDY scope result
      actions[field] = actions.readStudy;
    }

    // Apply workflow constraints after scope
    const constrained = applyWorkflowConstraints(actions, study);
    result[study.id] = constrained;
  }

  return result;
}
