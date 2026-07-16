# Kế hoạch tổng thể — Hội chẩn trực tiếp trên ca chụp

Ngày lập: 2026-07-16  
Phạm vi: MiniPACS Dashboard + OHIF Viewer + dữ liệu hội chẩn + realtime + bảo mật + biên bản/HIS  
Trạng thái: **Kế hoạch triển khai theo phase; chưa phải bằng chứng tính năng đã hoàn thành**

---

## 1. Mục tiêu sản phẩm

Khi gặp ca khó, bác sĩ có quyền có thể bật **Hội chẩn trực tiếp** ngay từ ca chụp. Hệ thống phải:

1. Tạo một phòng gắn chặt với đúng `StudyInstanceUID` và chuyển ca sang trạng thái nghiệp vụ **HỘI_CHẨN** mà không làm mất trạng thái đọc/ký báo cáo trước đó.
2. Hỗ trợ ba chính sách vào phòng rõ ràng:
   - `INVITE_ONLY`: chỉ người dùng nội bộ được mời đích danh;
   - `PASSWORD`: người dùng nội bộ có quyền xem ca và nhập đúng mật khẩu;
   - `INVITE_OR_PASSWORD`: người được mời vào thẳng, người khác trong đúng scope phải nhập mật khẩu.
3. Cho nhiều bác sĩ cùng xem đúng một ca, chat trực tiếp, theo dõi người đang tham gia, đồng bộ lát cắt/viewport theo chủ trì và chia sẻ điểm đo/ROI có nguồn gốc rõ ràng.
4. Cho chủ trì quản lý phòng, quyền trình bày, người tham gia, mật khẩu, khóa/mở phòng và kết thúc phiên.
5. Lập biên bản hội chẩn gồm chẩn đoán đồng thuận, hướng xử trí, chữ ký/xác nhận của thành viên; chỉ gửi EMR/HIS khi đủ điều kiện.
6. Bảo đảm phân quyền theo scope, audit, không rò PHI, chống truy cập bằng URL đoán được, chống race/replay và có cơ chế rollback.

### 1.1. Ngoài phạm vi MVP

- Không tự xây video conference SFU/MCU. Ảnh tham chiếu không hiển thị ô camera; “trực tiếp” được hiểu trước hết là **shared diagnostic viewer + presence + chat + artifacts**.
- Audio/video có thể tích hợp nhà cung cấp (Jitsi/LiveKit/Teams) sau MVP qua adapter, chỉ khi có yêu cầu nghiệp vụ và đánh giá hạ tầng/bảo mật riêng.
- Không cho khách không đăng nhập xem PHI trong MVP. Password là lớp kiểm soát bổ sung, **không thay thế** xác thực, quyền `consult.read` và study scope.
- Không dùng chat làm báo cáo chẩn đoán chính thức; biên bản là artifact có revision và chữ ký riêng.

---

## 2. Phân tích kỹ màn hình tham chiếu

Ảnh mô tả một “dark room” ba cột, tối ưu cho màn hình chẩn đoán:

### 2.1. Header toàn màn hình

- Trái: nhãn đỏ **LIVE COLLABORATION** có chấm trạng thái; đây phải là trạng thái kết nối thật (`connecting/live/degraded/reconnecting/offline`), không chỉ trang trí.
- Giữa: tiêu đề phòng chứa tên người bệnh/PID; dòng phụ có chỉ định, giới tính, năm sinh. PHI cần lấy từ server đã scoped, không đặt trong token, log, event metric hoặc URL.
- Phải: badge “phạm vi: chỉ ca chụp này (study)” và nút thoát. Cần hiển thị rõ scope để tránh bác sĩ tưởng annotation áp dụng cho ca liên quan khác.
- Nên bổ sung: mã hội chẩn, ưu tiên, đồng hồ thời lượng, trạng thái đồng bộ và tên người đang trình bày.

### 2.2. Cột trái — thành viên, chat, điểm đo

1. **Bác sĩ tham gia**
   - Danh sách có presence dot, họ tên, chuyên khoa/vai trò; chủ trì có badge riêng.
   - Cần phân biệt `INVITED`, `WAITING`, `JOINED`, `DISCONNECTED`, `LEFT`, `REMOVED`, `DECLINED`; chấm xanh không được đồng nghĩa mơ hồ với “đã từng tham gia”.
   - Chủ trì cần menu: trao quyền trình bày, tắt quyền chia sẻ, mời lại, xóa khỏi phòng, chuyển chủ trì.
2. **Trò chuyện nhóm trực tuyến**
   - Có system message khi mở phiên và message người dùng kèm tên/chuyên khoa.
   - Cần timestamp, trạng thái gửi/lỗi, phân trang lịch sử, unread marker, retry idempotent, giới hạn độ dài và chống gửi khi đã kết thúc.
   - Không hỗ trợ HTML tùy ý; render text an toàn. Attachment không thuộc MVP.
3. **Điểm đo lường & đánh dấu**
   - Danh sách artifact hiển thị loại, tác giả, thời điểm/tọa độ và giá trị; chọn item phải jump đúng series/SOP/frame/viewport.
   - Artifact cần trạng thái `LIVE_DRAFT`, `ACCEPTED_IN_MINUTES`, `REJECTED`, `DELETED`; không được ghi đè measurement cá nhân hoặc clinical artifact hiện có một cách âm thầm.

### 2.3. Vùng giữa — diagnostic viewer

- Viewport đen tuyệt đối, overlay DICOM ở mép trên, toolbar nổi gồm trình bày, điểm mờ, ROI, thước đo, layout 1x1/1x2/2x2.
- Ảnh cho thấy một ROI đỏ và nhãn “Đo lường ổn thương 2.5 cm²”; item này đồng thời xuất hiện ở cột trái. Đây là yêu cầu đồng bộ hai chiều giữa Cornerstone annotation state và room event stream.
- Thanh dưới hiển thị lát cắt `2/24`, slider và badge “đồng bộ thời gian thực”.
- Phải có hai chế độ:
  - **Follow presenter**: nhận viewport state từ presenter;
  - **Independent**: người xem tạm ngừng follow để tự khảo sát; có nút “Theo lại chủ trì”.
- Không phát từng event wheel thô. Chỉ phát normalized state có throttle/coalescing: study, series/display set, SOP/frame hoặc slice, camera, VOI/window-level, zoom/pan, layout và active viewport.
- Mọi client tự tải pixel DICOM từ nguồn PACS được cấp quyền; realtime chỉ truyền state/artifact nhỏ, tuyệt đối không truyền pixel data qua socket.
- Khi series khác thứ tự hoặc chưa tải xong, client phải map bằng stable UID rồi mới áp state; event cũ không được overwrite event mới.

### 2.4. Cột phải — biên bản hội chẩn

- Hai vùng nhập: **Chẩn đoán xác định (consensus)** và **Hướng xử trí & phác đồ điều trị**.
- Danh sách chữ ký có họ tên, vai trò/chuyên khoa và checkbox. Checkbox trong ảnh cần được triển khai thành hành động xác nhận có danh tính, timestamp, revision; người khác không thể tick hộ.
- Nút “Ký duyệt & gửi EMR/HIS” là hành động nhạy cảm:
  - kiểm tra quyền và scope lại ở server;
  - khóa đúng revision;
  - yêu cầu chủ trì và quorum đã cấu hình;
  - chống double submit bằng idempotency key;
  - outbox/retry khi HIS lỗi, không báo thành công giả;
  - audit không chứa toàn bộ nội dung PHI.
- Cần autosave có revision/conflict handling; cảnh báo unsaved changes khi thoát; sau finalize chuyển read-only và tạo amendment thay vì sửa trực tiếp.

### 2.5. Layout/responsive/accessibility cần điều chỉnh

- Desktop chẩn đoán: trái 300–340 px, phải 320–380 px, viewport chiếm phần còn lại; hai sidebar resize/collapse và lưu preference.
- Màn hình hẹp: chỉ mở một drawer phụ tại một thời điểm; viewport không bị co dưới ngưỡng an toàn. Không hứa hỗ trợ chẩn đoán chính thức trên mobile.
- Một vùng chỉ có một scroll owner; header/toolbar sticky; focus không nhảy khi nhận realtime event.
- Icon-only phải có tooltip/`aria-label`; trạng thái không chỉ dùng màu; hỗ trợ keyboard và `prefers-reduced-motion`.
- Tuân thủ `docs/antd-migration/CLINICAL_UI_STANDARD.md`: Ant Design v5 dark theme, control `middle`, border/palette chuẩn, viewport `#000`, không flash trắng.

---

## 3. Hiện trạng code và khoảng trống

### 3.1. Tài sản có thể tái sử dụng

- Prisma đã có `Consultation`, `ConsultationParticipant`, `ConsultationMessage`; có liên kết study/report/non-DICOM, host, participant, video provider và timestamp.
- Permission đã có `consult.read/create/invite/start/message/finish/cancel/manage/admin`.
- Các entry point tạo hội chẩn đã xuất hiện ở Workspace, Report, Archive và context panel.
- `/consultations/[id]` đã có room prototype: OHIF trong iframe, participant list, chat và polling 5 giây.
- OHIF extension đã có measurement persistence, viewport state adapter, event subscription, key image/snapshot/audit service.
- Scope authorization, allowed action, telemetry/scrubber, feature flag và release-control đã tồn tại để tái sử dụng.

### 3.2. Khoảng trống/rủi ro phải xử lý trước khi gọi là live consultation

- Status đang không nhất quán: schema mô tả `STARTED/IN_PROGRESS/FINISHED`, UI/service dùng `ACTIVE/COMPLETED`; cần canonical state machine và compatibility mapping.
- `getConsultationById` lấy theo ID rồi action mới kiểm tra lỏng; list/detail/message/status chưa chứng minh cùng một DB scope predicate. URL ID không được trở thành quyền truy cập.
- Service dùng nhiều `any`, string status/role, chưa có Zod limits, optimistic revision hoặc transaction đầy đủ.
- Participant display name là placeholder; vòng lặp tạo participant gây nguy cơ N+1/partial write; chưa có unique constraint `(consultationId,userId)`.
- Prototype polling toàn bộ room mỗi 5 giây, không đủ realtime và lãng phí; chưa có presence, reconnect/resume, event ordering hoặc backpressure.
- Chưa có password hash/access policy, waiting room, failed-attempt rate limit hay session grant ngắn hạn.
- iframe OHIF đang mở study thường; chưa có room bootstrap/token bridge hoặc realtime collaboration extension.
- Measurement persistence hiện ghi study-level artifact trực tiếp và không có revision/ownership; không thể dùng nguyên trạng cho collaborative draft.
- Chưa có biên bản có revision, signature/quorum, outbox HIS và amendment.
- `docker-compose.yml` hiện không có Redis/realtime gateway. Next.js server action không nên giữ WebSocket state trong process.
- Cách chạy production đang dùng `prisma db push --accept-data-loss`; migration cho tính năng lâm sàng phải additive và triển khai bằng migration được kiểm soát, không dựa vào destructive push.

---

## 4. Kiến trúc đích

### 4.1. Thành phần

1. **Dashboard/Next.js**: màn hình tạo/join/room/minutes; REST/server boundary; xác thực NextAuth; authorization/scope.
2. **Consultation domain service**: state machine, policy evaluator, participant/access grant, messages, artifact/minutes/signature và audit.
3. **Realtime Gateway** (service độc lập): WebSocket (khuyến nghị Socket.IO hoặc ws với protocol typed), xác minh ticket dùng một lần; room fan-out; presence; ack/resume; rate limit.
4. **Redis**: pub/sub + ephemeral presence + rate limit + sequence coordination khi có nhiều gateway replica. Không coi Redis là durable clinical store.
5. **PostgreSQL**: nguồn sự thật durable cho room, participant, chat, accepted artifacts, minutes, signatures, access/audit event, outbox.
6. **OHIF MiniPACS collaboration extension**: bootstrap room, publish/apply viewport state, collaborative annotation layer, follow presenter và room controls.
7. **HIS/EMR adapter + outbox worker**: gửi biên bản finalized, retry có kiểm soát, reconciliation.

Nếu chưa thể thêm Redis trong pilot một instance, gateway có thể dùng in-memory adapter **chỉ sau ADR**, nhưng phải gắn cờ single-replica, không dùng cho HA và có đường nâng cấp Redis trước production.

### 4.2. Nguyên tắc dữ liệu

- Clinical/durable event ghi DB trước hoặc trong transaction rồi mới broadcast; viewport/presence là ephemeral và không ghi từng wheel event.
- Event envelope tối thiểu:
  `eventId`, `roomId`, `roomEpoch`, `sequence`, `type`, `actorParticipantId`, `clientId`, `occurredAt`, `schemaVersion`, `payload`.
- Client mutation dùng `clientEventId` để idempotency; reconnect gửi `lastSequence`, server replay durable event trong giới hạn rồi snapshot nếu gap quá lớn.
- Viewport state dùng last-write-wins theo `(roomEpoch, presenterLeaseVersion, viewportId, sequence)`; artifact/minutes dùng optimistic revision, không dùng timestamp client để phân xử.
- Password chỉ lưu `passwordHash` (Argon2id ưu tiên; bcrypt cost được cấu hình nếu giữ dependency hiện tại), không log password/token; thay password thu hồi access grants cũ.

### 4.3. Mô hình dữ liệu dự kiến (additive)

Mở rộng `Consultation`:

- `kind` (`ASYNC_REQUEST`, `LIVE_ROOM`), `accessMode`, `passwordHash?`, `roomEpoch`, `revision`, `lockedAt?`, `accessChangedAt?`, `studyWorkflowSnapshotJson?`, `minutesStatus`, `finalizedMinutesId?`.
- Canonical lifecycle: `DRAFT → SCHEDULED/READY → LIVE → ENDED`; terminal `CANCELLED`. Legacy mapper đọc/ghi trong thời gian chuyển đổi.

Bổ sung/siết model:

- `ConsultationParticipant`: unique room+user; role `HOST|PRESENTER|CONSULTANT|OBSERVER`; invite/presence/join/leave/remove timestamps; lastSeen; permissions snapshot không được dùng thay authorization hiện thời.
- `ConsultationAccessGrant`: hash token, user, room, policy version, expires/revoked, lần xác minh password.
- `ConsultationEvent`: durable event chọn lọc, sequence, type, actor, redacted metadata, unique event/idempotency.
- `ConsultationArtifact`: UID, source SOP/frame/series, tool type, normalized payload, author, revision, disposition.
- `ConsultationMinutes`: revision, diagnosis, treatment, status `DRAFT|IN_REVIEW|FINALIZED|AMENDED`, created/finalized metadata.
- `ConsultationSignature`: signer, minutes revision/hash, meaning, signedAt, unique signer+revision; không lưu checkbox đơn thuần.
- `ConsultationAccessAttempt`: audit/rate-limit metadata đã hash/scrub.
- Dùng outbox hiện có hoặc `IntegrationOutbox` để gửi HIS; unique destination+aggregate+revision.

Index bắt buộc được kiểm tra bằng query plan: lifecycle/createdAt, study UID/lifecycle, participant user/status, event room/sequence, message room/createdAt+id, artifact room/disposition, grant hash/expiry, outbox status/nextAttemptAt.

### 4.4. State machine và trạng thái ca chụp

- Không ghi đè mù status RIS/PACS hiện có. Tạo **consultation overlay** hoặc workflow event để worklist hiển thị badge `HỘI CHẨN TRỰC TIẾP` khi có room `LIVE`.
- Khi bắt đầu room, transaction khóa room/study liên quan, kiểm tra capability, lưu snapshot trạng thái trước và phát event `CONSULTATION_STARTED`.
- Khi kết thúc/hủy, gỡ overlay theo active-room count; nếu còn phòng live khác thì vẫn giữ badge. Workflow đọc/ký báo cáo tiếp tục theo policy riêng.
- Allowed actions phải do server tính theo: auth → global permission → organization/study scope → explicit deny → membership/access grant → lifecycle → room role.

### 4.5. Access decision matrix

| Tình huống | Kết quả |
|---|---|
| Không đăng nhập / không `consult.read` / ngoài study scope | 404 hoặc denied fail-closed; không lộ tên phòng/bệnh nhân |
| Host hoặc participant được mời, còn active | Vào theo membership, không hỏi password |
| Không được mời + `PASSWORD`, đúng scope | Nhập password, nhận grant ngắn hạn |
| Không được mời + `INVITE_OR_PASSWORD`, đúng scope | Nhập password hoặc chờ host duyệt theo cấu hình |
| Không được mời + `INVITE_ONLY` | Denied hoặc waiting request nếu host bật |
| Password sai nhiều lần | Rate limit theo room+user+IP hash; generic error; audit |
| Bị remove/room khóa/password đổi | Thu hồi grant/socket ngay, disconnect khỏi room |
| Room ended | Read-only theo policy; không chat/đo/sign bản cũ |

---

## 5. Kế hoạch triển khai theo phase

## Phase 0 — Discovery, contract và threat model

### Mục tiêu

Chốt hành vi trước khi migration/code realtime; loại bỏ mơ hồ về lifecycle, study status, password và phạm vi live sync.

### Công việc

1. Inventory toàn bộ caller/action/service/schema/API/OHIF/authz/audit/flag/test của consultation và viewer artifacts; vẽ call graph thực tế.
2. Ghi baseline: query count, payload/detail latency, polling load, bundle/render, hành vi cross-scope và status legacy.
3. Chốt ADR:
   - canonical lifecycle + legacy mapping;
   - study consultation overlay;
   - access modes và authenticated-only;
   - realtime gateway/Redis/protocol;
   - artifact ownership và merge vào clinical measurement;
   - video/audio defer hoặc provider adapter;
   - minutes quorum/signature/HIS contract.
4. Viết Zod/type contract, policy matrix, event catalog, error taxonomy, limits, retention và PHI classification.
5. Viết targeted failing tests cho unauthorized/cross-scope, invalid transition, duplicate participant, oversized message và stale revision.

### Deliverables/gate

- Inventory + ADR + sequence diagrams + state machine + data dictionary + threat model (STRIDE).
- Không còn tên status mâu thuẫn; product owner xác nhận access modes, quorum và audio/video scope.
- Baseline có số đo, rollback boundary và feature flags dự kiến.

### Prompt giao AI — Phase 0

```text
Làm việc tại C:\Antigravity\Minipacs-v.2. Thực hiện Phase 0 của docs/LIVE_CONSULTATION_MASTER_PLAN.md, chỉ discovery/contract/test scaffold, chưa triển khai production feature.

Đọc kỹ master plan, docs/DOCTOR_WORKSPACE_PHASE5_PR6_CONSULTATION_VIEWER_KEY_IMAGE_PLAN.md, docs/antd-migration/CLINICAL_UI_STANDARD.md và code consultation/OHIF/authz/scope/telemetry hiện có. Chạy git status/diff read-only và bảo toàn mọi thay đổi chưa commit. Inventory đầy đủ callers, schema, migration, actions, APIs, permissions, study workflow, viewer measurement persistence, flags và tests. Ghi baseline định lượng. Tạo ADR cho lifecycle canonical + legacy mapping, study overlay, access modes authenticated-only, realtime gateway/Redis, artifact ownership, minutes/quorum/HIS. Viết typed event/API contract, limits, error taxonomy, threat model và targeted failing tests nhưng không tự ý thêm dependency/hạ tầng. Kết thúc bằng evidence, unresolved decisions và lệnh verification; không tuyên bố phase pass nếu policy còn mơ hồ hoặc detail/action còn khả năng cross-scope.
```

## Phase 1 — Domain, migration, authorization và trạng thái ca

### Mục tiêu

Tạo nền dữ liệu/policy an toàn, chưa cần WebSocket; thay prototype string/`any` bằng domain contract có transaction và revision.

### Công việc

1. Migration additive cho room/access/participant/event/artifact/minutes/signature; constraints/index; backfill legacy status theo ADR, không hard delete field cũ.
2. Pure state machine và capability evaluator dùng chung cho list/detail/action; DB query áp scope trước khi trả dữ liệu.
3. Refactor `consultationService`:
   - transaction tạo room + host + invite bulk;
   - unique consult code bằng retry an toàn;
   - validate source resource thuộc scope;
   - transition compare-and-set theo revision;
   - idempotency mutation và audit scrubbed.
4. Study overlay `HỘI_CHẨN`: active-room count, không phá report/worklist state; cập nhật badges/facets/detail.
5. Compatibility adapter cho `REQUESTED/ACTIVE/COMPLETED` và `STARTED/IN_PROGRESS/FINISHED`; dual-read/controlled dual-write dưới flag.
6. Unit/integration tests: role × scope × membership × lifecycle; race start/end; two rooms same study; rollback migration.

### Gate

- Anonymous, forged ID, user cơ sở A truy cập ca B đều fail closed ở DB boundary.
- Không N+1 participant; transaction không tạo room dở dang; stale revision trả `CONFLICT`.
- Tắt flag đọc được dữ liệu cũ; migration rollback đã diễn tập trên fixture copy.

### Prompt giao AI — Phase 1

```text
Triển khai Phase 1 trong docs/LIVE_CONSULTATION_MASTER_PLAN.md tại C:\Antigravity\Minipacs-v.2 sau khi Phase 0 đã được duyệt. Đọc toàn bộ ADR/contract/evidence Phase 0 trước khi sửa. Bảo toàn worktree.

Thực hiện migration additive, typed consultation domain, canonical state machine, scoped repository/policy evaluator, transaction create/invite/start/end, optimistic revision/idempotency/audit và study consultation overlay. List/count/detail/action phải dùng cùng policy: authentication → permission → resource scope → explicit deny → membership/access → lifecycle/role. Không tin client status/role/study ID. Có compatibility mapper + feature flag cho status legacy, không hard delete. Viết unit/integration/security/race/query tests và migration rollback evidence. Không thêm realtime UI ở phase này. Chạy Prisma validate/generate, typecheck, targeted/full test, build, git diff --check; không pass nếu cross-scope leak, N+1, partial transaction hoặc rollback chưa chứng minh.
```

## Phase 2 — Tạo phòng, mời đích danh, password và join flow

### Mục tiêu

Hoàn thiện luồng bật hội chẩn và kiểm soát vào phòng trước khi bật realtime.

### Công việc

1. Thay `ConsultationDialog` bằng wizard AntD:
   - xác nhận ca/phạm vi;
   - chủ đề, lý do, ưu tiên;
   - chọn bác sĩ server-side search có scope, chuyên khoa và trạng thái;
   - chọn access mode, password + confirm, expiry/waiting room;
   - review và start now/create ready.
2. Password hash server-side; policy version; đổi/xóa password thu hồi grants; không gửi hash/client.
3. Join route không lộ PHI trước authorization; password verify rate limit; one-time join ticket TTL ngắn, bind user+room+epoch+nonce và single-use.
4. Host controls: invite/remove/lock/rotate password/approve waiting request; server reauthorize mỗi mutation.
5. Notification nội bộ/deep link không chứa password/PHI; invitation accept/decline; expired/removed states.
6. Update consultation list/context/worklist badge; loading/empty/error/denied/rate-limited states; keyboard/a11y.

### Gate

- Test đủ access matrix ở mục 4.5, brute-force/race/token replay/session expiry.
- Không thể tự mời user ngoài scope, tự nâng HOST hoặc dùng password để vượt study permission.
- UX tạo → mời → join → khóa/remove hoạt động khi flag bật; flag tắt quay về flow cũ.

### Prompt giao AI — Phase 2

```text
Triển khai Phase 2 của docs/LIVE_CONSULTATION_MASTER_PLAN.md. Đọc và xác minh Phase 0–1 đã pass; không sửa trái ADR. Bảo toàn worktree hiện có.

Xây wizard Ant Design v5 để bật hội chẩn từ đúng study, server-side participant search, access modes INVITE_ONLY/PASSWORD/INVITE_OR_PASSWORD, password hashing, policy version/revocation, waiting room tùy cấu hình, host controls và join ticket one-time TTL ngắn. Password không thay thế login/consult.read/study scope. Mọi action reload resource và reauthorize; rate-limit password; generic errors không lộ PHI/existence; token/password/hash không vào log/URL. Bổ sung invitation/join/denied/loading/a11y UI và feature-flag rollback. Viết tests cho toàn bộ access matrix, brute force, replay, concurrent rotate/remove và session expiry. Chạy full verification và tạo security/visual/rollback evidence; không triển khai WebSocket room sync ngoài ticket contract ở phase này.
```

## Phase 3 — Realtime gateway, presence và chat

### Mục tiêu

Thay polling bằng kênh realtime đáng tin cậy cho presence/chat/system events, chưa đồng bộ viewer.

### Công việc

1. Thêm gateway service + Redis adapter qua compose/config; health/readiness, origin allowlist, TLS ở gateway, graceful shutdown và reconnect.
2. Handshake bằng one-time ticket; gateway gọi/verify server policy, join đúng room epoch; disconnect ngay khi grant revoked.
3. Typed protocol, heartbeat, presence lease, sequence/ack, resume từ `lastSequence`, snapshot fallback và dedupe `clientEventId`.
4. Chat durable: transaction persist + sequence trước broadcast; cursor pagination, max length/rate, optimistic pending/sent/failed; sanitize plain text.
5. System event cho join/leave/remove/start/end; không broadcast PHI thừa.
6. Room UI theo ảnh: participant panel + presence, chat panel, connection status, reconnect banner, unread và read-only khi ended.
7. Observability: active rooms/connections, reconnect/error/lag, queue depth; label không dùng user/patient/study UID.

### SLO/gate đề xuất

- P95 chat fan-out nội vùng < 500 ms; presence converge < 5 s; reconnect/resume < 10 s trong điều kiện bình thường.
- Load test tối thiểu theo pilot dự kiến (ví dụ 20 room × 10 user), không mất/nhân đôi durable chat.
- Redis/gateway outage degrade rõ ràng; không fallback unscoped; chat pending không báo sent giả.

### Prompt giao AI — Phase 3

```text
Triển khai Phase 3 của docs/LIVE_CONSULTATION_MASTER_PLAN.md sau khi Phase 0–2 đã pass. Bắt đầu bằng inventory hạ tầng/deploy hiện tại và ADR realtime đã duyệt; không chọn thư viện tùy ý nếu ADR chưa chốt.

Thêm realtime gateway độc lập, Redis adapter/config/health, one-time ticket handshake, room epoch, typed event envelope, heartbeat/presence lease, sequence+ack+resume+dedupe và revoke disconnect. Chat phải persist durable trước broadcast, cursor pagination, plain-text sanitize, size/rate limits, idempotent retry. Thay polling room bằng participant/chat realtime UI có connecting/live/degraded/reconnecting/offline và read-only terminal states. Scrub PHI khỏi logs/metrics. Viết protocol/unit/integration/load/chaos tests cho duplicate, out-of-order, reconnect gap, Redis/gateway restart, remove participant và expired session. Dùng feature flag và chứng minh rollback về polling read-only an toàn. Chạy full verification, compose health test và ghi SLO evidence.
```

## Phase 4 — Đồng bộ OHIF viewer và collaborative artifacts

### Mục tiêu

Tạo trải nghiệm chính trong ảnh: chủ trì trình bày, người khác follow, cùng thấy ROI/đo lường theo thời gian thực mà không truyền pixel.

### Công việc

1. Tạo MiniPACS OHIF collaboration service/extension nhận room bootstrap an toàn từ parent hoặc endpoint cùng origin; validate `postMessage` origin nếu dùng iframe bridge.
2. Presenter lease có expiry/version và host transfer; chỉ presenter publish viewport authoritative.
3. Normalize/sync layout, active viewport, series/display set UID, SOP/frame/slice, VOI, zoom/pan/camera; throttle 10–15 Hz tối đa và coalesce; map UID sau khi display set ready.
4. Follow/independent mode; “Theo lại chủ trì”; feedback khi series/frame unavailable; không khóa thao tác local.
5. Collaborative artifact layer riêng:
   - add/update/delete với owner, revision, stable annotation UID;
   - conflict/late event/dedupe;
   - list trái ↔ jump to annotation;
   - host accept/reject vào biên bản;
   - không overwrite measurement cá nhân/study persistence hiện hữu.
6. Permission tool-level: observer chỉ xem; consultant annotate nếu được cấp; delete chỉ owner/host theo policy.
7. Multi-layout/multi-monitor/reconnect tests; pixel data vẫn tải trực tiếp từ DICOMweb theo quyền.

### Gate

- Hai client ở mạng giả lập thấy presenter state/artifact đúng series/SOP/frame; out-of-order không rewind.
- 60 giây scroll liên tục không flood gateway/DB; viewport event không ghi DB từng tick.
- Artifact reload/reconnect không duplicate; user ngoài room không đọc/ghi được artifact.

### Prompt giao AI — Phase 4

```text
Triển khai Phase 4 của docs/LIVE_CONSULTATION_MASTER_PLAN.md, tập trung OHIF collaboration; Phase 0–3 và realtime protocol phải đã pass. Đọc code trong ohif-viewer/extensions/minipacs, đặc biệt viewportStateAdapter và viewerMeasurementPersistenceService, trước khi thiết kế.

Tạo collaboration service/extension với room bootstrap an toàn, presenter lease/version, normalized viewport events (layout, displaySet/series, SOP/frame, VOI, camera/zoom/pan), throttle/coalescing, follow/independent/re-follow và handling display set chưa sẵn sàng. Không truyền pixel qua socket. Tạo collaborative artifact namespace/model riêng có owner/revision/add-update-delete/dedupe/conflict và jump-to-annotation; không ghi đè measurement persistence hiện hữu. Enforce observer/consultant/presenter/host server-side. Nếu dùng iframe postMessage, allow exact origin + validate schema/source; không đưa join secret vào URL/log. Viết multi-client E2E, out-of-order, reconnect, layout, unavailable series, event-flood và authorization tests; đo latency/CPU/network. Có flags riêng viewport-sync/artifact-sync và rollback độc lập.
```

## Phase 5 — Biên bản, đồng thuận, chữ ký và HIS/EMR

### Mục tiêu

Hoàn thiện cột phải trong ảnh thành hồ sơ lâm sàng có revision, xác nhận danh tính và gửi tích hợp tin cậy.

### Công việc

1. Minutes editor: diagnosis consensus, treatment plan, optional key findings/artifact references; autosave debounce + revision + dirty guard + conflict recovery.
2. Workflow `DRAFT → IN_REVIEW → FINALIZED`; amendment tạo revision mới, không sửa bản finalized.
3. Signature semantics:
   - mỗi user chỉ ký cho chính mình sau re-auth theo policy;
   - chữ ký bind hash canonical của minutes revision + signer + meaning + timestamp;
   - thay nội dung làm invalid signature của draft cũ;
   - quorum cấu hình (bắt buộc host + N consultant hoặc danh sách cụ thể).
4. Finalize transaction khóa revision, kiểm tra lifecycle/quorum/permission/scope và tạo immutable snapshot/outbox.
5. HIS/EMR adapter mapping; idempotency; exponential retry/dead-letter/manual reconcile; UI `QUEUED/SENT/FAILED`, tuyệt đối không báo sent khi mới queued.
6. Chọn accepted artifacts/key images đưa vào minutes bằng reference UID; không nhúng blob quá mức.
7. Export/print theo quyền, provenance/audit và retention.

### Gate

- Concurrent edit/sign/finalize không làm mất nội dung hoặc ký nhầm revision.
- User không tick hộ; revoked/removed participant không ký; finalized immutable.
- HIS timeout/duplicate callback/retry không gửi trùng logical document; có reconciliation/runbook.

### Prompt giao AI — Phase 5

```text
Triển khai Phase 5 của docs/LIVE_CONSULTATION_MASTER_PLAN.md sau khi room và artifacts đã ổn định. Dùng pattern autosave revision/dirty guard/outbox hiện có trong repository, không tạo cơ chế song song thiếu kiểm soát.

Xây ConsultationMinutes typed model/editor với diagnosis consensus, treatment plan, accepted artifact references, revisioned autosave, conflict recovery và DRAFT→IN_REVIEW→FINALIZED→AMENDMENT. Signature phải là server action của chính signer, bind canonical content hash+revision+meaning+timestamp; nội dung đổi phải invalidate draft signature theo contract. Finalize reload/re-authorize, compare-and-set, kiểm tra host/quorum và idempotency trong transaction. Tạo HIS/EMR outbox adapter với queued/sent/failed/retry/dead-letter/reconcile; không báo success giả và không log clinical text. Viết concurrency/security/immutability/quorum/integration failure tests, visual/a11y và runbook. Feature flag riêng cho finalize/HIS; rollback không được mất minutes/signature/outbox.
```

## Phase 6 — Hardening, UAT, rollout và vận hành

### Mục tiêu

Chứng minh tính năng an toàn trong môi trường lâm sàng và rollout có kiểm soát.

### Công việc

1. Security: threat tests, dependency/container scan, CSRF/origin, WebSocket hijacking, replay, brute force, IDOR/cross-scope, injection, log/token/PHI scrub.
2. Reliability: gateway/Redis/DB/HIS/Orthanc outage, network flap, multi-tab, clock skew, rolling deploy, stale room epoch, backup/restore.
3. Performance: load/soak, query plans, DB growth/retention, event bandwidth, OHIF FPS/memory, P95/P99 SLO.
4. Clinical UAT theo vai trò và modality; kiểm tra measurement calibration, multi-series, 1x1/1x2/2x2, diagnostics monitors.
5. Accessibility/responsive/browser matrix; dark-room visual regression.
6. Feature flags/cohort: `liveConsultationCore`, `liveConsultationRealtime`, `liveConsultationViewerSync`, `liveConsultationArtifacts`, `liveConsultationMinutes`, `liveConsultationHis`.
7. Pilot nội bộ → một khoa/cơ sở → tăng cohort; kill switch không làm mất durable data; dashboard/runbook/on-call/training.

### Release gates

- Zero known critical/high authorization or PHI issue; security signoff.
- SLO/load/soak và chaos pass; recovery point rõ; rollback drill pass.
- Clinical owner ký UAT; HIS owner ký mapping/reconciliation; operations ký runbook.
- Legacy polling/status path chỉ xóa sau parity, soak và migration closure riêng.

### Prompt giao AI — Phase 6

```text
Thực hiện Phase 6 hardening/release của docs/LIVE_CONSULTATION_MASTER_PLAN.md; không thêm feature mới. Đọc toàn bộ evidence Phase 0–5 và lập traceability requirement→test→evidence.

Chạy/hoàn thiện security tests (IDOR, scope, WS hijack, replay, brute force, injection, PHI scrub), load/soak/query plan, gateway+Redis+DB+HIS+Orthanc chaos, reconnect/rolling deploy/room epoch, OHIF FPS-memory-network, visual/a11y/browser và clinical UAT fixtures. Thiết lập flags/cohort/kill switches, observability SLO không cardinality/PHI, backup-restore, incident/reconciliation/rollback runbooks và training checklist. Pilot theo cohort, ghi go/no-go rõ ràng. Không xóa legacy trước parity+soak+rollback drill. Chạy typecheck, full tests, Prisma validation, builds Dashboard/OHIF/gateway, compose smoke và git diff --check; chỉ tuyên bố release candidate khi mọi owner signoff và không còn high-risk open item.
```

---

## 6. API và realtime contract tối thiểu cần chốt

REST/server boundary dự kiến (tên route có thể đổi theo ADR, semantics không đổi):

- `POST /api/consultations/live` — create ready/start room, idempotency key.
- `GET /api/consultations/:id/bootstrap` — scoped snapshot + allowed actions, không trả hash/secret.
- `POST /api/consultations/:id/invitations` — bulk invite validated.
- `POST /api/consultations/:id/access/verify` — verify password, rate limit.
- `POST /api/consultations/:id/join-ticket` — one-time realtime ticket.
- `POST /api/consultations/:id/start|end|cancel|lock` — revisioned transition.
- `GET/POST /api/consultations/:id/messages` — cursor/durable chat fallback.
- `GET/POST/PATCH/DELETE /api/consultations/:id/artifacts` — revisioned artifact fallback.
- `GET/PATCH /api/consultations/:id/minutes` — revisioned autosave.
- `POST /api/consultations/:id/minutes/:revision/sign|finalize`.
- `POST /api/consultations/:id/integration/retry` — privileged reconcile.

Realtime client events: `room.join`, `presence.heartbeat`, `chat.send`, `viewport.publish`, `artifact.create/update/delete`, `presenter.request/release`.  
Server events: `room.snapshot/ended/locked`, `presence.changed`, `chat.committed`, `presenter.changed`, `viewport.state`, `artifact.committed`, `access.revoked`, `error`, `ack`.

Mỗi payload phải strict schema, unknown field reject, giới hạn byte/nesting, version rõ và generic error code: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`, `INVALID_TRANSITION`, `STALE_REVISION`, `RATE_LIMITED`, `ROOM_LOCKED`, `RESYNC_REQUIRED`, `DEPENDENCY_UNAVAILABLE`.

---

## 7. Test matrix xuyên suốt

1. **Authorization:** anonymous, thiếu permission, explicit deny, cross-facility, forged study/room/artifact/minutes ID.
2. **Access:** ba mode, password đúng/sai/rotate, invite accept/decline/remove, grant expiry/revoke, waiting room, replay ticket.
3. **Lifecycle:** mọi transition hợp lệ/không hợp lệ; double start/end; two active rooms; cancel/ended read-only.
4. **Realtime:** duplicate/out-of-order/gap, multi-tab, reconnect, offline queue, gateway/Redis restart, rolling deploy, slow consumer.
5. **Viewer:** different load order, missing series/frame, MPR, layout change, presenter handoff, independent/refollow, calibration warning.
6. **Artifacts:** concurrent update/delete, owner policy, dedupe, reconnect hydrate, accepted/rejected provenance.
7. **Minutes/signature:** autosave conflict, stale sign, content changed, quorum, self-sign only, immutable finalize/amendment.
8. **HIS:** timeout, 4xx/5xx, duplicate retry/callback, dead letter, manual reconcile, PHI-safe telemetry.
9. **Performance:** no N+1, bounded payload/history, P95/P99, DB indexes, socket fan-out, OHIF FPS/memory.
10. **UX/a11y:** keyboard/focus, non-color states, screen-reader labels, reduced motion, collapsed panels, no white flash.
11. **Rollback:** từng flag tắt độc lập, gateway unavailable, old data compatibility, no data/signature/outbox loss.

---

## 8. Observability, audit và retention

- Metrics: active rooms/connections, join success/denial reason class, auth latency, message/artifact/view-state latency, reconnect/resync, HIS outbox age/failure, DB query latency.
- Không dùng patient ID, study UID, room ID raw hoặc user ID làm metric label; log dùng correlation ID/hash quay vòng.
- Audit event: create/start/end/cancel, access policy change, password failed/passed (không giá trị), invite/remove, presenter transfer, artifact disposition, minutes sign/finalize/amend, HIS send/retry.
- Chat/minutes là dữ liệu nhạy cảm; retention phải được clinical/legal owner phê duyệt. Presence/viewport tick không cần durable retention. Access attempt giữ tối thiểu phục vụ security theo policy.
- Alert: gateway unavailable, reconnect spike, unauthorized spike, event lag, Redis/DB saturation, outbox oldest age vượt SLO.

---

## 9. Definition of Done toàn tính năng

- [ ] Bác sĩ có quyền bật room từ đúng study và study hiển thị badge hội chẩn chính xác.
- [ ] Invite-only/password/hybrid tuân thủ access matrix; không vượt login/permission/scope.
- [ ] Presence/chat realtime bền vững qua reconnect, không duplicate/mất durable message.
- [ ] Presenter sync và collaborative artifacts đúng UID/frame, không truyền pixel và không phá measurement cá nhân.
- [ ] Biên bản revisioned, chữ ký đúng danh tính/revision/quorum, finalized immutable.
- [ ] HIS/EMR idempotent, có trạng thái thật và reconciliation.
- [ ] Security/PHI/audit/accessibility/performance/chaos/UAT đạt gate.
- [ ] Flags, cohort, telemetry, runbooks, rollback drill và owner signoff đầy đủ.
- [ ] Dashboard/OHIF/gateway builds, typecheck, tests, Prisma validation và `git diff --check` pass.

## 10. Lệnh kiểm tra chuẩn cuối mỗi phase

Điều chỉnh theo artifact thực tế của phase, tối thiểu:

```powershell
Set-Location C:\Antigravity\Minipacs-v.2\dashboard
npx prisma validate
npx prisma generate
npm run typecheck
npm test
npm run build

Set-Location C:\Antigravity\Minipacs-v.2
git diff --check
```

Với phase OHIF/gateway phải chạy thêm typecheck/test/build đúng workspace và compose smoke/load/chaos tương ứng. Không dùng kết quả build cũ làm evidence; không tự động sửa/xóa thay đổi không thuộc task.
