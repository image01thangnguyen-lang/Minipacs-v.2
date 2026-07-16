# Phase 6 — Hardening, UAT, Rollout và Vận hành

Ngày lập: 2026-07-16  
Phụ thuộc: Phase 0–5 feature-complete và có evidence  
Nguyên tắc: không thêm feature mới trong phase release

## 1. Mục tiêu và traceability

Chứng minh hệ thống an toàn, ổn định và dùng được trong môi trường lâm sàng; rollout theo cohort với kill switch và rollback không mất durable data. Lập matrix `master requirement → risk → implementation → test → evidence → owner signoff`; mọi ô thiếu là `NO-GO` hoặc risk acceptance có thẩm quyền.

## 2. Các wave bắt buộc

### P6.1 — Security/privacy hardening

- IDOR/cross-scope mọi room/message/artifact/minutes/export/retry endpoint; explicit deny và session expiry.
- CSRF, exact origin/CORS, WebSocket hijacking, ticket/password replay/brute force, privilege escalation và injection.
- Dependency/container/SBOM/secrets/config/TLS review; pentest theo risk policy.
- Automated scan log/metric/traces/client URL/storage cho PHI/token/password/raw UID.
- Zero critical/high authorization/PHI unresolved; exception phải có CISO/clinical owner approval theo policy.

### P6.2 — Reliability/DR/chaos

- Gateway/Redis/DB/HIS/Orthanc outage, packet loss/latency, multi-tab, clock skew, slow consumer và reconnect storm.
- Rolling deploy nhiều gateway version, stale room epoch/lease, Redis failover và DB pool exhaustion.
- Backup/restore DB/outbox, Redis-loss behavior, RPO/RTO và reconciliation sau restore.
- Xác minh end/lock/revoke vẫn fail closed khi dependency degraded.

### P6.3 — Performance/capacity

- Dataset/concurrency/modality/network đại diện pilot; load, stress và soak đủ dài theo ADR.
- P50/P95/P99 join/chat/artifact/sync/autosave/finalize/HIS queue; error/reconnect/resync.
- Query plans/index/cardinality/retention/DB growth; gateway fan-out/bandwidth/queue; OHIF FPS/memory.
- Capacity model, headroom, scaling trigger và stop threshold; không benchmark localhost rồi suy ra production.

### P6.4 — Clinical UAT và accessibility

- Vai trò host/presenter/consultant/observer; ba access mode; remove/lock/end; network degradation.
- CT/MR/CR hoặc modality được duyệt, multi-series/frame, calibration, 1x1/1x2/2x2, presenter handoff và accepted artifact.
- Minutes conflict/sign/quorum/finalize/amendment/HIS queued-failed-reconcile.
- Dark diagnostic monitors, keyboard/focus/screen-reader smoke, non-color status, reduced motion; 1280/1440/1920/2560 và browser matrix.
- Chỉ dùng synthetic/de-identified fixture; con người ký UAT, AI không được tự ghi pass.

### P6.5 — Observability/on-call/training

- Dashboard SLO: active rooms/connections, join denial class, lag/reconnect/resync, chat/artifact latency, OHIF client health, outbox age/failure, DB/Redis saturation.
- Alert có threshold/window/runbook/owner; không cardinality/PHI.
- Runbook incident, revoke, gateway/Redis failover, HIS dead-letter/reconcile, backup/restore và rollback.
- Tài liệu/đào tạo tiếng Việt theo vai trò, support channel, escalation và feedback triage.

### P6.6 — Flags, pilot và progressive rollout

Flags server-evaluated có dependency:

```text
liveConsultationCore → Realtime → ViewerSync
                           └────→ Artifacts → Minutes → His
```

Rings: `dev/internal → QA → clinical super-users → một khoa/cơ sở pilot → 10% → 25% → 50% → 100%`. Mỗi ring có owner, cohort, start/end, minimum soak, baseline, SLO/error/security thresholds, support coverage và quyết định `GO/HOLD/ROLLBACK`. Không tăng cohort khi Sev1/2 mở, telemetry thiếu hoặc outbox chưa reconcile.

## 3. Rollback drill

- Tắt từng flag độc lập và theo dependency; viewport fallback independent, artifact/minutes read-only, HIS stop-send.
- Drain gateway/worker, rollback app/container, xác minh schema additive còn tương thích.
- Kiểm tra không mất/duplicate room, message, artifact, signature, minutes, outbox; audit vẫn truy xuất được.
- Diễn tập restore và reconciliation; ghi timeline, RTO thực, discrepancy và corrective action.
- Legacy polling/status chỉ xóa ở closure PR sau parity + soak + rollback window; không xóa trong pilot.

## 4. Release gates

- [ ] Traceability 100% requirement/risk critical có test/evidence/owner.
- [ ] Zero known critical/high auth/PHI issue; security signoff.
- [ ] Load/soak/query/chaos đạt SLO và capacity headroom đã chốt.
- [ ] Clinical owner ký UAT; HIS owner ký mapping/reconciliation; Operations ký runbook/on-call.
- [ ] Accessibility/browser/dark-room visual gates đạt hoặc exception được duyệt.
- [ ] Backup/restore và rollback drill đạt, không mất durable data.
- [ ] Từng rollout ring đủ soak và GO; known issues có severity/owner/deadline.
- [ ] Dashboard, OHIF, gateway, worker builds/typecheck/tests/Prisma/compose/diff-check đều pass từ clean build.

## 5. Stop/rollback conditions

Rollback ngay khi có cross-scope/PHI leak, signature sai revision/identity, duplicate/mất clinical artifact/minutes, HIS logical duplicate vượt reconciliation, sustained SLO breach, reconnect storm gây saturation hoặc không quan sát được trạng thái thật. Tạm dừng cohort với Sev1/2, dead-letter age vượt SLO hoặc owner coverage thiếu.

## 6. Final handoff và closure

Release package phải ghi version/commit/image digest, schema/contract versions, flags/cohort, config/secrets owners, dashboards/alerts, runbooks, support/on-call, backup/RPO/RTO, UAT/security/HIS signoff, known risks và rollback deadline. Lập post-release review; decommission legacy bằng kế hoạch riêng sau soak, data reconciliation và approval, không coi rollout 100% là quyền tự động xóa compatibility path.

## 7. Prompt bàn giao cho AI triển khai

```text
Bạn là AI release/hardening agent phụ trách Phase 6 của Live Consultation trong Minipacs-v.2. Đây không phải phase thêm feature.

Đọc master plan, README, toàn bộ kế hoạch/evidence/ADR Phase 0–5, release-control/runbook/SLO hiện có và tài liệu Phase 6 này. Xác minh các phase trước feature-complete; inventory commit/image/schema/contract/flag versions, môi trường, owners và open risks. Kiểm tra worktree, không xóa compatibility path hoặc sửa feature ngoài hardening defect được phê duyệt.

Lập traceability requirement→risk→implementation→test→evidence→owner; thực hiện security/privacy regression, chaos/DR/backup-restore, load/stress/soak/capacity, browser/a11y/dark-room checks và rollout/rollback drill. Chuẩn bị synthetic clinical UAT fixtures và hướng dẫn nhưng không tự giả mạo human UAT/signoff. Hoàn thiện SLO dashboards/alerts không PHI/cardinality cao, on-call/runbooks/training, server-side dependency flags, cohort rings và stop thresholds. Mọi lỗi critical/high auth/PHI là stop-ship; durable loss/duplicate, sai chữ ký hoặc HIS unreconciled phải rollback.

Chạy clean builds, typecheck/tests, Prisma/migration validation, compose/gateway/worker/OHIF checks và git diff --check; ghi command, commit, environment, duration, exit code và scrubbed artifacts. Benchmark phải nêu dataset/topology và không suy diễn localhost thành production. Diễn tập tắt từng flag, drain, app rollback, DB restore và reconciliation; ghi RTO/RPO thực tế.

Đầu ra cuối gồm release package, traceability matrix, test/security/performance/chaos/rollback evidence, UAT/signoff status thật, known issues có owner/deadline, từng ring decision và GO/HOLD/NO-GO. Không rollout tăng cohort khi telemetry thiếu, Sev1/2 mở, owner coverage thiếu hoặc gate chưa đạt; không decommission legacy trong phase này nếu chưa có closure plan và soak approval riêng.
```
