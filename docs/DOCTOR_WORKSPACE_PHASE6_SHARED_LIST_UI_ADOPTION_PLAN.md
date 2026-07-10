# Phase 6 — Kế hoạch chi tiết Đồng nhất các trang Danh sách/Lọc

Ngày lập: 2026-07-11  
Thuộc master plan: [DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md](./DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md)  
Phụ thuộc: Phase 3–5 ổn định qua pilot; component đã chứng minh bằng usage thật

## 1. Mục tiêu và nguyên tắc

Trích xuất ngôn ngữ UI đã ổn định thành primitives dùng chung rồi migrate từng module, không ép mọi trang thành 7 vùng và không làm “big bang”. Shared UI không chứa policy nghiệp vụ; mỗi module giữ query/action/permission riêng nhưng dùng chung contract state và accessibility.

## 2. Bộ component đích

- `PageHeader/WorkspaceHeader`, `FilterBar`, `SearchField`, `DateRangePreset`, `FacetPanel`.
- `DataGrid` headless/configurable, column preference, density, pinned/sticky, pagination.
- `StatusBadge` dùng registry theo domain; không tạo một status taxonomy chung sai nghĩa.
- `EmptyState`, `ErrorState`, `AccessDeniedState`, `LoadingSkeleton`.
- `ActionMenu`, confirmation/reason dialog, `SplitPane` khi thật sự cần.

API component typed, controlled state, semantic tokens `--vin-*`, keyboard/ARIA mặc định và escape hatch có review. Không thêm màu hardcode hoặc fork component theo trang.

## 3. Migration waves

1. **Wave 1 — Archive:** gần study grid nhất; giữ delivery/print/export semantics.
2. **Wave 2 — Worklist orders:** giữ order lifecycle/create/edit và server scope.
3. **Wave 3 — Consultations:** giữ lifecycle, urgency và participant permissions.
4. **Wave 4 — Non-DICOM:** giữ upload/finalize/media state và facility scope.
5. **Wave 5 — Statistics/Command Center drilldowns:** chỉ list/drilldown, không ép chart vào DataGrid.
6. **Wave 6 — Admin catalogs/tables:** density/filters/actions; giữ permission/audit/destructive confirmations.

Mỗi wave có inventory before/after, route-level feature flag, parity checklist, visual/a11y/security regression và xóa legacy component chỉ sau soak.

## 4. State và preference

Mỗi page có namespace + schema version; URL chứa shareable filters, server chứa user preferences, component local chỉ chứa ephemeral UI. Column IDs không dùng translated labels. Migration preference phải allowlist/clamp; không đọc preference module khác. `Reset filters` khác `Reset layout` và đều không xóa saved view ngoài chủ đích.

## 5. PR slices

1. **P6-PR1 Component inventory/design contract/story fixtures.**
2. **P6-PR2 Shared filter/state/status/error primitives.**
3. **P6-PR3 Shared DataGrid hardening + compatibility adapters.**
4. **P6-PR4 Archive adoption.**
5. **P6-PR5 Worklist + Consultations adoption.**
6. **P6-PR6 Non-DICOM + analytics drilldowns.**
7. **P6-PR7 Admin table waves + dead-code cleanup.**
8. **P6-PR8 Cross-page visual/a11y/performance regression.**

## 6. Parity gate cho mỗi route

- Permissions, scoped counts/rows, direct actions và audit không đổi.
- Filter defaults, URL/bookmark, pagination/sort và selection có migration rõ.
- Loading/empty/error/access-denied khác biệt đúng semantics.
- Keyboard, focus, screen-reader labels, 1280–2560 và locale tiếng Việt pass.
- Query count/bundle/render không xấu hơn budget; không kéo editor/large module vào shared bundle.
- Có ảnh baseline, test IDs ổn định và rollback flag.

## 7. Definition of Done

- [ ] Tất cả waves dùng shared primitives hoặc có ngoại lệ được ghi owner/reason.
- [ ] Không mất chức năng/permission/audit của từng module.
- [ ] Không còn component legacy trùng lặp đã hết consumer hoặc CSS hardcode mới.
- [ ] Preference được namespace/version và không va chạm giữa trang.
- [ ] Cross-page visual, accessibility, security, performance và build gates pass.
## Chỉ mục kế hoạch PR chi tiết

1. [Shared UI Contract và Inventory](./DOCTOR_WORKSPACE_PHASE6_PR1_SHARED_UI_CONTRACT_INVENTORY_PLAN.md)
2. [Shared Filter, State và Status Primitives](./DOCTOR_WORKSPACE_PHASE6_PR2_SHARED_FILTER_STATE_PRIMITIVES_PLAN.md)
3. [Shared DataGrid Hardening và Adapters](./DOCTOR_WORKSPACE_PHASE6_PR3_SHARED_DATA_GRID_HARDENING_PLAN.md)
4. [Archive Shared UI Adoption](./DOCTOR_WORKSPACE_PHASE6_PR4_ARCHIVE_SHARED_UI_ADOPTION_PLAN.md)
5. [Worklist Orders và Consultations Adoption](./DOCTOR_WORKSPACE_PHASE6_PR5_WORKLIST_CONSULTATIONS_ADOPTION_PLAN.md)
6. [Non-DICOM và Analytics Drilldown Adoption](./DOCTOR_WORKSPACE_PHASE6_PR6_NON_DICOM_ANALYTICS_ADOPTION_PLAN.md)
7. [Admin Table Adoption và Legacy Cleanup](./DOCTOR_WORKSPACE_PHASE6_PR7_ADMIN_TABLE_ADOPTION_CLEANUP_PLAN.md)
8. [Cross-page Visual, Accessibility và Performance Regression](./DOCTOR_WORKSPACE_PHASE6_PR8_CROSS_PAGE_REGRESSION_PLAN.md)
