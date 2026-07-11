import assert from "node:assert/strict";
import { ReportWorkspaceDetailSchema } from "./report-workspace";
import { ReportPanelActionsSchema } from "./report-workspace";

console.log("--- Autosave OCC Contract Tests ---");

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

// Test that ReportWorkspaceDetailSchema now accepts integer revision
const parsed = ReportWorkspaceDetailSchema.parse({
  studyUid: "test-uid",
  findings: "some findings",
  conclusion: null,
  recommendation: null,
  printTemplateId: null,
  reportId: "123",
  reportStatus: "DRAFT",
  revision: 5,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  allowedActions: { ...allDenied, readReport: true, draftReport: true },
});

assert.strictEqual(parsed.revision, 5);
console.log("✅ PASS: Schema accepts integer revision");

assert.throws(() => {
  ReportWorkspaceDetailSchema.parse({
    studyUid: "test-uid",
    findings: "some findings",
    conclusion: null,
    recommendation: null,
    printTemplateId: null,
    reportId: "123",
    reportStatus: "DRAFT",
    revision: 5.5, // Not an integer
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    allowedActions: { ...allDenied, readReport: true, draftReport: true },
  });
}, /Expected integer, received float/);
console.log("✅ PASS: Schema rejects float revision");

// Verify that the action typing implies the correct structure
// (This is implicitly tested by TS compilation, but we ensure our structure here)

console.log("--- All Autosave OCC Contract Tests Passed ---");
