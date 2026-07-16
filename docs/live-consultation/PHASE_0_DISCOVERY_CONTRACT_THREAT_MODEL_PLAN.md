# Phase 0 — Discovery, Contract và Threat Model

Ngày lập: 2026-07-16  
Master plan: [`../LIVE_CONSULTATION_MASTER_PLAN.md`](../LIVE_CONSULTATION_MASTER_PLAN.md)  
Tiền điều kiện: không có; chỉ discovery/contract/test scaffold  
Trạng thái: kế hoạch chi tiết, chưa triển khai feature production

## 1. Mục tiêu và ranh giới

Chốt ngôn ngữ nghiệp vụ, trust boundary, contract và baseline trước khi thay schema hoặc thêm realtime. Phase này không thêm Redis/gateway, không migration production, không thay room UI và không tuyên bố đóng lỗ hổng chỉ vì đã viết tài liệu/test.

## 2. Câu hỏi bắt buộc phải được quyết định

1. Canonical lifecycle `DRAFT → READY/SCHEDULED → LIVE → ENDED`, `CANCELLED`; mapping chính xác từ/to status legacy.
2. Cách study hiển thị `HỘI_CHẨN`: overlay/event, active-room count, tương tác với đọc/ký report và nhiều room.
3. Ba access mode, waiting-room option, lock semantics, expiry và hành vi sau end.
4. Realtime topology, Redis requirement, room epoch, ordering, resume window và durable/ephemeral split.
5. Ownership collaborative artifact, quyền update/delete/accept và cách tham chiếu measurement hiện hữu.
6. Minutes fields, quorum, signature meaning, amendment, HIS contract/retention.
7. Audio/video được defer; nếu cần sau MVP phải qua provider adapter và threat assessment riêng.

## 3. Workstream và trình tự

### P0.1 — Inventory và call graph

- Tìm toàn bộ schema/migration/service/action/API/page/component cho consultation, participant, message, report, study workflow và notification.
- Inventory permission, scope resolver, explicit deny, allowed action, middleware/session, audit/scrubber, telemetry, release flag.
- Inventory OHIF extension/service: viewport adapter, measurement persistence, event subscription, key image, iframe/postMessage và DICOMweb authorization.
- Ghi caller → boundary → service → repository → model; đánh dấu nơi dùng `any`, status string, load-by-ID-then-check, N+1, polling và raw payload logging.
- Xác định deploy topology thật, reverse proxy/TLS/origin, Docker/Redis availability, worker/outbox pattern và môi trường UAT.

### P0.2 — Baseline định lượng

- Dùng fixture synthetic/de-identified; ghi dataset cardinality và máy/network test.
- Đo query count/payload/P50-P95 detail/list/create/message; polling request/min và DB load ở 1/10/50 room giả lập.
- Đo room render/bundle và OHIF initial load; ghi hành vi session expiry, cross-scope forged ID, duplicate participant và concurrent status update.
- Lưu raw evidence đã scrub; không dùng kết quả build/benchmark cũ.

### P0.3 — ADR và domain dictionary

Tạo ADR riêng cho bảy quyết định ở mục 2. Mỗi ADR có context, options, decision, consequence, security/privacy impact, migration/rollback và unresolved owner. Data dictionary phải mô tả enum, transition, revision, epoch, sequence, policy version, retention và PHI classification.

### P0.4 — Contract typed

- Zod/TypeScript schema cho create/bootstrap/invite/access verify/join ticket/transition/message/artifact/minutes/sign/finalize/retry.
- Strict unknown-field rejection; giới hạn ID, text bytes, nesting, batch size, cursor và rate.
- Event envelope: `eventId`, `roomId`, `roomEpoch`, `sequence`, `type`, `actorParticipantId`, `clientId`, `occurredAt`, `schemaVersion`, `payload`.
- Error taxonomy thống nhất; generic external errors không leak existence/PHI.
- Viết sequence diagram: create/start, password join, reconnect/resume, presenter handoff, artifact commit, sign/finalize/HIS retry và revoke/disconnect.

### P0.5 — Threat model và failing tests

- STRIDE theo trust boundary Dashboard ↔ DB ↔ gateway ↔ Redis ↔ OHIF ↔ PACS ↔ HIS.
- Cases: IDOR/cross-scope, CSRF/WS hijack, origin spoof, ticket/password replay, brute force, elevation role, stale epoch/revision, event flood, slow consumer, injection, PHI log leak và insider misuse.
- Tạo targeted failing tests cho unauthorized detail/action, invalid transition, duplicate participant, oversized message, stale revision, forged artifact/minutes ID và ticket replay. Đánh dấu rõ test scaffold chưa phải mitigation.

## 4. Deliverables

- Inventory/call graph/deployment diagram và baseline report có phương pháp tái lập.
- Bộ ADR đã ký bởi Product/Clinical/Security/Architecture/HIS owner tương ứng.
- State diagram, access decision table, data dictionary, API/event catalog và limits.
- Threat model + risk register (likelihood, impact, owner, mitigation phase).
- Test scaffold, traceability seed và feature-flag/rollback boundary proposal.

## 5. Test và verification

- Contract schema positive/negative, unknown/oversized input và version compatibility.
- Policy truth-table unit test chưa cần DB production migration.
- Chạy typecheck/test liên quan; `git diff --check`; xác minh không lockfile/infrastructure change ngoài scope.

## 6. Gate GO/NO-GO

- [ ] Inventory không còn vùng consultation/OHIF/authz/deploy chưa có owner.
- [ ] Không còn status/access/quorum/artifact semantics mơ hồ.
- [ ] Baseline có số đo, dataset, môi trường và command tái lập.
- [ ] Threat critical/high có mitigation phase và stop-ship rule.
- [ ] Contract/errors/limits/retention/PHI classification được duyệt.
- [ ] Feature flag, compatibility và rollback boundary được chốt.

**NO-GO** nếu detail/action còn khả năng cross-scope chưa được mô tả, Redis topology chưa quyết định, hoặc clinical/HIS owner chưa duyệt quorum/finalization.

## 7. Handoff sang Phase 1

Bàn giao commit/branch, toàn bộ ADR/evidence, danh sách failing test kỳ vọng, migration assumptions và open risks. Phase 1 không được tự đổi ADR; thay đổi phải tạo superseding ADR có phê duyệt.

## 8. Prompt bàn giao cho AI triển khai

```text
Bạn là AI coding agent phụ trách Phase 0 của chương trình Live Consultation trong repository Minipacs-v.2.

Nguồn bắt buộc phải đọc trước khi làm:
1. docs/LIVE_CONSULTATION_MASTER_PLAN.md
2. docs/live-consultation/README.md
3. docs/live-consultation/PHASE_0_DISCOVERY_CONTRACT_THREAT_MODEL_PLAN.md
4. Prisma schema/migrations, consultation Dashboard, authz scope, telemetry/scrubber, OHIF extension và deploy config hiện có.

Hãy thực hiện đầy đủ Phase 0, không triển khai feature production và không migration production. Trước tiên kiểm tra git status, bảo toàn mọi thay đổi không thuộc nhiệm vụ, rồi inventory call graph/data flow/deployment topology; lập baseline có thể tái lập; soạn ADR, domain dictionary, state/access decision table, typed API/event contracts, sequence diagrams, STRIDE threat model/risk register và targeted failing-test scaffold đúng kế hoạch. Không tự quyết policy lâm sàng còn mơ hồ: ghi rõ OPEN DECISION, owner và chặn GO khi cần. Không dùng PHI thật, không ghi secret/raw UID vào evidence và không tuyên bố test/approval đã đạt nếu chưa chạy hoặc chưa có người ký.

Yêu cầu đầu ra:
- đặt artifacts/evidence ở đường dẫn đã chốt trong Phase 0 và liên kết truy vết requirement → risk → contract/test;
- mọi nhận định về code phải kèm file/symbol thực tế;
- chạy các lệnh typecheck/test/diff-check phù hợp, ghi command, môi trường, commit, exit code và log scrubbed;
- kết thúc bằng danh sách file thay đổi, quyết định còn mở, rủi ro, kết quả verification thực tế và đánh giá GO/HOLD/NO-GO;
- chỉ handoff Phase 1 khi toàn bộ gate Phase 0 có bằng chứng hoặc ghi rõ lý do chưa đạt.
```
