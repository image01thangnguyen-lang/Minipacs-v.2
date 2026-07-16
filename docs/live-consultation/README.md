# Chương trình triển khai Hội chẩn trực tiếp

Ngày lập: 2026-07-16  
Nguồn chuẩn: [`../LIVE_CONSULTATION_MASTER_PLAN.md`](../LIVE_CONSULTATION_MASTER_PLAN.md)  
Trạng thái: **bộ kế hoạch triển khai; không phải bằng chứng tính năng đã hoàn thành**

## 1. Mục đích bộ tài liệu

Folder này phân rã master plan thành bảy phase có thể giao độc lập cho đội phát triển. Mỗi phase xác định rõ phạm vi, phụ thuộc, workstream, thứ tự thực hiện, đầu ra, test, tiêu chí GO/NO-GO, rollback và evidence. Khi có khác biệt, master plan và ADR đã được phê duyệt là nguồn quyết định; không tự suy diễn thay đổi policy lâm sàng.

## 2. Chỉ mục và kết quả chính

| Phase | Tài liệu | Kết quả bắt buộc |
|---|---|---|
| 0 | [Discovery, contract và threat model](./PHASE_0_DISCOVERY_CONTRACT_THREAT_MODEL_PLAN.md) | Inventory, baseline, ADR, contract, threat model và failing tests |
| 1 | [Domain, migration, authorization và study overlay](./PHASE_1_DOMAIN_MIGRATION_AUTHORIZATION_PLAN.md) | Nền dữ liệu additive, state machine, scoped policy, transaction và compatibility |
| 2 | [Tạo phòng, mời, password và join](./PHASE_2_ROOM_ACCESS_JOIN_PLAN.md) | Wizard tạo phòng và access matrix authenticated-only hoàn chỉnh |
| 3 | [Realtime gateway, presence và chat](./PHASE_3_REALTIME_PRESENCE_CHAT_PLAN.md) | Gateway + Redis, protocol resume/dedupe, durable chat và presence |
| 4 | [OHIF sync và collaborative artifacts](./PHASE_4_OHIF_SYNC_ARTIFACTS_PLAN.md) | Presenter/follow, normalized viewport sync và artifact namespace riêng |
| 5 | [Biên bản, chữ ký và HIS/EMR](./PHASE_5_MINUTES_SIGNATURE_HIS_PLAN.md) | Revisioned minutes, self-sign/quorum, immutable finalize và outbox |
| 6 | [Hardening, UAT, rollout và vận hành](./PHASE_6_HARDENING_UAT_ROLLOUT_PLAN.md) | Security/reliability/performance evidence, pilot, rollout và handoff |

## 3. Quan hệ phụ thuộc

```text
P0 → P1 → P2 → P3 → P4 → P5 → P6
```

- Không bắt đầu migration production khi ADR P0 chưa được duyệt.
- P2 chỉ dùng domain/policy P1; password không bao giờ thay thế xác thực, `consult.read` hoặc study scope.
- P3 không đồng bộ viewer; P4 chỉ bắt đầu sau khi ordering/resume/revoke của P3 đạt gate.
- P5 chỉ tham chiếu artifact đã accepted và không biến chat thành hồ sơ chính thức.
- P6 không thêm feature; chỉ hardening, chứng minh, rollout và đóng legacy có kiểm soát.

## 4. Quy tắc triển khai xuyên suốt

1. **Fail closed:** DB predicate phải áp scope trước khi trả row/count/detail; client không quyết định role, scope, lifecycle hay allowed action.
2. **PHI safety:** không đặt PHI/password/ticket/raw UID trong URL, metric label hoặc log; audit dùng metadata scrubbed.
3. **Dữ liệu lâm sàng:** DB là nguồn thật cho dữ liệu durable; Redis chỉ dùng pub/sub, presence, rate limit và sequence coordination.
4. **Concurrency:** durable mutation dùng transaction, idempotency và revision/CAS; không phân xử bằng timestamp client.
5. **Migration:** additive, backward-compatible, có fixture rollback; không dùng `db push --accept-data-loss`.
6. **Realtime:** chỉ truyền state/artifact nhỏ, không truyền pixel; viewport tick không ghi DB từng lần.
7. **Delivery:** mỗi slice review/test/rollback độc lập; bảo toàn worktree; không bịa benchmark, UAT, screenshot hoặc chữ ký owner.

## 5. Mẫu evidence bắt buộc mỗi phase

Mỗi phase tạo package evidence riêng (đường dẫn chốt ở P0), tối thiểu gồm:

- `INVENTORY.md`, `DECISIONS.md`/ADR liên quan và requirement-to-test traceability;
- command, thời gian, commit, môi trường, exit code và log đã scrub;
- test report functional/security/concurrency/performance phù hợp phase;
- migration/query-plan/visual/a11y/chaos evidence nếu có;
- open risks có severity, owner, deadline, mitigation;
- rollback procedure + kết quả diễn tập;
- acceptance checklist và quyết định `GO`, `HOLD` hoặc `NO-GO` có người chịu trách nhiệm.

Mỗi tài liệu phase kết thúc bằng mục **“Prompt bàn giao cho AI triển khai”**. Prompt này có thể sao chép nguyên khối cho một AI coding agent khác. AI nhận việc vẫn phải đọc master plan, tài liệu phase, trạng thái repository và evidence của phase trước; prompt không thay thế việc khảo sát code hoặc phê duyệt của con người.

## 6. Gate toàn chương trình

- [ ] Bảy phase đều có evidence và gate được duyệt tuần tự.
- [ ] Access matrix không thể vượt authentication/permission/scope.
- [ ] Chat/artifact/minutes durable không mất hoặc duplicate qua retry/reconnect.
- [ ] Sync đúng stable UID/frame, không truyền pixel, không phá measurement cá nhân.
- [ ] Chữ ký bind đúng revision/danh tính/quorum; finalized minutes immutable.
- [ ] HIS có trạng thái thật, idempotency, retry/dead-letter/reconciliation.
- [ ] Zero known critical/high authorization hoặc PHI issue.
- [ ] SLO, chaos, clinical UAT, accessibility, rollback và owner signoff đạt yêu cầu.
