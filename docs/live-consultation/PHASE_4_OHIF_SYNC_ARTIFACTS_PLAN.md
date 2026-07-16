# Phase 4 — Đồng bộ OHIF Viewer và Collaborative Artifacts

Ngày lập: 2026-07-16  
Phụ thuộc: Phase 0–3 `GO`, protocol ordering/resume ổn định  
Ngoài phạm vi: truyền pixel, thay measurement cá nhân, minutes/HIS

## 1. Mục tiêu

Cho presenter phát normalized viewer state, participant follow hoặc xem độc lập, và cộng tác annotation theo namespace riêng đúng series/SOP/frame. Mỗi client tiếp tục tải pixel trực tiếp từ DICOMweb theo quyền.

## 2. Work packages

### P4.1 — Bootstrap và trust boundary OHIF

- Inventory extension `minipacs`, viewport adapter, measurement persistence và iframe lifecycle trước khi sửa.
- Bootstrap lấy room snapshot/ticket qua same-origin endpoint hoặc bridge. Nếu `postMessage`: exact origin, validate `source` + strict schema + nonce, không wildcard.
- Không đưa ticket/PHI vào viewer URL/referrer/log/localStorage; cleanup subscription khi unmount/epoch đổi.

### P4.2 — Presenter lease và role controls

- Server cấp lease có holder, expiry và monotonically increasing version; heartbeat/renew bounded.
- Chỉ lease holder publish authoritative viewport; host transfer/request/release revisioned và audit.
- Event lease cũ bị bỏ; disconnect/expiry kích hoạt trạng thái no-presenter hoặc reassignment theo policy.

### P4.3 — Normalized viewport synchronization

- Contract gồm layout, active viewport, displaySet/series UID, SOP/frame/slice, VOI, zoom/pan/camera và orientation cần thiết.
- Publish tối đa 10–15 Hz (ADR hiệu chỉnh), throttle + trailing coalesce; không gửi wheel/mouse raw.
- Apply last-write-wins theo epoch + lease version + viewport + sequence; state cũ không rewind.
- Resolve stable UID sau khi display set ready; queue bounded/timeout khi series/frame thiếu.
- Follow/independent/refollow rõ ràng; local interaction chuyển independent nhưng không mất presenter state mới nhất.

### P4.4 — Collaborative artifact namespace

- Model riêng với stable annotation UID, source series/SOP/frame, tool type, normalized payload, author, revision và disposition.
- Create/update/delete durable qua server authorization/idempotency; broadcast committed result, không optimistic overwrite lâm sàng.
- Owner/host delete policy; observer read-only; consultant annotate nếu capability cho phép.
- Sidebar list ↔ jump/flash annotation; unavailable source hiển thị lỗi recoverable.
- Host accept/reject; accepted artifact chỉ tạo reference/provenance, không silently merge/overwrite measurement cá nhân.

### P4.5 — Layout/UI/performance

- Dark viewport `#000`, sidebars resize/collapse; 1x1/1x2/2x2 và multi-monitor.
- Connection/sync/presenter/follow state không chỉ dùng màu; keyboard/tooltip/ARIA và reduced motion.
- Viewport events ephemeral, không ghi DB từng tick; đo OHIF FPS/memory/network và gateway frames.

## 3. Test matrix

- Hai/nhiều client tải series theo thứ tự khác nhau vẫn hội tụ đúng UID/SOP/frame.
- Out-of-order, duplicate, reconnect gap, epoch/lease rollover, presenter disconnect/handoff.
- Missing series/frame, slow DICOMweb, MPR/multi-frame/calibration warning và layout change.
- 60 giây scroll/VOI/pan liên tục: throttle đúng, DB không có tick, queue/network trong budget.
- Artifact concurrent update/delete, stale revision, dedupe, reconnect hydrate, owner/observer/outsider authorization.
- iframe origin/source spoof, malformed payload, leaked secret scan.
- Existing personal measurement persistence regression và no-pixel-over-socket assertion.

## 4. Acceptance gate

- [ ] Presenter/follow/independent/refollow đúng qua handoff/reconnect.
- [ ] Không out-of-order rewind; mapping đúng series/SOP/frame trên client load order khác nhau.
- [ ] Artifact không duplicate, có provenance/revision và không phá measurement cá nhân.
- [ ] Observer/outsider không ghi/đọc trái quyền; bridge security pass.
- [ ] FPS/memory/network/event-rate đạt budget đã chốt.
- [ ] Flags `viewerSync` và `artifacts` tắt độc lập, không mất durable artifact.
- [ ] Dashboard/OHIF typecheck/test/build, E2E và diff-check pass.

## 5. Rollback/handoff

Tắt viewport sync trước mà vẫn cho viewer independent; tắt artifact mutation chuyển danh sách read-only. Không xóa artifact đã commit. Handoff P5 gồm accepted-artifact reference contract, provenance/hash rules, permission matrix và known unsupported viewer modes.

## 6. Prompt bàn giao cho AI triển khai

```text
Bạn là AI coding agent triển khai Phase 4 — OHIF Sync và Collaborative Artifacts của Live Consultation trong Minipacs-v.2.

Đọc master plan, README, toàn bộ kế hoạch/evidence Phase 0–3 và tài liệu Phase 4; xác minh realtime ordering/resume/revoke đã GO. Inventory OHIF extension/services, viewport/display-set APIs, measurement persistence, DICOMweb auth, iframe/postMessage bridge và Dashboard room UI trước khi sửa. Kiểm tra worktree và bảo toàn code ngoài scope.

Triển khai presenter lease/version, follow-independent-refollow, normalized viewport state theo stable series/SOP/frame, throttle/coalesce và apply theo epoch+lease+sequence. Mỗi client tự tải pixel từ DICOMweb; tuyệt đối không truyền pixel hoặc raw mouse event qua socket và không ghi DB mỗi viewport tick. Tạo collaborative artifact namespace riêng có author/provenance/revision/disposition, server authorization/idempotency và accept/reject; không overwrite hoặc silently merge measurement cá nhân. Nếu dùng postMessage, bắt buộc exact origin + source + schema + nonce và cleanup subscription.

Viết multi-client/E2E tests cho load order khác nhau, out-of-order/reconnect/lease handoff, missing series/frame, multi-frame/MPR, sustained scroll/VOI, artifact races/stale revision, role/cross-scope, bridge spoof và regression measurement cá nhân. Đo FPS/memory/network/event rate, kiểm tra no-pixel-over-socket/no-tick-in-DB, responsive/a11y/dark viewport. Chạy Dashboard/OHIF tests, typecheck, build và diff-check; lưu evidence thực, không giả lập chữ ký UAT.

Kết thúc bằng file/contract thay đổi, supported/unsupported modes, performance thực đo, test/evidence, risks, flags và rollback độc lập cho sync/artifact. Không handoff Phase 5 nếu mapping UID/frame sai, stale event gây rewind, artifact phá measurement cá nhân hoặc security bridge chưa đạt.
```
