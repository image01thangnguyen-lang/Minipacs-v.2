# VRPACS Phase 13 - Clinical Governance And Structured Reporting Plan

Updated: 2026-07-13  
Status: planned; depends on accepted Phase 11 and stable Phase 12 contracts

## 1. Objective

Mature peer review, critical-result governance, QC/dose oversight and structured reporting while preserving immutable report revisions and explicit clinician control.

## 2. Scope

- Versioned peer-review programs, sampling, exclusions, assignment and fairness governance.
- Quality committee and corrective/preventive action (CAPA) workflow.
- Critical-result policy sets, escalation rosters, channels and downtime fallback.
- Radiation dose/exposure registry where supported DICOM metadata or RDSR exists.
- Versioned structured report sections, codes, measurements and key-image references.
- Deployment-gated DICOM SR and FHIR DiagnosticReport/Observation export.
- Provenance and correction/addendum reconciliation across PDF, HIS, SR and FHIR.

Out of scope: autonomous diagnosis, automatic report finalization, automatic rewriting/unfinalizing of final reports, unsupported regulatory claims.

## 3. PR Plan

### PR 13.1 - Peer Review Program Configuration

- Version sampling policies by modality/specialty/facility.
- Add conflict exclusions, blinded mode, due date, assignment and sampling reproducibility.
- Protect reviewer confidentiality and prohibit misleading ranking.

### PR 13.2 - Committee And CAPA

- Restricted case packet, agenda, decision, actions, owner, due date, evidence and approval-based closure.
- Link incidents/discrepancies without mutating source report history.

### PR 13.3 - Critical Result Policy Maturity

- Finding categories, severity, recipients, acknowledgement SLA, escalation roster/channel and downtime procedure.
- Idempotent delivery/escalation and immutable communication timeline.

### PR 13.4 - Dose And QC Registry

- Parse supported source fields/RDSR with parser version, units, conversion and provenance.
- Configure reference levels; show completeness and qualified/estimated state.
- Add scoped outlier/trend/drilldown views.

### PR 13.5 - Structured Report Model And Editor Bridge

- Version schemas/sections/codes.
- Bind persisted measurements and key images to exact report revision.
- Validate and preview; clinician explicitly finalizes content.

### PR 13.6 - DICOM SR/FHIR Export

- Capability-profiled adapters, conformance fixtures, delivery/retry/version history.
- Prevent stale revision export and reconcile corrections/addenda.

### PR 13.7 - Clinical Safety Qualification

- Specialty fixtures, amendment tests, source/provenance checks, confidentiality, escalation/channel failure and downtime drills.

## 4. State And Safety Rules

- A review always points to the report revision actually reviewed.
- A discrepancy may request clinical follow-up but cannot edit/unfinalize a report.
- CAPA closure needs owner, evidence and authorized approver.
- A corrected/addended report creates a new outbound artifact/version.
- Dose values always preserve source, unit, conversion and parser version.
- Unsupported or incomplete data is visible; no fabricated normal value.

## 5. Authorization And Audit

Separate permissions for peer-review assignment/review/confidential detail, committee packet, CAPA approval, critical-result action, dose detail, structured-template admin and standards export. Scope all lists, counts, detail, exports and jobs. Audit policy version, actor, reason, report revision and state transition with PHI-safe generic logs.

## 6. Acceptance Criteria

1. Sampling is reproducible, conflict-aware and versioned.
2. Reviewer confidentiality and facility scope pass negative tests.
3. CAPA closure rules and evidence are enforced server-side.
4. Critical-result primary-channel failure triggers tested fallback/escalation.
5. Dose provenance/unit/completeness are preserved.
6. Structured outputs reference the exact finalized report revision.
7. Corrections/addenda produce a new traceable output version.
8. Every enabled SR/FHIR profile passes conformance fixtures.
9. No system path autonomously changes diagnostic/final content.

## 7. Rollout

Policy/schema dark launch -> internal quality pilot -> one specialty/facility -> shadow SR/FHIR generation without delivery -> conformance sign-off -> controlled delivery -> expansion. Disable new policy/export workers first during rollback; preserve all clinical/audit history and reconcile outbound versions.

## 8. Required Evidence

Complete `VRPACS_PHASE13_ACCEPTANCE_EVIDENCE.md` with clinical safety review, immutable-revision tests, policy fixtures, conformance artifacts, downtime drill, authorization matrix, performance results, pilot and sign-off.

## 9. Prompt bàn giao cho AI coding agent

Sao chép nguyên khối prompt dưới đây để giao Phase 13 cho AI/coding agent khác. Không được dùng prompt này để tự động hóa quyết định chẩn đoán hoặc bỏ qua clinician sign-off.

```text
Bạn là coding agent làm việc trong repository MiniPACS/VRPACS. Hãy triển khai Phase 13 - Clinical Governance And Structured Reporting theo:

docs/VRPACS_PHASE13_CLINICAL_GOVERNANCE_STRUCTURED_REPORTING_PLAN.md

Điều kiện bắt đầu:

- Đọc git status và khảo sát code/schema/workflow thật trước khi chỉnh sửa.
- Xác minh Phase 11 đã accepted và các contract Phase 12 cần dùng đã ổn định. Nếu dependency chưa đạt, chỉ làm additive/dark-launch an toàn và ghi blocker; không tự tuyên bố clinical rollout.
- Không revert hoặc ghi đè thay đổi hiện hữu.
- Chia công việc thành PR 13.1 đến 13.7 theo đúng thứ tự; không làm một patch khổng lồ và không coi docs/UI placeholder là implementation hoàn tất.

Đọc tối thiểu:

- docs/VRPACS_PHASE13_CLINICAL_GOVERNANCE_STRUCTURED_REPORTING_PLAN.md
- docs/VRPACS_PHASE13_ACCEPTANCE_EVIDENCE.md
- docs/VRPACS_PHASE11_COMPLETION_EVIDENCE.md
- docs/VRPACS_PHASE12_ACCEPTANCE_EVIDENCE.md
- docs/VRPACS_PHASE11_QUALITY_ANALYTICS_CLINICAL_GOVERNANCE_PLAN.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md
- docs/DICOM_OBJECT_STRATEGY.md
- dashboard/prisma/schema.prisma và migrations
- dashboard/lib/qualityService.ts
- dashboard/lib/alertService.ts
- dashboard/lib/workspace/report-workspace.ts
- dashboard/app/report/**
- dashboard/app/quality/**
- dashboard/app/components/workspace/**
- dashboard/lib/authz/scope/**
- các implementation measurement, key image, DICOM SR/FHIR hiện có trong dashboard và ohif-viewer

Mục tiêu bắt buộc:

1. PR 13.1: peer-review program versioned theo facility/modality/specialty; sampling reproducible, conflict-aware, có exclusion, blinded/confidential mode, assignment/due date và fairness governance.
2. PR 13.2: restricted committee/CAPA workflow có immutable case link, agenda/decision/action owner/due date/evidence, approval-based closure; không mutate source report history.
3. PR 13.3: critical-result policy versioned với category/severity/recipient/SLA/roster/channel/downtime fallback; delivery và escalation idempotent, communication timeline immutable.
4. PR 13.4: dose/QC registry chỉ từ metadata/RDSR thực sự được hỗ trợ; giữ source, unit, conversion, parser version, completeness và qualified/estimated state; có scoped trend/outlier/drilldown.
5. PR 13.5: structured report schema/section/code versioned; bridge persisted measurement/key image vào đúng report revision; validation và preview nhưng clinician phải chủ động finalize.
6. PR 13.6: capability-profiled DICOM SR/FHIR DiagnosticReport/Observation adapters, conformance fixtures, delivery/retry/version history; chặn export stale revision và reconcile correction/addendum.
7. PR 13.7: clinical-safety qualification, specialty fixtures, amendment/provenance/confidentiality tests, channel-failure/downtime drills và evidence.

Ràng buộc clinical, security và dữ liệu:

- Không tạo AI diagnosis, autonomous interpretation, auto-finalize, auto-unfinalize hoặc auto-rewrite nội dung chẩn đoán.
- Peer review/discrepancy/CAPA chỉ tham chiếu revision đã review; không sửa report gốc. Clinical follow-up phải là workflow explicit có người chịu trách nhiệm.
- Final/addendum/correction luôn tạo revision/outbound artifact mới và giữ provenance; tuyệt đối không ghi đè lịch sử đã final.
- CAPA closure phải enforce server-side owner + evidence + authorized approver.
- Reviewer identity/confidential detail, committee packet, dose detail, template admin và standards export cần permission riêng và object/facility scope.
- Scope mọi list/count/detail/export/job; thêm negative IDOR/wrong-facility tests.
- Dữ liệu dose thiếu/unsupported phải hiện là thiếu/unsupported; không điền giá trị bình thường giả. Không tuyên bố hỗ trợ profile DICOM SR/FHIR/RDSR chưa qua fixture/conformance.
- Delivery/escalation phải idempotent; lỗi channel chính phải kích hoạt fallback đã cấu hình, không spam và không mất timeline.
- Audit state transition, actor, reason, policy/template version và report revision; log chung phải PHI-safe.
- Migration additive/reviewable; không prisma db push hoặc destructive migration trên DB thật.
- Tái sử dụng shared UI, navigation, permission và scope patterns; UI không được hiện action backend sẽ từ chối nhưng backend vẫn là nguồn enforce chính.
- Evidence chỉ ghi kết quả đã thực sự chạy; mục chưa chạy ghi NOT RUN/BLOCKED, không giả clinical sign-off hoặc conformance pass.

Kiểm thử tối thiểu:

- Deterministic sampling/version/conflict/confidentiality tests.
- CAPA transition/closure/authorization/concurrency tests.
- Critical-result duplicate/retry/escalation/channel failure/downtime tests.
- Dose parser unit/conversion/provenance/incomplete/unsupported fixtures.
- Exact report revision, stale export, correction/addendum và immutable-history tests.
- DICOM SR/FHIR profile fixture/schema/conformance tests cho từng profile được enable.
- Scope/IDOR/PHI-log negative tests và accessibility checks cho UI mới.
- Prisma format/validate/generate bằng test DATABASE_URL.
- Trong dashboard chạy script hiện có, tối thiểu: npm run check:ui-style; npm run lint; npm test; npm run build. Trên PowerShell dùng ';' và $LASTEXITCODE, không dùng '&&'.
- Cập nhật docs/VRPACS_PHASE13_ACCEPTANCE_EVIDENCE.md với command/output thật, manual QA, clinical reviewer/owner còn thiếu và limitation.

Cách làm và bàn giao:

- Bắt đầu bằng gap inventory và file-level implementation plan dựa trên code thật.
- Sau mỗi PR chạy test liên quan, review schema/migration/authz/audit và git diff.
- Dừng để hỏi khi profile chuẩn, clinical policy, confidentiality, retention hoặc workflow state chưa được chốt; không tự suy diễn chính sách lâm sàng.
- Chỉ kết luận Phase 13 hoàn tất khi toàn bộ acceptance criteria có evidence tái tạo được; nếu chưa, báo partial completion rõ ràng.

Kết quả cuối phải gồm files changed; behavior/UI; migrations/config; state machines và revision/provenance model; permission/scope matrix; profiles thực sự hỗ trợ; tests/build/manual QA; rollout/rollback; blockers, limitations và residual clinical risks; acceptance evidence cập nhật trung thực.
```
