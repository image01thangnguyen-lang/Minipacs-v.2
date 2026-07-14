# Phase 8 — Cleanup, Final Validation và Progressive Cutover

## Mục tiêu

Đóng migration bằng evidence, cleanup có kiểm soát và rollout an toàn thay vì chỉ “đã đổi giao diện”.

## Cleanup

- Xóa legacy components khi không còn consumer; không xóa adapter domain hữu ích.
- Quét native button/input/select/table và phân loại exception.
- Giữ hoặc gỡ Tailwind dựa trên số usage và bundle evidence; không gỡ nếu workspace/print còn cần.
- Chốt Lucide hay AntD Icons, loại dependency thừa.
- Cấm deep `.ant-*` override không có ADR.
- Cập nhật coding standard, PR template, UI checker và onboarding docs.

## Final validation

- Full build/tests/security/accessibility.
- Visual matrix: 4 viewport × all route states.
- Clinical critical flows và print/PDF golden comparison.
- Dark-room UAT, keyboard-only, reduced motion.
- Load/performance/bundle comparison với Phase 0.
- Authorization matrix và PHI telemetry regression.

## Rollout

1. Internal/dev cohort.
2. QA/staging với UAT fixtures.
3. Pilot facility/role cohort.
4. 10% → 25% → 50% → 100%, có soak time và SLO gate.

Theo dõi: JS errors, hydration, action failures, autosave conflict, viewer launch, report completion time, user rollback request.

## Rollback

- Route/module flags phía server; không chỉ client-hide.
- Giữ legacy implementation một release window cho critical flow.
- Runbook nêu owner, lệnh/config, cache invalidation, data compatibility và communication.
- Thực hiện rollback drill trước 100%.

## Final DoD

- Inventory 100% đóng.
- Exact token/compact rules được automation enforce.
- Không unresolved P0/P1 clinical defect.
- SLO/performance/accessibility đạt gate.
- Clinical/Product/Security/Operations ký acceptance.
- Legacy removal chỉ diễn ra sau soak period thành công.

## Kế hoạch thực thi chi tiết

### PR8.1 — Inventory closure và cleanup an toàn

- Re-scan route/component/native controls/Tailwind/icons/deep `.ant-*`; đối chiếu Phase 0 inventory.
- Mỗi item phải migrated/exception/decommissioned với owner/ADR/expiry.
- Dùng dependency graph trước khi xóa component/package; chạy build sau từng nhóm cleanup.
- Không xóa legacy critical implementation trước khi rollback window kết thúc.

### PR8.2 — Release candidate validation

- CI full: lint/typecheck/unit/integration/e2e/security/a11y/build/UI guard.
- Visual matrix 4 viewport × all states; print/PDF golden; reduced motion.
- Critical journey test bằng role/scope khác nhau và UAT fixture phi định danh.
- So sánh Phase 0: bundle, interaction, memory, row density, task time/error.
- Pentest focus: authz vẫn server-enforced, URL/data leakage, PHI telemetry và dependency advisories.

### PR8.3 — Progressive rollout

- Server-side flags, cohort assignment ổn định và kill switch đã test.
- Mỗi nấc có owner, start/end, minimum soak, SLO/error thresholds và decision log.
- Dừng/rollback tự động hoặc thủ công khi hydration/JS/action/autosave/viewer/report metrics vượt ngưỡng.
- Communication/runbook cho helpdesk, bác sĩ, operations.

### PR8.4 — Closure

- Sau 100% + soak: signoff Clinical/Product/Security/Ops.
- Chỉ sau đó xóa legacy flags/code, cập nhật architecture/onboarding và dependency policy.
- Lưu final traceability và known limitations; tạo backlog không-blocking riêng.

## Release artifacts

`FINAL_INVENTORY.md`, `RC_TEST_REPORT.md`, `VISUAL_A11Y_REPORT.md`, `PERFORMANCE_COMPARISON.md`, `CLINICAL_UAT_SIGNOFF.md`, `SECURITY_SIGNOFF.md`, `ROLLOUT_DECISION_LOG.md`, `ROLLBACK_RUNBOOK.md`, `FINAL_ACCEPTANCE.md`.

## Prompt giao cho AI thực thi Phase 8

```text
Bạn là Release Lead/Principal Frontend Engineer. Hãy thực thi DUY NHẤT Phase 8 theo docs/antd-migration/PHASE_8_VALIDATION_CUTOVER.md. Chỉ bắt đầu khi Phase 0–7 đều có GO/evidence; nếu thiếu clinical/security signoff, báo blocker, không hợp thức hóa.

Đóng inventory bằng scan thực tế; phân loại mọi route/component/native control/deep override/dependency. Cleanup theo dependency graph, giữ legacy critical code hết rollback window. Chạy full lint/typecheck/unit/integration/e2e/security/a11y/build/UI check, visual matrix, print golden và critical clinical journeys. So sánh bundle/performance/memory/density/task metrics với Phase 0; không bịa số hoặc chữ ký.

Chuẩn bị server-side flags, stable cohorts, telemetry thresholds, kill switch và rollback runbook; thực hiện rollout internal→pilot→10→25→50→100% chỉ khi từng soak gate đạt. AI không được tự tuyên bố production 100% nếu không có môi trường/quyền; khi đó phải bàn giao runbook ở trạng thái READY/PENDING HUMAN APPROVAL. Exact clinical dark/compact rules vẫn là release blocker.

Tạo toàn bộ artifacts trong docs/antd-migration/evidence/phase-8/, ghi commands/exit codes, defects, decisions và signoffs. Kết thúc bằng FINAL GO/NO-GO/READY-PENDING, rollback status, remaining risks và danh sách cleanup chỉ được làm sau soak.
```
