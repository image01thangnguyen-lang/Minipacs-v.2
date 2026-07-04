# Ke hoach chi tiet Phase 10 - Release, UAT, Go-Live, Training, And Operations Handoff

Updated: 2026-07-04

## 1. Muc tieu

Phase 10 la giai doan dong goi MiniPACS thanh mot ban phat hanh co the nghiem thu va dua vao van hanh thuc te. Sau Phase 9, he thong da co health/security/deployment observability; Phase 10 tap trung vao UAT, dao tao nguoi dung, checklist go-live, runbook van hanh, quy trinh tiep nhan su co, va quan tri thay doi sau trien khai.

Muc tieu cuoi phase:

- Co Release Center tren UI de quan ly release candidate, build/version, checklist, UAT, sign-off, known issues.
- Co UAT Center de chay/ghi nhan ket qua acceptance scenarios theo role/module.
- Co Training Center de quan ly tai lieu huong dan, video/link, checklist dao tao theo vai tro.
- Co Go-Live Command Center de theo doi trang thai truoc/trong/sau ngay golive.
- Co Support & Incident Desk de tiep nhan loi nguoi dung, phan loai muc do, gan nguoi xu ly, lien ket log/health/audit.
- Co Change Request Board de quan ly yeu cau thay doi sau khi da chot nghiem thu.
- Co Operations Runbook UI de admin/IT thuc hien cac viec lap lai: backup check, restore drill, restart service, rotate secret, update seed/migration, export log.
- Tat ca cac artifact nghiem thu/dao tao/go-live phai hien tren UI, khong chi nam trong file Markdown.

## 2. Ly do Phase 10 can lam rieng

Den cuoi Phase 9, MiniPACS co rat nhieu module va nhieu quyen:

- DICOM workflow, report, archive, delivery.
- HIS integration va HIS Gateway.
- Admin catalogs, storage, permission matrix.
- Viewer, artifacts, export, destructive operations.
- Non-DICOM, sharing, consultation.
- Health/security/performance/DICOM conformance.

Neu khong co Phase 10:

- Nguoi dung khong biet quy trinh nao da nghiem thu, quy trinh nao con known issue.
- Dev/admin khong co mot noi de track sign-off theo role.
- Dao tao nguoi dung se roi rac qua chat/file.
- Go-live de phu thuoc vao tri nho ca nhan.
- Loi production khong co incident workflow va khong link duoc voi logs/audit.
- Sau khi go-live, moi yeu cau nho co the bien thanh sua code tuy tien, gay vo workflow da nghiem thu.

## 3. Dieu kien tien quyet

Chi nen bat dau Phase 10 khi:

- Phase 1-8 da co UI cho workflow chinh va cac module nhay cam.
- Phase 9 Operations/Health/Security/DICOM Conformance/Deployment Readiness da co.
- Build Docker tren moi truong muc tieu pass.
- Database migration/seed strategy da ro rang.
- Cloudflare/public URL/base URL/auth secret/storage paths da duoc cau hinh.
- It nhat mot bo test data an toan da co cho UAT.

Doc truoc:

- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md`
- `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
- `docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md`
- `docs/VRPACS_PHASE8_DOWNLOAD_RETENTION_BACKUP_DESTRUCTIVE_OPERATIONS_PLAN.md`
- `docs/VRPACS_PHASE9_PRODUCTION_HARDENING_NATIVE_WORKSTATION_PLAN.md`
- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/app/admin/ops/**`
- `dashboard/app/statistics/**`
- `docker-compose.yml`
- `.env.example`

## 4. Khong nam trong Phase 10

Phase 10 khong phai phase them clinical feature moi.

Khong lam:

- Khong them module clinical lon moi.
- Khong thay doi workflow da nghiem thu neu khong co Change Request.
- Khong lam AI diagnosis/report generation.
- Khong lam native companion day du neu Phase 9 chua duyet.
- Khong dua data benh nhan that vao training/seed/UAT docs.
- Khong bo qua permission server-side vi muc dich demo.
- Khong chay destructive/retention test tren du lieu production that khi chua co approval.

## 5. Nguyen tac UI visibility bat buoc

Phase 10 la phase "khong con invisible work".

- Release candidate -> co UI version/build/checksum/status.
- UAT case -> co UI pass/fail/blocker/evidence.
- Sign-off -> co UI ai sign, luc nao, role nao, comment nao.
- Training -> co UI tai lieu, nguoi da hoc, nguoi chua hoc.
- Go-live checklist -> co UI owner/status/time.
- Incident -> co UI severity, module, assignee, linked health/audit/log.
- Change request -> co UI scope, risk, approval, target release.
- Runbook -> co UI step, owner, last executed, result.

## 6. Permission contract de xuat

Them permission moi:

| Permission | Muc dich |
| --- | --- |
| `release.read` | Xem Release Center va release notes |
| `release.manage` | Tao/sua release candidate, checklist, known issue |
| `release.signoff` | Ky nghiem thu/go-live |
| `uat.read` | Xem UAT plan/result |
| `uat.execute` | Chay va cap nhat ket qua UAT case |
| `uat.manage` | Quan ly UAT suite/case |
| `training.read` | Xem tai lieu dao tao |
| `training.manage` | Quan ly training material va assignment |
| `training.attest` | Xac nhan da hoan tat dao tao cua chinh minh |
| `incident.read` | Xem incident/support ticket |
| `incident.manage` | Tao/cap nhat/assign/close incident |
| `change.read` | Xem change request |
| `change.manage` | Tao/cap nhat change request |
| `change.approve` | Duyet change request |
| `runbook.read` | Xem runbook van hanh |
| `runbook.execute` | Danh dau/thuc thi runbook step |
| `runbook.manage` | Quan ly runbook |

Role de xuat:

- `ADMIN`: tat ca.
- `DOCTOR`: `release.read`, `uat.read`, `uat.execute` cho case clinical, `training.read`, `training.attest`, `incident.read`, co the tao incident.
- `TECHNICIAN`: `release.read`, `uat.execute` cho worklist/viewer/non-DICOM/storage lien quan, `training.read`, `incident.manage` neu la IT/KTV van hanh.
- `RECEPTION`: `release.read`, `uat.execute` cho tiep don/worklist/archive/delivery, `training.read`, `training.attest`, tao incident.

## 7. Route/UI de xuat

### 7.1 `/admin/release`

Release Center.

Noi dung:

- Current release candidate.
- Build/version/git commit/image tag.
- Migration status.
- Seed status.
- Environment target: local, staging, production.
- Linked health/security/performance/DICOM conformance latest status.
- Known issues summary.
- Sign-off status by role.
- Go/no-go decision.

### 7.2 `/admin/release/candidates`

Quan ly release candidates.

Fields:

- version
- title
- target environment
- status: `DRAFT | TESTING | BLOCKED | READY_FOR_SIGNOFF | APPROVED | RELEASED | ROLLED_BACK`
- build metadata
- migration notes
- config notes
- release notes
- known limitations

### 7.3 `/admin/release/uat`

UAT Center.

Tabs:

- Test Suites by module: Worklist, Study List, Report, Viewer, HIS, Admin, Non-DICOM, Share, Export, Ops.
- Test Cases.
- Execution Runs.
- Evidence attachments/screenshots.
- Failures/blockers.
- Role sign-off.

### 7.4 `/admin/release/go-live`

Go-Live Command Center.

Sections:

- Pre-go-live checklist.
- Cutover checklist.
- Post-go-live monitoring checklist.
- Rollback checklist.
- Communication checklist.
- On-call contacts.
- Open blockers.
- Go/no-go approval.

### 7.5 `/admin/training`

Training Center.

Sections:

- Training materials by role/module.
- User assignment.
- Completion tracking.
- Short acknowledgement/attestation.
- Links to in-app pages.
- Downloadable quick guides.

### 7.6 `/support/incidents`

Support & Incident Desk.

Noi dung:

- Create incident from user/admin.
- Severity: `SEV1 | SEV2 | SEV3 | SEV4`.
- Module.
- Affected user/study/order/report optional.
- Link to health check, audit event, HIS log, export job, share link, consultation.
- Timeline comments.
- Resolution and root cause.

### 7.7 `/admin/changes`

Change Request Board.

Noi dung:

- Request new feature/change.
- Classify risk.
- Link to phase/module.
- Approval workflow.
- Target release.
- UAT required yes/no.
- Release notes impact.

### 7.8 `/admin/runbooks`

Operations Runbook.

Runbooks:

- Deploy new version.
- Rollback version.
- Restart dashboard container.
- Restart Orthanc.
- Run migration/seed.
- Verify backup.
- Restore drill.
- Rotate HIS token.
- Rotate auth/encryption secrets.
- Export scrubbed logs.
- Disable public share.
- Disable HIS Gateway.
- Emergency maintenance mode.

## 8. Data model de xuat

### 8.1 `ReleaseCandidate`

Fields:

- `id String @id @default(uuid())`
- `version String`
- `title String`
- `status String`
- `targetEnvironment String`
- `gitCommit String?`
- `dockerImageTag String?`
- `buildNumber String?`
- `migrationStatus String?`
- `seedStatus String?`
- `releaseNotes String? @db.Text`
- `knownLimitations String? @db.Text`
- `createdByUserId String?`
- `approvedByUserId String?`
- `approvedAt DateTime?`
- `releasedAt DateTime?`
- `rolledBackAt DateTime?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.2 `ReleaseChecklistItem`

Fields:

- `id String @id @default(uuid())`
- `releaseCandidateId String`
- `category String`
- `title String`
- `description String? @db.Text`
- `status String` - `TODO | IN_PROGRESS | PASS | FAIL | WAIVED | BLOCKED`
- `ownerUserId String?`
- `completedByUserId String?`
- `completedAt DateTime?`
- `evidenceUrl String?`
- `comment String? @db.Text`
- `sortOrder Int @default(0)`

### 8.3 `UatSuite`

Fields:

- `id String @id @default(uuid())`
- `code String @unique`
- `name String`
- `module String`
- `roleScope String?`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.4 `UatCase`

Fields:

- `id String @id @default(uuid())`
- `suiteId String`
- `code String @unique`
- `title String`
- `priority String`
- `preconditions String? @db.Text`
- `stepsJson String @db.Text`
- `expectedResult String @db.Text`
- `auditChecks String? @db.Text`
- `isActive Boolean @default(true)`
- `sortOrder Int @default(0)`

### 8.5 `UatRun`

Fields:

- `id String @id @default(uuid())`
- `releaseCandidateId String?`
- `suiteId String?`
- `status String` - `PLANNED | RUNNING | PASS | FAIL | BLOCKED | CANCELLED`
- `startedByUserId String?`
- `startedAt DateTime @default(now())`
- `completedAt DateTime?`
- `summaryJson String? @db.Text`

### 8.6 `UatCaseResult`

Fields:

- `id String @id @default(uuid())`
- `runId String`
- `caseId String`
- `status String` - `NOT_RUN | PASS | FAIL | BLOCKED | WAIVED`
- `executedByUserId String?`
- `executedAt DateTime?`
- `actualResult String? @db.Text`
- `evidenceJson String? @db.Text`
- `linkedIncidentId String?`
- `comment String? @db.Text`

### 8.7 `ReleaseSignoff`

Fields:

- `id String @id @default(uuid())`
- `releaseCandidateId String`
- `roleScope String`
- `signedByUserId String`
- `status String` - `APPROVED | REJECTED | APPROVED_WITH_RISK`
- `comment String? @db.Text`
- `signedAt DateTime @default(now())`

### 8.8 `TrainingMaterial`

Fields:

- `id String @id @default(uuid())`
- `title String`
- `module String`
- `roleScope String?`
- `contentType String` - `MARKDOWN | LINK | VIDEO | PDF | CHECKLIST`
- `contentUrl String?`
- `body String? @db.Text`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.9 `TrainingAssignment`

Fields:

- `id String @id @default(uuid())`
- `materialId String`
- `userId String`
- `status String` - `ASSIGNED | VIEWED | COMPLETED | WAIVED`
- `assignedByUserId String?`
- `completedAt DateTime?`
- `attestationText String? @db.Text`
- `createdAt DateTime @default(now())`

### 8.10 `SupportIncident`

Fields:

- `id String @id @default(uuid())`
- `ticketNo String @unique`
- `title String`
- `severity String`
- `status String` - `OPEN | TRIAGED | IN_PROGRESS | WAITING | RESOLVED | CLOSED`
- `module String`
- `reportedByUserId String?`
- `assignedToUserId String?`
- `studyInstanceUid String?`
- `orderId String?`
- `reportId String?`
- `linkedHealthRunId String?`
- `linkedHisLogId String?`
- `linkedExportJobId String?`
- `description String? @db.Text`
- `resolution String? @db.Text`
- `rootCause String? @db.Text`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- `resolvedAt DateTime?`

### 8.11 `ChangeRequest`

Fields:

- `id String @id @default(uuid())`
- `requestNo String @unique`
- `title String`
- `status String` - `NEW | REVIEWING | APPROVED | REJECTED | PLANNED | IMPLEMENTED | RELEASED`
- `priority String`
- `riskLevel String`
- `module String`
- `requestedByUserId String?`
- `approvedByUserId String?`
- `targetReleaseId String?`
- `description String @db.Text`
- `impactSummary String? @db.Text`
- `uatRequired Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.12 `Runbook`

Fields:

- `id String @id @default(uuid())`
- `code String @unique`
- `title String`
- `category String`
- `riskLevel String`
- `isActive Boolean @default(true)`
- `description String? @db.Text`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.13 `RunbookStep`

Fields:

- `id String @id @default(uuid())`
- `runbookId String`
- `title String`
- `instruction String @db.Text`
- `requiresConfirmation Boolean @default(false)`
- `sortOrder Int @default(0)`

### 8.14 `RunbookExecution`

Fields:

- `id String @id @default(uuid())`
- `runbookId String`
- `status String` - `RUNNING | SUCCESS | FAILED | CANCELLED`
- `executedByUserId String?`
- `startedAt DateTime @default(now())`
- `completedAt DateTime?`
- `resultSummary String? @db.Text`

## 9. Services de xuat

### 9.1 `releaseService`

Responsibilities:

- Manage release candidates.
- Build release checklist from templates.
- Link latest health/security/performance/DICOM results.
- Lock release after sign-off unless admin reopens with reason.

### 9.2 `uatService`

Responsibilities:

- Seed baseline UAT suites from `VRPACS_ACCEPTANCE_TEST_SCENARIOS.md`.
- Execute case results.
- Link failures to incidents.
- Calculate pass/fail/blocker status.

### 9.3 `trainingService`

Responsibilities:

- Manage materials.
- Assign training by role.
- Track completion.
- Store attestation without storing PHI.

### 9.4 `goLiveService`

Responsibilities:

- Prepare pre/cutover/post checklist.
- Track go/no-go status.
- Link rollback runbook.
- Generate go-live summary.

### 9.5 `incidentService`

Responsibilities:

- Create/update/resolve incident.
- Link operational context.
- Scrub PHI-heavy logs.
- Provide status timeline.

### 9.6 `changeRequestService`

Responsibilities:

- Manage post-go-live changes.
- Enforce approval for high-risk changes.
- Link change to release candidate/UAT.

### 9.7 `runbookService`

Responsibilities:

- Manage runbook definitions.
- Track execution.
- Require confirmation for risky steps.
- Audit all executions.

## 10. Server actions/API de xuat

Release:

- `getReleaseDashboardAction()`
- `createReleaseCandidateAction(payload)`
- `updateReleaseCandidateAction(id, payload)`
- `getReleaseCandidateDetailAction(id)`
- `updateReleaseChecklistItemAction(id, payload)`
- `signOffReleaseAction(releaseId, payload)`
- `markReleaseReleasedAction(releaseId)`
- `markReleaseRolledBackAction(releaseId, reason)`

UAT:

- `getUatSuitesAction()`
- `createUatRunAction(payload)`
- `updateUatCaseResultAction(resultId, payload)`
- `completeUatRunAction(runId)`
- `linkUatFailureToIncidentAction(resultId, incidentId)`

Training:

- `getTrainingMaterialsAction()`
- `saveTrainingMaterialAction(payload)`
- `assignTrainingAction(payload)`
- `completeMyTrainingAction(assignmentId)`

Incident:

- `createIncidentAction(payload)`
- `updateIncidentAction(id, payload)`
- `assignIncidentAction(id, userId)`
- `resolveIncidentAction(id, payload)`
- `getIncidentListAction(filters)`

Change:

- `createChangeRequestAction(payload)`
- `updateChangeRequestAction(id, payload)`
- `approveChangeRequestAction(id, payload)`
- `linkChangeToReleaseAction(changeId, releaseId)`

Runbook:

- `getRunbooksAction()`
- `saveRunbookAction(payload)`
- `startRunbookExecutionAction(runbookId)`
- `completeRunbookStepAction(executionId, stepId, payload)`
- `finishRunbookExecutionAction(executionId, payload)`

## 11. UI integration bat buoc

### Sidebar

Them nhom:

- `Phat hanh` -> `/admin/release`
- `UAT` -> `/admin/release/uat`
- `Go-live` -> `/admin/release/go-live`
- `Dao tao` -> `/admin/training`
- `Ho tro` -> `/support/incidents`
- `Thay doi` -> `/admin/changes`
- `Runbook` -> `/admin/runbooks`

### Existing pages

- `/admin/ops`: show current release candidate and go-live status.
- `/admin/ops/security`: findings can create incidents/change requests.
- `/admin/his`: failed gateway test can create incident.
- `/archive`, `/worklist`, `/report`: user can report issue with context.
- `/settings/account`: show assigned training and support tickets of current user.

## 12. Release/UAT case baseline

Phase 10 should import or mirror these scenarios from `VRPACS_ACCEPTANCE_TEST_SCENARIOS.md`:

- Worklist order/MWL.
- Check-in/cancel order.
- Orthanc sync.
- Start reading/save draft.
- Finalize/print/deliver.
- Unfinalize/addendum.
- HIS update/send/retry.
- Admin catalog/permission matrix.
- Viewer open/artifacts/history.
- Non-DICOM capture/upload/finalize.
- Share link/password/revoke.
- Consultation room.
- Export/download/anonymize.
- Retention dry-run/backup/destructive operations.
- Ops health/security/deployment checks.

Each UAT case needs:

- Role required.
- Test data required.
- Steps.
- Expected result.
- Audit check.
- Evidence field.
- Pass/fail/blocker status.

## 13. Go-live checklist baseline

### Pre-go-live

- Latest build deployed to staging.
- Migration applied.
- Seed/admin permissions verified.
- Health check PASS or accepted WARN.
- Security audit no open P0/P1.
- DICOM conformance smoke PASS for configured nodes.
- HIS Gateway inbound/outbound test PASS or intentionally disabled.
- Storage/export/backup folders tested.
- Test data removed or clearly marked.
- Admin/reception/doctor/technician accounts verified.
- Training assignments completed for required roles.
- Rollback plan reviewed.

### Cutover

- Freeze old system if applicable.
- Confirm DNS/Cloudflare/public URL.
- Confirm Docker containers healthy.
- Confirm login.
- Confirm Orthanc receives study.
- Confirm Worklist visible.
- Confirm report final/PDF.
- Confirm HIS sync if enabled.
- Confirm backup snapshot before production use.

### Post-go-live

- Monitor health dashboard.
- Monitor HIS logs.
- Monitor export/download jobs.
- Monitor incidents.
- Run backup verification.
- Capture first-day issues as incidents/change requests.
- Hold go-live review.

## 14. Training matrix

| Role | Training modules |
| --- | --- |
| Reception | Login, Worklist, Check-in, Create order, Delivery, Incident report |
| Technician | Worklist, DICOM node, Non-DICOM capture, Viewer basics, HIS status, Incident report |
| Doctor | Study List, Viewer, Report, Finalize, Share, Consultation, Export policy |
| Admin/IT | Users, Permissions, Catalogs, HIS Gateway, Storage, Backup, Ops, Security, Runbook |
| Leadership | Statistics, Release status, Incident overview, Go-live dashboard |

## 15. Incident severity policy

| Severity | Meaning | Example | Response target |
| --- | --- | --- | --- |
| SEV1 | He thong dung/khong doc duoc ca | Dashboard down, DB down, Orthanc down | Immediate |
| SEV2 | Workflow chinh hong, co workaround han che | HIS send fail all, report finalize fail | Same day |
| SEV3 | Mot tinh nang hong, co workaround | Share QR fail, export job fail mot ca | Planned |
| SEV4 | UI/minor/training request | Label sai, can them huong dan | Backlog |

## 16. Change request policy

Change request is required when:

- Workflow status changes.
- Permission changes affect role behavior.
- Report/HIS/public share/destructive policy changes.
- Database schema migration.
- New integration endpoint.
- UI changes that affect trained workflow.

High-risk change must have:

- Impact summary.
- Rollback plan.
- UAT case update.
- Release note.
- Approval.

## 17. PR breakdown

### PR 10.1 - Schema, permissions, release shell

Scope:

- Add Phase 10 models.
- Add permissions and seed.
- Add sidebar routes.
- Create Release Center shell.

Done when:

- Admin can open `/admin/release`.
- Non-admin only sees allowed pages.

### PR 10.2 - UAT Center

Scope:

- Seed/import baseline scenarios.
- UAT suite/case/run/result UI.
- Evidence/comment/blocker handling.

Done when:

- A UAT run can be created and completed with pass/fail results.

### PR 10.3 - Go-Live Command Center

Scope:

- Pre/cutover/post checklist.
- Go/no-go approval.
- Link latest health/security/DICOM/performance status.

Done when:

- Admin can see readiness and blockers in one page.

### PR 10.4 - Training Center

Scope:

- Training material CRUD.
- Assignment by role/user.
- User completion attestation.

Done when:

- User sees assigned training and can mark complete.

### PR 10.5 - Support & Incident Desk

Scope:

- Create/update/assign/resolve incidents.
- Context links from operational pages.
- Severity policy.

Done when:

- User can report issue from major pages and admin can triage.

### PR 10.6 - Change Request Board

Scope:

- Change request CRUD/approval.
- Link change to release/UAT/incident.
- Risk labels.

Done when:

- Post-go-live change is tracked before implementation.

### PR 10.7 - Runbook Operations

Scope:

- Runbook CRUD.
- Execution tracking.
- Confirmation for risky steps.
- Link to Phase 9 ops/deployment pages.

Done when:

- Admin can run a deployment/rollback/backup verification checklist from UI.

### PR 10.8 - Release sign-off and final acceptance

Scope:

- Role sign-off.
- Release notes.
- Known issue acceptance.
- Released/rollback status.

Done when:

- A release candidate can move from testing to approved/released with signed evidence.

### PR 10.9 - QA, docs, handoff

Scope:

- Build/typecheck.
- Manual UAT smoke.
- Update docs.
- Prepare handoff summary.

Done when:

- Phase 10 acceptance criteria pass.

## 18. Manual QA scenarios

### SCN-10.1 Create release candidate

Expected:

- Admin creates release candidate.
- Status is `DRAFT`.
- Build/version metadata visible.

### SCN-10.2 Run UAT suite

Expected:

- Tester creates UAT run.
- Marks cases pass/fail.
- Failed case can create linked incident.

### SCN-10.3 Sign-off blocked by failed UAT

Expected:

- Release cannot be approved while P0/P1 blockers are open unless accepted risk permission exists.

### SCN-10.4 Complete training

Expected:

- User sees assigned training.
- User attests completion.
- Admin sees completion status.

### SCN-10.5 Create incident from report page

Expected:

- Incident captures module/context link.
- No report body/PHI dump is copied into ticket automatically.

### SCN-10.6 Go-live checklist

Expected:

- Admin marks pre-go-live steps.
- Missing health/security checks show blocker.

### SCN-10.7 Change request approval

Expected:

- User creates change request.
- Admin approves/rejects.
- Approved change can link to release.

### SCN-10.8 Runbook execution

Expected:

- Admin starts runbook.
- Steps require confirmation if risky.
- Execution result is audited.

### SCN-10.9 Role restrictions

Expected:

- Reception cannot approve release.
- Doctor can execute assigned UAT/training only.
- Direct server action calls are rejected.

### SCN-10.10 Release marked released

Expected:

- Release with required sign-offs can be marked released.
- Release dashboard shows current production release.

## 19. Acceptance criteria

Phase 10 chi duoc xem la xong khi:

1. Release Center exists with release candidate lifecycle.
2. UAT Center can run and store test evidence/results.
3. Go-Live Command Center shows readiness and blockers.
4. Training Center tracks material assignments and completion.
5. Support Incident Desk works and links context safely.
6. Change Request Board governs post-go-live changes.
7. Runbook UI exists for deployment/rollback/backup/secret operations.
8. Role sign-off is enforced.
9. No PHI/secret is copied into incidents, training, release notes, or logs by default.
10. All new actions have server-side permissions.
11. UI hides actions user cannot perform.
12. Build/typecheck pass.
13. Manual QA scenarios are documented.

## 20. Rui ro va guardrails

| Rui ro | Giam thieu |
| --- | --- |
| Bien Phase 10 thanh them feature lung tung | Change Request Board bat buoc cho scope moi |
| Incident ticket ro ri PHI | Context link only, scrub default, no raw report body |
| Sign-off hinh thuc | Link UAT/health/security status vao release |
| Dao tao khong ai theo doi | Training assignment/completion UI |
| Go-live quen rollback | Rollback checklist bat buoc trong Go-Live Center |
| Runbook step nguy hiem bi bam nham | Permission + confirmation + audit |
| Release da approve bi sua ngam | Lock release sau sign-off; reopen can reason |

## 21. Prompt giao cho AI coding agent

```text
Ban la coding agent trong repo MiniPACS. Hay thuc hien Phase 10 - Release, UAT, Go-Live, Training, And Operations Handoff theo file:

docs/VRPACS_PHASE10_RELEASE_UAT_GO_LIVE_OPERATIONS_PLAN.md

Muc tieu:

- Tao Release Center, UAT Center, Go-Live Command Center, Training Center, Incident Desk, Change Request Board va Runbook UI.
- Moi artifact nghiem thu/dao tao/go-live/incident/change phai co UI hien thi va thao tac.
- Khong them workflow clinical moi ngoai scope Phase 10.

Doc truoc:

- docs/VRPACS_PHASE10_RELEASE_UAT_GO_LIVE_OPERATIONS_PLAN.md
- docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md
- docs/VRPACS_PHASE9_PRODUCTION_HARDENING_NATIVE_WORKSTATION_PLAN.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md
- dashboard/prisma/schema.prisma
- dashboard/lib/permissions.ts
- dashboard/app/admin/ops/**
- dashboard/app/settings/**
- dashboard/components/AppSidebar.tsx

Rang buoc:

- Khong revert thay doi cua user.
- Khong copy PHI/report body/raw log vao incident/release/training mac dinh.
- Khong expose secret/token/password.
- Server-side permission bat buoc.
- UI khong hien action neu backend se reject.
- Release sign-off phai co audit.
- Runbook risky step phai co confirmation.
- Build/typecheck phai pass truoc khi bao xong.

Ket qua cuoi:

- Files changed list.
- Behavior/UI changed summary.
- Migration/config notes.
- Tests/build da chay.
- Manual QA scenarios.
- Rui ro con lai neu co.
```
