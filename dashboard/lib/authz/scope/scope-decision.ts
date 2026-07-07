export type ScopeDecisionReasonCode =
  | "ALLOWED_BY_GRANT"
  | "ADMIN_BYPASS"
  | "GLOBAL_PERMISSION_MISSING"
  | "NO_SCOPE_GRANT"
  | "EXPLICIT_DENY"
  | "RESOURCE_UNCLASSIFIED"
  | "AMBIGUOUS_MACHINE"
  | "GRANT_EXPIRED"
  | "RESOURCE_INACTIVE";

export type ResourceContext = {
  performingUnitId: string | null;
  ancestorUnitIds: string[];
  dicomNodeId: string | null;
  classified: boolean;
};

export type ScopeDecision = {
  allowed: boolean;
  reasonCode: ScopeDecisionReasonCode;
  matchedGrantIds: string[];
  resourceContext: ResourceContext;
};
