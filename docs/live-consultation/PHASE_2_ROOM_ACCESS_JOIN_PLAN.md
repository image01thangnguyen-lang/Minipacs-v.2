# Phase 2 — Tạo phòng, Mời đích danh, Password và Join Flow

Ngày lập: 2026-07-16  
Phụ thuộc: Phase 0–1 `GO`  
Ngoài phạm vi: WebSocket/presence, viewer sync, minutes finalize

## 1. Mục tiêu

Hoàn thiện luồng create/invite/join/host-control với ba access mode nhưng luôn yêu cầu đăng nhập, `consult.read` và đúng study scope. Join ticket chỉ là credential một lần cho Phase 3, không phải bearer URL dài hạn.

## 2. Luồng UX và server

### P2.1 — Wizard tạo phòng Ant Design v5

1. Xác nhận patient/study context đã scoped và badge “chỉ ca này”.
2. Nhập subject/reason/priority với allowlist/length limits.
3. Tìm bác sĩ server-side theo scope/specialty/status; debounce, pagination và no N+1.
4. Chọn `INVITE_ONLY`, `PASSWORD` hoặc `INVITE_OR_PASSWORD`; password confirm, expiry, waiting-room option theo ADR.
5. Review allowed actions và `Create ready`/`Start now`; double-submit dùng idempotency.

Không cache danh sách người dùng giữa scope; không cho client gửi role HOST tùy ý. UI có loading/empty/error/denied/rate-limited và keyboard/focus/ARIA.

### P2.2 — Password và policy version

- Hash Argon2id hoặc thuật toán ADR chốt; cấu hình cost/pepper/rotation, password plaintext chỉ tồn tại trong request memory cần thiết.
- Mỗi rotate/remove/lock tăng policy version, thu hồi grant và ticket chưa dùng; audit metadata không chứa secret.
- Verify trả generic response, rate limit theo room + user + IP hash quay vòng; backoff/cooldown không lộ room existence.
- Password không cấp quyền nếu auth/permission/scope fail.

### P2.3 — Invitation, waiting và host controls

- Bulk invite transaction; accept/decline/re-invite có revision/idempotency.
- Host có thể approve waiting, remove, lock/unlock, rotate password và transfer host theo policy; mỗi action reload room và reauthorize.
- Remove/lock/end đánh dấu revoke để Phase 3 disconnect ngay; participant không tự nâng role.
- Notification/deep link chỉ chứa opaque ID; không password, PHI hoặc reusable ticket.

### P2.4 — Bootstrap và join ticket

- Bootstrap áp scoped query trước khi trả PHI; denied/not-found theo disclosure policy.
- Ticket TTL ngắn, bind `userId + roomId + roomEpoch + policyVersion + nonce + audience`; lưu hash/single-use marker.
- Atomic consume; replay/concurrent consume chỉ một request thắng; room epoch/policy/session expiry mismatch bị từ chối.
- Ticket không ở query string, referrer, browser storage lâu dài hoặc log.

### P2.5 — Entry points và compatibility

- Workspace/report/archive/context/list dùng cùng create/join capability; badge và CTA không thay authorization.
- Feature flags tách core create và secure join; flag off quay về flow cũ an toàn, không làm mất room mới.

## 3. Access test matrix bắt buộc

- Ba mode × invited/uninvited × correct/wrong/no password × in/out scope × permission/deny.
- Host/participant removed, room locked/ended, password rotate, grant/ticket expiry và session revoked.
- Brute-force distributed user/IP combinations; generic errors và audit threshold.
- Ticket replay, concurrent consume, forged audience/epoch/policy/user, stolen deep link và multi-tab.
- Invite user ngoài scope, forged HOST, self-invite, duplicate invite và concurrent rotate/remove/approve.
- PHI/token/password scan trên URL, logs, metrics, notifications, client state và error payload.

## 4. Acceptance gate

- [ ] Create → invite → accept/password → bootstrap/ticket hoạt động cho mọi mode.
- [ ] Không password nào vượt login/permission/scope; unauthorized không nhận room metadata.
- [ ] Password hash/config/revocation/rate limit và replay protection có security evidence.
- [ ] Host controls server-authorized, revisioned và audit đầy đủ.
- [ ] UX desktop/narrow, keyboard, focus và non-color states pass.
- [ ] Flag off phục hồi flow cũ; room/grant/audit không mất.
- [ ] Typecheck/tests/build/Prisma/diff-check pass.

## 5. Rollback và vận hành

Tắt secure-join/new-wizard flags, revoke ticket issuance mới và giữ API read-only cho room đã tạo. Không log password để điều tra. Nếu thuật toán/cost gây saturation, rate-limit và disable password mode theo flag; invite-only vẫn phải qua policy. Ghi runbook unlock/revoke/support mà không yêu cầu nhân viên biết mật khẩu.

## 6. Handoff Phase 3

Bàn giao ticket issuer/consumer contract, revoke signal, policy/version semantics, access fixtures, expected origin/audience, capacity estimate từ baseline và danh sách notification/UI states.

## 7. Prompt bàn giao cho AI triển khai

```text
Bạn là AI coding agent triển khai Phase 2 — Room Access & Join của Live Consultation trong Minipacs-v.2.

Trước khi sửa code, đọc master plan, README bộ phase, tài liệu/evidence Phase 0–1 và docs/live-consultation/PHASE_2_ROOM_ACCESS_JOIN_PLAN.md; xác minh Phase 1 GO. Khảo sát consultation UI/actions/services, Ant Design conventions, auth/session/scope/allowed-actions, password/crypto utilities, notifications, rate limiting, audit/scrubber và release flags. Kiểm tra worktree và bảo toàn thay đổi của người khác.

Triển khai wizard tạo phòng accessible, ba access mode authenticated-only, invitation/waiting/host controls, password hashing/rate limit/revocation và short-lived single-use join ticket. Mọi boundary phải kiểm tra auth → consult.read → organization/study scope → deny → grant/membership → lifecycle/role ở server; password/ticket không được vượt policy. Bind ticket với user/room/epoch/policy/nonce/audience, consume atomic và không đặt secret/PHI trong URL, browser storage, notification, log hoặc metric. Dùng revision/idempotency và transaction cho create/invite/control; không cho client tự gán HOST.

Bổ sung đầy đủ access matrix và negative tests: wrong/no password, out-of-scope, lock/end/remove/rotate, brute force, replay/concurrent consume, forged audience/epoch/user/role, duplicate invite, CSRF/disclosure và secret/PHI scan. Test keyboard/focus/ARIA và responsive states. Chạy test/typecheck/build/Prisma/diff-check phù hợp, lưu evidence thật và diễn tập flag rollback.

Kết quả cuối phải nêu file thay đổi, contract ticket/revoke, security assumptions, lệnh và exit code, acceptance checklist, open risks và rollback. Không handoff Phase 3 nếu replay, authorization, secret exposure hoặc generic-error disclosure chưa được chứng minh an toàn.
```
