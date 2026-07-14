import assert from "assert";
import { parseCreateIncidentInput, parseIncidentStatus } from "../incident-validation";

function validFormData() {
  const formData = new FormData();
  formData.append("shortDesc", "System crashed unexpectedly.");
  formData.append("severity", "SEV2");
  formData.append("module", "GENERAL");
  formData.append("contextType", "");
  formData.append("contextUrl", "/worklist?study=synthetic-id");
  return formData;
}

async function runTests() {
  console.log("--- support/incidents/actions characterization tests ---");

  const input = parseCreateIncidentInput(validFormData());
  assert.deepStrictEqual(input, {
    shortDesc: "System crashed unexpectedly.",
    severity: "SEV2",
    module: "GENERAL",
    contextType: null,
    contextId: null,
    contextUrl: "/worklist?study=synthetic-id",
  });

  const invalidSeverity = validFormData();
  invalidSeverity.set("severity", "SEV0");
  assert.throws(() => parseCreateIncidentInput(invalidSeverity), /Invalid incident severity/);

  const externalUrl = validFormData();
  externalUrl.set("contextUrl", "https://evil.example");
  assert.throws(() => parseCreateIncidentInput(externalUrl), /internal application path/);

  const protocolRelativeUrl = validFormData();
  protocolRelativeUrl.set("contextUrl", "//evil.example");
  assert.throws(() => parseCreateIncidentInput(protocolRelativeUrl), /internal application path/);

  const phiAttestation = validFormData();
  phiAttestation.set("containsPhiRisk", "on");
  assert.throws(() => parseCreateIncidentInput(phiAttestation), /containing PHI cannot be saved/);

  const detectedPhi = validFormData();
  detectedPhi.set("shortDesc", "Patient Name: Synthetic Person");
  assert.throws(() => parseCreateIncidentInput(detectedPhi), /Potential PHI detected/);

  assert.strictEqual(parseIncidentStatus(" RESOLVED "), "RESOLVED");
  assert.throws(() => parseIncidentStatus("DELETED"), /Invalid incident status/);

  console.log("PASS: Support incident validation contract");
}

runTests().catch(error => {
  console.error("FAIL", error);
  process.exitCode = 1;
});
