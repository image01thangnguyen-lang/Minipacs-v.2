import { PilotGateDecision, PilotGateEvidenceSchema } from "./contracts";

const THRESHOLDS = {
  CLINICAL_SUPER_USERS: { participants: 5, journeys: 25, soak: 240, support: 240 },
  PILOT_HOSPITAL: { participants: 15, journeys: 100, soak: 1440, support: 1440 },
} as const;

/** Pure, bounded pilot evaluator. Invalid or incomplete evidence throws (fail closed). */
export function decidePilotGate(raw: unknown): PilotGateDecision {
  const evidence = PilotGateEvidenceSchema.parse(raw);
  const threshold = THRESHOLDS[evidence.ring];
  const open = evidence.feedback.filter(item => item.status !== "CLOSED");

  if (open.some(item => item.severity === "SEV1") || evidence.errorRate >= 0.05 || !evidence.scopeParityPassed) {
    return { decision: "ROLLBACK", reasons: ["STOP_SHIP"], releaseCandidate: false, evaluatedRevision: evidence.revision };
  }

  const reasons: string[] = [];
  if (!evidence.securityPassed) reasons.push("SECURITY_GATE");
  if (!evidence.rollbackDrillPassed) reasons.push("ROLLBACK_DRILL");
  if (open.some(item => item.severity === "SEV2")) reasons.push("OPEN_SEV2");
  if (evidence.errorRate >= 0.01) reasons.push("ERROR_RATE");
  if (evidence.p95Ms > 1500) reasons.push("P95_LATENCY");
  if (evidence.autosaveSuccessRate < 0.99) reasons.push("AUTOSAVE_SUCCESS");
  if (evidence.participantCount < threshold.participants) reasons.push("PARTICIPANT_SAMPLE");
  if (evidence.completedCriticalJourneys < threshold.journeys) reasons.push("CRITICAL_JOURNEYS");
  if (evidence.observedMinutes < threshold.soak) reasons.push("SOAK_WINDOW");
  if (evidence.support.coverageMinutes < threshold.support || !evidence.support.escalationTested) reasons.push("SUPPORT_COVERAGE");
  if (new Set([evidence.support.primaryOwner, evidence.support.clinicalOwner, evidence.support.securityOwner]).size < 3) reasons.push("INDEPENDENT_OWNERS");
  if (open.some(item => !item.ownerId)) reasons.push("UNOWNED_FEEDBACK"); // schema also protects this boundary

  const decision = reasons.length ? "HOLD" : "GO";
  return {
    decision,
    reasons,
    releaseCandidate: decision === "GO" && evidence.ring === "PILOT_HOSPITAL",
    evaluatedRevision: evidence.revision,
  };
}

/** Prevents an older asynchronous gate result from replacing a newer operator view. */
export function acceptFreshPilotDecision(currentRevision: number, decision: PilotGateDecision): PilotGateDecision {
  if (decision.evaluatedRevision !== currentRevision) throw new Error("STALE_PILOT_DECISION");
  return decision;
}