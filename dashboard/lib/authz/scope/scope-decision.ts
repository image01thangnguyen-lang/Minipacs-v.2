import type { AuthorizationMode } from "./authorization-mode";

// ─── Reason codes ────────────────────────────────────────────────────────────

export type ScopeDecisionReasonCode =
  | "ALLOWED_BY_GRANT"
  | "ADMIN_BYPASS"
  | "GLOBAL_PERMISSION_MISSING"
  | "NO_SCOPE_GRANT"
  | "EXPLICIT_DENY"
  | "RESOURCE_UNCLASSIFIED"
  | "AMBIGUOUS_MACHINE"
  | "GRANT_EXPIRED"
  | "RESOURCE_INACTIVE"
  | "MODE_OFF"
  | "MODE_SHADOW"
  | "SCOPE_NOT_APPLICABLE"
  | "LEGACY_NO_OPINION";

// ─── AE Title Resolution ────────────────────────────────────────────────────

export type AeResolutionStatus =
  | "MATCHED"
  | "MISSING_IDENTIFIER"
  | "NO_MATCH"
  | "AMBIGUOUS"
  | "RESOURCE_INACTIVE";

export type AeResolutionResult = {
  status: AeResolutionStatus;
  dicomNodeId: string | null;
  facilityUnitId: string | null;
  aeTitle: string | null;
};

// ─── Resource context ────────────────────────────────────────────────────────

export type ResourceType = "STUDY" | "ORDER" | "NON_DICOM";

export type ResourceContextInput = {
  resourceType: ResourceType;
  performingUnitId?: string | null;
  stationAeTitle?: string | null;
  machineId?: string | null;
  facilityId?: string | null;
};

export type ResolvedResourceContext = {
  performingUnitId: string | null;
  ancestorUnitIds: string[];
  dicomNodeId: string | null;
  facilityUnitId: string | null;
  aeResolution: AeResolutionResult;
  classified: boolean;
};

// ─── Scope trace ─────────────────────────────────────────────────────────────

export type ScopeTraceEntry = {
  grantId: string;
  source: "USER" | "ROLE_PROFILE" | "LEGACY";
  effect: "ALLOW" | "DENY";
  facilityUnitId: string | null;
  dicomNodeId: string | null;
  matchType: "DIRECT" | "INHERITED" | "LEGACY_MACHINE";
  capability: string;
};

// ─── Grant evaluation ────────────────────────────────────────────────────────

export type GrantEvaluationResult = {
  allowed: boolean;
  hasMatchingOpinion: boolean;
  hasConfiguredGrant: boolean;
  traces: ScopeTraceEntry[];
};

// ─── Final decision ──────────────────────────────────────────────────────────

export type ScopeDecision = {
  baselineAllowed: boolean;
  proposedAllowed: boolean;
  effectiveAllowed: boolean;
  mode: AuthorizationMode;
  reasonCode: ScopeDecisionReasonCode;
  scopeTrace: ScopeTraceEntry[];
  resourceContext: ResolvedResourceContext;
};

// ─── Principal ───────────────────────────────────────────────────────────────

export type ScopePrincipal = {
  userId: string;
  baseRole: string;
  roleProfileId: string | null;
  globalPermissions: string[];
  isActive: boolean;
};
