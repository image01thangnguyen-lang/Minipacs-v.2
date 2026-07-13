# VRPACS Phase 14 - Enterprise Interoperability, Multi-Site HA/DR Plan

Updated: 2026-07-13  
Status: planned; shared event/identity/facility/report contracts must be frozen first

## 1. Objective

Operate safely across facilities and integration partners with versioned standards adapters, strong isolation, durable messaging, tested high availability, backup/restore and disaster recovery.

## 2. Scope

- REST, HL7 v2, FHIR and DICOMweb adapter gateway where deployment profiles require them.
- Contract/mapping versions, validation, idempotency, ordering, correlation, retry, dead-letter, replay and reconciliation.
- OIDC/SAML options where required; privileged MFA, service accounts, key rotation and break-glass controls.
- Organization/facility partition enforcement across all clinical, quality, analytics, export/share and admin paths.
- Multi-site endpoint/storage/worker routing, health and failover/failback policy.
- Backup manifests/checksums, off-site/immutable policy, isolated restore and recovery automation.
- Service-tier RPO/RTO, DR drills and capacity planning.

Unsupported profiles are not advertised. This phase does not promise universal interoperability without deployment-specific conformance testing.

## 3. PR Plan

### PR 14.1 - Contract Registry And Integration Gateway

- Endpoint profiles, schema/map versions, validation, secret references, test connection, activation and audit.

### PR 14.2 - Durable Inbox/Outbox Messaging

- Atomic enqueue, idempotent receive/send, ordering contract, retries, dead-letter UI, bounded replay and reconciliation.

### PR 14.3 - Enterprise Identity And Privileged Access

- Federation adapter and group/role mapping preview.
- MFA for privileged actions, time-bounded break glass, service account lifecycle and key rotation.

### PR 14.4 - Multi-Site Isolation And Routing

- Shared organization/facility scope enforcement for list/count/detail/aggregate/export/job/notification/mutation.
- Health-aware DICOM/HIS/storage/worker routing with explicit failover ownership.

### PR 14.5 - HA, Backup And Restore Automation

- HA topology, backup manifests/checksums, age/health alerts, point-in-time recovery where supported, isolated restore and reconciliation.

### PR 14.6 - DR And Capacity Qualification

- Failure injection, site isolation, failover/failback, queue replay, restore, data/object reconciliation, load/soak and growth forecasts.

## 4. Security And Isolation Rules

- Secrets live in approved secret references, never DB/UI plaintext or logs.
- Mapping preview uses synthetic/redacted samples unless explicitly protected.
- Replays are scoped, rate-limited, reasoned, audited and idempotent.
- Break glass is time-bounded, justified, alerted and reviewed.
- Cross-site failover never broadens user scope.

## 5. Recovery Contracts

Define per service: owner, dependencies, RPO, RTO, health signal, failover trigger, data-loss window, recovery order, reconciliation, failback criteria and communication. Recovery is incomplete until database records, reports, DICOM/non-DICOM objects, messages and audit are reconciled.

## 6. Acceptance Criteria

1. Duplicate inbound/outbound messages are idempotent and traceable.
2. Mapping changes are versioned, previewed and rollback-capable.
3. Sensitive-path tests show no cross-facility leakage.
4. Privileged/break-glass/service accounts meet lifecycle and audit policy.
5. Isolated restoration verifies clinical/report/object counts and checksums.
6. Observed DR meets signed RPO/RTO.
7. Failback preserves clinically material ordering and does not lose/duplicate messages.
8. Capacity headroom, alerts and scale triggers are accepted.

## 7. Rollout And Rollback

Synthetic certification -> shadow messaging -> one non-critical interface -> facility pilot -> controlled routing/HA -> DR drill -> progressive adoption. Rollback disables the new route/adapter, quarantines messages, restores the prior endpoint, replays idempotently and reconciles. Never delete dead-letter or recovery evidence during an incident.

## 8. Required Evidence

Complete `VRPACS_PHASE14_ACCEPTANCE_EVIDENCE.md` with conformance profiles, isolation matrix, identity review, message fault tests, restore manifests, DR timeline, RPO/RTO results, capacity report, runbooks and sign-off.

## 9. Prompt bàn giao cho AI coding agent

Sao chép nguyên khối prompt dưới đây để giao Phase 14 cho AI/coding agent khác. Các hạng mục HA/DR, identity federation và interoperability chỉ được tuyên bố đạt khi đã kiểm thử trên hạ tầng/profile thật tương ứng.

```text
Bạn là coding agent làm việc trong repository MiniPACS/VRPACS. Hãy triển khai Phase 14 - Enterprise Interoperability, Multi-Site HA/DR theo:

docs/VRPACS_PHASE14_ENTERPRISE_INTEROPERABILITY_HA_DR_PLAN.md

Điều kiện bắt đầu:

- Đọc git status, deployment topology, compose/config, schema, authz và integration code thật trước khi sửa.
- Xác minh event/identity/facility/report contracts cần thiết từ Phase 12-13 đã frozen/accepted. Nếu chưa, chỉ làm additive adapter/shadow path và ghi blocker; không giả vờ production cutover hay DR sign-off.
- Không revert/overwrite thay đổi hiện hữu. Không chạy failover, restore, key rotation hoặc destructive command trên môi trường thật nếu chưa có phê duyệt rõ ràng.
- Thực hiện PR 14.1 đến 14.6 theo thứ tự, reviewable và có rollback; không dùng một mock UI hoặc tài liệu để tuyên bố HA/DR đã hoạt động.

Đọc tối thiểu:

- docs/VRPACS_PHASE14_ENTERPRISE_INTEROPERABILITY_HA_DR_PLAN.md
- docs/VRPACS_PHASE14_ACCEPTANCE_EVIDENCE.md
- docs/VRPACS_PHASE12_ACCEPTANCE_EVIDENCE.md
- docs/VRPACS_PHASE13_ACCEPTANCE_EVIDENCE.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md
- docs/DICOM_OBJECT_STRATEGY.md
- docs/runbooks/**
- docker-compose.yml, dashboard/Dockerfile, dashboard/next.config.mjs
- config/** và config_templates/** nhưng không in/commit secret thật
- dashboard/prisma/schema.prisma và migrations
- dashboard/auth.ts, dashboard/auth.config.ts, dashboard/middleware.ts
- dashboard/lib/authz/scope/**
- dashboard/lib/telemetry/**
- dashboard integration/HIS/DICOMweb/share/export code hiện có
- Orthanc/OHIF routing configuration hiện có

Mục tiêu bắt buộc:

1. PR 14.1: versioned contract/mapping registry và integration gateway cho đúng các REST/HL7 v2/FHIR/DICOMweb deployment profiles đã xác định; validation, test connection, activation, secret references và audit.
2. PR 14.2: durable inbox/outbox với atomic enqueue, idempotent receive/send, ordering contract, bounded retry, dead-letter UI, replay có kiểm soát và reconciliation.
3. PR 14.3: enterprise identity adapters theo nhu cầu deployment, mapping preview, privileged MFA enforcement, time-bounded break glass, service-account lifecycle và key rotation contract.
4. PR 14.4: organization/facility isolation dùng chung cho list/count/detail/aggregate/export/job/notification/mutation và health-aware site routing; failover không được mở rộng quyền user.
5. PR 14.5: HA/backup/restore automation có manifest/checksum/age/health, protected off-site/immutable policy abstraction, isolated restore và record/object/report/message/audit reconciliation.
6. PR 14.6: failure injection, site isolation, failover/failback, queue replay, restore, reconciliation, load/soak và capacity forecast; đo RPO/RTO thực tế so với service-tier contract.

Ràng buộc security, interoperability và operations:

- Chỉ advertise profile đã có version, fixture và conformance result. Unsupported profile phải fail closed và hiển thị rõ.
- Không lưu secret/token/password/private key plaintext trong DB, source, UI, log hoặc evidence; chỉ lưu approved secret reference và metadata an toàn.
- Mapping preview mặc định synthetic/redacted. Không đưa raw PHI/message/report body vào generic logs hoặc ticket/evidence.
- Message handling phải idempotent, traceable và có correlation; duplicate/retry/replay/failback không được mất hoặc nhân đôi clinically material message.
- Replay cần permission, reason, bounded scope/rate, audit và reconciliation. Không xóa dead-letter/recovery evidence trong incident.
- Break glass phải time-bounded, justified, alerted, reviewed và không bypass audit. Service account không dùng interactive user semantics.
- Scope enforcement phải ở server/data query; UI filtering không đủ. Viết negative tests cho wrong org/facility, guessed ID và failover route.
- Recovery chưa hoàn tất nếu chưa reconcile database, report revisions, DICOM/non-DICOM objects, messages và audit.
- Không tự chọn RPO/RTO, retention, IdP protocol hoặc endpoint profile khi tài liệu/deployment owner chưa chốt; nêu câu hỏi/blocker.
- Migration/config additive, reviewable và có rollback. Không chạy prisma db push, production migration, restore/failover hoặc network mutation ngoài test sandbox khi chưa được duyệt.
- Evidence phải phân biệt SIMULATED, SANDBOX, STAGING và PRODUCTION; không biến kết quả mock thành HA/DR/conformance sign-off.

Kiểm thử tối thiểu:

- Contract/mapping version, malformed message, duplicate, ordering, retry, dead-letter, replay và reconciliation fixtures.
- Authentication mapping, revoked group, privileged MFA, expired break glass, service-account/key-rotation tests.
- Cross-facility/cross-site/IDOR negative matrix cho mọi sensitive path.
- Adapter outage, worker crash, network partition, site isolation và failover/failback ordering tests trong sandbox.
- Backup manifest/checksum/tamper/age và isolated restore reconciliation tests; không test restore trực tiếp trên production.
- Load/soak/capacity measurements và queue recovery under failure.
- Secret/PHI log scan, Prisma validation và config validation.
- Trong dashboard chạy các script tồn tại, tối thiểu: npm run check:ui-style; npm run lint; npm test; npm run build. Trên PowerShell dùng ';' và $LASTEXITCODE, không dùng '&&'. Chạy thêm compose/config validation và integration-specific tests nếu repo cung cấp.
- Cập nhật docs/VRPACS_PHASE14_ACCEPTANCE_EVIDENCE.md bằng environment, command/output, timestamps, observed RPO/RTO, manifest/digest và approver thật; mục chưa chạy ghi NOT RUN/BLOCKED.

Cách làm và bàn giao:

- Lập topology/profile/dependency inventory và threat/failure matrix trước khi code.
- Sau mỗi PR review authz, secret handling, idempotency, migration/config compatibility, observability và rollback.
- Dừng hỏi khi cần thông tin IdP, endpoint/profile, DNS/load balancer, storage, backup target, certificate, RPO/RTO hoặc production topology chưa có.
- Chỉ kết luận Phase 14 hoàn tất khi acceptance criteria có evidence từ environment phù hợp; nếu chỉ có local/sandbox, báo partial completion và liệt kê qualification còn thiếu.

Kết quả cuối phải gồm files changed; profiles/topology thực sự hỗ trợ; schema/config/secret-reference notes; isolation and message guarantees; tests và môi trường đã chạy; backup/restore/DR results; observed RPO/RTO/capacity; runbooks/rollout/rollback; blockers/limitations/residual risks; acceptance evidence cập nhật trung thực.
```
