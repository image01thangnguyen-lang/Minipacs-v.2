# Ant Design v5 Clinical UI Standard

## 1. Theme contract bắt buộc

```ts
import { theme, type ThemeConfig } from "antd";

export const clinicalTheme: ThemeConfig = {
  algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
  token: {
    colorPrimary: "#13C2C2",
    colorInfo: "#13C2C2",
    colorSuccess: "#389E0D",
    colorWarning: "#D48806",
    colorError: "#CF1322",
    colorBgBase: "#141414",
    colorBgContainer: "#1F1F1F",
    colorBgElevated: "#262626",
    colorTextBase: "#E0E0E0",
    colorTextSecondary: "#8C8C8C",
    colorBorder: "#303030",
    borderRadius: 2,
    controlHeight: 24,
    fontSize: 12,
    marginXXS: 2,
    marginXS: 4,
    marginSM: 8,
    paddingXXS: 2,
    paddingXS: 4,
    paddingSM: 8,
  },
  components: {
    Table: {
      headerBg: "#1F1F1F",
      headerColor: "#E0E0E0",
      borderColor: "#303030",
      cellPaddingBlockSM: 2,
      cellPaddingInlineSM: 4,
    },
  },
};
```

Không tự ý thay giá trị. Token bổ sung phải qua UI ADR, có contrast check và không phá các token trên.

## 2. Component rules

### Table

```tsx
<Table size="small" pagination={false} columns={columns} dataSource={rows} />
```

- Header `#1F1F1F`; row/cell padding 2–4px.
- Dữ liệu lớn dùng server pagination hoặc virtualization; không render vô hạn.
- `rowKey` ổn định; sort/filter state lấy URL/server làm source of truth.
- Truncate bằng ellipsis + Tooltip; không tăng row height tùy tiện.
- Selection, Enter/Space, arrow navigation và double-click phải được test.

### Controls

- `Button`, `Input`, `InputNumber`, `Select`, `DatePicker`, `Tag` và control trong `Form`: `size="small"`.
- `Form` dùng compact vertical/horizontal layout; label ngắn, không tạo khoảng trắng 24px.
- Date boundary là chuỗi ISO/date-only; không đưa Day.js object vào DB/URL.
- RHF/Zod được giữ; dùng `Controller` cho AntD controlled components.

### Toolbar

```tsx
<Space size="small">
  <Button type="text" size="small" icon={<ToolOutlined />} aria-pressed={active} />
</Space>
```

- Icon-only phải có `aria-label` và Tooltip.
- Active: nền cyan có alpha thấp, icon/text `#13C2C2`.
- Destructive action không dựa vào màu duy nhất; có confirm và label/tooltip rõ.

### Layout

- Spacing scale chỉ 2/4/8px mặc định.
- Panel ghép sát; border 1px `#303030`; radius 2px.
- Sidebar có collapse/resize và lưu preference.
- Một vùng = một scroll owner; header/toolbar có thể sticky.
- Không dùng Card padding mặc định lớn; override bằng component token/wrapper.

## 3. DICOM viewport

- Viewport: `background: #000000` tuyệt đối.
- Overlay: `#13C2C2`; warning/error có thể dùng semantic color đã chuẩn hóa.
- Không đặt panel `#141414` lên vùng pixel ảnh.
- Overlay không che anatomy quan trọng; hỗ trợ bật/tắt và đổi góc.
- Toolbar viewer giữ mật độ cao, icon-first, keyboard shortcut và trạng thái active rõ.

## 4. Dark-room ergonomics

- Không dùng `#FFFFFF`, nền sáng, flash trắng khi loading hoặc in-app navigation.
- Focus ring phải nhìn thấy nhưng không quá chói.
- Trạng thái không truyền đạt chỉ bằng màu; dùng icon/label/pattern.
- Font 12px là chuẩn UI; dữ liệu ảnh/overlay phải được kiểm tra trên màn hình chẩn đoán thực tế.
- Giảm animation; tôn trọng `prefers-reduced-motion`.

## 5. Popup và layer

- Quy ước `getPopupContainer` để Select/Dropdown/Tooltip không bị clip trong split pane.
- Modal/Drawer/Dropdown phải test nested focus và z-index.
- Dùng AntD `App` context cho `message`, `notification`, modal; tránh static API mất theme/context.

## 6. Enforcement

Mở rộng `check-ui-style.cjs` hoặc ESLint để chặn:

- AntD Table thiếu `size="small"`;
- control thiếu `size="small"` khi wrapper không ép được;
- `Space` có size `middle/large`;
- literal `#FFFFFF`/`#fff` trong UI runtime;
- spacing 16/24/32px không có allowlist;
- DICOM viewport khác `#000000` hoặc overlay chuẩn khác `#13C2C2`;
- import AntD static message/modal trái convention.

Ngoại lệ phải có comment ID liên kết ADR và ngày review lại.
