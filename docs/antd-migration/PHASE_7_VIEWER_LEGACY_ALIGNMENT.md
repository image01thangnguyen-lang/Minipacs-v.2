# Phase 7 — OHIF Alignment và Legacy Frontend Disposition

## Mục tiêu

Đạt trải nghiệm thị giác nhất quán mà không tạo fork OHIF khó nâng cấp, đồng thời loại bỏ frontend trùng lặp.

## OHIF

- Không đưa AntD vào core OHIF chỉ để đồng nhất component.
- Dùng theme/custom CSS/extension boundary hiện hữu.
- Viewport tuyệt đối `#000000`; overlay chuẩn `#13C2C2`.
- Shell/toolbar/panel: `#141414`, `#1F1F1F`, `#262626`; text `#E0E0E0`; border `#303030`.
- Toolbar icon-first, compact, active cyan-soft; giữ shortcut và measurement state.
- Test viewport loading/error để không có flash trắng.

## Root Vite app

### Nếu legacy/không deploy

- Xác minh traffic/build/owner.
- Archive hoặc xóa khỏi release path; cập nhật README/scripts/dependencies.

### Nếu còn deploy

- Tạo provider/theme riêng tương thích React/Vite.
- Tách `App.tsx` lớn thành modules trước migration.
- Dùng cùng clinical token contract và adapter convention; không copy code Next-specific.

## Gate

- Có quyết định chính thức và owner cho từng frontend.
- Không fork OHIF core ngoài allowlist.
- Viewer viewport/overlay token có automated check và screenshot.
- Không còn hai dashboard production không rõ source of truth.

## Kế hoạch thực thi chi tiết

### Workstream 7A — OHIF boundary audit

- Inventory `config/ohif-custom.css/js`, Docker OHIF, app config template, nginx và extensions.
- Phân biệt source-owned extension với upstream bundle; ghi upgrade-safe customization points.
- Baseline viewport, toolbar, side panels, overlay, loading/error/fullscreen và multiple layouts.

### Workstream 7B — Token alignment

- Map exact clinical colors/spacing vào OHIF theme/custom CSS, không import toàn bộ AntD runtime.
- Bảo vệ canvas/viewport `#000000` và overlay `#13C2C2`; không global selector làm đổi màu pixel area.
- Toolbar compact/icon-first, active cyan-soft; giữ tool groups, shortcut, measurement, hanging protocol.
- Kiểm tra DICOM display không bị filter/opacity/CSS transform ngoài ý muốn.

### Workstream 7C — Root Vite disposition

- Thu thập deployment/traffic/owner evidence.
- Nếu retire: remove khỏi build/deploy theo PR riêng, redirect/runbook và rollback artifact.
- Nếu active: lập sub-plan và migration bằng cùng token/adapter contract, không tái dùng Next registry; tách monolith trước.

### Validation

Viewer launch từ mọi entry point, correct Study UID, loading/error/offline, measurements, key images, layouts, fullscreen, keyboard, no white flash. Test image quality là invariant; visual test UI không thay thế DICOM rendering QA.

## Prompt giao cho AI thực thi Phase 7

```text
Hãy thực thi DUY NHẤT Phase 7 theo docs/antd-migration/PHASE_7_VIEWER_LEGACY_ALIGNMENT.md với vai trò OHIF/React integration specialist. Trước sửa, audit config/build/deployment và chứng minh boundary nào dự án sở hữu. Không fork hoặc sửa trực tiếp upstream OHIF core, không thêm AntD runtime vào viewer chỉ để đổi giao diện.

Đồng bộ theme qua extension/config/custom CSS upgrade-safe: viewport bắt buộc #000000, overlay #13C2C2, shell/panel/text/border theo exact clinical tokens, compact toolbar icon-first và active cyan-soft. Bảo toàn DICOM rendering, measurements, tool state, hanging protocols, key images, fullscreen, shortcuts và đúng Study UID. Test loading/error/offline để không flash trắng.

Điều tra root Vite bằng deployment/traffic/owner evidence. Chỉ retire khi có bằng chứng và rollback; nếu active, viết sub-plan + triển khai trong boundary Vite phù hợp, không copy Next SSR code. Chạy viewer smoke/integration/visual/build và ghi commands/exit codes/screenshots/boundary/upgrade risk/Vite decision tại docs/antd-migration/evidence/phase-7/. Kết thúc GO/NO-GO; không làm Phase 8.
```
