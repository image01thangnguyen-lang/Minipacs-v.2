# Phase 1 — Kế hoạch chi tiết App Shell và Menu cây

Ngày lập: 2026-07-07  
Thuộc kế hoạch tổng thể: [DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md](./DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md)  
Trạng thái: Sẵn sàng để triển khai sau khi người phụ trách sản phẩm xác nhận cấu trúc menu  
Phạm vi: chỉ Phase 1; không triển khai quyền phạm vi dữ liệu của Phase 2 hoặc worklist 7 vùng của Phase 3–5

## 1. Mục tiêu Phase 1

Tạo một khung điều hướng dùng chung cho MiniPACS, thay menu phẳng hiện tại bằng menu cây tiếng Việt và bảo đảm người dùng chỉ nhìn thấy những màn hình họ có global permission truy cập.

Phase này phải giải quyết bốn vấn đề hiện tại:

1. `AppSidebar.tsx` chứa trực tiếp toàn bộ menu, nhãn, icon, permission và logic active trong một file client component.
2. Mỗi trang phải truyền một chuỗi `active` thủ công; deep link và route con dễ đánh dấu sai.
3. Một số route có thật nhưng chưa xuất hiện trong menu, ví dụ Hội chẩn, Ma trận quyền theo máy và Quản lý dung lượng/thư mục lưu trữ.
4. Nhiều trang được menu dẫn tới nhưng không có `AppSidebar`, khiến người dùng mất điều hướng sau khi mở trang.

Kết quả cuối Phase 1:

- Có một navigation registry thuần dữ liệu làm nguồn sự thật cho cấu trúc menu.
- Có hàm thuần để lọc cây theo permission và xác định mục active từ pathname.
- Có App Shell dùng chung với menu cây responsive.
- Các route được menu dẫn tới đều giữ được điều hướng chung, kể cả trang con.
- Nhãn hiển thị cho người dùng được chuẩn hóa sang tiếng Việt.
- Màu, route, nghiệp vụ, API và permission semantics hiện hữu không bị thay đổi.

## 2. Ngoài phạm vi

Phase 1 không được mở rộng sang các việc sau:

- Không tạo `AccessScopeGrant`, không lọc ca theo bệnh viện/chuyên khoa và không sửa ma trận quyền theo máy.
- Không thay `getStudies()` hoặc chuyển bộ lọc worklist sang server.
- Không dựng bố cục 7 vùng của màn hình bác sĩ.
- Không sửa workflow báo cáo, trạng thái ca, HIS, hội chẩn hoặc viewer.
- Không đổi bảng màu `--vin-*`, không làm lại nội dung các trang.
- Không đổi URL hiện tại và không chuyển hàng loạt thư mục sang route group.
- Không thêm menu cho route chưa tồn tại chỉ vì permission key đã tồn tại.
- Không dùng việc ẩn menu như một cơ chế bảo mật thay cho middleware/server authorization.

## 3. Baseline kỹ thuật đã xác minh

### 3.1. Stack

- Next.js 14 App Router.
- React 18, TypeScript, Tailwind CSS.
- NextAuth 5 beta; client hiện đọc session bằng `getSession()`.
- Permission nguồn tại `dashboard/lib/permissions.ts`.
- Middleware đã chặn route bằng `getRoutePermission()` và `hasPermission()`.
- Dự án chưa có Jest/Vitest; test hiện dùng các script TypeScript chạy bằng `ts-node`.

### 3.2. Menu hiện tại

`dashboard/app/components/AppSidebar.tsx` hiện có:

- Mảng `mainMenuItems` phẳng.
- Type `ActiveMenu` viết tay.
- Lọc item bằng `hasPermission()` sau khi `getSession()` hoàn thành.
- Biến module `globalSidebarCollapsed`, không bền qua reload/tab mới và không theo user.
- Sidebar rộng 56 px khi đóng, 192 px khi mở.
- Nhóm `Sắp triển khai` chỉ có `Dung lượng`, dù route `/admin/storage` đã tồn tại.

### 3.3. Route đang nhúng `AppSidebar`

Các màn hình chính đang tự render sidebar gồm:

- `/`, `/worklist`, `/non-dicom`, `/archive`, `/statistics`, `/consultations`.
- Một số trang admin/settings: users, templates, storage, PACS, catalogs, HIS, retention, backup, destructive và clinic profile.

Các màn hình khác trong menu như Command Center, Ops, Release, Training, Incidents, Change Requests và Runbooks chưa dùng chung sidebar một cách nhất quán.

### 3.4. Ràng buộc permission cần giữ

- `hasPermission(role, permission, explicitPermissions)` là quy tắc hiện tại.
- Nếu `explicitPermissions` có dữ liệu, danh sách đó là nguồn quyền của role profile.
- Nếu không có explicit permission, hệ thống fallback về permission mặc định của system role.
- Middleware/server vẫn là lớp bảo vệ route. Navigation chỉ phản ánh cùng kết quả để UX không dẫn người dùng tới nơi bị từ chối.

## 4. Kiến trúc đề xuất

```text
NavigationRegistry (thuần dữ liệu, không React/server import)
        │
        ├── filterNavigationTree(role, permissions)
        ├── findActiveNavigationItem(pathname)
        ├── getAncestorIds(activeId)
        └── validateNavigationRegistry()
                 │
                 ▼
PermissionAwareNavigationTree
        │
        ├── AppNavigationSidebar
        └── WorkspaceSwitcher (tái dùng ở màn hình 7 vùng sau này)
                 │
                 ▼
AppShell
        ├── navigation
        ├── content
        └── account/logout footer
```

### 4.1. Nguyên tắc module

- Registry không import Prisma, NextAuth, `next/navigation` hoặc Lucide component.
- Icon được lưu dưới dạng `iconKey` string; component UI chịu trách nhiệm map sang Lucide icon.
- Hàm filter/active là hàm thuần để có thể test bằng `ts-node`.
- App Shell không biết nghiệp vụ riêng của từng trang.
- Không đưa permission scope của Phase 2 vào registry Phase 1.

### 4.2. Cấu trúc file mục tiêu

```text
dashboard/app/components/navigation/
  navigation-types.ts
  navigation-registry.ts
  navigation-utils.ts
  navigation-icons.tsx
  PermissionAwareNavigationTree.tsx
  WorkspaceSwitcher.tsx
  AppNavigationSidebar.tsx

dashboard/app/components/shell/
  AppShell.tsx

dashboard/lib/
  navigation.test.ts
```

Có thể điều chỉnh tên file nếu repo có convention phù hợp hơn, nhưng phải giữ tách biệt giữa dữ liệu, hàm thuần và UI.

## 5. Hợp đồng navigation registry

### 5.1. Kiểu dữ liệu

Registry nên hỗ trợ tối thiểu ba loại node:

```ts
type NavigationGroup = {
  type: "group";
  id: string;
  label: string;
  iconKey?: NavigationIconKey;
  children: NavigationNode[];
};

type NavigationItem = {
  type: "item";
  id: string;
  label: string;
  href: string;
  iconKey: NavigationIconKey;
  permission: PermissionKey;
  match?: "exact" | "prefix";
  aliases?: string[];
};

type NavigationNode = NavigationGroup | NavigationItem;
```

Quy tắc:

- `id` ổn định, duy nhất toàn cây và không phụ thuộc bản dịch label.
- Mỗi item có đúng một `href` canonical.
- `permission` phải là `PermissionKey`, không dùng string tùy ý.
- `match = "exact"` chỉ dùng cho `/` để tránh Ca chụp active trên mọi route.
- Các route còn lại mặc định prefix match theo segment: `/archive` khớp `/archive/...` nhưng không khớp `/archive-old`.
- `aliases` chỉ dùng khi một màn hình có route phụ cần cùng active item; không dùng để che giấu cấu trúc route sai.
- Node group không có permission riêng. Group hiển thị khi còn ít nhất một item con hợp lệ.

### 5.2. Cây menu Phase 1

```text
Công việc lâm sàng
├─ Ca chụp
├─ Tiếp đón & danh sách chỉ định
├─ Ca ngoài DICOM (Non-DICOM)
├─ Hội chẩn
└─ Lưu trữ & trả kết quả

Báo cáo & điều hành
├─ Trung tâm điều hành
├─ Thống kê
├─ Mẫu nội dung báo cáo
└─ Mẫu phiếu in

Cấu hình chuyên môn
├─ Hồ sơ đơn vị
├─ Danh mục chuyên môn
├─ Máy chụp & PACS
├─ Tích hợp HIS
└─ Ma trận quyền theo máy

Quản trị hệ thống
├─ Người dùng & vai trò
├─ Dữ liệu & lưu trữ
│  ├─ Dung lượng & thư mục lưu trữ
│  ├─ Chính sách lưu giữ
│  ├─ Sao lưu & khôi phục
│  └─ Yêu cầu xóa dữ liệu
└─ Vận hành & an toàn
   ├─ Trung tâm vận hành
   │  ├─ Tình trạng hệ thống
   │  ├─ An toàn thông tin
   │  ├─ Hiệu năng hệ thống
   │  ├─ Tuân thủ DICOM
   │  └─ Sẵn sàng triển khai
   ├─ Kết nối máy trạm
   ├─ Quản lý phiên bản
   │  ├─ Tổng quan phiên bản
   │  ├─ Kiểm thử chấp nhận (UAT)
   │  └─ Chuẩn bị vận hành chính thức
   ├─ Đào tạo
   ├─ Sự cố
   ├─ Yêu cầu thay đổi
   └─ Quy trình vận hành

Tài khoản cá nhân
└─ Hồ sơ & bảo mật tài khoản
```

### 5.3. Route và permission chi tiết

| ID đề xuất | Nhãn | Route | Permission |
| --- | --- | --- | --- |
| `studies` | Ca chụp | `/` | `studies.read` |
| `worklist` | Tiếp đón & danh sách chỉ định | `/worklist` | `worklist.manage` |
| `non-dicom` | Ca ngoài DICOM (Non-DICOM) | `/non-dicom` | `nonDicom.read` |
| `consultations` | Hội chẩn | `/consultations` | `consult.read` |
| `archive` | Lưu trữ & trả kết quả | `/archive` | `archive.read` |
| `command-center` | Trung tâm điều hành | `/command-center` | `commandCenter.read` |
| `statistics` | Thống kê | `/statistics` | `statistics.read` |
| `report-templates` | Mẫu nội dung báo cáo | `/settings/report-templates` | `templates.manage` |
| `print-templates` | Mẫu phiếu in | `/admin/templates` | `admin.catalogs` hiện tại |
| `clinic-profile` | Hồ sơ đơn vị | `/settings/clinic-profile` | `clinic.manage` |
| `catalogs` | Danh mục chuyên môn | `/admin/catalogs` | `admin.catalogs` |
| `pacs-nodes` | Máy chụp & PACS | `/admin/pacs/nodes` | `pacs.manage` |
| `his` | Tích hợp HIS | `/admin/his` | `his.manage` |
| `permission-matrix` | Ma trận quyền theo máy | `/admin/permissions/matrix` | `admin.permissions` |
| `users` | Người dùng & vai trò | `/admin/users` | `users.manage` |
| `storage` | Dung lượng & thư mục lưu trữ | `/admin/storage` | `admin.storage` |
| `retention` | Chính sách lưu giữ | `/admin/retention` | `retention.read` |
| `backup` | Sao lưu & khôi phục | `/admin/backup` | `backup.read` |
| `destructive` | Yêu cầu xóa dữ liệu | `/admin/destructive` | `destructive.audit` |
| `ops-health` | Tình trạng hệ thống | `/admin/ops/health` | `ops.health` |
| `ops-security` | An toàn thông tin | `/admin/ops/security` | `ops.security` |
| `ops-performance` | Hiệu năng hệ thống | `/admin/ops/performance` | `ops.performance` |
| `ops-dicom` | Tuân thủ DICOM | `/admin/ops/dicom` | `ops.dicomConformance` |
| `ops-deployment` | Sẵn sàng triển khai | `/admin/ops/deployment` | `ops.deployment` |
| `native` | Kết nối máy trạm | `/admin/native` | `native.manage` |
| `release` | Tổng quan phiên bản | `/admin/release` | `release.read` |
| `release-uat` | Kiểm thử chấp nhận (UAT) | `/admin/release/uat` | `uat.read` |
| `release-go-live` | Chuẩn bị vận hành chính thức | `/admin/release/go-live` | `release.read` |
| `training` | Đào tạo | `/admin/training` | `training.read` |
| `incidents` | Sự cố | `/support/incidents` | `incident.read` |
| `changes` | Yêu cầu thay đổi | `/admin/changes` | `change.read` |
| `runbooks` | Quy trình vận hành | `/admin/runbooks` | `runbook.read` |
| `account` | Hồ sơ & bảo mật tài khoản | `/settings/account` | `account.selfManage` |

`/admin/ops` có thể redirect hoặc giữ làm trang tổng quan nếu route hiện tại hoạt động với `ops.health`; menu ưu tiên các trang con vì permission của chúng độc lập. Không tự đổi permission của route trong Phase 1.

## 6. Quy tắc lọc menu theo quyền

Thuật toán:

1. Nhận `role` và `explicitPermissions` từ session.
2. Với item, gọi đúng `hasPermission(role, item.permission, explicitPermissions)`.
3. Với group, lọc đệ quy children.
4. Xóa group nếu children sau lọc rỗng.
5. Không hiển thị item tạm thời trong khi session đang loading.
6. Nếu đọc session lỗi, hiển thị shell an toàn với thông báo tải lại/đăng xuất; không fallback hiển thị Ca chụp.

Không được:

- Chỉ dùng role string để suy đoán menu.
- Hiển thị tất cả rồi dùng CSS ẩn.
- Giữ node group rỗng.
- Tạo permission riêng chỉ cho menu.
- Cho phép `undefined permission` mặc định thành visible.

## 7. Xác định mục active từ URL

`findActiveNavigationItem(pathname)` phải:

- Bỏ query string/hash nếu đầu vào có chúng.
- Normalize trailing slash, trừ root.
- Dùng exact match cho `/`.
- Với prefix route, chỉ khớp theo segment boundary.
- Chọn match dài/cụ thể nhất.
- Hỗ trợ nested route như `/consultations/[id]`, `/admin/runbooks/[id]`, `/admin/release/uat/runs/[runId]`.
- Trả về active item cùng danh sách ancestor group IDs để tự mở đúng nhánh.
- Không cần page truyền prop `active` nữa.

Ví dụ:

| Pathname | Active item |
| --- | --- |
| `/` | `studies` |
| `/worklist/new` | `worklist` |
| `/consultations/abc` | `consultations` |
| `/admin/ops/security` | `ops-security` |
| `/admin/release/uat/runs/123` | `release-uat` |
| `/admin/runbooks/abc` | `runbooks` |
| `/share/token` | Không có item; route này không dùng App Shell |

## 8. App Shell và chiến lược tích hợp route

### 8.1. Hợp đồng App Shell

`AppShell` cần nhận `children` và tùy chọn tối thiểu:

```ts
type AppShellProps = {
  children: React.ReactNode;
  contentClassName?: string;
  contentOverflow?: "hidden" | "auto";
};
```

App Shell chịu trách nhiệm:

- Chiều cao màn hình, màu root và flex layout.
- Navigation sidebar/menu cây.
- Vùng nội dung `min-w-0 min-h-0` để table/split pane không tràn.
- Session loading/error state của navigation.
- Footer tài khoản và đăng xuất.

App Shell không chịu trách nhiệm:

- Header nghiệp vụ của trang.
- Fetch dữ liệu màn hình.
- Permission action bên trong trang.
- Download manager toàn cục; giữ ở root layout hiện tại.

### 8.2. Layout theo route subtree

Ưu tiên thêm layout ở subtree để trang con tự nhận shell mà không đổi URL:

```text
dashboard/app/admin/layout.tsx
dashboard/app/settings/layout.tsx
dashboard/app/support/layout.tsx
dashboard/app/worklist/layout.tsx
dashboard/app/archive/layout.tsx
dashboard/app/statistics/layout.tsx
dashboard/app/non-dicom/layout.tsx
dashboard/app/consultations/layout.tsx
dashboard/app/command-center/layout.tsx
```

Trang `/` không có subtree riêng nên bọc nội dung bằng `AppShell` tại `dashboard/app/page.tsx` trong Phase 1. Không đưa App Shell vào root layout vì `/login`, `/share/[token]` và trang report/viewer toàn màn hình có yêu cầu chrome khác.

Khi thêm subtree layout:

- Xóa `AppSidebar` nhúng trực tiếp trong các page thuộc subtree để tránh sidebar kép.
- Điều chỉnh wrapper ngoài của page từ `h-screen w-full` sang `h-full w-full min-w-0 min-h-0` khi cần.
- Không thay đổi nội dung, filter, form hoặc action của trang.
- Kiểm tra cả list, create, detail và nested operational pages.

### 8.3. Route không dùng App Shell

Giữ chrome riêng cho:

- `/login`.
- `/share/[token]`.
- `/report/[studyInstanceUid]` nếu trang này tiếp tục là report toàn màn hình.
- Các API route và OHIF Viewer ngoài Next dashboard.

Nếu phát hiện route public/chrome-less khác trong lúc triển khai, ghi lại và thêm test; không tự bọc tất cả từ root.

## 9. Hành vi giao diện menu

### 9.1. Desktop

- Sidebar đóng: rộng 56 px, hiển thị nút mở menu và nhận diện MiniPACS gọn.
- Sidebar mở: mục tiêu 240–280 px để nhãn tiếng Việt không bị cắt quá nhiều.
- Nhánh chứa active item tự mở.
- Người dùng có thể đóng/mở từng group.
- Active leaf dùng màu `vin-tableSelected`; icon dùng `vin-accent` như hiện tại.
- Không thêm palette mới hoặc hardcode màu thương hiệu mới.

### 9.2. Workspace switcher

`WorkspaceSwitcher` dùng cùng registry/filter nhưng hiển thị dưới dạng popover/dropdown. Phase 1 tạo component và có thể đặt trong header sidebar; Phase 4 sẽ chuyển nó vào khu vực số 1 của màn hình bác sĩ.

Yêu cầu:

- Hiển thị tên item active.
- Mở cây menu đã lọc theo quyền.
- Đóng khi chọn route, bấm Escape hoặc click ngoài.
- Focus quay về trigger khi đóng.
- Có ô tìm menu nếu số item visible lớn hơn ngưỡng đã chọn, đề xuất 10.

### 9.3. Persistence

Phase 1 lưu local browser, chưa cần model DB:

- `minipacs.navigation.collapsed.v1`.
- `minipacs.navigation.expanded-groups.v1`.

Quy tắc:

- Đọc localStorage trong effect, không gây hydration mismatch.
- Dữ liệu parse lỗi thì reset về default.
- Chỉ lưu group IDs còn tồn tại trong registry.
- Nhánh active luôn được mở kể cả preference đang đóng; sau khi rời route có thể quay lại preference người dùng.

Preference theo user và đồng bộ nhiều máy để Phase sau xử lý; không mở rộng Prisma trong Phase 1.

## 10. Accessibility và bàn phím

Dùng mô hình disclosure navigation thay vì khai báo ARIA tree phức tạp nếu chưa triển khai đầy đủ arrow-key tree behavior.

- `<nav aria-label="Điều hướng chính">`.
- Group trigger là `<button>` với `aria-expanded` và `aria-controls`.
- Link active có `aria-current="page"`.
- Trigger workspace switcher có `aria-haspopup="menu"` hoặc pattern popover tương ứng.
- Tab/Shift+Tab đi qua control theo thứ tự hợp lý.
- Enter/Space mở group và kích hoạt item.
- Escape đóng popover.
- Focus ring nhìn thấy rõ trên palette hiện tại.
- Icon trang trí có `aria-hidden`; icon-only button có accessible label và tooltip/title.
- Không truyền đạt active/disabled chỉ bằng màu.

## 11. Trạng thái UI cần xử lý

| Trạng thái | Hành vi |
| --- | --- |
| Session đang tải | Hiện brand + skeleton; không flash item vượt quyền |
| Session lỗi | Không hiện link riêng tư; có hành động tải lại hoặc đăng xuất |
| Không có item visible | Hiện thông báo `Tài khoản chưa được cấp màn hình làm việc` và Đăng xuất |
| Route active không có trong menu | Shell vẫn render; không đánh dấu item giả |
| Group không có child | Không render group |
| Link đang điều hướng | Có feedback nhẹ, không khóa toàn shell |
| Menu dài hơn viewport | Navigation scroll riêng, footer tài khoản cố định |
| Nhãn dài | Wrap tối đa hợp lý hoặc tooltip; không làm thay đổi chiều rộng sidebar ngoài kiểm soát |

## 12. Kế hoạch triển khai theo lát cắt

### Lát cắt 1 — Registry và hàm thuần

Thực hiện:

- Tạo types, registry, icon keys.
- Nhập đầy đủ menu/route/permission trong mục 5.
- Viết filter tree, active matcher, ancestor resolver và validation.
- Viết test bằng Node assert/`ts-node`.

Hoàn thành khi:

- Registry không import React/server-only code.
- Test duplicate ID/href, permission visibility, group rỗng và active route đều chạy.
- Chưa thay giao diện sản phẩm ở lát cắt này.

### Lát cắt 2 — Navigation tree và workspace switcher

Thực hiện:

- Tạo icon map, tree renderer và group disclosure.
- Tạo workspace switcher/popover.
- Thêm loading/error/empty state.
- Thêm keyboard/accessibility behavior.

Hoàn thành khi:

- Cùng một filtered tree dùng được cho sidebar và switcher.
- Không có flash menu vượt quyền.
- Active path và ancestor expansion đúng.

### Lát cắt 3 — App Shell và tương thích trang chính

Thực hiện:

- Tạo `AppShell`.
- Refactor hoặc thay `AppSidebar` để dùng component mới.
- Bọc trang `/` và các route lâm sàng chính.
- Loại prop `active` khỏi các trang đã migrate.

Hoàn thành khi:

- `/`, Worklist, Non-DICOM, Archive, Statistics, Consultations và Command Center có cùng điều hướng.
- List/detail/create route trong các subtree vẫn hiển thị shell đúng một lần.
- Nội dung trang không bị co về width 0 hoặc tạo nested viewport scroll ngoài ý muốn.

### Lát cắt 4 — Settings, admin và support

Thực hiện:

- Thêm subtree layouts cho `admin`, `settings`, `support`.
- Xóa sidebar nhúng cũ ở các page liên quan.
- Kiểm tra các route con Ops, Release/UAT/Go-live, Incidents, Changes và Runbooks.
- Bảo đảm user có quyền chuyên biệt nhìn thấy đúng leaf dù không có quyền vào leaf anh em.

Hoàn thành khi:

- Mọi menu leaf trong registry mở được và shell không biến mất.
- Middleware không redirect với user có đúng permission.
- Không có sidebar kép.

### Lát cắt 5 — Hoàn thiện, QA và tài liệu

Thực hiện:

- Lưu trạng thái collapsed/expanded.
- Rà toàn bộ nhãn tiếng Việt và encoding UTF-8.
- Chạy typecheck/test/build.
- Chụp screenshot các role đại diện ở sidebar đóng/mở và route sâu.
- Cập nhật tài liệu nếu implementation có quyết định khác được duyệt.

Hoàn thành khi:

- Tất cả acceptance criteria đạt.
- Có evidence test và không còn import/usage `AppSidebar active="..."` cũ.

## 13. Test plan

### 13.1. Unit test hàm thuần

Tạo `dashboard/lib/navigation.test.ts` theo phong cách test script hiện có và thêm vào `npm test`.

Test tối thiểu:

1. Mọi ID là duy nhất.
2. Mọi canonical href là duy nhất, trừ trường hợp được chú thích rõ.
3. Mọi permission là `PermissionKey` hợp lệ.
4. User chỉ có `studies.read` chỉ thấy `Ca chụp` và các ancestor tương ứng.
5. User có `consult.read` nhìn thấy Hội chẩn.
6. User có `admin.permissions` nhìn thấy Ma trận quyền theo máy.
7. Group không có child hợp lệ bị xóa.
8. Custom explicit permissions được tôn trọng như `hasPermission()` hiện tại.
9. `/` chỉ active Ca chụp.
10. `/worklist/new` active Worklist.
11. `/consultations/abc` active Hội chẩn.
12. `/admin/ops/security` active An toàn thông tin, không active Tình trạng hệ thống.
13. `/admin/release/uat/runs/123` active UAT.
14. Segment boundary không cho `/archive-old` active Archive.
15. Registry href có permission khớp `getRoutePermission(href)`; trường hợp khác biệt phải fail hoặc được allowlist có lý do.

### 13.2. Integration/manual matrix

Kiểm thử tối thiểu các profile:

| Profile | Kỳ vọng menu |
| --- | --- |
| Bác sĩ mặc định | Ca chụp, báo cáo/thống kê/hội chẩn theo role permission hiện hữu; không có admin trái quyền |
| Kỹ thuật viên | Worklist/ca chụp và chức năng vận hành được role cấp |
| Lễ tân | Tiếp đón, lưu trữ/thống kê theo permission hiện hữu |
| Admin | Toàn bộ leaf mà permission admin hiện có cho phép |
| Custom role tối thiểu | Chỉ đúng các item trong explicit permissions |
| Custom Ops Security | Thấy An toàn thông tin nhưng không tự thấy các leaf Ops khác |

Với mỗi profile:

- Đăng nhập, refresh, mở/đóng group.
- Mở trực tiếp deep link.
- Điều hướng qua ít nhất ba subtree.
- Back/forward browser giữ active state.
- Đăng xuất hoạt động khi sidebar đóng và mở.
- Không có flash item không được phép.

### 13.3. Layout matrix

- 1280 × 720.
- 1440 × 900.
- 1920 × 1080.
- Sidebar đóng/mở.
- Trang table rộng, form dài, detail nested và Command Center.
- Kiểm tra một vùng scroll chính; navigation có scroll riêng khi menu dài.

### 13.4. Lệnh xác minh

Trong `dashboard`:

```powershell
npm test
npx tsc --noEmit
npm run build
```

`npm run lint` hiện dùng `next lint`, không còn là lựa chọn ổn định trên mọi phiên bản Next; chỉ chạy nếu script hoạt động trong repo và không thay thế typecheck/build.

## 14. Tiêu chí nghiệm thu

### Chức năng

- [ ] Menu hiển thị đúng cây và thứ tự đã chốt.
- [ ] Mọi nhãn trong menu là tiếng Việt chuẩn; DICOM/HIS/PACS giữ tên chuẩn cần thiết.
- [ ] Hội chẩn, Ma trận quyền theo máy và Dung lượng & thư mục lưu trữ xuất hiện khi có quyền.
- [ ] Group rỗng tự ẩn.
- [ ] Active item tự xác định từ URL, bao gồm route con.
- [ ] Mọi route được menu dẫn tới giữ App Shell và không có sidebar kép.
- [ ] Sidebar/switcher đóng mở và lưu preference local.
- [ ] Đăng xuất hoạt động.

### Bảo mật và quyền

- [ ] Navigation dùng cùng `hasPermission()` với hệ thống hiện tại.
- [ ] Không flash item vượt quyền trước khi session tải xong.
- [ ] Middleware/server authorization không bị nới lỏng hoặc bỏ qua.
- [ ] Không thêm permission hoặc role mới trong Phase 1.
- [ ] Route/permission mismatch được test phát hiện.

### Giao diện

- [ ] Giữ nguyên palette `vin`.
- [ ] Sidebar mở đủ chỗ cho nhãn tiếng Việt và sidebar đóng không làm mất khả năng mở menu.
- [ ] Active/focus/hover/disabled phân biệt rõ.
- [ ] Nội dung trang không bị overflow ngang do App Shell.
- [ ] Navigation dài cuộn độc lập và account footer vẫn truy cập được.

### Kỹ thuật

- [ ] Không còn type `ActiveMenu` và prop `active` phân tán ở page đã migrate.
- [ ] Registry/hàm thuần có test.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build` đạt.
- [ ] Không sửa workflow/API/Prisma ngoài phạm vi.
- [ ] `git diff --check` sạch.

## 15. Rủi ro và phương án giảm thiểu

| Rủi ro | Cách xử lý |
| --- | --- |
| App Shell tạo sidebar kép | Migrate theo subtree; tìm toàn bộ `<AppSidebar` trước và sau thay đổi |
| Root layout bọc nhầm login/share/report | Không đặt App Shell tại root; dùng subtree layouts và wrapper riêng cho `/` |
| Route con active sai | Longest segment-prefix match và unit test deep links |
| User thấy menu rồi bị middleware redirect | Test registry permission khớp `getRoutePermission()` |
| User quyền Ops chuyên biệt không vào được parent | Render leaf độc lập theo permission; không yêu cầu permission trên group |
| Layout page hiện tại dùng `h-screen` gây nested scroll | Chuẩn hóa wrapper con sang `h-full/min-h-0` trong lúc migrate, không sửa nội dung |
| Session loading flash quyền | Navigation skeleton và fail-closed rendering |
| LocalStorage hỏng/ID cũ | Version key và validate group IDs khi đọc |
| Scope Phase 1 phình sang redesign toàn app | Chỉ đổi shell/navigation; ghi việc ngoài phạm vi vào backlog Phase sau |

## 16. Rollback plan

Phase 1 không có migration dữ liệu nên rollback phải đơn giản:

1. Giữ `AppSidebar` cũ trong một commit riêng hoặc adapter tạm cho đến khi QA xong.
2. Tách commit registry/utils, UI component và route migration để có thể revert theo lớp.
3. Nếu subtree layout gây lỗi diện rộng, revert layout của subtree đó mà không bỏ registry đã test.
4. Không xóa permission/route mapping hiện tại trong lần phát hành đầu.
5. LocalStorage mới có version key; code cũ bỏ qua an toàn nếu rollback.

Không dùng feature flag lưu DB cho Phase 1. Nếu cần rollout mềm, có thể dùng một environment flag cho shell mới nhưng phải bảo đảm cả hai shell dùng cùng registry để tránh drift.

## 17. Definition of Done

Phase 1 chỉ được đánh dấu hoàn thành khi:

- Toàn bộ acceptance checklist ở mục 14 đạt.
- Có test tự động cho registry/filter/active matching.
- Có evidence manual cho ít nhất Admin, Doctor và một custom role.
- Các route sâu của Consultations, Ops, Release/UAT, Incidents, Changes và Runbooks đã được mở trực tiếp để kiểm tra.
- Không đổi màu, route, permission semantics hoặc nghiệp vụ.
- Tài liệu master liên kết tới file này.
- Người review có thể đối chiếu từng menu item với route và permission từ một registry duy nhất.

## 18. Prompt bàn giao cho AI triển khai Phase 1

Sao chép nguyên khối prompt dưới đây cho AI khác. Đây phải là phần cuối tài liệu để việc bàn giao không bỏ sót phạm vi.

```text
Bạn đang làm việc trong repository MiniPACS tại C:\App\Antigravity\Minipacs-v.2.

Nhiệm vụ: triển khai đầy đủ Phase 1 — App Shell và Menu cây theo tài liệu:
- docs/DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE1_APP_SHELL_NAVIGATION_PLAN.md

Hãy đọc hết hai tài liệu trên và kiểm tra code hiện tại trước khi sửa. Trọng tâm code hiện hữu:
- dashboard/app/components/AppSidebar.tsx
- dashboard/app/layout.tsx
- dashboard/lib/permissions.ts
- dashboard/middleware.ts
- các page đang render <AppSidebar active="..." />
- các route admin/settings/support/clinical được liệt kê trong tài liệu Phase 1

Mục tiêu bắt buộc:
1. Tạo navigation registry thuần dữ liệu, typed bằng PermissionKey, chứa đầy đủ menu cây/nhãn tiếng Việt/route/permission theo tài liệu.
2. Tạo các hàm thuần để lọc cây bằng hasPermission(), ẩn group rỗng, xác định active item từ pathname theo longest segment-prefix match và tìm ancestor groups.
3. Tạo navigation tree, workspace switcher và App Shell dùng palette vin hiện tại. Không tạo palette mới.
4. Navigation phải fail closed trong lúc session loading/error; không flash item vượt quyền.
5. Active menu phải tự suy ra từ URL. Loại dần type ActiveMenu và prop active thủ công ở các page đã migrate.
6. Dùng subtree layouts cho admin, settings, support và các module phù hợp; bọc riêng trang `/`. Không bọc App Shell ở root khiến login/share/report bị ảnh hưởng.
7. Mọi route leaf trong registry phải giữ được shell, route con phải active đúng và không có sidebar kép.
8. Giữ nguyên URL, global permission semantics, middleware/server authorization, workflow, API, Prisma và bảng màu.
9. Lưu trạng thái sidebar/group ở localStorage với version key và xử lý dữ liệu lỗi an toàn.
10. Bổ sung accessibility cơ bản: nav label, aria-expanded, aria-current, focus, Enter/Space/Escape và accessible labels cho icon-only buttons.
11. Viết test TypeScript chạy bằng ts-node cho registry, permission filtering, empty groups, duplicate IDs/hrefs, route-permission consistency và deep-link active matching. Cập nhật npm test nếu cần.
12. Chạy npm test, npx tsc --noEmit, npm run build và git diff --check. Sửa mọi lỗi do thay đổi của bạn gây ra.

Giới hạn nghiêm ngặt:
- Chỉ làm Phase 1.
- Không triển khai quyền theo bệnh viện/chuyên khoa/máy của Phase 2.
- Không sửa getStudies(), worklist filters hoặc bố cục 7 vùng.
- Không thay đổi report/HIS/consultation/viewer workflow.
- Không thêm route giả hoặc permission mới.
- Không đổi màu/thương hiệu.
- Không ghi đè hay xóa thay đổi không liên quan đang có trong worktree.

Cách làm mong muốn:
- Kiểm tra git status trước khi sửa và bảo toàn thay đổi của người dùng.
- Chia thay đổi thành các lát cắt nhỏ: registry/utils/tests → UI navigation → AppShell → migrate clinical routes → migrate admin/settings/support → QA.
- Ưu tiên dùng apply_patch cho chỉnh sửa file.
- Giữ registry không phụ thuộc React, Prisma, NextAuth hoặc server-only imports.
- Icon trong registry dùng iconKey string; map Lucide icon ở lớp UI.
- Nếu phát hiện route-permission hiện tại mâu thuẫn với tài liệu, không tự nới quyền. Ghi rõ bằng chứng, chọn phương án bảo toàn bảo mật và cập nhật test/ghi chú.
- Nếu trang có h-screen gây nested scroll sau khi vào AppShell, chỉ chỉnh wrapper layout cần thiết sang h-full/min-h-0; không redesign nội dung trang.

Tiêu chí bàn giao:
- Tóm tắt file đã thay đổi và quyết định kiến trúc.
- Nêu rõ route nào đã nhận App Shell và route nào chủ động không dùng shell.
- Báo kết quả từng lệnh test/typecheck/build/diff-check.
- Liệt kê rủi ro hoặc phần chưa thể hoàn thành; không tuyên bố hoàn tất nếu acceptance criteria chưa đạt.
- Không tạo commit hoặc push trừ khi người dùng yêu cầu.

Bắt đầu bằng việc đọc tài liệu và lập inventory chính xác các route/component hiện tại, sau đó triển khai đến khi Phase 1 thật sự đạt Definition of Done.
```
