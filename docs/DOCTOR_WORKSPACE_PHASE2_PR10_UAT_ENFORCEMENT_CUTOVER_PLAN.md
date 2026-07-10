# PR10 — UAT, Enforcement Cutover và đóng Phase 2

Ngày lập: 2026-07-11  
Thuộc Phase 2: [DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md](./DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md)  
Tiền đề: PR1–PR9 của Phase 2 hoàn tất; đặc biệt PR7 read paths, PR8 mutations và PR9 admin UI  
Trạng thái: Kế hoạch release gate; chưa mặc định bật `ENFORCE`

## 1. Mục tiêu và đầu ra

Đóng Phase 2 bằng bằng chứng rằng cùng một resolver bảo vệ list/count/detail/related/mutation; làm sạch mapping tổ chức; chạy `OFF → SHADOW → ENFORCE` có phê duyệt theo bệnh viện và rollback được.

Đầu ra bắt buộc:

- Báo cáo coverage tất cả read/mutation paths và owner của ngoại lệ còn lại.
- Báo cáo dữ liệu chưa phân loại, AE Title trùng/mơ hồ và grant drift.
- UAT matrix `role × facility × specialty × machine × capability` đã ký.
- Dashboard mismatch/deny/error/latency không chứa PHI.
- Runbook cutover, rollback, break-glass và evidence package.
- Legacy `DoctorMachinePermission` vẫn giữ read-only/dual-write trong cửa sổ rollback; không drop ở PR10.

## 2. Điều kiện vào và stop-ship

Chỉ bắt đầu pilot khi PR9 save/preview/explain chống stale edit và privilege escalation; migration idempotent; tất cả đường dữ liệu nhạy cảm có inventory. Stop-ship nếu có leak cross-hospital, unclassified fail-open, mutation chỉ tin `allowedActions`, mismatch chưa giải thích, audit chứa PHI, hoặc không rollback mode độc lập với deploy.

## 3. Workstreams

### 3.1. Data readiness

1. Snapshot taxonomy, active nodes, duplicate AE, study/order thiếu `performingUnitId`.
2. Preview backfill, review thủ công mapping mơ hồ, rồi chạy idempotent theo batch.
3. Recount sau backfill; không dùng free-text guess để đạt KPI giả.
4. Chốt owner/SLA cho hàng đợi `UNCLASSIFIED`; non-admin luôn fail closed ở ENFORCE.

### 3.2. Grant readiness

- Migrate legacy grants và root compatibility grants có manifest/actor/reason.
- Dùng PR9 impact preview để owner từng bệnh viện xác nhận principal và blast radius.
- So sánh legacy/new decisions theo capability; phân loại mismatch do bug, dữ liệu hay policy.
- Freeze thay đổi ma trận trong cửa sổ cutover ngắn hoặc bắt buộc dual-write + drift check.

### 3.3. Coverage và security tests

Bao phủ worklist, archive, report, viewer context/artifacts, consultation, Non-DICOM, statistics/command-center drilldown, export/share/HIS và autocomplete. Với mỗi path test: ngoài scope không xuất hiện trong row/count/facet; direct lookup trả lỗi generic; mutation bị chặn server-side; deny thắng allow; READ_STUDY không tự cấp READ_REPORT/DRAFT/SIGN.

### 3.4. Rollout rings

```text
OFF + data audit
  → SHADOW nội bộ
  → SHADOW pilot bệnh viện A
  → ENFORCE pilot read-only paths
  → ENFORCE pilot all covered actions
  → rollout từng bệnh viện
  → soak period
  → đóng Phase 2
```

Mỗi ring có thời lượng tối thiểu, approver, ngưỡng mismatch/error/latency, lịch trực và quyết định `GO/HOLD/ROLLBACK`. Không đổi mode từ browser admin thường.

## 4. Telemetry và privacy

Metric: decision count theo mode/capability/reason code; shadow mismatch rate; unclassified count; denied mutation; resolver/query P50/P95/P99; dual-write drift. Log chỉ technical/correlation IDs đã scrub; không patient name, DOB, accession, report text, HIS payload hay raw Prisma args. Sampling không được làm mất deny/security events.

## 5. Rollback và break-glass

- Rollback tức thời `ENFORCE → SHADOW` bằng deployment config được kiểm soát; không xóa grant/backfill.
- Dừng rollout ring mới, bảo toàn audit/correlation và chụp metric window.
- Break-glass chỉ cho System Admin đã định danh, thời hạn ngắn, reason/ticket bắt buộc và audit riêng; không biến thành root grant vĩnh viễn.
- Sau rollback phải có incident owner, RCA và test tái hiện trước lần cutover tiếp.

## 6. Test matrix tối thiểu

1. User A chỉ thấy row/count/facet/related của A; không thấy tên node B.
2. Parent allow + child deny; parent deny + child allow; role allow + user deny đều theo deny-wins.
3. Grant scheduled/expired, inactive node, duplicate AE và unclassified đều fail đúng.
4. Deep link/report/viewer/export/share/HIS thủ công không bypass.
5. OFF baseline không đổi; SHADOW không chặn nhưng ghi mismatch; ENFORCE chặn đúng.
6. Chuyển mode không cần migration và rollback không mất grant/audit.
7. Concurrent grant edit/cutover không tạo cửa sổ fail-open.
8. Dataset UAT lớn không N+1 và đạt budget đã chốt.

## 7. Acceptance và bàn giao

- [ ] 100% đường nhạy cảm có coverage owner/evidence; không có ngoại lệ không thời hạn.
- [ ] Zero leak cross-scope trong automated test và UAT.
- [ ] Unclassified/ambiguous đạt ngưỡng đã ký; phần còn lại bị deny và có owner.
- [ ] Shadow mismatch dưới ngưỡng, mọi mismatch còn lại được giải thích.
- [ ] Pilot ENFORCE qua soak period, rollback drill thành công.
- [ ] Security, DBA, vận hành và owner bệnh viện ký GO.
- [ ] Runbook/metric/audit evidence lưu theo release; Phase 3 chỉ bắt đầu release sau gate này.

Verification: `npx tsc --noEmit`, `npm test`, `npx prisma validate`, `npm run build`, `git diff --check`, migration dry-run trên bản sao UAT và scripted authorization regression. Dùng `cmd /c` nếu cần chuỗi `&&` trên Windows PowerShell cũ.

## 8. Prompt bàn giao AI

Sao chép nguyên khối prompt dưới đây để giao cho AI/coding agent triển khai PR10:

```text
Bạn đang làm việc trong repository Minipacs-v.2. Hãy triển khai Phase 2 PR10 — UAT, Enforcement Cutover và đóng Phase 2 theo đúng tài liệu:
docs/DOCTOR_WORKSPACE_PHASE2_PR10_UAT_ENFORCEMENT_CUTOVER_PLAN.md

Trước khi sửa code, bắt buộc đọc:
- docs/DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_SCOPE_AUTHORIZATION_ORG_TREE_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR6_LEGACY_MIGRATION_SHADOW_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR7_READ_PATH_ENFORCEMENT_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR8_MUTATION_ENFORCEMENT_PLAN.md
- docs/DOCTOR_WORKSPACE_PHASE2_PR9_SCOPE_GRANT_ADMIN_UI_PLAN.md
- capability registry, scope resolver, grant repository, scope filter builder,
  require-scoped-access, allowed-actions, migration/shadow compare và admin matrix hiện có.

Mục tiêu:
1. Lập inventory có thể kiểm chứng cho toàn bộ read/count/facet/detail/related/mutation path nhạy cảm; mỗi ngoại lệ phải có owner, lý do và hạn xử lý.
2. Bổ sung automated authorization regression cho ma trận role × facility × specialty × machine × capability, bao gồm deny-wins, grant theo thời hạn, node inactive, AE Title mơ hồ và resource chưa phân loại.
3. Hoàn thiện telemetry không chứa PHI cho decision count, reason code, shadow mismatch, unclassified, denied mutation, latency và dual-write drift.
4. Cung cấp data/grant readiness checks và báo cáo máy đọc được; migration/backfill phải preview được, idempotent, audit được và không suy đoán mapping bằng free text.
5. Cung cấp cơ chế rollout OFF → SHADOW → ENFORCE theo từng bệnh viện/ring bằng deployment config được kiểm soát, có preflight gate, approver và evidence GO/HOLD/ROLLBACK; không tạo nút browser tùy tiện để đổi mode.
6. Viết runbook cutover, rollback và break-glass. Rollback ENFORCE → SHADOW không được xóa grant, backfill hoặc audit; legacy DoctorMachinePermission vẫn còn trong cửa sổ rollback.
7. Tạo evidence package/checklist đóng Phase 2 và ghi rõ các bước cần con người/DBA/security/owner bệnh viện ký; không giả lập chữ ký hoặc tuyên bố UAT production đã đạt nếu chưa có bằng chứng.

Ràng buộc an toàn bắt buộc:
- Dùng cùng một scope resolver/policy semantics cho list, count, facets, detail và mutation; không tạo policy engine thứ hai.
- ENFORCE phải fail closed cho unclassified, ambiguous, inactive hoặc thiếu global permission.
- Server phải re-authorize mutation; tuyệt đối không tin allowedActions hoặc state từ client.
- DENY luôn thắng ALLOW; READ_STUDY không tự suy ra READ_REPORT, DRAFT_REPORT hoặc SIGN_REPORT.
- Không log patient name, DOB, accession, report text, HIS payload, token/session hay raw Prisma arguments.
- Không drop bảng/cột legacy và không chạy migration phá hủy trong PR này.
- Không tự bật ENFORCE mặc định cho toàn hệ thống hoặc production. Nếu thiếu hạ tầng rollout thật, triển khai artifact/config validator/runbook an toàn và ghi rõ bước vận hành còn lại.
- Giữ tương thích OFF/SHADOW; thay đổi schema phải additive và có rollback strategy.
- Không sửa ngoài phạm vi PR10 nếu không cần thiết; không xóa hay ghi đè thay đổi đang có của người dùng.

Quy trình thực hiện:
1. Khảo sát code và lập bảng gap so với plan trước khi triển khai.
2. Chia thay đổi thành các phần nhỏ: coverage/readiness, regression tests, telemetry, rollout gate, runbook/evidence.
3. Viết test cho hành vi security quan trọng và test negative/cross-hospital trước hoặc cùng implementation.
4. Với metric/log mới, dùng label hữu hạn và technical/correlation ID đã scrub; tránh high-cardinality và PHI.
5. Với script kiểm tra/migration, mặc định dry-run, yêu cầu xác nhận rõ khi mutate và xuất manifest/count trước-sau.
6. Cập nhật tài liệu PR10 bằng file/module thực tế, lệnh vận hành, rollback trigger và evidence còn thiếu.

Acceptance tối thiểu:
- Không có leak cross-hospital trong automated tests.
- Row/count/facet/detail/related và mutation cùng semantics; direct lookup ngoài scope trả lỗi generic.
- OFF giữ baseline; SHADOW ghi divergence nhưng không chặn; ENFORCE chặn đúng và rollback độc lập với deploy code.
- Parent/user/role ALLOW-DENY, scheduled/expired grant, inactive node, duplicate AE và unclassified đều có test.
- Telemetry/audit không chứa PHI và deny/security events không bị sampling mất.
- Cutover preflight từ chối khi coverage/data/grant/mismatch vượt gate hoặc thiếu approver/evidence.
- Rollback drill và break-glass được mô tả/test ở mức có thể tự động; phần thao tác thật được đánh dấu manual approval.

Sau khi triển khai, chạy ít nhất:
- npx tsc --noEmit
- npm test
- npx prisma validate (cung cấp DATABASE_URL hợp lệ/tạm nếu môi trường yêu cầu)
- npm run build
- git diff --check
- các script authorization regression/readiness/cutover preflight mới ở chế độ dry-run

Cuối cùng báo cáo:
- file đã thay đổi và lý do;
- inventory coverage và gap còn lại;
- kết quả test/build/readiness;
- metric/runbook/evidence đã tạo;
- rủi ro, bước manual approval, điều kiện GO/HOLD/ROLLBACK;
- xác nhận rõ ENFORCE production chưa được tự động bật.

Không chỉ viết kế hoạch: hãy triển khai code, test, script và tài liệu khả thi trong phạm vi repository. Nếu một phần cần hạ tầng hoặc phê duyệt bên ngoài, không bịa kết quả; hãy tạo gate/runbook/artifact tương ứng và nêu chính xác việc còn lại.
```
