# Kế hoạch tổng thể đồng nhất màu sắc toàn bộ giao diện MiniPACS

Ngày lập: 2026-07-16  
Trạng thái: Sẵn sàng triển khai  
Phạm vi: Toàn bộ Dashboard/RIS, Doctor Workspace, Admin/Settings/Quality/Statistics, màn hình chia sẻ và lớp giao diện tùy biến OHIF Viewer

## 1. Bối cảnh và vấn đề cần giải quyết

Ảnh phản hồi cho thấy trong cùng một màn hình đang có ít nhất ba nhóm nền tối gần giống nhau nhưng khác hue và khác hệ token:

- **Vị trí 1**: nền teal tối của mục điều hướng đang active. Đây là màu người dùng xác nhận là **màu chủ đạo**.
- **Vị trí 2**: nền xanh navy/teal đậm của cột trái.
- **Vị trí 3**: nền slate/teal xám của vùng nội dung trung tâm.

Sự khác biệt không tạo ra phân cấp có chủ đích mà tạo cảm giác giao diện được ghép từ nhiều theme. Kiểm tra mã nguồn xác nhận nguyên nhân chính:

1. `dashboard/app/globals.css` đang tồn tại đồng thời palette `--vin-*` thiên dark teal (`#081f2a`, `#0a2a38`, `#1f3037`...) và bridge `--clinical-*` thiên neutral gray (`#141414`, `#1f1f1f`, `#262626`...).
2. `dashboard/lib/ui/antd-theme.ts` dùng bộ neutral gray riêng của Ant Design trong khi Tailwind dùng `--vin-*`.
3. Nhiều component AntD/Tailwind vẫn hardcode `#141414`, `#1F1F1F`, `#262626`, `#303030`, `#13C2C2`, các màu `slate-*`, `gray-*`, `cyan-*`, hoặc `rgba(0,0,0,...)`.
4. `config/ohif-custom.css` lặp lại một bộ token thứ ba (`--custom-*`).
5. Màu nghiệp vụ success/warning/error/info đang được chọn cục bộ và chưa đi qua một semantic registry thống nhất.

Mục tiêu không phải đổi mọi nền thành đúng một mã hex. Cách đó sẽ làm mất phân cấp, selected/hover và ranh giới panel. Mục tiêu là dùng **một họ màu teal tối bắt nguồn từ vị trí 1**, sau đó tạo các cấp sáng/tối có chủ đích từ cùng một hue.

## 2. Quyết định thiết kế

### 2.1. Màu neo

- Vị trí 1 là nguồn tham chiếu thị giác và là màu chủ đạo cho toàn ứng dụng.
- Trước khi chốt mã màu, kỹ sư phải lấy màu thực bằng DevTools `getComputedStyle` trên phần tử menu active ở vị trí 1; không lấy màu từ vòng đánh dấu xanh hoặc viền đỏ trong ảnh.
- Giá trị khởi tạo để triển khai thử nghiệm là `#153f3e` (dark active teal). Nếu màu computed thực tế khác, cập nhật **một lần tại token nguồn**, ghi lại giá trị trước/sau trong evidence và sinh lại các tonal step theo cùng hue.
- Accent tương tác giữ cyan/teal sáng nhưng phải thuộc cùng họ màu. Accent không được dùng như nền diện tích lớn.

### 2.2. Một nguồn sự thật

Tạo một module token TypeScript làm nguồn sự thật, ví dụ:

- `dashboard/lib/ui/clinical-color-tokens.ts`: giá trị màu canonical và kiểu dữ liệu.
- `dashboard/lib/ui/antd-theme.ts`: import token canonical để map sang Ant Design.
- `dashboard/app/globals.css`: chỉ chứa CSS custom properties tương ứng; nếu không thể generate tự động thì có test bắt buộc xác minh đồng bộ với module TypeScript.
- `dashboard/tailwind.config.js`: chỉ map tên utility vào CSS variables, không chứa hex riêng.
- `config/ohif-custom.css`: mirror tối thiểu các token canonical tại deployment boundary; có test/script so sánh để tránh drift.

Không tiếp tục duy trì hai hệ `vin` và `clinical` có giá trị khác nhau. Trong giai đoạn chuyển tiếp, alias cũ được phép tồn tại nhưng tất cả phải trỏ về token canonical; sau khi migrate xong mới xóa alias không còn dùng.

### 2.3. Palette đề xuất

Các giá trị dưới đây là baseline. Chỉ được tinh chỉnh sau khi đo computed color của vị trí 1 và kiểm tra contrast:

```css
:root {
  /* Neutral/surface family derived from primary position 1 */
  --clinical-surface-canvas: #0b2929;
  --clinical-surface-shell: #103333;
  --clinical-surface-primary: #153f3e;
  --clinical-surface-secondary: #194847;
  --clinical-surface-elevated: #1e5150;
  --clinical-surface-hover: #245b59;
  --clinical-surface-selected: #2a6764;
  --clinical-surface-disabled: #263b3b;

  --clinical-border-subtle: #2c5554;
  --clinical-border-default: #3a6664;
  --clinical-border-strong: #56817e;

  --clinical-text-primary: #f4fbfa;
  --clinical-text-secondary: #cee3e1;
  --clinical-text-muted: #9bbab7;
  --clinical-text-disabled: #718d8a;

  --clinical-accent-primary: #13c2c2;
  --clinical-accent-hover: #36cfc9;
  --clinical-accent-active: #08979c;
  --clinical-focus-ring: #5cdbd3;

  --clinical-status-success: #52a447;
  --clinical-status-warning: #d19a3b;
  --clinical-status-danger: #cf4b55;
  --clinical-status-info: #13c2c2;

  /* Chỉ dành cho DICOM pixel viewport và bản in */
  --clinical-viewport-black: #000000;
  --clinical-print-paper: #ffffff;
}
```

Quy tắc sử dụng diện tích:

- 60–70% diện tích app: `surface-primary` hoặc `surface-shell`, cùng họ với vị trí 1.
- `surface-canvas`: lớp ngoài cùng hoặc vùng cần lùi sâu.
- `surface-secondary/elevated`: header, toolbar, card nổi, dropdown, modal.
- `surface-hover/selected`: chỉ dùng cho trạng thái tương tác; selected phải có thêm border/icon/aria state, không truyền đạt bằng màu đơn độc.
- Không dùng ba surface gần nhau tùy tiện trong cùng một cụm. Mỗi region chỉ có tối đa: base + elevated + interactive state.

## 3. Ngoại lệ hợp lệ

Các vùng sau không bị ép thành teal vì có yêu cầu chức năng:

1. **DICOM viewport** phải giữ `#000000` để không ảnh hưởng cảm nhận ảnh, window/level và môi trường đọc phim.
2. **Print preview/PDF/report paper** được giữ nền trắng và text tối vì mô phỏng bản in. Nền bao quanh preview vẫn dùng theme teal.
3. **Logo/hình ảnh/thumbnail** giữ màu nội dung gốc.
4. **Semantic state** success, warning, danger được giữ hue riêng nhưng phải dùng token semantic, saturation có kiểm soát và luôn kèm text/icon.
5. Biểu đồ được dùng nhiều màu để phân biệt chuỗi dữ liệu, nhưng phải lấy từ một chart palette được duyệt, có legend và contrast phù hợp.

Mọi literal màu ngoại lệ phải có comment dạng `COLOR_EXCEPTION(<id>): <lý do>` và nằm trong allowlist có kiểm thử.

## 4. Phạm vi kiểm kê bắt buộc

### 4.1. Nguồn theme và component dùng chung

- `dashboard/app/globals.css`
- `dashboard/lib/ui/clinical-color-tokens.ts` (tạo mới)
- `dashboard/lib/ui/antd-theme.ts`
- `dashboard/app/providers/AntdProvider.tsx`
- `dashboard/tailwind.config.js`
- `dashboard/app/components/shell/**`
- `dashboard/app/components/navigation/**`
- `dashboard/app/components/ui/**`
- `dashboard/app/components/workspace/**`
- `dashboard/lib/ui/status-badge-registry.ts`
- `dashboard/scripts/check-ui-style.cjs`
- Các unit/conformance test trong `dashboard/lib/ui/__tests__` và `dashboard/tests`.

### 4.2. Toàn bộ route Dashboard

Không chỉ sửa màn hình trong ảnh. Audit và xác nhận từng nhóm route:

- `/`, `/worklist`, `/archive`, `/report/[studyInstanceUid]`
- `/consultations`, `/consultations/[id]`
- `/non-dicom`, `/non-dicom/[id]`
- `/command-center`
- `/statistics` và `/statistics/{sla,modalities,workload}`
- `/quality` và toàn bộ màn peer review, data quality, QC rejects, critical results
- `/settings/account`, `/settings/clinic-profile`, `/settings/report-templates`
- `/support/incidents`, trang tạo mới và trang chi tiết
- Toàn bộ `/admin/**`: users, permissions, catalogs, PACS nodes, facilities, storage, templates, HIS, native, alerts, SLA, control thresholds, backup, retention, destructive, ops, runbooks, training, changes, release.
- `/login`, `/share/[token]`, loading/empty/error/not-found/modal/drawer/dropdown/toast states.
- `/playground` dùng làm trang đối chiếu token/component, không được là nguồn theme độc lập.

### 4.3. Viewer

- `config/ohif-custom.css`
- `config/ohif-custom.js` nếu có style/element runtime.
- `ohif-viewer/**` chỉ audit trước; ưu tiên deployment override, không fork hoặc sửa bundle compiled nếu không thật sự cần.

## 5. Kế hoạch triển khai theo wave

### Wave 0 — Baseline và inventory

1. Chụp screenshot trước thay đổi ở 1920×1080, 1440×900 và 1366×768 cho các route đại diện.
2. Với màn hình trong ảnh, dùng DevTools ghi computed background/border/text của vị trí 1, 2, 3 và selector/component tạo ra chúng.
3. Xuất inventory tất cả literal hex/rgb/hsl và utility màu Tailwind trong `dashboard/app`, `dashboard/components`, `dashboard/lib/ui`, `config`, `ohif-viewer`.
4. Phân loại từng match: surface, text, border, interactive, semantic status, chart, viewport, print, media, shadow hoặc false positive.
5. Lập ma trận `current value -> semantic role -> canonical token -> files/routes`.

Deliverable: `docs/evidence/ui-color-unification/COLOR_INVENTORY.md` và screenshot baseline. Không thay màu hàng loạt khi inventory chưa phân loại.

### Wave 1 — Canonical token foundation

1. Tạo `clinical-color-tokens.ts` với palette, semantic names và export dùng cho AntD.
2. Refactor `clinicalTheme` để map đầy đủ:
   - global background/container/elevated/layout/spotlight/mask;
   - text, border, split, fill, primary/info/link và focus;
   - Table header/row/selected/hover/border;
   - Layout/Menu, Card, Modal, Drawer, Dropdown, Select, Input, DatePicker, Tabs, Button, Tag, Tooltip, Popover, Notification và Segmented.
3. Đồng bộ CSS variables trong `globals.css`; chuyển alias `--vin-*` và `--clinical-*` cũ cùng trỏ về canonical token.
4. Giữ Tailwind utility `vin-*` trong wave chuyển tiếp để giảm blast radius, nhưng tất cả value phải lấy từ canonical CSS variables.
5. Cập nhật unit test theme để kiểm tra semantic mapping thay vì đóng băng palette neutral gray cũ.

Exit gate: đổi một token canonical phải cập nhật đồng thời AntD và Tailwind surfaces; không còn hai nguồn màu xung đột.

### Wave 2 — App shell và màn hình được phản hồi

1. Sửa AppShell, sidebar, workspace switcher, menu active, split panes và region wrappers.
2. Đặt vị trí 1 làm `surface-primary`; vị trí 2 và 3 được map về tonal step có chủ đích, không còn navy-vs-gray lệch hue.
3. Chuẩn hóa header, table, left facets, patient context, related studies, report panel, empty/loading/error state.
4. Đảm bảo menu active, row selected, keyboard focus và hover phân biệt được bằng ít nhất hai tín hiệu (màu + border/icon/weight).
5. So sánh screenshot trước/sau đúng màn hình phản hồi trước khi mở rộng.

Exit gate: không còn cảm giác ba theme ghép lại; vị trí 1 rõ ràng là màu chủ đạo trong toàn composition.

### Wave 3 — Shared primitives và operational routes

1. Chuẩn hóa `PagePrimitives`, `FilterBar`, `DataGrid`, `StatusBadge`, form controls, dialogs và shared states trước.
2. Migrate worklist, archive, consultations, non-DICOM, report workspace và share page sang shared semantic tokens.
3. Xóa hardcode nền `#141414/#1F1F1F/#262626/#303030`, `slate/gray/zinc` dùng cho structural surface; thay bằng token đúng vai trò.
4. Không đổi màu semantic bằng search/replace mù. Ví dụ `red` của error phải map danger; `red` trang trí không hợp lệ phải loại bỏ.

Exit gate: các route nghiệp vụ chính không còn structural color literal ngoài allowlist.

### Wave 4 — Admin, quality, support, settings và analytics

1. Migrate theo nhóm để review nhỏ và có thể rollback độc lập:
   - Admin identity/permissions/catalogs/facilities/PACS/storage/templates/HIS.
   - Admin operations/release/change control/backup/retention/destructive/runbooks/training.
   - Quality/support/SLA/control thresholds.
   - Statistics/command center/charts/KPI cards.
   - Settings/login/playground.
2. Tạo chart palette riêng dựa trên teal primary cộng semantic colors; không hardcode màu từng card/KPI.
3. Kiểm tra modal, drawer, popup portal và notification vì chúng có thể nhận AntD token khác surface của route.
4. Preview giấy trắng phải được gắn exception rõ ràng, không bị linter đổi sang teal.

Exit gate: tất cả route trong mục 4.2 có screenshot hoặc checklist xác nhận ở default, hover/focus, loading, empty, error và modal state phù hợp.

### Wave 5 — OHIF alignment

1. Thay `--custom-bg-*` bằng mirror của canonical teal surface family.
2. Map header, side panels, toolbar, study browser, modal, measurement panels, hover/active/focus vào semantic role tương ứng.
3. Giữ viewport đen tuyệt đối và không thay đổi DICOM rendering, LUT, window/level, overlay data hoặc công cụ đo.
4. Xác minh CSS selector theo đúng OHIF 3.7 compiled classes; loại override không còn tác dụng.
5. Kiểm tra visual khi mở study, đổi series, mở measurements, layout selector, fullscreen và dialog.

Exit gate: Dashboard và chrome của OHIF cùng một họ màu; pixel viewport vẫn đen và không có regression lâm sàng.

### Wave 6 — Enforcement, validation và dọn legacy

1. Mở rộng `check-ui-style.cjs` để chặn:
   - structural hex/rgb/hsl mới trong runtime UI;
   - utility `bg/text/border/ring` thuộc gray/slate/zinc/neutral/cyan tùy tiện cho structural role;
   - `var(--vin-shell)`/`var(--vin-border)` sai tên hoặc biến không được khai báo;
   - token AntD và CSS drift;
   - viewport khác black và print paper khác white.
2. Cho phép semantic/print/viewport/chart exceptions qua allowlist có ID, không cho phép regex bỏ qua cả file.
3. Khi toàn bộ consumer đã migrate, xóa token cũ không dùng và cập nhật `CLINICAL_UI_STANDARD.md` thành contract mới.
4. Tạo evidence report gồm inventory sau sửa, kết quả test, contrast, screenshots và danh sách exception còn lại.

## 6. Mapping component bắt buộc

| Thành phần | Token nền chính | Trạng thái/ghi chú |
|---|---|---|
| Body/App canvas | `surface-canvas` | Không dùng neutral gray độc lập |
| App shell/sidebar | `surface-shell` | Có thể tối hơn primary một tonal step |
| Menu item active (vị trí 1) | `surface-primary` | Màu neo; thêm indicator accent |
| Main workspace/panel | `surface-primary` | Thay các nền vị trí 2/3 không có chủ đích |
| Header/toolbar/table header | `surface-secondary` | Border subtle |
| Card/modal/drawer/dropdown | `surface-elevated` | Shadow trung tính trong suốt, không tạo hue mới |
| Row/card hover | `surface-hover` | Không được giống selected |
| Row/menu selected | `surface-selected` | Kèm accent border hoặc icon |
| Input/select/textarea | `surface-shell` hoặc `surface-secondary` | Cùng rule trên mọi framework |
| Primary button/link/focus | `accent-primary` | Hover/active từ accent tokens |
| Text | `text-primary/secondary/muted/disabled` | Không dùng opacity ngẫu nhiên để tạo thêm cấp |
| Status | `status-*` | Kèm label/icon; dùng registry chung |
| DICOM viewport | `viewport-black` | Ngoại lệ bắt buộc |
| Print preview | `print-paper` | Ngoại lệ bắt buộc |

## 7. Kiểm thử và tiêu chí chất lượng

### 7.1. Automated checks

Chạy tối thiểu:

```cmd
cd dashboard && npm run lint
cd dashboard && npm test
cd dashboard && npm run build
cd dashboard && node scripts/check-ui-style.cjs
```

Nếu repository chưa có visual test runner, bổ sung Playwright screenshot test cho route đại diện. Snapshot phải cố định viewport, locale, timezone, font và fixture data.

### 7.2. Accessibility/contrast

- Text thường: WCAG AA tối thiểu 4.5:1.
- Text lớn và icon chức năng: tối thiểu 3:1.
- Border/focus/selected cần đủ nhận biết trên surface liền kề; focus indicator tối thiểu 3:1.
- Không dùng màu là tín hiệu duy nhất cho priority, trạng thái, lỗi hoặc selected.
- Test keyboard focus, high zoom 200%, `prefers-reduced-motion` và nếu có điều kiện test color-vision deficiency.
- Đánh giá trên màn chẩn đoán trong phòng tối để accent và surface không quá sáng khi sử dụng lâu.

### 7.3. Visual matrix

Mỗi nhóm route phải có ít nhất desktop 1920×1080 và 1366×768; workspace thêm 1440×900. Kiểm tra:

- default, hover, active, selected, focus, disabled;
- empty/loading/error/success;
- popup/dropdown/tooltip/modal/drawer/toast;
- table sticky header, horizontal scroll và selected row;
- print preview và DICOM viewport ngoại lệ;
- không có flash nền trắng trong navigation/loading.

### 7.4. Functional regression

- Đăng nhập/đăng xuất và phân quyền.
- Search/filter/pagination/sort/select/double-click trên worklist/archive.
- Mở viewer, đổi series, công cụ toolbar và measurement.
- Chọn ca, load context, related studies, sửa/lưu/finalize report và dirty guard.
- Consultation, non-DICOM capture, share link, download/print/PDF.
- Admin CRUD, form validation, modal/dropdown và các action nguy hiểm.
- Statistics/chart/filter/drilldown và command-center polling.

## 8. Tiêu chí nghiệm thu cuối cùng

Chỉ coi là hoàn thành khi đáp ứng đồng thời:

1. Màu tại vị trí 1 đã được đo từ UI thực và trở thành màu neo documented.
2. Toàn bộ structural surfaces dùng cùng một dark-teal tonal family; không còn palette navy, neutral gray và teal cạnh tranh nhau.
3. AntD, CSS variables, Tailwind và OHIF custom layer có mapping nhất quán và có kiểm thử chống drift.
4. Không còn structural color literal trong runtime UI ngoài allowlist có lý do.
5. Tất cả route tại mục 4.2 đã được kiểm tra; không chỉ màn hình trong ảnh.
6. Contrast đạt WCAG AA; focus, selected và semantic status không phụ thuộc màu đơn độc.
7. DICOM viewport vẫn `#000000`; print preview vẫn mô phỏng giấy trắng; không có thay đổi chức năng lâm sàng.
8. Lint, test, build, style check và visual regression đều pass.
9. Có evidence trước/sau, color inventory sau migrate, exception registry và rollback note.

## 9. Chiến lược PR, rollout và rollback

- Không gom toàn bộ thay đổi vào một PR khổng lồ. Chia theo các wave ở mục 5; mỗi PR phải build/test độc lập.
- PR foundation chỉ tạo token/alias và test, chưa xóa token cũ.
- PR màn hình phải có screenshot trước/sau và danh sách route đã test.
- Chỉ xóa alias legacy ở PR cuối sau khi search xác nhận không còn consumer.
- Nếu có feature flag theme, rollout nội bộ -> pilot -> toàn bộ người dùng. Nếu không có, giữ commit theo wave để revert độc lập.
- Rollback ưu tiên revert mapping token/wave UI; không rollback dữ liệu vì kế hoạch này không thay schema hay business logic.
- Nếu phát hiện contrast hoặc DICOM viewer regression, dừng rollout và revert wave gần nhất; không vá bằng hardcode cục bộ.

## 10. Rủi ro cần tránh

- Đổi tất cả panel thành cùng một hex làm mất hierarchy.
- Search/replace `#141414` hoặc `slate-*` mà không phân biệt viewport, print, semantic và chart.
- Chỉ sửa `globals.css` nhưng bỏ qua AntD component token nên popup/table/modal vẫn màu cũ.
- Chỉ sửa màn hình ảnh phản hồi mà bỏ qua admin/settings/quality/viewer.
- Dùng accent cyan cho diện tích lớn gây chói trong phòng tối.
- Dùng status green/yellow/red làm structural colors.
- Fork OHIF hoặc can thiệp rendering chỉ để đổi chrome UI.
- Giữ alias sai/biến CSS không tồn tại như `--vin-shell` hoặc `--vin-border` mà không có enforcement.

## 11. Prompt bàn giao cho AI triển khai

```text
Bạn là senior frontend/design-system engineer chịu trách nhiệm triển khai việc đồng nhất màu sắc cho toàn bộ repository MiniPACS tại c:\Antigravity\Minipacs-v.2.

Hãy đọc và thực hiện đầy đủ file `docs/UI_COLOR_UNIFICATION_MASTER_PLAN.md`. Không chỉ sửa màn hình được chụp; phải xử lý toàn bộ Dashboard/RIS, Doctor Workspace, worklist, archive, report, consultations, non-DICOM, command center, statistics, quality, settings, support, toàn bộ admin, login/share và chrome tùy biến OHIF Viewer.

Yêu cầu thiết kế quan trọng nhất: màu nền teal tối tại vị trí số 1 (menu item active trong ảnh phản hồi) là màu chủ đạo. Trước khi chốt palette, hãy dùng DevTools/computed style hoặc truy vết component/token để lấy đúng màu thực của phần tử này; không lấy màu từ vòng tròn xanh đánh số hoặc khung đỏ chú thích. Dùng màu đó làm anchor và tạo một tonal family dark teal có phân cấp. Không biến toàn app thành một mã hex duy nhất; canvas, shell, primary surface, elevated, hover và selected phải khác độ sáng có chủ đích nhưng cùng hue.

Hiện code có nhiều nguồn màu xung đột: `--vin-*` trong `dashboard/app/globals.css`, `--clinical-*`, AntD neutral gray trong `dashboard/lib/ui/antd-theme.ts`, hardcode trong TSX và `--custom-*` trong `config/ohif-custom.css`. Hãy tạo một nguồn sự thật typed (ưu tiên `dashboard/lib/ui/clinical-color-tokens.ts`), map nó vào Ant Design, CSS variables, Tailwind và mirror có kiểm soát sang OHIF. Alias legacy chỉ được giữ tạm và phải cùng trỏ về token canonical.

Triển khai tuần tự theo Wave 0 đến Wave 6 trong kế hoạch. Trước khi sửa, tạo color inventory và screenshot baseline. Không search/replace màu mù. Phân loại từng màu theo structural surface, text, border, interactive, semantic status, chart, viewport, print hoặc media. Chuẩn hóa shared primitives trước rồi mới migrate route consumers. Dùng semantic status registry cho success/warning/danger/info.

Các ngoại lệ bắt buộc: DICOM pixel viewport luôn `#000000`; print preview/PDF paper được giữ trắng với text tối; logo/hình ảnh giữ màu gốc; chart và semantic status được dùng hue riêng qua token/allowlist. Không thay đổi DICOM rendering, LUT, window/level, measurement behavior, API, database schema hoặc business logic.

Mở rộng `dashboard/scripts/check-ui-style.cjs` và test để chặn structural color literal mới, utility gray/slate/zinc/cyan tùy tiện, token drift và CSS variable không khai báo. Exception phải có ID và lý do, không allowlist cả file. Cập nhật `docs/antd-migration/CLINICAL_UI_STANDARD.md` sau khi contract mới ổn định.

Chia thay đổi thành các PR/commit nhỏ theo wave. Sau mỗi wave chạy lint, unit/integration test, build và style checker; tạo screenshot comparison cho các viewport 1920x1080, 1440x900 và 1366x768. Kiểm tra WCAG AA, keyboard focus, selected/hover/disabled, empty/loading/error, modal/drawer/dropdown/toast, print preview và OHIF. Không tuyên bố hoàn thành nếu chưa audit toàn bộ route liệt kê trong kế hoạch.

Khi kết thúc, cung cấp: (1) danh sách file đã đổi theo wave, (2) màu computed thực của vị trí 1 và palette canonical cuối, (3) inventory literal còn lại kèm exception ID, (4) kết quả lint/test/build/style/visual/contrast, (5) screenshot trước-sau, (6) functional regression checklist, và (7) hướng rollback. Nếu gặp code thay đổi ngoài phạm vi hoặc test lỗi có sẵn, không ghi đè; ghi nhận rõ và xử lý an toàn.
```