# MiniPACS Ant Design v5 Migration Program

## Mục tiêu

Chuyển giao diện Dashboard/RIS sang Ant Design v5 theo định hướng **ultra-compact clinical workstation** dành cho bác sĩ chẩn đoán hình ảnh trong phòng tối, đồng thời bảo toàn nghiệp vụ, phân quyền, hiệu năng, keyboard workflow và khả năng rollback.

## Phạm vi

- **Migration đầy đủ:** `dashboard/` (Next.js 14, React 18).
- **Giữ layout chuyên dụng:** Doctor Workspace, split panes, print/report; dùng AntD cho control bên trong.
- **OHIF/DICOM viewer:** không fork lõi để ép AntD; đồng bộ token/branding. Viewport luôn `#000000`, overlay `#13C2C2`.
- **Root Vite app:** xác minh còn deploy hay legacy trong Phase 0; decommission hoặc migration riêng.

## Nguyên tắc bất biến

1. Dark + compact cùng lúc: `algorithm: [theme.darkAlgorithm, theme.compactAlgorithm]`.
2. Không dùng trắng tinh; text chính `#E0E0E0`.
3. Control mặc định cao 24px, font 12px, radius 2px.
4. Khoảng cách 2/4/8px; không dùng 16–24px nếu không có lý do accessibility/clinical rõ ràng.
5. Table `size="small"`; pagination chỉ bật khi dữ liệu cần phân trang.
6. Button/Input/Select/Tag/Form-control phải `size="small"` (hoặc wrapper ép mặc định tương đương và có lint guard).
7. Toolbar dùng text button + icon; active state dùng nền primary mờ, không chiếm diện tích bằng label lặp lại.
8. Sidebar/panel thu gọn hoặc kéo giãn; grid khít như IDE; mỗi vùng có đúng một scroll owner.
9. Không đổi nghiệp vụ, API, Server Action, authorization và data contract trong cùng PR migration UI.
10. Adapter-first, rollout theo module; tuyệt đối không big-bang.

## Lộ trình

| Phase | Tài liệu | Kết quả chính | Ước lượng |
|---|---|---|---:|
| 0 | [Baseline & Governance](./PHASE_0_BASELINE_GOVERNANCE.md) | Inventory, baseline, ADR, phạm vi | 1–2 tuần |
| 1 | [Foundation](./PHASE_1_ANTD_FOUNDATION.md) | SSR provider, exact theme, guardrails | 1 tuần |
| 2 | [Adapters](./PHASE_2_UI_ADAPTERS.md) | Primitive/adapters dùng lại | 2–3 tuần |
| 3 | [Pilot](./PHASE_3_ADMIN_PILOT.md) | Một vertical slice được duyệt | 1–2 tuần |
| 4 | [Back-office](./PHASE_4_BACKOFFICE_MODULES.md) | Admin/settings/support/quality | 3–5 tuần |
| 5 | [Operational Lists](./PHASE_5_OPERATIONAL_LISTS.md) | Worklist/archive/consultation/analytics | 3–4 tuần |
| 6 | [Clinical Workspace](./PHASE_6_CLINICAL_WORKSPACE.md) | Doctor Workspace/report critical flow | 3–5 tuần |
| 7 | [Viewer & Legacy](./PHASE_7_VIEWER_LEGACY_ALIGNMENT.md) | OHIF alignment, Vite disposition | 0.5–2 tuần |
| 8 | [Validation & Cutover](./PHASE_8_VALIDATION_CUTOVER.md) | Cleanup, UAT, rollout, rollback | 1–2 tuần |

Tổng Dashboard sơ bộ: **17–29 người-tuần**; lịch thực tế khoảng **10–16 tuần với 2 frontend engineers và QA**. Estimate được hiệu chỉnh sau Phase 0.

## Thứ tự bắt buộc

`P0 → P1 → P2 → P3 → P4/P5 → P6 → P7 → P8`.

Không migration Doctor Workspace trước khi pilot Table/Form/overlay đạt gate. Mỗi phase phải có evidence: build/test, screenshot, accessibility, performance và danh sách ngoại lệ.

## Definition of Done toàn chương trình

- 100% route được đánh dấu `migrated`, `intentional exception` hoặc `decommissioned`.
- Exact clinical token contract được áp dụng và tự động kiểm tra.
- Không hydration warning/FOUC; không popup bị clip; không double scrollbar.
- Critical flows: worklist → viewer → report → autosave/sign/finalize/print hoạt động không regression.
- Authorization/action visibility không đổi.
- Bundle và interaction performance nằm trong ngân sách chốt ở Phase 0.
- Bác sĩ CĐHA duyệt mật độ, độ chói, keyboard workflow ở phòng tối.
- Progressive rollout và rollback drill hoàn tất trước 100% production.

## Tài liệu chuẩn bắt buộc

- [Clinical UI Standard](./CLINICAL_UI_STANDARD.md)
- [Nghiên cứu hiện trạng đầy đủ](../ANT_DESIGN_FULL_MIGRATION_RESEARCH_PLAN.md)

## Cách dùng prompt triển khai

Cuối **mỗi tài liệu Phase 0–8** có một prompt độc lập để giao cho AI coding agent khác. Prompt được thiết kế theo nguyên tắc:

- chỉ thực thi đúng một phase, không tự chạy sang phase tiếp theo;
- đọc evidence/gate phase trước và dừng nếu NO-GO;
- inspect code hiện tại, không giả định tên file/API;
- bảo toàn nghiệp vụ, authorization, PHI safety và data contract;
- phải chạy kiểm thử, ghi command/exit code/evidence và nêu rollback;
- không được bịa benchmark, screenshot, UAT hoặc chữ ký con người.

Nên tạo conversation/task mới cho từng phase, dán nguyên prompt ở cuối file tương ứng và cung cấp repository ở commit đã đạt gate phase trước. Với Phase 4–6 dài, AI phải làm tuần tự theo wave và dừng ngay tại wave fail gate; không yêu cầu một lần sửa toàn bộ repository.
