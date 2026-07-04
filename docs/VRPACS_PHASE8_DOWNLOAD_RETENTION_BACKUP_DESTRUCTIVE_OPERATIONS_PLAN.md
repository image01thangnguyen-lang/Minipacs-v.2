# Ke hoach chi tiet Phase 8 - Download, Retention, Backup, And Destructive Operations

Updated: 2026-07-04

## 1. Muc tieu

Phase 8 dua cac workflow export/download, backup, retention va thao tac destructive vao MiniPACS theo cach du an toan de van hanh production.

Muc tieu cuoi phase:

- Export/download DICOM, JPEG, PDF, media Non-DICOM theo job co progress, expiry va audit.
- Ho tro anonymize/encode patient khi export hoac share/download.
- Co Download Manager dung chung cho Study List, Viewer, Report, Archive va Non-DICOM.
- Co bulk export tu Archive/Statistics voi gioi han, dry-run va UI tien do.
- Co retention policy de don dep du lieu cu theo dry-run truoc, khong lam mat RIS metadata/report.
- Co backup path/config/run/health/restore checklist tren UI.
- Co destructive workflow cho delete study/delete series/delete media vat ly: request, dry-run, approval, confirmation phrase, execute, audit.
- Tat ca schema/service/API/action trong Phase 8 phai co UI hien thi hoac thao tac tuong ung.

## 2. Ly do Phase 8 can lam rieng

Download/export va delete/retention la nhom tinh nang co rui ro cao:

- Co the ro ri PHI qua file name, ZIP, log, download URL.
- Co the lam qua tai storage/CPU khi export CT/MR lon.
- Co the xoa nham DICOM/Non-DICOM source data.
- Co the pha workflow report/archive/HIS/share neu file bi xoa ma metadata khong duoc giu.

Vi vay Phase 8 khong chi la them nut "Download" hoac "Delete". Can policy, dry-run, audit, UI, permission va rollback/restore checklist.

## 3. Dieu kien tien quyet

Chi nen bat dau Phase 8 khi:

- Phase 1 report/archive/delivery workflow on dinh.
- Phase 2/7.5 HIS status va logs on dinh.
- Phase 3 storage/folder config va permission matrix on dinh.
- Phase 4 download job/artifact boundary da co the reuse.
- Phase 6 Non-DICOM media da co protected route va soft-void.
- Phase 7 share/consult da co scope va public download policy.
- Phase 7.5 HIS Gateway da co admin/log UI neu can trace export/result status.

Doc truoc:

- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_WORKFLOW_STATUS_POLICY.md`
- `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
- `docs/VRPACS_TERMINOLOGY_MAP.md`
- `docs/VRPACS_PHASE3_ADMIN_CATALOG_PERMISSION_PLAN.md`
- `docs/VRPACS_PHASE4_VIEWER_WEB_PARITY_PLAN.md`
- `docs/VRPACS_PHASE6_NON_DICOM_CAPTURE_MODULE_PLAN.md`
- `docs/VRPACS_PHASE7_SHARING_AND_CONSULTATION_PLAN.md`
- `docs/VRPACS_PHASE7_5_HIS_PRODUCTION_API_GATEWAY_PLAN.md`
- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/app/admin/storage/**`
- `dashboard/app/api/viewer/download-jobs/**`
- `dashboard/app/archive/**`
- `dashboard/app/non-dicom/**`

## 4. Khong nam trong Phase 8

Phase 8 khong lam cac viec sau:

- Khong lam native CD/DVD burn, DICOM print SCU, scanner bridge, open local folder. Cac muc do thuoc Phase 9/native companion.
- Khong lam cloud backup provider production neu chua co spec provider.
- Khong xoa vat ly ngay lap tuc tu UI mot buoc.
- Khong xoa RIS metadata/report khi xoa DICOM object.
- Khong de public share user tao export job noi bo.
- Khong lam de-identification DICOM production neu chua co tag policy duyet; MVP chi anonymize theo allowlist/replace policy ro rang.
- Khong lam auto retention chay ngam khong co dry-run va approval.

## 5. Nguyen tac UI visibility bat buoc

Tu Phase 5 tro di, moi thu lam duoc phai hien tren UI.

Trong Phase 8, dieu nay bat buoc hon nua:

- Export job -> Download Manager UI.
- Export file -> Download link co expiry va owner check.
- Retention policy -> Admin Retention UI.
- Retention run -> Run history UI.
- Backup folder/job -> Admin Backup UI.
- Delete request -> Destructive Operations UI.
- Dry-run impact -> Impact Preview UI.
- Audit -> Timeline/log UI lien quan.

Khong co backend-only feature.

## 6. Permission contract de xuat

Them permission moi:

| Permission | Muc dich |
| --- | --- |
| `export.read` | Xem export/download jobs cua minh hoac theo scope |
| `export.create` | Tao export job DICOM/JPEG/PDF/media |
| `export.anonymize` | Tao export an danh/de-identify |
| `export.bulk` | Bulk export nhieu study tu Archive/Statistics |
| `export.manage` | Quan ly tat ca export jobs, cancel/cleanup |
| `retention.read` | Xem policy/run retention |
| `retention.manage` | Tao/sua retention policy va dry-run |
| `retention.execute` | Thuc thi retention da duyet |
| `backup.read` | Xem backup/storage health |
| `backup.manage` | Cau hinh backup path, test, run backup |
| `backup.restoreChecklist` | Xem/tao restore checklist |
| `destructive.request` | Tao yeu cau xoa study/series/media |
| `destructive.approve` | Duyet yeu cau xoa |
| `destructive.execute` | Thuc thi xoa vat ly sau approval |
| `destructive.audit` | Xem audit destructive chi tiet |

Role de xuat:

- `ADMIN`: tat ca.
- `DOCTOR`: `export.read`, `export.create`, co the `export.anonymize` neu duoc phep.
- `TECHNICIAN`: `export.read`, `export.create`, `backup.read`.
- `RECEPTION`: `export.read`, export PDF/report neu co policy.

Khong role nao ngoai ADMIN nen co `destructive.execute` mac dinh.

## 7. Data model de xuat

### 7.1 Reuse `ViewerDownloadJob`

Hien da co `ViewerDownloadJob`:

- `jobType`
- `status`
- `studyInstanceUid`
- `seriesInstanceUid`
- `requestedByUserId`
- `progress`
- `fileName`
- `filePath`
- `fileSizeBytes`
- `expiresAt`
- `anonymize`
- `includePatientInfo`
- `metadataJson`

Phase 8 co the reuse cho viewer/study export neu du:

- `jobType`: `DICOM_STUDY`, `DICOM_SERIES`, `JPEG_STUDY`, `JPEG_SERIES`, `REPORT_PDF`, `NON_DICOM_MEDIA`, `BULK_ARCHIVE`, `ANONYMIZED_DICOM`
- `metadataJson`: luu selected instance ids, filters, anonymize policy, requested scope.

Neu can bulk/export da scope rong hon `studyInstanceUid`, them model moi.

### 7.2 `ExportJob`

Dung khi can bulk export hoac export Non-DICOM/report khong co 1 `studyInstanceUid` duy nhat.

Fields de xuat:

- `id String @id @default(uuid())`
- `jobType String`
- `scope String` - `STUDY | SERIES | INSTANCE_SET | REPORT | NON_DICOM_EXAM | MEDIA_SET | ARCHIVE_BULK`
- `status String` - `PENDING | RUNNING | SUCCESS | FAILED | CANCELLED | EXPIRED`
- `requestedByUserId String?`
- `studyInstanceUid String?`
- `seriesInstanceUid String?`
- `reportId String?`
- `nonDicomExamId String?`
- `filterJson String? @db.Text`
- `selectedItemsJson String? @db.Text`
- `anonymize Boolean @default(false)`
- `includePatientInfo Boolean @default(false)`
- `format String` - `DICOM | JPEG | PDF | ZIP | CSV | XLSX`
- `progress Int @default(0)`
- `itemCount Int @default(0)`
- `fileName String?`
- `filePath String?`
- `fileSizeBytes BigInt?`
- `mimeType String?`
- `downloadTokenHash String?`
- `expiresAt DateTime?`
- `errorMessage String? @db.Text`
- `metadataJson String? @db.Text`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- `completedAt DateTime?`

Indexes:

- `status`
- `requestedByUserId`
- `studyInstanceUid`
- `reportId`
- `nonDicomExamId`
- `createdAt`
- `expiresAt`

### 7.3 `ExportAccessLog`

Log moi lan download file export.

Fields:

- `id`
- `exportJobId`
- `actorUserId`
- `eventType` - `DOWNLOAD_STARTED | DOWNLOAD_DENIED | DOWNLOAD_COMPLETED | EXPIRED_DENIED`
- `ipAddress`
- `userAgent`
- `createdAt`

### 7.4 `RetentionPolicy`

Fields:

- `id`
- `name`
- `scope` - `DICOM | NON_DICOM | EXPORTS | VIEWER_ARTIFACTS | ALL`
- `isActive`
- `olderThanDays`
- `statusFilterJson`
- `facilityId`
- `modality`
- `preserveMetadata Boolean @default(true)`
- `preserveReports Boolean @default(true)`
- `preserveKeyImages Boolean @default(true)`
- `deletePhysicalFiles Boolean @default(false)`
- `dryRunRequired Boolean @default(true)`
- `approvalRequired Boolean @default(true)`
- `createdByUserId`
- `updatedByUserId`
- `createdAt`
- `updatedAt`

### 7.5 `RetentionRun`

Fields:

- `id`
- `policyId`
- `mode` - `DRY_RUN | EXECUTE`
- `status` - `PENDING | RUNNING | SUCCESS | FAILED | CANCELLED`
- `startedByUserId`
- `approvedByUserId`
- `startedAt`
- `finishedAt`
- `candidateCount`
- `affectedCount`
- `freedBytes`
- `errorMessage`
- `summaryJson`
- `createdAt`

### 7.6 `RetentionRunItem`

Fields:

- `id`
- `runId`
- `entityType`
- `entityId`
- `studyInstanceUid`
- `seriesInstanceUid`
- `filePath`
- `fileSizeBytes`
- `action` - `KEEP_METADATA_DELETE_FILES | DELETE_EXPORT | VOID_MEDIA | SKIP`
- `status`
- `reason`
- `createdAt`

### 7.7 `BackupJob`

Fields:

- `id`
- `jobType` - `STORAGE_TEST | BACKUP_RUN | RESTORE_CHECKLIST | VERIFY_BACKUP`
- `status`
- `sourceFolderId`
- `targetFolderId`
- `startedByUserId`
- `progress`
- `fileCount`
- `totalBytes`
- `copiedBytes`
- `errorMessage`
- `summaryJson`
- `startedAt`
- `finishedAt`
- `createdAt`
- `updatedAt`

### 7.8 `DestructiveOperationRequest`

Fields:

- `id`
- `operationType` - `DELETE_STUDY | DELETE_SERIES | DELETE_NON_DICOM_MEDIA | PURGE_EXPORT_JOB | RETENTION_EXECUTE`
- `status` - `REQUESTED | DRY_RUN_READY | APPROVED | REJECTED | EXECUTING | COMPLETED | FAILED | CANCELLED`
- `entityType`
- `entityId`
- `studyInstanceUid`
- `seriesInstanceUid`
- `nonDicomMediaId`
- `reason String @db.Text`
- `confirmationPhrase`
- `requestedByUserId`
- `approvedByUserId`
- `executedByUserId`
- `dryRunJson String? @db.Text`
- `impactSummaryJson String? @db.Text`
- `errorMessage String? @db.Text`
- `createdAt`
- `approvedAt`
- `executedAt`
- `updatedAt`

## 8. Export/download scope

### 8.1 DICOM export

Supported:

- Export full study.
- Export series.
- Export selected instances if viewer selection exists.
- Export anonymized DICOM if `export.anonymize`.

Rules:

- Filename khong chua patient name/patient id.
- Prefer `StudyUID_short`, `AccessionNumber` neu policy cho phep, va job id.
- Download URL la signed/tokenized, expires.
- User chi download job do minh tao, tru ADMIN/export.manage.

### 8.2 JPEG export

Supported:

- Selected key images.
- Viewer snapshots.
- Series rendered frames neu feasible.
- Non-DICOM images.

Rules:

- JPEG export phai co PHI overlay policy.
- Neu `includePatientInfo=false`, overlay/text PHI phai duoc tat hoac crop/anonymize.

### 8.3 Report/PDF export

Supported:

- Final report PDF.
- Report package ZIP: PDF + selected key images.
- Archive bulk final reports if `export.bulk`.

Rules:

- Draft report khong duoc export public/bulk.
- Filename PHI-safe.
- Log print/export audit.

### 8.4 Non-DICOM export

Supported:

- Selected media.
- Whole Non-DICOM exam media package.
- Report + media package.

Rules:

- Only active media, not `VOIDED`.
- File path never exposed.
- MIME allowlist.

### 8.5 Bulk export

Supported:

- Archive filter -> dry-run item count/estimated size.
- Export selected list.
- CSV/XLSX operational data.

Rules:

- Hard limit item count/size.
- Requires `export.bulk`.
- Always job-based, never synchronous response for large set.

## 9. Retention policy

Retention khong xoa metadata RIS/report mac dinh.

Default safe behavior:

- Preserve `ImagingStudy`, `Report`, `WorklistOrder`, `AuditLog`, `HisSyncLog`.
- Mark physical data unavailable if DICOM files purged.
- Keep report PDF/print history if policy says preserve.
- Keep key image metadata but mark source unavailable if image gone.

Retention flow:

1. Admin tao policy.
2. Bam Dry Run.
3. UI hien candidate list, affected size, skipped reason.
4. Admin approve run.
5. Neu policy co destructive action, can confirmation phrase.
6. Execute job.
7. UI hien completed/failed/skipped.
8. Audit day du.

## 10. Backup

Phase 8 backup la server-side file/folder backup co UI, khong phai enterprise disaster recovery day du.

Can co:

- Cau hinh backup folder trong Storage UI.
- Test read/write.
- Backup run: copy selected storage roots sang backup folder.
- Verify run: count files/bytes/hash optional.
- Restore checklist: generated steps, not automatic restore destructive.

UI:

- `/admin/storage` mo rong hoac `/admin/backup`.
- Status card: last backup, last verify, failed jobs.
- Run history.
- Restore checklist download/print.

Rules:

- Backup job khong expose raw file path cho user khong co `backup.manage`.
- Restore automatic production co the de Phase 9 neu chua co spec.

## 11. Destructive operations

### 11.1 Delete study

Khong cho delete study bang mot click.

Flow:

1. User co `destructive.request` tao request voi reason.
2. Service tao dry-run impact:
   - DICOM series/instances.
   - Orthanc study id.
   - Reports/final status.
   - HIS sent status.
   - Share links active.
   - Consultations active.
   - Non-DICOM linked media.
3. UI hien impact.
4. Admin co `destructive.approve` approve/reject.
5. User co `destructive.execute` nhap confirmation phrase.
6. Execute:
   - Delete physical DICOM from Orthanc/storage.
   - Preserve RIS metadata/report.
   - Mark study availability/status.
   - Revoke/download/share links if policy says.
7. Audit.

### 11.2 Delete series

Flow tuong tu study nhung scope series.

Rules:

- Khong delete series neu report final dang reference key images/measurements ma policy khong cho.
- Prefer request/approve via `ViewerSeriesActionRequest` neu da co.

### 11.3 Delete Non-DICOM media

Phase 6 da co soft void. Phase 8 moi cho purge physical file.

Rules:

- Purge chi voi media da `VOIDED`.
- Can reason, dry-run, approval.
- Report package phai biet media khong con available.

### 11.4 Purge export jobs

Export files het han co the purge.

Rules:

- Metadata job giu lai.
- File physical xoa sau expiresAt.
- User co the request cleanup job.

## 12. UI surfaces bat buoc

### 12.1 Global Download Manager

Route/component:

- `/downloads` hoac reusable drawer.

Hien:

- My jobs.
- Status/progress.
- File size.
- Expires at.
- Download button.
- Cancel button.
- Error message.
- Anonymize/include PHI badge.

### 12.2 Study List `/`

Row/menu action:

- Export DICOM study.
- Export JPEG/key images if available.
- Export anonymized if permission.
- Request delete study if permission.

Detail panel:

- Recent export jobs.
- Data availability.
- Retention eligibility.

### 12.3 Viewer

Integrate with Phase 4 Download Manager:

- Export current series.
- Export selected instances/key images.
- Export anonymized package.
- Request delete series.

No ready button if command not implemented.

### 12.4 Archive `/archive`

Actions:

- Export report PDF.
- Export study package.
- Bulk export selected rows.
- Request delete archived study.

Filters:

- Export status.
- Retention eligibility.
- Data availability.

### 12.5 Report detail `/report/[studyInstanceUid]`

Actions:

- Export final report PDF.
- Export report package with key images.
- Export anonymized report package if allowed.

Rules:

- Draft report export limited/internal only.
- HIS failed status visible; export must not imply HIS sent.

### 12.6 Non-DICOM

Actions:

- Export selected media.
- Export full exam package.
- Request purge voided media.

UI:

- Media availability.
- Export job links.

### 12.7 Admin Retention

Route:

- `/admin/retention`

Tabs:

- Policies.
- Dry runs.
- Run history.
- Candidate detail.
- Approval queue.

### 12.8 Admin Backup

Route:

- `/admin/backup` or extend `/admin/storage`.

Tabs:

- Backup folders.
- Run backup.
- Verify backup.
- Run history.
- Restore checklist.

### 12.9 Admin Destructive Operations

Route:

- `/admin/destructive`

Tabs:

- Requests.
- Awaiting approval.
- Dry-run impact.
- Execution history.
- Failed operations.

## 13. API/Server actions de xuat

### Export

- `createExportJobAction(input)`
- `getMyExportJobsAction(filters)`
- `getExportJobAction(jobId)`
- `cancelExportJobAction(jobId)`
- `downloadExportRoute(token)`
- `cleanupExpiredExportsAction()`

API route:

- `POST /api/exports/jobs`
- `GET /api/exports/jobs`
- `GET /api/exports/jobs/[id]`
- `POST /api/exports/jobs/[id]/cancel`
- `GET /api/exports/download/[token]`

### Retention

- `createRetentionPolicyAction`
- `runRetentionDryRunAction`
- `approveRetentionRunAction`
- `executeRetentionRunAction`
- `cancelRetentionRunAction`

### Backup

- `testBackupFolderAction`
- `runBackupJobAction`
- `verifyBackupJobAction`
- `generateRestoreChecklistAction`

### Destructive

- `requestDestructiveOperationAction`
- `runDestructiveDryRunAction`
- `approveDestructiveOperationAction`
- `executeDestructiveOperationAction`
- `cancelDestructiveOperationAction`

## 14. Worker/job processing

Phase 8 can start with simple server-side job processor if app deployment allows it, but must keep durable DB state.

MVP options:

1. Inline processing for small export only.
2. Background `setTimeout` only for dev/mock, not production.
3. Production preferred: separate worker command/process.

Plan should support:

- Idempotent job execution.
- Progress update.
- Cancel check.
- Retry limited.
- Error persisted.
- Cleanup expired files.

If no worker infra exists, Phase 8 must expose jobs as `PENDING` plus clear UI/disabled state for production processing.

## 15. File/path policy

- No PHI in export file names.
- No raw server path in UI/API response.
- Download via protected route only.
- Storage path must stay inside configured storage folder.
- Path traversal checks mandatory.
- ZIP entries must sanitize names.
- Maximum size and count enforced before job starts.

## 16. Anonymization/de-identification policy

MVP:

- Remove patient name/id from filenames.
- For JPEG/report package: omit structured PHI fields if requested.
- For DICOM: use tag rewrite policy only if tested.

Do not claim full DICOM de-identification unless:

- Tag policy is documented.
- Private tags handling is defined.
- Burned-in annotations are considered.
- QA sample validates output.

UI label should say:

- `Ẩn thông tin cơ bản` for MVP.
- `DICOM de-identification` only when truly implemented.

## 17. Audit

Audit required:

- Export job created/cancelled/completed/downloaded/expired.
- Anonymized export requested.
- Bulk export.
- Retention policy created/updated.
- Retention dry-run/execution.
- Backup test/run/verify.
- Destructive request/approval/execution/failure.

Audit metadata must include:

- Actor.
- Entity/scope.
- Reason.
- Item count/size.
- Status.
- Error summary.
- IP if available.

## 18. Trinh tu trien khai

### PR 8.1 - Permissions, policy, schema

Scope:

- Add export/retention/backup/destructive permissions.
- Add/extend export job models.
- Add retention models.
- Add backup job models.
- Add destructive operation model.
- Migration.
- Seed permissions.

UI bat buoc:

- Permission labels visible in admin role UI.
- Empty admin routes or disabled menu entries with clear message if implementation incomplete.

### PR 8.2 - Export job core and Download Manager

Scope:

- Export service.
- Job create/cancel/status.
- Protected download route.
- Global Download Manager UI.
- Reuse Phase 4 `ViewerDownloadJob` where possible.

Done when:

- User can create a small report/JPEG export and download via protected route.

### PR 8.3 - DICOM/JPEG/Report/Non-DICOM export surfaces

Scope:

- Study List export actions.
- Viewer export actions.
- Archive export actions.
- Report package export.
- Non-DICOM media export.

Done when:

- All exportable resources show status/job UI.
- Forbidden actions hidden.

### PR 8.4 - Bulk export and anonymize

Scope:

- Archive selected/bulk export.
- Dry-run count/size.
- Anonymize/basic PHI removal.
- File naming policy.

Done when:

- Bulk export never runs synchronously.
- Large job shows progress and limits.

### PR 8.5 - Backup admin

Scope:

- Backup folder config.
- Storage health.
- Run backup.
- Verify backup.
- Restore checklist.

Done when:

- Admin can see backup status and last run without terminal.

### PR 8.6 - Retention policy and dry-run

Scope:

- Retention policy UI.
- Dry-run engine.
- Candidate list.
- Approval flow.

Done when:

- Admin can preview what would be cleaned before any physical delete.

### PR 8.7 - Destructive operations

Scope:

- Delete study request/dry-run/approve/execute.
- Delete series request/dry-run/approve/execute.
- Purge voided Non-DICOM media.
- Full audit.

Done when:

- No physical delete can happen without reason, dry-run, approval and confirmation phrase.

### PR 8.8 - QA, security, docs

Scope:

- Permission bypass tests.
- Path traversal tests.
- PHI filename tests.
- Large export limits.
- Retention dry-run tests.
- Backup failure tests.
- Destructive operation regression.

Done when:

- Build/typecheck pass.
- Manual QA scenarios documented.

## 19. QA scenarios

### SCN-8.1 Export final report PDF

Expected:

- User with `export.create` can create job.
- Download Manager shows progress.
- Filename contains no patient name/id.
- Download route checks ownership.

### SCN-8.2 Export DICOM study

Expected:

- Job created.
- DICOM ZIP contains expected study/series.
- UI shows size/count.
- Audit created.

### SCN-8.3 Export anonymized package

Expected:

- Requires `export.anonymize`.
- PHI fields/filename hidden according to policy.
- UI labels accurately describe anonymization level.

### SCN-8.4 User without permission

Expected:

- UI action hidden/disabled.
- Direct API call rejected server-side.

### SCN-8.5 Bulk export too large

Expected:

- Dry-run shows too large.
- Execute disabled.
- Error message clear.

### SCN-8.6 Cancel export job

Expected:

- Pending/running job checks cancel status.
- Final status `CANCELLED`.
- Partial file cleaned or marked.

### SCN-8.7 Retention dry-run

Expected:

- Candidate list appears.
- No file deleted.
- Summary count/size correct.

### SCN-8.8 Retention execute

Expected:

- Requires approval.
- Preserves metadata/report.
- Marks availability correctly.
- Audit created.

### SCN-8.9 Backup test failed

Expected:

- UI shows failed status.
- Error sanitized.
- No crash.

### SCN-8.10 Delete study guarded

Expected:

- Request requires reason.
- Dry-run impact shows reports/HIS/share/consult links.
- Approval required.
- Confirmation phrase required.
- Metadata preserved after physical delete.

### SCN-8.11 Delete series referenced by report

Expected:

- Dry-run flags referenced key images/measurements.
- Execute blocked unless policy explicitly allows.

### SCN-8.12 Purge voided Non-DICOM media

Expected:

- Active media cannot be purged.
- Voided media can be purged only after approval.
- Gallery shows unavailable/purged state.

## 20. Acceptance criteria

Phase 8 chi duoc xem la xong khi:

1. Export/download job co UI, progress, error, cancel, expiry.
2. Download route protected by ownership/permission.
3. Filenames and ZIP entries do not contain PHI by default.
4. DICOM/JPEG/report/Non-DICOM export surfaces exist where applicable.
5. Bulk export is job-based and limited.
6. Anonymize/de-identify labels are honest and permission-gated.
7. Backup config/status/run/verify/checklist visible on UI.
8. Retention policy has dry-run before execute.
9. Destructive delete requires request, reason, dry-run, approval, confirmation phrase, audit.
10. Physical delete never removes RIS metadata/report by default.
11. No UI action visible if backend would reject.
12. All new permissions appear in admin permission UI/seed.
13. Build/typecheck pass.
14. Manual QA covers export, backup, retention and destructive scenarios.

## 21. Rui ro va guardrails

| Rui ro | Giam thieu |
| --- | --- |
| Lo PHI qua filename/export ZIP | PHI-safe naming, scrub policy, QA filename test |
| Export qua lon lam treo server | Job queue, size limits, progress, cancel |
| Path traversal | Resolve path inside configured storage root only |
| Delete nham DICOM | Request/dry-run/approval/confirmation, metadata preserved |
| Retention xoa qua tay | Dry-run required, approval, candidate UI |
| Backup tao cam giac an toan gia | Verify/checklist UI, not claim disaster recovery beyond implemented |
| Anonymization khong day du | Honest labels, DICOM de-id deferred unless policy tested |
| UI clutter | Use row action menus, drawers, admin pages, not big new cards in operational list |

## 22. Prompt giao cho AI coding agent

```text
Ban la coding agent trong repo MiniPACS. Hay thuc hien Phase 8 - Download, Retention, Backup, And Destructive Operations theo file:

docs/VRPACS_PHASE8_DOWNLOAD_RETENTION_BACKUP_DESTRUCTIVE_OPERATIONS_PLAN.md

Muc tieu:

- Tao export/download job production-safe cho DICOM, JPEG, report PDF, Non-DICOM media va bulk archive.
- Tao Download Manager UI co progress, error, cancel, expiry va protected download.
- Tao retention policy UI co dry-run, approval va execution.
- Tao backup UI co folder config, test, run, verify va restore checklist.
- Tao destructive operation UI cho delete study/series/media physical purge voi request, reason, dry-run, approval, confirmation phrase va audit.
- Tat ca schema/service/API/action them moi phai co UI hien thi/tuong tac tuong ung.

Doc truoc:

- docs/VRPACS_GAP_ANALYSIS_ROADMAP.md
- docs/VRPACS_PHASE8_DOWNLOAD_RETENTION_BACKUP_DESTRUCTIVE_OPERATIONS_PLAN.md
- docs/VRPACS_WORKFLOW_STATUS_POLICY.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_TERMINOLOGY_MAP.md
- docs/VRPACS_PHASE4_VIEWER_WEB_PARITY_PLAN.md
- docs/VRPACS_PHASE6_NON_DICOM_CAPTURE_MODULE_PLAN.md
- docs/VRPACS_PHASE7_SHARING_AND_CONSULTATION_PLAN.md
- dashboard/prisma/schema.prisma
- dashboard/lib/permissions.ts
- dashboard/app/api/viewer/download-jobs/**
- dashboard/app/admin/storage/**
- dashboard/app/archive/**
- dashboard/app/non-dicom/**

Rang buoc:

- Khong revert thay doi cua user.
- Khong hard-delete bang mot click.
- Khong expose raw file path.
- Khong dua patient name/patient id vao filename export.
- Khong claim DICOM de-identification neu chua co tag policy va QA.
- Server-side permission bat buoc.
- UI khong hien action neu backend se reject.
- Retention/destructive phai co dry-run truoc execute.
- Build/typecheck phai pass truoc khi bao xong.

Ket qua cuoi:

- Files changed list.
- Behavior/UI changed summary.
- Migration/config notes.
- Tests/build da chay.
- Manual QA scenarios.
- Export/retention/backup/destructive UI surfaces da hien o dau.
- Rui ro con lai neu co.
```
