# Phase 0 — Baseline, Inventory và Governance

## Mục tiêu

Biến yêu cầu “chuyển toàn bộ sang AntD” thành backlog đo được, khóa phạm vi và baseline trước khi sửa UI.

## Công việc

1. Lập inventory 62 routes/143 TSX: owner, criticality S/M/L/XL, controls, table, modal, permission, responsive, print.
2. Phân loại bề mặt: Dashboard migration; Doctor Workspace special layout; OHIF branding-only; root Vite migrate/decommission.
3. Chụp baseline 1024×768, 1366×768, 1440×900, 1920×1080 ở loading/empty/populated/error/denied.
4. Đo worklist/workspace: bundle, render, interaction, row count, memory, API timing.
5. Audit keyboard workflow với bác sĩ: search, chọn study, mở viewer, report, ký, ca tiếp theo.
6. Audit dark-room: luminance, contrast, flash nền sáng, overlay ảnh.
7. Tạo ADR: adapter-first, Tailwind coexistence, icon strategy, Table strategy, popup container, date/timezone.
8. Chốt browser, viewport, performance budget, visual tolerance và rollback owner.

## Deliverables

- Route/component inventory CSV/Markdown.
- Screenshot + performance baseline.
- Risk register và dependency map.
- ADRs và ownership/RACI.
- Backlog theo module và estimate đã hiệu chỉnh.

## Gate

- 100% route có disposition và độ phức tạp.
- Clinical owner duyệt workflow/mật độ mục tiêu.
- Không còn câu hỏi về root Vite/OHIF scope.
- Performance, accessibility và visual budgets được ký duyệt.

## Không làm trong phase này

Không cài AntD, không đổi CSS production, không refactor nghiệp vụ.

## Kế hoạch thực thi chi tiết

### Workstream 0.1 — Chốt topology và runtime thật

- Đọc `package.json`, `dashboard/package.json`, Docker/compose, reverse proxy và deployment scripts để xác định frontend nào được build/deploy.
- Vẽ sơ đồ: Next Dashboard ↔ Server Actions/API ↔ Orthanc/OHIF; ghi rõ ownership và authentication boundary.
- Xác minh `src/` Vite có traffic hay chỉ là legacy; không suy luận từ việc file còn tồn tại.
- Xác định OHIF đang dùng image/build nào và extension/custom CSS nào thuộc quyền dự án.

### Workstream 0.2 — Route/component inventory có thể hành động

Tạo `docs/antd-migration/evidence/phase-0/ROUTE_INVENTORY.md` với tối thiểu các cột:

`route | entry file | server/client | shared UI | native controls | table/grid | overlay | forms/actions | authz | print | criticality | complexity | disposition | owner`.

Tạo `COMPONENT_INVENTORY.md` cho `dashboard/app/components`, `dashboard/components` và component cục bộ trong route. Đánh dấu các seam ưu tiên: `AppShell`, `PagePrimitives`, `FilterBar`, `WorkspaceHeader`, `StatusBadge`, `states`, `DataGrid`, `SplitPane`, custom select/date picker/modal.

### Workstream 0.3 — Baseline có số đo

- Chạy build/test/UI checker hiện tại và lưu command, commit, exit code.
- Chụp route đại diện tại 4 viewport; dữ liệu phải là fixture phi định danh.
- Ghi số hàng nhìn thấy, chiều cao toolbar/filter/header, số click/keystroke cho 5 clinical tasks.
- Ghi JS initial/route chunk, React render/interaction và long task của Worklist/Doctor Workspace.
- Ghi các lỗi hiện hữu riêng để không quy kết nhầm cho migration.

### Workstream 0.4 — ADR và risk register

Tạo ADR riêng cho: SSR registry, adapter-first, DataGrid, Tailwind coexistence, icon library, date/timezone, popup container, feature flag/rollback và OHIF boundary. Risk register phải có probability, impact, mitigation, trigger, owner; tối thiểu gồm hydration/FOUC, bundle, grid semantics, Server Action payload, timezone, popup clipping, print CSS, keyboard, permission, PHI telemetry.

### Workstream 0.5 — Backlog và gate review

- Chia route thành wave, dependency và PR có thể rollback độc lập.
- Estimate theo người-ngày, không gộp QA/UAT vào engineering.
- Tổ chức review với Frontend, QA, bác sĩ CĐHA, Security và Operations.
- Chỉ chuyển Phase 1 khi tất cả gate có evidence/link và owner ký.

## Cấu trúc evidence bắt buộc

```text
docs/antd-migration/evidence/phase-0/
  ROUTE_INVENTORY.md
  COMPONENT_INVENTORY.md
  BASELINE_COMMANDS.md
  BASELINE_METRICS.md
  VISUAL_BASELINE.md
  RISK_REGISTER.md
  ADR_INDEX.md
  PHASE_0_ACCEPTANCE.md
```

## Prompt giao cho AI thực thi Phase 0

```text
Bạn là Principal React/Next.js Engineer kiêm UI/UX chuyên hệ thống PACS/RIS. Hãy thực thi DUY NHẤT Phase 0 của chương trình tại docs/antd-migration/PHASE_0_BASELINE_GOVERNANCE.md trong repository hiện tại.

Trước khi làm: đọc docs/antd-migration/README.md, CLINICAL_UI_STANDARD.md, ANT_DESIGN_FULL_MIGRATION_RESEARCH_PLAN.md, package manifests, deployment config và các shared UI hiện có. Không được cài Ant Design, không đổi UI runtime, không refactor nghiệp vụ và không sửa database/API.

Yêu cầu:
1) Xác minh topology/deployment thực tế của Next Dashboard, root Vite và OHIF.
2) Kiểm kê toàn bộ route/component theo đúng schema tài liệu; dùng script/search để tránh bỏ sót.
3) Chạy baseline build/test/check hiện có; ghi command, exit code và lỗi pre-existing.
4) Lập visual/performance/keyboard/dark-room baseline bằng dữ liệu phi định danh; nếu môi trường không cho chụp/đo, ghi BLOCKED + cách tái tạo, không bịa số.
5) Viết ADR index, risk register, backlog waves, estimate và acceptance report vào docs/antd-migration/evidence/phase-0/.
6) Không triển khai Phase 1.

Đầu ra cuối: danh sách file tạo/sửa, kết quả kiểm tra, số route/component đã kiểm kê, các blocker/decision cần người duyệt và kết luận GO/NO-GO có căn cứ. Không tuyên bố hoàn tất nếu thiếu evidence hoặc gate.
```
