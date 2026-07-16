# Phase 3 — Realtime Gateway, Presence và Chat

Ngày lập: 2026-07-16  
Phụ thuộc: Phase 0–2 `GO`, realtime ADR được duyệt  
Ngoài phạm vi: viewport/artifact sync và minutes

## 1. Mục tiêu/SLO

Thay polling bằng kênh realtime scoped, có ordering/resume/revoke cho presence, chat và system event. Mục tiêu pilot: chat fan-out P95 < 500 ms nội vùng, presence converge < 5 s, reconnect/resume < 10 s; tải tối thiểu 20 room × 10 user hoặc con số ADR hiệu chỉnh.

## 2. Kiến trúc và work packages

### P3.1 — Gateway/Redis/deploy

- Workspace/service độc lập; config validation, non-root container, health/liveness/readiness, graceful drain và bounded shutdown.
- Redis pub/sub + ephemeral lease/rate/sequence coordination; DB vẫn là durable source.
- Reverse proxy/TLS, exact origin allowlist, capacity/resource limits, secret rotation và multi-replica smoke.
- Nếu pilot in-memory: ADR bắt buộc, single replica flag/alert và production block.

### P3.2 — Handshake và room membership

- Nhận ticket qua auth frame/header phù hợp ADR, atomic consume, verify audience/epoch/policy/session.
- Load membership/allowed actions từ server boundary; gateway không tin role client.
- Subscribe revoke; remove/lock/end/password rotate/session revoke đóng socket và xóa presence.
- Mỗi connection có correlation ID scrubbed; không log ticket/raw room/study/user.

### P3.3 — Protocol reliability

- Strict versioned schemas, max frame/nesting/rate và unknown event reject.
- Monotonic room sequence cho event durable; client ack + `lastSequence`; replay bounded, gap lớn trả snapshot/`RESYNC_REQUIRED`.
- Dedupe `clientEventId`; duplicate/out-of-order không commit hoặc render lặp.
- Heartbeat/presence lease, slow-consumer policy, bounded queue/backpressure và reconnect jitter.

### P3.4 — Durable chat

- Validate/sanitize plain text, max length/rate; không HTML/attachment.
- Trong transaction: authorize lại → idempotency → persist message/event/sequence → commit; chỉ sau đó broadcast.
- Cursor pagination stable `(createdAt,id)`; optimistic UI `pending/sent/failed`, retry cùng clientEventId.
- Room terminal/locked/removed cấm send; dependency outage không báo `sent` giả.

### P3.5 — Room UI

- Participant status phân biệt invited/waiting/joined/disconnected/left/removed/declined.
- Chat history pagination, unread marker, timestamp, system events và retry accessible.
- Header hiển thị `connecting/live/degraded/reconnecting/offline`; reconnect không cướp focus.
- Ended room read-only; polling chỉ còn fallback read-only dưới flag trong rollback window.

### P3.6 — Observability

Metrics active room/connection, handshake class, reconnect/resync, fan-out/ack lag, queue/drop, Redis/DB error. Không dùng UID/room/user raw làm label. Alerts cho gateway unavailable, reconnect spike, event lag, slow consumer và Redis saturation.

## 3. Verification matrix

- Protocol unit/property tests: malformed/oversized/unknown version, duplicate/out-of-order/gap.
- Integration: ticket consume, unauthorized origin, revoke disconnect, room epoch change, session expiry.
- Chat durability: DB fault before/after commit, duplicate retry, pagination concurrent insert, sanitize/injection.
- Multi-replica Redis fan-out; gateway/Redis restart, network flap, rolling deploy, slow consumer và backpressure.
- Load/soak theo capacity; đo P50/P95/P99, error/duplicate/loss, CPU/memory/network/DB pool.
- UI visual/a11y và connection-state transitions; no PHI telemetry scan.

## 4. Acceptance và rollback

- [ ] Không mất/duplicate durable chat trong test retry/reconnect/restart.
- [ ] Revoke/lock/end/session expiry disconnect trong SLA đã chốt.
- [ ] SLO/load/soak đạt trên môi trường và dataset ghi rõ.
- [ ] Gateway/Redis outage degrade rõ, không fallback unscoped.
- [ ] Metrics/alerts/runbook và graceful rolling deploy được diễn tập.
- [ ] Flag off chuyển sang read-only fallback, DB messages vẫn đọc được.

Rollback: ngừng cấp realtime ticket, drain gateway, tắt realtime flag và giữ REST cursor read-only/send theo policy ADR. Không xóa event sequence/message. Redis loss được phục hồi từ DB snapshot cho durable event; presence được tái tạo qua reconnect.

## 5. Handoff Phase 4

Bàn giao SDK/schema event, sequencing/resume/lease APIs, rate/frame budget, multi-client harness, revoke semantics, latency baseline và flags độc lập dành cho viewport/artifact.

## 6. Prompt bàn giao cho AI triển khai

```text
Bạn là AI coding agent phụ trách Phase 3 — Realtime Gateway, Presence và Chat của Live Consultation trong Minipacs-v.2.

Đọc master plan, README, kế hoạch/evidence/ADR Phase 0–2 và tài liệu Phase 3 này; chỉ làm khi Phase 2 GO. Khảo sát deploy/Docker/proxy, Redis availability, DB/event patterns, auth ticket/revoke contract, consultation UI, telemetry và test harness. Kiểm tra git status; không phá cấu hình hoặc thay đổi ngoài nhiệm vụ.

Triển khai gateway production-shaped với strict origin/auth handshake, Redis multi-replica fan-out, DB durable source, versioned schema, room epoch/sequence, dedupe, ack/resume/resync, heartbeat/presence lease, bounded queue/backpressure, revoke disconnect và graceful drain. Chat phải authorize lại và persist transactionally trước broadcast, idempotent theo clientEventId, cursor stable và có pending/sent/failed UI. Không đưa viewer sync vào phase này, không lưu presence vào DB như nguồn thật và không báo sent trước commit.

Thực hiện protocol/integration/security/durability/multi-replica/chaos/load/soak/UI-a11y tests theo kế hoạch, bao gồm malformed frame, ticket replay, origin spoof, restart, network gap, Redis/DB outage, slow consumer và duplicate retry. Đo P50/P95/P99 cùng tài nguyên trên môi trường/dataset ghi rõ; scrub identifiers khỏi logs/labels. Chạy clean build/typecheck/tests/compose checks/diff-check phù hợp và lưu evidence thật.

Báo cáo kiến trúc và file thay đổi, schema/version, capacity/SLO thực đo, lỗi còn lại, runbook/alerts, rollback drill và acceptance checklist. Không handoff Phase 4 nếu durable chat có loss/duplicate, revoke không fail closed, multi-replica chưa chứng minh hoặc SLO chưa có evidence.
```
