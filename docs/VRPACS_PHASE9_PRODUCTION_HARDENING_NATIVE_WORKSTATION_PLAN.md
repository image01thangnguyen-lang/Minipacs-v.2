# Ke hoach chi tiet Phase 9 - Production Hardening And Native Workstation Extensions

Updated: 2026-07-04

## 1. Muc tieu

Phase 9 bien MiniPACS tu mot he thong da co day du workflow thanh mot he thong san sang van hanh production: de giam sat, de audit, de test tai, de kiem tra DICOM conformance, de trien khai tren cloud/on-prem, va co ranh gioi ro rang neu can native workstation companion.

Muc tieu cuoi phase:

- Co trung tam van hanh UI de nhin suc khoe he thong: Dashboard app, DB, Prisma, Orthanc, HIS Gateway, storage, backup, export jobs, share/public routes.
- Co Security & Audit Center de review quyen, secret/config, PHI exposure, public share, export/download, destructive operations.
- Co DICOM Conformance UI de chay C-ECHO, MWL check, DICOMweb smoke, C-STORE/C-FIND/C-MOVE neu duoc enable.
- Co Performance & Load QA UI de chay/ghi nhan smoke test cho large CT/MR, viewer, report print, export, HIS inbound/outbound.
- Co Deployment Readiness UI cho Cloud Shell/Docker/Cloudflare/on-prem: env check, port/base URL, health endpoints, migration/seed status.
- Co user self-service co ban: doi mat khau, ngon ngu, viewer/report preferences nhin thay tren UI.
- Co Native Companion decision gate: UI cau hinh, health check, audit event, nhung chi implement native bridge neu co nhu cau that va co boundary an toan.
- Tat ca nhung gi lam trong Phase 9 phai hien thi tren UI. Khong co backend-only hardening ma nguoi van hanh khong xem duoc.

## 2. Ly do Phase 9 can lam sau Phase 8

Phase 1-8 da them nhieu surface nhay cam:

- HIS Gateway va API inbound/outbound.
- Public share/proxy va consultation.
- Export/download, backup, retention, destructive delete.
- Non-DICOM capture/upload.
- Viewer artifact, measurement, snapshot, key image.

Neu khong co Phase 9, he thong co the "chay duoc" nhung kho van hanh:

- Khong biet service nao dang hong.
- Khong biet migration/seed da apply dung chua.
- Khong co checklist de deploy Cloud Shell/Docker/Cloudflare.
- Khong co UI de soi audit/security rui ro.
- Khong co DICOM conformance smoke test truoc khi noi may chup that.
- Khong co cach ra quyet dinh native companion nao can lam, cai nao nen bo.

## 3. Dieu kien tien quyet

Chi nen bat dau Phase 9 khi:

- Phase 1 workflow/report/archive on dinh.
- Phase 2 va Phase 7.5 HIS adapter/gateway/log UI da co.
- Phase 3 admin catalog, storage, permission matrix da co.
- Phase 3.5 operational UI visibility da dua field/action ra giao dien.
- Phase 4/5 viewer registry khong con "ready gia".
- Phase 6 Non-DICOM upload/capture co permission va audit.
- Phase 7 share/consult co token scope, HMAC cookie, ownership check.
- Phase 8 export/retention/backup/destructive co job, dry-run, approval, audit.

Doc truoc:

- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
- `docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md`
- `docs/VRPACS_WORKFLOW_STATUS_POLICY.md`
- `docs/VRPACS_PHASE7_5_HIS_PRODUCTION_API_GATEWAY_PLAN.md`
- `docs/VRPACS_PHASE8_DOWNLOAD_RETENTION_BACKUP_DESTRUCTIVE_OPERATIONS_PLAN.md`
- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/app/admin/his/**`
- `dashboard/app/admin/storage/**`
- `dashboard/app/archive/**`
- `dashboard/app/statistics/**`
- `dashboard/app/api/**`
- `docker-compose.yml`
- `.env.example`

## 4. Khong nam trong Phase 9

Phase 9 khong phai phase them workflow clinical moi.

Khong lam:

- Khong them HIS production adapter moi ngoai cac boundary da co o Phase 7.5.
- Khong them AI diagnosis/reporting.
- Khong lam viewer advanced tool moi neu chua co trong Phase 5.
- Khong hard-delete hoac thay doi policy destructive cua Phase 8.
- Khong trien khai native companion day du neu chua co quyet dinh duyet.
- Khong dua PHI vao seed/test/log.
- Khong expose raw filesystem path, secret, token, password, DICOM payload.
- Khong tao mot dashboard "mau xanh" nhung khong co backend check that.

## 5. Nguyen tac UI visibility bat buoc

Tu Phase 5 tro di, moi thu lam duoc phai hien tren UI. Phase 9 phai theo quy tac nay nghiem ngat:

- Health check -> co man hinh ket qua, timestamp, error da scrub.
- Security finding -> co list, severity, status, owner, action fix.
- Performance run -> co lich su run, duration, input size, status, error.
- DICOM conformance -> co test suite UI va result history.
- Env/deployment readiness -> co checklist UI va trang thai.
- Native companion -> co trang cau hinh/health/status, hoac ghi ro "not enabled".
- User self-service -> co page de user tu thao tac, khong chi co server action.
- Audit/log -> co filter, export an toan, va link tu cac module lien quan.

## 6. Permission contract de xuat

Them permission moi:

| Permission | Muc dich |
| --- | --- |
| `ops.health` | Xem system health, service status, env readiness summary |
| `ops.health.run` | Chay manual health checks |
| `ops.security` | Xem Security & Audit Center |
| `ops.security.resolve` | Danh dau finding da review/accepted/fixed |
| `ops.performance` | Xem va chay performance smoke tests |
| `ops.dicomConformance` | Xem va chay DICOM conformance tests |
| `ops.deployment` | Xem deployment checklist va environment diagnostics |
| `system.audit` | Xem audit/security logs tong hop |
| `system.audit.export` | Export audit log da scrub |
| `account.selfManage` | User doi mat khau/preference cua chinh minh |
| `native.manage` | Cau hinh native companion |
| `native.use` | Su dung native companion actions neu enabled |

Role de xuat:

- `ADMIN`: tat ca permission Phase 9.
- `DOCTOR`: `account.selfManage`, co the `native.use` neu native bridge duoc bat.
- `TECHNICIAN`: `account.selfManage`, `ops.health` read-only, `ops.dicomConformance` neu can test PACS/may chup.
- `RECEPTION`: `account.selfManage`.

Khong role nao ngoai ADMIN duoc `ops.security.resolve`, `ops.deployment`, `native.manage` mac dinh.

## 7. Route/UI de xuat

### 7.1 `/admin/ops`

Operations Command Center.

Noi dung:

- System status tiles: Dashboard, DB, Prisma schema, Orthanc, HIS Gateway, Storage, Backup, Export Queue, Share Proxy.
- Last check time va status `OK | WARN | FAIL | UNKNOWN`.
- Quick action: Run Health Check.
- Quick links: HIS logs, Export jobs, Backup, Security findings, DICOM conformance.
- Deployment banner neu `APP_BASE_URL`, `AUTH_SECRET`, `HIS_ENCRYPTION_KEY`, `NEXTAUTH_URL` hoac Cloudflare forwarded headers co van de.

### 7.2 `/admin/ops/health`

Health Check Center.

Checks:

- DB connection and migration table.
- Prisma client/schema sanity.
- Seed baseline permissions exist.
- Auth secret present.
- Dashboard public URL/base URL.
- Orthanc REST reachability.
- DICOMweb endpoint.
- MWL folder write/read.
- Storage folder configs write/read.
- Export folder write/read.
- Backup folder check.
- HIS active config and inbound token state, secret scrubbed.
- Share proxy route reachable.
- Non-DICOM media storage reachable.

### 7.3 `/admin/ops/security`

Security & Audit Center.

Tabs:

- Findings: auto checks with severity.
- Audit Explorer: cross-module audit search.
- Public Exposure: active share links, expiring links, max access, hide patient option.
- Secrets & Config: only status, never raw secret.
- Permission Review: dangerous permissions by role/user.
- Data Safety: PHI filename/export scan results.

### 7.4 `/admin/ops/performance`

Performance Smoke Center.

Test runs:

- Study list load with large data.
- Worklist load.
- Archive search.
- Report detail load.
- Report PDF render/export.
- Viewer launch URL/context load.
- Export job dry-run/create/cancel.
- HIS inbound/outbound mock call.
- Non-DICOM upload small/large limit test.

UI shows:

- Run status, duration, item count, memory estimate if available.
- Error message scrubbed.
- Trend by run date.

### 7.5 `/admin/ops/dicom`

DICOM Conformance Center.

Tests:

- Orthanc C-ECHO for configured DICOM nodes.
- DICOMweb QIDO study search.
- DICOMweb WADO metadata/sample instance.
- MWL file generation and folder visibility.
- C-STORE receive smoke if feasible.
- C-FIND/C-MOVE only if explicitly configured.

UI:

- Select node.
- Run selected test.
- Show request summary, response status, duration, error scrubbed.
- Save result history.
- Export conformance summary as PDF/Markdown.

### 7.6 `/admin/ops/deployment`

Deployment Readiness.

Cloud Shell/Cloudflare/Docker specific checks:

- App reachable through configured public URL.
- Internal port `8080`/dashboard port mapping explained.
- `NEXTAUTH_URL`/`AUTH_URL`/`APP_BASE_URL` match public link.
- `AUTH_SECRET` exists.
- `HIS_ENCRYPTION_KEY` exists.
- `docker-compose.yml` command includes safe startup command.
- Prisma migration/db push mode is explicit.
- DB volume exists.
- Orthanc volume exists.
- Upload/export/backup folders exist.
- Cloudflare forwarded proto/host support.

### 7.7 `/settings/account`

User self-service.

Features:

- Change own password.
- Update language preference.
- Update compact/dense UI preference.
- Viewer default settings summary link.
- Last login / recent security events for own account.

### 7.8 `/admin/native`

Native Companion Manager.

MVP in Phase 9 is decision and boundary, not full native app.

UI:

- Native bridge enabled/disabled.
- Companion URL/port if deployed.
- Health check.
- Allowed actions: open folder, DICOM print, CD/DVD burn, scanner capture, external viewer launch.
- Per-action status: `not_planned | planned | enabled | disabled | failed`.
- Audit events.

## 8. Data model de xuat

### 8.1 `SystemHealthCheckRun`

Fields:

- `id String @id @default(uuid())`
- `status String` - `OK | WARN | FAIL`
- `triggeredByUserId String?`
- `trigger String` - `MANUAL | SCHEDULED | STARTUP`
- `summaryJson String? @db.Text`
- `startedAt DateTime @default(now())`
- `finishedAt DateTime?`

### 8.2 `SystemHealthCheckItem`

Fields:

- `id String @id @default(uuid())`
- `runId String`
- `checkKey String`
- `category String`
- `status String` - `OK | WARN | FAIL | SKIPPED`
- `message String? @db.Text`
- `durationMs Int?`
- `metadataJson String? @db.Text`
- `createdAt DateTime @default(now())`

Indexes:

- `runId`
- `checkKey`
- `status`
- `createdAt`

### 8.3 `SecurityAuditRun`

Fields:

- `id String @id @default(uuid())`
- `status String` - `OK | WARN | FAIL`
- `triggeredByUserId String?`
- `startedAt DateTime @default(now())`
- `finishedAt DateTime?`

### 8.4 `SecurityAuditFinding`

Fields:

- `id String @id @default(uuid())`
- `runId String?`
- `findingKey String`
- `severity String` - `P0 | P1 | P2 | P3`
- `status String` - `OPEN | ACKNOWLEDGED | FIXED | ACCEPTED_RISK`
- `title String`
- `description String @db.Text`
- `affectedArea String`
- `recommendation String? @db.Text`
- `resolvedByUserId String?`
- `resolvedAt DateTime?`
- `metadataJson String? @db.Text`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.5 `PerformanceTestRun`

Fields:

- `id String @id @default(uuid())`
- `testKey String`
- `status String` - `PENDING | RUNNING | SUCCESS | FAILED | CANCELLED`
- `triggeredByUserId String?`
- `durationMs Int?`
- `inputJson String? @db.Text`
- `resultJson String? @db.Text`
- `errorMessage String? @db.Text`
- `createdAt DateTime @default(now())`
- `completedAt DateTime?`

### 8.6 `DicomConformanceRun`

Fields:

- `id String @id @default(uuid())`
- `testKey String`
- `dicomNodeId String?`
- `status String` - `SUCCESS | FAILED | SKIPPED`
- `durationMs Int?`
- `requestSummaryJson String? @db.Text`
- `responseSummaryJson String? @db.Text`
- `errorMessage String? @db.Text`
- `triggeredByUserId String?`
- `createdAt DateTime @default(now())`

### 8.7 `NativeConnectorConfig`

Fields:

- `id String @id @default(uuid())`
- `isEnabled Boolean @default(false)`
- `baseUrl String?`
- `allowedActionsJson String? @db.Text`
- `lastHealthStatus String?`
- `lastHealthAt DateTime?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.8 `NativeConnectorEvent`

Fields:

- `id String @id @default(uuid())`
- `actionKey String`
- `status String`
- `actorUserId String?`
- `targetType String?`
- `targetId String?`
- `message String? @db.Text`
- `metadataJson String? @db.Text`
- `createdAt DateTime @default(now())`

## 9. Services de xuat

### 9.1 `systemHealthService`

Responsibilities:

- Run all health checks.
- Scrub secrets/paths from errors.
- Persist run + items.
- Return latest summary for dashboard.

### 9.2 `securityAuditService`

Responsibilities:

- Check public share risks.
- Check dangerous permissions.
- Check missing env secrets.
- Check PHI-risk filenames/export jobs.
- Check audit coverage gaps if detectable.
- Persist findings.

### 9.3 `performanceSmokeService`

Responsibilities:

- Run bounded, safe smoke tests.
- Never run destructive workload.
- Use low default sample size.
- Persist duration/result/error.

### 9.4 `dicomConformanceService`

Responsibilities:

- Run Orthanc/DICOMweb checks.
- Run DICOM node echo checks using existing PACS node actions where possible.
- Mark tests skipped if capability not configured.
- Persist conformance history.

### 9.5 `deploymentReadinessService`

Responsibilities:

- Inspect env/config without exposing secrets.
- Validate Cloudflare/base URL/proxy assumptions.
- Return human-readable fix hints.

### 9.6 `nativeConnectorService`

Responsibilities:

- Store native bridge config.
- Test health.
- Gate all native actions by permission and explicit enabled config.
- Audit all calls.

## 10. API/server actions de xuat

Admin Operations:

- `getOpsDashboardAction()`
- `runSystemHealthCheckAction()`
- `getHealthRunsAction()`
- `getHealthRunDetailAction(runId)`
- `runSecurityAuditAction()`
- `getSecurityFindingsAction(filters)`
- `resolveSecurityFindingAction(id, status, reason)`
- `runPerformanceSmokeAction(testKey, input)`
- `getPerformanceRunsAction(filters)`
- `runDicomConformanceAction(testKey, dicomNodeId)`
- `getDicomConformanceRunsAction(filters)`
- `getDeploymentReadinessAction()`
- `saveNativeConnectorConfigAction(payload)`
- `testNativeConnectorAction()`

Account:

- `getMyAccountSettingsAction()`
- `changeMyPasswordAction(payload)`
- `updateMyPreferencesAction(payload)`
- `getMySecurityEventsAction()`

Rules:

- Moi action admin phai check server-side permission.
- UI hide/show theo permissions nhung khong thay the backend check.
- Errors tra ve UI phai scrub secret/path/PHI.

## 11. UI integration bat buoc

### Sidebar

Them nhom menu admin:

- `Van hanh` -> `/admin/ops`
- `Bao mat & Audit` -> `/admin/ops/security`
- `DICOM Conformance` -> `/admin/ops/dicom`
- `Deployment` -> `/admin/ops/deployment`
- `Native Bridge` -> `/admin/native` neu enabled hoac admin.

Them user menu:

- `Tai khoan cua toi` -> `/settings/account`

### Existing pages

- `/statistics`: them link den health/performance neu co failed checks.
- `/admin/his`: show health link den HIS checks va HIS Gateway readiness.
- `/admin/storage`: show link den backup/storage health checks.
- `/archive`: neu export/destructive job failed, link den Operations.
- `/share/[token]`: khong them admin UI, nhung access denials phai vao audit/security summary.

## 12. Security checklist Phase 9

P0 checks:

- Missing `AUTH_SECRET`/`NEXTAUTH_SECRET` in production.
- Missing `HIS_ENCRYPTION_KEY` in production.
- Public share cookie HMAC validation.
- Public share token scope enforcement.
- HIS inbound auth timing-safe compare.
- No raw HIS secrets returned to client.
- No raw filesystem path exposed in storage/export responses.
- Export filenames PHI-safe.
- Direct API permission bypass tests for admin routes.
- Destructive operations cannot execute without dry-run/approval/confirmation.
- Upload routes have size/type limits.

P1 checks:

- Dangerous permissions assigned to non-admin.
- Active share links without expiry or with too high max access.
- Failed HIS calls not logged.
- AuditLog gaps for finalize/unfinalize/export/share/delete.
- Storage folders failing health check.
- Backup not verified recently.

## 13. Performance/load checklist

MVP smoke tests only, not full benchmark.

Test cases:

- Study List loads with 1k cached studies.
- Worklist loads with 1k orders.
- Archive search with date/status filters.
- Report detail load for final report with artifacts.
- Viewer context API for large CT study.
- Export job creation/cancel for DICOM study.
- Non-DICOM gallery with 100 media records.
- HIS inbound order upsert mock call.
- HIS outbound final report mock call.

Metrics:

- durationMs
- result count
- error status
- warning thresholds
- run actor

## 14. DICOM conformance checklist

MVP:

- C-ECHO configured node.
- Orthanc `/system` check.
- DICOMweb QIDO study query.
- DICOMweb WADO metadata for one study.
- MWL folder generation/read.
- DICOM node config consistency: AE Title, IP, port, modality, active flag.

Optional:

- C-STORE receive smoke with test DICOM.
- C-FIND/C-MOVE if deployment enables it.
- DICOM SR export only if Phase 14 viewer/report later adds it.

## 15. Native companion decision gate

Native features in roadmap:

- Open local folder.
- DICOM print SCU.
- CD/DVD burn.
- Scanner bridge.
- Local monitor capture.
- External viewer launch.

Phase 9 should not blindly implement all.

Decision questions in UI/docs:

- Is the deployment on Windows workstation or browser-only cloud?
- Is direct hardware access required?
- Is the action possible through server-side service instead?
- Does it need PHI/data transfer outside browser?
- What audit should be created?
- What permission gates apply?

MVP acceptable outcome:

- Native Bridge page exists.
- It says disabled/not configured by default.
- Health check can test a configured bridge URL.
- No native action button appears in operational UI unless bridge is enabled and user has `native.use`.

## 16. PR breakdown

### PR 9.1 - Schema, permissions, navigation shell

Scope:

- Add Phase 9 permissions.
- Add models for health/security/performance/DICOM/native.
- Add routes/navigation skeleton.
- Seed/admin role update.

Done when:

- Admin sees Operations pages.
- Non-admin cannot access admin ops.
- Prisma generate/build pass.

### PR 9.2 - Operations health center

Scope:

- Implement `systemHealthService`.
- Add `/admin/ops` and `/admin/ops/health`.
- Checks for DB, Prisma, Orthanc, HIS, storage, backup, export, share.

Done when:

- Admin can run health check and see persisted history.
- Errors are useful but scrubbed.

### PR 9.3 - Deployment readiness for Docker/Cloudflare

Scope:

- Add `/admin/ops/deployment`.
- Check env/base URL/secrets/ports/volumes/startup command.
- Add Cloud Shell deployment notes.

Done when:

- Admin can see why routes like `/admin/his` fail if dashboard container is down or base URL is wrong.

### PR 9.4 - Security & audit center

Scope:

- Implement security audit checks.
- Findings UI.
- Audit Explorer across app audit sources.
- Resolve/accept risk workflow.

Done when:

- Admin can run audit and track findings.
- No secrets/PHI dumps in audit UI.

### PR 9.5 - Performance smoke center

Scope:

- Implement safe bounded performance tests.
- Add run UI/history.
- Add warning thresholds.

Done when:

- Admin can run smoke tests without destructive side effects.

### PR 9.6 - DICOM conformance center

Scope:

- Implement C-ECHO/DICOMweb/MWL tests.
- Add node selection and result history.
- Export summary.

Done when:

- Technician/admin can test a DICOM node before production use.

### PR 9.7 - Account self-service

Scope:

- Add `/settings/account`.
- Change own password.
- Language preference.
- Basic security events.

Done when:

- User can change own password without admin.
- Password changes are audited without logging secrets.

### PR 9.8 - Native companion manager

Scope:

- Add `/admin/native`.
- Config/health/status only.
- Optional action registry, disabled by default.

Done when:

- Native boundary is explicit and no fake enabled feature appears.

### PR 9.9 - QA, hardening, docs

Scope:

- Manual scenarios.
- Permission bypass tests.
- Build/typecheck.
- Deployment checklist.
- Update roadmap/backlog if scope changes.

Done when:

- Phase 9 acceptance criteria pass.

## 17. Manual QA scenarios

### SCN-9.1 Dashboard container down

Expected:

- Deployment readiness explains app is unreachable or health check fails.
- No misleading "OK" status.

### SCN-9.2 Missing production secret

Expected:

- Security/deployment UI marks P0/P1 finding.
- Raw secret value never shown.

### SCN-9.3 Orthanc unreachable

Expected:

- Health check marks Orthanc FAIL.
- Study List/Viewer errors link to health page where appropriate.

### SCN-9.4 HIS Gateway token configured

Expected:

- UI says token present/encrypted.
- Token never appears in response/client.

### SCN-9.5 Public share risk

Expected:

- Active share links appear in Public Exposure tab.
- Expired/revoked links are distinguishable.

### SCN-9.6 Permission bypass

Expected:

- User without `ops.security` cannot call security actions directly.
- UI hides admin ops menu.

### SCN-9.7 DICOM C-ECHO

Expected:

- Admin selects node and runs echo.
- Result persisted with status/duration/error.

### SCN-9.8 Performance smoke

Expected:

- Admin runs Archive search smoke.
- UI shows duration and status.
- Test cannot delete/update clinical data.

### SCN-9.9 Change own password

Expected:

- User changes password.
- Old password no longer works.
- Audit event exists without plaintext password.

### SCN-9.10 Native bridge disabled

Expected:

- Native page says disabled.
- No open-folder/print/CD/scanner buttons appear in operational UI.

## 18. Acceptance criteria

Phase 9 chi duoc xem la xong khi:

1. Operations Command Center exists and shows real health state.
2. Health checks persist run history and item details.
3. Deployment Readiness catches common Docker/Cloudflare/env mistakes.
4. Security Audit Center lists findings and supports review workflow.
5. Audit Explorer can search important events without exposing secrets/PHI dumps.
6. Performance Smoke Center can run bounded tests and save results.
7. DICOM Conformance Center can run at least Orthanc/DICOMweb/MWL checks.
8. User self-service account page works and is audited.
9. Native Companion Manager exists and is disabled by default unless configured.
10. All new permissions are in `permissions.ts`, seed, and admin permission UI.
11. No UI action appears if backend permission would reject it.
12. All errors shown to UI are scrubbed.
13. Build/typecheck pass.
14. Manual QA scenarios are documented.

## 19. Rui ro va guardrails

| Rui ro | Giam thieu |
| --- | --- |
| Health dashboard bao OK gia | Moi check phai co backend check that hoac hien `SKIPPED/UNKNOWN` |
| Lo secret qua diagnostics | Scrub helper bat buoc, chi hien present/missing/rotated |
| PHI lo qua audit explorer | Summary-only, filter fields, export scrubbed |
| Performance test lam treo prod | Gioi han sample, timeout, cancel, admin-only |
| DICOM test anh huong may chup | Read-only/smoke by default, C-STORE/C-MOVE optional |
| Native bridge thanh backdoor | Disabled by default, allowlist action, permission, audit, local token |
| Cloudflare/base URL sai lam share/auth fail | Deployment readiness check va huong dan UI |
| User doi password gay lockout | Confirm current password, admin reset fallback, audit |

## 20. Prompt giao cho AI coding agent

```text
Ban la coding agent trong repo MiniPACS. Hay thuc hien Phase 9 - Production Hardening And Native Workstation Extensions theo file:

docs/VRPACS_PHASE9_PRODUCTION_HARDENING_NATIVE_WORKSTATION_PLAN.md

Muc tieu:

- Tao Operations Command Center cho health, deployment, security, performance, DICOM conformance.
- Dua tat ca hardening/check/log ra UI van hanh.
- Them user self-service account page.
- Tao Native Companion Manager de quan ly boundary native, disabled by default.
- Khong tao backend-only feature; moi thu lam duoc phai nhin thay tren UI.

Doc truoc:

- docs/VRPACS_GAP_ANALYSIS_ROADMAP.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md
- docs/VRPACS_PHASE8_DOWNLOAD_RETENTION_BACKUP_DESTRUCTIVE_OPERATIONS_PLAN.md
- docs/VRPACS_PHASE9_PRODUCTION_HARDENING_NATIVE_WORKSTATION_PLAN.md
- dashboard/prisma/schema.prisma
- dashboard/lib/permissions.ts
- dashboard/app/admin/his/**
- dashboard/app/admin/storage/**
- dashboard/app/statistics/**
- docker-compose.yml
- .env.example

Rang buoc:

- Khong revert thay doi cua user.
- Khong expose secret/token/password/raw filesystem path.
- Khong expose PHI-heavy audit payload.
- Khong tao health check gia; neu chua check duoc thi hien SKIPPED/UNKNOWN.
- Khong chay load test pha production; chi smoke test co gioi han.
- Native bridge disabled by default.
- Server-side permission bat buoc.
- UI khong hien action neu backend se reject.
- Build/typecheck phai pass truoc khi bao xong.

Ket qua cuoi:

- Files changed list.
- Behavior/UI changed summary.
- Migration/config notes.
- Tests/build da chay.
- Manual QA scenarios.
- Cac UI surface da them.
- Rui ro con lai neu co.
```
