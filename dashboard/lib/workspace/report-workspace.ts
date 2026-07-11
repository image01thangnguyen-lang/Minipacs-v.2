import { z } from "zod";

// ─── Report Panel Actions ───────────────────────────────────────────────────────

/**
 * Subset of AllowedStudyActions relevant to the report panel.
 *
 * readReport=true  → report content is visible (read-only view).
 * draftReport=true → editor is editable, save/template controls shown.
 *
 * UI rendering and server mutation gates BOTH use these values,
 * but mutations MUST re-evaluate via getAllowedActionsForStudies
 * at write-time (this snapshot is advisory).
 */
export const ReportPanelActionsSchema = z.object({
  readReport: z.boolean(),
  draftReport: z.boolean(),
  signReport: z.boolean(),
  approveReport: z.boolean(),
  cancelDraft: z.boolean(),
  unfinalizeReport: z.boolean(),
  syncHis: z.boolean(),
  share: z.boolean(),
  createConsultation: z.boolean(),
}).strict();

export type ReportPanelActions = z.infer<typeof ReportPanelActionsSchema>;

// ─── Detail schema ──────────────────────────────────────────────────────────────

export const ReportWorkspaceDetailSchema = z.object({
  studyUid: z.string().min(1),
  findings: z.string().nullable(),
  conclusion: z.string().nullable(),
  recommendation: z.string().nullable(),
  printTemplateId: z.string().nullable(),
  reportId: z.string().nullable(),
  reportStatus: z.string().nullable(),      // workflow status (DRAFT | FINAL | PENDING_APPROVAL | CANCELLED)
  revision: z.number().int().nonnegative().nullable(), // explicit OCC token; null means no report yet
  updatedAt: z.string().nullable(),          // ISO string
  createdAt: z.string().nullable(),          // ISO string
  allowedActions: ReportPanelActionsSchema,
});

export type ReportWorkspaceDetail = z.infer<typeof ReportWorkspaceDetailSchema>;

// ─── Result union ───────────────────────────────────────────────────────────────

export type ReportWorkspaceError = "NOT_FOUND" | "DENIED" | "UNAUTHORIZED" | "UNAVAILABLE";

export type ReportWorkspaceResult =
  | { data: ReportWorkspaceDetail; error?: never }
  | { data?: never; error: ReportWorkspaceError };
