import { GateDecision, GateEvidence, GateEvidenceSchema, ProgressiveGateDecision, ProgressiveRolloutEvidenceSchema, RolloutRing } from "./contracts";

const MIN_SOAK: Record<RolloutRing, number> = { 0: 0, 10: 60, 25: 240, 50: 720, 100: 1440 };

export function decideRolloutGate(raw: unknown, targetRing: RolloutRing): GateDecision {
  const evidence: GateEvidence = GateEvidenceSchema.parse(raw);
  const reasons: string[] = [];
  if (evidence.openSev1 > 0 || evidence.errorRate >= 0.05) {
    return { decision: "ROLLBACK", reasons: ["SEV1_OR_ERROR_BUDGET_BREACH"] };
  }
  if (!evidence.securityPassed) reasons.push("SECURITY_GATE");
  if (!evidence.accessibilityPassed) reasons.push("ACCESSIBILITY_GATE");
  if (!evidence.uatApproved) reasons.push("UAT_APPROVAL");
  if (!evidence.rollbackDrillPassed) reasons.push("ROLLBACK_DRILL");
  if (evidence.openSev2 > 0) reasons.push("OPEN_SEV2");
  if (evidence.errorRate >= 0.01) reasons.push("ERROR_RATE");
  if (evidence.p95Ms > 1500) reasons.push("P95_LATENCY");
  if (evidence.observedMinutes < MIN_SOAK[targetRing]) reasons.push("SOAK_WINDOW");
  return reasons.length ? { decision: "HOLD", reasons } : { decision: "GO", reasons: [] };
}

export function assertRingTransition(current: RolloutRing, target: RolloutRing): void {
  const order: RolloutRing[] = [0, 10, 25, 50, 100];
  const currentIndex = order.indexOf(current);
  const targetIndex = order.indexOf(target);
  if (target === 0) return; // emergency rollback is always permitted
  if (targetIndex !== currentIndex + 1) throw new Error("INVALID_ROLLOUT_RING_TRANSITION");
}

/** Final ring evaluator. Strict input and explicit negative evidence fail closed. */
export function decideProgressiveGate(raw: unknown): ProgressiveGateDecision {
  const evidence = ProgressiveRolloutEvidenceSchema.parse(raw);
  const base = decideRolloutGate({
    securityPassed: evidence.securityPassed,
    accessibilityPassed: evidence.accessibilityPassed,
    uatApproved: evidence.uatApproved,
    rollbackDrillPassed: evidence.rollbackDrillPassed,
    openSev1: evidence.openSev1,
    openSev2: evidence.openSev2,
    errorRate: evidence.errorRate,
    p95Ms: evidence.p95Ms,
    supportOwner: evidence.supportOwner,
    observedMinutes: evidence.observedMinutes,
  }, evidence.ring);
  if (base.decision === "ROLLBACK" || !evidence.scopeParityPassed) {
    return { decision: "ROLLBACK", reasons: ["STOP_SHIP"], evaluatedRevision: evidence.revision };
  }
  const reasons = [...base.reasons];
  if (evidence.autosaveSuccessRate < 0.99) reasons.push("AUTOSAVE_SUCCESS");
  if (!evidence.backup.restoreDrillPassed) reasons.push("BACKUP_RESTORE_DRILL");
  if (!evidence.onCall.escalationTested || evidence.onCall.coverageMinutes < MIN_SOAK[evidence.ring]) reasons.push("ON_CALL_COVERAGE");
  if (evidence.onCall.primaryOwner === evidence.onCall.secondaryOwner) reasons.push("INDEPENDENT_ON_CALL");
  if (evidence.knownIssues.some(issue => issue.status !== "CLOSED" && (issue.severity === "SEV1" || issue.severity === "SEV2"))) reasons.push("OPEN_CRITICAL_ISSUE");
  const approvals = evidence.signatures.filter(signature => signature.decision === "APPROVE");
  const roles = new Set(approvals.map(signature => signature.role));
  if (evidence.ring === 100 && !["CLINICAL", "SECURITY", "OPERATIONS", "PRODUCT", "RELEASE_MANAGER"].every(role => roles.has(role as typeof approvals[number]["role"]))) reasons.push("FINAL_SIGNATURES");
  if (evidence.signatures.some(signature => signature.decision === "REJECT")) reasons.push("SIGNATURE_REJECTED");
  return { decision: reasons.length ? "HOLD" : "GO", reasons, evaluatedRevision: evidence.revision };
}

export function acceptFreshProgressiveDecision(currentRevision: number, decision: ProgressiveGateDecision): ProgressiveGateDecision {
  if (currentRevision !== decision.evaluatedRevision) throw new Error("STALE_PROGRESSIVE_DECISION");
  return decision;
}