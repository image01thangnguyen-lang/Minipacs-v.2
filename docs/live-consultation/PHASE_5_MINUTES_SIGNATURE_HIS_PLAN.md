# Phase 5 — Biên bản, Đồng thuận, Chữ ký và HIS/EMR

Ngày lập: 2026-07-16  
Phụ thuộc: Phase 0–4 `GO`; accepted artifact contract ổn định  
Ngoài phạm vi: audio/video, thay báo cáo CĐHA chính thức

## 1. Mục tiêu

Tạo biên bản lâm sàng revisioned có autosave/conflict recovery, self-sign/quorum, finalize immutable và HIS outbox tin cậy. Chat không tự động trở thành biên bản.

## 2. Work packages

### P5.1 — Minutes domain/editor

- Fields: consensus diagnosis, treatment plan, optional key findings và accepted artifact/key-image references.
- Workflow `DRAFT → IN_REVIEW → FINALIZED`; amendment tạo aggregate/revision mới liên kết bản gốc.
- Tái sử dụng pattern autosave/dirty guard hiện có: debounce, expected revision, save states, retry và conflict diff/reload/copy.
- Reload resource + scope/lifecycle/capability ở server; input limits, no raw clinical text in telemetry.
- Exit/navigation guard; finalized luôn read-only, kể cả client giữ tab cũ.

### P5.2 — Canonical hash và signature

- Định nghĩa canonical serialization/version, normalization và content hash có test vector.
- Người dùng chỉ ký chính mình; re-auth/MFA policy theo ADR; bind room/minutes ID + revision + hash + signer + meaning + signedAt.
- Unique signer/revision; retry idempotent. Nội dung draft đổi tạo hash/revision mới và signature cũ không thỏa quorum mới.
- Removed/revoked/out-of-scope participant không ký; server time là nguồn timestamp.

### P5.3 — Quorum/review/finalize

- Quorum config được version hóa: host bắt buộc + N consultant hoặc named required signers theo ADR.
- Submit review khóa hoặc giới hạn edit đúng contract; stale tab không finalize.
- Finalize transaction: reload/authorize → lifecycle → CAS revision → verify canonical hash/signatures/quorum → immutable snapshot → outbox unique → audit.
- Double-click/concurrent finalize chỉ tạo một logical document/outbox.

### P5.4 — HIS/EMR adapter/outbox

- Mapping versioned, destination allowlist, timeout, correlation/idempotency key và response classification.
- Worker claim/lease, exponential backoff+jitter, max attempts, dead letter và privileged manual reconcile.
- UI phân biệt `QUEUED`, `SENDING`, `SENT`, `FAILED/DEAD_LETTER`; queued không hiển thị sent.
- Duplicate callback/retry không gửi trùng logical document; reconciliation so sánh destination receipt.
- Payload/log/audit retention và encryption/access theo legal/clinical policy.

### P5.5 — Export/provenance/operations

- Export/print server-authorized, watermark/version/status phù hợp; không cache cross-user.
- Artifact chỉ tham chiếu stable UID/revision; blob/key image chỉ khi contract cho phép và có size limit.
- Runbook HIS outage, dead-letter triage, manual retry, amendment và access/audit review.

## 3. Test matrix

- Concurrent autosave A/B, stale revision, network failure, refresh/exit và conflict recovery không mất text.
- Self-sign only, forged signer, removed/revoked user, stale hash, duplicate signature và content changed.
- Quorum variants, concurrent sign/finalize, double submit, room ended/cancelled và finalized immutability.
- Amendment giữ provenance và không sửa snapshot gốc.
- HIS timeout/4xx/5xx, worker crash before/after send, duplicate retry/callback, dead letter/reconcile.
- Forged artifact reference/out-of-scope minutes/export; PHI scrub log/metric/error.
- Visual/a11y editor/signature states và print/export permission.

## 4. Acceptance gate

- [ ] Autosave revision/conflict/dirty guard không mất dữ liệu trong race tests.
- [ ] Signature đúng identity/hash/revision/meaning; không tick hộ.
- [ ] Quorum deterministic; finalize atomic/idempotent và snapshot immutable.
- [ ] Amendment không thay đổi bản finalized.
- [ ] HIS status phản ánh sự thật; retry/dead-letter/reconcile không duplicate logical document.
- [ ] Clinical/HIS/Security owner duyệt canonical form, mapping, quorum và retention.
- [ ] Tests/build/Prisma/query/diff-check và rollback drill pass.

## 5. Rollback/handoff

Flags riêng `minutes` và `his`: có thể dừng finalize/send mới nhưng phải giữ editor read-only và worker state. Không xóa minutes/signature/outbox. Khi rollback app, worker chỉ chạy phiên bản mapping tương thích; có kill switch destination. Handoff P6 gồm test vectors, UAT fixtures, reconciliation ledger, runbooks và outstanding dead letters.

## 6. Prompt bàn giao cho AI triển khai

```text
Bạn là AI coding agent phụ trách Phase 5 — Minutes, Signature và HIS/EMR của Live Consultation trong Minipacs-v.2.

Đọc master plan, README, kế hoạch/evidence/ADR Phase 0–4, accepted-artifact contract và tài liệu Phase 5. Xác minh Phase 4 GO; khảo sát report autosave/dirty guard/revision patterns, Prisma/outbox/worker/interoperability services, authz/audit/scrubber và export UI. Kiểm tra git status, không ghi đè thay đổi ngoài scope.

Triển khai minutes aggregate revisioned với autosave CAS/conflict recovery, DRAFT→IN_REVIEW→FINALIZED, immutable snapshot và amendment liên kết bản gốc. Định nghĩa canonical serialization/hash có test vectors; chữ ký chỉ self-sign, bind identity+meaning+minutes revision+hash+server time và phải được vô hiệu về quorum khi nội dung đổi. Finalize phải transactionally reload/authorize/verify lifecycle+quorum+CAS, tạo đúng một snapshot và outbox. HIS adapter/worker phải có mapping version, idempotency, claim lease, retry/backoff, dead letter, receipt và reconciliation; UI không được hiển thị SENT khi mới QUEUED. Chat không tự trở thành minutes.

Test autosave races, stale tabs, forged signer/reference, removed participant, duplicate signature/finalize, quorum variants, amendment immutability, export scope và mọi HIS fault window trước/sau send/commit. Quét PHI khỏi telemetry/error, test a11y/print, migration/query và worker compatibility. Chạy Prisma/typecheck/tests/build/diff-check, lưu evidence thật; clinical/HIS/security approval chưa có phải ghi pending, không tự ký thay.

Báo cáo files/schema/contracts, canonical test vectors, test/exit codes, reconciliation state, risk/approval còn thiếu, rollback/kill switch và acceptance checklist. Không handoff Phase 6 khi identity/hash/quorum không deterministic, finalized data còn sửa được hoặc HIS có thể duplicate logical document mà không reconcile.
```
