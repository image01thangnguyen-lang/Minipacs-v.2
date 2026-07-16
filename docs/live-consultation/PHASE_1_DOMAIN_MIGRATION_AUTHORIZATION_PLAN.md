# Phase 1 — Domain, Migration, Authorization và Study Overlay

Ngày lập: 2026-07-16  
Phụ thuộc: Phase 0 `GO` và ADR được duyệt  
Ngoài phạm vi: password UX, WebSocket, OHIF collaboration, minutes UI/HIS send

## 1. Kết quả cần đạt

Tạo nền domain typed và dữ liệu additive, mọi read/mutation dùng cùng scoped policy, transition có revision/idempotency và study overlay không phá trạng thái đọc/ký hiện hữu.

## 2. Các slice triển khai

### P1.1 — Schema và migration additive

- Mở rộng `Consultation` theo ADR: kind, access mode/hash nullable, canonical lifecycle, epoch/revision/lock/access version, workflow snapshot và minutes pointer.
- Siết `ConsultationParticipant` bằng unique `(consultationId,userId)`, role/status typed và timestamps.
- Thêm grant, selected durable event, collaborative artifact, minutes, signature, access attempt và outbox relation theo data dictionary.
- Constraints/check/index cho room lifecycle/study, participant user/status, room sequence, message cursor, artifact disposition, grant expiry và outbox due work.
- Viết backfill idempotent + compatibility view/mapper; không drop/rename destructive trong rollout window.
- Validate migration trên empty DB, production-like fixture copy và legacy data bất thường; ghi forward/rollback duration và lock impact.

### P1.2 — Pure domain

- Enum/value object/state transition table không phụ thuộc UI/Prisma.
- Transition trả typed result; mọi mutation nhận expected revision và idempotency key.
- Capability evaluator theo thứ tự: auth → global permission → organization/study scope → explicit deny → membership/grant → lifecycle → room role.
- Legacy mapping có exhaustiveness test; unknown status fail closed và telemetry scrubbed.

### P1.3 — Scoped repository/service

- Repository đưa scope predicate vào query trước projection; list/count/detail/action không dùng load-by-ID rồi mới che UI.
- Transaction create room + host + bulk invite; participant validation/batching chống N+1 và partial write.
- Consult code unique bằng DB constraint + bounded retry; không dựa vào check-then-insert.
- Start/end/cancel/lock dùng CAS revision, row lock khi cần, append durable event và audit trong transaction.
- Mọi source study/report/non-DICOM được reload và scope/capability check server-side; không tin client-supplied status/role/study.

### P1.4 — Study consultation overlay

- Bắt đầu room tạo workflow event/overlay; kết thúc/hủy tính active-room count trong transaction.
- Worklist/detail/facet/badge lấy overlay từ server contract, không ghi đè report/RIS status.
- Hai room cùng study: kết thúc một room không gỡ badge khi room còn lại `LIVE`.
- Reconciliation job/query phát hiện drift giữa lifecycle và overlay; repair có audit, không sửa mù.

### P1.5 — Compatibility và rollout

- Dual-read/shadow compare trước; controlled dual-write chỉ khi ADR yêu cầu.
- Flag server-side cho canonical domain và overlay; metric mismatch không chứa raw UID.
- Old path vẫn đọc được legacy; new path không hard-delete dữ liệu old.

## 3. Test matrix

- Role × permission × scope × explicit deny × membership × lifecycle cho list/count/detail/action.
- Anonymous, forged room/study, facility A→B và resource missing đều fail closed, không leak existence.
- Duplicate create/invite/idempotency; concurrent start/end/cancel; stale revision; two rooms per study.
- Transaction fault injection giữa room/host/invite/event/overlay không để dữ liệu dở dang.
- Query count cố định theo batch; `EXPLAIN` xác minh index và cursor stable.
- Legacy status fixtures, unknown status, flag on/off, forward/backward application và rollback rehearsal.
- Audit/log/metric scrub không chứa PHI, clinical text, password/hash hoặc raw Prisma payload.

## 4. Evidence và tiêu chí nghiệm thu

- [ ] Prisma validate/generate, migration dry-run và fixture rollback pass.
- [ ] Scoped predicate dùng chung và test chứng minh zero cross-scope row/count/detail/action leak.
- [ ] State machine exhaustiveness + invalid transition + CAS/idempotency pass.
- [ ] Không N+1/partial transaction; query plan và baseline before/after được lưu.
- [ ] Overlay đúng với race/two-room và không đổi report workflow status.
- [ ] Shadow mismatch trong ngưỡng chốt; flag off đọc được dữ liệu cũ.
- [ ] Typecheck, targeted/full tests, build và diff-check pass.

## 5. Rollback

Tắt canonical/overlay flags, dừng dual-write theo runbook, giữ nguyên cột/bảng additive và event đã ghi. Không rollback bằng xóa room/participant/audit. Nếu migration gây lock/performance vượt budget, dừng rollout, restore app version tương thích và chỉ reverse index/constraint khi được DBA duyệt.

## 6. Handoff Phase 2

Bàn giao schema/generated client, domain contract, policy helper, scoped repository, fixture access matrix, migration evidence, known legacy mismatches và danh sách API boundary Phase 2 được phép dùng.

## 7. Prompt bàn giao cho AI triển khai

```text
Bạn là AI coding agent phụ trách Phase 1 — Domain, Migration, Authorization và Study Overlay của Live Consultation trong Minipacs-v.2.

Đọc bắt buộc: docs/LIVE_CONSULTATION_MASTER_PLAN.md, docs/live-consultation/README.md, tài liệu Phase 0, toàn bộ evidence/ADR Phase 0 đã được duyệt và docs/live-consultation/PHASE_1_DOMAIN_MIGRATION_AUTHORIZATION_PLAN.md. Sau đó khảo sát Prisma schema/migrations, consultation services/actions/pages, scope resolver/filter builder, workflow/report status, audit/telemetry và test patterns hiện có. Kiểm tra git status và không ghi đè thay đổi ngoài scope.

Chỉ bắt đầu khi Phase 0 là GO. Triển khai theo các slice nhỏ, review/rollback độc lập: migration additive và backfill idempotent; pure typed domain/state machine; policy evaluator fail-closed; scoped repository/service với predicate tại query; transaction/CAS/idempotency; study consultation overlay; shadow compatibility và feature flags. Không dùng client role/status làm nguồn thật, không load-by-ID rồi mới che quyền, không dùng db push --accept-data-loss và không thay report workflow status bằng consultation status.

Phải bổ sung test access matrix, cross-scope/IDOR, invalid transition, race/stale revision, duplicate/idempotency, transaction fault, two-room overlay, legacy mapping, query count/plan, migration forward/rollback và PHI scrub. Chạy Prisma validate/generate, targeted/full tests hợp lý, typecheck, build và git diff --check; không bịa kết quả. Tạo evidence với command/commit/environment/exit code, migration timing/query plan và known mismatch.

Khi hoàn tất, báo cáo file thay đổi, migration/compatibility impact, test thực chạy, rủi ro còn lại, rollback exact steps và từng acceptance checkbox. Không handoff Phase 2 nếu còn cross-scope leak, migration chưa diễn tập hoặc state/overlay race chưa đạt.
```
