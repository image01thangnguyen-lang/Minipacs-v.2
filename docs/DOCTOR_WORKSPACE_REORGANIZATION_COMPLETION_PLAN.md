# Kế hoạch hoàn thiện Doctor Workspace Reorganization

Ngày lập: 2026-07-12  
Tài liệu nguồn: `DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md`  
Baseline đánh giá: khoảng 92% implementation kỹ thuật; khoảng 82–85% nếu tính UAT, vận hành và ký duyệt thực tế.  
Mục tiêu: đóng toàn bộ khoảng trống còn lại, tạo evidence kiểm chứng được và đưa release từ `HOLD/PENDING` đến trạng thái sẵn sàng rollout 100%.

## 1. Nguyên tắc thực hiện

1. Không tuyên bố hoàn thành nếu chỉ có code mà chưa có test/evidence tương ứng.
2. Không tự giả lập chữ ký, production deployment, thời gian soak, restore drill hoặc kết quả UAT của con người.
3. Mọi đường đọc/count/facet/detail/related/action phải fail-closed và dùng cùng chính sách scope.
4. Không đổi URL hiện hữu, palette `--vin-*`, workflow lâm sàng hoặc schema theo cách phá tương thích.
5. Mỗi PR phải nhỏ, rollback được, có test và cập nhật evidence.
6. Các bước tự động hóa được thực hiện trước; các gate cần hạ tầng/người thật được đóng bằng checklist bàn giao rõ ràng.

## 2. Definition of Done tổng thể

Chỉ đóng master plan khi đồng thời đạt:

- [ ] Tất cả tiêu chí chức năng Phase 0–7 có code hoặc evidence xác nhận.
- [ ] TypeScript, unit/contract/security/accessibility test, Prisma validate và production build đều PASS.
- [ ] Không có API workspace trả dữ liệu hoặc metadata vượt scope.
- [ ] Không còn khoảng trống UX mức P0/P1 trong 7 vùng và shared list UI.
- [ ] Đạt SLO trên hạ tầng UAT thật; có báo cáo truy vấn và xác nhận không N+1.
- [ ] UAT lâm sàng, security, DBA và operations được người có thẩm quyền ký.
- [ ] Restore drill thật đạt RPO/RTO; rollback bảo toàn draft và preference.
- [ ] Pilot và các vòng soak hoàn tất, không còn Sev1/Sev2 mở.
- [ ] Rollout 100% được phê duyệt và có post-release review.

## 3. Workstream A — Audit khoảng trống và khóa baseline

### A1. Tạo ma trận truy vết

- Lập bảng từng acceptance criterion trong master plan với các cột: `ID`, `Phase/PR`, `code`, `test`, `evidence`, `owner`, `status`, `blocker`.
- Trạng thái chỉ gồm `PASS`, `PARTIAL`, `MISSING`, `EXTERNAL_GATE`, tránh đánh giá cảm tính.
- Liên kết trực tiếp tới file và test, không chỉ dẫn tới plan.

### A2. Khóa baseline kiểm chứng

- Ghi commit SHA, schema/migration state, feature flags và working-tree status.
- Chạy baseline: `tsc`, toàn bộ test, Prisma validate, build và `git diff --check`.
- Lưu output máy đọc được và bản tóm tắt vào evidence closure.
- Chụp giao diện 1280/1440/1920/2560 cho workspace và các trang shared UI.

### A3. Bổ sung closure evidence Phase 0/1/3/4/5/6

- Phase 0: wireframe/breakpoint, menu map, data dictionary, fixture matrix và baseline UX/performance.
- Phase 1: permission visibility, hidden empty group, active deep link, menu persistence/search và nhãn tiếng Việt.
- Phase 3–6: mỗi phase có bảng acceptance → test/evidence và danh sách ngoại lệ bằng 0 hoặc có owner/deadline.

**Gate A:** không còn tiêu chí không có trạng thái; baseline build/test xanh.

## 4. Workstream B — Hoàn thiện các khoảng trống kỹ thuật

### B1. Navigation và app shell

- Xác minh và bổ sung menu search khi registry lớn.
- Persist trạng thái expand/collapse theo user, không chỉ local state dùng chung trình duyệt.
- Test node cha tự ẩn, route active sau refresh/deep link và tất cả label tiếng Việt.
- Test role matrix cho từng node và kiểm tra route trực tiếp vẫn bị server authorization chặn.

### B2. Worklist/filter/query

- Hoàn thiện contract search: Patient ID, tên, accession, dịch vụ; kiểm tra case-insensitive và chiến lược bỏ dấu.
- Xác nhận đầy đủ date presets, timezone bệnh viện, URL round-trip, Enter chạy ngay, debounce và clear.
- Bổ sung request cancellation/stale-response protection có test race.
- Contract-test giao của search + date + status + facility + specialty + consultation + priority + doctor + HIS.
- Đối chiếu facet count với list dưới cùng scope; test metadata của node bị cấm không xuất hiện.

### B3. Data grid và preference

- Xác minh pinned identity/action columns, sticky header và horizontal scroll.
- Hoàn thiện reorder/hide/show/resize, density `Gọn`/`Thoải mái` và persistence theo user.
- Bảo toàn selection khi refresh/page hợp lệ; không đổi selection khi report đang dirty.
- Kiểm tra keyboard navigation, focus, single-click, double-click và allowed action menu.
- Chỉ bổ sung virtualization nếu phép đo với >100 dòng chứng minh cần thiết.

### B4. Seven-region workspace và related studies

- Visual regression đủ 7 vùng ở desktop; drawer/tab behavior ở 1024–1279; fallback dưới 1024.
- Persist splitter/panel collapse và cung cấp `Khôi phục bố cục mặc định`.
- Test related studies là query độc lập, đủ range `encounter/30 ngày/1 năm/tất cả`, fail-closed theo scope.
- Xác minh compare affordance, deep link, race khi đổi ca nhanh và focus restoration.

### B5. Report, consultation và sensitive actions

- Test revisioned autosave: saving/saved/error, stale revision và conflict recovery.
- Dirty guard cho đổi ca, đóng panel, điều hướng nội bộ và browser unload.
- Read-only phải bị chặn cả UI lẫn action trực tiếp.
- Contract-test lại `draft/sign/approve/unfinalize/deliver/HIS/consult` theo scope + workflow state.
- Xác minh consultation, second read, viewer và key image đúng allowed actions và có audit.
- Kiểm tra session expiry, concurrent edit và HIS timeout/retry không báo thành công giả.

### B6. Shared UI cleanup

- Hoàn thành adoption cho Archive, Worklist, Consultations, Non-DICOM, analytics drilldown và admin tables.
- Chuẩn hóa header/filter/reset/status/loading/empty/error/access-denied/density.
- Tìm và loại component legacy trùng lặp sau khi tất cả consumer chuyển đổi.
- Quét màu hardcode mới; giữ palette dark teal hiện tại.
- Chạy visual/accessibility regression từng trang trước khi xóa legacy.

**Gate B:** ma trận kỹ thuật không còn `MISSING`; mọi `PARTIAL` có test chứng minh đã đóng.

## 5. Workstream C — Security và Phase 2 cutover

1. Chạy migration/readiness trên bản sao dữ liệu UAT: duplicate AE, unclassified resource, invalid hierarchy, grant hết hạn.
2. Chạy authorization regression theo role × hospital × specialty × machine × capability.
3. Bật `SHADOW`, theo dõi mismatch/dual-write drift trong thời gian được Security phê duyệt.
4. Điều tra mọi mismatch; không whitelist chung chung và không dùng admin bypass để che dữ liệu lỗi.
5. Chạy preflight ngay trước cutover; lưu checksum/config revision.
6. DBA xác nhận migration/index/idempotency; Security xác nhận deny-wins/fail-closed/no-PHI; Hospital Owner xác nhận UAT.
7. Bật `ENFORCE` theo ring, giám sát deny/error/scope parity và thực hành rollback config.
8. Điền chữ ký thật trong `PHASE2_CLOSURE_EVIDENCE.md`.

**Gate C:** zero unexplained shadow mismatch, zero cross-hospital leak, đủ ba chữ ký và ENFORCE được xác nhận trên ring mục tiêu.

## 6. Workstream D — Performance, reliability và accessibility

### D1. Dataset và kịch bản

- Fixture nhiều bệnh viện/chuyên khoa/máy, giao quyền chồng lấn, ca chưa phân loại và lịch sử bệnh nhân dài.
- Tải đồng thời theo profile bác sĩ thực tế; không dùng duy nhất synthetic happy path.
- Kịch bản Orthanc chậm/down, HIS timeout/error, DB latency, reconnect và autosave conflict.

### D2. SLO cần chứng minh

- First useful worklist P95 < 2 giây.
- Filter/page P95 < 1 giây.
- Chọn ca/metadata cơ bản P95 < 1 giây.
- Progressive gate sử dụng ngưỡng release-control đã định nghĩa; không sửa ngưỡng để làm test xanh.
- Thu query plan, query count/request, slow query và cache behavior để chứng minh không N+1/cross-user cache.

### D3. Accessibility/responsive

- Keyboard-only cho navigation, facets, grid, splitter, related studies, report actions và dialogs.
- Focus ring/order, aria label, tooltip, contrast và không truyền đạt trạng thái chỉ bằng màu.
- Test 1280/1440/1920/2560; kiểm tra 1024–1279 và fallback dưới 1024.

**Gate D:** SLO đạt trên UAT thật, chaos không gây rò quyền/mất draft, accessibility không còn lỗi nghiêm trọng.

## 7. Workstream E — UAT lâm sàng và restore drill

### E1. UAT lâm sàng

- Chọn đại diện bác sĩ đọc phim, bác sĩ duyệt, KTV, admin cơ sở và người vận hành.
- Chạy end-to-end: tìm/chọn ca → related studies → viewer → draft/autosave → consult → sign/approve → HIS.
- Chạy negative cases: vượt quyền, đổi ca khi dirty, concurrent edit, session expiry, HIS/Orthanc lỗi.
- Mọi issue có severity, owner, due date, evidence retest; Sev1/Sev2 chặn promotion.
- Thu chữ ký Clinical, Security, Operations và Product thật.

### E2. Backup/restore/rollback drill

- Tạo restore point thật và ghi checksum/timestamp.
- Tạo draft/preference/audit mẫu trước drill; restore và đối chiếu sau drill.
- Đo RPO/RTO thực tế và ghi evidence.
- Diễn tập feature rollback về 0%, xác nhận schema additive và dữ liệu mới không bị mất.

**Gate E:** UAT signed, Sev1/Sev2 = 0, restore drill PASS và RPO/RTO đạt.

## 8. Workstream F — Pilot và progressive rollout

1. Đóng băng release candidate; ghi SHA, migration set, config revision và known issues.
2. Pilot nhóm bác sĩ nhỏ; hỗ trợ on-call độc lập và kênh phản hồi rõ ràng.
3. Promotion tuần tự `0 → 10 → 25 → 50 → 100%`.
4. Tuân thủ soak tối thiểu tương ứng `60/240/720/1440` phút; không backfill thời gian giả.
5. Mỗi ring kiểm tra scope parity, error rate, P95, autosave success, incident và on-call coverage.
6. Rollback ngay khi Sev1, scope parity fail hoặc error ≥5%; HOLD theo các ngưỡng đã mã hóa.
7. Trước 100%, thu đủ Clinical, Security, Operations, Product và Release Manager approval.
8. Lập post-release review, theo dõi regression và đóng handoff vận hành.

**Gate F:** ring 100% đạt soak, đủ chữ ký, không issue chặn và post-release review được lên lịch.

## 9. Thứ tự PR đề xuất

| PR | Nội dung | Phụ thuộc | Điều kiện merge |
| --- | --- | --- | --- |
| C1 | Traceability matrix + baseline evidence | Không | Inventory đầy đủ, test baseline xanh |
| C2 | Navigation/search/persistence tests | C1 | Role/deep-link tests PASS |
| C3 | Filter URL/cancellation/search hardening | C1 | Contract + race tests PASS |
| C4 | Grid/prefs/density/pinned UX closure | C3 | Persistence + keyboard tests PASS |
| C5 | Layout/related studies responsive closure | C3–C4 | Visual + scope tests PASS |
| C6 | Report/consultation/action hardening closure | C5 | Conflict/permission/workflow tests PASS |
| C7 | Shared UI legacy cleanup | C2–C6 | Cross-page regression PASS |
| C8 | Security/performance/accessibility automation closure | C3–C7 | Full CI/build PASS |
| OPS1 | Phase 2 shadow/ENFORCE cutover | C8 | Human/security/DB gates |
| OPS2 | UAT + restore drill | OPS1 | Signed evidence, RPO/RTO PASS |
| OPS3 | Pilot + progressive rollout | OPS2 | Ring gates và soak PASS |

## 10. Bộ lệnh verification tối thiểu

Chạy từ `dashboard` bằng shell phù hợp; tên script thực tế lấy từ `package.json`, không giả định script không tồn tại.

```text
npx tsc --noEmit
npm test
npx prisma validate
npm run build
```

Ngoài ra phải chạy cutover preflight, authorization regression, UAT validation và release-control gate theo runbook hiện hữu. Mọi lần chạy phải ghi ngày, commit, môi trường và kết quả; log phải được scrub PHI.

## 11. Phân công trách nhiệm

| Vai trò | Trách nhiệm không thể thay bằng automation |
| --- | --- |
| Lead Developer | Khóa RC, xác nhận code/test/evidence |
| Security Reviewer | Scope parity, fail-closed, PHI/log, ký cutover |
| DBA | Migration/index/query plan, backup/restore, RPO/RTO |
| Clinical Owner | UAT workflow và an toàn lâm sàng |
| Operations | Monitoring, on-call, incident và rollback drill |
| Product Owner | UX acceptance, known issues và rollout approval |
| Release Manager | Ring promotion, checksum, soak và final handoff |

## 12. Báo cáo tiến độ

Mỗi lần cập nhật dùng hai tỷ lệ riêng:

- **Implementation completion:** tiêu chí code/test đã PASS trên tổng tiêu chí kỹ thuật.
- **Release readiness:** tổng gate đã có evidence thật, bao gồm UAT, SLO, restore, soak và signatures.

Không cộng chữ ký hoặc elapsed soak vào implementation; không dùng implementation 100% để suy ra release readiness 100%.

## 13. Tiêu chí dừng và rollback

Dừng promotion hoặc rollback nếu có một trong các điều kiện:

- Rò dữ liệu/scope parity failure hoặc hành động vượt quyền.
- Sev1; Sev2 chưa có mitigation được phê duyệt.
- Autosave làm mất/ghi đè draft hoặc báo `Đã lưu` sai.
- Error rate/latency vượt release gate.
- Restore drill thất bại hoặc không chứng minh bảo toàn draft/preference/audit.
- Thiếu on-call, evidence stale/checksum lệch hoặc thiếu chữ ký bắt buộc.

## 14. Kết quả bàn giao cuối

- Ma trận truy vết master-plan hoàn toàn `PASS` hoặc `EXTERNAL_GATE` đã ký.
- Closure evidence cho từng phase và một final acceptance report.
- Release manifest: commit, migrations, flags, checksum, dashboards, alerts và known issues.
- UAT, security, DBA, restore và rollout evidence thật.
- Runbook rollback/on-call và lịch post-release review.
- Master plan được cập nhật trạng thái `Hoàn thành` kèm ngày, release version và liên kết evidence.