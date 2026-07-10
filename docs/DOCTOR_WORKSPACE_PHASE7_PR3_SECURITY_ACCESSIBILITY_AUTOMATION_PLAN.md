# Phase 7 PR3 — Security và Accessibility Regression Automation

Ngày lập: 2026-07-11  
Phase cha: [DOCTOR_WORKSPACE_PHASE7_PERFORMANCE_UAT_CONTROLLED_ROLLOUT_PLAN.md](./DOCTOR_WORKSPACE_PHASE7_PERFORMANCE_UAT_CONTROLLED_ROLLOUT_PLAN.md), sau [DOCTOR_WORKSPACE_PHASE7_PR2_LOAD_CHAOS_OPTIMIZATION_PLAN.md](./DOCTOR_WORKSPACE_PHASE7_PR2_LOAD_CHAOS_OPTIMIZATION_PLAN.md)  
Trạng thái: kế hoạch triển khai độc lập; inventory code thực tế là gate bắt buộc

## 1. Mục tiêu và kết quả

Tự động hóa scope matrix, API tampering và a11y/keyboard gates cho release candidate.

PR phải review/test/rollback độc lập. Kết quả gồm contract typed, implementation theo boundary server, test/evidence và compatibility path; không gộp redesign hoặc workflow ngoài phạm vi.

## 2. Điểm chạm dự kiến

- `dashboard tests`
- `security fixtures`
- `accessibility test config`

Đây là seed inventory, không phải danh sách đóng. Trước khi sửa phải tìm toàn bộ callers, route/action/service/model/component, schema/index, permission, scope, workflow, audit, fixture, test và flag liên quan; ghi baseline hành vi, query count, latency/render và call graph.

## 3. Contract cần chốt

- Input schema, allowlist, defaults, limits, timezone/version và unknown-field behavior.
- Output tối thiểu với stable technical IDs, typed generic errors và freshness/partial-failure khi cần.
- Thứ tự kiểm tra: authentication → global permission → resource scope → explicit deny → workflow.
- List/count/facet/detail/action dùng cùng policy; scope predicate nằm trong DB query trước page/aggregate.
- Stable sort/tie-breaker/cursor, batching và cache key cô lập theo user/scope.
- Race, cancellation, idempotency/revision và retry semantics; response cũ không overwrite state mới.
- Old/new compatibility, feature flag, migration/backfill additive và điều kiện xóa legacy.

Trọng tâm riêng: **Cross-scope zero leak, direct mutation, session/CSRF, audit scrub, focus/ARIA/contrast.**

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

Targeted matrix: Cross-scope zero leak, direct mutation, session/CSRF, audit scrub, focus/ARIA/contrast.

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
Làm việc tại C:\Antigravity\Minipacs-v.2. Triển khai Phase 7 PR3 — Security và Accessibility Regression Automation.

Đọc master plan, docs/DOCTOR_WORKSPACE_PHASE7_PERFORMANCE_UAT_CONTROLLED_ROLLOUT_PLAN.md, docs/DOCTOR_WORKSPACE_PHASE7_PR3_SECURITY_ACCESSIBILITY_AUTOMATION_PLAN.md và mọi PR tiền đề. Trước khi sửa, chạy git status/diff read-only; inventory callers/schema/authz scope/workflow/audit/tests/flags; bảo toàn worktree và ghi baseline kiểm chứng được.

Mục tiêu: Tự động hóa scope matrix, API tampering và a11y/keyboard gates cho release candidate.
Trọng tâm: Cross-scope zero leak, direct mutation, session/CSRF, audit scrub, focus/ARIA/contrast.

Server phải fail-closed và reauthorize resource; list/count/detail/action cùng scope policy; validate/limit input; batch chống N+1; xử lý race/stale/idempotency; scrub PHI; không đổi URL/status/palette/package ngoài scope. Thực hiện baseline → contract/tests → server core → boundary/UI → compatibility/rollback → regression/evidence. Chạy typecheck, tests, Prisma validate nếu cần, build và git diff --check. Không tuyên bố xong nếu còn leak, fail-open, N+1, stale overwrite hoặc rollback chưa chứng minh.
```
