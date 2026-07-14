# Phase 2 — Shared UI Adapters và Compact Primitives

## Mục tiêu

Thay implementation ở seam dùng chung trước, giữ public/domain contract để giảm blast radius.

## Thứ tự adapter

1. Button/IconButton/ToolbarButton.
2. Input/TextArea/InputNumber/Search.
3. `CustomSelect` → AntD Select; bảo toàn option/value/form payload.
4. `CustomDatePicker` → DatePicker/RangePicker; adapter Day.js ↔ date string.
5. Checkbox/Radio/Switch.
6. Modal/Drawer/Dropdown/Popconfirm.
7. `StatusBadge` → compact Tag nhưng giữ registry nghiệp vụ.
8. Loading/Empty/Error/Alert/Skeleton.
9. PagePanel/KPI/FilterBar/WorkspaceHeader.
10. DataGrid adapter prototype trên AntD Table.

## Quy tắc triển khai

- Mọi control `size="small"`; `Space size="small"`; spacing 2/4/8px.
- Toolbar icon-first `type="text"`, Tooltip + aria-label, active cyan-soft.
- Không thay RHF/Zod; dùng Controller.
- Server Action form phải còn đúng `name/value` hoặc hidden input rõ ràng.
- Không làm Table consumer import AntD trực tiếp; giữ `SharedDataGrid` contract.
- Không biến component server không cần thiết thành client.

## Tests

- Controlled/default/reset/dirty/disabled/loading/error.
- Keyboard/focus/screen reader.
- Submit FormData và date timezone UTC+7.
- Popup trong modal, drawer, scroll panel, split pane.
- Status color + icon/label không phụ thuộc màu duy nhất.
- Table selection/sort/row action/ellipsis/sticky prototype.

## Gate

- Consumer mẫu chạy không đổi nghiệp vụ.
- Không mất field Server Action.
- Adapter API có docs và test.
- DataGrid prototype có quyết định: AntD Table, hybrid hoặc giữ custom grid themed bằng token.

## Kế hoạch thực thi chi tiết

### PR2.1 — Control primitives

- Chuẩn hóa `ClinicalButton`, `ToolbarButton`, input/search/number, select và date adapter; mặc định `size="small"` nhưng vẫn forward ref, aria, disabled/loading và native form semantics.
- Không bọc vô ích nếu AntD component dùng trực tiếp đã an toàn; adapter chỉ tồn tại khi bảo toàn domain contract/default.
- Viết compatibility tests cho controlled/uncontrolled, clear, reset, IME tiếng Việt, decimal và timezone.

### PR2.2 — Feedback và overlays

- Modal/Drawer/Popconfirm/Dropdown/Tooltip dùng context và popup convention Phase 1.
- States loading/empty/error/denied dùng Skeleton/Empty/Alert compact, không flash nền sáng.
- Xác định focus ban đầu, focus return, Escape behavior và destructive confirmation.

### PR2.3 — Domain visual primitives

- Giữ `status-badge-registry` là source of truth; map sang Tag compact với text/icon, không đưa logic status vào page.
- Chuyển `PagePrimitives`, `FilterBar`, `WorkspaceHeader` theo API tương thích; loại padding lớn nhưng không phá print/layout.
- Toolbar icon-only phải Tooltip, `aria-label`, `aria-pressed`; active cyan-soft.

### PR2.4 — DataGrid spike và ADR quyết định

- Dựng spike với 1.000/10.000 row fixture phi định danh.
- So sánh AntD Table/hybrid/custom theo resize, pin, visibility, sticky, keyboard, virtualization, selection, server sort và density.
- Không chọn Table chỉ vì “cùng AntD”; ghi trade-off, bundle/render/memory và migration API.
- Nếu chọn AntD Table, implement adapter giữ `DataGrid` public contract; nếu không, theme custom grid bằng token và ghi intentional exception.

## Contract không được phá

- RHF/Zod resolver, field names, FormData và Server Action submit.
- URL query serialization và date-only/UTC boundary.
- Status registry, permission-controlled visibility và analytics event names.
- Ref/focus dùng bởi keyboard shortcuts.

## Evidence/gate chi tiết

Tạo `evidence/phase-2`: API mapping, consumer migration sample, Story/playground matrix, accessibility report, DataGrid benchmark/ADR và acceptance. Mỗi adapter có unit/component test; ít nhất một consumer thật cho Select, DatePicker, overlay và DataGrid spike. Không mass migrate route.

## Prompt giao cho AI thực thi Phase 2

```text
Bạn là Staff React/AntD v5 Engineer. Hãy thực thi DUY NHẤT Phase 2 theo docs/antd-migration/PHASE_2_UI_ADAPTERS.md sau khi xác minh Phase 1 GO.

Đọc implementation shared UI hiện tại, tests/contracts, Server Actions và RHF/Zod usage trước khi sửa. Xây adapter theo thứ tự control → overlay/state → domain primitive → DataGrid spike. Bảo toàn public props, ref/focus, URL/FormData/date semantics, status registry, authz và event names. Tất cả AntD controls small; Space small; spacing 2/4/8; toolbar text+icon; dark-room tokens chính xác. Không mass migrate pages, không đổi nghiệp vụ/API/database.

Với DataGrid, benchmark AntD Table/hybrid/custom trên fixture lớn, kiểm tra resize/pin/visibility/sticky/keyboard/virtualization/server sort; đưa ra ADR bằng evidence, không ép AntD Table nếu làm mất capability. Thêm unit/component/accessibility tests và consumer samples. Chạy lint/typecheck/test/build/UI checker, ghi commands/exit codes/benchmark/API mapping/rollback vào docs/antd-migration/evidence/phase-2/PHASE_2_ACCEPTANCE.md.

Cuối cùng báo files changed, compatibility risks, DataGrid decision và GO/NO-GO. Dừng trước Phase 3.
```
