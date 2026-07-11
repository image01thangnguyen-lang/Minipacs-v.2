# Phase 6 PR1 — Shared UI Contract và Inventory

Ngày lập: 2026-07-11  
Phase cha: [DOCTOR_WORKSPACE_PHASE6_SHARED_LIST_UI_ADOPTION_PLAN.md](./DOCTOR_WORKSPACE_PHASE6_SHARED_LIST_UI_ADOPTION_PLAN.md)  
Trạng thái: kế hoạch triển khai độc lập; inventory code thực tế là gate bắt buộc

## 1. Mục tiêu và kết quả

Kiểm kê component/trạng thái/route, chốt API typed và parity matrix trước khi trích xuất.

PR phải review/test/rollback độc lập. Kết quả gồm contract typed, implementation theo boundary server, test/evidence và compatibility path; không gộp redesign hoặc workflow ngoài phạm vi.

## 2. Điểm chạm dự kiến

- `dashboard/app/components/*`
- `dashboard/app/globals.css`
- `dashboard/tailwind.config.js`

Đây là seed inventory, không phải danh sách đóng. Trước khi sửa phải tìm toàn bộ callers, route/action/service/model/component, schema/index, permission, scope, workflow, audit, fixture, test và flag liên quan; ghi baseline hành vi, query count, latency/render và call graph.

## 3. Contract cần chốt

- Input schema, allowlist, defaults, limits, timezone/version và unknown-field behavior.
- Output tối thiểu với stable technical IDs, typed generic errors và freshness/partial-failure khi cần.
- Thứ tự kiểm tra: authentication → global permission → resource scope → explicit deny → workflow.
- List/count/facet/detail/action dùng cùng policy; scope predicate nằm trong DB query trước page/aggregate.
- Stable sort/tie-breaker/cursor, batching và cache key cô lập theo user/scope.
- Race, cancellation, idempotency/revision và retry semantics; response cũ không overwrite state mới.
- Old/new compatibility, feature flag, migration/backfill additive và điều kiện xóa legacy.

Trọng tâm riêng: **Consumer inventory, semantic tokens, bundle boundaries, exception registry và visual baseline.**

### Inventory baseline đã xác minh (2026-07-11)

| Nhóm | Baseline code | Consumer/route chính | Quyết định PR1 |
|---|---|---|---|
| Grid | `ui/data-grid/DataGrid.tsx`, `workspace/StudyDataGrid.tsx` | doctor workspace | Giữ nguyên runtime; chốt contract có `getRowId`, stable column ID, controlled sort/selection |
| Native tables | 49 vị trí JSX được tìm thấy | archive, worklist, consultations, non-DICOM, statistics, command-center, admin | Không migrate trong PR1; xử lý theo wave PR4–PR7 |
| Status | `workspace/badges.tsx` và nhiều `StatusBadge` cục bộ | study/admin/catalog | Registry tách theo domain; không hợp nhất taxonomy nghiệp vụ |
| Filter | `WorkspaceSearchBar`, `WorkQueueFacets`, filter cục bộ từng route | workspace và list routes | URL/route sở hữu state; shared contract là controlled |
| Layout | `ui/SplitPane.tsx` | doctor workspace | Giữ component client-only, không ép list route dùng split pane |
| Operational states | loading/empty/error viết cục bộ | toàn bộ waves | Chốt semantic khác nhau; adoption thuộc PR2+ |

Bundle boundary: `shared-contracts.ts` chỉ dùng `import type` từ React và không import service/server action/editor. Component dùng hook phải có client boundary rõ ràng. PR1 không đổi query, authorization, workflow, URL hoặc database.

Exception registry ban đầu:

| Phạm vi | Ngoại lệ | Lý do | Owner / thời điểm review |
|---|---|---|---|
| Statistics/Command Center | Chart không dùng DataGrid | Dữ liệu trực quan không có table semantics | Analytics owner / P6-PR6 |
| Related studies compact table | Chưa migrate | Embedded clinical context, density và keyboard behavior riêng | Workspace owner / P6-PR3 |
| Permission matrix | Chưa migrate | Tree/matrix semantics và deny-wins controls | Authz owner / P6-PR7 |
| Existing route-local status badges | Compatibility path | Tránh đổi label/màu/lifecycle trước parity | Route owner / wave tương ứng |

Visual baseline cần chụp tại 1280px và 2560px cho `/`, `/archive`, `/worklist`, `/consultations`, `/non-dicom`, `/statistics`, `/command-center` và các admin table đại diện. PR1 ghi danh sách baseline; ảnh và automated visual diff là gate P6-PR8, không được tuyên bố đã pass nếu chưa có artifact CI.

## 4. Guardrails

- Server quyết định authorization/workflow; client chỉ gửi intent và không được tin role, scope, allowedActions, status hay facility/patient ID.
- Fail closed khi resource/context thiếu; không tải dữ liệu vượt quyền xuống client rồi ẩn.
- Mutation reload resource và revalidate ngay trước transaction; chống double-submit/stale state.
- Không N+1; batch relation/capability, giới hạn payload và đo query plan/budget.
- Không log PHI, report text, accession hay raw HIS/Prisma payload; audit/metric chỉ dùng metadata scrubbed.
- Không đổi URL, lifecycle/status, permission semantics, palette `--vin-*`, package/lockfile hoặc hạ tầng ngoài scope.
- Không hard-delete legacy trước parity, soak và rollback drill; bảo toàn mọi thay đổi chưa commit.

## 5. Trình tự triển khai

1. **Inventory/baseline:** xác minh code, dependency, threat cases và budget bằng read-only inspection.
2. **Contract:** type/schema, policy matrix, error/concurrency semantics và targeted failing tests.
3. **Server core:** pure evaluator/query/service, scope/workflow enforcement, batching, audit và unit tests.
4. **Boundary/UI:** validation tại action/API; controlled UI/adapters với loading/empty/error/denied states và accessibility.
5. **Compatibility:** flag, old/new parity, additive migration và rollback proof.
6. **Evidence:** security, concurrency, performance, visual/a11y, build và runbook/handoff.

Không chuyển bước nếu còn leak, fail-open, N+1, stale overwrite, contract mơ hồ hoặc rollback chưa chứng minh.

## 6. Test matrix

1. Happy path theo từng role/scope/workflow hợp lệ.
2. Anonymous, thiếu permission/grant và explicit deny đều bị chặn server-side.
3. User cơ sở A không thấy row/count/facet/detail/action/metadata của B.
4. Forged/unknown/oversized input và invalid date/cursor/ID bị reject/normalize đúng contract.
5. A→B→C out-of-order, double-submit, stale revision/status và session expiry không gây overwrite/mutation lặp.
6. Empty, timeout, DB/Orthanc/HIS outage và retry không fallback unscoped hoặc báo success giả.
7. Query count không tăng tuyến tính theo row/node; P95/render/bundle nằm trong budget before/after.
8. Keyboard/focus/ARIA/non-color status và breakpoint liên quan pass.
9. Audit/log/telemetry scrub pass; không có PHI/raw payload.
10. Tắt flag phục hồi path cũ mà không mất draft/data/preference/audit.

Targeted matrix: Consumer inventory, semantic tokens, bundle boundaries, exception registry và visual baseline.

## 7. Acceptance criteria

- [ ] Inventory, call graph, policy matrix và baseline được đính kèm evidence.
- [ ] Typed contract + server validation + limits có positive/negative tests.
- [ ] Global/scope/workflow dùng helper chung, deny-wins và không duplicate policy.
- [ ] Row/count/facet/detail/action parity không rò cross-scope.
- [ ] Race/stale/idempotency/failure recovery được test.
- [ ] Không N+1 và budget performance có số đo before/after.
- [ ] Accessibility/responsive và operational states được nghiệm thu.
- [ ] Audit/log/metric scrub, feature flag và rollback drill pass.
- [ ] Typecheck, targeted/full tests, Prisma validation nếu liên quan, build và diff-check pass.

## 8. Verification gate

```powershell
Set-Location C:\Antigravity\Minipacs-v.2\dashboard
npx tsc --noEmit
npm test
npx prisma validate
npm run build
Set-Location ..
git diff --check
```

Chạy thêm query plan/load/visual/a11y/security checks chuyên biệt. PowerShell cũ không nối bằng `&&`; chạy từng lệnh hoặc qua `cmd /c`.

## 9. Prompt bàn giao AI

```text
Làm việc tại C:\Antigravity\Minipacs-v.2. Triển khai Phase 6 PR1 — Shared UI Contract và Inventory.

Đọc master plan, docs/DOCTOR_WORKSPACE_PHASE6_SHARED_LIST_UI_ADOPTION_PLAN.md, docs/DOCTOR_WORKSPACE_PHASE6_PR1_SHARED_UI_CONTRACT_INVENTORY_PLAN.md và mọi PR tiền đề. Trước khi sửa, chạy git status/diff read-only; inventory callers/schema/authz scope/workflow/audit/tests/flags; bảo toàn worktree và ghi baseline kiểm chứng được.

Mục tiêu: Kiểm kê component/trạng thái/route, chốt API typed và parity matrix trước khi trích xuất.
Trọng tâm: Consumer inventory, semantic tokens, bundle boundaries, exception registry và visual baseline.

Server phải fail-closed và reauthorize resource; list/count/detail/action cùng scope policy; validate/limit input; batch chống N+1; xử lý race/stale/idempotency; scrub PHI; không đổi URL/status/palette/package ngoài scope. Thực hiện baseline → contract/tests → server core → boundary/UI → compatibility/rollback → regression/evidence. Chạy typecheck, tests, Prisma validate nếu cần, build và git diff --check. Không tuyên bố xong nếu còn leak, fail-open, N+1, stale overwrite hoặc rollback chưa chứng minh.
```
