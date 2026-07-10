# PR 6 — Legacy Migration & Shadow Mode

Tiếp tục triển khai **Phase 2** với **PR 6: Legacy migration và shadow mode**. PR này chịu trách nhiệm tạo lớp đệm an toàn để chuyển đổi từ quyền máy cũ (`DoctorMachinePermission`) sang quyền phạm vi mới (`AccessScopeGrant`) mà không làm mất dữ liệu hay khóa quyền đột ngột của người dùng.

## Mục tiêu

1. Chuyển đổi dữ liệu (Migration) một chiều an toàn, chạy được nhiều lần (idempotent).
2. Tạo **Root compatibility grants** để đảm bảo quyền hiện hành (theo `global_permissions`) không bị chặn khi bật `ENFORCE`.
3. So sánh Shadow (Drift report) giữa luật cũ và luật mới.
4. **Dual-write** ở Matrix UI để những cập nhật mới từ Admin sẽ ghi đồng thời vào cả 2 bảng.

---

## Chi tiết các thay đổi

### 1. Script Migration & Root Grants
#### [NEW] [dashboard/lib/authz/scope/migration/legacy-migration.ts](file:///c:/App/Antigravity/Minipacs-v.2/dashboard/lib/authz/scope/migration/legacy-migration.ts)

Sẽ tạo 2 functions chính (có thể gọi từ Next.js API hoặc command line):

- **`migrateLegacyPermissionsToGrants()`**:
  - Quét toàn bộ `DoctorMachinePermission`.
  - Với mỗi record: Tạo một `AccessScopeGrant` tương ứng cho `userId`, `dicomNodeId`, `capability = actionKey`, `effect = ALLOW/DENY`, `includeDescendants = false`.
  - Cơ chế **idempotent**: Kiểm tra tồn tại trước khi tạo, tránh duplicate nếu chạy lại script.

- **`createRootCompatibilityGrants()`**:
  - Quét toàn bộ `User` và `AppRoleProfile` đang active.
  - Tính toán `global_permissions` của họ thông qua `getPermissionsForRole()`.
  - So khớp với `CAPABILITY_TO_GLOBAL_PERMISSION`. Nếu user có `studies.read`, cấp cho họ global grant `READ_STUDY` (không giới hạn `facilityUnitId` hay `dicomNodeId`).
  - Đảm bảo khi hệ thống chuyển sang `ENFORCE`, họ vẫn thấy toàn bộ dữ liệu như cũ (giữ nguyên tính tương thích) cho đến khi Admin thu hẹp phạm vi.

### 2. Shadow Compare & Drift Report
#### [NEW] [dashboard/lib/authz/scope/migration/shadow-compare.ts](file:///c:/App/Antigravity/Minipacs-v.2/dashboard/lib/authz/scope/migration/shadow-compare.ts)

Sẽ xây dựng function `generateDriftReport()`:
- Đếm số lượng `DoctorMachinePermission` hiện có.
- Đối chiếu với số lượng `AccessScopeGrant` (đã cấp cho máy).
- Tìm ra những `dicomNodeId` hoặc `userId` có chênh lệch quyền giữa bảng cũ và bảng mới.
- Lưu ý: Việc bắt divergence trong runtime đã được làm ở `scope-resolver.ts` (khi mode=`SHADOW`). Script này bổ sung thêm khâu kiểm tra toàn bộ dữ liệu tĩnh (Data at rest).

### 3. Dual-write tại Matrix UI
#### [MODIFY] [dashboard/app/admin/permissions/matrix/actions.ts](file:///c:/App/Antigravity/Minipacs-v.2/dashboard/app/admin/permissions/matrix/actions.ts)

Sửa đổi `saveMatrixAction()`:
- Khi Admin chọn **`ALLOW` / `DENY`**: Ngoài việc `upsert` vào `DoctorMachinePermission`, sẽ thực hiện thêm `upsert` vào `AccessScopeGrant` tương ứng.
- Khi Admin chọn **`DEFAULT`**: Xóa ở cả 2 bảng.
- Việc này được gói gọn trong Prisma `$transaction` hiện hữu để đảm bảo tính nhất quán (All-or-nothing).

---

## Verification Plan

### Automated Tests
Sẽ thêm file `dashboard/lib/authz/scope/migration/legacy-migration.test.ts` để kiểm tra:
1. Tính Idempotent: Chạy `migrateLegacyPermissionsToGrants()` 2 lần liên tiếp không làm tăng số lượng record.
2. Root Grants: `createRootCompatibilityGrants()` cấp chính xác các capability mà user có quyền global.
3. Dual Write: Logic lưu trong `saveMatrixAction` thành công ghi vào cả 2 bảng.

### Chế độ Shadow Mode
Sau PR này, hệ thống sẵn sàng vận hành ở `AUTHORIZATION_MODE="SHADOW"` trên UAT/Staging. Mọi quyền truy cập vẫn dựa vào logic cũ (global + legacy) nhưng mọi khác biệt với hệ thống `AccessScopeGrant` mới sẽ được in ra server logs, giúp Admin nắm bắt tình hình trước khi bật `ENFORCE`.

## Next Agent Handoff Plan

### Trạng thái hiện tại

- Scope resolver core đã có test cho các trường hợp nguy hiểm: machine/facility mismatch, inactive machine, ambiguous AE title, unclassified resource, global grant, DENY holes và org-tree cycle.
- Migration bổ sung `20260710000000_phase2_global_grants` đã thêm hỗ trợ root/global grants và unique indexes cho user/role global grants.
- `AccessScopeGrantRow` hiện yêu cầu explicit `facilityUnit` và `dicomNode` relation fields để tránh query thiếu include rồi fail-open/fail-closed âm thầm.
- Verification gần nhất: `npm.cmd run test`, `npx.cmd prisma validate` với `DATABASE_URL` giả, và `git diff --check origin/main..HEAD` đều sạch.

### Việc cần làm tiếp

1. Tạo `dashboard/lib/authz/scope/migration/legacy-migration.ts`.
   - Implement `migrateLegacyPermissionsToGrants()` để đọc `DoctorMachinePermission` và tạo grant theo máy: `userId`, `dicomNodeId`, `capability = actionKey`, `effect = allow ? "ALLOW" : "DENY"`, `includeDescendants = false`.
   - Implement `createRootCompatibilityGrants()` để tạo root/global grants cho active users và active role profiles dựa trên `CAPABILITY_TO_GLOBAL_PERMISSION` + `getPermissionsForRole()`.
   - Idempotency phải dựa trên lookup trước khi create, vì partial unique indexes không được Prisma biểu diễn thành composite upsert.

2. Tạo `dashboard/lib/authz/scope/migration/shadow-compare.ts`.
   - Implement `generateDriftReport()` so sánh quyền legacy machine với `AccessScopeGrant` machine grants.
   - Báo các nhóm tối thiểu: missing grants, extra grants, effect mismatch, inactive/missing referenced node, duplicate/conflicting data nếu gặp.
   - Không mutate dữ liệu trong drift report.

3. Dual-write Matrix UI tại `dashboard/app/admin/permissions/matrix/actions.ts`.
   - Khi save `ALLOW`/`DENY`, ghi cả `doctorMachinePermission` và `accessScopeGrant` trong cùng transaction.
   - Khi save `DEFAULT`, xóa cả legacy row và corresponding machine-scoped grant.
   - Với machine grants luôn set `includeDescendants = false`.

4. Thêm tests cho migration và dual-write.
   - File gợi ý: `dashboard/lib/authz/scope/migration/legacy-migration.test.ts`.
   - Test idempotency bằng cách chạy migration 2 lần.
   - Test root grants tạo đúng capability và không tạo duplicate.
   - Test dual-write: ALLOW, DENY, DEFAULT đều đồng bộ 2 bảng.

### Guardrails

- Không sửa lại migration lịch sử `20260707000000_phase2_scope_authorization`; nếu cần thay đổi DB tiếp, tạo migration mới.
- Không để `package-lock.json` đổi nếu `package.json` không đổi.
- Các query trả về `AccessScopeGrantRow` phải select/include đủ `facilityUnit: { isActive }` và `dicomNode: { isActive, facilityId }`.
- Không bật `AUTHORIZATION_MODE="ENFORCE"` trong runtime mặc định; PR6 chỉ chuẩn bị migration, shadow compare và dual-write.

### Verification bắt buộc

```powershell
cd dashboard
npm.cmd run test
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/minipacs'; npx.cmd prisma validate
cd ..
git -c safe.directory=C:/Antigravity/Minipacs-v.2 diff --check origin/main..HEAD
```

## Open Questions cho User
> [!NOTE]
> Các migration script này tôi thiết kế dưới dạng function trong file `.ts`. User dự định sẽ trigger các hàm này bằng cách nào? (Ví dụ: tạo một API route ẩn `/api/admin/ops/migration`, chạy qua CLI bằng `ts-node`, hay gọi thủ công từ Command Center/Admin UI?)
> Tạm thời tôi sẽ làm sẵn dưới dạng Server Actions (hoặc script chạy node độc lập) để user dễ dàng gọi. User có đồng ý không?

## Kết quả triển khai PR6

- Đã thêm migration service idempotent cho quyền máy cũ và root compatibility grants.
- Đã thêm drift report chỉ đọc, giới hạn so sánh `extraGrants` trong tập capability mà legacy có thể biểu diễn.
- Matrix permission dùng compatibility service để dual-write `ALLOW`/`DENY` và xóa cả hai representation khi `DEFAULT`, trong cùng transaction.
- Đã thêm test migration idempotency, root grants cho role/user và dual-write ba trạng thái.
- Chế độ mặc định vẫn là `OFF`; không tự động bật `ENFORCE`.

## Prompt Cho AI Tiếp Theo

```text
Bạn đang bắt đầu PR7 - Read-path Enforcement trong repo Minipacs-v.2.

Đọc kỹ:
- docs/DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR6_LEGACY_MIGRATION_SHADOW_PLAN.md

Sau đó lập kế hoạch PR7 có phạm vi review/rollback độc lập trước khi triển khai.

Trạng thái đã có:
- Scope resolver core, grant evaluation, resource context và filter builder đã được review/fix.
- Migration mới dashboard/prisma/migrations/20260710000000_phase2_global_grants/migration.sql đã cho phép root/global grants và thêm unique indexes cho user/role global grants.
- AccessScopeGrantRow yêu cầu explicit relation fields facilityUnit và dicomNode.
- Không còn diff package-lock.json ngoài ý muốn.
- Verification gần nhất đã pass: npm.cmd run test, prisma validate với DATABASE_URL giả, và git diff --check.
- PR6 đã có migration service, root compatibility grants, shadow drift report và matrix dual-write service.
- Test dual-write ALLOW/DENY/DEFAULT đã nằm trong npm test.

Việc cần làm:
1. Inventory toàn bộ read path cho study/order list, archive, command center/statistics, detail, related studies và report/viewer context.
2. Phân loại từng path theo resource context và capability; tái sử dụng scope resolver/filter builder, không viết logic quyền song song.
3. Áp dụng filter trước pagination/count/facet để không rò dữ liệu hoặc metadata.
4. Giữ semantics OFF/SHADOW không làm thay đổi baseline; chỉ ENFORCE mới thu hẹp kết quả.
5. Thêm tests cho list/detail/count/facet và unclassified/ambiguous/inactive resource.

Guardrails:
- Không sửa migration lịch sử 20260707000000_phase2_scope_authorization; nếu cần DB change, tạo migration mới.
- Không để package-lock.json đổi nếu package.json không đổi.
- Query trả AccessScopeGrantRow phải include/select đủ facilityUnit: { isActive } và dicomNode: { isActive, facilityId }.
- Không bật AUTHORIZATION_MODE=ENFORCE mặc định.
- Giữ thay đổi scope hẹp, không refactor lan rộng.
- Không triển khai mutation enforcement hoặc admin grant UI trong PR7.

Verification bắt buộc trước khi kết thúc:
cd dashboard
npm.cmd run test
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/minipacs'; npx.cmd prisma validate
cd ..
git -c safe.directory=C:/Antigravity/Minipacs-v.2 diff --check origin/main..HEAD

Sau khi xong, tóm tắt file đã đổi, hành vi đã thêm, test đã chạy, và các rủi ro còn lại nếu có.
```
