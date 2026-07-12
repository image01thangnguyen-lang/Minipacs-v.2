# Kế hoạch rà soát và chuẩn hóa style/layout toàn Dashboard

## 1. Bối cảnh và dấu hiệu lỗi

Các ảnh hiện trạng cho thấy nhiều route đang hiển thị như những “ốc đảo giao diện” khác nhau trên cùng app shell:

- `/command-center` dùng light theme (`bg-gray-50`, `bg-white`, `text-gray-*`) trong khi hệ thống dùng dark teal Vin theme.
- `/admin/permissions/matrix` trộn card/tab trắng với nền dark; đồng thời dùng `bg-vin-background`, token không tồn tại trong `tailwind.config.js`.
- Nhóm `/admin/ops/*` (health, security, deployment, DICOM, performance...) còn dùng light gray/white legacy styles, làm chữ phụ có độ tương phản rất thấp trên nền app.
- `/non-dicom` dùng bộ màu Slate/Indigo riêng thay vì semantic token `vin-*`.
- Một số route tự đặt `min-h-screen`, `h-[calc(100vh-3.5rem)]`, fixed/min width hoặc tự tạo vùng nền, trong khi `AppShell` đã đặt `h-screen`. Điều này dễ gây double-height, overflow sai, vùng nội dung chỉ chiếm một phần màn hình và responsive kém.
- `AppShell` hiện chỉ là wrapper `h-screen`; chưa cưỡng chế một content contract thống nhất (header, page padding, max width, overflow, panel/table/form styles).

## 2. Nguyên nhân gốc sơ bộ

1. **Nhiều thế hệ UI cùng tồn tại**: light Tailwind mặc định, Slate/Indigo dark và Vin dark teal.
2. **Thiếu page-level primitives**: đã có shared grid/filter/state components nhưng chưa có contract chung cho page canvas, section/card, tabs, form controls và admin tables.
3. **Token chưa được kiểm soát**: code có thể dùng màu raw hoặc token không tồn tại (`bg-vin-background`) mà không bị lint/test chặn.
4. **Layout ownership không rõ**: route layout, `AppShell` và page component cùng quản lý height/overflow/padding.
5. **Migration shared UI chưa hoàn tất**: ví dụ Command Center vẫn giữ cả legacy table và shared grid sau feature flag, nhưng wrapper và cell styles vẫn thuộc light theme.
6. **Thiếu visual regression theo route/viewport**: build và unit test không phát hiện lệch theme, clipping hoặc khoảng trống bất thường.

## 3. Mục tiêu

- Mọi màn hình authenticated dùng cùng Vin dark teal theme và cùng app-shell contract.
- Không còn màu nền/text legacy ngoài các vùng có chủ đích (preview phiếu in, print template, ảnh/logo nền trắng).
- Header, page canvas, panel, form, tabs, table/grid, empty/loading/error state có primitive dùng lại.
- Desktop 1366×768, 1440×900, 1920×1080 và tablet 1024×768 không có horizontal overflow ngoài data grid có chủ đích.
- Không thay đổi nghiệp vụ, quyền, polling, server actions hay cấu trúc dữ liệu trong đợt sửa giao diện.

## 4. Phạm vi và thứ tự ưu tiên

### P0 — lỗi nhìn thấy rõ / tương phản kém

1. `/command-center` và `CommandCenterGrids.tsx`.
2. `/admin/permissions/matrix` cùng `ScopeMatrixTab`/`LegacyMatrixTab`.
3. `/admin/ops/*`: overview, health, security, deployment, DICOM, performance.
4. `/settings/account` và các form/card light-theme không có chủ đích.

### P1 — lệch design language nhưng vẫn sử dụng được

1. `/non-dicom` và `NonDicomDataGrid.tsx`: chuyển Slate/Indigo sang Vin semantic tokens/shared primitives.
2. `/support/incidents/*`: chuẩn hóa panel, table và status/severity badges.
3. `/admin/native`, các trang admin legacy còn `bg-white`, `bg-gray-*`, `text-gray-*`.
4. Kiểm tra report/detail/consultation pages về ownership của `min-h-screen` và nested overflow.

### P2 — hardening và dọn nợ

1. Chuẩn hóa các trang admin dùng Slate trực tiếp sang semantic tokens.
2. Loại bỏ legacy rendering sau khi shared UI flag ổn định.
3. Thêm lint/static checks và visual regression để ngăn tái phát.

> Ngoại lệ hợp lệ: print preview, printable report, logo/signature preview có thể dùng `bg-white`/`text-slate-*`, nhưng phải nằm trong component được đặt tên rõ và có chú thích/allowlist.

## 5. Kế hoạch triển khai theo PR

### PR1 — Baseline, inventory và UI contract

- Lập route inventory cho toàn bộ `dashboard/app/**/page.tsx`, ghi nhận theme family, shell/layout, overflow, fixed width, shared UI adoption.
- Chụp baseline các route P0/P1 ở 4 viewport chuẩn, với trạng thái empty/loading/data/error nếu khả thi.
- Chốt ownership:
  - route `layout.tsx` sở hữu `AppShell`;
  - page root dùng `h-full min-h-0 w-full` (không tự dùng `min-h-screen` trong shell);
  - chỉ một layer sở hữu vertical scrolling;
  - data grid tự sở hữu horizontal scrolling.
- Định nghĩa semantic primitives: `PageCanvas`, `PageSection/Panel`, `PageTabs`, `FormField/Input/Select`, `KpiCard`, hoặc utility component tương đương.
- Bổ sung token còn thiếu nếu thực sự cần; ưu tiên dùng các token hiện có (`vin-root`, `vin-shell`, `vin-panel`, `vin-border`, `vin-text2`, `vin-muted`, `vin-accent`).

**Nghiệm thu:** inventory bao phủ mọi route; không còn token Vin tham chiếu nhưng không khai báo; primitives có examples và accessibility states.

### PR2 — Sửa AppShell và layout contract

- Làm rõ API `AppShell`: shell height, content overflow, content class; tránh truyền trùng `flex`, `h-full`, `overflow-*` từ từng layout.
- Chuẩn hóa các route layout (`admin`, `settings`, `support`, `command-center`, `consultations`, `non-dicom`, `statistics`, `worklist`, `archive`).
- Thay nested `min-h-screen`/`calc(100vh...)` bằng `h-full min-h-0` khi route đã nằm trong AppShell.
- Kiểm tra `ScreenHeader` không bị page padding/overflow làm lệch vị trí hoặc thu hẹp content.

**Nghiệm thu:** không có double scrollbar; canvas lấp đầy vùng còn lại; header/user/logout đồng nhất; keyboard focus không bị clip.

### PR3 — Command Center P0

- Chuyển page canvas, filter bar, KPI cards, tabs, content panel và pagination sang Vin tokens/shared components.
- Chuẩn hóa cả legacy table và `CommandCenterGrids` trong thời gian feature flag còn tồn tại.
- Giữ nguyên polling, filter, pagination và tab behavior.
- Bảo đảm 5 KPI responsive: không ép nội dung vào nửa màn hình, không tạo khoảng trắng bất thường do fixed/min width.

**Nghiệm thu:** không còn `gray/white/blue` legacy style ngoài status semantics; WCAG AA cho text thường; mọi tab/empty state đồng nhất.

### PR4 — Permission Matrix P0

- Sửa token không tồn tại `bg-vin-background`.
- Chuyển tabs và matrix container sang dark panel contract.
- Chuẩn hóa toolbar/buttons, permission columns, table header/body và horizontal scrollbar.
- Với ma trận rộng, giữ horizontal scroll có chủ đích nhưng thêm sticky first column/header nếu phù hợp; không để card chỉ chiếm một vùng nhỏ khó đọc.

**Nghiệm thu:** tab active/inactive rõ; text quyền đọc được; ma trận thao tác được bằng keyboard; preview/save không mất trạng thái.

### PR5 — Admin Ops P0

- Migration lần lượt: overview → health → deployment → DICOM → performance → security.
- Dùng chung `AdminOpsPage`, cards, run table, status badge, JSON/detail panel và empty state.
- Không đổi server action hoặc lịch sử run.

**Nghiệm thu:** tất cả ops pages cùng spacing/theme/table density; trạng thái success/warn/fail không chỉ phân biệt bằng màu.

### PR6 — P1 legacy screens

- Migration Non-DICOM sang Vin token và shared DataGrid/FilterBar.
- Migration Settings Account, Native, Support Incidents và các trang legacy được inventory phát hiện.
- Chuẩn hóa badges qua registry/shared `StatusBadge` khi domain cho phép.

**Nghiệm thu:** không còn “theme island”; detail/list routes trong cùng module có cùng visual language.

### PR7 — Guardrails và visual regression

- Thêm script CI quét các pattern bị cấm trong authenticated pages: `bg-gray-*`, `text-gray-*`, `bg-slate-*`, `bg-white`, `min-h-screen`; hỗ trợ allowlist có lý do cho print/preview.
- Thêm kiểm tra token Tailwind custom được tham chiếu phải tồn tại.
- Thêm Playwright screenshot smoke cho route đại diện P0/P1 ở 1024, 1366 và 1920 px.
- Thêm assertions cơ bản: không có page-level horizontal overflow; header/panel tồn tại; text quan trọng có thể nhìn thấy.
- Cập nhật UI contribution checklist cho PR mới.

**Nghiệm thu:** CI bắt được việc tái đưa light-theme card vào authenticated page hoặc thêm page-level `min-h-screen` sai contract.

## 6. Ma trận kiểm thử bắt buộc cho mỗi route

- **Viewport:** 1024×768, 1366×768, 1440×900, 1920×1080.
- **Data state:** loading, empty, populated, error, long text, nhiều cột.
- **Interaction:** tab, filter, pagination, modal/dropdown, save/preview, row selection.
- **Layout:** một vertical scrollbar đúng layer; horizontal scrollbar chỉ tại grid; không clipping sticky header/menu.
- **Accessibility:** focus visible, keyboard navigation, label/input association, contrast, trạng thái không chỉ dựa vào màu.
- **Functional regression:** permissions, feature flags, query parameters và actions giữ nguyên.

## 7. Definition of Done toàn chương trình

- 100% authenticated routes được ghi trong inventory và có trạng thái `compliant`, `intentional exception` hoặc issue theo dõi.
- Không còn token không tồn tại như `bg-vin-background`.
- Không còn class light/Slate legacy ngoài allowlist được review.
- Không route nào tạo page-level overflow ngoài contract.
- Screenshot regression của route P0/P1 đạt ở các viewport chuẩn.
- `npm run build`, unit/integration tests và accessibility/security checks hiện có đều pass.
- Product/QA duyệt trực quan trên dữ liệu empty và populated trước khi gỡ feature flag legacy.

## 8. Cách thực hiện an toàn

- Sửa theo module/PR nhỏ, không “search & replace” màu toàn repo vì có vùng print/preview cần nền trắng.
- Tách thay đổi visual khỏi thay đổi nghiệp vụ.
- Với màn hình có feature flag, chuẩn hóa cả hai nhánh trước; chỉ xóa legacy ở PR riêng sau UAT.
- Mỗi PR đính kèm ảnh before/after cùng viewport và checklist overflow/contrast/keyboard.
- Bắt đầu bằng PR1–PR4 vì chúng xử lý đúng ba nhóm lỗi trong ảnh và tạo nền để sửa nhanh các màn hình còn lại.