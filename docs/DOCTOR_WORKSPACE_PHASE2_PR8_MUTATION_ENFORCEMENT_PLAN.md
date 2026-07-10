# PR8 — Mutation Enforcement và Batch `allowedActions`

Ngày lập: 2026-07-11  
Thuộc Phase 2: [DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md](./DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md)  
Tiền đề trực tiếp: [DOCTOR_WORKSPACE_PHASE2_PR7_READ_PATH_ENFORCEMENT_PLAN.md](./DOCTOR_WORKSPACE_PHASE2_PR7_READ_PATH_ENFORCEMENT_PLAN.md)  
Trạng thái: Kế hoạch triển khai tiếp theo; chưa mặc định bật `ENFORCE`

## 1. Mục tiêu

PR8 đưa authorization theo phạm vi vào mọi mutation tương tác có thể thay đổi ca chụp, order, report, HIS, hội chẩn, chia sẻ, export và artifact viewer. Quyết định phải được tính lại ở server ngay trước mutation; dữ liệu `allowedActions` từ client chỉ phục vụ UX và tuyệt đối không phải bằng chứng cấp quyền.

Kết quả cần đạt:

- Một helper mutation dùng chung kết hợp authentication, global permission, `READ_STUDY` và capability chuyên biệt.
- `OFF`/`SHADOW` giữ hành vi baseline; `ENFORCE` chặn resource ngoài scope, unclassified, inactive hoặc AE Title mơ hồ.
- Workflow/status validation tiếp tục chạy độc lập sau authorization; PR8 không đổi lifecycle nghiệp vụ.
- Các response worklist/detail có thể nhận `allowedActions` được tính batch, không N+1.
- Mutation bị deny trả lỗi chuẩn hóa, không tiết lộ PHI, grant ID, cây tổ chức hoặc việc resource có tồn tại.
- Có security regression test cho gọi action/API trực tiếp và stale client sau khi revoke grant.

## 2. Nguyên tắc bắt buộc

Pipeline cho mutation trên ca DICOM:

```text
authenticated actor
  → global permission của hành động
  → resolve resource từ DB bằng technical ID
  → READ_STUDY scope decision
  → capability chuyên biệt scope decision
  → workflow/status/ownership policy
  → transaction/re-check khi cần chống TOCTOU
  → mutation + audit
```

Quy tắc:

1. Không nhận `performingUnitId`, `stationAeTitle`, `dicomNodeId`, role hoặc permission từ client để ra quyết định.
2. Resource context phải lấy từ DB; ưu tiên snapshot `performingUnitId`, sau đó mới dùng mapping AE Title hiện hữu.
3. Mutation derivative luôn cần `READ_STUDY` cùng capability hành động. Ví dụ ký báo cáo cần cả `READ_STUDY` và `SIGN_REPORT`.
4. `DENY` ở bất kỳ scope áp dụng nào thắng `ALLOW`.
5. Không grant, unclassified, ambiguous hoặc inactive phải deny non-admin trong `ENFORCE`.
6. Admin bypass scope không được bỏ qua global permission hoặc workflow policy.
7. `OFF` và `SHADOW` không được gây khóa nhầm runtime; SHADOW ghi mismatch đã scrub/rate-limit.
8. Không gọi resolver sau khi đã ghi. Gate phải đứng trước mutation; với action cạnh tranh, kiểm tra trạng thái và ghi trong cùng transaction khi khả thi.
9. Không dùng helper legacy `canPerformMachineAction`/`requireMachinePerm` làm nguồn quyết định cuối cùng ở path đã migrate.
10. Public share token và HIS inbound system-to-system giữ trust boundary riêng; không áp principal scope của user tương tác cho request không có user principal.

## 3. Contract kỹ thuật đề xuất

### 3.1. Helper per-resource

Tạo module rõ trách nhiệm, ví dụ:

```text
dashboard/lib/authz/scope/require-scoped-access.ts
dashboard/lib/authz/scope/allowed-actions.ts
dashboard/lib/authz/scope/scoped-access-error.ts
```

API nội bộ tối thiểu:

```ts
requireScopedStudyMutation({
  userId,
  studyInstanceUid,
  capability,
  requestContext,
}): Promise<{ actor; study; resourceContext; decision }>

requireScopedOrderMutation({
  userId,
  orderId,
  capability,
  requestContext,
}): Promise<{ actor; order; resourceContext; decision }>

getAllowedActionsForStudies(
  userId,
  studies,
  requestContext,
): Promise<Record<string, AllowedStudyActions>>
```

`requireScopedStudyMutation` phải:

- Query study một lần với các field context tối thiểu.
- Dùng cùng `ScopeRequestContext` cho `READ_STUDY` và capability chuyên biệt.
- Không trả raw trace/grant IDs ra client.
- Ném lỗi typed nội bộ; boundary chuyển thành `404` generic hoặc response deny thống nhất.
- Không tự sửa workflow state.

### 3.2. `allowedActions`

Contract đề xuất:

```ts
type AllowedStudyActions = {
  readStudy: boolean;
  readReport: boolean;
  editClinical: boolean;
  assignCase: boolean;
  draftReport: boolean;
  signReport: boolean;
  approveReport: boolean;
  cancelDraft: boolean;
  unfinalizeReport: boolean;
  deliverResult: boolean;
  syncHis: boolean;
  createConsultation: boolean;
  share: boolean;
  export: boolean;
  editViewerArtifacts: boolean;
};
```

Các boolean cuối cùng là giao của global permission, scope decision và trạng thái workflow hiện tại. Với share/export/viewer artifact chưa có scope capability riêng, dùng global permission chuyên biệt cộng `READ_STUDY` scope; không tạo wildcard và không mặc định suy diễn từ `READ_STUDY` sang quyền ghi.

Batch evaluator phải load principal/grants/tree một lần cho mỗi request, resolve context theo batch và không query grant theo từng row. Nếu chưa thể batch an toàn cho một action, không đưa action đó vào response thay vì fail-open.

### 3.3. Lỗi và audit

- Direct mutation ngoài scope: response generic `Not found or access denied`; không phân biệt resource không tồn tại với bị deny ở client thường.
- Validation nghiệp vụ chỉ được trả sau khi authorization thành công, tránh dùng status để enumerate resource.
- Audit deny dùng technical resource ID đã scrub/hash khi policy yêu cầu, capability, route, mode và reason code; không log patient name, report text, raw HIS payload hoặc matched grant IDs.
- Không tạo audit row cho mỗi boolean trong batch `allowedActions`; dùng metric tổng hợp nếu cần.

## 4. Inventory và mapping mutation

### 4.1. Workflow ca và report — ưu tiên P0

Điểm chạm chính: `dashboard/lib/workflowService.ts`, wrappers trong `dashboard/app/actions.ts`.

| Mutation | Global permission | Scope bắt buộc |
| --- | --- | --- |
| assign doctor | `studies.assign` | `READ_STUDY` + `ASSIGN_CASE` |
| start reading / claim lock | permission hiện hữu của action | `READ_STUDY` + `DRAFT_REPORT` hoặc capability đã chốt trong registry |
| update clinical / indication | `studies.updateClinical` | `READ_STUDY` + `EDIT_CLINICAL` |
| save/update draft | `reports.write` | `READ_STUDY` + `DRAFT_REPORT` |
| sign/finalize | `reports.finalize` | `READ_STUDY` + `SIGN_REPORT` |
| approve | `reports.finalize` | `READ_STUDY` + `APPROVE_REPORT` |
| cancel draft | `reports.cancelDraft` | `READ_STUDY` + `CANCEL_DRAFT` |
| unfinalize | `reports.unfinalize` | `READ_STUDY` + `UNFINALIZE_REPORT` |
| deliver result | `archive.deliver` | `READ_STUDY` + `DELIVER_RESULT` |

Thay `requireMachinePerm` bằng helper scope chung theo từng lát cắt. Giữ nguyên lock, transition, reason requirement, addendum, HIS side effect và audit hiện hữu. Khi approve/sign tự gọi HIS, authorization cho hành động report không tự cấp quyền `SYNC_HIS`; cần chốt rõ đây là system side effect của workflow hay một mutation user `SYNC_HIS`, rồi test đúng contract hiện tại, không âm thầm đổi semantics.

### 4.2. HIS outbound và retry — P0

Điểm chạm: `dashboard/app/his/actions.ts` và service liên quan.

- `sendReportToHisAction(studyInstanceUid)`: `READ_STUDY` + `SYNC_HIS` trước khi gửi.
- `retryHisSyncAction(syncLogId)`: resolve log → study/order ở server, sau đó kiểm tra scope resource trước retry; không cấp quyền chỉ vì user biết `syncLogId`.
- `updateOrderFromHisAction(accessionNumber)`: nếu mutation gắn với order đã tồn tại, dùng order scope; nếu đây là system sync/import không có resource scope ổn định, giữ global `his.sync`, ghi rõ trust boundary và không tự đoán facility từ input free-text.
- `getHisSyncLogsAction` là read path follow-up: log theo study/order phải scope-filter hoặc chỉ trả log vận hành không chứa PHI theo permission quản trị riêng.
- Loại `checkHisMatrixPerm` khỏi path đã migrate; không duy trì hai quyết định song song.

HIS inbound routes có chữ ký/credential system-to-system là ngoài principal mutation enforcement, nhưng phải được inventory và ghi rõ lý do loại trừ.

### 4.3. Hội chẩn — P0/P1

Điểm chạm: `dashboard/app/consultations/actions.ts`.

- Tạo hội chẩn từ study: `READ_STUDY` + `CREATE_CONSULT` trước `createConsultation`.
- Update status, invite, participant status và message: trước ownership/participant policy, resolve consultation → study và yêu cầu `READ_STUDY`; global permission riêng của action vẫn giữ nguyên.
- Không để membership của consultation cấp ngược quyền đọc study ngoài scope.
- Action không gắn study phải được phân loại rõ hoặc từ chối; không chấp nhận resource context do client tự khai.

### 4.4. Share — P0

Điểm chạm: `dashboard/app/share/actions.ts`.

- Create share cho STUDY: global `share.create` + scoped `READ_STUDY`.
- Create share cho REPORT: global `share.create` + `READ_STUDY` + `READ_REPORT`, sau đó mới kiểm tra `FINAL`.
- List/revoke link: resolve ShareLink → study/report ở server và scope-check trước ownership/manage policy.
- Không trả “report tồn tại nhưng chưa FINAL” trước authorization.
- Public `/api/share/[token]/*` tiếp tục token boundary riêng; PR8 không biến guest thành user principal.

### 4.5. Export/download — P0

Điểm chạm: `dashboard/app/actions/export-actions.ts`, viewer download-job routes và worker.

- Export một study/series/report: global export permission + `READ_STUDY`; report thêm `READ_REPORT`.
- Bulk export: scope phải được đưa vào DB query trước khi tạo item list; không nhận `selectedItemsJson` hoặc filter client làm danh sách tin cậy.
- Worker phải dùng immutable authorized manifest/snapshot do server tạo, không query rộng lại bằng filter chưa scope.
- Cancel/get job giữ owner/manage policy; download token boundary vẫn kiểm tra expiry/ownership/token contract hiện hữu.
- Audit không lưu nguyên `filterJson`/`selectedItemsJson` nếu có thể chứa PHI; lưu summary đã scrub.

### 4.6. Viewer artifacts — P0

Inventory tối thiểu:

- `/api/viewer/studies/[uid]/snapshots`
- `/api/viewer/studies/[uid]/key-images`
- `/api/viewer/studies/[uid]/measurements` và `[id]`
- `/api/viewer/studies/[uid]/report-workspace/key-images`
- `/api/viewer/studies/[uid]/report-workspace/measurements`
- `/api/viewer/studies/[uid]/dicom-sr/export`
- `/api/viewer/studies/[uid]/series/[seriesUid]/actions`
- `/api/viewer/download-jobs`

Mọi POST/PATCH/DELETE phải resolve study theo route UID, xác minh artifact thực sự thuộc study đó, rồi yêu cầu global permission chuyên biệt hiện hữu cùng scoped `READ_STUDY`. Artifact đưa vào report cần thêm `DRAFT_REPORT`; DICOM SR/report export cần `READ_REPORT` và permission export phù hợp. Không cho phép đổi route UID để mutate artifact của study khác.

### 4.7. Worklist/order, statistics và archive mutations — P1

- Worklist check-in/cancel/regenerate/start-reading/create Non-DICOM phải resolve order/study và dùng order/study scope capability phù hợp.
- Archive print/deliver phải yêu cầu `READ_STUDY`; đọc/in report thêm `READ_REPORT`; deliver thêm `DELIVER_RESULT`.
- Statistics/Command Center drilldown mutations như assignment, QC, dose, critical result phải resolve study trước khi ghi. Capability chưa có trong registry phải được chốt rõ bằng permission hiện hữu + `READ_STUDY`, hoặc bổ sung capability cụ thể trong PR riêng; không dùng `READ_STUDY` một mình để cấp quyền ghi.
- Các mutation thuần cấu hình/preset không gắn resource lâm sàng tiếp tục dùng global permission và ownership hiện tại.

### 4.8. Non-DICOM — lát cắt riêng trong PR8 nếu đủ contract

Các route/action Non-DICOM dùng `facilityId` và capability `NON_DICOM_*` đã có. Áp helper tương đương theo exam; upload/finalize/delete media phải xác minh media thuộc exam trong route. Không trộn logic DICOM AE Title vào Non-DICOM và không fail-open khi `facilityId` thiếu trong `ENFORCE`.

## 5. Trình tự triển khai

### Bước 1 — Contract và inventory khóa phạm vi

- Lập bảng đầy đủ mutation route/action/service, resource key, global permission, capability, workflow policy và trust boundary.
- Phân loại `USER_INTERACTIVE`, `SYSTEM_TO_SYSTEM`, `BACKGROUND_WORKER`, `PUBLIC_TOKEN`.
- Chốt action nào cần capability mới; không tự thêm wildcard.

### Bước 2 — Helper + typed error + test thuần

- Tạo `requireScopedStudyMutation`, `requireScopedOrderMutation` và helper Non-DICOM nếu nằm trong lát cắt.
- Dùng `resolveScope` và cùng `ScopeRequestContext` cho prerequisite decisions.
- Test OFF/SHADOW/ENFORCE, deny-wins, missing global, unclassified, inactive, ambiguous và admin behavior.

### Bước 3 — Workflow/report P0

- Migrate `workflowService.ts` khỏi `requireMachinePerm` theo từng function.
- Gate trước lock/write/transition.
- Giữ nguyên workflow tests và bổ sung cross-hospital direct-call tests.

### Bước 4 — HIS, consultation, share, export

- Resolve indirect IDs (`syncLogId`, `consultationId`, `reportId`, `shareLinkId`, `exportJobId`) về study/order tại server.
- Bảo vệ bulk query/worker manifest.
- Ghi rõ exclusions system/public token.

### Bước 5 — Viewer artifacts và order mutations

- Tạo API helper dùng chung cho route handler để tránh copy policy.
- Xác minh parent-child ownership của measurement/key image/snapshot/series.
- Migrate worklist/archive/statistics mutations phù hợp.

### Bước 6 — Batch `allowedActions`

- Tính batch từ principal/grants/tree/context đã memoize.
- Kết hợp workflow state sau scope decision.
- Tích hợp vào response cần thiết nhưng không buộc redesign UI Phase 3–5.

### Bước 7 — Security regression và evidence

- Test direct calls, guessed UID/ID, stale UI, revoke giữa phiên và concurrent status change.
- Chạy verification gate; xuất coverage matrix path đã migrate/còn lại.
- Không bật `ENFORCE` mặc định trong PR8.

## 6. Test matrix tối thiểu

1. **OFF**: user có global permission giữ hành vi cũ; không bị chặn bởi thiếu scope grant.
2. **SHADOW**: mutation vẫn theo baseline, có mismatch scrubbed, không log PHI.
3. **ENFORCE allow**: Hospital A ALLOW thực thi action đúng capability trên study A.
4. **Cross-hospital deny**: cùng user gọi trực tiếp UID/ID study B bị deny trước workflow validation.
5. **Derivative prerequisite**: có `SIGN_REPORT` nhưng không có `READ_STUDY` vẫn deny.
6. **Capability separation**: có `READ_STUDY` không tự được draft/sign/share/export.
7. **Deny wins**: parent ALLOW + machine DENY chặn mutation tại machine.
8. **Unclassified/ambiguous/inactive**: non-admin deny trong ENFORCE.
9. **Admin**: chỉ bypass scope khi global permission tương ứng tồn tại; workflow vẫn chặn transition sai.
10. **Indirect ID**: sync log/share link/consultation/artifact của study B không vượt scope.
11. **Artifact binding**: artifact ID thuộc study A không mutate được qua route UID study B.
12. **Bulk export**: manifest chỉ chứa study accessible; count/itemCount không leak.
13. **Stale `allowedActions`**: revoke grant sau khi UI load làm server mutation deny.
14. **TOCTOU**: hai actor ký/duyệt đồng thời không vượt lock/status policy.
15. **Batch performance**: số query grant/tree không tăng tuyến tính theo số study.
16. **System boundaries**: HIS inbound/public token vẫn chạy theo credential/token policy riêng và không bị gắn nhầm session scope.

## 7. Guardrails và ngoài phạm vi

- Không đổi schema nếu helper hiện tại đủ; nếu cần capability/schema mới, tách migration additive và review riêng.
- Không đổi default `AUTHORIZATION_MODE=OFF`.
- Không drop `DoctorMachinePermission` hoặc compatibility adapter trong PR8.
- Không đổi workflow/status/HIS semantics để làm test pass.
- Không dựng Scope Grant Admin UI của PR9.
- Không redesign worklist, report workspace hoặc viewer.
- Không sửa public share token/HIS inbound thành user session flow.
- Không ghi real PHI, secret, raw DICOM hoặc raw payload vào fixture/audit.
- Không lọc bulk mutation/export ở memory sau khi đã tạo job hoặc paginate.
- Không chạm `package.json`/lockfile nếu không có nhu cầu đã được phê duyệt.
- Bảo toàn toàn bộ thay đổi PR6/PR7 chưa commit trong worktree.

## 8. Acceptance criteria

- [ ] Có inventory mutation đầy đủ với trust-boundary classification.
- [ ] Helper mutation chung dùng resolver mới và typed error.
- [ ] Workflow/report mutations yêu cầu `READ_STUDY` + capability chuyên biệt.
- [ ] HIS outbound/retry không còn dựa vào machine matrix trực tiếp ở path đã migrate.
- [ ] Consultation/share/export resolve resource server-side và scope-check trước policy/status detail.
- [ ] Viewer artifact routes xác minh artifact thuộc study và scope-check mọi POST/PATCH/DELETE.
- [ ] Worklist/archive/statistics mutation thuộc coverage đã migrate hoặc được ghi blocker rõ.
- [ ] Non-DICOM mutation không fail-open nếu được đưa vào PR8.
- [ ] `allowedActions` được tính batch, không N+1 và không được server tin ngược từ client.
- [ ] OFF/SHADOW baseline tests pass; ENFORCE leakage/security tests pass.
- [ ] Deny response/audit không chứa PHI hoặc grant internals.
- [ ] Không đổi workflow semantics và không bật ENFORCE mặc định.
- [ ] Typecheck, tests, Prisma validation, build và diff-check pass.

## 9. Verification gate

Chạy bằng shell phù hợp trên Windows; không dùng cú pháp `&&` trực tiếp trong Windows PowerShell cũ.

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

## 10. Prompt bàn giao cho AI triển khai PR8

Sao chép nguyên khối prompt dưới đây:

```text
Bạn đang làm việc trong repository MiniPACS tại C:\Antigravity\Minipacs-v.2 trên Windows.

Nhiệm vụ: triển khai Phase 2 PR8 — Mutation Enforcement và batch allowedActions theo:
- docs/DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR6_LEGACY_MIGRATION_SHADOW_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR7_READ_PATH_ENFORCEMENT_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR8_MUTATION_ENFORCEMENT_PLAN.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md

Trước khi sửa code:
1. Đọc hết các tài liệu trên.
2. Chạy git status/diff read-only và bảo toàn tất cả thay đổi PR6/PR7 chưa commit; không reset, checkout, clean, stash hoặc ghi đè file ngoài phạm vi.
3. Inventory mọi mutation server action/API/service liên quan study, order, report, HIS, consultation, share, export, viewer artifact và Non-DICOM.
4. Với mỗi path, ghi resource identifier, global permission, scope capability, workflow/ownership policy và trust boundary USER_INTERACTIVE/SYSTEM_TO_SYSTEM/BACKGROUND_WORKER/PUBLIC_TOKEN.
5. Đọc kỹ dashboard/lib/authz/scope/*, dashboard/lib/workflowService.ts, dashboard/app/actions.ts, dashboard/app/his/actions.ts, dashboard/app/consultations/actions.ts, dashboard/app/share/actions.ts, dashboard/app/actions/export-actions.ts và toàn bộ mutation route dưới dashboard/app/api/viewer.

Mục tiêu bắt buộc:
1. Tạo helper per-resource dùng chung cho mutation study/order (và Non-DICOM nếu nằm trong lát cắt), dựa trên resolveScope và ScopeRequestContext; không copy policy vào từng route.
2. Resource context phải lấy từ DB. Không tin performingUnitId, AE Title, machine ID, role, permission hoặc allowedActions do client gửi.
3. Mutation derivative phải yêu cầu scoped READ_STUDY cùng capability chuyên biệt; global permission và workflow/status policy vẫn bắt buộc.
4. Migrate workflowService khỏi requireMachinePerm/canPerformMachineAction ở các path đã chuyển: assign, clinical update, draft, sign, approve, cancel, unfinalize, deliver.
5. Giữ nguyên lock, transition, report lifecycle, reason requirement, addendum, HIS side effect và audit semantics hiện tại.
6. Migrate HIS outbound/retry: resolve syncLog/accession/study/order ở server; study send/retry cần READ_STUDY + SYNC_HIS. Ghi rõ HIS inbound system credential là boundary riêng.
7. Migrate consultation: create từ study cần READ_STUDY + CREATE_CONSULT; status/invite/message phải resolve consultation về study và không cho membership cấp ngược quyền study.
8. Migrate share: STUDY cần share permission + READ_STUDY; REPORT thêm READ_REPORT; list/revoke phải resolve link về resource trước ownership/manage policy. Public token boundary giữ riêng.
9. Migrate export/download: single resource phải scope-check; bulk export phải build authorized manifest tại DB/server, không tin selectedItemsJson/filterJson và không query rộng lại trong worker.
10. Migrate mọi viewer artifact POST/PATCH/DELETE: resolve study route UID, verify artifact belongs to study, yêu cầu global action permission + READ_STUDY; report artifact thêm DRAFT_REPORT/READ_REPORT phù hợp.
11. Migrate worklist/archive/statistics mutations thuộc coverage. Capability ghi chưa có phải được chốt cụ thể; không dùng READ_STUDY một mình để cấp quyền ghi.
12. Tạo batch getAllowedActionsForStudies: load principal/grants/tree một lần/request, không N+1; kết hợp global + scope + workflow state. Client chỉ dùng để render và server luôn re-check.
13. Tạo typed scoped-access error và boundary response generic; không tiết lộ resource existence, PHI, grant IDs hoặc tree internals.
14. Audit deny/mismatch phải scrub và rate-limit; không log patient name, report text, raw HIS payload, selected item PHI hoặc raw DICOM.
15. Viết unit/integration/security tests cho OFF, SHADOW, ENFORCE, deny-wins, missing global, missing READ_STUDY prerequisite, unclassified, ambiguous, inactive, admin-global rule, indirect ID, stale allowedActions và artifact binding.

Luật mode:
- OFF: giữ baseline behavior.
- SHADOW: giữ baseline behavior, chỉ ghi proposed mismatch đã scrub.
- ENFORCE: global permission AND READ_STUDY scope AND action capability scope AND workflow policy.
- Không grant, unclassified, ambiguous hoặc inactive phải deny non-admin trong ENFORCE.
- Bất kỳ applicable DENY nào thắng ALLOW.
- Admin chỉ bypass scope, không bypass global permission hoặc workflow.

Guardrails:
- Không bật ENFORCE mặc định.
- Không drop DoctorMachinePermission/legacy compatibility trong PR8.
- Không làm Scope Grant Admin UI PR9.
- Không redesign UI/worklist/viewer/report workspace.
- Không đổi workflow/status/HIS semantics để làm test pass.
- Không biến HIS inbound hoặc public share token thành user-session scope flow.
- Không fail-open và không lọc bulk sau pagination/job creation.
- Không thêm package hoặc sửa package.json/lockfile nếu chưa thật sự cần và chưa được người dùng phê duyệt.
- Không commit/push trừ khi người dùng yêu cầu.

Thứ tự làm:
inventory + coverage matrix
→ helper/typed error/tests
→ workflow/report P0
→ HIS/consultation/share/export
→ viewer artifact + worklist/archive/statistics mutations
→ batch allowedActions
→ security regression + evidence

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
- Liệt kê chính xác mutation paths đã migrate và path còn lại/blocker.
- Báo mapping global permission + READ_STUDY + capability cho từng nhóm.
- Báo exclusions system/public/background và lý do trust boundary.
- Báo bằng chứng OFF/SHADOW/ENFORCE, cross-hospital direct-call, stale allowedActions, indirect-ID và N+1 query tests.
- Báo kết quả typecheck/test/Prisma/build/diff-check, không che lỗi có sẵn.
- Không tuyên bố PR8 hoàn tất nếu còn mutation P0 vượt scope hoặc batch allowedActions có N+1/fail-open.

Bắt đầu bằng inventory read-only và một kế hoạch lát cắt cụ thể; sau đó mới sửa code.
```