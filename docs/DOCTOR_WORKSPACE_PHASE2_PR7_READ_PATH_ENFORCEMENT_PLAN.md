# PR7 - Read-path Enforcement Plan

## 1. Mục tiêu
Tích hợp hệ thống Scope Authorization (từ PR1–PR6) vào toàn bộ các đường đọc (read paths) quan trọng của hệ thống. Đảm bảo người dùng chỉ truy cập được dữ liệu trong phạm vi được cho phép khi `AUTHORIZATION_MODE=ENFORCE`, đồng thời giữ nguyên trạng thái khi mode là `OFF` hoặc `SHADOW`.

## 2. Inventory Read Paths & Cấu trúc Phân loại

Dựa trên quá trình rà soát (inventory), các read paths được chia thành hai nhóm chính: **List/Aggregate (cần Filter Builder)** và **Detail/Context (cần Per-Resource Resolver)**.

### Nhóm 1: List, Search, Aggregate & Statistics (Sử dụng `scope-filter-builder`)

1. **Worklist (`app/worklist/actions.ts`)**
   - **Target**: `getWorklistOrdersAction`
   - **Capability**: `READ_STUDY`
   - **Resource Identifiers**: `scheduledStationAeTitle` (từ `WorklistOrder`). *Lưu ý*: WorklistOrder không có `performingUnitId` hay `machineId` trực tiếp, cần dựa vào `scheduledStationAeTitle` để mapping sang DicomNode.
   - **Cách áp dụng**: Gọi `buildScopeFilter` và áp dụng vào `where` của `prisma.worklistOrder.findMany`.

2. **Archive / Search (`app/archive/actions.ts`)**
   - **Target**: `searchArchiveStudiesAction`
   - **Capability**: `READ_REPORT`
   - **Resource Identifiers**: Lấy từ relation `imagingStudy` của `Report`.
   - **Cách áp dụng**: `buildScopeFilter` áp dụng vào `where` của `prisma.report.findMany`.

3. **Command Center (`lib/commandCenterService.ts`)**
   - **Targets**: `getCommandCenterSummary`, `getLiveQueue`, `getDoctorMachineBacklog`, `scanScopedOpenAlerts`, `getSlaBreaches`, `getStuckWorkflow`.
   - **Capability**: `READ_STUDY`
   - **Resource Identifiers**: Tùy query, chủ yếu là `imagingStudy.stationAeTitle`, `imagingStudy.performingUnitId` và `worklistOrder.scheduledStationAeTitle`.
   - **Cách áp dụng**: Thay thế logic thủ công `getDeniedAeTitlesForAction` hiện có bằng `buildScopeFilter` để áp dụng tập trung tại `buildBaseWhere` và `buildWorklistWhere`.

4. **Statistics / Dashboard (`app/statistics/actions.ts`)**
   - **Targets**: Các hàm `count`, `groupBy`, `aggregate` của `imagingStudy`, `report`, `worklistOrder`.
   - **Capability**: `READ_STUDY` / `READ_REPORT`
   - **Cách áp dụng**: Chèn scope filter condition (`AND`) vào tất cả các `where` clause trước khi gọi aggregate để tránh leak metrics.

### Nhóm 2: Detail, Context & Viewer (Sử dụng `scope-resolver` per-resource)

1. **Report & Study Detail (`app/report/[studyInstanceUid]/actions.ts`)**
   - **Targets**: `getStudyDetails`, `getReport`.
   - **Capability**: `READ_STUDY` hoặc `READ_REPORT`.
   - **Resource Identifiers**: Lấy từ DB bằng `studyInstanceUid` (gồm `performingUnitId`, `stationAeTitle`, v.v...).
   - **Cách áp dụng**: Sau khi query entity từ DB, khởi tạo `resolveResourceContext`, tiếp đó gọi `resolveScopeForResource`. Nếu `ENFORCE` bị Deny => trả về `null` hoặc ném lỗi Forbidden.

2. **Viewer Launch / Metadata (`app/api/viewer/route.ts` & Viewer actions)**
   - **Targets**: Các endpoint trả về URL mở viewer hoặc metadata ảnh.
   - **Capability**: `READ_STUDY`.
   - **Cách áp dụng**: Tương tự Detail, kiểm tra `resolveScopeForResource` trước khi cấp quyền truy cập.

3. **Related / Prior Studies**
   - **Capability**: `READ_STUDY`.
   - **Cách áp dụng**: Sử dụng filter-builder để ẩn các prior studies nằm ngoài scope của bác sĩ.

---

## 3. Các Read Paths chưa thể phân loại rõ (Unclassified)

1. **HIS Sync & System Background Tasks**: Các module đọc data để sync HIS (VD: `lib/his/hisSyncService.ts`) không thuộc một request user cụ thể. *Guardrail*: Không áp dụng Scope Authorization cho system workers (admin/system behavior luôn allowed).

---

## 4. Test Matrix & Scenarios

Sẽ bổ sung unit test cho các read path cốt lõi để đảm bảo:
- **T1 [OFF/SHADOW mode]**: Không thay đổi kết quả (count/list/detail) của request. Phải trả về toàn bộ dữ liệu như baseline.
- **T2 [ENFORCE - List/Aggregate]**: Pagination, Total, Count chỉ phản ánh các resource thuộc Facility/Machine được ALLOW. Parent ALLOW + Child DENY không rò rỉ Child. Root ALLOW + DENY hole chạy đúng.
- **T3 [ENFORCE - Detail]**: Nếu user truy cập ID trực tiếp (Direct Link) của resource ngoài scope, nhận Forbidden (thay vì lộ PHI).
- **T4 [ENFORCE - Ambiguous/Inactive]**: Resource với Inactive Node / Unclassified phải bị chặn (Fail closed).
- **T5 [Context Isolation]**: Các concurrent requests từ 2 users không bị rò rỉ context/cache của nhau qua `ScopeRequestContext`.

---

## 5. Rollout & Rollback Guardrails

- **Mặc định**: Biến `AUTHORIZATION_MODE` giữ nguyên giá trị mặc định là `OFF`.
- **Database**: Không thêm migration thay đổi DB schema, không can thiệp schema cũ trong PR7.
- **Packages**: Không chạm vào `package.json` / `package-lock.json`.
- **N+1 Queries**: Mọi read path dùng chung `ScopeRequestContext` bằng cách truyền param hoặc singleton request-scoped an toàn để tận dụng cache tree.
- **No In-Memory Filtering**: Không dùng Array.filter() sau khi paginate nếu Prisma `where` có thể đảm nhận (để đảm bảo total/count phân trang chính xác).

---

## 6. Trạng thái triển khai và giới hạn đã xác minh

- Đã tích hợp filter ENFORCE vào Worklist, Archive search, Command Center và Statistics; OFF/SHADOW vẫn trả về Prisma `where` rỗng.
- Đã tích hợp per-resource resolver cho các server action chính của Report/Study detail, kể cả artifacts dùng trong report workspace.
- Global ALLOW không còn đồng nghĩa với truy vấn không giới hạn: resource vẫn phải có `performingUnitId` thuộc cây active hoặc AE Title active, unique; resource chưa phân loại/inactive/ambiguous bị fail-closed.
- DENY tại unit/node/AE Title được loại khỏi tập ALLOW; global DENY và cây lỗi khi expand DENY trả về tập rỗng.
- Statistics dùng `AsyncLocalStorage` theo request để gắn cùng scope vào `ImagingStudy`, `Report` và `WorklistOrder` aggregate/list query, tránh sửa hàng loạt truy vấn và tránh chia sẻ context giữa request.
- Command Center áp scope trước count, pagination, alert correlation và SLA scan; không lọc sau pagination.
- Các endpoint public share và HIS system-to-system tiếp tục dùng trust boundary/token riêng, không dùng principal scope của user tương tác.

### Verification gate

Các lệnh bắt buộc trước merge:

```bash
cd dashboard
npx tsc --noEmit
npm test
npx prisma validate
```

Phạm vi PR7 tập trung vào các read path được inventory ở trên. Các viewer API route có quyền chức năng riêng vẫn cần được chuyển đồng bộ sang per-resource resolver trong follow-up hardening trước khi bật ENFORCE toàn hệ thống nếu route đó trả PHI hoặc artifact theo Study UID.
