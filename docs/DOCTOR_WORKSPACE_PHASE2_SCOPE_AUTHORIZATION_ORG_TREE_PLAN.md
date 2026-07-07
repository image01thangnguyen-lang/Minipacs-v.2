# Phase 2 — Kế hoạch chi tiết Phân quyền phạm vi và Cây tổ chức

Ngày lập: 2026-07-07  
Thuộc kế hoạch tổng thể: [DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md](./DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md)  
Phụ thuộc: Phase 1 — App Shell và Menu cây đã đạt Definition of Done  
Trạng thái: Đề xuất kỹ thuật để review trước khi migration và enforcement  
Phạm vi: cây tổ chức, grant theo phạm vi, authorization resolver, migration/backfill, màn hình quản trị và enforcement trên mọi đường đọc/ghi dữ liệu ca chụp

## 1. Mục tiêu Phase 2

Thiết lập một lớp phân quyền phạm vi ở máy chủ để người dùng chỉ thấy và chỉ thao tác trên ca thuộc bệnh viện, khoa/chuyên khoa hoặc máy được cấp quyền.

Kết quả cuối Phase 2:

- Có cây tổ chức chuẩn: `Chuỗi bệnh viện → Bệnh viện → Khoa/Chuyên khoa → Phòng → Máy`.
- `FacilityUnit` hiện hữu được dùng làm nguồn sự thật cho các cấp tổ chức; `DicomNode` là thiết bị gắn vào node phù hợp trong cây.
- Có grant theo user hoặc role profile, theo đơn vị tổ chức hoặc máy, theo capability và hiệu lực thời gian.
- Có một resolver duy nhất kết hợp global permission, scope grant, quyền máy hiện hữu và trạng thái resource.
- Danh sách, count, detail, ca liên quan, report, viewer context, archive, consultation và action đều áp cùng resolver.
- Ca chưa ánh xạ hoặc có AE Title mơ hồ không còn fail-open cho người dùng thường.
- Có màn hình quản trị cây tổ chức và phân quyền phạm vi, audit đầy đủ.
- Có migration/rollout `off → shadow → enforce` để tránh khóa nhầm hệ thống đang vận hành.

## 2. Vấn đề hiện tại cần giải quyết

### 2.1. Global permission chưa giới hạn dữ liệu

`studies.read`, `reports.read`, `reports.write` và các permission hiện tại quyết định người dùng được dùng chức năng nào, nhưng chưa trả lời họ được dùng chức năng đó tại bệnh viện/chuyên khoa nào.

### 2.2. Quyền theo máy mới là exception cục bộ

`DoctorMachinePermission` hiện hỗ trợ user × máy × action với `ALLOW`, `DENY`, `DEFAULT`. Tuy nhiên:

- Chỉ hỗ trợ user, chưa hỗ trợ role profile.
- Không hỗ trợ bệnh viện/khoa/chuyên khoa.
- Một số đường đọc dữ liệu chưa dùng helper này.
- Nếu không tìm được máy hoặc AE Title bị mơ hồ, helper hiện cho phép truy cập.
- `getStudies()` chỉ kiểm tra `studies.read` rồi trả danh sách rộng.

### 2.3. Cây tổ chức có model nhưng chưa có contract

`FacilityUnit` đã có `parentId`, nhưng `type` là string chưa chuẩn hóa. `DicomNode.facilityId` đã tồn tại nhưng chưa có quy ước node nào được phép gắn máy. Worklist và study còn dùng nhiều trường string legacy như `sourceFacility`, `referringDepartment`, `stationAeTitle`.

### 2.4. Metadata vẫn có thể bị rò rỉ

Chỉ ẩn row ở client là không đủ. Count, facet, số ca trước đó, tên cơ sở, report status hoặc consultation status cũng có thể tiết lộ sự tồn tại của ca ngoài quyền.

## 3. Ngoài phạm vi

Phase 2 không làm các việc sau:

- Không dựng bộ lọc worklist mới, data grid mới hoặc bố cục 7 vùng.
- Không thay đổi lifecycle/status của order, study, report, HIS hoặc consultation.
- Không thay đổi global role/permission semantics hiện tại.
- Không xây SSO/LDAP/Active Directory hoặc multi-tenant billing.
- Không dùng UI ẩn/hiện làm lớp bảo mật chính.
- Không xóa ngay `DoctorMachinePermission`; phải giữ đường rollback qua ít nhất một chu kỳ phát hành.
- Không hard-delete facility đã có dữ liệu lịch sử.
- Không dùng real PHI trong seed hoặc test fixtures.
- Không tối ưu analytics mới; chỉ bảo đảm dữ liệu analytics/drilldown hiện hữu không vượt scope.

## 4. Nguyên tắc kiến trúc

### 4.1. Global permission và scope permission có vai trò khác nhau

- Global permission trả lời: người dùng được làm loại hành động nào.
- Scope permission trả lời: hành động đó được làm trên dữ liệu thuộc phạm vi nào.
- Một request chỉ được phép khi cả hai lớp cùng cho phép.

### 4.2. Server-side, fail closed

- List phải loại resource ngoài quyền trước khi trả response.
- Detail ngoài quyền trả lỗi chung, không tiết lộ resource có tồn tại.
- Mutation phải kiểm tra lại ngay trước khi ghi.
- Ca không phân loại mặc định deny cho user thường khi ở chế độ enforce.
- Client chỉ dùng `allowedActions` để trình bày; không phải nguồn quyết định cuối cùng.

### 4.3. Một resolver, không nhiều policy rời rạc

Mọi module phải gọi chung authorization service. Không được tự viết lại logic “nếu admin”, “nếu cùng máy”, “nếu cùng cơ sở” trong từng action/page.

### 4.4. Lịch sử không đổi theo cấu hình hiện tại

Study/order phải lưu snapshot đơn vị thực hiện. Nếu máy được chuyển từ chuyên khoa A sang B, ca cũ vẫn thuộc A; chỉ ca mới theo B.

### 4.5. Deny thắng allow

Trong mọi grant áp dụng cho resource, explicit `DENY` thắng mọi `ALLOW`. Đây là luật an toàn và dễ giải thích cho admin.

Ngoại lệ duy nhất là System Admin bypass được mô tả rõ, có global permission tương ứng và được audit/telemetry khi truy cập dữ liệu chưa phân loại.

## 5. Taxonomy cây tổ chức

### 5.1. Loại node chuẩn

Phase 2 chuẩn hóa các giá trị:

```ts
export const FACILITY_UNIT_TYPES = [
  "CHAIN",
  "HOSPITAL",
  "DEPARTMENT",
  "SPECIALTY",
  "ROOM",
] as const;
```

Ý nghĩa:

- `CHAIN`: chuỗi/đơn vị chủ quản cao nhất.
- `HOSPITAL`: bệnh viện, cơ sở hoặc chi nhánh khám chữa bệnh.
- `DEPARTMENT`: khoa/phòng ban tổ chức.
- `SPECIALTY`: chuyên khoa thực hiện chuyên môn.
- `ROOM`: phòng thực hiện; `DicomNode` gắn dưới phòng hoặc node chuyên môn gần nhất.

Không bắt buộc mọi cây phải có đủ năm cấp. Bệnh viện nhỏ có thể dùng `HOSPITAL → SPECIALTY → DicomNode`.

### 5.2. Quan hệ cha/con hợp lệ

| Parent | Child cho phép |
| --- | --- |
| Root | `CHAIN`, hoặc `HOSPITAL` trong triển khai đơn cơ sở |
| `CHAIN` | `HOSPITAL` |
| `HOSPITAL` | `DEPARTMENT`, `SPECIALTY`, `ROOM` |
| `DEPARTMENT` | `SPECIALTY`, `ROOM` |
| `SPECIALTY` | `ROOM` |
| `ROOM` | Không có FacilityUnit con; có thể gắn DicomNode |

Server phải ngăn:

- Tạo cycle.
- Gắn node làm parent của chính nó hoặc descendant của nó.
- Gắn `CHAIN` dưới node khác.
- Chuyển node làm sai taxonomy.
- Deactivate parent còn child/machine active nếu chưa có kế hoạch xử lý.

### 5.3. Chiến lược cho cột `type` hiện tại

Không đổi ngay sang Prisma enum trước khi audit dữ liệu. Quy trình:

1. Thống kê các giá trị `FacilityUnit.type` hiện có.
2. Ánh xạ giá trị rõ nghĩa, ví dụ `FACILITY → HOSPITAL` khi được xác nhận.
3. Đưa giá trị mơ hồ như `AREA` vào danh sách review thủ công; không tự đoán thành `ROOM`.
4. Tạo constants + Zod validation ở code.
5. Chỉ cân nhắc DB enum ở phase sau khi toàn bộ dữ liệu sạch.

### 5.4. `ClinicProfile` không thay thế cây tổ chức

`ClinicProfile` tiếp tục chứa branding, pháp nhân và thông tin in. Nó không được dùng làm scope authorization. Có thể liên kết profile với hospital mặc định sau này nhưng không trộn hai model trong Phase 2.

## 6. Nguồn đơn vị của resource

### 6.1. Thêm snapshot đơn vị thực hiện

Đề xuất bổ sung:

- `WorklistOrder.performingUnitId` → `FacilityUnit`.
- `ImagingStudy.performingUnitId` → `FacilityUnit`.
- Giữ các string legacy để tương thích HIS/DICOM và audit nguồn.
- `NonDicomExam.facilityId` hiện có được chuẩn hóa để trỏ vào `FacilityUnit` phù hợp.

Index:

- `WorklistOrder.performingUnitId, scheduledDate`.
- `ImagingStudy.performingUnitId, status`.
- `ImagingStudy.performingUnitId, createdAt`.

### 6.2. Quy tắc resolve đơn vị khi tạo/sync

Thứ tự:

1. `performingUnitId` đã được gán hợp lệ trên order/study.
2. Facility/unit của DICOM node khớp duy nhất với `stationAeTitle`.
3. `WorklistOrder.performingUnitId` của order liên kết.
4. Mapping được admin xác nhận từ HIS department/source code.
5. Không resolve được → `UNCLASSIFIED`, không đoán bằng free-text.

Khi resolve thành công lần đầu, lưu snapshot vào order/study. Không tự thay snapshot chỉ vì cấu hình máy thay đổi.

### 6.3. AE Title

- Audit duplicate active AE Title trước enforcement.
- Sau khi dữ liệu sạch, thêm partial unique index PostgreSQL cho active `aeTitle` nếu deployment cho phép.
- AE Title thiếu/mơ hồ tạo data-quality signal.
- Không dùng fallback allow trong chế độ enforce.

## 7. Mô hình AccessScopeGrant

### 7.1. Model đề xuất

```prisma
model AccessScopeGrant {
  id                 String   @id @default(uuid())
  userId             String?
  roleProfileId      String?
  facilityUnitId     String?
  dicomNodeId        String?
  capability         String
  effect             String   // ALLOW | DENY
  includeDescendants Boolean  @default(true)
  validFrom          DateTime?
  validUntil         DateTime?
  reason             String?  @db.Text
  createdByUserId    String?
  updatedByUserId    String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user          User?           @relation(...)
  roleProfile   AppRoleProfile? @relation(...)
  facilityUnit  FacilityUnit?   @relation(...)
  dicomNode     DicomNode?      @relation(...)

  @@index([userId, capability, effect])
  @@index([roleProfileId, capability, effect])
  @@index([facilityUnitId, capability])
  @@index([dicomNodeId, capability])
  @@index([validFrom, validUntil])
  @@map("access_scope_grants")
}
```

Migration SQL phải thêm CHECK constraints:

- Chính xác một principal: `userId XOR roleProfileId`.
- Chính xác một scope: `facilityUnitId XOR dicomNodeId`.
- `effect IN ('ALLOW', 'DENY')`.
- `validUntil > validFrom` khi cả hai có giá trị.
- `includeDescendants=false` khi scope là máy.

Do PostgreSQL unique với nullable columns không đủ chặt, dùng partial unique indexes cho bốn tổ hợp user/role × facility/machine × capability. Prisma actions không được giả định composite upsert nếu index không được Prisma biểu diễn.

### 7.2. Không tạo wildcard capability

UI có thể có nút `Chọn tất cả`, nhưng server lưu từng capability cụ thể. Không dùng `*`, tránh grant mới vô tình thừa hưởng capability được thêm trong tương lai.

### 7.3. Capability registry

Tái sử dụng các machine action key hiện có, bổ sung tối thiểu:

```text
READ_STUDY
READ_REPORT
EDIT_CLINICAL
ASSIGN_CASE
DRAFT_REPORT
SIGN_REPORT
APPROVE_REPORT
UNFINALIZE_REPORT
CANCEL_DRAFT
DELIVER_RESULT
SYNC_HIS
CREATE_CONSULT
```

Registry phải thuần TypeScript và map rõ global permission:

| Capability | Global permission cơ sở |
| --- | --- |
| `READ_STUDY` | `studies.read` |
| `READ_REPORT` | `reports.read` |
| `EDIT_CLINICAL` | `studies.updateClinical` |
| `ASSIGN_CASE` | `studies.assign` |
| `DRAFT_REPORT` | `reports.write` |
| `SIGN_REPORT` | `reports.finalize` |
| `APPROVE_REPORT` | `reports.finalize` theo policy hiện tại |
| `UNFINALIZE_REPORT` | `reports.unfinalize` |
| `CANCEL_DRAFT` | `reports.cancelDraft` |
| `DELIVER_RESULT` | `archive.deliver` |
| `SYNC_HIS` | `his.sync` hoặc permission cụ thể của action gọi |
| `CREATE_CONSULT` | `consult.create` |

Action đọc/ghi derivative như report, consultation, export phải yêu cầu `READ_STUDY` cùng capability chuyên biệt để không cấp quyền trên resource mà user không được thấy.

## 8. Luật tính quyền hiệu lực

### 8.1. Pipeline

```text
Authenticated user
  → global permission
  → resolve resource scope
  → system-admin exception (nếu đủ điều kiện)
  → active grants của user + role profile
  → legacy machine exception trong giai đoạn migration
  → DENY wins
  → có ALLOW phù hợp
  → workflow/status policy
  = final decision
```

### 8.2. Grant áp dụng

Facility grant áp dụng khi:

- Resource nằm đúng node scope; hoặc
- `includeDescendants=true` và resource nằm trong descendant.

Machine grant áp dụng khi resource resolve đúng `DicomNode`.

Grant chỉ active khi:

- Principal active.
- Facility/machine active cho thao tác mới.
- `validFrom` đã tới và `validUntil` chưa hết.

### 8.3. Precedence

1. Thiếu authentication → deny.
2. Thiếu global permission → deny.
3. Resource unclassified/ambiguous → deny cho non-admin.
4. System Admin hợp lệ → allow scope bypass; vẫn tuân thủ global permission và workflow.
5. Bất kỳ applicable `DENY` nào từ user, role profile hoặc machine legacy → deny.
6. Có ít nhất một applicable `ALLOW` → allow scope.
7. Không có grant → deny.

User-level allow không được vượt role-level deny; machine allow không được vượt facility deny. Admin UI phải giải thích rõ grant nào tạo quyết định.

### 8.4. Reason code chuẩn

Resolver trả kết quả nội bộ:

```ts
type ScopeDecision = {
  allowed: boolean;
  reasonCode:
    | "ALLOWED_BY_GRANT"
    | "ADMIN_BYPASS"
    | "GLOBAL_PERMISSION_MISSING"
    | "NO_SCOPE_GRANT"
    | "EXPLICIT_DENY"
    | "RESOURCE_UNCLASSIFIED"
    | "AMBIGUOUS_MACHINE"
    | "GRANT_EXPIRED"
    | "RESOURCE_INACTIVE";
  matchedGrantIds: string[];
  resourceContext: {
    performingUnitId: string | null;
    ancestorUnitIds: string[];
    dicomNodeId: string | null;
    classified: boolean;
  };
};
```

Không gửi `matchedGrantIds` hoặc cấu trúc nội bộ nhạy cảm xuống client thường. Chúng dùng cho audit/admin explain mode.

## 9. Authorization service dùng chung

### 9.1. Cấu trúc file đề xuất

```text
dashboard/lib/authz/scope/
  capability-registry.ts
  facility-types.ts
  organization-tree.ts
  resource-scope-resolver.ts
  scope-grant-repository.ts
  scope-decision.ts
  study-access-filter.ts
  require-scoped-access.ts
  authorization-mode.ts
```

### 9.2. API nội bộ đề xuất

```ts
resolveStudyResourceContext(studyInstanceUid)
resolveOrderResourceContext(orderId)
evaluateScopeAccess(user, capability, resourceContext)
requireScopedStudyAccess(user, globalPermission, capability, studyUid)
requireScopedOrderAccess(user, globalPermission, capability, orderId)
buildAccessibleStudyWhere(user, capability)
buildAccessibleOrderWhere(user, capability)
getAllowedActionsForStudies(user, studies)
getVisibleOrganizationTree(user, capability)
explainScopeDecisionForAdmin(userId, capability, resourceId)
```

### 9.3. Không N+1

- Không gọi Prisma grant query cho từng row.
- Load principal grants một lần/request hoặc batch.
- Resolve danh sách allowed/denied unit IDs và node IDs một lần.
- Dùng Prisma `where` để lọc trước khi query row.
- `allowedActions` cho trang dữ liệu được tính batch.
- Phase 2 ưu tiên request-scoped memoization; không cache quyền giữa request nếu chưa có version/invalidation đáng tin cậy.

### 9.4. Cây descendant

MVP dùng toàn bộ active `FacilityUnit` metadata để xây graph nhỏ trong memory/request và tính ancestor/descendant. Không cần thêm closure table ở Phase 2 nếu số node ở mức hàng trăm/thấp nghìn.

Nếu benchmark cho thấy cần tối ưu, bổ sung closure table trong PR riêng; không trộn trước khi có số liệu.

## 10. Tích hợp `DoctorMachinePermission`

### 10.1. Mục tiêu

Không duy trì hai bộ luật lâu dài. `AccessScopeGrant` là model đích; `DoctorMachinePermission` là nguồn legacy cần migrate có kiểm soát.

### 10.2. Migration mapping

Mỗi record legacy được map:

- `doctorId` → `userId`.
- `dicomNodeId` → `dicomNodeId`.
- `actionKey` → `capability` cùng tên.
- `allow=true/false` → `effect=ALLOW/DENY`.
- Copy reason/timestamps/actor khi có thể.

### 10.3. Compatibility window

Trong rollout:

1. Copy legacy → grant mới bằng migration idempotent.
2. Shadow resolver so sánh quyết định cũ/mới.
3. Admin matrix tạm thời ghi qua một service có thể dual-write trong transaction.
4. Có job/report phát hiện drift giữa hai bảng.
5. Khi enforce ổn định, UI đọc/ghi grant mới; bảng legacy giữ read-only để rollback.
6. Xóa bảng legacy chỉ ở phase/release sau, không trong Phase 2.

Không cho các module tự đọc cả hai bảng. Chỉ compatibility adapter trong authorization service được phép làm việc đó.

## 11. Chế độ rollout authorization

### 11.1. Mode

```text
OFF      = hành vi cũ; vẫn thu thập data-quality cơ bản
SHADOW   = tính quyết định mới, ghi mismatch/metrics, chưa chặn request
ENFORCE  = quyết định mới được áp dụng
```

Mode là cấu hình server/deployment, không gửi quyền chuyển mode xuống client thường.

### 11.2. Backfill giữ tương thích

Để tránh tất cả non-admin mất quyền ngay:

- Tạo root scope grant cho user/role profile dựa trên global permissions hiện hữu.
- Migrate explicit machine deny/allow.
- Admin thu hẹp root grant về bệnh viện/chuyên khoa thực tế.
- Chạy preview “user sẽ thấy bao nhiêu ca” trước enforce.
- Chỉ bật enforce khi owner từng bệnh viện ký xác nhận.

User mới sau cutover không tự có root grant; phải được cấp scope rõ ràng.

### 11.3. Unclassified queue

Tạo dashboard/admin view không chứa PHI thừa:

- AE Title thiếu/không khớp/trùng.
- Node chưa gắn FacilityUnit.
- Order/study chưa có performing unit.
- Số lượng theo nguồn và tuổi dữ liệu.

Chỉ `admin.facilities`, `admin.permissions` hoặc System Admin phù hợp được xem. Admin có thể mapping và chạy backfill có preview.

## 12. Coverage bắt buộc

### 12.1. List và count

- `getStudies()` ở màn hình chính.
- Worklist order list.
- Archive list.
- Command Center và Statistics drilldown/count.
- Consultation list khi trả patient/study metadata.
- Non-DICOM list.
- Search/autocomplete chứa patient/study.

### 12.2. Detail và related studies

- Study/report detail.
- Viewer study context và report workspace.
- Previous/related study count và list.
- History/action history/key images/measurements/snapshots.
- Share/consultation context khi actor nội bộ tạo hoặc quản lý.

Mọi previous-study count phải đếm trên accessible studies, không đếm toàn DB.

### 12.3. Mutation/actions

- Assign doctor, update clinical info, start reading.
- Save draft, sign/finalize, approve, unfinalize, cancel draft.
- Deliver result, HIS sync/retry.
- Create consultation/share/export.
- Viewer artifact create/update/delete.

Mỗi action kiểm tra global + scope + workflow ngay trước mutation. Không tái sử dụng quyết định client đã gửi.

### 12.4. Response behavior

- List: resource ngoài scope không xuất hiện.
- Count/facet: không tính resource ngoài scope.
- Direct read ngoài scope: trả `404` generic khi cần tránh resource enumeration.
- Mutation ngoài scope: trả error chuẩn hóa, không chứa PHI hay chi tiết grant.
- Admin explain endpoint: permission riêng, audit và chỉ trả metadata cần thiết.

## 13. Màn hình quản trị cây tổ chức

### 13.1. Route và quyền

- Route đề xuất: `/admin/facilities`.
- Permission: `admin.facilities`.
- Bổ sung route permission và menu registry Phase 1.

### 13.2. Bố cục

- Trái: cây tổ chức, search, trạng thái active/inactive.
- Phải: thông tin node, parent, type, code, name, địa chỉ/điện thoại phù hợp.
- Tab `Máy chụp`: DICOM nodes đang gắn/chưa gắn.
- Tab `Chất lượng dữ liệu`: ca/order chưa phân loại, duplicate/missing AE.

### 13.3. Tác vụ

- Tạo child theo taxonomy.
- Sửa name/metadata; code ổn định sau khi đã tham chiếu.
- Move node với preview descendants/machines/affected grants.
- Sắp xếp sibling.
- Deactivate/reactivate có impact preview.
- Gắn/bỏ gắn DICOM node.
- Không hard-delete node đã được study/order/grant tham chiếu.

Mọi action phải validate server, transaction và audit.

## 14. Màn hình quản trị scope grants

Mở rộng `/admin/permissions/matrix` thành hai tab:

1. `Phạm vi tổ chức`.
2. `Quyền chi tiết theo máy` hoặc compatibility view.

### 14.1. Chọn principal

- User active.
- Role profile active.
- Hiển thị global permissions liên quan dưới dạng read-only context.

### 14.2. Matrix/tree

- Cây facility với trạng thái `ALLOW`, `DENY`, `DEFAULT` theo capability.
- Machine leaf khi cần cấp ngoại lệ chính xác.
- Phân biệt direct grant, inherited grant và effective decision.
- Tooltip/chi tiết giải thích nguồn kế thừa.
- Filter capability để tránh ma trận quá rộng.

### 14.3. Save

- Gửi diff, không gửi lại toàn bộ ma trận mù.
- Validate principal/scope active và capability hợp lệ.
- Require reason cho DENY, revoke hàng loạt, move grant hoặc cấp capability nhạy cảm.
- Transaction all-or-nothing.
- Audit before/after summary.
- Có preview số ca thấy được trước và sau, không trả PHI.

### 14.4. Explain mode

Admin chọn user + study/order để xem:

- Global permission kết quả.
- Resource thuộc path nào.
- Grant allow/deny nào áp dụng.
- Legacy machine record nào còn ảnh hưởng.
- Final reason code.

Explain mode không cho phép bypass hoặc sửa dữ liệu trực tiếp.

## 15. Audit và observability

### 15.1. Audit actions

```text
ORG_UNIT_CREATED
ORG_UNIT_UPDATED
ORG_UNIT_MOVED
ORG_UNIT_DEACTIVATED
ORG_MACHINE_ASSIGNED
SCOPE_GRANT_CREATED
SCOPE_GRANT_UPDATED
SCOPE_GRANT_REVOKED
SCOPE_GRANT_BULK_CHANGED
SCOPE_ENFORCEMENT_MODE_CHANGED
UNCLASSIFIED_RESOURCE_MAPPED
```

Metadata gồm actor, principal, scope/capability/effect, before/after summary, reason và timestamp. Không ghi patient name/report content/raw HIS payload.

### 15.2. Denied access

- Mutation bị deny: audit security event với action/resource technical ID/reason code.
- List filtering: dùng metric/counter, không tạo AuditLog từng row.
- Shadow mismatch: log structured có rate limit; không chứa PHI.
- Theo dõi số unclassified resource và grant sắp hết hạn.

## 16. Migration plan

### Bước 0 — Inventory và backup

- Backup DB và kiểm tra restore procedure.
- Export count/không export PHI: facility types, node mappings, duplicate AE, user/role profiles, machine permission counts.
- Chốt owner cho từng hospital/specialty.

### Bước 1 — Additive schema

- Thêm `AccessScopeGrant` và constraints/indexes.
- Thêm `performingUnitId` nullable vào order/study.
- Thêm relations/indexes; chưa enforce.
- Thêm authorization mode mặc định `OFF`.

### Bước 2 — Chuẩn hóa cây

- Tạo root `CHAIN` hoặc root hospital được duyệt.
- Normalize type đã xác nhận.
- Gắn hospital/department/specialty/room.
- Validate cycle và active hierarchy.

### Bước 3 — Map máy và snapshot

- Resolve active unique AE Title.
- Gắn `DicomNode.facilityId` vào node tổ chức sâu nhất phù hợp.
- Backfill order/study `performingUnitId` bằng rule ở mục 6.
- Xuất danh sách unclassified để xử lý thủ công.

### Bước 4 — Migrate grants

- Copy machine permissions idempotent.
- Tạo compatibility root grants theo global permission.
- So sánh row count và checksum/diff.
- Không xóa legacy records.

### Bước 5 — Shadow mode

- Chạy trên staging/UAT trước.
- So sánh old/new decision theo route/action.
- Fix missing mappings và unintended access changes.
- Chạy ít nhất một chu kỳ nghiệp vụ đủ dài đã chốt bởi vận hành.

### Bước 6 — Enforce theo đợt

- Pilot một hospital/specialty.
- Theo dõi deny rate, 404/403, support tickets và unclassified count.
- Rollout theo bệnh viện, không bật toàn chuỗi cùng lúc nếu chưa có evidence.
- Có nút/cấu hình server rollback về `SHADOW`.

### Bước 7 — Ổn định

- Chốt admin UI dùng grant mới.
- Báo cáo drift legacy = 0.
- Đóng backfill tool khỏi user thường.
- Lập backlog xóa legacy table ở release sau.

## 17. Test plan

### 17.1. Unit tests thuần

- Validate taxonomy parent/child.
- Detect cycle/reparent invalid.
- Build ancestor/descendant sets.
- Capability ↔ global permission mapping đầy đủ.
- Validity window.
- Deny wins.
- Admin bypass rule.
- Unclassified/ambiguous reason codes.
- Grant resolver không phụ thuộc thứ tự input.

### 17.2. Resolver matrix

| Case | Kỳ vọng |
| --- | --- |
| Hospital A allow, resource A | Allow |
| Hospital A allow, resource B | Deny |
| Parent allow, specialty child deny | Deny child |
| Parent deny, child allow | Deny do explicit deny wins |
| Role allow, user deny | Deny |
| Facility allow, machine deny | Deny machine |
| Exact machine allow, không facility grant | Allow đúng máy nếu không có deny |
| Grant expired | Deny |
| Không grant | Deny |
| Missing/duplicate AE, không snapshot | Deny non-admin |
| Admin có global permission | Admin bypass |
| Admin thiếu global permission do custom profile | Deny |

### 17.3. Integration tests với test DB

Fixture tối thiểu:

- 1 chain, 2 hospitals.
- Mỗi hospital có ít nhất 2 specialties và 2 machines.
- 1 machine chưa phân loại, 1 duplicate AE scenario.
- Doctor A, Doctor B, Technician, Reception, Admin và custom role profile.
- Patient synthetic có ca ở cả hai hospitals.

Kiểm tra:

- List/count/detail/related/history/report/viewer context.
- Mutation report/workflow/HIS/consult.
- Role profile change và user override.
- Move/deactivate organization node.
- Transaction rollback khi một grant diff invalid.
- Không dùng real PHI.

### 17.4. Security regression

- Gọi server action/API trực tiếp, không qua UI.
- Thử UID/id của hospital khác.
- Thử count/facet/previousStudyCount để phát hiện metadata leak.
- Thử export/share/consult trên study ngoài scope.
- Thử stale client `allowedActions` sau khi admin revoke grant.
- Thử session user bị deactivate hoặc grant hết hạn giữa phiên.

### 17.5. Performance

- Không N+1 grant query theo row.
- Benchmark list 50/100 rows với cây 500–1.000 nodes và hàng nghìn grants.
- Resolver metadata load request-scoped có giới hạn.
- Mục tiêu ban đầu: scope resolution/bộ lọc bổ sung P95 dưới 100 ms trong UAT; query tổng vẫn theo mục tiêu worklist.

## 18. Acceptance criteria

### Cây tổ chức

- [ ] Taxonomy được validate ở server.
- [ ] Không tạo cycle hoặc parent-child sai loại.
- [ ] Máy được gắn vào node hợp lệ.
- [ ] Move/deactivate có impact preview và audit.
- [ ] Study/order giữ snapshot lịch sử khi máy chuyển đơn vị.

### Phân quyền

- [ ] Global permission và scope grant cùng được kiểm tra.
- [ ] Explicit deny thắng allow.
- [ ] Role profile và user grant cùng hoạt động.
- [ ] Không grant mặc định deny sau enforce.
- [ ] Unclassified/ambiguous resource deny non-admin.
- [ ] Admin bypass không vượt global permission.
- [ ] Legacy machine permission được migrate/so sánh không drift.

### Không rò dữ liệu

- [ ] List không chứa row ngoài scope.
- [ ] Count/facet/related count không tính resource ngoài scope.
- [ ] Detail/API ngoài scope không tiết lộ resource existence/PHI.
- [ ] Report/viewer/history/artifact áp cùng scope.
- [ ] Mutation trực tiếp ngoài scope bị từ chối.

### Quản trị và vận hành

- [ ] Có UI cây tổ chức và UI scope grants.
- [ ] Mọi thay đổi permission/facility được audit.
- [ ] Có unclassified queue và explain mode.
- [ ] Có OFF/SHADOW/ENFORCE và rollback về SHADOW.
- [ ] Shadow mismatch được xử lý trước rollout.

### Kỹ thuật

- [ ] Một authorization service là nguồn sự thật.
- [ ] Không N+1 permission query.
- [ ] Migration additive/idempotent và có rollback.
- [ ] Unit, integration, security tests pass.
- [ ] `npm test`, typecheck, Prisma validate/migrate check và production build pass.
- [ ] `git diff --check` sạch.

## 19. Kế hoạch triển khai theo lát cắt/PR

### PR 1 — Contract và inventory

- Capability registry, facility type constants, decision/reason types.
- Script read-only audit facility/AE/machine permission.
- Unit tests contract.
- Chưa đổi runtime behavior.

### PR 2 — Additive schema

- AccessScopeGrant, performingUnit relations, constraints/indexes.
- Migration và Prisma validation.
- Không enforce.

### PR 3 — Organization domain service

- Tree query, validate create/move/deactivate, cycle guard.
- Admin facility actions + audit.
- Tests.

### PR 4 — Organization UI

- `/admin/facilities`, route permission, menu item.
- Tree editor, machine mapping, data-quality panel.
- Không triển khai worklist filter UI.

### PR 5 — Scope resolver core

- Resource context, grant repository, precedence, reason codes.
- Request-scoped batch/filter builders.
- Pure + DB integration tests.

### PR 6 — Legacy migration và shadow mode

- Idempotent permission migration.
- Root compatibility grants.
- Shadow compare, metrics và drift report.
- Matrix UI dual-write qua service tạm.

### PR 7 — Read-path enforcement

- Study/order lists, archive, command center/statistics.
- Detail, related studies, report/viewer contexts.
- Count/facet leak tests.

### PR 8 — Mutation enforcement

- Workflow/report/HIS/consult/share/export/viewer actions.
- Batch `allowedActions` support.
- Security regression tests.

### PR 9 — Scope grant admin UI

- Principal selector, tree matrix, inherited/effective state.
- Diff save, reason, preview, explain mode và audit.

### PR 10 — UAT và enforce rollout

- Multi-hospital fixtures.
- Performance/security evidence.
- Pilot, sign-off, rollout/rollback runbook.

Mỗi PR phải có thể review/rollback độc lập. Không gộp schema migration, toàn bộ endpoint enforcement và UI lớn vào một PR.

## 20. Rủi ro và giảm thiểu

| Rủi ro | Giảm thiểu |
| --- | --- |
| Enforce làm mất quyền hàng loạt | Root compatibility grants, shadow mode, rollout theo hospital |
| Dữ liệu facility/máy sai | Inventory, unclassified queue, manual sign-off, không đoán free-text |
| Permission logic drift giữa module | Một resolver/service và coverage tests |
| Machine chuyển đơn vị làm đổi ca cũ | Snapshot `performingUnitId` trên order/study |
| Deny/allow khó hiểu | Explain mode, inherited/direct badges, reason code chuẩn |
| N+1 và query chậm | Batch grants, Prisma where, request-scoped memoization |
| Dual-write legacy drift | Một compatibility service, transaction, diff report |
| Admin tự khóa quyền | Preview, confirm reason, protected System Admin rule, rollback SHADOW |
| Audit chứa PHI | Structured technical IDs/reason codes, scrub helper |
| Scope creep sang Phase 3 UI | Chỉ admin tree/matrix; worklist filters để Phase 3 |

## 21. Rollback plan

- Schema mới additive; không drop cột/bảng hiện tại.
- Chuyển `ENFORCE → SHADOW` là rollback runtime đầu tiên.
- Legacy machine table giữ nguyên qua ít nhất một release.
- Backfill script idempotent và có dry-run.
- Mọi move/mapping/grant change có audit before/after.
- Migration dữ liệu lớn chạy theo batch, resume được.
- Nếu resolver lỗi, không tự fallback allow trong ENFORCE; rollback mode phải do operator có quyền thực hiện.
- Không rollback bằng cách xóa grants hoặc sửa DB thủ công không audit.

## 22. Definition of Done

Phase 2 chỉ hoàn thành khi:

- Cây tổ chức production/UAT được owner xác nhận.
- Không còn active duplicate AE chưa xử lý trong phạm vi rollout.
- Unclassified resource đạt ngưỡng chấp nhận đã ký; non-admin không thấy chúng trong ENFORCE.
- Tất cả read/write paths trong coverage inventory dùng resolver chung.
- Cross-hospital leakage tests pass cho list, count, detail, related, report, viewer và mutation.
- Legacy permission migration không drift.
- Admin facility/scope UI hoạt động và audit đầy đủ.
- Shadow evidence được review, pilot sign-off hoàn thành và rollback runbook được thử.
- Test, typecheck, Prisma checks, build và diff-check pass.
- Tài liệu master liên kết tới tài liệu này.

## 23. Prompt bàn giao cho AI triển khai Phase 2

Sao chép nguyên khối prompt dưới đây cho AI khác. Đây phải là phần cuối tài liệu.

```text
Bạn đang làm việc trong repository MiniPACS tại C:\App\Antigravity\Minipacs-v.2.

Nhiệm vụ: triển khai đầy đủ Phase 2 — Phân quyền phạm vi và Cây tổ chức theo:
- docs/DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE1_APP_SHELL_NAVIGATION_PLAN.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md

Trước khi sửa:
1. Đọc hết các tài liệu trên.
2. Kiểm tra git status và bảo toàn mọi thay đổi hiện hữu, đặc biệt implementation Phase 1 chưa commit.
3. Inventory schema/migration/data assumptions và mọi read/write path trả hoặc mutate study/order/report.
4. Đối chiếu code hiện tại:
   - dashboard/prisma/schema.prisma và migrations
   - dashboard/lib/permissions.ts, dashboard/lib/authz.ts
   - dashboard/lib/authz/machine-permissions.ts
   - dashboard/lib/authz/machine-action-keys.ts
   - dashboard/lib/workflowService.ts
   - dashboard/app/actions.ts
   - dashboard/lib/commandCenterService.ts
   - dashboard/app/admin/permissions/matrix
   - FacilityUnit, DicomNode, WorklistOrder, ImagingStudy, NonDicomExam
   - các API viewer/report/history/share/consult/export liên quan study

Mục tiêu bắt buộc:
1. Chuẩn hóa FacilityUnit taxonomy CHAIN/HOSPITAL/DEPARTMENT/SPECIALTY/ROOM bằng constants + server validation; không ép DB enum trước khi audit dữ liệu.
2. Thêm snapshot performingUnitId cho WorklistOrder và ImagingStudy, giữ field legacy để tương thích.
3. Tạo AccessScopeGrant hỗ trợ user hoặc role profile, scope facility hoặc DICOM node, capability/effect/includeDescendants/validity/reason/audit actor.
4. Migration SQL phải có CHECK constraints XOR principal/scope, effect, validity và partial unique indexes phù hợp.
5. Tạo capability registry dùng lại machine action keys hiện hữu và map global permissions rõ ràng; không dùng wildcard.
6. Xây một authorization service duy nhất: resolve resource context, evaluate grants, deny-wins, admin exception, reason codes, accessible Prisma filters và batch allowedActions.
7. Non-admin phải fail closed cho resource unclassified/ambiguous trong ENFORCE. Không giữ fallback allow hiện tại.
8. Tích hợp DoctorMachinePermission bằng migration/compatibility adapter; không để module tự đọc hai hệ quyền.
9. Hỗ trợ OFF/SHADOW/ENFORCE, root compatibility grants, idempotent backfill, shadow mismatch metrics và rollback ENFORCE→SHADOW.
10. Tạo /admin/facilities với tree editor, taxonomy/cycle validation, machine mapping, deactivate/move impact preview và data-quality view.
11. Mở rộng /admin/permissions/matrix cho scope grants, inherited/effective state, diff save, reason, preview và explain mode.
12. Áp scope ở server cho toàn bộ list/count/detail/related/report/viewer/archive/statistics/consult/non-DICOM và mutation paths trong coverage inventory.
13. previousStudyCount, facet/count và metadata phải chỉ tính resource accessible.
14. Không N+1 permission query; dùng batch/context/filter builders.
15. Audit mọi organization/grant change; deny logs không chứa PHI.
16. Viết unit, DB integration và security regression tests với dữ liệu synthetic đa bệnh viện.

Luật quyền bắt buộc:
- authentication trước.
- global permission trước scope.
- resource unclassified/ambiguous deny non-admin.
- System Admin bypass scope chỉ khi còn global permission phù hợp.
- bất kỳ applicable DENY nào thắng ALLOW.
- có applicable ALLOW mới được phép.
- không grant = deny trong ENFORCE.
- report/action derivative phải yêu cầu READ_STUDY cùng capability chuyên biệt.

Giới hạn nghiêm ngặt:
- Chỉ làm Phase 2.
- Không dựng worklist filter/data grid/bố cục 7 vùng của Phase 3–5.
- Không đổi workflow/status/report/HIS semantics.
- Không đổi palette hoặc redesign nội dung ngoài admin facility/scope UI cần thiết.
- Không drop DoctorMachinePermission trong Phase 2.
- Không commit real PHI, raw DICOM, secret hoặc private path.
- Không bật ENFORCE mặc định trước khi shadow/backfill/test đạt.
- Không tạo fallback allow để làm test pass.
- Không ghi đè thay đổi không liên quan trong worktree.

Cách triển khai:
- Đi theo các PR/lát cắt trong mục 19; không làm một patch khổng lồ.
- Dùng migration additive, dry-run/backfill idempotent và transaction.
- Viết test cùng từng lát cắt, không chờ cuối phase.
- Mỗi endpoint/action đã migrate phải có test outside-scope.
- Nếu phát hiện dữ liệu hoặc policy mơ hồ, dừng enforcement phần đó, ghi rõ blocker và tiếp tục các phần an toàn; không tự đoán mapping.
- Khi route mới /admin/facilities được thêm, cập nhật route permission và navigation registry Phase 1 bằng permission admin.facilities.

Xác minh bắt buộc:
- npm test
- npx tsc --noEmit
- npx prisma validate
- kiểm tra migration trên test database sạch và database có baseline hiện tại
- npm run build
- git diff --check
- manual UAT tối thiểu Doctor Hospital A, Doctor Hospital B, custom role, Technician, Reception và Admin

Khi bàn giao:
- Tóm tắt schema/migrations và quyết định precedence.
- Liệt kê chính xác read/write paths đã enforce và path còn lại.
- Báo số resource được backfill, unclassified, duplicate AE và legacy drift; không đưa PHI.
- Đưa evidence OFF/SHADOW/ENFORCE và rollback test.
- Báo kết quả từng lệnh test/typecheck/Prisma/build/diff-check.
- Không tuyên bố Phase 2 hoàn tất nếu coverage inventory, leakage tests hoặc shadow sign-off chưa đạt.
- Không commit hoặc push trừ khi người dùng yêu cầu.

Bắt đầu bằng inventory read-only và kế hoạch lát cắt cụ thể, sau đó triển khai theo thứ tự schema additive → organization service/UI → resolver → migration/shadow → read enforcement → mutation enforcement → scope UI → UAT/enforce.
```
