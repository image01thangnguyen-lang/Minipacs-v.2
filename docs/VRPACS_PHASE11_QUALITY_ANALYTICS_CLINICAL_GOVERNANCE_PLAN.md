# Ke hoach chi tiet Phase 11 - Quality, Analytics, Clinical Governance, And Command Center

Updated: 2026-07-04

## 1. Muc tieu

Phase 11 nang MiniPACS tu he thong da go-live thanh he thong co the quan tri chat luong va dieu hanh trung tam chan doan hinh anh hang ngay. Sau Phase 10, he thong da co release/UAT/go-live/support workflow; Phase 11 tap trung vao KPI/SLA, chat luong bao cao, critical result, peer review, QC/reject, workload bac si, utilization may/phong, data quality, va alert rules.

Muc tieu cuoi phase:

- Co Imaging Command Center dung nghia: realtime queue, SLA breach, stuck workflow, workload bac si, utilization may chup, PACS/HIS/export/share incidents.
- Co SLA/TAT Analytics theo tung chang workflow: order, check-in, scan, PACS received, first read, finalized, delivered.
- Co Quality & Safety Center: critical results, report addendum/amendment rate, peer review/discrepancy, QC reject/re-scan, missing data.
- Co Doctor Workload & Performance Board: assigned backlog, final reports, TAT, addendum rate, peer review status.
- Co Modality/Room Utilization Board: so ca, idle time, backlog, no-show/cancel, scan duration.
- Co Data Quality Center: duplicate accession, missing DICOM tags, missing HIS mapping, missing assigned doctor, missing procedure/service/facility.
- Co Alert Rules UI de cau hinh canh bao: SLA breach, stuck workflow, HIS fail, Orthanc unavailable, storage low, export fail, critical result pending acknowledgement.
- Co Control Threshold Center de admin cau hinh tat ca nguong kiem soat van hanh: SLA/TAT, queue, HIS, storage, export, backup, share, consultation, quality, data quality, security va performance.
- Tat ca insight/action can hien tren UI va drilldown duoc ve danh sach ca cu the.

## 2. Ly do Phase 11 can lam rieng

Truoc Phase 11, MiniPACS da co rat nhieu du lieu van hanh nhung chua gom thanh lop quan tri chat luong:

- Study status history co the tinh TAT nhung chua co dashboard theo chang.
- Statistics co KPI co ban nhung chua co command center realtime day du.
- Audit/HIS/Export/Share/Incident logs co nhieu tin hieu nhung chua hop nhat thanh alert/action.
- Report final/addendum co the dung de do chat luong nhung chua co peer review/discrepancy.
- Workload bac si va may chup co du lieu assignment/node/facility nhung chua thanh board dieu phoi.

Phase 11 khong phai "them bieu do cho dep"; no phai giup dieu phoi vien/truong khoa/admin thay ca dang tre, ca nguy co, loi du lieu, va hanh dong tiep theo.

## 3. Dieu kien tien quyet

Chi nen bat dau Phase 11 khi:

- Phase 1 workflow status/report/archive da on dinh.
- Phase 2/7.5 HIS status/log da co.
- Phase 3 catalogs/facility/machine/permission da co data.
- Phase 3.5 operational UI da hien assigned doctor, procedure, HIS, workflow fields.
- Phase 6 Non-DICOM co status/media/report workflow.
- Phase 8 export/backup/retention/destructive co job/audit.
- Phase 9 ops health/security/deployment da co.
- Phase 10 incident/change/release/UAT da co de tiep nhan issue va change.

Doc truoc:

- `docs/IMAGING_COMMAND_CENTER_STATISTICS_PLAN.md`
- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_WORKFLOW_STATUS_POLICY.md`
- `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
- `docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md`
- `docs/VRPACS_PHASE3_5_OPERATIONAL_UI_VISIBILITY_PLAN.md`
- `docs/VRPACS_PHASE10_RELEASE_UAT_GO_LIVE_OPERATIONS_PLAN.md`
- `dashboard/prisma/schema.prisma`
- `dashboard/app/statistics/**`
- `dashboard/app/actions.ts`
- `dashboard/lib/studyStatus.ts`
- `dashboard/lib/workflowService.ts`
- `dashboard/lib/permissions.ts`

## 4. Khong nam trong Phase 11

Khong lam:

- Khong lam AI diagnosis hoac tu dong ket luan.
- Khong thay the bac si peer review bang scoring tu dong.
- Khong tu dong phat thong bao SMS/email production neu chua co provider va consent policy.
- Khong tinh dose monitoring production neu chua co DICOM RDSR/tag policy duoc duyet.
- Khong thay doi workflow report final/unfinalize neu khong co Change Request.
- Khong show PHI tren dashboard aggregate neu khong can drilldown.
- Khong tao KPI de danh gia ca nhan ngoai pham vi da duyet voi khach hang.

## 5. Nguyen tac UI visibility bat buoc

Moi chi so/alert phai co:

- UI summary.
- Drilldown ve danh sach ca/job/log.
- Time range filter.
- Facility/machine/modality/doctor filter neu co data.
- Definition tooltip: chi so tinh nhu the nao.
- Empty/fallback state neu thieu data Phase 3.
- Permission gate tren UI va server.
- Audit neu action thay doi clinical/status/alert config.

Khong co metric "backend-only".

## 6. Permission contract de xuat

Them permission moi:

| Permission | Muc dich |
| --- | --- |
| `commandCenter.read` | Xem Imaging Command Center |
| `quality.read` | Xem Quality & Safety Center |
| `quality.manage` | Cau hinh quality workflow/threshold |
| `quality.peerReview` | Tao/cap nhat peer review |
| `quality.criticalResult` | Tao/cap nhat/ack critical result |
| `quality.qc` | Tao/cap nhat QC reject/re-scan |
| `analytics.read` | Xem analytics tong hop |
| `analytics.doctor` | Xem doctor workload/performance chi tiet |
| `analytics.export` | Export bao cao thong ke da scrub |
| `alerts.read` | Xem alert rules/events |
| `alerts.manage` | Tao/sua alert rules |
| `alerts.ack` | Acknowledge/resolve alert |
| `thresholds.read` | Xem tat ca nguong cau hinh kiem soat |
| `thresholds.manage` | Tao/sua/bat tat nguong kiem soat |
| `dataQuality.read` | Xem data quality issues |
| `dataQuality.manage` | Resolve/suppress data quality issue |

Role de xuat:

- `ADMIN`: tat ca.
- `DOCTOR`: `commandCenter.read`, `quality.read`, `quality.peerReview`, `quality.criticalResult`, `analytics.read`, co the `analytics.doctor` cho chinh minh.
- `TECHNICIAN`: `commandCenter.read`, `quality.qc`, `dataQuality.read`, `alerts.ack` mot so nhom.
- `RECEPTION`: `commandCenter.read` han che, `alerts.read` lien quan delivery/worklist, `dataQuality.read` han che.

## 7. Route/UI de xuat

### 7.1 `/command-center`

Imaging Command Center.

Widgets:

- Today total.
- Waiting scan.
- Waiting PACS receive.
- Waiting read.
- Reading.
- Pending approval.
- Finalized.
- Delivered.
- SLA breach.
- Stuck workflow.
- HIS failed.
- Critical result pending ack.

Tables:

- Live queue by priority/waiting time.
- Stuck workflow.
- SLA breach.
- Doctor backlog.
- Machine backlog.
- Active alerts.

Required behavior:

- Auto refresh 15-30 seconds.
- Click KPI -> filtered case list.
- No PHI-heavy display unless user opens drilldown and has permission.

### 7.2 `/statistics/sla`

SLA/TAT Analytics.

Views:

- TAT by workflow stage.
- P50/P90/P95/average.
- By modality.
- By priority.
- By doctor.
- By machine/facility.
- Trend by day/week/month.

Workflow stages:

- Ordered -> checked-in.
- Checked-in -> scan started.
- Scan started -> scan ended.
- Scan ended -> PACS received.
- PACS received -> first opened/read.
- First opened/read -> finalized.
- Finalized -> delivered.

### 7.3 `/statistics/workload`

Doctor Workload Board.

Views:

- Assigned backlog by doctor.
- Final reports count.
- Draft/reading count.
- Pending approval count.
- Average/P90 report TAT.
- Addendum/unfinalize rate.
- Peer review pending/complete.

Rules:

- Doctor sees own detail by default.
- Admin/head role can see all if `analytics.doctor`.

### 7.4 `/statistics/modalities`

Modality/Room Utilization Board.

Views:

- Case volume by DICOM node/machine/facility/modality.
- Hourly utilization.
- Idle time estimate.
- Cancel/no-show.
- Average scan duration.
- QC reject/re-scan rate.
- Machine health link to Phase 9 DICOM conformance.

### 7.5 `/quality`

Quality & Safety Center.

Tabs:

- Critical results.
- Peer review.
- Report addendum/amendment.
- QC/reject/re-scan.
- Data quality.
- Quality dashboard.

### 7.6 `/quality/critical-results`

Critical Result Tracking.

Flow:

- Doctor marks result as critical from Report page or Quality page.
- Assign recipient/team.
- Require acknowledgement.
- Track time-to-ack.
- Escalation if overdue.

UI:

- Pending ack.
- Overdue.
- Acknowledged.
- Cancelled/invalid with reason.

### 7.7 `/quality/peer-review`

Peer Review / Discrepancy.

Flow:

- Select finalized report for peer review.
- Reviewer marks agreement/discrepancy category.
- Optional comment.
- Link to addendum/change request if needed.

Categories:

- `AGREE`
- `MINOR_DISCREPANCY`
- `MAJOR_DISCREPANCY`
- `CRITICAL_DISCREPANCY`
- `TECHNICAL_LIMITATION`

### 7.8 `/quality/qc`

QC Reject / Re-scan Board.

Flow:

- Technician/doctor flags study/media as QC issue.
- Reason category.
- Re-scan required yes/no.
- Resolve with note.

Reasons:

- motion
- wrong protocol
- missing series
- incomplete images
- wrong patient/order mismatch
- artifact
- non-diagnostic
- other

### 7.9 `/quality/data`

Data Quality Center.

Issues:

- Duplicate accession.
- Missing accession.
- Missing assigned doctor.
- Missing procedure/service.
- Missing facility/machine.
- Missing DICOM tag.
- HIS mismatch.
- Report final without HIS sync.
- Delivered without final report.
- Non-DICOM exam without media.

Actions:

- Resolve.
- Suppress with reason.
- Create incident.
- Create change request.
- Open affected case.

### 7.10 `/admin/alerts`

Alert Rules.

Rule types:

- SLA breach.
- Workflow stuck.
- HIS failed.
- Storage low.
- Orthanc/DICOM node failed.
- Export failed.
- Backup stale.
- Critical result pending ack.
- Data quality issue.

UI:

- Rule CRUD.
- Thresholds.
- Scope filters.
- Active/inactive.
- Last triggered.
- Event history.

### 7.11 `/admin/sla-policies`

SLA/TAT Policy Configuration dành cho admin/trưởng khoa.

Mục tiêu:

- Admin cấu hình ngưỡng SLA/TAT mà không cần sửa code.
- Mỗi ngưỡng phải áp dụng được theo scope: toàn viện, cơ sở, modality, procedure, priority, máy/phòng, hoặc bác sĩ nếu chính sách cho phép.
- Mỗi ngưỡng phải thể hiện ngay trên Command Center, SLA/TAT Analytics, Alert Rules và Study/Worklist badges.

Các loại ngưỡng cần cấu hình:

- Order -> Check-in.
- Check-in -> Scan start.
- Scan start -> Scan end.
- Scan end -> PACS received.
- PACS received -> First read/open.
- First read/open -> Finalized.
- Finalized -> Delivered.
- End-to-end TAT.
- Critical result acknowledgement deadline.
- Stuck workflow threshold.

Fields UI:

- Policy name.
- Scope: `GLOBAL | FACILITY | MODALITY | PROCEDURE | PRIORITY | MACHINE | DOCTOR`.
- Stage.
- Threshold minutes.
- Warning threshold minutes, optional.
- Breach severity.
- Active/inactive.
- Effective from/to.
- Applies to emergency/urgent/routine priority.
- Description and operational note.

Behavior:

- UI preview shows "neu policy nay bat, cac ca nao hom nay se bi warning/breach".
- Changing policy requires `quality.manage` or `alerts.manage`.
- Policy changes require audit with before/after summary.
- Old metric history is not rewritten; new policy affects future alert evaluation and current dashboard classification.
- If multiple policies match, resolver order must be deterministic: procedure > machine > modality > facility > priority > global.

### 7.12 `/admin/control-thresholds`

Control Threshold Center - man hinh tong hop tat ca nguong cau hinh de kiem soat he thong.

Ly do can tach rieng:

- `/admin/sla-policies` tap trung vao workflow SLA/TAT.
- `/admin/alerts` tap trung vao rule sinh alert.
- `/admin/control-thresholds` la noi admin/truong khoa/IT cau hinh tat ca nguong van hanh ma cac module khac se dung chung.

Tabs de xuat:

1. `SLA/TAT`
2. `Workflow Queue`
3. `HIS`
4. `PACS/Orthanc/DICOM`
5. `Storage/Backup`
6. `Export/Download`
7. `Share/Consultation`
8. `Quality/Safety`
9. `Data Quality`
10. `Performance/Ops`
11. `Security/Audit`

Nguyen tac:

- Moi nguong co `warning`, `critical`, don vi, scope, active flag, effective date.
- Moi nguong co preview impact truoc khi luu neu co the tinh tu du lieu hien tai.
- Moi thay doi nguong phai audit before/after.
- Neu nguong bi vo, he thong co the hien badge, tao alert event, hoac dua vao Command Center tuy loai nguong.
- Alert Rules co the tham chieu nguong trung tam thay vi hard-code threshold rieng.

#### Nhom nguong 1 - SLA/TAT workflow

Nguong:

- Order -> Check-in.
- Check-in -> Scan start.
- Scan start -> Scan end.
- Scan end -> PACS received.
- PACS received -> First read/open.
- First read/open -> Finalized.
- Finalized -> Delivered.
- End-to-end TAT.
- Report approval pending time.
- Report draft stale time.
- Delivery overdue after finalized.

Scope:

- global, facility, modality, procedure, priority, machine, doctor.

#### Nhom nguong 2 - Workflow queue/stuck

Nguong:

- Order da tao nhung chua check-in qua X phut/gio.
- Check-in nhung chua scan qua X phut.
- Scan started nhung khong scan ended qua X phut.
- PACS received nhung chua assign doctor qua X phut.
- Assigned doctor nhung chua first open qua X phut.
- Reading qua X phut chua save draft.
- Draft qua X gio/ngay chua final.
- Pending approval qua X gio.
- Final report chua delivered qua X gio.
- Non-DICOM exam requested nhung chua capture media qua X phut.
- Non-DICOM exam capturing qua X phut/gio chua finalize.

#### Nhom nguong 3 - HIS

Nguong:

- HIS inbound call failure rate > X% trong Y phut.
- HIS outbound result sync failed > X lan.
- HIS retry count per entity > X.
- HIS pending sync older than X phut.
- HIS Gateway last successful call older than X phut/gio.
- HIS response latency warning/critical ms.
- Conflict open older than X gio.
- Mapping missing count > X.
- Report FINAL nhung HIS result status khong SYNCED sau X phut.

#### Nhom nguong 4 - PACS/Orthanc/DICOM

Nguong:

- Orthanc unavailable > X phut.
- DICOM node C-ECHO fail X lan lien tiep.
- DICOM receive latency > X phut tu scan ended.
- Study stable timeout > X phut.
- Missing required DICOM tag count > X.
- Duplicate accession count > X.
- Study instance/series count bat thuong theo modality/procedure.
- MWL generation failed count > X.
- MWL stale file older than X phut.

#### Nhom nguong 5 - Storage/Backup

Nguong:

- Storage usage warning/critical percent.
- Free space warning/critical GB.
- Storage write test failed X lan.
- Backup last success older than X gio/ngay.
- Backup failed count > X.
- Restore drill overdue days.
- Export temp folder usage > X GB.
- Retention dry-run candidate size > X GB.
- Orphan file count > X.

#### Nhom nguong 6 - Export/Download

Nguong:

- Export job pending older than X phut.
- Export job running longer than X phut.
- Export fail rate > X%.
- Export size warning/critical GB.
- Bulk export study count max.
- Download link expiry default/max.
- Download access denied count > X.
- Anonymized export requested count > X, optional monitoring.
- Export queue length > X.

#### Nhom nguong 7 - Share/Consultation

Nguong:

- Active share links count > X.
- Share link max expiry days.
- Share access denied count > X.
- Share max access count default/max.
- Public share without password allowed/not allowed.
- Consultation requested but not accepted older than X phut/gio.
- Consultation active longer than X gio.
- Consultation message/error count > X.
- Critical consultation pending closure older than X gio.

#### Nhom nguong 8 - Quality/Safety

Nguong:

- Critical result acknowledgement deadline by severity.
- Critical result overdue count > X.
- Peer review pending older than X ngay.
- Major discrepancy rate > X%.
- Addendum/unfinalize rate > X%.
- QC reject rate > X%.
- Re-scan required count > X.
- Report finalized without required fields count > X.
- Report finalized without assigned doctor/report doctor count > X.

#### Nhom nguong 9 - Data Quality

Nguong:

- Missing assigned doctor count > X.
- Missing procedure/service count > X.
- Missing facility/machine count > X.
- Missing accession count > X.
- Duplicate accession count > X.
- HIS mismatch count > X.
- Final report without HIS sync count > X.
- Delivered without final report count > X.
- Non-DICOM exam without media count > X.
- Viewer artifacts orphan count > X.

#### Nhom nguong 10 - Performance/Ops

Nguong:

- Study List load duration warning/critical ms.
- Worklist load duration warning/critical ms.
- Archive search duration warning/critical ms.
- Report page load duration warning/critical ms.
- Viewer context load duration warning/critical ms.
- API error rate > X%.
- Background job queue length > X.
- Health check failed item count > X.
- Build/deployment health last check older than X gio.

#### Nhom nguong 11 - Security/Audit

Nguong:

- Failed login attempts per user/IP > X.
- Admin permission changes count > X trong Y gio.
- Public share access from unknown user agents count > X.
- API auth failures > X.
- Security findings P0/P1 open older than X gio.
- Audit log missing for sensitive action count > X.
- Secret/config rotation overdue days.
- Inactive user not logged in older than X ngay, optional review.

Fields UI chung:

- Threshold group.
- Metric key.
- Display name.
- Scope type and scope value.
- Operator: `> | >= | < | <= | == | !=`.
- Warning value.
- Critical value.
- Unit: minutes, hours, days, count, percent, ms, GB.
- Evaluation window: last X minutes/hours/days.
- Cooldown minutes.
- Active/inactive.
- Effective from/to.
- Escalation behavior: badge only, alert event, incident suggestion.
- Owner group/role.
- Description and operational playbook link.

Behavior:

- Admin co the loc theo group/scope/active/severity.
- Admin co the clone policy de tao scope cu the.
- Admin co the preview impact: "voi nguong nay, hien tai co N doi tuong warning/critical".
- Command Center chi doc nguong active.
- Neu thieu data de tinh, UI hien `not measurable` thay vi tinh sai.
- Seed nen co default threshold an toan nhung khong qua gay spam.

## 8. Data model de xuat

### 8.1 `SlaPolicy`

Fields:

- `id String @id @default(uuid())`
- `name String`
- `scope String` - `GLOBAL | FACILITY | MODALITY | PROCEDURE | PRIORITY`
- `facilityId String?`
- `modality String?`
- `procedureCatalogId String?`
- `priority String?`
- `stage String` - `ORDER_TO_CHECKIN | CHECKIN_TO_SCAN | SCAN_TO_RECEIVED | RECEIVED_TO_FIRST_READ | FIRST_READ_TO_FINAL | FINAL_TO_DELIVERED | END_TO_END`
- `thresholdMinutes Int`
- `warningThresholdMinutes Int?`
- `severity String @default("MEDIUM")`
- `effectiveFrom DateTime?`
- `effectiveTo DateTime?`
- `description String? @db.Text`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.2 `ControlThresholdPolicy`

Generic threshold config for all operational control groups. `SlaPolicy` can be kept for workflow-specific resolver, but all non-SLA thresholds should use this model.

Fields:

- `id String @id @default(uuid())`
- `groupKey String` - `SLA_TAT | WORKFLOW_QUEUE | HIS | PACS_DICOM | STORAGE_BACKUP | EXPORT_DOWNLOAD | SHARE_CONSULT | QUALITY_SAFETY | DATA_QUALITY | PERFORMANCE_OPS | SECURITY_AUDIT`
- `metricKey String`
- `name String`
- `description String? @db.Text`
- `scopeType String @default("GLOBAL")` - `GLOBAL | FACILITY | MODALITY | PROCEDURE | PRIORITY | MACHINE | DOCTOR | ROLE | MODULE`
- `scopeValue String?`
- `operator String @default(">=")`
- `warningValue Float?`
- `criticalValue Float?`
- `unit String` - `minutes | hours | days | count | percent | ms | GB | boolean`
- `evaluationWindowMinutes Int?`
- `cooldownMinutes Int @default(30)`
- `escalationMode String @default("ALERT")` - `BADGE_ONLY | ALERT | INCIDENT_SUGGESTION | INCIDENT_AUTO_DRAFT`
- `ownerRole String?`
- `playbookUrl String?`
- `isActive Boolean @default(true)`
- `effectiveFrom DateTime?`
- `effectiveTo DateTime?`
- `createdByUserId String?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Indexes:

- `groupKey`
- `metricKey`
- `scopeType, scopeValue`
- `isActive`

### 8.3 `ThresholdEvaluationResult`

Optional history for threshold evaluation, useful for audit/debug and Command Center trend.

Fields:

- `id String @id @default(uuid())`
- `policyId String?`
- `metricKey String`
- `groupKey String`
- `status String` - `OK | WARNING | CRITICAL | NOT_MEASURABLE`
- `actualValue Float?`
- `thresholdValue Float?`
- `unit String?`
- `entityType String?`
- `entityId String?`
- `studyInstanceUid String?`
- `message String? @db.Text`
- `metadataJson String? @db.Text`
- `evaluatedAt DateTime @default(now())`

Indexes:

- `policyId`
- `metricKey`
- `status`
- `evaluatedAt`

### 8.4 `QualityEvent`

Generic quality event for report/study/media issues.

Fields:

- `id String @id @default(uuid())`
- `eventType String` - `CRITICAL_RESULT | PEER_REVIEW | QC_REJECT | DATA_QUALITY | ADDENDUM_REVIEW`
- `status String` - `OPEN | ACKNOWLEDGED | RESOLVED | CANCELLED`
- `severity String` - `LOW | MEDIUM | HIGH | CRITICAL`
- `studyInstanceUid String?`
- `reportId String?`
- `worklistOrderId String?`
- `nonDicomExamId String?`
- `mediaId String?`
- `assignedToUserId String?`
- `createdByUserId String?`
- `acknowledgedByUserId String?`
- `resolvedByUserId String?`
- `reasonCode String?`
- `description String? @db.Text`
- `metadataJson String? @db.Text`
- `dueAt DateTime?`
- `acknowledgedAt DateTime?`
- `resolvedAt DateTime?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.5 `PeerReview`

Fields:

- `id String @id @default(uuid())`
- `reportId String`
- `studyInstanceUid String`
- `reviewerUserId String`
- `originalDoctorId String?`
- `status String` - `PENDING | COMPLETED | CANCELLED`
- `result String?` - `AGREE | MINOR_DISCREPANCY | MAJOR_DISCREPANCY | CRITICAL_DISCREPANCY | TECHNICAL_LIMITATION`
- `comment String? @db.Text`
- `reviewedAt DateTime?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.6 `CriticalResult`

Fields:

- `id String @id @default(uuid())`
- `reportId String`
- `studyInstanceUid String`
- `status String` - `PENDING_ACK | ACKNOWLEDGED | ESCALATED | CANCELLED`
- `severity String`
- `message String @db.Text`
- `recipientName String?`
- `recipientContact String?`
- `assignedToUserId String?`
- `createdByUserId String`
- `acknowledgedByUserId String?`
- `acknowledgedAt DateTime?`
- `dueAt DateTime?`
- `escalatedAt DateTime?`
- `cancelReason String? @db.Text`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.7 `QcIssue`

Fields:

- `id String @id @default(uuid())`
- `studyInstanceUid String?`
- `nonDicomExamId String?`
- `mediaId String?`
- `dicomNodeId String?`
- `status String` - `OPEN | RESCAN_REQUESTED | RESOLVED | CANCELLED`
- `reasonCode String`
- `description String? @db.Text`
- `requiresRescan Boolean @default(false)`
- `createdByUserId String?`
- `resolvedByUserId String?`
- `resolvedAt DateTime?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.8 `DataQualityIssue`

Fields:

- `id String @id @default(uuid())`
- `issueKey String`
- `status String` - `OPEN | RESOLVED | SUPPRESSED`
- `severity String`
- `entityType String`
- `entityId String`
- `studyInstanceUid String?`
- `title String`
- `description String? @db.Text`
- `detectedAt DateTime @default(now())`
- `resolvedByUserId String?`
- `resolvedAt DateTime?`
- `suppressedUntil DateTime?`
- `metadataJson String? @db.Text`

### 8.9 `AlertRule`

Fields:

- `id String @id @default(uuid())`
- `name String`
- `ruleType String`
- `isActive Boolean @default(true)`
- `severity String`
- `scopeJson String? @db.Text`
- `conditionJson String @db.Text`
- `cooldownMinutes Int @default(30)`
- `lastTriggeredAt DateTime?`
- `createdByUserId String?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.10 `AlertEvent`

Fields:

- `id String @id @default(uuid())`
- `ruleId String?`
- `eventType String`
- `status String` - `OPEN | ACKNOWLEDGED | RESOLVED | SUPPRESSED`
- `severity String`
- `title String`
- `message String? @db.Text`
- `entityType String?`
- `entityId String?`
- `studyInstanceUid String?`
- `acknowledgedByUserId String?`
- `resolvedByUserId String?`
- `acknowledgedAt DateTime?`
- `resolvedAt DateTime?`
- `createdAt DateTime @default(now())`

### 8.11 `MetricSnapshot`

Optional cached aggregate for command center.

Fields:

- `id String @id @default(uuid())`
- `metricKey String`
- `scope String`
- `scopeId String?`
- `periodStart DateTime`
- `periodEnd DateTime`
- `valueJson String @db.Text`
- `createdAt DateTime @default(now())`

## 9. Services de xuat

### 9.1 `commandCenterService`

- Aggregate live workflow queue.
- Compute stuck workflow.
- Compute SLA breach using `SlaPolicy`.
- Return drilldown filters.
- Avoid N+1 by batch-loading doctor/node/procedure/facility names.

### 9.2 `tatAnalyticsService`

- Build workflow timestamp chain from study/order/report/status history.
- Compute average/P50/P90/P95.
- Group by modality/priority/doctor/machine/facility.
- Provide drilldown case IDs.

### 9.3 `qualityService`

- Create/update critical result, peer review, QC issue.
- Enforce reason/status transitions.
- Write audit.
- Link to incidents/change requests when needed.

### 9.4 `dataQualityService`

- Scan data quality issues.
- Deduplicate findings by issueKey/entity.
- Resolve/suppress issues.
- Provide UI drilldown.

### 9.5 `alertService`

- Evaluate alert rules.
- Create alert events with cooldown.
- Ack/resolve alerts.
- Link alert to cases/jobs/logs/incidents.

### 9.6 `controlThresholdService`

- Manage all `ControlThresholdPolicy` records.
- Resolve active threshold by group/metric/scope.
- Provide deterministic fallback: exact scope > module/facility/modality/procedure/priority > global.
- Preview impact before saving policy.
- Evaluate thresholds on demand for Command Center/Alert Rules.
- Persist optional `ThresholdEvaluationResult`.
- Never return PHI-heavy entity details unless drilldown permission allows.

### 9.7 `analyticsExportService`

- Export aggregate analytics only.
- Scrub PHI unless user has explicit permission.
- No patient name/id in filenames.

## 10. Server actions/API de xuat

Command Center:

- `getCommandCenterSummaryAction(filters)`
- `getLiveQueueAction(filters)`
- `getStuckWorkflowAction(filters)`
- `getSlaBreachesAction(filters)`

Analytics:

- `getTatAnalyticsAction(filters)`
- `getDoctorWorkloadAction(filters)`
- `getModalityUtilizationAction(filters)`
- `exportAnalyticsAction(filters)`

Quality:

- `createCriticalResultAction(payload)`
- `ackCriticalResultAction(id, payload)`
- `cancelCriticalResultAction(id, reason)`
- `createPeerReviewAction(payload)`
- `completePeerReviewAction(id, payload)`
- `createQcIssueAction(payload)`
- `resolveQcIssueAction(id, payload)`

Data Quality:

- `runDataQualityScanAction(filters)`
- `getDataQualityIssuesAction(filters)`
- `resolveDataQualityIssueAction(id, payload)`
- `suppressDataQualityIssueAction(id, payload)`

Alerts:

- `getSlaPoliciesAction(filters)`
- `saveSlaPolicyAction(payload)`
- `toggleSlaPolicyAction(id, isActive)`
- `previewSlaPolicyImpactAction(payload)`
- `getControlThresholdPoliciesAction(filters)`
- `saveControlThresholdPolicyAction(payload)`
- `cloneControlThresholdPolicyAction(id, overrides)`
- `toggleControlThresholdPolicyAction(id, isActive)`
- `previewControlThresholdImpactAction(payload)`
- `evaluateControlThresholdsAction(filters)`
- `getAlertRulesAction()`
- `saveAlertRuleAction(payload)`
- `getAlertEventsAction(filters)`
- `ackAlertEventAction(id)`
- `resolveAlertEventAction(id, payload)`

## 11. UI integration bat buoc

### Sidebar

Them:

- `Command Center` -> `/command-center`
- `Chat luong` -> `/quality`
- `Canh bao` -> `/admin/alerts`
- `Nguong kiem soat` -> `/admin/control-thresholds`

Cap nhat:

- `Thong ke` co submenu: Overview, SLA/TAT, Workload, Modality.

### Existing pages

- Study List `/`: show SLA breach badge, data quality warning, critical result flag if relevant.
- Worklist `/worklist`: show overdue/stuck reason and QC/data quality warning.
- Report `/report/[studyInstanceUid]`: add actions "Mark critical result", "Request peer review", show quality timeline.
- Archive `/archive`: show addendum rate marker, peer review status, critical result ack status.
- Statistics `/statistics`: link to Command Center, SLA, Workload, Modality pages.
- Support `/support/incidents`: create incident from quality/data alert.

## 12. Alert rule MVP

Default rules:

- Study waiting read > configured threshold.
- Final report not delivered > configured threshold.
- HIS result sync failed.
- Critical result not acknowledged by due time.
- Orthanc unreachable.
- Storage usage over threshold.
- Export job failed.
- Data quality P1 issue detected.
- Non-DICOM exam finalized without media.

Rules must be editable from UI.

## 13. KPI definitions

### End-to-end TAT

From order created or check-in to report finalized. Use clear label depending available timestamp.

### Reading TAT

From PACS received/ready-to-read to final report.

### Delivery TAT

From final report to delivered.

### Addendum rate

Final reports with addendum/unfinalize divided by final reports in period.

### Peer discrepancy rate

Completed peer reviews with discrepancy divided by completed peer reviews.

### QC reject rate

QC issues requiring re-scan divided by studies/exams in period.

### Utilization

MVP estimate from scan duration or cases per scheduled window. If scan timestamps missing, label as `estimated`.

## 14. PR breakdown

### PR 11.1 - Schema, permissions, navigation

Scope:

- Add permissions.
- Add models for SLA, quality, peer review, critical result, QC, data quality, alerts, metric snapshots.
- Add generic control threshold models and default seed policies.
- Add sidebar/routes shell.

Done when:

- Admin/authorized users see pages.
- Unauthorized users rejected server-side.

### PR 11.2 - Command Center MVP

Scope:

- Live queue.
- SLA breach.
- Stuck workflow.
- Doctor/machine backlog summary.
- Auto refresh.

Done when:

- Coordinator can click from KPI to affected studies.

### PR 11.3 - SLA/TAT Analytics

Scope:

- SLA/TAT policy admin UI.
- Control Threshold Center `/admin/control-thresholds`.
- Threshold groups for SLA/TAT, workflow queue, HIS, PACS/DICOM, storage/backup, export/download, share/consultation, quality/safety, data quality, performance/ops, security/audit.
- SLA policy resolver and deterministic fallback order.
- Preview impact before saving policy.
- Stage timestamp extraction.
- P50/P90/P95/average.
- Filters by date/modality/doctor/machine/facility.
- Drilldown.

Done when:

- TAT stages are visible with honest fallback for missing timestamps.
- Admin can configure thresholds from UI and Command Center uses them.
- Admin can configure non-SLA control thresholds from UI and alert evaluation uses them.

### PR 11.4 - Doctor workload and modality utilization

Scope:

- Doctor workload board.
- Modality/machine/facility utilization.
- Backlog and throughput.

Done when:

- Head/admin can see backlog by doctor and machine without manual SQL.

### PR 11.5 - Critical result workflow

Scope:

- Mark critical result from report.
- Ack/cancel/escalate.
- Quality page queue.
- Alert rule integration.

Done when:

- Critical result pending acknowledgement is visible and audited.

### PR 11.6 - Peer review and discrepancy

Scope:

- Peer review creation/completion.
- Discrepancy categories.
- Report/archive quality status.

Done when:

- A final report can be peer reviewed and tracked.

### PR 11.7 - QC reject/re-scan

Scope:

- QC issue creation from study/viewer/non-DICOM if applicable.
- Re-scan required flag.
- Resolve/cancel.
- Modality QC metrics.

Done when:

- QC issue appears in quality board and affects metrics.

### PR 11.8 - Data Quality Center

Scope:

- Data quality scans.
- Duplicate/missing/mismatch detection.
- Resolve/suppress/create incident.

Done when:

- Admin can find and fix operational data gaps from UI.

### PR 11.9 - Alert Rules

Scope:

- Rule CRUD.
- Rule can reference `ControlThresholdPolicy` instead of hard-coded value.
- Event generation.
- Ack/resolve.
- Link to affected entity.

Done when:

- Default alerts work and can be configured without code.

### PR 11.10 - QA, docs, acceptance

Scope:

- Build/typecheck.
- Manual QA scenarios.
- Update docs/backlog.

Done when:

- Phase 11 acceptance criteria pass.

## 15. Manual QA scenarios

### SCN-11.1 Command Center live queue

Expected:

- Dashboard shows current queues.
- KPI click filters affected studies.
- Auto refresh does not reset filters unexpectedly.

### SCN-11.2 SLA breach

Expected:

- Case over threshold appears in SLA breach.
- Detail shows which stage breached.

### SCN-11.3 TAT analytics

Expected:

- TAT page shows average/P50/P90/P95.
- Missing timestamp is labeled, not silently wrong.

### SCN-11.3b SLA/TAT policy configuration

Expected:

- Admin opens `/admin/sla-policies`.
- Admin creates policy for modality CT, priority URGENT, stage RECEIVED_TO_FIRST_READ.
- Preview shows affected cases before saving.
- After saving, Command Center and SLA breach list use the new threshold.
- Policy change is audited with before/after summary.

### SCN-11.3c Control threshold configuration

Expected:

- Admin opens `/admin/control-thresholds`.
- Admin creates threshold for HIS outbound failed count > 3 in 30 minutes.
- Admin creates threshold for storage free space critical < 50 GB.
- Preview shows current affected items if measurable.
- Alert Rules can reference the threshold policy.
- Command Center/Alert Center shows warning/critical when threshold is breached.
- Direct API call by non-admin is rejected.

### SCN-11.4 Doctor workload

Expected:

- Assigned doctor backlog appears.
- Doctor without all-permission only sees allowed scope.

### SCN-11.5 Modality utilization

Expected:

- Machine/facility filters work.
- If scan timestamps missing, utilization is labeled estimated.

### SCN-11.6 Critical result

Expected:

- Doctor marks final report critical.
- Pending ack appears in Quality Center.
- Ack records actor/time.

### SCN-11.7 Peer review

Expected:

- Reviewer completes review.
- Discrepancy appears in report/archive quality status.

### SCN-11.8 QC issue

Expected:

- Technician creates QC issue.
- Re-scan flag appears.
- Resolve removes open alert but keeps history.

### SCN-11.9 Data quality scan

Expected:

- Duplicate/missing fields are detected.
- Resolve/suppress requires permission and reason.

### SCN-11.10 Alert rule

Expected:

- Admin creates SLA alert rule.
- Event triggers once and respects cooldown.
- User can acknowledge/resolve.

## 16. Acceptance criteria

Phase 11 chi duoc xem la xong khi:

1. Command Center co realtime queue, stuck workflow, SLA breach, active alerts.
2. KPI drilldown duoc ve case/job/log cu the.
3. Admin can configure SLA/TAT thresholds from UI, with preview and audit.
4. Admin can configure all operational control thresholds from UI: queue, HIS, PACS/DICOM, storage/backup, export/download, share/consultation, quality, data quality, performance, security.
5. SLA/TAT Analytics co stage-based metrics va percentile.
6. Doctor workload va modality utilization co filters va fallback honest.
7. Critical result workflow co create/ack/cancel/escalate va audit.
8. Peer review/discrepancy workflow co UI va report/archive visibility.
9. QC reject/re-scan workflow co UI va metrics.
10. Data Quality Center detect/resolve/suppress duoc issue.
11. Alert Rules co CRUD, event history, ack/resolve.
12. Alert Rules can reference central control thresholds.
13. All new actions have server-side permission.
14. UI hides actions backend would reject.
15. No PHI-heavy aggregate/export by default.
16. Build/typecheck pass.
17. Manual QA scenarios documented.

## 17. Rui ro va guardrails

| Rui ro | Giam thieu |
| --- | --- |
| KPI sai do thieu timestamp | Label missing/estimated, show data completeness |
| Dashboard qua tai UI | Drilldown, tabs, compact command center, no giant cards |
| Dung KPI ca nhan sai muc dich | Permission/scope, glossary, governance note |
| Critical result alert gia | Require explicit create/ack workflow, audit |
| Peer review gay conflict workflow | Link to incident/change/addendum but do not auto-edit report |
| Alert spam | Cooldown, severity, suppress/resolve |
| Data quality scan tao qua nhieu issue | Deduplicate by issueKey/entity, filters, severity |
| PHI exposure in exports | Aggregate-only exports, PHI-safe filenames |

## 18. Prompt giao cho AI coding agent

```text
Ban la coding agent trong repo MiniPACS. Hay thuc hien Phase 11 - Quality, Analytics, Clinical Governance, And Command Center theo file:

docs/VRPACS_PHASE11_QUALITY_ANALYTICS_CLINICAL_GOVERNANCE_PLAN.md

Muc tieu:

- Tao Command Center realtime cho queue, SLA breach, stuck workflow, workload, modality utilization va alerts.
- Tao SLA/TAT Analytics theo tung chang workflow.
- Tao man hinh admin cau hinh nguong SLA/TAT, co preview impact va audit.
- Tao Control Threshold Center de cau hinh tat ca nguong kiem soat van hanh: workflow queue, HIS, PACS/DICOM, storage/backup, export/download, share/consultation, quality/safety, data quality, performance/ops, security/audit.
- Tao Quality & Safety Center gom Critical Result, Peer Review, QC Reject/Re-scan, Data Quality.
- Tao Alert Rules UI va event history.
- Moi metric/action/alert lam duoc phai hien tren UI va drilldown duoc.

Doc truoc:

- docs/IMAGING_COMMAND_CENTER_STATISTICS_PLAN.md
- docs/VRPACS_PHASE11_QUALITY_ANALYTICS_CLINICAL_GOVERNANCE_PLAN.md
- docs/VRPACS_WORKFLOW_STATUS_POLICY.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md
- dashboard/prisma/schema.prisma
- dashboard/app/statistics/**
- dashboard/app/actions.ts
- dashboard/lib/studyStatus.ts
- dashboard/lib/workflowService.ts
- dashboard/lib/permissions.ts

Rang buoc:

- Khong revert thay doi cua user.
- Khong tao AI diagnosis.
- Khong auto-edit final report tu peer review.
- Khong show PHI-heavy aggregate/export by default.
- Neu timestamp thieu, label estimated/missing ro rang.
- Server-side permission bat buoc.
- UI khong hien action neu backend se reject.
- Alert rules phai co cooldown de tranh spam.
- Tat ca nguong kiem soat phai cau hinh duoc tu UI, co default seed, preview impact va audit.
- Build/typecheck phai pass truoc khi bao xong.

Ket qua cuoi:

- Files changed list.
- Behavior/UI changed summary.
- Migration/config notes.
- Tests/build da chay.
- Manual QA scenarios.
- Metrics/alerts/quality UI surfaces da them.
- Cac nhom nguong control da cau hinh duoc va UI dung chung o dau.
- Rui ro con lai neu co.
```
