# Phase 5 — Operational Lists, Worklist và Analytics

## Mục tiêu

Migration các màn hình dữ liệu dày đặc mà vẫn bảo toàn tốc độ thao tác, URL state và server-side semantics.

## Thứ tự

1. Command Center và statistics/drilldown.
2. Non-DICOM.
3. Consultations.
4. Archive.
5. Worklist list/filter/actions (critical nhất trong phase).

## Data-grid contract

- `size="small"`; header `#1F1F1F`; padding 2/4px.
- `pagination={false}` chỉ khi dataset hữu hạn/đã cap; dữ liệu lớn dùng server pagination/cursor hoặc virtualization.
- URL/server là source of truth cho sort/filter/page.
- Row key ổn định; không client-sort một phần dataset.
- Column resize/pin/visibility/density preference được bảo toàn.
- Selected/hover/focus khác biệt rõ trong dark room nhưng không quá sáng.
- Keyboard Enter/Space/arrows và double-click có regression test.

## Filter/toolbar

- Một hàng compact ưu tiên; overflow vào More/Drawer, không tăng chiều cao vô hạn.
- Control 24px; gap 4px; label dùng Tooltip/aria-label khi icon-only.
- Status dùng color + text/icon.

## Performance gate

- Số row nhìn thấy ở 1366×768 không thấp hơn baseline.
- Interaction filter/select/scroll nằm trong budget Phase 0.
- Không memory spike khi dataset lớn.
- Không double scrollbar; grid sở hữu horizontal scroll, page không sở hữu.

## Rollback

Feature flag theo list/grid implementation; query contract và legacy adapter vẫn khả dụng đến hết Phase 8.

## Kế hoạch thực thi chi tiết

### PR5.1 — Grid conformance harness

- Tạo fixture và automated tests dùng chung cho sort/filter/page/selection/resize/pin/visibility/sticky/keyboard.
- Ghi performance ở 100/1.000/10.000 row hoặc dataset cap thực tế; server semantics phải được mock đúng.
- Chốt scroll ownership, row height, overscan và column preference versioning.

### Waves 5A–5E

- **5A Command Center/statistics:** chart/table drilldown, date range, timezone, export.
- **5B Non-DICOM:** attachment/type/status/actions và permission.
- **5C Consultations:** unread/urgent state, assignment, viewer/key-image launch.
- **5D Archive:** restore/delete/retention confirmation và scoped access.
- **5E Worklist:** URL filters/facets/cursor, selection/deep link, allowed actions, opening correct Study UID; rollout cuối cùng.

### Worklist safety checklist

- Query builder/cursor/facet contracts không đổi.
- Back/forward/reload giữ filter và selection hợp lệ.
- Stale/race response không thay selected study sai.
- Column preferences migrate/version an toàn.
- Double click/Enter không mở nhầm study; action disabled theo scope.
- Bulk actions có count/confirm và không lộ dữ liệu ngoài scope.

### Performance/density budget

Lấy số Phase 0 làm chuẩn. Không chấp nhận row visible giảm, input latency/scroll regression vượt budget, client sort partial dataset, DOM vô hạn hoặc bundle tăng không giải thích. Dữ liệu test không chứa PHI thật.

## Evidence

Mỗi wave có contract matrix, query/URL tests, visual/density comparison, performance trace, authorization result, flag/rollback. Worklist cần UAT ký riêng và soak trước Phase 6.

## Prompt giao cho AI thực thi Phase 5

```text
Hãy thực thi DUY NHẤT Phase 5 Operational Lists theo docs/antd-migration/PHASE_5_OPERATIONAL_LISTS.md. Bạn là Principal React Engineer chuyên high-density data grid/PACS. Chỉ bắt đầu khi DataGrid ADR và Phase 4/shared adapters đã ổn định.

Tạo grid conformance harness trước, rồi migration tuần tự 5A→5E; Worklist luôn cuối. Giữ URL/server làm source of truth, cursor/pagination/facets/query/authz/action/column preferences/selection semantics. Table phải small; pagination=false chỉ cho dữ liệu hữu hạn; dataset lớn dùng server pagination/cursor hoặc virtualization. Không client-sort partial data, không render DOM vô hạn. Giữ keyboard/double-click đúng Study UID và race safety.

Áp dụng exact clinical theme; tối đa mật độ, 2/4/8px, không #FFFFFF. Dùng fixture phi định danh. Sau mỗi wave chạy contract/integration/a11y/visual/performance/build và rollback flag; dừng nếu density, latency, memory, authz hoặc correctness fail. Ghi evidence/metrics/commands/exit codes vào docs/antd-migration/evidence/phase-5/. Human clinical UAT Worklist thiếu thì NO-GO.

Kết thúc bằng route disposition, before/after rows visible + performance, test results, known exceptions và GO/NO-GO. Không đụng Doctor Workspace Phase 6.
```
