# VRPACS Acceptance Test Scenarios

Updated: 2026-07-03

## 1. Muc dich

Tai lieu nay gom manual acceptance scenarios dung chung cho cac phase VRPACS parity. Moi phase co the them automated tests rieng, nhung cac scenario nay la baseline de xac nhan workflow khong bi vo.

## 2. Test data baseline

Can co data an toan:

- 1 XR/DX study it series.
- 1 CT multi-series.
- 1 MR multi-series.
- 1 US cine/multiframe neu co.
- 1 patient co nhieu prior studies.
- 1 order co accession chua co DICOM.
- 1 order da co DICOM received.
- 1 final report.
- 1 draft report.
- 1 doctor, 1 technician, 1 reception, 1 admin.
- Khong dung PHI/DICOM that trong repo.

## 3. Scenario format

Moi scenario gom:

- ID
- Target phase
- Preconditions
- Steps
- Expected result
- Audit checks

## 4. Baseline scenarios

### SCN-001 - Create worklist order and generate MWL

Target phase: 1

Preconditions:

- User has `worklist.manage`.
- Procedure/modality data exists or manual input is allowed.

Steps:

1. Open `/worklist`.
2. Create new order with patient, accession, modality, procedure, scheduled date.
3. Save order.
4. Regenerate MWL if needed.

Expected result:

- Order appears in worklist.
- Accession is unique.
- MWL path/status is created or clear error is shown.
- No DICOM study is required yet.

Audit checks:

- `create order` event exists.
- `regenerate MWL` event exists if action was used.

### SCN-002 - Check in and cancel order

Target phase: 1

Preconditions:

- Order is `REQUESTED` or `SCHEDULED`.
- User has `worklist.manage`.

Steps:

1. Check in order.
2. Verify arrived/check-in status.
3. Cancel order with reason.

Expected result:

- Order transitions to arrived/check-in.
- Cancel requires reason.
- Order becomes cancelled.
- If study exists, image data is not deleted.

Audit checks:

- Check-in and cancel events include actor and reason.

### SCN-003 - Orthanc study sync to MiniPACS

Target phase: 1

Preconditions:

- Orthanc has a sample study.
- MiniPACS sync action/service is available.

Steps:

1. Trigger or wait for study sync.
2. Open study list `/`.
3. Search by patient ID or accession.

Expected result:

- `ImagingStudy` exists with study UID, patient, modality.
- Status is `RECEIVED` or mapped equivalent.
- Missing metadata is shown as warning, not crash.

Audit checks:

- Study sync/status history event exists.

### SCN-004 - Start reading and save draft report

Target phase: 1

Preconditions:

- Study is ready to read.
- User has `reports.write`.

Steps:

1. Open study row action.
2. Click start reading/receive read.
3. Open report page.
4. Save findings/conclusion as draft.

Expected result:

- Study/report enters `READING`/`DRAFT`.
- Assigned/reading doctor is set if policy requires.
- Draft is editable.

Audit checks:

- Start reading event exists.
- Draft save event exists.

### SCN-005 - Finalize report, print PDF, mark delivered

Target phase: 1

Preconditions:

- Draft report exists.
- User has report finalize/write permission.
- Reception/admin has `archive.deliver`.

Steps:

1. Finalize report.
2. Print or export PDF.
3. Open archive.
4. Mark delivered.

Expected result:

- Report becomes final/read-only.
- PDF/print output is consistent.
- Archive row appears.
- Delivered status/action recorded.

Audit checks:

- Finalize, print/PDF, delivered events exist.

### SCN-006 - Cancel approval/edit final with reason

Target phase: 1

Preconditions:

- Final report exists.
- User has `reports.unfinalize` or equivalent admin permission.

Steps:

1. Try editing final report without unfinalize permission.
2. Confirm access is denied.
3. With authorized user, request cancel approval/edit final.
4. Enter reason.
5. Save addendum or new version.

Expected result:

- Unauthorized user cannot edit final.
- Authorized action requires reason.
- Original final is not silently overwritten.
- Addendum/history is visible.

Audit checks:

- Denied/action/unfinalize/addendum events exist.

### SCN-007 - HIS update and send result with retry

Target phase: 2

Preconditions:

- HIS mode is mock or test adapter.
- Study/order has accession.
- User has `his.sync`.

Steps:

1. Update case from HIS.
2. Verify demographics/clinical info preview or update.
3. Finalize report.
4. Send result to HIS.
5. Simulate failure and retry.

Expected result:

- HIS sync status changes pending/sent/failed.
- Errors are visible and retryable.
- Draft reports cannot be sent.
- Failure does not rollback final report.

Audit checks:

- Inbound update, outbound send, failure, retry events exist.

### SCN-008 - Admin catalog and template mapping

Target phase: 3

Preconditions:

- User has catalog/template permission.

Steps:

1. Create service type.
2. Create procedure with modality/body part/HIS code.
3. Create ICD.
4. Map procedure/ICD to report template.
5. Map procedure/machine to print template.

Expected result:

- Catalog items can be created/edited/deactivated.
- Template resolver picks the most specific mapping.
- Inactive catalog item does not appear for new order.

Audit checks:

- Catalog and mapping changes audited.

### SCN-009 - Per-machine permission matrix

Target phase: 3

Preconditions:

- Doctor A has global report write.
- CT1 and MR1 nodes exist.

Steps:

1. Deny Doctor A `report.write` on CT1.
2. Keep MR1 default.
3. Attempt report write on CT1.
4. Attempt report write on MR1.

Expected result:

- CT1 action denied.
- MR1 follows global permission.
- Effective permission preview matches behavior.

Audit checks:

- Matrix change audited.

### SCN-010 - Viewer key image/snapshot/report bridge

Target phase: 4

Preconditions:

- Study opens in viewer.
- User has `studies.read` and `reports.write`.

Steps:

1. Open viewer.
2. Save key image with note.
3. Save snapshot.
4. Open gallery.
5. Select artifacts and send to report.
6. Open report workspace/report page.

Expected result:

- Viewer does not blank.
- Artifacts have metadata/preview if Phase 4 implemented.
- Selected artifacts are available in report workflow.

Audit checks:

- Viewer open, key image, snapshot, send-to-report events exist.

### SCN-011 - Viewer preference and action history

Target phase: 4

Preconditions:

- User can open viewer.

Steps:

1. Open User Config.
2. Change WW/WL preset or tool visibility.
3. Save and reload viewer.
4. Perform viewer action.
5. Open Action History.

Expected result:

- Preference persists.
- Bad preference cannot crash viewer.
- Action history shows recent actions.

Audit checks:

- Preference save/reset and viewer action history events exist.

### SCN-012 - Viewer download manager and anonymized export

Target phase: 4/8

Preconditions:

- Viewer artifacts exist.
- User has export permission.

Steps:

1. Select key images/snapshots.
2. Start export with anonymize enabled.
3. Open download manager.
4. Download file when ready.

Expected result:

- Job status progresses to ready or clear failure.
- File name/metadata does not expose patient name/id when anonymized.
- Source study identity is unchanged.

Audit checks:

- Job create/ready/download/anonymized export events exist.

### SCN-013 - History compare

Target phase: 4

Preconditions:

- Patient has current and prior studies.

Steps:

1. Open current study viewer.
2. Open history panel.
3. Select prior study.
4. Open compare.

Expected result:

- Current/prior viewer layout opens.
- Current and prior labels are visible.
- If prior has no image, report-only option appears.

Audit checks:

- History opened and compare opened events exist.

### SCN-014 - Non-DICOM capture to report

Target phase: 6

Preconditions:

- Browser camera permission is available.
- User has Non-DICOM module permission.

Steps:

1. Open Non-DICOM queue.
2. Start case.
3. Capture still image.
4. Record short video if supported.
5. Save report/final/deliver.

Expected result:

- Media saved with case.
- Report workflow reused.
- Capture errors are clear.

Audit checks:

- Capture/upload/report events exist.

### SCN-015 - Share link with patient-info hiding

Target phase: 7

Preconditions:

- Final report/study exists.
- User has share permission.

Steps:

1. Create share link with expiry/password.
2. Enable hide patient info.
3. Open public share link.
4. Revoke link.

Expected result:

- Public viewer is read-only.
- Patient info hidden when enabled.
- Expired/revoked link cannot access.

Audit checks:

- Create/access/revoke events exist.

### SCN-016 - Consultation lifecycle

Target phase: 7

Preconditions:

- Study exists.
- User has consult permission.

Steps:

1. Create consultation request.
2. Add participant.
3. Start room.
4. Send chat/video event if implemented.
5. Finish consultation.

Expected result:

- Status moves requested -> started/in-progress -> finished.
- Participants are tracked.
- Consultation does not change report final status automatically.

Audit checks:

- Lifecycle and participant events exist.

### SCN-017 - Guarded delete series/study dry-run

Target phase: 8

Preconditions:

- Admin user has delete permission.
- Study has multiple series.

Steps:

1. Request delete series.
2. Enter reason.
3. Run dry-run.
4. Confirm phrase.
5. Execute only if Phase 8 actual delete is implemented.

Expected result:

- Without reason/permission, action denied.
- Dry-run shows affected instances.
- Audit records request and result.
- If actual delete not implemented, no PACS data is deleted.

Audit checks:

- Delete request/dry-run/execute or blocked event exists.

### SCN-018 - Regression smoke after each phase

Target phase: all

Preconditions:

- Basic sample data exists.

Steps:

1. Open `/`.
2. Open `/worklist`.
3. Open viewer for a valid study.
4. Open report page.
5. Open archive.
6. Open statistics.

Expected result:

- No page crashes.
- Viewer loads nonblank for valid study.
- Existing report/worklist/archive flows still work.

Audit checks:

- No unexpected destructive/audit noise.

## 5. Required checks before phase handoff

- List tests run.
- List tests not run and reason.
- Mention migration/config/env notes.
- Mention remaining risks and blockers.
- Confirm no PHI/DICOM real data committed.

