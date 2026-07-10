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

## Open Questions cho User
> [!NOTE]
> Các migration script này tôi thiết kế dưới dạng function trong file `.ts`. User dự định sẽ trigger các hàm này bằng cách nào? (Ví dụ: tạo một API route ẩn `/api/admin/ops/migration`, chạy qua CLI bằng `ts-node`, hay gọi thủ công từ Command Center/Admin UI?)
> Tạm thời tôi sẽ làm sẵn dưới dạng Server Actions (hoặc script chạy node độc lập) để user dễ dàng gọi. User có đồng ý không?
