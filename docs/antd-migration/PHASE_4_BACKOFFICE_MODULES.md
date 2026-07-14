# Phase 4 — Admin, Settings, Support và Quality

## Mục tiêu

Mở rộng mẫu pilot sang các module back-office có pattern CRUD tương tự để tối đa reuse.

## Waves

1. Admin catalogs, users, facilities, PACS nodes, storage, templates.
2. Permission matrix, organization scope, operational controls.
3. Settings/profile/report templates.
4. Support incidents, training, change governance.
5. Quality: peer review, data quality, QC rejects, critical results, alerts/SLA policies.

## Checklist mỗi module

- List/detail/create/edit/delete/import/export (nếu có).
- Loading/empty/error/denied và validation states.
- Table small, compact pagination, sticky header khi cần.
- Form small; modal/drawer không padding thừa.
- Filter và URL state không mất khi back/forward.
- Permission/action visibility và audit event không đổi.
- Screenshot ở bốn viewport; keyboard and contrast test.

## Chiến lược PR

- Một PR foundation/module, không trộn schema/API changes.
- Hoàn tất vertical slice; tránh để một page nửa legacy nửa AntD lâu dài.
- Feature flag theo route/module; evidence đi kèm PR.

## Gate

- Tất cả route wave có disposition.
- Shared adapters không bị fork/copy per-page.
- Không spacing >8px nếu không có allowlist.
- Regression và UAT module pass trước wave tiếp theo.

## Kế hoạch thực thi chi tiết

### Chuẩn wave và PR

- Mỗi wave có route manifest lấy từ inventory, owner, dependency, fixture và flag.
- Mỗi PR chỉ 1 vertical slice hoặc nhóm route dùng chung một domain/service; tối đa reviewable, rollback độc lập.
- Trước mỗi route: characterization test; sau migration: contract + visual + a11y. Không sửa backend trừ defect riêng có PR khác.

### Wave 4A — Catalog/master data

Users, catalogs, facilities, PACS nodes, machines/mapping, storage/templates theo inventory. Tập trung form validation, Select/DatePicker mapping, uniqueness error, import/export và audit.

### Wave 4B — Authorization/governance

Permission/scope matrix và organization tree. Không biến matrix lớn thành Table thiếu virtualization; bảo toàn inherited/explicit/deny semantics, dirty state, bulk action và privileged confirmation. Bắt buộc security regression.

### Wave 4C — Settings/support

Settings/profile/report template/support. Kiểm tra secret masking, unsaved changes, rich text/print exception và file upload.

### Wave 4D — Quality/clinical governance

Peer review, data quality, QC rejects, critical results, alerts/SLA/control thresholds. Status/priority phải dùng registry + text/icon; STAT/error không chỉ dựa màu. Test escalation, threshold/date and role visibility.

## Kiểm soát chất lượng mỗi wave

- Route manifest đạt 100%; không bỏ loading/error/denied.
- Native controls còn lại có allowlist.
- Matrix visual 4 viewport; keyboard; no double scroll/popup clipping.
- Build/tests/authz/security; bundle route delta.
- Wave acceptance và rollback drill trước wave tiếp theo.

## Prompt giao cho AI thực thi Phase 4

```text
Bạn là Lead Frontend Engineer. Hãy thực thi Phase 4 theo docs/antd-migration/PHASE_4_BACKOFFICE_MODULES.md, chỉ khi pilot Phase 3 đã GO. Không làm Phase 5/6.

Đầu tiên tạo manifest chính xác từ Phase 0 inventory, chia 4A–4D và xử lý tuần tự; không đoán route. Với MỖI vertical slice: thêm characterization tests, feature flag, migration bằng shared adapters, kiểm thử và evidence rồi mới chuyển route tiếp theo. Bảo toàn Server Actions/API/Prisma/authz/audit/URL/file/print semantics. Permission matrix phải giữ inherited/deny/bulk/dirty behavior và performance; quality status phải có text/icon, không chỉ màu.

Áp dụng tuyệt đối exact dark+compact tokens, controls/Table small, spacing 2/4/8, header #1F1F1F, không #FFFFFF. Không copy adapter per-page, không deep override .ant-* không ADR, không big-bang. Chạy route tests, authz/security, a11y, visual và build sau từng wave; ghi command/exit code, route disposition, exceptions, metrics và rollback vào docs/antd-migration/evidence/phase-4/.

Nếu một wave fail gate, dừng ở wave đó và báo NO-GO; không tiếp tục để “hoàn tất số lượng”. Cuối phase báo migrated/exception/pending routes, file diff, test evidence và rollout/rollback status.
```
