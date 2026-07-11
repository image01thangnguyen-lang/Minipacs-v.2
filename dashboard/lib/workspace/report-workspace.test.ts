import assert from "node:assert/strict";
import {
  ReportWorkspaceDetailSchema,
  ReportPanelActionsSchema,
} from "./report-workspace";

console.log("--- Report Workspace Contract Tests ---");

// ─── Helpers ────────────────────────────────────────────────────────────────────

const DENIED_ACTIONS = {
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

const READ_ONLY_ACTIONS = { ...DENIED_ACTIONS, readReport: true };
const EDITABLE_ACTIONS = { ...READ_ONLY_ACTIONS, draftReport: true };

// ─── ReportPanelActionsSchema ─────────────────────────────────────────────────

// accepts all-denied
assert.doesNotThrow(() => ReportPanelActionsSchema.parse(DENIED_ACTIONS));
console.log("✅ PASS: accepts all-denied actions");

// accepts read-only
assert.doesNotThrow(() => ReportPanelActionsSchema.parse(READ_ONLY_ACTIONS));
console.log("✅ PASS: accepts read-only actions");

// accepts editable
assert.doesNotThrow(() => ReportPanelActionsSchema.parse(EDITABLE_ACTIONS));
console.log("✅ PASS: accepts editable actions");

// rejects non-boolean field
assert.equal(
  ReportPanelActionsSchema.safeParse({ ...DENIED_ACTIONS, readReport: "yes" }).success,
  false
);
console.log("✅ PASS: rejects non-boolean field");

// rejects missing required field
const { readReport: _, ...incomplete } = DENIED_ACTIONS;
assert.equal(ReportPanelActionsSchema.safeParse(incomplete).success, false);
console.log("✅ PASS: rejects missing required field");

// rejects unknown fields (strict mode)
assert.equal(
  ReportPanelActionsSchema.safeParse({ ...DENIED_ACTIONS, editClinical: true }).success,
  false
);
console.log("✅ PASS: rejects unknown fields (strict)");

// ─── ReportWorkspaceDetailSchema ──────────────────────────────────────────────

const validPayload = {
  studyUid: "1.2.3.4",
  findings: "Normal",
  conclusion: "Normal study",
  recommendation: null,
  printTemplateId: "tpl-1",
  reportId: "rep-1",
  reportStatus: "DRAFT",
  revision: 1720656000000,
  updatedAt: "2026-07-11T00:00:00.000Z",
  createdAt: "2026-07-11T00:00:00.000Z",
  allowedActions: EDITABLE_ACTIONS,
};

// accepts valid input with all fields
assert.doesNotThrow(() => ReportWorkspaceDetailSchema.parse(validPayload));
console.log("✅ PASS: accepts valid input with all fields");

// accepts null reportStatus and revision (no report exists)
const noReport = {
  ...validPayload,
  reportId: null,
  reportStatus: null,
  revision: null,
  findings: null,
  conclusion: null,
  recommendation: null,
  printTemplateId: null,
  updatedAt: null,
  createdAt: null,
};
assert.doesNotThrow(() => ReportWorkspaceDetailSchema.parse(noReport));
console.log("✅ PASS: accepts null reportStatus/revision");

// strips unknown fields
const parsed = ReportWorkspaceDetailSchema.parse({ ...validPayload, secretInternalId: "123" });
assert.equal("secretInternalId" in parsed, false);
console.log("✅ PASS: strips unknown fields");

// rejects missing required studyUid
const { studyUid: __, ...noUid } = validPayload;
assert.equal(ReportWorkspaceDetailSchema.safeParse(noUid).success, false);
console.log("✅ PASS: rejects missing studyUid");

// rejects empty studyUid
assert.equal(
  ReportWorkspaceDetailSchema.safeParse({ ...validPayload, studyUid: "" }).success,
  false
);
console.log("✅ PASS: rejects empty studyUid");

// rejects missing allowedActions
const { allowedActions: ___, ...noActions } = validPayload;
assert.equal(ReportWorkspaceDetailSchema.safeParse(noActions).success, false);
console.log("✅ PASS: rejects missing allowedActions");

// rejects non-integer revision
assert.equal(
  ReportWorkspaceDetailSchema.safeParse({ ...validPayload, revision: 1.5 }).success,
  false
);
console.log("✅ PASS: rejects non-integer revision");

// read-only contract: draftReport=false means editor should be read-only
const readOnlyParsed = ReportWorkspaceDetailSchema.parse({
  ...validPayload,
  allowedActions: READ_ONLY_ACTIONS,
});
assert.equal(readOnlyParsed.allowedActions.draftReport, false);
assert.equal(readOnlyParsed.allowedActions.readReport, true);
console.log("✅ PASS: read-only contract verified");

// forged extra field in allowedActions rejected (strict)
assert.equal(
  ReportWorkspaceDetailSchema.safeParse({
    ...validPayload,
    allowedActions: { ...EDITABLE_ACTIONS, deletePatient: true },
  }).success,
  false
);
console.log("✅ PASS: forged allowedActions field rejected");

console.log("--- All Report Workspace Contract Tests Passed ---");
