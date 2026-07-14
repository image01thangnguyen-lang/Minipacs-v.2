# Kế hoạch bổ sung trường cho màn danh sách ca chụp theo PACS-Medim

Ngày khảo sát: 15/07/2026  
Phạm vi: màn danh sách ca chụp/doctor workspace, không phải riêng màn tạo Modality Worklist  
Nguồn tham chiếu: ảnh màn hình PACS-Medim do người dùng cung cấp. Việc đọc trực tiếp DOM của tab đã mở không thực hiện được vì tab PACS không phải cửa sổ Chrome có thể truy cập qua UI Automation; do đó tên trường dưới đây được chốt theo nội dung nhìn thấy trong ảnh và cần xác nhận ngữ nghĩa với dữ liệu thật trước migration.

## 1. Danh sách trường và chức năng quan sát được

### 1.1. Bộ tìm kiếm và thời gian

- Mã bệnh nhân.
- Họ tên bệnh nhân.
- Preset thời gian: Hôm nay, Hôm qua, 7 ngày, 30 ngày.
- Khoảng ngày tùy chọn từ ngày/đến ngày.
- Làm mới, xóa điều kiện và các thao tác tiện ích trên thanh công cụ.

### 1.2. Bộ lọc theo tổ chức và thiết bị

- Cây cơ sở/đơn vị.
- Nhóm modality hoặc phòng/máy.
- Từng máy chụp có thể chọn độc lập.
- Lựa chọn `ALL` để lấy toàn bộ phạm vi được cấp quyền.

### 1.3. Bộ lọc trạng thái ca chụp

- Chưa đọc.
- Đang đọc.
- Đọc xong.
- Đang hội chẩn.
- Hội chẩn xong.
- Đang duyệt.
- Duyệt xong.
- Tất cả.

Các trạng thái này không nên được lưu thành một enum mới độc lập ngay lập tức. Chúng cần được ánh xạ từ `ImagingStudy.status`, trạng thái báo cáo, trạng thái hội chẩn và trạng thái duyệt hiện có để tránh hai nguồn sự thật.

### 1.4. Các cột trong bộ chọn cột

Ảnh tham chiếu hiển thị 18 lựa chọn:

1. `##` — biểu tượng/trạng thái nhanh của ca.
2. Thời gian chụp.
3. Máy chụp.
4. Mã.
5. Mã lần khám.
6. Họ tên.
7. Tuổi.
8. Giới tính.
9. Bộ phận chụp.
10. Chẩn đoán.
11. AI.
12. Khoa chỉ định.
13. Bác sĩ chỉ định.
14. Bác sĩ đọc.
15. Bác sĩ sửa/duyệt.
16. Chỉ định.
17. STT.
18. KTV thực hiện.

### 1.5. Khung thông tin ca chụp và bệnh nhân

Khung thông tin ca chụp bên trái có các trường nhìn thấy:

- Bác sĩ chỉ định.
- Chỉ định.
- Bộ phận chụp.
- Kết luận.
- Tên đoàn khám.
- Mã hồ sơ.

Khung bên phải là `Thông tin bệnh nhân`; nên hiển thị tối thiểu họ tên, mã bệnh nhân, mã lần khám, ngày sinh/tuổi, giới tính và các định danh cần thiết. Không đưa dữ liệu nhạy cảm không phục vụ đọc ca vào mặc định.

## 2. Đối chiếu với MiniPACS hiện tại

### 2.1. Đã có hoặc có thể ánh xạ trực tiếp

| Trường tham chiếu | Nguồn hiện tại dự kiến | Nhận xét |
|---|---|---|
| Họ tên | `patientName` | Đã có trong contract/grid. |
| Mã bệnh nhân | `patientId` | Đã có; cần tách thành cột độc lập thay vì gộp trong “Bệnh nhân”. |
| Thời gian chụp | `studyDate` hoặc `receivedAt` | Phải dùng thời gian thực hiện DICOM, không dùng `createdAt` thay thế. |
| Máy chụp | `machineName`, `stationAeTitle`, quan hệ machine mapping | UI cũ có hiển thị nhưng contract query mới còn mapping thiếu. |
| Giới tính | `patientSex`/order `gender` | Có ở một số read model nhưng chưa có trong `WorklistRow`. |
| Bộ phận chụp | `bodyPart`/`bodyPartExamined` | `query-service` hiện đang gán nhầm từ `procedureDescription`; cần sửa nguồn. |
| Khoa chỉ định | `referringDepartment` | Có ở `WorklistOrder`, chưa được đưa đầy đủ vào study-list contract. |
| Bác sĩ chỉ định | `referringPhysician` | Có ở order, chưa thành cột độc lập. |
| Bác sĩ đọc | `assignedDoctorName`/report author | Contract có ID/tên nhưng mapper hiện chưa resolve tên đầy đủ. |
| Chỉ định | `procedureDescription`, `procedureName`, `clinicalInfo` | Hiện đang gộp trong một ô. |
| KTV thực hiện | `technologistName` | Có trong adapter order; cần chuẩn hóa nguồn cho study đã nhận ảnh. |
| Trạng thái đọc | `ImagingStudy.status` + report status | Đã có nền tảng badge/status. |
| Thông tin bệnh nhân | `PatientStudyContextPanel` | Đã có họ tên, PID, giới tính, ngày sinh, ngày chụp, mô tả, modality, accession, cơ sở, BS đọc. |

### 2.2. Thiếu hoặc chưa rõ ngữ nghĩa

| Trường | Khoảng trống cần xử lý |
|---|---|
| Mã | Cần xác nhận là mã bệnh nhân, accession, mã hồ sơ hay mã ca nội bộ. Không tạo field mới trước khi xác nhận bằng một bản ghi thật. |
| Mã lần khám | Chưa có trường chuẩn hóa rõ trong study contract; cần nhận từ HIS (visit/encounter ID). |
| Tuổi | Nên tính tại thời điểm chụp từ ngày sinh, không lưu số tuổi tĩnh trừ khi HIS chỉ gửi tuổi. |
| Chẩn đoán | Cần phân biệt chẩn đoán vào viện, chẩn đoán chỉ định và thông tin lâm sàng. |
| AI | Cần contract kết quả AI: trạng thái, cờ bất thường, model/version, thời điểm và quyền xem; không chỉ là chuỗi tự do. |
| Bác sĩ sửa/duyệt | Cần lấy từ revision/audit của báo cáo hoặc người duyệt cuối, không suy ra từ BS đọc. |
| STT | Có thể là số thứ tự trong danh sách hoặc số tiếp đón. Nếu chỉ là row index thì không lưu DB. |
| Kết luận | Lấy từ báo cáo mới nhất theo trạng thái được phép xem; phải tránh lộ draft cho người không có quyền. |
| Tên đoàn khám | Chưa thấy read model chuẩn hóa; cần xác nhận có nghiệp vụ khám đoàn hay không. |
| Mã hồ sơ | Cần xác nhận tương ứng HIS medical record ID, encounter ID hay accession. |

### 2.3. Khoảng trống UI/contract đáng chú ý

- `WorklistAntd` hiện chỉ có các cột gộp: Bệnh nhân, Chỉ định, Mod, Lịch, Trạng thái, Tác vụ; chưa có bộ chọn cột.
- `WorklistDataGrid` cũng gộp nhiều dữ liệu, không đáp ứng việc bật/tắt 18 cột riêng biệt.
- `WorklistRow` hiện thiếu ngày sinh/tuổi, giới tính, visit ID, diagnosis, referring department/physician, technologist, reviewer và AI summary.
- `query-service.ts` còn placeholder: `receivedAt` lấy từ `createdAt`, `machineName` và `assignedDoctorName` chưa map, `bodyPart` lấy từ mô tả chỉ định.
- Preference workspace chỉ allowlist 7 cột (`patient`, `description`, `modality`, `status`, `assigned`, `date`, `images`); cần nâng version và migration preference tương thích ngược.
- Màn doctor workspace đã có `FacilityScopeTree`, facet, URL filter, `StudyDataGrid` và `PatientStudyContextPanel`; đây là nền tảng phù hợp hơn để mở rộng. Không nên sao chép toàn bộ logic sang màn tạo order.

## 3. Phạm vi ưu tiên

### P0 — Bắt buộc cho vận hành đọc ca

- Thời gian chụp, máy chụp.
- Mã bệnh nhân, mã lần khám/accession sau khi xác nhận ngữ nghĩa.
- Họ tên, tuổi/ngày sinh, giới tính.
- Modality, bộ phận chụp, chỉ định, chẩn đoán/thông tin lâm sàng.
- Khoa và bác sĩ chỉ định.
- Bác sĩ đọc, KTV thực hiện.
- Trạng thái đọc/hội chẩn/duyệt.
- Chọn cột, đổi thứ tự, chỉnh độ rộng và lưu theo người dùng.
- Khung chi tiết bệnh nhân/ca chụp khi chọn dòng.

### P1 — Hoàn thiện báo cáo và quản trị luồng

- Bác sĩ sửa/duyệt.
- Kết luận theo quyền truy cập.
- Mã hồ sơ và thông tin encounter/HIS đã xác nhận.
- Tên đoàn khám nếu nghiệp vụ thực tế có sử dụng.

### P2 — Tích hợp nâng cao

- Cột AI và bộ lọc AI bất thường/chưa chạy/lỗi.
- Các chỉ báo SLA, cảnh báo chất lượng và trạng thái đồng bộ.

## 4. Kế hoạch triển khai đề xuất

### Giai đoạn 0 — Chốt từ điển dữ liệu và UX

1. Chọn 3–5 ca thật đã ẩn danh trên PACS-Medim và đối chiếu từng giá trị với HIS/DICOM.
2. Chốt nghĩa của `Mã`, `Mã lần khám`, `STT`, `Mã hồ sơ`, `Chẩn đoán`, `Tên đoàn khám`.
3. Chốt định nghĩa “Thời gian chụp”: ưu tiên DICOM Study Date/Time hoặc acquisition time đã chuẩn hóa timezone.
4. Chốt ma trận trạng thái tổng hợp và quy tắc ưu tiên khi study/report/consultation/review không đồng bộ.
5. Chốt cột mặc định P0; các cột P1/P2 để người dùng tự bật.

**Gate:** có data dictionary ghi rõ nhãn UI, field nguồn, kiểu dữ liệu, nullable, fallback, quyền xem và ví dụ.

### Giai đoạn 1 — Mở rộng read model và contract

1. Nâng `WORKLIST_CONTRACT_VERSION`; bổ sung các field có kiểu rõ ràng:
   - `patientBirthDate`, `patientSex`, `ageAtStudy` (computed).
   - `studyDate`, `machineName`, `visitId`, `medicalRecordId`.
   - `bodyPart`, `procedureDescription`, `diagnosis`, `clinicalInfo`.
   - `referringDepartment`, `referringPhysician`.
   - `assignedDoctorName`, `technologistName`, `reviewerName`.
   - `reportConclusion` theo quyền.
   - `consultationStatus`, `reviewStatus`, `aiSummary`.
2. Tạo row mapper riêng thay vì tiếp tục đặt fallback trong `query-service.ts`.
3. Batch join order, performing unit, machine mapping, user/doctor, latest authorized report, consultation và AI result; không N+1.
4. Sửa các mapping placeholder hiện tại và thêm provenance/freshness khi dữ liệu đến từ HIS/Orthanc.
5. Chỉ thêm cột DB/migration cho dữ liệu thật sự chưa có nguồn chuẩn; ưu tiên relation/read projection để tránh nhân bản.

**Gate:** contract test, mapper test và fixture chứng minh mọi field P0 có nguồn/fallback xác định.

### Giai đoạn 2 — Query, tìm kiếm, bộ lọc và index

1. Mở rộng tìm kiếm có giới hạn cho PID, họ tên, accession, visit ID và medical record ID.
2. Thêm preset Hôm nay/Hôm qua/7 ngày/30 ngày và custom range theo timezone bệnh viện; URL là nguồn trạng thái shareable.
3. Dùng cây cơ sở/đơn vị/máy hiện có, chỉ hiển thị node trong scope người dùng.
4. Tạo facet trạng thái tổng hợp: unread, reading, read, consulting, consulted, reviewing, approved.
5. Bổ sung filter modality/machine/doctor/AI khi có nhu cầu, kèm self-exclusion semantics cho facet count.
6. Đo `EXPLAIN`, thêm composite index dựa trên query thực tế; không thêm index phỏng đoán hàng loạt.

**Gate:** row count/facet count cùng scope; cursor không trùng/bỏ dòng; P95 query mục tiêu dưới 1 giây sau warm-up.

### Giai đoạn 3 — Data grid và preference cột

1. Mở rộng `StudyDataGrid` trong doctor workspace, không nhân bản một bảng thứ ba.
2. Tạo column registry có ID ổn định cho 18 cột; `STT` là row index nếu nghiệp vụ không xác nhận số tiếp đón.
3. Cột mặc định gọn: trạng thái nhanh, thời gian, máy, PID/visit, họ tên, tuổi, giới tính, bộ phận, chỉ định, trạng thái, BS đọc.
4. Thêm column chooser với tìm kiếm, bật/tắt, kéo đổi thứ tự, resize, reset mặc định.
5. Nâng schema preference version; migrate preference cũ bằng cách map 7 ID cũ sang ID mới và giữ nguyên layout/density.
6. Sticky header, pinned identity/action columns, horizontal virtualization/scroll, ellipsis + tooltip và keyboard navigation.
7. Không hiển thị raw technical IDs hoặc kết luận draft nếu user thiếu quyền.

**Gate:** preference phục hồi đúng user trên phiên đăng nhập khác; không mất cấu hình cũ; grid dùng được ở 1280–2560 px và bằng bàn phím.

### Giai đoạn 4 — Khung thông tin ca chụp

1. Mở rộng `PatientStudyContextPanel` thành các nhóm:
   - Bệnh nhân: họ tên, PID, visit, hồ sơ, ngày sinh/tuổi, giới tính.
   - Chỉ định: khoa/BS chỉ định, chẩn đoán, chỉ định, bộ phận.
   - Thực hiện: thời gian, máy, modality, KTV.
   - Báo cáo: BS đọc, BS sửa/duyệt, kết luận và trạng thái.
   - Tích hợp: HIS/AI/freshness khi có quyền.
2. Giữ cơ chế race-token hiện có khi đổi selection nhanh.
3. Kết luận chỉ lấy phiên bản phù hợp với `allowedActions`; draft không được lộ qua payload.
4. Selection và deep-link tiếp tục dùng Study Instance UID, không dùng row index.

**Gate:** đổi dòng nhanh không hiển thị dữ liệu ca trước; denied/not-found/stale có trạng thái rõ ràng.

### Giai đoạn 5 — AI và các trường P1/P2

1. Chuẩn hóa `AiStudySummary`: `NOT_RUN | RUNNING | NORMAL | ABNORMAL | FAILED`, model/version, finding count, severity và timestamp.
2. Chỉ hiển thị badge tổng hợp ở grid; chi tiết AI mở trong panel riêng và theo quyền.
3. Bổ sung reviewer/conclusion/audit từ report revision, không lưu tên người duyệt dạng text nếu đã có user relation.
4. Chỉ thêm đoàn khám/mã hồ sơ sau khi HIS contract được chốt và có dữ liệu nguồn đáng tin cậy.

**Gate:** AI lỗi không chặn danh sách; kết quả AI luôn ghi rõ nguồn/model và không bị trình bày như kết luận bác sĩ.

### Giai đoạn 6 — Cutover an toàn

1. Bọc field-set/grid mới bằng feature flag server-side, rollout theo cơ sở/cohort.
2. Shadow-compare row mapper cũ/mới trên dữ liệu đã scrub; theo dõi tỷ lệ field null và mapping conflict.
3. UAT với bác sĩ CĐHA, KTV và điều phối viên trên các workflow đọc/hội chẩn/duyệt.
4. Soak tối thiểu một chu kỳ trực; rollback chỉ đổi flag, không rollback dữ liệu HIS/DICOM đã ingest.
5. Sau sign-off mới bỏ mapping/UI legacy.

## 5. Điểm chạm mã nguồn dự kiến

- `dashboard/lib/worklist/contract.ts` — contract/version/filter/sort.
- `dashboard/lib/worklist/query-service.ts` và row mapper mới — projection và batch relation.
- `dashboard/lib/worklist/query-builder.ts`, `facets.ts`, `url-state.ts` — search/filter/time/status.
- `dashboard/app/components/workspace/StudyDataGrid.tsx` — column registry và grid chính.
- `dashboard/app/components/workspace/regions/WorkspaceSearchBar.tsx` — PID/name/date presets.
- `dashboard/app/components/workspace/regions/WorkQueueFacets.tsx` — trạng thái nghiệp vụ.
- `dashboard/app/components/workspace/regions/FacilityScopeTree.tsx` — cơ sở/máy.
- `dashboard/app/components/workspace/regions/PatientStudyContextPanel.tsx` — panel chi tiết.
- `dashboard/lib/preferences/workspace-preferences.ts` và action preference — schema/migration cấu hình cột.
- `dashboard/prisma/schema.prisma` + migration — chỉ khi data dictionary xác nhận cần field/index mới.
- Test contract/query/preference/selection/security và fixture UAT tương ứng.

## 6. Kiểm thử bắt buộc

- Unit: tuổi tại thời điểm chụp, timezone/day boundary, status composer, nullable fallback, preference migration.
- Contract: version cũ/mới, reject field/sort/filter lạ, giới hạn date range và mảng facet.
- Query: scope nhiều cơ sở, machine tree, intersection filter, stable cursor, constant query count.
- Security: không rò row/facet/doctor/conclusion giữa cơ sở; không trả draft/report/AI trái quyền.
- UI: column chooser/order/resize/reset, selection, keyboard, screen reader label, loading/empty/error/stale.
- Performance: 50/100/500 dòng, horizontal scroll, no N+1, query plan/index evidence.
- Clinical UAT: chưa đọc → đang đọc → đọc xong; hội chẩn; sửa/duyệt; ca không có HIS; ca thiếu DICOM tag; AI lỗi.

## 7. Tiêu chí hoàn thành

- [ ] Data dictionary cho toàn bộ 18 cột và 6 trường panel được ký xác nhận.
- [ ] Tất cả trường P0 có nguồn chuẩn, fallback và quyền xem rõ ràng.
- [ ] Không còn mapping `receivedAt = createdAt`, `bodyPart = procedureDescription` hoặc placeholder tên máy/bác sĩ trong đường đọc mới.
- [ ] Bộ lọc thời gian/cơ sở/máy/trạng thái cho kết quả và facet count đúng scope.
- [ ] Người dùng cấu hình cột và preference được lưu/migrate an toàn.
- [ ] Panel chi tiết không race, không lộ draft/kết luận/AI trái quyền.
- [ ] Test, typecheck, Prisma validation, build, accessibility, query-plan và UAT đều đạt.
- [ ] Có feature flag, telemetry, runbook rollback và sign-off trước cutover.

## 8. Thứ tự triển khai khuyến nghị

Không bắt đầu bằng việc thêm ngay 18 cột vào `WorklistAntd`. Thứ tự an toàn là:

1. Chốt nghĩa 6 trường mơ hồ bằng dữ liệu thật.
2. Sửa read model/mapper hiện có và đưa đủ P0 vào contract.
3. Mở rộng search/facet/index.
4. Nâng `StudyDataGrid` + preference.
5. Mở rộng panel chi tiết.
6. Sau cùng mới thêm AI và trường P1/P2 rồi rollout bằng feature flag.

Thứ tự này tránh tạo UI có cột nhưng dữ liệu sai nguồn, đồng thời tận dụng doctor workspace và cơ chế scope/selection/preference đã có trong MiniPACS.

## 9. Prompt bàn giao cho AI triển khai

Sao chép nguyên khối prompt dưới đây để giao cho AI khác:

```text
Bạn là senior full-stack engineer chịu trách nhiệm triển khai an toàn một tính năng clinical worklist trong repository MiniPACS-v.2.

WORKSPACE
- Repository: c:\Antigravity\Minipacs-v.2
- Ứng dụng chính: dashboard (Next.js + TypeScript + Prisma + Ant Design).
- Tài liệu nguồn sự thật bắt buộc phải đọc trước khi sửa code:
  docs/PACS_MEDIM_STUDY_SCREEN_FIELD_ADDITION_PLAN.md

MỤC TIÊU
Triển khai kế hoạch bổ sung trường cho màn danh sách ca chụp/doctor workspace theo PACS-Medim, tận dụng kiến trúc hiện tại. Không tạo thêm một bảng worklist trùng lặp và không chỉ dựng UI với dữ liệu giả. Kết quả phải có dữ liệu đúng nguồn, scoped authorization, preference tương thích ngược, test và tài liệu evidence.

NGUYÊN TẮC BẮT BUỘC
1. Trước tiên đọc toàn bộ file plan và khảo sát code thực tế; không giả định nội dung plan vẫn khớp 100% với HEAD.
2. Dùng `StudyDataGrid` và doctor workspace làm đường triển khai chính. Không sao chép logic sang một grid thứ ba.
3. Không tự đoán ngữ nghĩa của các trường còn mơ hồ: `Mã`, `Mã lần khám`, `STT`, `Mã hồ sơ`, `Chẩn đoán`, `Tên đoàn khám`.
4. Nếu chưa có xác nhận nghiệp vụ/dữ liệu thật cho trường mơ hồ:
   - ghi rõ câu hỏi/blocker trong data dictionary;
   - dùng field hiện có chỉ khi ánh xạ được chứng minh;
   - không tạo migration hoặc lưu dữ liệu suy đoán;
   - vẫn tiếp tục các phần P0 không bị chặn.
5. Không dùng `createdAt` giả làm thời gian chụp; không dùng `procedureDescription` giả làm bộ phận chụp.
6. Không trả draft report, kết luận, AI result hoặc dữ liệu ngoài facility scope cho người không có quyền.
7. Không tạo N+1 query. Các relation order, machine, doctor, report, consultation và AI phải được batch select/join.
8. Mọi sort/filter/column ID từ client phải qua allowlist và validation; không truyền Prisma field tùy ý từ client.
9. Giữ stable cursor, tie-breaker và cùng scoped predicate cho rows/facets/count.
10. Migration phải additive, tương thích ngược và có rollback/cutover bằng feature flag. Không sửa/xóa migration lịch sử đã áp dụng.
11. Tuân thủ Ant Design migration và shared UI contracts hiện tại; giữ accessibility và keyboard navigation.
12. Không làm suy giảm workflow report, consultation, second read, viewer selection/deep-link hoặc unsaved changes guard.

PHẠM VI TRIỂN KHAI

A. Discovery và data dictionary
- Đọc tối thiểu các file sau và các dependency liên quan:
  - dashboard/lib/worklist/contract.ts
  - dashboard/lib/worklist/query-service.ts
  - dashboard/lib/worklist/query-builder.ts
  - dashboard/lib/worklist/facets.ts
  - dashboard/lib/worklist/url-state.ts
  - dashboard/app/components/workspace/StudyDataGrid.tsx
  - dashboard/app/components/workspace/regions/WorkspaceSearchBar.tsx
  - dashboard/app/components/workspace/regions/WorkQueueFacets.tsx
  - dashboard/app/components/workspace/regions/FacilityScopeTree.tsx
  - dashboard/app/components/workspace/regions/PatientStudyContextPanel.tsx
  - dashboard/lib/preferences/workspace-preferences.ts
  - dashboard/app/actions/workspace-preferences-actions.ts
  - dashboard/lib/workspace/study-workspace.ts
  - dashboard/prisma/schema.prisma
  - test hiện có quanh worklist, preference, selection, scope và workspace.
- Lập ma trận cho từng field: UI label, column ID, source table/relation/DICOM tag, type, nullable, fallback, quyền xem, sort/filter support và test fixture.
- Phân loại rõ: có sẵn; cần mapper/projection; cần schema/migration; hoặc bị chặn do chưa chốt nghiệp vụ.

B. Contract và read model P0
- Nâng version contract theo cách tương thích ngược.
- Bổ sung các field P0 đã có nguồn đáng tin cậy:
  patientBirthDate, patientSex, ageAtStudy, studyDate, machineName,
  patientId, accession/visit ID đã xác nhận, bodyPart,
  procedureDescription, diagnosis/clinicalInfo đã xác nhận,
  referringDepartment, referringPhysician,
  assignedDoctorName, technologistName,
  consultationStatus và reviewStatus nếu đã có nguồn.
- Tạo row mapper riêng, typed và có unit test.
- Tính tuổi tại thời điểm chụp; xử lý ngày sinh chưa đầy đủ/null an toàn.
- Chuẩn hóa date/time theo timezone bệnh viện và nguồn DICOM/HIS đúng.
- Chỉ thêm Prisma field/index khi chứng minh model hiện tại không lưu được dữ liệu nguồn.

C. Query, search và facets
- Hỗ trợ tìm theo PID, họ tên, accession và các định danh đã xác nhận.
- Hoàn thiện preset Hôm nay, Hôm qua, 7 ngày, 30 ngày và custom range trong URL state.
- Dùng facility/unit/machine tree theo authorization scope hiện tại.
- Compose các trạng thái hiển thị từ study/report/consultation/review hiện có:
  chưa đọc, đang đọc, đọc xong, đang hội chẩn, hội chẩn xong,
  đang duyệt, duyệt xong.
- Không tạo enum nguồn sự thật thứ hai nếu có thể derive.
- Giữ facet self-exclusion, count đúng scope, stable pagination và request cancellation/race safety.
- Chỉ thêm index sau khi có query plan hoặc benchmark chứng minh.

D. Data grid và column preferences
- Mở rộng `StudyDataGrid` bằng một column registry typed, ID ổn định.
- Hỗ trợ các cột theo plan; cột bị blocker có thể tồn tại ở trạng thái disabled/omitted kèm lý do, không hiển thị dữ liệu suy đoán.
- Cột mặc định ưu tiên vận hành: trạng thái nhanh, thời gian chụp, máy,
  PID/visit đã xác nhận, họ tên, tuổi, giới tính, modality,
  bộ phận, chỉ định, trạng thái và bác sĩ đọc.
- Có column chooser, bật/tắt, đổi thứ tự, resize, reset mặc định và density.
- Nâng preference schema version; migration preference cũ phải giữ được cấu hình hợp lệ.
- Sticky header, horizontal scroll/virtualization phù hợp, ellipsis + accessible tooltip,
  aria-sort, focus visible và keyboard row navigation.

E. Patient/study context panel
- Mở rộng `PatientStudyContextPanel` theo các nhóm Bệnh nhân, Chỉ định,
  Thực hiện, Báo cáo và Tích hợp.
- Giữ race-token hoặc cơ chế chống stale response khi đổi selection nhanh.
- Payload server phải lọc dữ liệu theo quyền trước khi gửi client; không chỉ ẩn bằng CSS.
- Selection/deep-link tiếp tục dựa trên Study Instance UID.

F. P1/P2
- Chỉ triển khai reviewer/conclusion/medical record/corporate exam khi có nguồn đã xác nhận.
- AI phải dùng contract typed:
  NOT_RUN | RUNNING | NORMAL | ABNORMAL | FAILED,
  kèm model/version, finding count/severity và timestamp nếu nguồn hỗ trợ.
- AI là thông tin hỗ trợ, không được trình bày như kết luận bác sĩ và lỗi AI không được chặn worklist.

G. Feature flag, telemetry và rollout
- Bọc đường đọc/UI mới bằng feature flag server-side tương thích cơ chế release-control hiện tại.
- Có telemetry đã scrub: latency, error, field-null rate, mapper conflict và facet mismatch;
  không log PHI/raw report.
- Chuẩn bị rollback chỉ bằng flag, không yêu cầu rollback dữ liệu ingest.

CÁCH THỰC HIỆN
1. Bắt đầu bằng việc khảo sát repository và viết checklist triển khai cụ thể.
2. Trước khi sửa code, báo cáo ngắn:
   - mapping field đã xác nhận;
   - các blocker cần người dùng xác nhận;
   - PR slices/file dự kiến;
   - migration có cần hay không.
3. Nếu không có blocker ngăn phần P0, tự tiếp tục triển khai theo các PR slice nhỏ, buildable.
4. Sau mỗi slice, chạy test liên quan trước khi chuyển bước.
5. Không bỏ qua lỗi có sẵn bằng cách nới type, dùng `any`, tắt lint/test hoặc xóa assertion.
6. Nếu phát hiện plan không đúng với code HEAD, ưu tiên code và invariant an toàn; cập nhật tài liệu giải thích sai khác.
7. Không commit secret, dữ liệu bệnh nhân thật, access token hoặc ảnh có PHI.

KIỂM THỬ/GATE TỐI THIỂU
- Unit test: mapper, age-at-study, date boundary/timezone, status composer,
  null fallback, preference migration.
- Contract/validation: version compatibility, allowlist sort/filter/column,
  date range và facet limits.
- Query test: cross-facility scope, machine tree, filter intersections,
  stable cursor, no duplicate/skip và constant query count.
- Security test: không rò row/facet/report conclusion/draft/AI ngoài quyền.
- UI test: column chooser/order/resize/reset, persistence, keyboard,
  loading/empty/error/stale và rapid selection race.
- Regression: report, consultation, second read, viewer launch/deep-link và dirty guard.
- Chạy các lệnh tương ứng của repository cho typecheck, lint, test,
  Prisma validate, build và UI style check. Đọc `dashboard/package.json` để dùng đúng script;
  không tự bịa tên script.
- Ghi benchmark/query-plan nếu thay đổi query/index.

DEFINITION OF DONE
- Các field P0 đã xác nhận có dữ liệu đúng nguồn và fallback rõ ràng.
- Không còn placeholder sai nguồn trên đường đọc mới.
- Rows, facets và counts tuân thủ cùng authorization scope.
- Preference cũ migrate an toàn; cấu hình cột lưu theo user.
- Panel không stale/race và không lộ dữ liệu trái quyền.
- Không N+1 và đạt mục tiêu P95 trong plan hoặc có evidence/blocker định lượng.
- Test/typecheck/lint/Prisma/build/a11y liên quan đều pass.
- Có feature flag, telemetry scrubbed và rollback runbook.
- Cập nhật checklist trong file plan và tạo một evidence report mới trong `docs/`
  gồm: files changed, field mapping cuối cùng, migration/index, test commands + kết quả,
  performance/security evidence, blocker còn lại và hướng rollback.

ĐẦU RA KHI HOÀN TẤT
Trả về:
1. Tóm tắt những gì đã triển khai theo từng slice.
2. Danh sách field đã hoàn thành và field còn blocker.
3. Danh sách file/migration đã thay đổi.
4. Lệnh test đã chạy và kết quả thực tế.
5. Rủi ro còn lại, feature flag/cách bật và lệnh/các bước rollback.
6. Đường dẫn evidence report.

Không tuyên bố hoàn thành nếu chỉ có UI, fixture giả hoặc test chưa chạy. Nếu một gate không thể chạy do môi trường, ghi rõ lệnh, lỗi thực tế và phần nào vẫn chưa được xác minh.
```