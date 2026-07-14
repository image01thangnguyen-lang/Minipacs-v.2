# Phase 3 — Admin Vertical-Slice Pilot

## Mục tiêu

Chứng minh foundation/adapters trên một luồng CRUD thật nhưng ít rủi ro trước mass migration.

## Phạm vi pilot

Chọn một trang catalog admin có list + filter + create/edit modal + confirm delete + permission. Không chọn Worklist/Doctor Workspace.

## Công việc

1. Chuyển page header/filter/toolbar/form/table/states sang AntD adapter.
2. Table bắt buộc `size="small"`; `pagination={false}` nếu dataset nhỏ, server pagination nếu lớn.
3. Header `#1F1F1F`, cell spacing 2/4px, ellipsis + tooltip.
4. Form control small; label/gap tối đa 4–8px.
5. Toolbar text/icon; destructive action có confirm.
6. Giữ permission checks, Server Actions, validation và audit log.
7. Chụp visual states và đo bundle/render/interaction.
8. UAT keyboard-only và dark-room với người dùng đại diện.

## Gate Go/No-Go

- CRUD và permission regression pass.
- Không FOUC, clipping, double scrollbar.
- Mật độ hàng và số dữ liệu nhìn thấy bằng hoặc tốt hơn baseline.
- Clinical/UI owner duyệt độ chói, compactness và focus.
- Performance không vượt budget; nếu vượt phải tối ưu trước Phase 4/5.
- Convention được cập nhật từ bài học pilot.

## Rollback

Route-level feature flag; giữ legacy page trong một release window, không dual-write nghiệp vụ.

## Kế hoạch thực thi chi tiết

### Chọn pilot bằng scoring

Chấm 1–5 cho CRUD completeness, table/form/overlay coverage, permission, dữ liệu UAT và blast radius. Ưu tiên `admin/catalogs` nếu inventory xác nhận phù hợp; ghi quyết định, không tự chọn theo tên file.

### PR3.1 — Flag và test characterization

- Thêm route/module flag phía server theo release-control convention hiện hữu.
- Trước migration, khóa tests cho query, action payload, validation, permissions và audit.
- Chuẩn bị fixture: empty, 1 row, nhiều row, duplicate, validation, denied, server error.

### PR3.2 — Vertical slice hoàn chỉnh

- Header/filters/table/row actions/create-edit form/confirm/states đều qua adapter.
- Table small; pagination false chỉ khi dataset hữu hạn, nếu không giữ server pagination.
- Form small, validation message sát field; modal không padding thừa; Enter/Escape không gây submit/delete ngoài ý muốn.
- Không để component nửa legacy nửa AntD trừ boundary được ghi rõ.

### PR3.3 — Pilot validation

- So sánh screenshot và số row nhìn thấy với baseline.
- Keyboard CRUD, focus return, screen reader labels, permission matrix.
- Đo bundle/render/interaction; kiểm tra hard refresh/FOUC/popup.
- UAT dark-room với ít nhất một clinical representative và một admin user.
- Thực hiện bật/tắt flag và rollback drill.

## Exit artifacts

`PILOT_SELECTION.md`, `PILOT_TEST_MATRIX.md`, `VISUAL_COMPARISON.md`, `PERFORMANCE_COMPARISON.md`, `UAT_SIGNOFF.md`, `ROLLBACK_DRILL.md`, `PHASE_3_ACCEPTANCE.md` trong evidence/phase-3. Convention thay đổi sau pilot phải cập nhật Clinical UI Standard trước khi scale.

## Prompt giao cho AI thực thi Phase 3

```text
Hãy thực thi DUY NHẤT Phase 3 Admin Pilot theo docs/antd-migration/PHASE_3_ADMIN_PILOT.md với vai trò Senior React/AntD Engineer. Chỉ bắt đầu khi Phase 2 GO và DataGrid ADR đã chốt.

Đọc Phase 0 inventory rồi chấm điểm/chọn đúng một route CRUD low-risk có table+filter+form+overlay+permission. Viết characterization tests trước. Thêm server-side feature flag theo framework release-control hiện có, sau đó migration trọn vertical slice sang shared adapters. Giữ nguyên API, Prisma, Server Actions, field names, validation, authz, audit và URL state. Tuân thủ tuyệt đối clinical dark/compact token, size small, spacing 2/4/8 và Table rules.

Kiểm thử fixture empty/populated/error/denied/validation, keyboard/focus, hard refresh, popup clipping, dark-room visual, density, bundle và performance. Thực hiện rollback drill. Lưu toàn bộ evidence được yêu cầu tại docs/antd-migration/evidence/phase-3/. Nếu không thể có human UAT, đánh dấu PENDING và Phase 3 phải NO-GO, không giả chữ ký.

Kết thúc bằng diff summary, test commands/exit codes, before/after metrics, flag/rollback instructions và GO/NO-GO. Không migration route thứ hai và không làm Phase 4.
```
