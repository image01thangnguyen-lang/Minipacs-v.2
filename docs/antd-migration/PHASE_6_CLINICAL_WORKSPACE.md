# Phase 6 — Doctor Workspace và Reporting Critical Flow

## Mục tiêu

Migration vùng làm việc chính của bác sĩ mà không phá layout 7 vùng, selection, autosave, report và viewer workflow.

## Nguyên tắc

- Giữ CSS Grid/split-pane engine chuyên dụng; AntD hóa control bên trong.
- Panel sát nhau, border 1px, spacing 2/4px; sidebar resize/collapse và lưu preference.
- DICOM viewport `#000000`; overlay `#13C2C2`.
- Mỗi region có một scroll owner; splitter không bị AntD Layout thay thế máy móc.

## Waves

1. Workspace switcher, search bar, facets, facility scope tree.
2. Work queue/StudyDataGrid selection và deep link.
3. Patient/study context và related studies.
4. Report controls/editor toolbar/autosave state.
5. Unsaved/conflict/confirm dialogs.
6. Consultation, share, key image, open viewer và clinical actions.

## Critical regression suite

- Chọn study → đồng bộ mọi panel → mở đúng Study UID.
- Back/forward/deep-link/race selection.
- Autosave revision, dirty guard, conflict recovery.
- Draft/sign/finalize/unfinalize/deliver theo quyền.
- Print/PDF không bị AntD CSS làm thay đổi giấy/page break.
- Keyboard-only từ search đến report và ca tiếp theo.
- Popup không clip khi panel hẹp hoặc fullscreen.

## UAT dark room

- Bác sĩ đo số study/field nhìn thấy và số thao tác cho common tasks.
- Không flash trắng; không vùng nền sáng; text chính `#E0E0E0`.
- Active toolbar rõ bằng cyan-soft, không gây lóa.
- Overlay không che anatomy; có thể ẩn/đổi vị trí.

## Gate

- Clinical workflow, authorization, telemetry/PHI safety pass.
- Performance và keyboard bằng hoặc tốt hơn baseline.
- Rollback feature flag đã thử bằng dữ liệu UAT.

## Kế hoạch thực thi chi tiết

### PR6.0 — Characterization và region flags

- Khóa behavior selection-state, workspace preference, related studies, report revision/autosave và allowed actions bằng tests hiện có + bổ sung.
- Chia flag theo region/control layer, nhưng không cho hai implementation cùng mutate state.
- Chụp 7-region baseline ở panel min/default/max và 4 viewport.

### Waves 6A–6F

1. **Navigation/filter regions:** switcher/search/facets/facility tree; IME, debounce, URL and scope.
2. **Study grid:** selection/deep-link/race, keyboard và density.
3. **Context/related studies:** patient matching, date range, scoped access, loading race.
4. **Reporting:** editor controls, templates, revisions, autosave state; không thay editor engine nếu không cần.
5. **Safety dialogs:** dirty guard, conflict resolution, navigation blocking, focus recovery.
6. **Clinical actions:** sign/finalize/share/consult/key image/viewer launch theo allowed-actions.

### Layout engineering

- Giữ `SplitPane`/CSS Grid, pointer/keyboard resize và preference persistence.
- Min/max/collapse constraints không che report hoặc viewport; một scroll owner/region.
- Popup portal convention hoạt động trong pane, fullscreen và transformed ancestor.
- Không dùng AntD `Layout/Card` nếu làm tăng whitespace; AntD chỉ là controls/tokens.

### Clinical safety và UAT scenarios

- Hai response đến ngược thứ tự không hiển thị patient/report sai.
- Autosave conflict không silently overwrite; revision/dirty indicator chính xác.
- Role không đủ quyền không thấy/không gọi được action; server vẫn enforce.
- Viewer mở đúng accession/patient/study UID; không log PHI.
- Print/PDF golden, Vietnamese text/IME và date/time UTC+7.
- Dark-room test 30–60 phút với bác sĩ: glare, focus, active tool, rows/fields visible, task time/error.

## Evidence và rollout

Evidence theo từng wave; clinical traceability matrix từ requirement → test → screenshot/UAT. Rollout theo bác sĩ/facility cohort, theo dõi autosave/action/viewer launch. Rollback drill bắt buộc trước GO.

## Prompt giao cho AI thực thi Phase 6

```text
Bạn là Principal Frontend Engineer + Clinical Safety UI/UX specialist cho PACS. Hãy thực thi DUY NHẤT Phase 6 theo docs/antd-migration/PHASE_6_CLINICAL_WORKSPACE.md. Đây là critical flow: ưu tiên correctness và safety hơn tốc độ migration.

Đọc toàn bộ Doctor Workspace code/tests/plans, selection-state, preferences, related studies, autosave/report revision, allowed-actions và release flags. Viết characterization tests và baseline trước. Migration tuần tự 6A–6F qua shared adapters; giữ CSS Grid/SplitPane engine và server/client boundaries. Không đổi API/DB/domain/editor engine nếu không có yêu cầu riêng. Không để legacy và new layer cùng ghi state.

Tuân thủ exact dark+compact tokens; panel 2/4px, control small; viewport #000000; overlay #13C2C2; một scroll owner; popup không clip. Test race/deep-link, scoped patient data, autosave conflict/dirty guard, sign/finalize permissions, đúng Study UID, PHI-safe telemetry, print/PDF, IME/timezone, keyboard và pane resize/persistence. Dùng feature flags theo region/cohort.

Sau mỗi wave chạy unit/integration/e2e/a11y/visual/performance/build và ghi evidence tại docs/antd-migration/evidence/phase-6/. Không bịa human dark-room UAT; thiếu signoff phải NO-GO. Kết thúc với clinical traceability, metrics, test commands/exit codes, rollback drill và GO/NO-GO. Không làm Phase 7.
```
