# Phase 4 — Kế hoạch chi tiết Bố cục 7 vùng và Ca liên quan

Ngày lập: 2026-07-11  
Thuộc master plan: [DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md](./DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md)  
Phụ thuộc: Phase 3 scoped worklist/grid ổn định

## 1. Mục tiêu và ranh giới

Ghép workspace bác sĩ đủ 7 vùng, có splitter/collapse/responsive/deep link và truy vấn ca liên quan độc lập. Phase này chỉ tạo shell và patient/study context read-only tối thiểu; editor/autosave/sign/consult actions thuộc Phase 5.

## 2. Composition

```text
DoctorWorkspace
├─ WorkspaceSwitcher (1)
├─ WorkspaceSearchBar (2)
├─ WorkQueueFacets (3)
├─ FacilityScopeTree (4)
├─ StudyDataGrid (5)
├─ RelatedStudiesPanel (6)
└─ PatientStudyContextPanel read-only (7)
```

Desktop ≥1600 dùng 3 cột; 1280–1599 cho thu gọn trái; 1024–1279 panel phải là drawer/tab; dưới 1024 là tra cứu cơ bản. CSS grid là layout chính; splitter chỉ thay CSS variables trong min/max, không tạo resize loop.

## 3. Selection, URL và concurrency

- Canonical selection là `study=<uid>` trong URL khi deep-link hợp lệ; filter URL của Phase 3 được bảo toàn.
- Một click chọn, double-click mở viewer; keyboard Up/Down chọn, Enter mở theo contract accessibility.
- Dùng monotonic request key/AbortController: response study cũ không được ghi đè panel study mới.
- Refresh giữ selection nếu còn accessible; ngoài scope/not found trả generic state và xóa selection an toàn.
- Không tự đổi selection khi polling/refresh; Phase 5 sẽ thêm dirty lock.

## 4. Related studies contract

```ts
getRelatedStudies({ studyUid, range: "ENCOUNTER"|"30D"|"1Y"|"ALL", cursor?, limit? })
```

Server phải authorize anchor `READ_STUDY`, resolve patient identity chuẩn hóa server-side, query riêng với `buildAccessibleStudyWhere`, loại anchor hoặc đánh dấu current, stable sort và giới hạn. Không nhận patient ID từ client làm authority. Response chỉ có fields cần hiển thị và allowed viewer/compare actions; count cũng scoped. Patient merge/identifier collision phải có policy rõ, không fuzzy-match tên/DOB.

## 5. Persisted layout

Preference versioned: left collapsed/width, center/right width, related height, region visibility và breakpoint family. Clamp dữ liệu cũ/hỏng; debounce save; reset layout có confirmation nhẹ. Server allowlist keys/ranges, không nhận arbitrary JSON vô hạn. Preference lỗi không chặn worklist.

## 6. PR slices

1. **P4-PR1 Workspace composition + CSS grid** dưới feature flag.
2. **P4-PR2 Accessible SplitPane** pointer/keyboard/min-max/responsive tests.
3. **P4-PR3 Selection/deep-link/request race** và viewer open contract.
4. **P4-PR4 Related endpoint** identity/scope/pagination/security tests.
5. **P4-PR5 Related panel + compare affordance** (disabled rõ nếu viewer chưa hỗ trợ).
6. **P4-PR6 Persist layout/responsive/a11y/UAT** và migration khỏi `page.tsx` nguyên khối.

## 7. Failure states và test matrix

- Anchor deleted/out-of-scope, patient ID missing, related empty, timeout và partial detail load đều có state riêng.
- A không thấy related/count của B; forged anchor/patient ID không enumerate.
- Click nhanh A→B→C chỉ C hiển thị; browser back/forward khôi phục selection/filter.
- Splitters dùng mouse/touch/keyboard, focus visible; 1280/1440/1920/2560 không che action.
- Layout preference corrupt/version cũ fallback default; multi-tab last-write semantics được document.
- Không remount grid/editor placeholder không cần thiết khi resize.

## 8. Definition of Done

- [ ] Đủ 7 vùng tại desktop, degradation đúng breakpoint.
- [ ] Selection/deep link/back-forward/race có automated tests.
- [ ] Related studies độc lập trang hiện tại và scope-safe.
- [ ] Splitter/layout preference accessible, versioned và reset được.
- [ ] `app/page.tsx` trở thành composition, không tiếp tục chứa toàn bộ policy/query/editor.
- [ ] Build, regression, visual breakpoint và security gates pass.
## Chỉ mục kế hoạch PR chi tiết

1. [Workspace Composition và CSS Grid](./DOCTOR_WORKSPACE_PHASE4_PR1_WORKSPACE_COMPOSITION_GRID_PLAN.md)
2. [Accessible SplitPane](./DOCTOR_WORKSPACE_PHASE4_PR2_ACCESSIBLE_SPLIT_PANE_PLAN.md)
3. [Selection, Deep Link và Request Race](./DOCTOR_WORKSPACE_PHASE4_PR3_SELECTION_DEEP_LINK_RACE_PLAN.md)
4. [Related Studies Endpoint](./DOCTOR_WORKSPACE_PHASE4_PR4_RELATED_STUDIES_ENDPOINT_PLAN.md)
5. [Related Studies Panel và Compare Affordance](./DOCTOR_WORKSPACE_PHASE4_PR5_RELATED_STUDIES_PANEL_PLAN.md)
6. [Layout Preferences, Responsive và UAT](./DOCTOR_WORKSPACE_PHASE4_PR6_LAYOUT_PREFERENCES_RESPONSIVE_UAT_PLAN.md)
