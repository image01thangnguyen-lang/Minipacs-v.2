# VRPACS Phase 15 - Final Validation And Program Closure Plan

Updated: 2026-07-13  
Status: planned; begins after Phases 11-14 are accepted

## 1. Objective

Freeze scope, validate MiniPACS/VRPACS as a complete operated system, roll out safely, transfer ownership and close the original gap roadmap with auditable evidence and accepted residual risk.

## 2. Entry Gates

- Phase 11-14 acceptance reports signed.
- No unresolved critical/high patient-safety, integrity, scope, privacy or availability defect.
- Supported deployment/integration/browser/device matrix frozen.
- Feature, schema, configuration and migration inventory frozen.
- Final traceability matrix has no ownerless gap.

## 3. Release Work Packages

### PR 15.1 - Traceability And Scope Freeze

- Map original VRPACS gap -> requirement -> phase/PR -> code/config/migration -> automated/manual evidence -> owner -> residual risk.
- Classify every item accepted, accepted with limitation or formally deferred.
- New features require formal change control.

### PR 15.2 - Security, Privacy And Supply Chain

- Threat model, privacy impact, sensitive-path review, secrets scan, dependency/container/SBOM/provenance and penetration-test remediation.
- Review audit/retention, break glass, exports, share links, uploads and destructive operations.

### PR 15.3 - End-To-End Qualification Automation

- Consolidate deterministic fixtures and regression scripts for DICOM, HIS, reports, viewer, non-DICOM, consultation/share, export/retention, quality, analytics, integration and multi-site.
- Generate immutable result artifacts tied to release digest.

### PR 15.4 - Clinical And Operational UAT

- Role-based normal/error/downtime workflows.
- Clinical safety case, accessibility, supported browser/device and runbook drills.
- Triage defects by safety/integrity/privacy/SLO impact.

### PR 15.5 - Release Candidate And Pilot

- Freeze artifact/config/migrations; migration and rollback rehearsal.
- Pilot trained users/facility; monitor safety, integrity, security and SLO gates.

### PR 15.6 - Progressive Rollout And Hypercare

- Expand by facility/cohort only after observation gates.
- Daily reconciliation and risk review; stop/rollback automatically on defined triggers.

### PR 15.7 - Final Acceptance And Handoff

- Archive evidence/config/conformance/release notes/migration record.
- Transfer service, data, integration, clinical, security and support ownership.
- Accept residual risks and publish final report.

## 4. Full-System Test Matrix

- Clinical: order/check-in/read/final/addendum/delivery/archive; critical result; peer review; QC.
- Imaging: DICOM ingest/MWL/DICOMweb/viewer large study/cine/measurement/key image/SR where enabled.
- Integration: HIS and enabled HL7/FHIR/REST paths, duplicate/retry/outage/replay/correction.
- Extended: non-DICOM, consultation, protected share, export, retention and destructive safeguards.
- Security/privacy: IDOR, scope, session, CSRF, injection, upload/SSRF, PHI logs, secrets and audit.
- Resilience: worker/DB/object/integration outage, backup restore, failover/failback, downtime and reconciliation.
- Quality: accessibility, browser/device, performance/load/soak/chaos and storage growth.

## 5. Stop/Rollback Triggers

- Wrong patient/study/report revision/recipient/status.
- Cross-facility or PHI exposure.
- Lost/duplicate clinically material message or critical alert.
- Migration/object divergence or failed reconciliation.
- Critical-path observability blind spot.
- SLO or capacity breach threatening clinical operation.
- Recovery outside approved RPO/RTO.

## 6. Rollout

Dark deployment -> internal smoke -> pilot facility -> limited cohort -> additional facilities -> GA -> hypercare -> steady-state handoff. At each gate, verify health/SLO, clinical safety signals, queue/message reconciliation, audit, support readiness and rollback capability.

## 7. Closure Deliverables

- Final traceability and residual-risk registers.
- Security/privacy/clinical safety and conformance packages.
- Full automated/manual/UAT/performance/DR evidence.
- Immutable artifacts, digests, SBOM, config and migration baseline.
- Role training/competency records and all runbooks.
- Release notes, known limitations, owner/on-call/escalation matrix.
- `VRPACS_PHASE15_FINAL_ACCEPTANCE_REPORT.md` signed.

## 8. Definition Of Program Closed

The program is closed only when all in-scope gaps have a formal outcome, all gates pass, required owners sign, operational ownership is active, evidence is reproducible, and residual risks/unsupported capabilities are explicit. Shipping an artifact alone is not closure.

## 9. Prompt bàn giao cho AI validation/closure agent

Sao chép nguyên khối prompt dưới đây để giao Phase 15 cho AI/validation agent khác. Agent được phép tự động hóa kiểm tra và tổng hợp evidence nhưng không được giả chữ ký, phê duyệt, UAT, penetration test, DR drill hoặc production rollout.

```text
Bạn là validation/closure agent làm việc trong repository MiniPACS/VRPACS. Hãy thực hiện Phase 15 - Final Validation And Program Closure theo:

docs/VRPACS_PHASE15_FINAL_VALIDATION_PROGRAM_CLOSURE_PLAN.md

Nguyên tắc đầu tiên:

- Phase 15 không phải phase thêm feature tùy ý. Trước hết freeze scope và tạo traceability; defect phát hiện được sửa bằng change-control/review unit nhỏ, sau đó rerun affected qualification.
- Đọc git status và không revert/overwrite thay đổi hiện hữu.
- Xác minh acceptance report/evidence Phase 11-14 và entry gates bằng artifact thật. Nếu bất kỳ gate nào chưa đạt, đánh dấu BLOCKED/PARTIAL và lập remediation plan; không tự ký hoặc tuyên bố program closed.
- Không chạy migration, destructive test, failover, restore, security scan chủ động vào target thật, rollout hoặc rollback nếu chưa có environment và phê duyệt phù hợp.

Đọc tối thiểu:

- docs/VRPACS_PHASE15_FINAL_VALIDATION_PROGRAM_CLOSURE_PLAN.md
- docs/VRPACS_PHASE15_FINAL_ACCEPTANCE_REPORT.md
- docs/VRPACS_PHASE11_COMPLETION_EVIDENCE.md
- docs/VRPACS_PHASE12_ACCEPTANCE_EVIDENCE.md
- docs/VRPACS_PHASE13_ACCEPTANCE_EVIDENCE.md
- docs/VRPACS_PHASE14_ACCEPTANCE_EVIDENCE.md
- docs/VRPACS_GAP_ANALYSIS_ROADMAP.md
- docs/VRPACS_IMPLEMENTATION_BACKLOG.md
- docs/VRPACS_FEATURE_INVENTORY.md
- docs/VRPACS_MINIPACS_CAPABILITY_MATRIX.md
- docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md
- docs/VRPACS_TERMINOLOGY_MAP.md
- docs/runbooks/** và tất cả phase completion/QA/evidence liên quan
- git history/status/diff, package manifests, lockfiles, migrations, Docker/compose/config/release files và CI/test scripts

Thực hiện theo work package PR 15.1 đến 15.7:

1. Traceability/scope freeze: map từng original gap -> requirement -> phase/PR -> code/config/migration -> automated/manual evidence -> owner -> residual risk. Mọi mục phải là accepted, accepted-with-limitation hoặc formally deferred; không để ownerless gap.
2. Security/privacy/supply chain: threat/privacy review, sensitive-path regression, secret/PHI-log checks, dependency/container/SBOM/provenance results và remediation tracking. Không tự tuyên bố pentest pass nếu chưa có pentest độc lập.
3. End-to-end qualification automation: hợp nhất deterministic fixtures/scripts cho DICOM, HIS, report/revision, viewer, non-DICOM, consultation/share, export/retention, quality/analytics, integration và multi-site; artifacts phải gắn với commit/release digest.
4. Clinical/operational UAT: chuẩn bị và chạy phần có thể tự động; role-based normal/error/downtime scenarios, accessibility/browser/device/runbook drills cần người/ môi trường phù hợp. Ghi rõ executor, environment và approver thật.
5. Release candidate/pilot: freeze artifact/config/migration inventory, rehearsal migration/rollback trên environment được duyệt, pilot gates và observability/reconciliation. Không triển khai production nếu user chưa yêu cầu/phê duyệt rõ.
6. Progressive rollout/hypercare: tạo/kiểm tra gate, stop trigger, cohort/facility sequence, daily reconciliation và rollback readiness; chỉ ghi rollout đã chạy khi có telemetry/evidence thật.
7. Final acceptance/handoff: archive evidence/digest/SBOM/config/conformance/migration record; owner/on-call/escalation/training/runbook handoff; residual-risk acceptance và chữ ký phải do người có thẩm quyền cung cấp.

Ràng buộc validation:

- Không sửa test để che defect, nới lỏng assertion/authz/scope hoặc loại bỏ failing scenario mà không có approved rationale.
- Không dùng fabricated data/result/date/signature. Phân biệt PASS, FAIL, BLOCKED, NOT RUN và NOT APPLICABLE kèm lý do/evidence link.
- Mỗi artifact phải có timestamp, environment, command/tool version, commit/release digest và checksum khi phù hợp.
- Kiểm tra server-side authz/object/facility scope, IDOR, PHI logs, secret leakage, immutable report revision, idempotency/reconciliation và destructive safeguards.
- Stop ngay và báo blocker khi thấy wrong patient/study/report revision/recipient/status, cross-facility/PHI exposure, lost/duplicate clinically material message, migration/object divergence, observability blind spot nghiêm trọng hoặc recovery vượt RPO/RTO.
- Không gọi capability là supported nếu chưa có implementation + test + runbook + owner + deployment qualification tương ứng.
- Không đóng program chỉ vì build pass; cần đủ clinical, operational, security, integrity, resilience, evidence và ownership gates.

Kiểm thử và evidence tối thiểu:

- Inventory chính xác các script trong package.json/CI trước khi chạy. Chạy full unit/integration/regression/type/lint/UI-style/build suites của dashboard và các test suites liên quan ở repo root/OHIF nếu thuộc supported matrix.
- Với dashboard tối thiểu chạy: npm run check:ui-style; npm run lint; npm test; npm run build. Trên PowerShell dùng ';' và kiểm tra $LASTEXITCODE, không dùng '&&'.
- Prisma format/validate/generate và migration status/rehearsal chỉ với DATABASE_URL/environment test được duyệt; không dùng prisma db push để thay migration review.
- Chạy authorization/security regression, deterministic E2E fixtures, accessibility, browser/device matrix, performance/load/soak/chaos, backup/restore/DR và conformance tests theo environment availability.
- Ghi output/artifact path/checksum và tất cả failure/waiver. Rerun test bị ảnh hưởng sau remediation; không chỉ rerun riêng test đã fail nếu thay đổi có blast radius rộng.
- Hoàn thiện docs/VRPACS_PHASE15_FINAL_ACCEPTANCE_REPORT.md trung thực; chữ ký chưa có phải để PENDING/BLOCKED với role/owner, không giả tên hoặc approval.

Cách làm:

- Bắt đầu bằng entry-gate report và traceability gap list, sau đó trình kế hoạch validation/remediation trước khi thay đổi lớn.
- Tách remediation thành patch/PR nhỏ; review diff và chạy regression liên quan sau mỗi patch.
- Dừng hỏi user khi cần production/staging access, test account, real integration endpoint, clinical reviewer, security reviewer, DR owner, pilot cohort hoặc approval.
- Nếu không có đủ hạ tầng/người ký, hoàn tất tối đa phần có thể tái tạo trong repo rồi bàn giao blocker/action owner; không tuyên bố GA/program closure.

Kết quả cuối cùng phải gồm:

- Entry-gate status và final traceability summary.
- Files/remediations changed và lý do.
- Release commit/digest, config/migration/SBOM/conformance inventory.
- Test/UAT/security/performance/DR matrix với PASS/FAIL/BLOCKED/NOT RUN và evidence paths.
- Pilot/rollout/hypercare status thực tế, stop/rollback readiness.
- Known limitations, deferred items, residual risks, owner và due date.
- Operational ownership, training, on-call/escalation và sign-off status.
- Kết luận rõ: CLOSED, NOT CLOSED hoặc CONDITIONALLY ACCEPTED; chỉ dùng CLOSED khi Definition Of Program Closed thực sự đạt.
```
