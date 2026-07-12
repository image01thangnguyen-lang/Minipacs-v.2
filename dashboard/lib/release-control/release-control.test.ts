import assert from "assert";
import { evaluateFlagDecisions, evaluateFlags, parseFlagConfigs } from "./feature-flags";
import { acceptFreshProgressiveDecision, decideProgressiveGate, decideRolloutGate } from "./gates";
import { parseSyntheticUatFixture, fixtureMatrix, evidenceChecksum, validateUatEvidence } from "./uat-fixtures";
import { planCapabilityRollback, planPromotion, planRollback } from "./rollout";
import { acceptFreshPilotDecision, decidePilotGate } from "./pilot";
import fs from "fs";
import path from "path";

const flags = [
  { version: 1, capability: "observability", enabled: true, percentage: 100, allowFacilityIds: [], denyFacilityIds: [], dependencies: [] },
  { version: 1, capability: "doctor-workspace", enabled: true, percentage: 100, allowFacilityIds: [], denyFacilityIds: ["facility-b"], dependencies: ["observability"] },
] as const;

const first = evaluateFlags(flags, { userId: "synthetic-user-01", facilityId: "facility-a" });
const second = evaluateFlags(flags, { userId: "synthetic-user-01", facilityId: "facility-a" });
assert.deepStrictEqual(first, second, "cohort assignment must be stable");
assert.equal(first["doctor-workspace"], true);
assert.equal(evaluateFlags(flags, { userId: "synthetic-user-02", facilityId: "facility-b" })["doctor-workspace"], false, "deny wins");
assert.equal(evaluateFlags(flags, null)["doctor-workspace"], false, "missing server subject fails closed");
assert.throws(() => parseFlagConfigs([{ ...flags[0], unknown: true }]), /unrecognized/i, "unknown client fields rejected");
assert.throws(() => parseFlagConfigs([
  { ...flags[0], dependencies: ["doctor-workspace"] },
  { ...flags[1], dependencies: ["observability"] },
]), /CYCLIC_DEPENDENCY/);
assert.equal(evaluateFlags([{ ...flags[0], unknown: true }], { userId: "synthetic-user-01", facilityId: "facility-a" }).observability, false, "invalid config fails closed");
assert.equal(evaluateFlagDecisions(flags, { userId: "synthetic-user-02", facilityId: "facility-b" })["doctor-workspace"].reason, "FACILITY_DENIED");

const healthy = { securityPassed: true, accessibilityPassed: true, uatApproved: true, rollbackDrillPassed: true, openSev1: 0, openSev2: 0, errorRate: 0.001, p95Ms: 800, supportOwner: "synthetic-owner", observedMinutes: 240 };
assert.equal(decideRolloutGate(healthy, 25).decision, "GO");
assert.equal(decideRolloutGate({ ...healthy, observedMinutes: 10 }, 25).decision, "HOLD");
assert.equal(decideRolloutGate({ ...healthy, openSev1: 1 }, 25).decision, "ROLLBACK");

const fixture = parseSyntheticUatFixture(JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../prisma/uat-phase7-fixtures.json"), "utf8")));
assert.ok(fixtureMatrix(fixture).length >= fixture.cases.length, "deterministic role/facility matrix is generated");
assert.throws(() => parseSyntheticUatFixture({ ...fixture, patientName: "Real Person" }), /unrecognized|PHI_FIELD/i);

const unsignedEvidence = {
  version: 1, runId: "uat-phase7-pr4", fixtureChecksum: evidenceChecksum(fixture), buildCommit: "ec988b38", revision: 0,
  results: fixtureMatrix(fixture).map(row => ({ caseId: row.caseId, actorId: row.actor.id, status: "PASS", evidenceRef: `artifact://${row.caseId}/${row.actor.id}` })),
  defects: [], signatures: [],
} as const;
const signedChecksum = evidenceChecksum(unsignedEvidence);
const signatures = (["TESTER", "CLINICAL", "SECURITY", "OPERATIONS"] as const).map((ownerRole, index) => ({ ownerId: `synthetic-owner-${index}`, ownerRole, decision: "APPROVE" as const, signedAt: "2026-07-12T00:00:00.000Z", evidenceChecksum: signedChecksum }));
assert.equal(validateUatEvidence({ ...unsignedEvidence, signatures }, fixture).runId, unsignedEvidence.runId);
assert.throws(() => validateUatEvidence({ ...unsignedEvidence, results: unsignedEvidence.results.slice(1), signatures }, fixture), /INCOMPLETE/);
assert.throws(() => validateUatEvidence({ ...unsignedEvidence, signatures: signatures.slice(1) }, fixture), /APPROVALS/);
assert.throws(() => validateUatEvidence({ ...unsignedEvidence, revision: 1, signatures }, fixture), /STALE_EVIDENCE_SIGNATURE/);

const manifest = {
  version: 1, releaseId: "phase7-rc1", capability: "doctor-workspace", currentRing: 10, targetRing: 25,
  previousRing: 0, configChecksum: "a".repeat(64), backupRestorePoint: "backup-synthetic-001",
  onCallOwner: "ops-primary", approvedBy: ["clinical-owner", "security-owner"], updatedAt: "2026-07-12T00:00:00.000Z",
} as const;
assert.equal(planPromotion(manifest, healthy).currentRing, 25);
assert.throws(() => planPromotion({ ...manifest, currentRing: 10, targetRing: 50 }, healthy), /INVALID_ROLLOUT/);
assert.throws(() => planPromotion({ ...manifest, approvedBy: ["same-owner"] }, healthy), /INDEPENDENT_APPROVALS/);
assert.throws(() => planPromotion({ ...manifest, approvedBy: ["same-owner", "same-owner"] }, healthy), /INDEPENDENT_APPROVALS/);
assert.equal(planRollback(manifest).currentRing, 0);
const rollbackRequest = { version: 1, capability: "doctor-workspace", requestId: "rollback-drill-001", expectedUpdatedAt: manifest.updatedAt, expectedConfigChecksum: manifest.configChecksum, reasonCode: "OPERATOR_DRILL", actorId: "synthetic-operator" } as const;
const rollbackA = planCapabilityRollback(manifest, rollbackRequest, new Date("2026-07-12T01:00:00.000Z"));
const rollbackB = planCapabilityRollback(manifest, rollbackRequest, new Date("2026-07-12T01:00:00.000Z"));
assert.deepStrictEqual(rollbackA, rollbackB, "same request and clock is idempotent");
assert.equal(rollbackA.manifest.currentRing, 0);
assert.equal(rollbackA.audit.actorHash.length, 16, "audit stores scrubbed actor metadata");
assert.throws(() => planCapabilityRollback({ ...manifest, updatedAt: "2026-07-12T00:01:00.000Z" }, rollbackRequest), /STALE_ROLLBACK_REQUEST/);

const pilotHealthy = {
  version: 1, releaseId: "phase7-rc1", ring: "PILOT_HOSPITAL", revision: 7,
  evaluatedAt: "2026-07-12T00:00:00.000Z", participantCount: 15,
  completedCriticalJourneys: 100, observedMinutes: 1440, securityPassed: true,
  scopeParityPassed: true, rollbackDrillPassed: true, errorRate: 0.001, p95Ms: 900,
  autosaveSuccessRate: 0.999, support: { primaryOwner: "ops-owner", clinicalOwner: "clinical-owner", securityOwner: "security-owner", coverageMinutes: 1440, escalationTested: true },
  feedback: [{ id: "FB-PILOT-001", severity: "SEV3", status: "MITIGATED", ownerId: "product-owner", dueAt: "2026-07-13T00:00:00.000Z", evidenceRef: "artifact://feedback/001" }],
} as const;
const rcDecision = decidePilotGate(pilotHealthy);
assert.equal(rcDecision.decision, "GO");
assert.equal(rcDecision.releaseCandidate, true, "only a healthy pilot hospital exit creates an RC");
assert.equal(decidePilotGate({ ...pilotHealthy, feedback: [{ ...pilotHealthy.feedback[0], severity: "SEV2", status: "OPEN" }] }).decision, "HOLD");
assert.equal(decidePilotGate({ ...pilotHealthy, scopeParityPassed: false }).decision, "ROLLBACK", "scope leak is stop-ship");
assert.equal(decidePilotGate({ ...pilotHealthy, observedMinutes: 60 }).decision, "HOLD");
assert.throws(() => decidePilotGate({ ...pilotHealthy, patientName: "PHI" }), /unrecognized/i);
assert.throws(() => decidePilotGate({ ...pilotHealthy, support: { ...pilotHealthy.support, primaryOwner: "" } }), /too_small/i);
assert.throws(() => acceptFreshPilotDecision(8, rcDecision), /STALE_PILOT_DECISION/);
assert.deepStrictEqual(decidePilotGate(pilotHealthy), rcDecision, "gate evaluation is idempotent for one evidence revision");

const progressiveUnsigned = {
  ...healthy, version: 1, releaseId: "phase7-rc1", revision: 9, ring: 100,
  evaluatedAt: "2026-07-12T00:00:00.000Z", observedMinutes: 1440,
  scopeParityPassed: true, autosaveSuccessRate: 0.999,
  backup: { restorePoint: "backup-synthetic-001", restoreDrillPassed: true, verifiedAt: "2026-07-12T00:00:00.000Z", rpoMinutes: 15, rtoMinutes: 30 },
  onCall: { primaryOwner: "ops-primary", secondaryOwner: "ops-secondary", coverageMinutes: 1440, escalationTested: true },
  knownIssues: [{ id: "KI-ROLLOUT-001", severity: "SEV3", status: "CLOSED", ownerId: "product-owner", dueAt: "2026-07-13T00:00:00.000Z", evidenceRef: "artifact://known-issue/001" }],
  signatures: [], postReleaseReviewAt: "2026-07-19T00:00:00.000Z",
} as const;
const finalRoles = ["CLINICAL", "SECURITY", "OPERATIONS", "PRODUCT", "RELEASE_MANAGER"] as const;
const finalSignatures = finalRoles.map((role, index) => ({ ownerId: `final-owner-${index}`, role, decision: "APPROVE" as const, signedAt: "2026-07-12T00:00:00.000Z", evidenceChecksum: "b".repeat(64) }));
const progressiveHealthy = { ...progressiveUnsigned, signatures: finalSignatures };
assert.equal(decideProgressiveGate(progressiveHealthy).decision, "GO");
assert.equal(decideProgressiveGate({ ...progressiveHealthy, scopeParityPassed: false }).decision, "ROLLBACK");
assert.equal(decideProgressiveGate({ ...progressiveHealthy, backup: { ...progressiveHealthy.backup, restoreDrillPassed: false } }).decision, "HOLD");
assert.equal(decideProgressiveGate({ ...progressiveHealthy, signatures: finalSignatures.slice(1) }).decision, "HOLD");
assert.throws(() => decideProgressiveGate({ ...progressiveHealthy, patientName: "PHI" }), /unrecognized/i);
assert.throws(() => acceptFreshProgressiveDecision(10, decideProgressiveGate(progressiveHealthy)), /STALE_PROGRESSIVE_DECISION/);

async function testServerBoundary() {
  const { evaluateScopedCapability } = await import("./server-flags");
  let reauthorized = 0;
  const audit: unknown[] = [];
  const deps = {
    authenticate: async () => ({ userId: "server-user" }),
    reauthorizeResource: async () => { reauthorized += 1; return { facilityId: "facility-a" }; },
    loadConfig: async () => flags,
    audit: (event: unknown) => audit.push(event),
  };
  assert.equal((await evaluateScopedCapability({ capability: "doctor-workspace", resourceId: "study-1" }, deps)).enabled, true);
  assert.equal(reauthorized, 1, "resource is reauthorized for every boundary evaluation");
  assert.ok(!JSON.stringify(audit).includes("server-user") && !JSON.stringify(audit).includes("facility-a"), "audit omits subject/resource metadata");
  assert.throws(() => FlagEvaluationRequestSchema.parse({ capability: "doctor-workspace", resourceId: "study-1", facilityId: "forged" }), /unrecognized/i);
  assert.equal((await evaluateScopedCapability({ capability: "doctor-workspace", resourceId: "study-1" }, { ...deps, authenticate: async () => null })).enabled, false);
}

import { FlagEvaluationRequestSchema } from "./contracts";
testServerBoundary().then(() => console.log("release control tests passed"));