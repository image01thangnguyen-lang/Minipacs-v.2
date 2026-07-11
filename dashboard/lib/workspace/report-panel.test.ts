import assert from "node:assert/strict";
import { ReportPanelActionsSchema, ReportWorkspaceDetailSchema } from "./report-workspace";

/**
 * Report Panel Contract Tests
 *
 * Tests the read-only determination logic and panel action schema
 * as a standalone contract verification (no server required).
 */

console.log("--- Report Panel Contract Tests ---");

// ─── Helpers ────────────────────────────────────────────────────────────────────

const allDenied = {
  readReport: false,
  draftReport: false,
  signReport: false,
  approveReport: false,
  cancelDraft: false,
  unfinalizeReport: false,
  syncHis: false,
  share: false,
  createConsultation: false,
};

const readOnlyCase = { ...allDenied, readReport: true };
const editableCase = { ...readOnlyCase, draftReport: true };
const signableCase = { ...editableCase, signReport: true };
const fullCase = {
  readReport: true,
  draftReport: true,
  signReport: true,
  approveReport: true,
  cancelDraft: true,
  unfinalizeReport: true,
  syncHis: true,
  share: true,
  createConsultation: true,
};

// ─── Read-only Determination ────────────────────────────────────────────────────

// readOnly when draftReport=false, readReport=true
const readOnlyParsed = ReportPanelActionsSchema.parse(readOnlyCase);
assert.equal(!readOnlyParsed.draftReport, true, "read-only when draftReport=false");
assert.equal(readOnlyParsed.readReport, true, "readReport should be true");
console.log("✅ PASS: readOnly when draftReport=false, readReport=true");

// editable when draftReport=true
const editableParsed = ReportPanelActionsSchema.parse(editableCase);
assert.equal(!editableParsed.draftReport, false, "should be editable");
console.log("✅ PASS: editable when draftReport=true");

// full permissions are all true
const fullParsed = ReportPanelActionsSchema.parse(fullCase);
for (const [key, value] of Object.entries(fullParsed)) {
  assert.equal(value, true, `fullCase.${key} should be true`);
}
console.log("✅ PASS: full permissions are all true");

// ─── Panel Contract ─────────────────────────────────────────────────────────────

const basePayload = {
  studyUid: "1.2.840.113619.2.1",
  findings: "<p>Normal chest</p>",
  conclusion: "No acute findings",
  recommendation: "Follow-up in 1 year",
  printTemplateId: "tpl-default",
  reportId: "report-001",
  reportStatus: "DRAFT",
  revision: 1720656000000,
  updatedAt: "2026-07-11T00:00:00.000Z",
  createdAt: "2026-07-10T23:00:00.000Z",
  allowedActions: editableCase,
};

// read-only panel (no report yet)
const noReportParsed = ReportWorkspaceDetailSchema.parse({
  studyUid: "1.2.3.4",
  findings: null,
  conclusion: null,
  recommendation: null,
  printTemplateId: null,
  reportId: null,
  reportStatus: null,
  revision: null,
  updatedAt: null,
  createdAt: null,
  allowedActions: readOnlyCase,
});
assert.equal(noReportParsed.reportId, null);
assert.equal(noReportParsed.allowedActions.draftReport, false);
assert.equal(noReportParsed.allowedActions.readReport, true);
console.log("✅ PASS: read-only panel (no report yet)");

// editable panel with DRAFT report
const draftParsed = ReportWorkspaceDetailSchema.parse(basePayload);
assert.equal(draftParsed.reportStatus, "DRAFT");
assert.equal(draftParsed.allowedActions.draftReport, true);
assert.equal(draftParsed.revision, 1720656000000);
console.log("✅ PASS: editable panel with DRAFT report");

// FINAL report with sign/approve allowed
const finalParsed = ReportWorkspaceDetailSchema.parse({
  ...basePayload,
  reportStatus: "FINAL",
  allowedActions: signableCase,
});
assert.equal(finalParsed.reportStatus, "FINAL");
assert.equal(finalParsed.allowedActions.signReport, true);
console.log("✅ PASS: FINAL report with sign allowed");

// extra fields on outer object are stripped
const leaked = ReportWorkspaceDetailSchema.parse({
  ...basePayload,
  doctorPrivateKey: "LEAKED",
});
assert.equal("doctorPrivateKey" in leaked, false);
console.log("✅ PASS: extra fields stripped from outer object");

// forged extra field in allowedActions rejected (strict)
assert.equal(
  ReportWorkspaceDetailSchema.safeParse({
    ...basePayload,
    allowedActions: { ...editableCase, deletePatient: true },
  }).success,
  false
);
console.log("✅ PASS: forged allowedActions field rejected");

console.log("--- All Report Panel Contract Tests Passed ---");
