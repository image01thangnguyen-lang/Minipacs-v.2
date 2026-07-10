# PR9 — Scope Grant Admin UI, Preview và Explain Mode

Ngày lập: 2026-07-11  
Thuộc Phase 2: [DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md](./DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md)  
Tiền đề trực tiếp: [DOCTOR_WORKSPACE_PHASE2_PR8_MUTATION_ENFORCEMENT_PLAN.md](./DOCTOR_WORKSPACE_PHASE2_PR8_MUTATION_ENFORCEMENT_PLAN.md)  
Trạng thái: Kế hoạch triển khai tiếp theo; không bật `ENFORCE` mặc định

## 1. Mục tiêu

PR9 cung cấp giao diện quản trị chính thức cho `AccessScopeGrant`, giúp quản trị viên cấp/thu hồi quyền theo user hoặc role profile trên cây tổ chức/máy, xem quyền kế thừa và quyết định hiệu lực, preview tác động trước khi lưu, và giải thích một quyết định cụ thể mà không làm lộ PHI hoặc internals cho người không có quyền.

Kết quả cần đạt:

- Mở rộng `/admin/permissions/matrix` thành hai tab rõ ràng: `Phạm vi tổ chức` và `Quyền chi tiết theo máy (legacy)`.
- Principal selector hỗ trợ user và `AppRoleProfile`, chỉ chọn principal active, đồng thời hiển thị global permissions read-only.
- Cây facility/machine hiển thị direct grant, inherited grant và effective decision theo từng capability.
- Save theo diff, transaction all-or-nothing; không gửi/lưu lại toàn bộ matrix một cách mù quáng.
- Bắt buộc reason cho `DENY`, bulk revoke, thay đổi capability nhạy cảm và các thao tác có blast radius lớn.
- Preview tác động chỉ trả aggregate/count đã áp policy, không trả danh sách bệnh nhân hoặc PHI.
- Explain mode yêu cầu permission quản trị, được audit, không cấp bypass và không mutate dữ liệu.
- Legacy machine matrix tiếp tục dual-write qua service PR6; PR9 không drop `DoctorMachinePermission`.
- Có test server-side chống mass assignment, stale edit, privilege escalation, self-lockout và leakage.

## 2. Hiện trạng code và khoảng trống cần đóng

### 2.1. Nền tảng đã có

- `dashboard/prisma/schema.prisma` đã có `AccessScopeGrant`, quan hệ user/role profile/facility/machine, validity, effect, reason và actor IDs.
- `dashboard/lib/authz/scope/capability-registry.ts` đã có registry capability, mapping global permission và nhãn tiếng Việt.
- `dashboard/lib/authz/scope/organization-tree.ts`, resolver, grant repository và request context đã có logic cây/precedence.
- `/admin/facilities` đã có tree/machine mapping/data-quality actions; PR9 phải tái sử dụng contract/tree thay vì dựng cây tổ chức thứ hai.
- `/admin/permissions/matrix` hiện chỉ là ma trận user × DICOM node × machine action; chỉ đọc `DoctorMachinePermission`.
- `saveMatrixAction` hiện gọi `dualWriteMachinePermission` trong transaction và audit `UPDATE_MACHINE_PERMISSIONS`; đây là compatibility tab cần được bảo toàn.

### 2.2. Khoảng trống

- Chưa quản lý grant theo facility subtree hoặc role profile.
- Chưa phân biệt direct/inherited/effective state trong UI.
- Chưa hỗ trợ validity window, `includeDescendants`, reason và actor metadata qua admin workflow chính thức.
- Chưa có diff contract/version guard nên có nguy cơ stale admin ghi đè thay đổi của admin khác.
- Chưa có preview count/blast radius an toàn.
- Chưa có explain endpoint/UI cho global → resource context → grants → final reason.
- Chưa có audit action chuẩn `SCOPE_GRANT_CREATED/UPDATED/REVOKED/BULK_CHANGED`.
- `AccessScopeGrant.createdByUserId/updatedByUserId` hiện là scalar; không cần đổi relation/schema chỉ để làm PR9 nếu query hiện tại đủ.

## 3. Nguyên tắc bắt buộc

1. Mọi server action của PR9 yêu cầu `admin.permissions`; không tin trạng thái disabled/hidden ở client.
2. Client chỉ gửi intent/diff bằng ID kỹ thuật. Server tự load lại principal, scope, capability, grant hiện tại và global permissions.
3. Không chấp nhận capability ngoài `SCOPE_CAPABILITIES`, effect ngoài `ALLOW|DENY`, hoặc target không thỏa XOR principal/scope.
4. User/role profile, facility/machine phải tồn tại và active tại thời điểm ghi.
5. Machine grant luôn `includeDescendants=false`; facility grant tuân thủ taxonomy và option descendants.
6. `validUntil > validFrom`; normalize ngày theo UTC và không suy diễn timezone từ browser.
7. `DENY` thắng mọi `ALLOW`; UI không được mô tả child allow là override được parent deny.
8. Global permission là điều kiện độc lập. Scope grant không được tự thêm permission global cho principal.
9. Explain mode chỉ giải thích resolver hiện tại; không phải một đường bypass và không sửa grant/resource.
10. Preview/count không được tiết lộ tên bệnh nhân, accession, report, danh sách technical IDs hoặc node ngoài quyền quản trị phù hợp.
11. Save phải transaction all-or-nothing, audit trong cùng transaction và có optimistic concurrency/stale-edit guard.
12. Không ghi full tree/full matrix/full permissions payload vào audit; chỉ lưu summary/diff đã scrub.
13. Không đổi `AUTHORIZATION_MODE`, không bật `ENFORCE` và không tạo control mode cho admin thường trong PR9.
14. Không tự tạo wildcard capability hoặc global/root grant ngoài intent explicit đã xác nhận.
15. Không dùng UI mới để ghi trực tiếp `DoctorMachinePermission`; compatibility tab tiếp tục đi qua dual-write service.

## 4. Ranh giới permission và trust

| Path | Actor | Permission | Dữ liệu trả về | Ghi chú |
| --- | --- | --- | --- | --- |
| Scope matrix list/read | admin tương tác | `admin.permissions` | principal metadata, tree, grant/effective summaries | Không PHI |
| Scope diff preview | admin tương tác | `admin.permissions` | aggregate count/blast radius | Không row list |
| Scope diff save | admin tương tác | `admin.permissions` | result/version/audit reference tối thiểu | Revalidate toàn bộ |
| Explain decision | admin tương tác | `admin.permissions` | global result, resource path, scrubbed grant sources, reason | Có audit read-sensitive |
| Legacy machine matrix | admin tương tác | `admin.permissions` | legacy states | Dual-write giữ nguyên |
| Resolver runtime | user/request runtime | permission của nghiệp vụ | decision nội bộ | Không phụ thuộc PR9 UI |
| Backfill/shadow scripts | operator/background | deployment/CLI boundary | aggregate logs | Không đưa vào web action |

Nếu sản phẩm muốn tách `admin.permissions.explain` hoặc `admin.permissions.write`, phải làm additive permission contract và migration profile rõ ràng; không tự đổi semantics trong PR9. Baseline an toàn của PR9 dùng `admin.permissions` hiện hữu cho cả read/write/explain.

## 5. Kiến trúc đề xuất

### 5.1. Cấu trúc file

```text
dashboard/lib/authz/scope/admin/
  grant-admin-types.ts
  grant-admin-validation.ts
  grant-admin-query.ts
  grant-admin-diff.ts
  grant-impact-preview.ts
  scope-explain.ts
  scope-admin-audit.ts

dashboard/app/admin/permissions/matrix/
  actions.ts                         # boundary mỏng hoặc tách actions theo tab
  page.tsx
  components/
    PermissionTabs.tsx
    PrincipalSelector.tsx
    GlobalPermissionSummary.tsx
    CapabilitySelector.tsx
    ScopeGrantTree.tsx
    ScopeGrantCell.tsx
    GrantEditor.tsx
    GrantDiffReviewDialog.tsx
    GrantImpactPreview.tsx
    ScopeExplainPanel.tsx
    LegacyMachineMatrix.tsx
```

Tên có thể điều chỉnh theo convention hiện tại, nhưng query/validation/diff/explain phải nằm ở server module dùng chung; không nhét policy vào component React hoặc một `actions.ts` khổng lồ.

### 5.2. Contract principal

```ts
type ScopePrincipalRef =
  | { type: "USER"; id: string }
  | { type: "ROLE_PROFILE"; id: string };

type ScopePrincipalSummary = {
  type: "USER" | "ROLE_PROFILE";
  id: string;
  displayName: string;
  active: boolean;
  baseRole: string;
  roleProfileId?: string | null;
  globalPermissions: string[];
};
```

Với user, global permissions phải được load bằng cùng contract auth hiện tại, bao gồm role profile nếu hệ thống đang dùng profile override. Với role profile, hiển thị permissions của profile. Không nhận `globalPermissions` từ client khi preview/save.

### 5.3. Contract scope và grant

```ts
type ScopeTargetRef =
  | { type: "FACILITY_UNIT"; id: string }
  | { type: "DICOM_NODE"; id: string };

type GrantMutationIntent = {
  operation: "CREATE" | "UPDATE" | "REVOKE";
  grantId?: string;
  principal: ScopePrincipalRef;
  scope: ScopeTargetRef;
  capability: ScopeCapability;
  effect?: "ALLOW" | "DENY";
  includeDescendants?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  reason?: string | null;
  expectedUpdatedAt?: string | null;
};

type ScopeGrantDiffRequest = {
  principal: ScopePrincipalRef;
  operations: GrantMutationIntent[];
  clientSnapshotVersion: string;
  confirmationReason?: string;
};
```

`grantId` chỉ là locator. Server phải xác minh grant đó đúng principal/scope/capability trong intent; không cho đổi owner/scope bằng cách gửi ID của grant khác. Với create/update, server normalize fields và dựa vào constraints/transaction để ngăn duplicate.

### 5.4. Snapshot/version guard

Không cần schema version mới nếu có thể tạo deterministic snapshot token từ tập grant hiện tại, ví dụ hash server-side của:

```text
grant.id + updatedAt + effect + includeDescendants + validFrom + validUntil
```

Token không chứa raw grant data và không dùng làm authorization. Khi save:

1. Lock/load grants hiện tại trong transaction.
2. Tính lại token.
3. Nếu khác `clientSnapshotVersion`, trả typed conflict `SCOPE_GRANT_STALE_EDIT` và yêu cầu reload/review diff.
4. Không tự merge mù các cell chồng lấn.

Nếu Prisma/DB hiện tại không cho row lock thuận tiện, dùng transaction isolation phù hợp và conditional `updateMany` theo `id + updatedAt`; mọi operation phải đạt expected count, nếu không rollback toàn batch.

## 6. Mô hình trạng thái UI

Mỗi node/capability cần thể hiện riêng:

- `DIRECT_ALLOW`: có ALLOW trực tiếp tại node/machine.
- `DIRECT_DENY`: có DENY trực tiếp.
- `INHERITED_ALLOW`: được ALLOW từ ancestor với `includeDescendants=true`.
- `INHERITED_DENY`: bị DENY từ ancestor; luôn thắng child allow.
- `NO_SCOPE_GRANT`: không có opinion áp dụng.
- `GLOBAL_MISSING`: có thể có scope grant nhưng principal thiếu global permission.
- `INACTIVE_SCOPE`: scope inactive; không cho tạo grant mới.
- `EXPIRED`/`SCHEDULED`: grant có validity ngoài thời điểm hiện tại.
- `EFFECTIVE_ALLOW`/`EFFECTIVE_DENY`: kết quả cuối ở thời điểm preview, không đồng nghĩa workflow cho phép mutation cụ thể.

UI phải phân biệt:

```text
Direct state       = record lưu ngay tại node/capability
Inherited state    = opinion từ ancestor/user/role liên quan
Scope effective    = deny-wins + validity + active state
Final usable       = global permission ∧ scope effective
```

Không hiển thị `DEFAULT = kế thừa System Role` như legacy tab cho scope tab mới, vì “không grant” trong `ENFORCE` là deny chứ không phải mặc định allow. Nhãn phù hợp: `Chưa cấp`, `Cho phép`, `Chặn`, `Kế thừa cho phép`, `Kế thừa chặn`.

## 7. Query và hiệu năng

### 7.1. Initial load

Một request principal/capability nên load batch:

- Principal summary và global permissions.
- Toàn bộ active facility metadata cần dựng cây; inactive node chỉ khi filter bật hoặc grant đang tham chiếu.
- DICOM nodes và facility binding.
- Tất cả grants của principal cho capability đang chọn, hoặc tất cả capabilities nếu kích thước được benchmark chấp nhận.
- Role-profile grants áp dụng cho user để giải thích inherited source.

Không query grant theo từng node/cell. Dựng effective matrix bằng pure evaluator từ batch data.

### 7.2. Response tối thiểu

```ts
type ScopeGrantMatrixResponse = {
  principal: ScopePrincipalSummary;
  capabilities: Array<{
    key: ScopeCapability;
    label: string;
    globalPermission: string;
    globalAllowed: boolean;
  }>;
  tree: ScopeAdminTreeNode[];
  grants: ScopeGrantAdminView[];
  snapshotVersion: string;
};
```

Không trả matched grant IDs không liên quan. ID direct grant cần cho edit/revoke có thể trả vì endpoint chỉ dành cho admin; vẫn không log hoặc đưa vào error client thường.

### 7.3. Performance gate

- Số Prisma queries không tăng tuyến tính theo số node × capability.
- Test cây 500–1.000 node, hàng nghìn grants và một principal có cả user + role grants.
- Expand/collapse/filter client không gọi lại server theo từng node.
- Preview nhiều operations phải batch count/query, không lặp count per operation nếu có thể hợp nhất scope.

## 8. Diff save và validation

Pipeline bắt buộc:

```text
require admin.permissions
  → parse schema/size limits
  → load actor + target principal server-side
  → validate active principal
  → load scopes/capabilities referenced theo batch
  → validate XOR, taxonomy, active state, validity, reason
  → load current grants + verify ownership/snapshot
  → simulate effective diff + protected-admin checks
  → transaction create/update/revoke
  → audit summary trong transaction
  → return new snapshot/version
```

### 8.1. Validation bắt buộc

- Giới hạn số operation/request; bulk lớn phải chunk ở workflow có preview, nhưng mỗi submitted batch vẫn atomic.
- Reject duplicate intent cùng principal/scope/capability trong một request.
- Reject create nếu equivalent direct grant đã tồn tại; hướng client sang update.
- Reject update/revoke nếu grant không thuộc principal đang edit.
- Reject free-form capability/effect/target type.
- Reason trim, giới hạn độ dài, không lưu empty string.
- `DENY` luôn cần reason. Bulk revoke và capability nhạy cảm (`SIGN_REPORT`, `APPROVE_REPORT`, `UNFINALIZE_REPORT`, `DELIVER_RESULT`, `SYNC_HIS`, export/share nếu registry mở rộng) cần reason theo policy.
- Không cho `includeDescendants=true` ở DICOM node.
- Không cho grant vào inactive facility/node hoặc inactive principal.
- Cho phép revoke grant đang tham chiếu inactive scope để dọn dữ liệu, nhưng phải hiển thị rõ và audit.

### 8.2. Protected admin/self-lockout

PR9 không được làm một rule giả rằng admin luôn bypass global permission. Cần tối thiểu:

- Cảnh báo và confirmation reason khi actor sửa grant của chính mình.
- Không cho UI khẳng định scope grant có thể cấp `admin.permissions`; đây là global permission ngoài model.
- Nếu có policy “protected System Admin” hiện hữu, gọi đúng helper hiện tại; không invent role-name check rời rạc.
- Preview phải chỉ rõ thay đổi có thể làm principal mất toàn bộ `READ_STUDY` scope.
- Không tự tạo root allow để cứu self-lockout.

## 9. Preview tác động

### 9.1. Mục tiêu

Preview trả lời trước khi save:

- Bao nhiêu direct grants create/update/revoke.
- Capability nào bị ảnh hưởng.
- Bao nhiêu facility/machine nodes đổi effective state.
- Ước lượng/count study/order hiện accessible trước/sau đối với capability đọc khi query an toàn.
- Có explicit deny mới, mất toàn bộ read scope, inactive/scheduled/expired grant hay không.

### 9.2. Contract an toàn

```ts
type ScopeGrantImpactPreview = {
  operationCounts: { create: number; update: number; revoke: number };
  affectedCapabilityCount: number;
  affectedFacilityCount: number;
  affectedMachineCount: number;
  warnings: ScopeGrantWarningCode[];
  resourceImpact?: {
    capability: "READ_STUDY" | "READ_REPORT";
    beforeCount: number;
    afterCount: number;
    delta: number;
    exact: boolean;
  }[];
  previewToken: string;
};
```

Preview token phải gắn với actor, principal, canonical diff và current snapshot, có TTL ngắn hoặc signature server-side. Save revalidate tất cả; preview token không thay authorization và không đảm bảo commit nếu state đã đổi.

### 9.3. Không leakage

- Chỉ aggregate counts, không row IDs/names/accession.
- Có thể bucket/cap count nếu policy analytics yêu cầu.
- Không cho preview arbitrary user/resource nếu actor thiếu `admin.permissions`.
- Không dùng filter client để query PHI rộng.
- Audit preview chỉ summary khi cần; không tạo audit mỗi node.

## 10. Explain mode

### 10.1. Input

Admin chọn:

- Principal user (role profile có thể được giải thích ở matrix, nhưng runtime explain ưu tiên user cụ thể).
- Capability.
- Resource type `STUDY | ORDER | NON_DICOM`.
- Technical identifier tương ứng.

Không hỗ trợ tìm bằng patient name/accession trong PR9 nếu chưa có search contract scope-safe. Input technical ID không được echo vào generic error ngoài admin boundary.

### 10.2. Pipeline

```text
require admin.permissions
  → load principal server-side
  → resolve resource server-side
  → evaluate global permission
  → resolve classified/active resource path
  → evaluate user + role + legacy grants bằng resolver hiện hữu
  → scrub trace
  → audit explain access
  → return explanation
```

### 10.3. Response

```ts
type ScopeExplainResponse = {
  principal: { type: "USER"; id: string; displayName: string };
  capability: ScopeCapability;
  globalPermission: { key: string; allowed: boolean };
  resource: {
    type: "STUDY" | "ORDER" | "NON_DICOM";
    technicalId: string;
    classified: boolean;
    active: boolean;
    organizationPath: Array<{ id: string; name: string; type: string }>;
    machine?: { id: string; name: string } | null;
  };
  applicableOpinions: Array<{
    source: "USER" | "ROLE_PROFILE" | "LEGACY";
    effect: "ALLOW" | "DENY";
    scopeLabel: string;
    matchType: "DIRECT" | "INHERITED" | "LEGACY_MACHINE";
    validity: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE_SCOPE";
  }>;
  decision: {
    baselineAllowed: boolean;
    proposedAllowed: boolean;
    effectiveAllowed: boolean;
    mode: string;
    reasonCode: string;
  };
};
```

Không trả patient demographics, report content, raw AE trace, reason text nhạy cảm hoặc `matchedGrantIds` nếu không cần. Organization labels là config metadata dành cho admin. Nếu resource không tồn tại, trả lỗi admin-safe; audit lookup thất bại mà không log PHI.

### 10.4. Explain không phải simulation mutation

Explain chỉ cho scope/global hiện tại. Workflow/status/ownership có thể được hiển thị là `không đánh giá` trừ khi gọi đúng policy read-only hiện hữu. Không được tuyên bố mutation chắc chắn thành công chỉ vì scope allow.

## 11. Audit

Action chuẩn:

```text
SCOPE_GRANT_CREATED
SCOPE_GRANT_UPDATED
SCOPE_GRANT_REVOKED
SCOPE_GRANT_BULK_CHANGED
SCOPE_DECISION_EXPLAINED
SCOPE_GRANT_IMPACT_PREVIEWED   # optional/metric nếu volume cao
```

Metadata tối thiểu:

- Actor user ID.
- Principal type/technical ID.
- Scope type/technical ID.
- Capability/effect.
- Before/after summary hoặc aggregate operation counts.
- Reason khi bắt buộc.
- Correlation/request ID nếu hạ tầng có.
- Result và timestamp.

Không audit:

- Patient name/ID/DOB/accession.
- Report/consultation content.
- Full tree/full grant matrix.
- Raw request body.
- Token/signature/secret.
- Full list study IDs từ preview.

Không dùng `console.error(error)` nếu error có thể chứa Prisma args/raw payload; log code + scrubbed context.

## 12. UX và accessibility

### 12.1. Tab `Phạm vi tổ chức`

- Principal selector có nhóm `Người dùng` và `Hồ sơ vai trò`; search theo tên/code.
- Summary global permissions read-only để giải thích vì sao scope allow vẫn chưa usable.
- Capability selector có nhãn tiếng Việt từ registry và global permission tương ứng.
- Tree hiển thị facility hierarchy, machine leaves, active/inactive và direct/inherited badges.
- Chọn node mở editor effect, descendants, validity và reason; không ép render matrix hàng nghìn cột.
- Có filter `Chỉ hiện grant trực tiếp`, `Có hiệu lực`, `Đã hết hạn`, `Có chặn`.
- Có review diff cố định trước save và cảnh báo stale state.

### 12.2. Tab legacy

- Tái sử dụng UI machine matrix hiện tại dưới component riêng.
- Gắn nhãn rõ `Tương thích quyền chi tiết theo máy`.
- Không gọi `DEFAULT` là scope allow; giải thích đây là trạng thái legacy và runtime còn phụ thuộc mode/resolver.
- Giữ dual-write và test drift; không thêm facility grants qua legacy grid.

### 12.3. Accessibility

- Tree hỗ trợ keyboard/focus/aria-expanded và không chỉ dùng màu cho ALLOW/DENY.
- Dialog review/confirm trap focus, có title/description và nút hủy rõ.
- Không dùng bảng ngang khổng lồ làm interaction duy nhất.
- Loading/error/empty/conflict states rõ ràng; không mất unsaved diff khi preview lỗi.

## 13. Trình tự triển khai

### Bước 1 — Contract và inventory khóa phạm vi

- Inventory schema constraints/migrations hiện hữu, permission helper, role-profile semantics và audit convention.
- Chốt capability nào được quản trị trong PR9; mặc định dùng toàn bộ `SCOPE_CAPABILITIES` đã có.
- Chốt preview count nào có thể tính chính xác bằng scope filter hiện hữu; phần chưa an toàn trả warning, không fail-open.

### Bước 2 — Server query + pure effective-state builder

- Tạo principal/tree/grant batch query.
- Tạo pure model direct/inherited/effective/global-missing.
- Unit test deny-wins, role + user, validity, descendants và inactive scopes.

### Bước 3 — Validation + transactional diff service

- Tạo typed input/output/error, stale snapshot guard và size limits.
- Implement create/update/revoke atomic cùng audit.
- Test forged grant ID, cross-principal update, duplicate intent, stale edit và rollback.

### Bước 4 — Scope grant UI

- Tách legacy matrix thành tab/component mà không đổi behavior.
- Thêm principal selector, capability summary, tree, editor và diff review.
- Không redesign các admin page khác.

### Bước 5 — Preview

- Simulate diff trên server.
- Tính tree/node impacts batch; resource counts chỉ dùng accessible filter/query đã review.
- Thêm warning/confirmation reason và preview token/revalidation.

### Bước 6 — Explain mode

- Tái sử dụng resolver/resource context hiện hữu.
- Scrub trace và audit lookup.
- Thêm panel admin riêng, không đưa explain internals vào API client thường.

### Bước 7 — Security/performance regression và evidence

- Test direct action call, mass assignment, stale admin, concurrent save, self-edit, inactive principal/scope và audit scrub.
- Test no N+1 trên tree/grant/effective state.
- Chạy verification gate; không bật `ENFORCE`.

## 14. Test matrix tối thiểu

1. User và role profile active xuất hiện; inactive bị loại khỏi create target.
2. Principal global permission summary được tính server-side, không tin client.
3. Facility direct ALLOW với descendants hiển thị inherited ALLOW ở child/machine.
4. Parent DENY + child ALLOW vẫn effective DENY.
5. Role ALLOW + user DENY vẫn effective DENY.
6. Grant scheduled/expired/inactive không được trình bày là active allow.
7. Machine target buộc `includeDescendants=false`.
8. Không grant hiển thị `Chưa cấp`, không mô tả như baseline allow trong ENFORCE.
9. Scope allow nhưng thiếu global permission hiển thị `GLOBAL_MISSING`.
10. Save valid diff tạo/update/revoke đúng row và audit trong cùng transaction.
11. Một operation invalid làm rollback toàn batch.
12. Forged grant ID của principal khác bị từ chối.
13. Duplicate operation/capability ngoài registry/effect sai bị từ chối.
14. Stale snapshot/concurrent edit trả conflict, không overwrite.
15. DENY/bulk revoke/sensitive capability thiếu reason bị từ chối.
16. Preview không trả PHI hoặc resource ID list; before/after count khớp test fixture.
17. Save sau preview vẫn revalidate; preview stale không bypass.
18. Explain trả global/resource path/opinions/reason đúng deny-wins.
19. Explain không mutate và được audit; user thiếu admin permission bị deny.
20. Legacy tab vẫn dual-write và drift test pass.
21. Query grants/tree không tăng theo số cell/node.
22. Audit/error/log không chứa patient fields, full payload hoặc grant trace thừa.
23. `OFF`/`SHADOW`/`ENFORCE` được hiển thị đúng trong explain nhưng PR9 không thay mode.
24. Admin scope change không tự cấp global permission hoặc bypass workflow.

## 15. Guardrails và ngoài phạm vi

- Không bật `AUTHORIZATION_MODE=ENFORCE` mặc định.
- Không làm PR10 UAT/pilot/rollout production.
- Không drop `DoctorMachinePermission`, compatibility adapter hoặc dual-write.
- Không redesign `/admin/facilities`; chỉ tái sử dụng tree/machine data contract.
- Không thay workflow/report/HIS/share/export/viewer semantics.
- Không sửa resolver precedence chỉ để UI dễ hiển thị; nếu phát hiện bug resolver, ghi blocker hoặc tách fix có test.
- Không thêm wildcard capability, root grant tự động hoặc fallback allow.
- Không cho admin sửa global role permissions ngay trong scope matrix.
- Không tạo patient/resource search rộng trong explain nếu chưa có scope-safe contract.
- Không trả PHI trong preview/explain/audit.
- Không hard-delete grant history ngoài policy; revoke hiện tại có thể delete row nếu schema/service baseline dùng vậy, nhưng audit before-state bắt buộc. Nếu cần soft revoke/schema mới, tách migration review riêng.
- Không thêm package hoặc sửa package/lockfile nếu không thật sự cần và chưa được phê duyệt.
- Không commit/push nếu người dùng không yêu cầu.
- Bảo toàn toàn bộ thay đổi PR6/PR7/PR8 và thay đổi hạ tầng chưa commit trong worktree.

## 16. Acceptance criteria

- [ ] `/admin/permissions/matrix` có scope tab và legacy compatibility tab.
- [ ] User/role-profile selector, global permission summary và capability registry dùng dữ liệu server-side.
- [ ] Tree hiển thị đúng direct/inherited/effective/global-missing/validity state.
- [ ] Grant diff được validate và lưu atomic; có stale-edit guard.
- [ ] DENY/bulk/sensitive changes yêu cầu reason theo policy.
- [ ] Preview trả aggregate impact không PHI và save luôn re-check.
- [ ] Explain mode dùng resolver hiện hữu, có audit và không bypass/mutate.
- [ ] Server actions chống forged ID, mass assignment và cross-principal edits.
- [ ] Audit create/update/revoke/bulk/explain đã scrub.
- [ ] Legacy matrix dual-write tiếp tục hoạt động, không drift do PR9.
- [ ] Không N+1 theo node/cell/capability.
- [ ] Không đổi default authorization mode hoặc workflow semantics.
- [ ] Typecheck, tests, Prisma validation, build và diff-check pass.

## 17. Verification gate

Chạy bằng shell phù hợp trên Windows; không dùng `&&` trực tiếp trong Windows PowerShell cũ.

```powershell
Set-Location C:\Antigravity\Minipacs-v.2\dashboard
npx tsc --noEmit
npm test
npx prisma validate
npm run build
Set-Location ..
git diff --check
```

Nếu chạy qua `cmd.exe`:

```bat
cmd /c "cd /d C:\Antigravity\Minipacs-v.2\dashboard && npx tsc --noEmit && npm test && npx prisma validate && npm run build"
cmd /c "cd /d C:\Antigravity\Minipacs-v.2 && git diff --check"
```

## 18. Prompt bàn giao cho AI triển khai PR9

Sao chép nguyên khối prompt dưới đây:

```text
Bạn đang làm việc trong repository MiniPACS tại C:\Antigravity\Minipacs-v.2 trên Windows.

Nhiệm vụ: triển khai Phase 2 PR9 — Scope Grant Admin UI, preview và explain mode theo:
- docs/DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR6_LEGACY_MIGRATION_SHADOW_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR7_READ_PATH_ENFORCEMENT_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR8_MUTATION_ENFORCEMENT_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR9_SCOPE_GRANT_ADMIN_UI_PLAN.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md

Trước khi sửa code:
1. Đọc hết các tài liệu trên.
2. Chạy git status/diff read-only và bảo toàn mọi thay đổi PR6/PR7/PR8 cùng thay đổi hạ tầng chưa commit; không reset, checkout, clean, stash hoặc ghi đè file ngoài phạm vi.
3. Inventory schema/migrations/constraints của AccessScopeGrant, User, AppRoleProfile, FacilityUnit, DicomNode, DoctorMachinePermission và AuditLog.
4. Đọc kỹ dashboard/lib/authz/scope/*, dashboard/lib/authz/scope/migration/*, dashboard/app/admin/facilities/*, dashboard/app/admin/permissions/matrix/*, dashboard/lib/permissions.ts và dashboard/lib/authz.ts.
5. Xác nhận semantics global permissions của user/role profile và compatibility dual-write hiện tại trước khi thiết kế UI.

Mục tiêu bắt buộc:
1. Mở rộng /admin/permissions/matrix thành hai tab: Phạm vi tổ chức và Quyền chi tiết theo máy (legacy). Tách component để không biến page/actions thành file khổng lồ.
2. Principal selector hỗ trợ user và AppRoleProfile active; global permissions phải load server-side và chỉ hiển thị read-only.
3. Tái sử dụng cây FacilityUnit/DicomNode hiện hữu; không tạo hierarchy/policy thứ hai.
4. Dùng SCOPE_CAPABILITIES, CAPABILITY_TO_GLOBAL_PERMISSION và label registry; không nhận capability/effect/permission tự do từ client, không wildcard.
5. Hiển thị rõ direct grant, inherited allow/deny, validity, inactive scope, global missing và effective decision. DENY luôn thắng ALLOW; không mô tả child allow là override parent deny.
6. Không gọi trạng thái không grant là fallback allow. Trong ENFORCE, không grant là deny; legacy DEFAULT chỉ tồn tại trong compatibility tab.
7. Client gửi canonical diff/intents, không gửi full matrix để server tin. Server re-load principal/scopes/grants, validate XOR, active state, descendants, validity, reason và ownership của grantId.
8. Save transaction all-or-nothing với stale-edit/optimistic concurrency guard. Forged grant ID, cross-principal update, duplicate operation hoặc stale snapshot phải bị deny/rollback.
9. DENY, bulk revoke và capability nhạy cảm phải có reason theo policy; trim/limit reason và không audit raw request.
10. Audit SCOPE_GRANT_CREATED/UPDATED/REVOKED/BULK_CHANGED trong cùng transaction với before/after summary đã scrub.
11. Tạo preview impact server-side: operation counts, affected facility/machine/capability và before/after resource counts khi có thể tính an toàn. Chỉ trả aggregate, không PHI, không list study IDs.
12. Preview token không phải authorization; save luôn revalidate actor, snapshot và diff.
13. Tạo explain mode có admin.permissions: principal user + capability + technical resource ID; dùng resolver/resource context hiện hữu, trả global result, organization path, scrubbed applicable opinions, mode/reason. Explain phải audit, không mutate và không bypass.
14. Không trả patient demographics/report text/raw HIS payload/raw trace/matchedGrantIds không cần thiết trong preview, explain, error hoặc audit.
15. Batch load tree/grants/principal; không query theo từng node/cell/capability. Viết query-count/performance test cho cây lớn.
16. Giữ legacy machine matrix chạy qua dualWriteMachinePermission và giữ drift tests; không ghi trực tiếp hai bảng từ UI mới.
17. Viết unit/integration/security tests cho deny-wins, role+user, validity, descendants, inactive scope/principal, global missing, stale edit, concurrent save, forged ID, rollback atomic, preview leakage, explain authorization/audit và no N+1.

Luật server-side:
- Mọi action PR9 yêu cầu admin.permissions.
- Scope grant không tự cấp global permission.
- Chính xác một principal (user XOR role profile) và một scope (facility XOR machine).
- Machine grant luôn includeDescendants=false.
- validUntil > validFrom; normalize UTC.
- Resource/principal/scope inactive không được nhận grant mới; cho phép revoke grant cũ inactive với audit.
- Bất kỳ applicable DENY nào thắng mọi ALLOW.
- Explain chỉ giải thích scope/global; không tuyên bố workflow mutation chắc chắn allow.
- OFF/SHADOW/ENFORCE có thể được hiển thị trong explain nhưng PR9 không được đổi mode.

Guardrails:
- Không bật ENFORCE mặc định và không làm PR10 rollout/UAT.
- Không drop DoctorMachinePermission hoặc compatibility adapter.
- Không đổi resolver precedence/workflow/report/HIS/viewer semantics để làm UI/test pass.
- Không tạo root/wildcard grant hoặc fallback allow.
- Không cho sửa global permissions ngay trong scope matrix.
- Không redesign admin facilities hoặc UI ngoài phạm vi PR9.
- Không thêm patient search rộng cho explain nếu chưa có contract scope-safe.
- Không thêm package hoặc sửa package.json/lockfile nếu chưa thật sự cần và chưa được phê duyệt.
- Không commit/push trừ khi người dùng yêu cầu.

Thứ tự làm:
inventory + contract
→ server batch query + pure effective-state model/tests
→ validation + transactional diff + stale guard/tests
→ scope grant UI + legacy tab extraction
→ aggregate preview/tests
→ explain mode/audit/tests
→ security/performance regression + evidence

Sau mỗi lát cắt, chạy test mục tiêu. Cuối cùng chạy bằng PowerShell:
Set-Location C:\Antigravity\Minipacs-v.2\dashboard
npx tsc --noEmit
npm test
npx prisma validate
npm run build
Set-Location ..
git diff --check

Không dùng chuỗi lệnh với && trực tiếp trong Windows PowerShell cũ. Nếu dùng cmd.exe, bọc bằng cmd /c.

Khi bàn giao:
- Liệt kê file/path và server actions đã thêm/thay đổi.
- Báo contract principal/scope/diff/snapshot và các validation chống privilege escalation.
- Báo cách tính direct/inherited/effective/global-missing và deny-wins.
- Báo preview fields, leakage controls và evidence before/after count.
- Báo explain output/audit/scrubbing và khẳng định không mutate/bypass.
- Báo legacy dual-write/drift evidence và no-N+1 query evidence.
- Báo kết quả typecheck/test/Prisma/build/diff-check, không che lỗi có sẵn.
- Không tuyên bố PR9 hoàn tất nếu save còn overwrite stale, preview/explain leak PHI, hoặc matrix còn N+1.

Bắt đầu bằng inventory read-only và kế hoạch lát cắt cụ thể; sau đó mới sửa code.
```