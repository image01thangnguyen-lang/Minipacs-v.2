# Phase 1 — AntD v5 Foundation, SSR và Exact Theme

## Mục tiêu

Tạo nền AntD ổn định cho Next.js App Router, không FOUC/hydration lỗi và áp dụng chính xác compact dark token.

## PR đề xuất

### PR1 — Dependencies và SSR

- Khóa phiên bản `antd`, package Next registry chính thức và optional icons.
- Tạo client `AppProviders`; root dùng SSR registry.
- `ConfigProvider` + AntD `App` + `viVN` locale.
- Giữ server boundary nhỏ; không thêm `use client` vào toàn bộ layout/page.

### PR2 — Clinical theme

- Tạo `clinicalTheme` đúng [Clinical UI Standard](./CLINICAL_UI_STANDARD.md).
- Đồng bộ legacy `--vin-*` trong thời gian coexistence.
- Quy định import/style order với Tailwind.
- Thiết lập popup container và CSP/nonce readiness.

### PR3 — Guardrails và playground

- Story/playground nội bộ cho all states của controls/table/modal.
- Mở rộng UI checker: size small, forbidden white, spacing, viewport token.
- Smoke test SSR refresh, dark background, modal/message context.

## Acceptance

- Dark + compact algorithms cùng hoạt động.
- Control 24px, font 12px, radius 2px; text không `#FFFFFF`.
- Refresh trực tiếp không flash trắng/unstyled và không hydration warning.
- Popup không clip trong shell thử nghiệm.
- Build/test/check-ui-style pass; bundle delta được ghi lại.

## Rollback

Provider nằm sau feature flag hoặc commit cô lập; có thể gỡ provider/dependencies mà không đổi route nghiệp vụ.

## Kế hoạch thực thi chi tiết

### PR1.1 — Dependency và App Router SSR registry

- Cài phiên bản AntD v5 tương thích React 18/Next 14, `@ant-design/nextjs-registry` và icon package chỉ nếu ADR cho phép; cập nhật lockfile.
- Tạo `dashboard/app/providers/AntdProvider.tsx` là client boundary nhỏ; `dashboard/app/layout.tsx` vẫn là Server Component nếu hiện trạng cho phép.
- Bọc registry ở root, sau đó `ConfigProvider` và `<App>` context. Thiết lập `locale={viVN}` và timezone không được ngầm thay đổi.
- Xác minh CSP/nonces, streaming SSR, direct refresh và route navigation; không dùng static `message/modal/notification` ngoài context.

### PR1.2 — Theme source of truth

- Tạo `dashboard/lib/ui/antd-theme.ts` chứa đúng token contract, typed `ThemeConfig`, không rải literal theo page.
- Thêm component tokens cho Table header/cell compact; các token bổ sung phải được giải thích.
- Bridge tạm thời token sang `globals.css`/legacy `--vin-*`; quy định rõ chiều source-of-truth AntD → legacy.
- Ép nền `html/body` tối ngay từ server CSS để không flash trắng; print stylesheet là ngoại lệ có kiểm soát.

### PR1.3 — Popup/layer và compact playground

- Tạo convention `getPopupContainer`; kiểm thử body, modal, drawer, scroll region và split pane.
- Tạo internal dev route/story chỉ trong non-production để kiểm tra Button/Input/Select/DatePicker/Form/Table/Tag/Tooltip/Dropdown/Modal/Drawer/notification ở mọi trạng thái.
- Kiểm tra focus restoration, Escape, tab trap, z-index và clipping.

### PR1.4 — Automated guardrails

- Mở rộng `dashboard/scripts/check-ui-style.cjs` theo Clinical UI Standard.
- Thêm tests xác nhận exact token values và algorithms order.
- Thêm script CI cho lint/typecheck/test/build/style check; ghi bundle delta.
- Không regex mù sửa code; checker phải có allowlist + lý do + expiry.

## File dự kiến

`dashboard/package.json`, lockfile, `dashboard/app/layout.tsx`, `dashboard/app/providers/AntdProvider.tsx`, `dashboard/lib/ui/antd-theme.ts`, `dashboard/app/globals.css`, `dashboard/scripts/check-ui-style.cjs`, tests và evidence phase 1. Tên thực tế phải theo cấu trúc đã khảo sát, không tạo bản trùng.

## Test matrix và evidence

- SSR HTML có style; không hydration warning/FOUC trên hard refresh.
- Token unit test: toàn bộ màu, spacing, height, font, radius.
- Visual playground ở 4 viewport + reduced motion.
- Popup/focus keyboard tests.
- Build và route smoke không tăng client boundary ngoài dự kiến.
- `docs/antd-migration/evidence/phase-1/PHASE_1_ACCEPTANCE.md` ghi command/exit code, screenshots, bundle before/after và rollback drill.

## Prompt giao cho AI thực thi Phase 1

```text
Hãy đóng vai Principal Next.js 14 + Ant Design v5 Engineer và thực thi DUY NHẤT Phase 1 theo docs/antd-migration/PHASE_1_ANTD_FOUNDATION.md.

Điều kiện đầu vào: đọc README, CLINICAL_UI_STANDARD, toàn bộ evidence/phase-0 và ADR; nếu Phase 0 NO-GO hoặc thiếu quyết định SSR/DataGrid/scope thì dừng và báo blocker. Trước sửa phải kiểm tra git status và code hiện tại, không ghi đè thay đổi ngoài phạm vi.

Triển khai AntD v5 SSR registry cho App Router với client boundary tối thiểu; ConfigProvider dùng đồng thời darkAlgorithm + compactAlgorithm và CHÍNH XÁC token bắt buộc; dùng AntD App context; nền server tối chống flash trắng; viVN locale; popup convention; compact component playground; guardrails CI. Button/Input/Select/Tag/Form control phải small, Table small, viewport #000000 và overlay #13C2C2. Không dùng #FFFFFF, không migration route nghiệp vụ, không đổi API/database/authz.

Phải thêm tests cho token/SSR/style guard, chạy lint/typecheck/test/build/UI check phù hợp, ghi mọi command và exit code cùng bundle delta vào docs/antd-migration/evidence/phase-1/PHASE_1_ACCEPTANCE.md. Nếu API package khác dự kiến, tra version đã khóa thay vì đoán. Kết thúc bằng file diff summary, test evidence, known issues, rollback steps và GO/NO-GO; không làm Phase 2.
```
