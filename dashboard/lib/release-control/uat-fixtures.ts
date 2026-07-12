import { createHash } from "crypto";
import { SyntheticUatFixture, SyntheticUatFixtureSchema, UatEvidence, UatEvidenceSchema } from "./contracts";

const FORBIDDEN_PHI_KEYS = /^(patient(Name|Id|BirthDate)|accession(Number)?|report(Text)?|findings|conclusion)$/i;

export function parseSyntheticUatFixture(input: unknown): SyntheticUatFixture {
  const fixture = SyntheticUatFixtureSchema.parse(input);
  const inspect = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_PHI_KEYS.test(key)) throw new Error(`PHI_FIELD_FORBIDDEN:${key}`);
      if (typeof child === "string" && /Bearer\s+\S+|eyJ[A-Za-z0-9_-]+\./i.test(child)) throw new Error("SECRET_FORBIDDEN");
      inspect(child);
    }
  };
  inspect(fixture);
  return fixture;
}

export function fixtureMatrix(fixture: SyntheticUatFixture) {
  const actors = new Map(fixture.actors.map(actor => [actor.id, actor]));
  return fixture.cases.flatMap(testCase => testCase.actorIds.map(actorId => ({
    caseId: testCase.id,
    category: testCase.category,
    actor: actors.get(actorId)!,
    expected: testCase.expected,
  })));
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function evidenceChecksum(value: unknown): string {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

export function validateUatEvidence(raw: unknown, fixture: SyntheticUatFixture): UatEvidence {
  const evidence = UatEvidenceSchema.parse(raw);
  if (evidence.fixtureChecksum !== evidenceChecksum(fixture)) throw new Error("FIXTURE_CHECKSUM_MISMATCH");
  const expected = fixtureMatrix(fixture).map(row => `${row.caseId}:${row.actor.id}`);
  const actual = evidence.results.map(row => `${row.caseId}:${row.actorId}`);
  if (new Set(actual).size !== actual.length) throw new Error("DUPLICATE_UAT_RESULT");
  if (expected.some(key => !actual.includes(key)) || actual.some(key => !expected.includes(key))) throw new Error("INCOMPLETE_OR_UNKNOWN_UAT_MATRIX");
  const caseIds = new Set(fixture.cases.map(item => item.id));
  if (evidence.defects.some(defect => !caseIds.has(defect.caseId))) throw new Error("UNKNOWN_DEFECT_CASE");
  if (evidence.results.some(result => result.status !== "PASS") && evidence.defects.length === 0) throw new Error("FAILED_RESULT_REQUIRES_DEFECT");
  if (evidence.defects.some(defect => ["SEV1", "SEV2"].includes(defect.severity) && defect.status !== "CLOSED")) throw new Error("OPEN_STOP_SHIP_DEFECT");
  const signable = { ...evidence, signatures: [] };
  const checksum = evidenceChecksum(signable);
  if (evidence.signatures.some(signature => signature.evidenceChecksum !== checksum)) throw new Error("STALE_EVIDENCE_SIGNATURE");
  const owners = new Set(evidence.signatures.map(signature => signature.ownerId));
  if (owners.size !== evidence.signatures.length) throw new Error("DUPLICATE_SIGNER");
  const roles = new Set(evidence.signatures.filter(signature => signature.decision === "APPROVE").map(signature => signature.ownerRole));
  if (!roles.has("TESTER") || !roles.has("CLINICAL") || !roles.has("SECURITY") || !roles.has("OPERATIONS")) throw new Error("REQUIRED_OWNER_APPROVALS_MISSING");
  if (evidence.signatures.some(signature => signature.decision === "REJECT")) throw new Error("OWNER_REJECTED_UAT");
  return evidence;
}