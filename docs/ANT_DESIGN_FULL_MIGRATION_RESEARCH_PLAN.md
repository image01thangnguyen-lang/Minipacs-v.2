# Nghiên cứu và kế hoạch chuyển MiniPACS sang Ant Design

## 1. Kết luận điều hành

Có thể chuyển **Dashboard/RIS** của dự án sang Ant Design (AntD), và đây là hướng khả thi về kỹ thuật với stack hiện tại (`Next.js 14`, `React 18`, TypeScript). Tuy nhiên, không nên hiểu “chuyển toàn bộ dự án” là thay mọi JSX/CSS trong một lần hoặc ép cả OHIF Viewer dùng AntD.

Khuyến nghị:

1. Dùng **Ant Design 5** làm design system chính cho `dashboard/`.
2. Giữ các **domain adapter** hiện có (`SharedDataGrid`, `StatusBadge`, `FilterBar`, các contract nghiệp vụ), nhưng thay implementation bên trong bằng AntD trước. Cách này giảm số màn hình phải sửa đồng thời và giữ ổn định hành vi.
3. Cho Tailwind và AntD cùng tồn tại trong giai đoạn chuyển tiếp; chỉ gỡ Tailwind sau khi số class còn lại đủ thấp và các layout đặc thù đã được xử lý.
4. Giữ CSS tùy biến cho Doctor Workspace, split pane, vùng báo cáo/in ấn và các layout PACS mật độ cao. AntD cung cấp component, không thay thế toàn bộ bài toán layout chuyên ngành.
5. Xem `ohif-viewer/` và container OHIF là một sản phẩm con độc lập. Chỉ đồng bộ màu sắc/branding bằng OHIF theme/CSS/extension; **không migration lõi OHIF sang AntD**.
6. Xác minh vai trò của app Vite ở root (`src/App.tsx`). `docker-compose.yml` hiện chỉ deploy `dashboard`, OHIF và backend; app Vite có dấu hiệu là preview/legacy. Nên quyết định archive/xóa hoặc migration riêng, tránh làm hai frontend trùng chức năng.

Đây là một **chương trình migration theo module**, không phải thay thư viện trong một PR.

---

## 2. Hiện trạng đã khảo sát

### 2.1. Các bề mặt giao diện trong repository

| Bề mặt | Công nghệ | Vai trò | Khuyến nghị |
|---|---|---|---|
| `dashboard/` | Next.js 14 App Router, React 18, Tailwind 3 | Dashboard/RIS chính, được deploy trong Docker | Migration đầy đủ sang AntD |
| `src/` ở root | Vite, React 19, Tailwind 4, một `App.tsx` khoảng 918 dòng | Preview/legacy dashboard | Xác minh; ưu tiên archive, nếu còn dùng thì migration riêng |
| `ohif-viewer/`, image OHIF | OHIF ecosystem | DICOM diagnostic viewer | Không thay bằng AntD; chỉ theme/branding hoặc extension có kiểm soát |
| Report/print preview | HTML/CSS, `react-to-print`, editor | Phiếu kết quả cần kích thước in ổn định | Giữ CSS print chuyên biệt, không ép AntD layout |

### 2.2. Quy mô sơ bộ của `dashboard/`

Quét tĩnh `dashboard/app` và `dashboard/components` cho thấy:

- 143 file TSX;
- 62 route `page.tsx`;
- khoảng 4.321 chỗ dùng `className`;
- 299 nút HTML, 167 input, 38 select, 41 textarea và 39 bảng HTML;
- 77 file dùng `lucide-react`;
- 19 chỗ dùng `SharedDataGrid`;
- 43 chỗ dùng `CustomSelect`;
- 6 chỗ dùng `CustomDatePicker`.

Các con số là chỉ báo khối lượng, không phải số component độc lập (một component có thể xuất hiện nhiều lần hoặc render theo vòng lặp).

### 2.3. Design system hiện tại

Dashboard hiện dùng:

- semantic CSS variables `--vin-*` trong `app/globals.css`;
- Tailwind custom colors `vin.*` trong `tailwind.config.js`;
- các shared primitive tự xây như:
  - `AppShell`, `PageCanvas`, `PagePanel`, `KpiCard`;
  - `FormInput`, `FormSelect`, `FilterBar`, `WorkspaceHeader`;
  - `SharedDataGrid`, `StatusBadge`, loading/empty/error states;
  - `CustomSelect`, `CustomDatePicker`;
  - modal/menu và nhiều native form controls phân tán.

Điểm thuận lợi là dự án đã có **shared contract** tách khỏi presentation, đặc biệt `SharedDataGridProps`, `ColumnDef`, `StatusBadgeProps`. Đây là seam tốt để thay implementation mà không đổi nghiệp vụ toàn bộ consumer.

Điểm khó là vẫn còn nhiều thế hệ UI, nhiều native controls và utility class viết trực tiếp ở route. Kế hoạch chuẩn hóa Vin UI hiện tại cũng ghi nhận theme island, overflow ownership và thiếu visual regression. Migration AntD phải giải quyết các vấn đề đó, không chỉ đổi màu.

---

## 3. Kiến trúc đích đề xuất

### 3.1. Nguyên tắc

- AntD là **component engine và token engine**.
- `vin-*` vẫn là ngôn ngữ thương hiệu/ngữ nghĩa của sản phẩm trong giai đoạn đầu.
- Component nghiệp vụ không import AntD tùy tiện ở mọi nơi; ưu tiên import qua lớp UI nội bộ.
- Server component giữ nguyên là server component khi không cần tương tác. AntD interactive component được đặt trong client wrapper nhỏ, tránh biến cả page thành client component.
- Không thay server actions, authorization, query URL, autosave, telemetry hay data contract trong PR giao diện.

### 3.2. Cấu trúc gợi ý

```text
dashboard/
  app/
    layout.tsx
    providers.tsx                 # client boundary cho ConfigProvider/App
    components/ui/
      adapters/
        Button.tsx
        Select.tsx
        DatePicker.tsx
        DataGrid.tsx
        Modal.tsx
        StatusBadge.tsx
      theme/
        antd-theme.ts             # ThemeConfig + component tokens
        semantic-tokens.ts
      ...domain/shared components
```

Consumer nên tiếp tục dùng UI nội bộ, ví dụ `SharedDataGrid`, thay vì import thẳng `Table` ở 19 màn hình. Với component đơn giản, có thể cho phép import AntD trực tiếp theo convention đã thống nhất.

### 3.3. Provider và SSR cho Next.js App Router

Cần bổ sung:

- `antd`;
- `@ant-design/icons` nếu quyết định chuẩn hóa icon;
- package registry SSR chính thức tương ứng với phiên bản Next/AntD (thường là `@ant-design/nextjs-registry`), sau khi khóa và kiểm thử phiên bản.

Root layout dự kiến có dạng khái niệm:

```tsx
<AntdRegistry>
  <AppProviders>{children}</AppProviders>
</AntdRegistry>
```

`AppProviders` là client component chứa:

```tsx
<ConfigProvider theme={vinTheme} locale={viVN}>
  <App>{children}</App>
</ConfigProvider>
```

Lưu ý quan trọng:

- Dùng `App` của AntD nếu gọi `message`, `notification`, `modal` theo context; tránh static API không nhận theme/context.
- Kiểm tra SSR để không có flash of unstyled content, style duplication hoặc hydration mismatch.
- Đặt `locale={viVN}` và thống nhất timezone/date format. AntD dùng Day.js trong các date components; không tự chuyển đổi UTC/local ngầm.
- Với CSP nghiêm ngặt sau này, cấu hình nonce cho CSS-in-JS cần được thiết kế ngay từ provider.

---

## 4. Ánh xạ Vin theme sang AntD token

Không nên sửa sâu selector `.ant-*` làm cách chính. Dùng `ConfigProvider.theme.token` và `theme.components` trước, CSS override chỉ cho ngoại lệ.

| Vin token hiện tại | AntD token đích gợi ý |
|---|---|
| `--vin-accent` | `colorPrimary` |
| `--vin-accent-hover` | `colorPrimaryHover` |
| `--vin-bg-root` | `colorBgBase`, nền shell ngoài |
| `--vin-bg-shell` | `colorBgLayout`, `colorBgContainer` tùy cấp |
| `--vin-bg-panel` | `colorBgContainer` |
| `--vin-bg-panel-2` | `colorFillAlter`, header/table/filter surfaces |
| `--vin-border-subtle` | `colorBorder`, `colorSplit` |
| `--vin-border-strong` | `colorBorderSecondary` hoặc component token |
| `--vin-text-primary` | `colorText` |
| `--vin-text-secondary` | `colorTextSecondary` |
| `--vin-text-muted/faint` | `colorTextTertiary`, `colorTextQuaternary` |
| status variables | `colorSuccess`, `colorWarning`, `colorError`, custom `Tag` variants |

Theme nên bắt đầu từ dark algorithm:

```ts
const vinTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#18b9d0",
    colorBgBase: "#081f2a",
    colorBgLayout: "#081f2a",
    colorBgContainer: "#1f3037",
    colorBorder: "#315060",
    colorText: "#ffffff",
    colorTextSecondary: "#d8edf4",
    borderRadius: 6,
    controlHeight: 36,
    fontSize: 13,
  },
  components: {
    Table: { /* compact clinical table tokens */ },
    Form: { /* label/color/spacing */ },
    Modal: { /* dark panel and mask */ },
  },
};
```

Giá trị cụ thể phải được hiệu chỉnh bằng contrast test và screenshot. Không xóa CSS variables ngay: dùng chúng làm nguồn tương thích cho vùng chưa migration, hoặc tham chiếu chúng trong cấu hình theme nếu phù hợp.

---

## 5. Ma trận thay thế component

| Hiện tại | AntD đích | Cách migration |
|---|---|---|
| native `<button>` | `Button` | Chuẩn hóa type, loading, danger, icon, tooltip và focus |
| native input / `FormInput` | `Input`, `InputNumber`, `Password`, `Search` | Giữ React Hook Form qua `Controller` khi cần |
| native textarea | `Input.TextArea` | Giữ max length và autosave/debounce |
| `CustomSelect` | `Select` | Viết adapter giữ API `{value,label}`, hidden/form behavior nếu còn cần |
| `CustomDatePicker` | `DatePicker`, `RangePicker` | Adapter chuyển `Dayjs <-> yyyy-mm-dd`; test timezone |
| custom/native checkbox/radio | `Checkbox`, `Radio`, `Switch` | Không đổi semantic server action payload |
| custom modal/portal | `Modal`, `Drawer` | Chuẩn hóa focus trap, close behavior, `destroyOnClose`/preserve state |
| custom action menu | `Dropdown`, `Menu` | Kiểm tra quyền, destructive confirm và keyboard |
| toast tự quản lý | `message` / `notification` | Gọi qua AntD `App` context |
| confirm tự quản lý | `Modal.confirm` hoặc `Popconfirm` | Với thao tác lâm sàng/nguy hiểm ưu tiên modal rõ hậu quả |
| status badge | `Tag` qua `StatusBadge` adapter | Giữ domain registry và label tiếng Việt |
| loading/empty/error | `Skeleton`, `Spin`, `Empty`, `Result`, `Alert` | Giữ aria-live/role phù hợp |
| tabs tự xây | `Tabs`, `Segmented` | Giữ URL state và permission filtering |
| KPI card/panel | `Card`, `Statistic` | Không dùng Grid cứng gây co nội dung |
| native table | `Table` | Chuẩn hóa columns, sorting, pagination, sticky, expandable |
| `SharedDataGrid` | adapter trên `Table` hoặc giữ custom grid | Không thay contract consumer ở đợt đầu |
| pagination tự xây | `Pagination` | URL/server pagination vẫn là source of truth |
| sidebar/navigation | `Layout`, `Sider`, `Menu` hoặc menu adapter | Giữ permission-aware tree và responsive/collapsed state |
| form rải rác | `Form` + RHF/Zod adapter | Không bắt buộc bỏ React Hook Form |
| upload native | `Upload` | Kiểm tra multipart Server Action và validate file |
| icons Lucide | AntD Icons hoặc tiếp tục Lucide | Chọn một convention; không bắt buộc đổi ngay |

### 5.1. Quyết định riêng cho DataGrid

`SharedDataGrid` hiện có selection, sort callback, sticky/pinned cell, keyboard navigation, density và render cap. AntD `Table` đáp ứng phần lớn nhưng không tương đương hoàn toàn:

- `renderLimit` hiện không phải virtualization thật;
- pinned offset tùy biến và focus model cần kiểm thử;
- click, double-click, Enter/Space và arrow navigation là hành vi lâm sàng đang có;
- server-side sort/pagination phải không bị biến thành client-side ngoài ý muốn;
- bảng rất rộng và nhiều hàng có thể cần virtual table hoặc giải pháp grid chuyên dụng, không nên mặc định render toàn bộ bằng AntD Table.

Khuyến nghị làm một adapter `SharedDataGrid -> AntD Table` và pilot trên một trang admin trước. Doctor Workspace chỉ cutover sau benchmark và accessibility regression. Nếu AntD Table không đáp ứng keyboard/pinned/performance, vẫn giữ custom `SharedDataGrid` nhưng theme theo token AntD; “dùng Ant Design” không đồng nghĩa phải loại bỏ mọi component tùy biến.

### 5.2. Form và Server Actions

Dự án đang dùng cả React Hook Form/Zod, native form và Next Server Actions. Không nên đổi đồng thời sang state model của AntD Form trên toàn hệ thống.

- Form phức tạp đã có RHF/Zod: giữ RHF, dùng `Controller` cho `Select`, `DatePicker`, `Upload`.
- Form server action đơn giản: bảo đảm adapter vẫn phát sinh `name/value` hoặc tạo hidden input/FormData rõ ràng.
- DatePicker trả về Day.js object: chuyển đổi tại boundary, không lưu object vào URL/DB.
- Reset/default value/dirty state/autosave phải có integration test, nhất là report workspace.

---

## 6. Những phần không nên “AntD hóa” máy móc

1. **OHIF Viewer:** toolbar/viewport của OHIF phụ thuộc extension framework và interaction imaging. Chỉ đồng bộ brand/theme; không fork lớn chỉ để dùng AntD.
2. **Doctor Workspace 7 vùng:** split pane, CSS grid variables, drag resizing và ownership overflow là domain layout. Có thể dùng AntD controls bên trong nhưng giữ layout engine hiện tại.
3. **Báo cáo in/PDF:** giấy A4, font, margin, chữ ký và page-break cần CSS print deterministic; AntD component có thể sinh DOM/CSS không phù hợp bản in.
4. **Tiptap editor:** giữ editor, chỉ bọc toolbar/control bằng AntD nếu cần.
5. **Data grids lâm sàng hiệu năng cao:** quyết định theo benchmark, không theo mục tiêu “100% component AntD”.
6. **CSS utility cho layout vi mô:** AntD không thay thế hoàn toàn flex/grid/overflow. Có thể giữ Tailwind hoặc chuyển dần sang CSS Modules; không nên dùng inline style tràn lan.

---

## 7. Kế hoạch triển khai theo giai đoạn/PR

### Phase 0 — Chốt phạm vi và baseline (1–2 tuần)

- Chốt định nghĩa “toàn bộ”: Dashboard là phạm vi chính; xác minh app Vite; OHIF/print là ngoại lệ có chủ đích.
- Lập inventory đủ 62 route: owner, permission, data states, controls, modal, table, responsive và criticality.
- Chụp screenshot baseline ở 1024×768, 1366×768, 1440×900, 1920×1080.
- Ghi performance baseline cho worklist/workspace: first render, interaction, rows, bundle size.
- Chốt AntD version bằng lockfile và thử compatibility Next 14/React 18.

**Gate:** không bắt đầu mass migration khi chưa có route inventory và baseline.

### Phase 1 — Foundation AntD (1 tuần)

- Cài dependency; thêm SSR registry, `ConfigProvider`, `App`, locale Việt Nam.
- Tạo `vinTheme`, component tokens và theme playground nội bộ.
- Thiết lập style order với Tailwind; reset CSS có chủ đích, kiểm tra form/native/print không bị ảnh hưởng.
- Tạo smoke page/test xác nhận SSR, hydration, popup container, dark mode, message/modal.

**Gate:** build không warning hydration; refresh trực tiếp route không FOUC; theme dark đúng.

### Phase 2 — Adapter layer và primitive (2–3 tuần)

- Thay implementation `CustomSelect` bằng AntD Select nhưng giữ public props trước.
- Thay `CustomDatePicker` bằng adapter DatePicker với contract chuỗi ngày hiện tại.
- Tạo Button/Input/TextArea/Checkbox/Modal/Drawer/Dropdown adapters/conventions.
- Chuyển `PagePanel`, KPI, state components, `StatusBadge`, `FilterBar`, `WorkspaceHeader`.
- Thêm test cho form payload, keyboard, disabled/loading và status registry.

**Gate:** consumer cũ hoạt động mà chưa cần sửa hàng loạt; không mất server action field.

### Phase 3 — Pilot route ít rủi ro (1–2 tuần)

Chọn một route CRUD/admin có đủ table + form + modal nhưng không critical, ví dụ một catalog page:

- chuyển hoàn chỉnh sang AntD;
- đo bundle/performance và kiểm tra responsive;
- hoàn thiện coding conventions dựa trên vấn đề thực tế;
- xác nhận Table adapter và form adapter.

**Gate:** Product/QA duyệt pilot trước khi mở rộng.

### Phase 4 — Admin, Settings, Support (3–5 tuần)

Migration theo cụm để tăng reuse:

1. Admin catalogs/users/facilities/PACS/storage/templates;
2. permission matrix và admin ops;
3. settings profile/report templates;
4. support incidents/training/change governance;
5. quality governance và analytics admin.

Mỗi module phải hoàn tất list/detail/create/edit/modal, không để nửa native nửa AntD kéo dài.

### Phase 5 — Operational lists và analytics (3–4 tuần)

- Command Center;
- Statistics và drilldown;
- Non-DICOM;
- Consultations;
- Archive;
- Worklist list/filter/actions.

Áp dụng server-side pagination/filter/sort rõ ràng, không để AntD tự lọc dữ liệu không đầy đủ trên client.

### Phase 6 — Doctor Workspace và report workflow (3–5 tuần)

- Chuyển control trong từng region, không thay layout 7 vùng cùng lúc.
- Thứ tự: search/facets → related studies → patient context → report controls → dialogs/actions.
- Pilot `SharedDataGrid` AntD trên feature flag; benchmark trước cutover.
- Test kỹ dirty guard, revisioned autosave, conflict recovery, report sign/finalize, print/share/consultation.

### Phase 7 — Legacy Vite và OHIF alignment (0.5–2 tuần tùy quyết định)

- Nếu root Vite không deploy: archive/xóa dependency/build path sau khi xác nhận không còn người dùng.
- Nếu còn deploy: tạo AntD provider/theme riêng cho React 19/Vite và migration `App.tsx` thành module nhỏ; không copy nguyên architecture Next.js.
- Đồng bộ OHIF dark teal branding bằng cơ chế theme/custom CSS hiện hữu, không đưa AntD vào core OHIF nếu không có extension use case cụ thể.

### Phase 8 — Cleanup và cutover (1–2 tuần)

- Xóa component legacy chỉ khi không còn consumer.
- Giảm/gỡ Lucide nếu đã chọn AntD Icons; nếu giữ Lucide thì ghi rõ convention.
- Quét native controls/class legacy; cập nhật `check-ui-style.cjs` thành guard mới.
- Chỉ cân nhắc gỡ Tailwind khi print/workspace/layout còn lại đã có giải pháp thay thế và lợi ích bundle/build được chứng minh.
- Chạy full build/test/UAT/visual regression; rollout bằng feature flag/cohort với rollback.

---

## 8. Chiến lược Tailwind: không gỡ ngay

Ba lựa chọn:

### A. AntD + Tailwind lâu dài — khuyến nghị ban đầu

- AntD cho controls/component/token.
- Tailwind cho layout/spacing/specialized workspace.
- Ít rủi ro, migration nhanh hơn.
- Cần convention để tránh utility override internals của AntD.

### B. AntD + CSS Modules

- Phù hợp nếu mục tiêu tổ chức là loại Tailwind.
- Khối lượng lớn vì đang có hơn 4.000 `className` và nhiều utility layout.
- Nên làm sau functional migration, không gộp cùng lúc.

### C. Chỉ AntD, gần như không custom CSS

Không thực tế cho PACS workspace, print, split pane và dense grid. Không khuyến nghị.

---

## 9. Rủi ro chính và biện pháp giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| SSR CSS-in-JS/FOUC/hydration trong App Router | Cao | Registry chính thức, provider test, build/refresh smoke |
| Bundle JS/CSS tăng | Cao | Import theo module/tree-shaking, bundle analyzer, không import locale/icon barrel không cần thiết |
| Biến server component thành client quá rộng | Cao | Client wrapper nhỏ, giữ data fetching/server actions ở server boundary |
| Table mất keyboard/pinned/performance | Cao | Adapter + pilot + benchmark + feature flag; giữ custom grid nếu cần |
| Date lệch timezone/format | Cao | Chuỗi ISO date tại boundary, test UTC+7, không truyền Day.js xuống DB |
| Form mất `name`, dirty state hoặc Server Action payload | Cao | RHF adapter, hidden field rõ ràng, integration test create/edit/upload |
| Popup bị clip/z-index sai trong split pane/modal | Trung bình-cao | Quy ước `getPopupContainer`, kiểm tra scroll container, modal/dropdown nesting |
| Theme dark không đạt contrast | Trung bình-cao | Token audit + axe/contrast + screenshot state matrix |
| CSS Tailwind và AntD xung đột reset/order | Trung bình | Khóa import order, hạn chế global override, test print/native controls |
| UI quá “consumer”, giảm mật độ lâm sàng | Cao | Component token compact, density presets, UAT bác sĩ/kỹ thuật viên |
| Big-bang làm gián đoạn nghiệp vụ | Rất cao | Migration theo module, adapter, feature flag và rollback |
| Fork OHIF để đồng nhất UI gây nợ nâng cấp | Cao | Theme/branding only, extension boundary, tránh sửa core |

---

## 10. Testing và Definition of Done

### 10.1. Mỗi component adapter

- controlled/uncontrolled value (nếu hỗ trợ);
- disabled, loading, error, empty options;
- keyboard/focus/ARIA;
- form `name/value` và submit payload;
- popup trong scroll/modal/split pane;
- Vietnamese labels và long text;
- dark theme và contrast.

### 10.2. Mỗi route

- loading, empty, populated, error, permission denied;
- 4 viewport chuẩn;
- sort/filter/pagination/URL deep link;
- create/edit/delete/confirm/upload;
- back/forward browser và refresh trực tiếp;
- không double scrollbar, popup clipping, horizontal overflow ngoài grid;
- permission và Server Action không đổi.

### 10.3. Critical clinical regression

- selection và keyboard navigation worklist;
- mở viewer đúng Study Instance UID;
- report autosave/dirty guard/conflict;
- sign/finalize/unfinalize/deliver;
- consultation/share/export/print;
- scope authorization và action visibility;
- PHI scrubber/telemetry không ghi thêm dữ liệu nhạy cảm.

### 10.4. Gate kỹ thuật toàn chương trình

- `npm run build`, test hiện có và UI style checks pass;
- không có hydration warning ở console;
- không tăng bundle/performance vượt ngân sách đã chốt;
- screenshot regression được duyệt;
- 100% route inventory có trạng thái: migrated, intentional exception hoặc decommissioned;
- rollback được thử trước production cutover.

---

## 11. Ước lượng sơ bộ

Với quy mô 62 route/143 TSX và nhiều workflow lâm sàng, ước lượng cho **một kỹ sư frontend có hiểu codebase**, có QA/Product hỗ trợ:

| Phạm vi | Công sức sơ bộ |
|---|---:|
| Foundation + adapters + một pilot | 4–7 người-tuần |
| Admin/Settings/Support/Quality | 4–7 người-tuần |
| Lists/Analytics/Archive/Consultation/Worklist | 4–6 người-tuần |
| Doctor Workspace/report critical flow | 3–5 người-tuần |
| Cleanup, regression, UAT, rollout | 2–4 người-tuần |
| **Tổng Dashboard** | **17–29 người-tuần** |

Hai kỹ sư không làm thời gian giảm đúng một nửa vì foundation, review và UAT có dependency. Lịch thực tế hợp lý thường khoảng **10–16 tuần với 2 frontend engineers + QA bán/toàn thời gian**, tùy mức pixel parity, coverage automation và số route legacy được decommission thay vì migration.

Nếu chỉ mục tiêu “giao diện nhìn giống AntD” mà bỏ adapter, regression và clinical UAT thì có thể nhanh hơn, nhưng rủi ro lỗi nghiệp vụ rất cao và không được khuyến nghị.

Ước lượng cần được hiệu chỉnh sau Phase 0 bằng inventory theo điểm:

- S: static/simple list;
- M: CRUD + form/modal/table;
- L: nhiều tab, server pagination, permission, upload;
- XL: worklist/workspace/report/autosave/print.

---

## 12. Các quyết định cần chốt trước khi code

1. “Toàn bộ” có bao gồm root Vite không, hay app đó được decommission?
2. AntD áp dụng cho Dashboard; OHIF chỉ branding — có chấp nhận ngoại lệ này không?
3. Có giữ Tailwind lâu dài cho layout hay mục tiêu cuối là CSS Modules?
4. Giữ Lucide hay chuẩn hóa sang AntD Icons?
5. Mức parity mong muốn: giữ nguyên Vin dark teal hay chuyển gần giao diện mặc định AntD?
6. Có giữ contract `SharedDataGrid` và adapter-first như đề xuất không?
7. Ngân sách bundle/performance và browser/viewport hỗ trợ là gì?
8. Route nào có thể decommission để giảm phạm vi?
9. Ai duyệt clinical density, keyboard workflow và report/print output?

---

## 13. Đề xuất bước tiếp theo

Không nên bắt đầu bằng việc chạy `npm install antd` rồi sửa route lớn. Bước tiếp theo an toàn là tạo một **AntD migration pilot PR** gồm:

1. khóa version và thêm SSR/theme provider;
2. tạo Vin dark theme;
3. adapter cho Button, Select, DatePicker, StatusBadge và state components;
4. migration một trang catalog admin đại diện;
5. đo bundle, SSR/hydration, accessibility và screenshot;
6. dùng kết quả pilot để chốt estimate và convention cho 61 route còn lại.

Nếu pilot đạt gate, triển khai theo các phase ở trên. Nếu Table hoặc CSS-in-JS không đạt yêu cầu PACS, vẫn có thể dùng AntD cho form/navigation/modal và giữ grid/layout chuyên dụng; đó là kiến trúc hybrid hợp lý hơn một mục tiêu “100% AntD” hình thức.