import { z } from "zod";

export const CAPABILITIES = [
  "shared-list-ui",
  "doctor-workspace",
  "observability",
  "command-center-write",
  "quality-workflows",
  "evaluator-workers",
  "admin-policy-editors",
  "clinical-governance",
  "enterprise-interop",
] as const;
export type ReleaseCapability = (typeof CAPABILITIES)[number];

export const ROLLOUT_RINGS = [0, 10, 25, 50, 100] as const;
export type RolloutRing = (typeof ROLLOUT_RINGS)[number];

export const FeatureFlagConfigSchema = z.object({
  version: z.literal(1),
  capability: z.enum(CAPABILITIES),
  enabled: z.boolean(),
  percentage: z.union([
    z.literal(0), z.literal(10), z.literal(25), z.literal(50), z.literal(100),
  ]),
  allowFacilityIds: z.array(z.string().min(1).max(64)).max(100).default([]),
  denyFacilityIds: z.array(z.string().min(1).max(64)).max(100).default([]),
  dependencies: z.array(z.enum(CAPABILITIES)).max(CAPABILITIES.length).default([]),
}).strict();
export type FeatureFlagConfig = z.infer<typeof FeatureFlagConfigSchema>;

export const FlagEvaluationRequestSchema = z.object({
  capability: z.enum(CAPABILITIES),
  resourceId: z.string().min(1).max(128),
}).strict();
export type FlagEvaluationRequest = z.infer<typeof FlagEvaluationRequestSchema>;

export const FLAG_DECISION_REASONS = [
  "ENABLED", "SUBJECT_MISSING", "CONFIG_INVALID", "CONFIG_MISSING",
  "FLAG_DISABLED", "FACILITY_DENIED", "DEPENDENCY_DISABLED", "OUTSIDE_COHORT",
] as const;
export type FlagDecisionReason = (typeof FLAG_DECISION_REASONS)[number];
export type FlagDecision = Readonly<{
  capability: ReleaseCapability;
  enabled: boolean;
  reason: FlagDecisionReason;
  bucket: number | null;
}>;

export const GateEvidenceSchema = z.object({
  securityPassed: z.boolean(),
  accessibilityPassed: z.boolean(),
  uatApproved: z.boolean(),
  rollbackDrillPassed: z.boolean(),
  openSev1: z.number().int().min(0),
  openSev2: z.number().int().min(0),
  errorRate: z.number().min(0).max(1),
  p95Ms: z.number().nonnegative(),
  supportOwner: z.string().min(1).max(100),
  observedMinutes: z.number().int().nonnegative(),
}).strict();
export type GateEvidence = z.infer<typeof GateEvidenceSchema>;

export type GateDecision = {
  decision: "GO" | "HOLD" | "ROLLBACK";
  reasons: string[];
};

export const PilotRingSchema = z.enum(["CLINICAL_SUPER_USERS", "PILOT_HOSPITAL"]);
export const PilotFeedbackSchema = z.object({
  id: z.string().regex(/^FB-[A-Z0-9-]{3,64}$/),
  severity: z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]),
  status: z.enum(["OPEN", "MITIGATED", "CLOSED"]),
  ownerId: z.string().min(3).max(100),
  dueAt: z.string().datetime(),
  evidenceRef: z.string().min(3).max(200),
}).strict();

export const PilotGateEvidenceSchema = z.object({
  version: z.literal(1),
  releaseId: z.string().min(1).max(100),
  ring: PilotRingSchema,
  revision: z.number().int().nonnegative(),
  evaluatedAt: z.string().datetime(),
  participantCount: z.number().int().nonnegative().max(10000),
  completedCriticalJourneys: z.number().int().nonnegative().max(1000000),
  observedMinutes: z.number().int().nonnegative().max(525600),
  securityPassed: z.boolean(),
  scopeParityPassed: z.boolean(),
  rollbackDrillPassed: z.boolean(),
  errorRate: z.number().min(0).max(1),
  p95Ms: z.number().nonnegative().max(600000),
  autosaveSuccessRate: z.number().min(0).max(1),
  support: z.object({
    primaryOwner: z.string().min(3).max(100),
    clinicalOwner: z.string().min(3).max(100),
    securityOwner: z.string().min(3).max(100),
    coverageMinutes: z.number().int().nonnegative().max(10080),
    escalationTested: z.boolean(),
  }).strict(),
  feedback: z.array(PilotFeedbackSchema).max(500),
}).strict();
export type PilotGateEvidence = z.infer<typeof PilotGateEvidenceSchema>;

export type PilotGateDecision = Readonly<{
  decision: "GO" | "HOLD" | "ROLLBACK";
  reasons: string[];
  releaseCandidate: boolean;
  evaluatedRevision: number;
}>;

export const SyntheticUatFixtureSchema = z.object({
  version: z.literal(1),
  syntheticOnly: z.literal(true),
  facilities: z.array(z.string().regex(/^synthetic-|^facility-[a-z0-9-]+$/)).min(2).max(20),
  actors: z.array(z.object({
    id: z.string().regex(/^synthetic-/),
    role: z.enum(["ADMIN", "DOCTOR", "TECHNICIAN", "RECEPTION", "RADIOLOGIST"]),
    facilityId: z.string().min(1).max(64),
  }).strict()).min(2).max(100),
  cases: z.array(z.object({
    id: z.string().regex(/^P7-[A-Z0-9]+-[0-9]{3}$/),
    category: z.enum(["SCOPE", "TAMPER", "A11Y", "RACE", "FAILURE", "ROLLBACK"]),
    actorIds: z.array(z.string().regex(/^synthetic-/)).min(1).max(20),
    expected: z.string().min(10).max(500),
  }).strict()).min(1).max(200),
}).strict().superRefine((fixture, context) => {
  const facilities = new Set(fixture.facilities);
  const actors = new Set(fixture.actors.map(actor => actor.id));
  if (actors.size !== fixture.actors.length) context.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate actor id" });
  for (const actor of fixture.actors) {
    if (!facilities.has(actor.facilityId)) context.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown actor facility: ${actor.facilityId}` });
  }
  for (const testCase of fixture.cases) {
    for (const actorId of testCase.actorIds) {
      if (!actors.has(actorId)) context.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown case actor: ${actorId}` });
    }
  }
});
export type SyntheticUatFixture = z.infer<typeof SyntheticUatFixtureSchema>;

export const UatResultStatusSchema = z.enum(["PASS", "FAIL", "BLOCKED"]);
export const UatDefectSchema = z.object({
  id: z.string().regex(/^DEF-[A-Z0-9-]{3,64}$/),
  caseId: z.string().regex(/^P7-[A-Z0-9]+-[0-9]{3}$/),
  severity: z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]),
  status: z.enum(["OPEN", "MITIGATED", "CLOSED"]),
  ownerId: z.string().min(3).max(100),
  evidenceRef: z.string().min(3).max(200),
}).strict();

export const UatSignatureSchema = z.object({
  ownerId: z.string().min(3).max(100),
  ownerRole: z.enum(["TESTER", "CLINICAL", "SECURITY", "ACCESSIBILITY", "OPERATIONS", "PRODUCT"]),
  decision: z.enum(["APPROVE", "REJECT"]),
  signedAt: z.string().datetime(),
  evidenceChecksum: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

export const UatEvidenceSchema = z.object({
  version: z.literal(1),
  runId: z.string().regex(/^uat-[a-z0-9-]{3,80}$/),
  fixtureChecksum: z.string().regex(/^[a-f0-9]{64}$/),
  buildCommit: z.string().regex(/^[a-f0-9]{7,40}$/),
  revision: z.number().int().nonnegative(),
  results: z.array(z.object({
    caseId: z.string().regex(/^P7-[A-Z0-9]+-[0-9]{3}$/),
    actorId: z.string().regex(/^synthetic-/),
    status: UatResultStatusSchema,
    evidenceRef: z.string().min(3).max(200),
  }).strict()).max(4000),
  defects: z.array(UatDefectSchema).max(500),
  signatures: z.array(UatSignatureSchema).max(20),
}).strict();
export type UatEvidence = z.infer<typeof UatEvidenceSchema>;

export const RolloutManifestSchema = z.object({
  version: z.literal(1),
  releaseId: z.string().min(1).max(100),
  capability: z.enum(CAPABILITIES),
  currentRing: z.union([z.literal(0), z.literal(10), z.literal(25), z.literal(50), z.literal(100)]),
  targetRing: z.union([z.literal(0), z.literal(10), z.literal(25), z.literal(50), z.literal(100)]),
  previousRing: z.union([z.literal(0), z.literal(10), z.literal(25), z.literal(50), z.literal(100)]),
  configChecksum: z.string().regex(/^[a-f0-9]{64}$/),
  backupRestorePoint: z.string().min(1).max(200),
  onCallOwner: z.string().min(1).max(100),
  approvedBy: z.array(z.string().min(1).max(100)).max(10),
  updatedAt: z.string().datetime(),
}).strict();
export type RolloutManifest = z.infer<typeof RolloutManifestSchema>;

export const RollbackRequestSchema = z.object({
  version: z.literal(1),
  capability: z.enum(CAPABILITIES),
  requestId: z.string().regex(/^rollback-[a-z0-9-]{3,80}$/),
  expectedUpdatedAt: z.string().datetime(),
  expectedConfigChecksum: z.string().regex(/^[a-f0-9]{64}$/),
  reasonCode: z.enum(["SEV1", "ERROR_RATE", "SECURITY", "CLINICAL", "OPERATOR_DRILL"]),
  actorId: z.string().min(3).max(100),
}).strict();
export type RollbackRequest = z.infer<typeof RollbackRequestSchema>;

export type RollbackAudit = Readonly<{
  requestId: string;
  capability: ReleaseCapability;
  actorHash: string;
  reasonCode: RollbackRequest["reasonCode"];
  fromRing: RolloutRing;
  toRing: 0;
  occurredAt: string;
}>;

export const FinalSignatureSchema = z.object({
  ownerId: z.string().min(3).max(100),
  role: z.enum(["CLINICAL", "SECURITY", "OPERATIONS", "PRODUCT", "RELEASE_MANAGER"]),
  decision: z.enum(["APPROVE", "REJECT"]),
  signedAt: z.string().datetime(),
  evidenceChecksum: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

export const ProgressiveRolloutEvidenceSchema = GateEvidenceSchema.extend({
  version: z.literal(1),
  releaseId: z.string().min(1).max(100),
  revision: z.number().int().nonnegative(),
  ring: z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]),
  evaluatedAt: z.string().datetime(),
  scopeParityPassed: z.boolean(),
  autosaveSuccessRate: z.number().min(0).max(1),
  backup: z.object({
    restorePoint: z.string().min(3).max(200),
    restoreDrillPassed: z.boolean(),
    verifiedAt: z.string().datetime(),
    rpoMinutes: z.number().int().nonnegative().max(10080),
    rtoMinutes: z.number().int().nonnegative().max(10080),
  }).strict(),
  onCall: z.object({
    primaryOwner: z.string().min(3).max(100),
    secondaryOwner: z.string().min(3).max(100),
    coverageMinutes: z.number().int().nonnegative().max(10080),
    escalationTested: z.boolean(),
  }).strict(),
  knownIssues: z.array(z.object({
    id: z.string().regex(/^KI-[A-Z0-9-]{3,64}$/),
    severity: z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]),
    status: z.enum(["OPEN", "MITIGATED", "CLOSED"]),
    ownerId: z.string().min(3).max(100),
    dueAt: z.string().datetime(),
    evidenceRef: z.string().min(3).max(200),
  }).strict()).max(500),
  signatures: z.array(FinalSignatureSchema).max(20),
  postReleaseReviewAt: z.string().datetime(),
}).strict();
export type ProgressiveRolloutEvidence = z.infer<typeof ProgressiveRolloutEvidenceSchema>;

export type ProgressiveGateDecision = GateDecision & Readonly<{ evaluatedRevision: number }>;