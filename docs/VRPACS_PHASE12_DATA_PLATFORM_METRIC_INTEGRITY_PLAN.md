# VRPACS Phase 12 - Data Platform And Metric Integrity Plan

Updated: 2026-07-13  
Status: planned; implementation must not cut over before Phase 11 acceptance

## 1. Objective

Create one reproducible operational-data truth for quality, safety, workflow, integration, and performance metrics. Replace expensive request-time aggregation with durable events and versioned snapshots without changing clinical transactional semantics.

## 2. Scope

- Metric registry: owner, version, formula, unit, dimensions, source timestamps, exclusions, timezone, freshness, completeness, and PHI class.
- Transactional outbox and canonical event envelope.
- Idempotent consumers with lease/fencing, retry, dead-letter, replay, lag, and run history.
- Versioned snapshots/materialized aggregates for TAT, queues, throughput, utilization, quality, alerts, and integration health.
- Bounded backfill/rebuild with checkpoint, dry-run, cancellation, throttling, and reconciliation.
- Data Operations UI for freshness, lineage, mismatch, late data, failed partitions, and controlled rebuild.
- Governed aggregate export and scheduled delivery with runtime authorization recheck.
- Partition/index/retention and capacity policy.

Out of scope: diagnostic AI, ungoverned data lake, free-form PHI exports, replacing the clinical source-of-record.

## 3. Architecture Contracts

Canonical event fields:

- `eventId`, `eventType`, `eventVersion`, `occurredAt`, `recordedAt`.
- `correlationId`, `causationId`, `idempotencyKey`.
- actor/service, organization/facility, entity type/ID, report revision where applicable.
- PHI classification and a minimized payload or protected reference.

Snapshot fields:

- metric/version, scope/dimensions, source window, watermark, computed time.
- count/value/unit, missing/estimated/late counts, completeness, stale/rebuild state.
- lineage/run ID and reconciliation result.

## 4. PR Plan

### PR 12.1 - Metric And Event Contract Registry

- Freeze metric naming, units, formulas, dimensions, timezone and compatibility rules.
- Add registry validation and contract tests.
- Map every Phase 11 KPI to an owner and source.

### PR 12.2 - Transactional Outbox And Worker Runtime

- Persist business mutation and outbox atomically.
- Add producer/consumer libraries, lease fencing, idempotency, retry/dead-letter and operator visibility.
- Verify no PHI-heavy generic logs.

### PR 12.3 - Snapshot And Percentile Pipeline

- Add versioned aggregate tables and bounded jobs.
- Compute TAT percentiles, queue/workload/throughput/utilization and quality aggregates.
- Run shadow comparison against Phase 11 results.

### PR 12.4 - Backfill, Late Data, Reconciliation And Lineage

- Add dry-run/checkpoint/cancel/rebuild.
- Define late-event window and stale snapshot behavior.
- Add source-to-snapshot reconciliation and mismatch triage.

### PR 12.5 - Data Operations UI And Governed Exports

- Add freshness, run, lag, failure, lineage and rebuild UI.
- Add scheduled aggregate reports with scoped recipient, expiry, audit and runtime access recheck.

### PR 12.6 - Retention, Performance And Cutover

- Add partitions/indexes/retention and legal-hold exclusions.
- Load/soak/backfill qualification.
- Dual-read -> cohort cutover -> legacy retirement with rollback window.

## 5. Security And Data Rules

- Scope all snapshot, count, drilldown, export and job-control paths.
- Never use patient name/accession as metric labels, event keys or filenames.
- Raw clinical payload stays in protected domain storage; events contain minimized values/references.
- Replays and rebuilds require explicit permission, reason, bounded scope and audit.
- Scheduled recipients are authorized again at execution, not only at schedule creation.

## 6. Test Matrix

- Duplicate, replayed, late, out-of-order, missing and malformed events.
- Worker crash, lease expiry, competing workers, retry and dead-letter replay.
- Timezone/day boundary and percentile fixtures.
- Old/new calculation reconciliation and drilldown denominator checks.
- High-volume backfill while transactional workflows remain within SLO.
- Wrong facility, revoked grant, guessed job/snapshot/export ID.
- Retention with legal/clinical hold and partial failure recovery.

## 7. Acceptance Criteria

1. Every production metric is reproducible from registry version, source window and lineage.
2. Replay cannot double count.
3. Late data has deterministic correction and stale/rebuild behavior.
4. Shadow comparison is within signed tolerance before cutover.
5. Backfill cannot starve clinical traffic.
6. Operators can detect and recover failed work safely.
7. All aggregate/drilldown/export results obey facility/object scope.
8. Retention preserves required audit, clinical and legal-hold records.

## 8. Rollout And Rollback

Additive schema -> producer shadow -> consumer shadow -> dual calculation -> internal read -> pilot -> progressive cutover. Rollback disables consumers/new reads, quarantines work, restores old calculation path, and reconciles affected windows; do not drop additive schema during the rollback window.

## 9. Deliverables

- Versioned metric/event dictionaries.
- Migrations, worker/runtime, snapshots, Data Operations UI, exports.
- SLO dashboard and runbooks for lag, dead-letter, rebuild and reconciliation.
- `VRPACS_PHASE12_ACCEPTANCE_EVIDENCE.md` completed and signed.

## 10. Prompt bàn giao cho AI coding agent

Sao chép nguyên khối prompt dưới đây để giao Phase 12 cho AI/coding agent khác. Phase này phải được triển khai theo từng PR nhỏ; không được đánh dấu hoàn tất chỉ bằng cách viết tài liệu hoặc tạo UI placeholder.

```text
Bạn là coding agent làm việc trong repository MiniPACS/VRPACS tại thư mục gốc của repo. Hãy triển khai Phase 12 - Data Platform And Metric Integrity theo tài liệu nguồn sự thật:

docs/VRPACS_PHASE12_DATA_PLATFORM_METRIC_INTEGRITY_PLAN.md

Điều kiện bắt đầu:

- Đọc trạng thái git và toàn bộ tài liệu trước khi sửa code.
- Xác minh Phase 11 đã có acceptance evidence phù hợp; nếu gate chưa đạt, chỉ được làm phần additive/shadow an toàn và phải báo rõ phần bị chặn, không tự tuyên bố cutover.
- Không revert, overwrite hoặc làm mất thay đổi đang có của người dùng/agent khác.
- Khảo sát implementation hiện hữu trước khi tạo model/service/route mới; ưu tiên mở rộng contract dùng chung thay vì tạo logic song song.

Đọc tối thiểu:

- docs/VRPACS_PHASE12_DATA_PLATFORM_METRIC_INTEGRITY_PLAN.md
- docs/VRPACS_PHASE12_ACCEPTANCE_EVIDENCE.md
- docs/VRPACS_PHASE11_COMPLETION_EVIDENCE.md
- docs/VRPACS_PHASE11_QUALITY_ANALYTICS_CLINICAL_GOVERNANCE_PLAN.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md
- docs/VRPACS_WORKFLOW_STATUS_POLICY.md nếu file tồn tại
- docs/runbooks/observability_slo.md
- dashboard/prisma/schema.prisma và toàn bộ migration hiện có
- dashboard/app/db.ts
- dashboard/lib/telemetry/**
- dashboard/lib/authz/scope/**
- dashboard/lib/commandCenterService.ts
- dashboard/lib/tatAnalyticsService.ts
- dashboard/lib/qualityService.ts
- dashboard/lib/dataQualityService.ts
- dashboard/lib/alertService.ts
- dashboard/app/command-center/**
- dashboard/app/statistics/**

Mục tiêu bắt buộc:

1. Thực hiện PR 12.1 đến 12.6 theo đúng thứ tự và giữ mỗi PR/review unit nhỏ, có test riêng.
2. Tạo metric registry có version, owner, formula, unit, dimension, timezone, freshness, completeness, PHI class và validation/contract test; map toàn bộ KPI Phase 11.
3. Tạo canonical event envelope và transactional outbox. Business mutation và outbox record phải cùng transaction; không dùng fire-and-forget làm nguồn sự thật.
4. Tạo worker runtime idempotent có lease/fencing, retry có giới hạn, dead-letter, replay có kiểm soát, lag/run history và telemetry PHI-safe.
5. Tạo snapshot/aggregate versioned cho TAT percentile, queue, throughput, utilization, quality, alert và integration health. Mọi kết quả phải có source window, watermark, completeness, stale/rebuild state và lineage.
6. Tạo backfill/rebuild bounded có dry-run, checkpoint, cancel, throttle, late-data policy và source-to-snapshot reconciliation. Backfill không được làm đói clinical traffic.
7. Tạo Data Operations UI bằng shared UI primitives hiện hữu, có freshness/lag/run/failure/lineage/mismatch và thao tác rebuild được bảo vệ server-side.
8. Tạo governed aggregate export/scheduled delivery với scope, expiry, audit và authorization recheck tại thời điểm thực thi.
9. Bổ sung index/partition/retention policy phù hợp PostgreSQL và legal/clinical hold; migration phải additive, reviewable và có rollback/runbook.
10. Chạy shadow comparison với đường tính Phase 11 trước khi đề xuất dual-read hoặc cutover; không xóa đường cũ trong rollback window.

Ràng buộc an toàn và chất lượng:

- Mọi list/count/detail/drilldown/export/job-control đều phải dùng authorization và organization/facility scope ở server; UI hiding không thay thế backend enforcement.
- Không dùng patient name, accession, report body hoặc identifier PHI làm metric label, event key, log hay filename.
- Event payload phải tối thiểu; raw clinical payload ở protected source-of-record.
- Replay/rebuild cần permission riêng, reason, bounded scope, audit và idempotency.
- Duplicate/replayed/late/out-of-order event không được double count.
- Không fabricate số liệu. Dữ liệu thiếu/ước lượng/trễ phải được biểu diễn rõ trong contract và UI.
- Không sửa clinical transactional semantics và không tự động thay đổi/finalize report.
- Không thêm dependency hoặc dịch vụ hạ tầng nếu chưa chứng minh cần thiết; nếu cần queue/cron bên ngoài, tạo adapter/config rõ ràng và fallback an toàn, không giả vờ hạ tầng đã tồn tại.
- Không chạy migration destructive hoặc prisma db push trên database thật. Tạo migration SQL có thể review; chỉ deploy khi có DATABASE_URL đúng, backup và phê duyệt.
- Dùng PagePrimitives/shared DataGrid/navigation/permission patterns hiện có; không tạo style system song song.
- Không ghi “pass”, “signed” hoặc số hiệu năng giả vào evidence. Mục chưa chạy phải ghi NOT RUN/BLOCKED cùng lý do và owner.

Kiểm thử tối thiểu:

- Contract/unit tests cho registry, event envelope, idempotency, lease fencing, retry/dead-letter và authorization.
- Integration fixtures cho duplicate, replay, late, out-of-order, malformed event, crash/lease expiry và competing workers.
- Timezone/day-boundary/percentile fixtures và reconciliation old-vs-new.
- Negative scope tests: wrong facility, revoked grant, guessed snapshot/job/export ID.
- Backfill throttle/cancel/checkpoint/restart và retention/hold tests.
- Prisma format/validate/generate với DATABASE_URL test hợp lệ.
- Từ thư mục dashboard chạy các script thực sự có trong package.json, tối thiểu: npm run check:ui-style; npm run lint; npm test; npm run build. Với PowerShell dùng dấu ';' và kiểm tra $LASTEXITCODE, không dùng '&&'.
- Ghi chính xác command, kết quả, ngày giờ và limitation vào docs/VRPACS_PHASE12_ACCEPTANCE_EVIDENCE.md.

Cách làm:

- Trước tiên lập inventory/gap list và kế hoạch file-level dựa trên code thật.
- Triển khai lần lượt từng PR; sau mỗi PR chạy test liên quan và review git diff.
- Dừng và hỏi nếu cần quyết định kiến trúc ảnh hưởng dữ liệu, hạ tầng, retention, PHI hoặc cutover mà repo/tài liệu chưa chốt.
- Chỉ kết luận Phase 12 hoàn tất khi đủ acceptance criteria và evidence có thể tái tạo; nếu chưa đủ, báo partial completion và danh sách blocker cụ thể.

Kết quả bàn giao cuối cùng phải gồm:

- Files changed, migration/config/dependency notes.
- Kiến trúc event/outbox/worker/snapshot/backfill và data-flow thực tế đã triển khai.
- Metric registry/KPI mapping và authorization-scope matrix.
- Tests/build đã chạy cùng kết quả thật.
- Manual QA/operator recovery scenarios.
- Rollout, rollback, reconciliation và retention notes.
- Known limitations, blockers, residual risks và bước tiếp theo.
- Acceptance evidence được cập nhật trung thực.
```
