import assert from "node:assert/strict";
import {
  StudyWorkspaceDetailSchema,
  StudyUidInputSchema,
} from "./study-workspace";

console.log("--- Study Workspace Contract Tests ---");

// Valid detail passes
const valid = StudyWorkspaceDetailSchema.safeParse({
  studyUid: "1.2.3.4",
  patientId: "P001",
  patientName: "Nguyen Van A",
  patientSex: "M",
  patientBirthDate: "1990-01-01",
  studyDate: "2026-07-11",
  studyDescription: "CT Chest",
  modality: "CT",
  accessionNumber: "ACC001",
  procedureDescription: "CT ngực có tiêm",
  bodyPart: "CHEST",
  referringPhysician: "Dr. B",
  referringDepartment: "Khoa Nội",
  technologistName: "KTV C",
  machineName: "CT-01",
  status: "READY_TO_READ",
  reportStatus: null,
  reportRevision: null,
  reportUpdatedAt: null,
  reportConclusion: null,
  reviewerName: null,
  hisVisitId: "VISIT-001",
  aiStatus: null,
  aiFindingCount: null,
  aiSeverity: null,
  assignedDoctorName: null,
  facilityName: "Hospital A",
  allowedActions: {
    readStudy: true, readReport: false, editClinical: false,
    assignCase: false, draftReport: false, signReport: false,
    approveReport: false, cancelDraft: false, unfinalizeReport: false,
    deliverResult: false, syncHis: false, createConsultation: false,
    share: false, export: false, editViewerArtifacts: false,
  },
});
assert.equal(valid.success, true);
console.log("✅ PASS: valid detail parses successfully");

// Unknown fields rejected (strict mode)
assert.equal(
  StudyWorkspaceDetailSchema.safeParse({
    studyUid: "1.2.3",
    patientId: null, patientName: null, patientSex: null,
    patientBirthDate: null, studyDate: null, studyDescription: null,
    modality: null, accessionNumber: null, procedureDescription: null,
    bodyPart: null, referringPhysician: null, referringDepartment: null,
    technologistName: null, machineName: null, status: "READY_TO_READ",
    reportStatus: null, reportRevision: null, reportUpdatedAt: null,
    reportConclusion: null, reviewerName: null, hisVisitId: null,
    aiStatus: null, aiFindingCount: null, aiSeverity: null,
    assignedDoctorName: null, facilityName: null, allowedActions: valid.data!.allowedActions,
    reportText: "LEAKED",  // forged field
  }).success,
  false
);
console.log("✅ PASS: forged fields rejected by strict schema");

// Empty studyUid rejected
assert.equal(
  StudyWorkspaceDetailSchema.safeParse({
    studyUid: "",
    patientId: null, patientName: null, patientSex: null,
    patientBirthDate: null, studyDate: null, studyDescription: null,
    modality: null, accessionNumber: null, procedureDescription: null,
    bodyPart: null, referringPhysician: null, referringDepartment: null,
    technologistName: null, machineName: null, status: "READY_TO_READ",
    reportStatus: null, reportRevision: null, reportUpdatedAt: null,
    reportConclusion: null, reviewerName: null, hisVisitId: null,
    aiStatus: null, aiFindingCount: null, aiSeverity: null,
    assignedDoctorName: null, facilityName: null, allowedActions: valid.data!.allowedActions,
  }).success,
  false
);
console.log("✅ PASS: empty studyUid rejected");

// StudyUidInputSchema
assert.equal(StudyUidInputSchema.safeParse("1.2.3.4.5").success, true);
assert.equal(StudyUidInputSchema.safeParse(" 1.2.3 ").success, true);
assert.equal(StudyUidInputSchema.safeParse("").success, false);
assert.equal(StudyUidInputSchema.safeParse("abc").success, false);
assert.equal(StudyUidInputSchema.safeParse("1").success, false);
assert.equal(StudyUidInputSchema.safeParse("1.").success, false);
assert.equal(StudyUidInputSchema.safeParse(".1.2").success, false);
assert.equal(StudyUidInputSchema.safeParse("1.2.3; DROP TABLE").success, false);
assert.equal(StudyUidInputSchema.safeParse(`1.${"2".repeat(63)}`).success, false);
console.log("✅ PASS: StudyUidInputSchema validates correctly");

console.log("--- All Study Workspace Contract Tests Passed ---");
