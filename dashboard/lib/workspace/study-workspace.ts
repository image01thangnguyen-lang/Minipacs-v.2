import { z } from "zod";

export const AllowedStudyActionsSchema = z.object({
  readStudy: z.boolean(), readReport: z.boolean(), editClinical: z.boolean(),
  assignCase: z.boolean(), draftReport: z.boolean(), signReport: z.boolean(),
  approveReport: z.boolean(), cancelDraft: z.boolean(), unfinalizeReport: z.boolean(),
  deliverResult: z.boolean(), syncHis: z.boolean(), createConsultation: z.boolean(),
  share: z.boolean(), export: z.boolean(), editViewerArtifacts: z.boolean(),
}).strict();

export const AiStudyStatusSchema = z.enum([
  "NOT_RUN", "RUNNING", "NORMAL", "ABNORMAL", "FAILED",
]);

// ─── Response schema ────────────────────────────────────────────────────────────

/**
 * Typed workspace detail for Region 7 (PatientStudyContextPanel).
 *
 * Design invariants:
 * - Field minimization: no report text/findings/recommendation; conclusion is
 *   permission-gated and null unless allowedActions.readReport is true.
 * - Report permission split: if allowedActions.readReport is false,
 *   report-specific fields (including reportConclusion) are null.
 * - No PHI beyond the minimum needed for the study header display.
 */
export const StudyWorkspaceDetailSchema = z.object({
  studyUid: z.string().min(1),
  patientId: z.string().nullable(),
  patientName: z.string().nullable(),
  patientSex: z.string().nullable(),
  patientBirthDate: z.string().nullable(),
  ageAtStudy: z.number().int().nonnegative().optional(),
  studyDate: z.string().nullable(),
  studyDescription: z.string().nullable(),
  modality: z.string().nullable(),
  accessionNumber: z.string().nullable(),
  procedureDescription: z.string().nullable(),
  bodyPart: z.string().nullable(),
  referringPhysician: z.string().nullable(),
  referringDepartment: z.string().nullable(),
  technologistName: z.string().nullable(),
  machineName: z.string().nullable(),
  stationAeTitle: z.string().optional(),
  status: z.string(),
  reportStatus: z.string().nullable(),
  reportRevision: z.number().int().nullable(),
  reportUpdatedAt: z.string().nullable(),
  reportConclusion: z.string().nullable(),
  reviewerName: z.string().nullable(),
  hisVisitId: z.string().nullable(),
  aiStatus: AiStudyStatusSchema.nullable(),
  aiFindingCount: z.number().int().nonnegative().nullable(),
  aiSeverity: z.string().nullable(),
  aiModelName: z.string().nullable().default(null),
  aiModelVersion: z.string().nullable().default(null),
  aiUpdatedAt: z.string().nullable().default(null),
  assignedDoctorName: z.string().nullable(),
  facilityName: z.string().nullable(),
  allowedActions: AllowedStudyActionsSchema,
}).strict();

export type StudyWorkspaceDetail = z.infer<typeof StudyWorkspaceDetailSchema>;

// ─── Result union ───────────────────────────────────────────────────────────────

export type StudyWorkspaceError = "NOT_FOUND" | "DENIED" | "UNAUTHORIZED" | "UNAVAILABLE";

export type StudyWorkspaceResult =
  | { data: StudyWorkspaceDetail; error?: never }
  | { data?: never; error: StudyWorkspaceError };

// ─── Input validation ───────────────────────────────────────────────────────────

export const StudyUidInputSchema = z.string().trim().min(1).max(64).regex(
  /^\d+(?:\.\d+)+$/,
  "studyUid must be a valid DICOM UID"
);
