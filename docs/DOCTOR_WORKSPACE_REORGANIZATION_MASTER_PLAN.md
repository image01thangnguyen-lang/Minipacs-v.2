# Kế hoạch tổng thể tổ chức lại Không gian làm việc bác sĩ

Ngày lập: 2026-07-07  
Trạng thái: Đề xuất để thống nhất sản phẩm, UX và kỹ thuật trước khi triển khai  
Phạm vi chính: màn hình `Ca chụp` và chuẩn giao diện dùng chung cho các trang danh sách/lọc khác

## 1. Mục tiêu

Tổ chức lại màn hình `Ca chụp` thành một không gian làm việc tập trung để bác sĩ có thể tìm ca, quản lý hàng đợi, xem các ca liên quan và lập báo cáo mà không phải chuyển qua nhiều trang.

Kết quả cần đạt:

- Bám theo bố cục 7 khu vực trong ảnh tham chiếu.
- Giữ nguyên bảng màu dark teal hiện tại của dự án; không thực hiện một đợt đổi màu mới.
- Menu được sắp xếp thành cây và chỉ hiển thị những mục tài khoản có quyền truy cập.
- Danh sách ca chỉ trả về dữ liệu người dùng có quyền xem theo cơ sở, chuyên khoa và máy chụp.
- Quyền xem ca, đọc báo cáo, soạn báo cáo, duyệt/ký và các tác vụ nhạy cảm được kiểm tra ở máy chủ.
- Các trang danh sách/lọc khác sử dụng cùng hệ khung, thành phần và quy tắc tương tác để phần mềm có một ngôn ngữ giao diện thống nhất.

## 2. Quyết định nền tảng

1. `Ca chụp` tiếp tục là màn hình làm việc chính của bác sĩ.
2. Không đổi palette. Tiếp tục dùng các token `--vin-*` trong `dashboard/app/globals.css` và namespace `vin` trong Tailwind.
3. Dùng cơ sở dữ liệu RIS làm nguồn cho truy vấn danh sách, phân trang, lọc và phân quyền; Orthanc vẫn là nguồn ảnh và được đồng bộ vào RIS. Không gọi hàng loạt Orthanc cho mỗi lần bác sĩ đổi bộ lọc.
4. Phân quyền hiển thị ở giao diện chỉ là hỗ trợ UX. Máy chủ luôn là nơi quyết định cuối cùng.
5. Menu cây và bố cục mới không làm thay đổi URL hiện hữu trong đợt đầu, nhằm giảm rủi ro và giữ bookmark.
6. Không ép mọi trang thành bố cục 7 vùng. Các trang khác dùng chung app shell, thanh lọc, bảng, trạng thái và quy tắc responsive; chỉ màn hình bác sĩ cần đủ 7 vùng.

## 3. Hiện trạng và khoảng trống

| Hạng mục | Nền tảng hiện có | Khoảng trống cần xử lý |
| --- | --- | --- |
| Menu | `AppSidebar` lọc mục bằng global permission | Danh sách phẳng, nhiều nhãn tiếng Anh, chưa có nhóm cha/con và chưa có workspace switcher |
| Danh sách ca | Có tìm kiếm, modality, thời gian, trạng thái, máy, bác sĩ, HIS | Lọc chủ yếu ở trình duyệt sau khi tải toàn bộ; chưa có lọc cơ sở/chuyên khoa/hội chẩn đầy đủ |
| Bảng ca | Có chọn dòng, double-click mở viewer, trạng thái, người phụ trách, ảnh | Chưa tối ưu nhiều cột, chưa có cấu hình cột/pinned columns và chiến lược cuộn ngang rõ ràng |
| Ca liên quan | Đã nhóm theo `PatientID` trong tập dữ liệu đang tải | Có thể bỏ sót ca ngoài trang/phạm vi tải; cần truy vấn riêng có phân quyền |
| Báo cáo | Đã có mẫu, findings, conclusion, draft/final, in, HIS | Cần hoạt động ổn định trong split pane, cảnh báo dữ liệu chưa lưu và kiểm soát quyền theo từng ca |
| Cơ sở | `FacilityUnit` đã hỗ trợ quan hệ cha/con; máy có `facilityId` | Chưa chuẩn hóa cấp Chuỗi bệnh viện → Bệnh viện → Chuyên khoa/Khoa → Phòng/Máy trong worklist |
| Quyền chi tiết | Có global permissions và `DoctorMachinePermission` theo hành động/máy | `getStudies()` mới kiểm tra `studies.read`, chưa loại ca bị chặn trước khi trả dữ liệu; thiếu grant theo cơ sở/chuyên khoa |
| Hội chẩn | Có module và lifecycle hội chẩn | Chưa thành một facet lọc rõ ràng trong không gian làm việc bác sĩ |
| Tính đồng nhất | Đã có màu và một số component dùng chung | Mỗi trang còn tự dựng header, filter, table, empty/loading state và mật độ khác nhau |

## 4. Bố cục đích: 7 khu vực

```text
┌──────────────────────┬──────────────────────────────────────┬──────────────────────────┐
│ (1) Bộ chọn màn hình │ (2) Tìm kiếm + khoảng thời gian      │ Tài khoản / tác vụ chung │
├──────────────────────┼──────────────────────────────────────┼──────────────────────────┤
│ (4) Cơ sở            │                                      │                          │
│  Chuỗi bệnh viện     │ (5) Danh sách ca chụp               │ (7) Thông tin bệnh nhân  │
│   └ Bệnh viện        │  nhiều cột, sticky header,           │     + làm báo cáo        │
│      └ Chuyên khoa   │  cuộn ngang, chọn một ca             │                          │
│  Trạng thái hội chẩn │                                      │                          │
│                      ├──────────────────────────────────────┤                          │
│ (3) Trạng thái ca    │ (6) Ca liên quan của cùng bệnh nhân  │                          │
└──────────────────────┴──────────────────────────────────────┴──────────────────────────┘
```

### 4.1. Khu vực 1 — Bộ chọn màn hình theo quyền

- Hiển thị tên workspace hiện tại, ví dụ `Không gian đọc phim` hoặc `Ca chụp`.
- Khi bấm, mở menu cây có thể thu gọn/mở rộng.
- Chỉ render node lá mà tài khoản có quyền; node nhóm không có mục con hợp lệ phải tự ẩn.
- Nhớ trạng thái mở/đóng theo tài khoản.
- Hỗ trợ tìm nhanh menu khi số mục lớn.
- Mục đang active được đánh dấu rõ và có đường dẫn trực tiếp.

### 4.2. Khu vực 2 — Tìm kiếm và thời gian

- Tìm theo mã bệnh nhân, họ tên, accession/mã chỉ định và từ khóa dịch vụ.
- Chuẩn hóa tìm kiếm không phân biệt hoa/thường; có phương án bỏ dấu tiếng Việt ở phía máy chủ.
- Preset: Hôm nay, Hôm qua, 3 ngày, 7 ngày và Tùy chọn.
- Khoảng thời gian tùy chọn dùng `Từ ngày`/`Đến ngày`, có timezone bệnh viện rõ ràng.
- Đồng bộ bộ lọc vào URL để có thể bookmark/chia sẻ nội bộ.
- Debounce tìm kiếm; Enter chạy ngay; có nút xóa nhanh.

### 4.3. Khu vực 3 — Trạng thái ca chụp

- Hiển thị dạng checklist/facet kèm số lượng trong phạm vi hiện tại.
- Nhóm nghiệp vụ đề xuất:
  - Chờ thực hiện: Chờ chụp, Sẵn sàng chụp, Đang chụp.
  - Chờ xử lý ảnh: Đã nhận ảnh, Cần QC, Chụp lại.
  - Đọc và báo cáo: Chờ đọc, Đang đọc, Đã có bản nháp/báo cáo.
  - Hoàn tất: Đã ký/duyệt, Đã trả kết quả, Lưu trữ.
  - Ngoại lệ: Lỗi, quá SLA, chưa gán bác sĩ, ca của tôi.
- Không tạo một status model thứ hai; mapping trực tiếp từ `StudyStatus` và trạng thái báo cáo hiện hữu.

### 4.4. Khu vực 4 — Cơ sở, chuyên khoa và hội chẩn

- Cây phạm vi: `Chuỗi bệnh viện → Bệnh viện/Cơ sở → Khoa hoặc chuyên khoa → Phòng/Máy`.
- Cho phép chọn một hoặc nhiều node; chọn node cha bao gồm các node con được phép.
- Mỗi node hiển thị số ca sau khi đã áp quyền và khoảng thời gian.
- Bộ lọc hội chẩn là một facet riêng: Không yêu cầu, Chờ tiếp nhận, Đang hội chẩn, Đã kết thúc, Khẩn.
- Không hiển thị tên hoặc số lượng của node người dùng không có quyền, tránh rò rỉ metadata.
- Ca chưa ánh xạ được cơ sở/máy đi vào hàng đợi `Chưa phân loại`, mặc định chỉ admin/người quản trị dữ liệu nhìn thấy.

### 4.5. Khu vực 5 — Danh sách ca chụp

Các cột mặc định:

1. Số thứ tự/chọn dòng.
2. Trạng thái ca.
3. SLA/TAT hiện tại.
4. Mã chỉ định/accession.
5. Mã bệnh nhân.
6. Họ tên bệnh nhân.
7. Ngày sinh/giới tính.
8. Dịch vụ/chỉ định.
9. Modality.
10. Bệnh viện/cơ sở.
11. Chuyên khoa/khoa.
12. Phòng/máy.
13. Bác sĩ được gán/KTV.
14. Thời gian chụp.
15. Mức ưu tiên.
16. Trạng thái hội chẩn.
17. Trạng thái HIS.
18. Số ảnh.
19. Tác vụ.

Quy tắc bảng:

- Cột nhận diện quan trọng và cột tác vụ được ghim; các cột còn lại cuộn ngang.
- Header sticky; chọn dòng không bị mất khi cuộn.
- Cho phép đổi thứ tự, ẩn/hiện và thay đổi độ rộng cột; lưu preference theo tài khoản.
- Phân trang hoặc cursor pagination ở máy chủ; cân nhắc virtualization khi một trang trên 100 dòng.
- Một click: chọn ca và nạp vùng 6/7. Double-click: mở viewer. Menu ba chấm: tác vụ được phép.
- Badge màu chỉ hỗ trợ nhận biết; luôn có text/icon để không phụ thuộc duy nhất vào màu.
- Khi dữ liệu cập nhật, không tự đổi dòng đang chọn nếu người dùng đang nhập báo cáo.

### 4.6. Khu vực 6 — Các ca liên quan

- Truy vấn riêng theo định danh bệnh nhân chuẩn hóa, không lấy bằng cách lọc danh sách trang hiện tại.
- Mặc định hiển thị tất cả ca người dùng được phép xem của cùng bệnh nhân.
- Cho phép chọn phạm vi: Cùng lượt khám, 30 ngày, 1 năm, Tất cả.
- Có ngày chụp, modality, dịch vụ, cơ sở, trạng thái và bác sĩ báo cáo.
- Double-click mở viewer; có tác vụ so sánh ca hiện tại với ca trước khi viewer hỗ trợ.
- Không trả về ca ở cơ sở/chuyên khoa ngoài phạm vi quyền.

### 4.7. Khu vực 7 — Thông tin bệnh nhân và làm báo cáo

- Header gọn: bệnh nhân, mã, tuổi/giới, ưu tiên, chỉ định, lâm sàng, cơ sở/máy, bác sĩ/KTV.
- Tác vụ hội chẩn, second read, mở viewer và key image đặt gần ngữ cảnh bệnh nhân.
- Mẫu báo cáo, kỹ thuật, mô tả tổn thương, kết luận và khuyến nghị dùng workflow hiện hữu.
- Footer sticky chứa Lưu nháp, Ký, Duyệt, Gửi HIS/In theo đúng quyền và trạng thái.
- Có autosave bản nháp theo chu kỳ và trạng thái `Đang lưu/Đã lưu/Lỗi lưu`.
- Khi đổi ca, đóng panel hoặc rời trang trong lúc có thay đổi chưa lưu, phải cảnh báo.
- Nếu chỉ có quyền xem, editor chuyển read-only và không render tác vụ sửa/ký.
- Quyền `soạn`, `ký`, `duyệt`, `hủy duyệt`, `gửi HIS` được kiểm tra lại theo ca ở máy chủ.

## 5. Cấu trúc menu cây và bản dịch đề xuất

Tên nhóm chỉ dùng để tổ chức, không nhất thiết tạo route mới.

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
│  ├─ Chính sách lưu giữ
│  ├─ Sao lưu & khôi phục
│  └─ Yêu cầu xóa dữ liệu
└─ Vận hành & an toàn
   ├─ Trung tâm vận hành
   ├─ Kết nối máy trạm
   ├─ Quản lý phiên bản
   ├─ Đào tạo
   ├─ Sự cố
   ├─ Yêu cầu thay đổi
   └─ Quy trình vận hành

Tài khoản cá nhân
└─ Hồ sơ & bảo mật tài khoản
```

Mapping route hiện tại:

| Nhãn tiếng Việt | Route hiện tại | Permission tối thiểu |
| --- | --- | --- |
| Ca chụp | `/` | `studies.read` |
| Tiếp đón & danh sách chỉ định | `/worklist` | `worklist.manage` |
| Ca ngoài DICOM | `/non-dicom` | `nonDicom.read` |
| Hội chẩn | `/consultations` | `consult.read` |
| Lưu trữ & trả kết quả | `/archive` | `archive.read` |
| Trung tâm điều hành | `/command-center` | `commandCenter.read` |
| Thống kê | `/statistics` | `statistics.read` |
| Mẫu nội dung báo cáo | `/settings/report-templates` | `templates.manage` |
| Mẫu phiếu in | `/admin/templates` | quyền quản lý mẫu phù hợp |
| Hồ sơ đơn vị | `/settings/clinic-profile` | `clinic.manage` |
| Danh mục chuyên môn | `/admin/catalogs` | `admin.catalogs` |
| Máy chụp & PACS | `/admin/pacs/nodes` | `pacs.manage` |
| Tích hợp HIS | `/admin/his` | `his.manage` |
| Ma trận quyền theo máy | `/admin/permissions/matrix` | `admin.permissions` |
| Người dùng & vai trò | `/admin/users` | `users.manage` |
| Chính sách lưu giữ | `/admin/retention` | `retention.read` |
| Sao lưu & khôi phục | `/admin/backup` | `backup.read` |
| Yêu cầu xóa dữ liệu | `/admin/destructive` | `destructive.audit` hoặc quyền tương ứng |
| Trung tâm vận hành | `/admin/ops` | `ops.health` |
| Kết nối máy trạm | `/admin/native` | `native.manage` |
| Quản lý phiên bản | `/admin/release` | `release.read` |
| Đào tạo | `/admin/training` | `training.read` |
| Sự cố | `/support/incidents` | `incident.read` |
| Yêu cầu thay đổi | `/admin/changes` | `change.read` |
| Quy trình vận hành | `/admin/runbooks` | `runbook.read` |
| Hồ sơ & bảo mật tài khoản | `/settings/account` | `account.selfManage` |

Lưu ý: cần tách quyền quản lý `Mẫu phiếu in` khỏi `admin.catalogs` nếu muốn ủy quyền độc lập; không dùng nhãn kỹ thuật như `Retention`, `Destructive`, `Ops Center`, `Native Bridge`, `Release Center`, `Runbooks` ở giao diện tiếng Việt.

## 6. Mô hình phân quyền đích

Một ca chỉ xuất hiện và một tác vụ chỉ chạy khi đồng thời thỏa các lớp sau:

```text
Đăng nhập hợp lệ
  ∧ global permission
  ∧ quyền phạm vi dữ liệu
  ∧ quyền hành động theo máy/đơn vị
  ∧ trạng thái workflow cho phép
= Cho phép
```

### 6.1. Phạm vi dữ liệu

Chuẩn hóa grant theo các cấp:

- Toàn chuỗi.
- Bệnh viện/cơ sở.
- Khoa/chuyên khoa.
- Phòng/máy (`DicomNode`).

Mỗi grant cần mô tả tối thiểu: người dùng/role profile, scope type, scope id, capability, allow/deny, hiệu lực và người cập nhật. Cây `FacilityUnit` hiện có được tái sử dụng; `DicomNode` là lá thiết bị.

Capability tối thiểu cho màn hình này:

- `VIEW_CASE`: thấy ca trong danh sách và ca liên quan.
- `READ_REPORT`: xem nội dung báo cáo.
- `DRAFT_REPORT`: tạo/sửa bản nháp.
- `SIGN_REPORT`: ký/chốt theo mô hình một bước.
- `APPROVE_REPORT`: duyệt theo mô hình hai bước.
- `UNFINALIZE_REPORT`, `DELIVER_RESULT`, `SYNC_HIS`, `CONSULT`.

### 6.2. Quy tắc ưu tiên

- Explicit deny thắng allow.
- Quyền node con cụ thể hơn quyền node cha.
- Không có grant thì không suy diễn quyền xem dữ liệu nhạy cảm.
- Admin bypass phải rõ ràng, được audit và không dùng như giải pháp cho dữ liệu chưa phân loại.
- Ca thiếu `stationAeTitle` hoặc không map được facility không được fail-open cho toàn bộ người dùng.
- API list, count facet, related studies, export và mọi action phải dùng cùng resolver để không lệch quyền.

### 6.3. Khoảng trống cần đóng ngay

`getStudies()` hiện mới yêu cầu `studies.read`, sau đó tải/enrich toàn bộ ca. Trước khi phát hành giao diện mới phải chuyển sang truy vấn đã áp scope ở máy chủ. Không được tải dữ liệu vượt quyền xuống trình duyệt rồi mới ẩn bằng filter.

## 7. Hợp đồng dữ liệu và API

Đề xuất tách các server query rõ trách nhiệm:

- `getStudyWorklist(query)`: search, date range, statuses, scope ids, consultation statuses, priority, doctor, HIS, sort, cursor/page và column set.
- `getStudyFacets(queryWithoutFacet)`: count theo status, facility tree, specialty và consultation status sau khi áp quyền.
- `getRelatedStudies(studyUid, range)`: lịch sử bệnh nhân đã áp quyền.
- `getStudyWorkspace(studyUid)`: thông tin bệnh nhân, ca, report, template suggestions và allowed actions.
- `saveUserWorkspacePreference(payload)`: cột, độ rộng panel, filter preset, trạng thái menu.

Response của mỗi dòng nên trả `allowedActions` đã tính ở máy chủ. Giao diện dùng dữ liệu này để render nút, nhưng action endpoint vẫn kiểm tra lại.

Yêu cầu kỹ thuật:

- Có schema validation cho query và response quan trọng.
- Sort ổn định bằng cặp khóa, ví dụ `studyDate desc, id desc`.
- Count facet không tiết lộ node ngoài quyền.
- Hủy request cũ khi người dùng đổi filter nhanh.
- Cache metadata ít thay đổi như cây cơ sở, nhưng không cache lẫn dữ liệu giữa các user scope.
- Log thời gian truy vấn và lỗi; không log tràn PHI.

## 8. Responsive và khả năng sử dụng

Mục tiêu chính là desktop y khoa có màn hình rộng.

- Từ 1600 px: hiển thị đủ 3 cột, cho phép kéo splitter.
- 1280–1599 px: menu/filter trái có thể thu gọn; vùng báo cáo giữ tối thiểu khoảng 380 px.
- 1024–1279 px: vùng báo cáo mở dạng drawer hoặc tab; danh sách vẫn là vùng chính.
- Dưới 1024 px: hỗ trợ tra cứu/tác vụ cơ bản, không coi là môi trường tối ưu để lập báo cáo dài.
- Lưu kích thước panel theo user; cung cấp nút `Khôi phục bố cục mặc định`.
- Thứ tự tab, focus ring, tooltip, aria-label và thao tác bàn phím phải hoạt động.
- Mật độ dòng có ít nhất hai mức `Gọn` và `Thoải mái`.

## 9. Chuẩn hóa các trang khác

Tạo bộ khung/thành phần dùng chung:

- `AppShell` và `PermissionAwareNavigationTree`.
- `PageHeader`/`WorkspaceHeader`.
- `FilterBar`, `SearchField`, `DateRangePreset` và `FacetPanel`.
- `DataGrid` với sticky header, horizontal scroll, column preference và loading skeleton.
- `StatusBadge` dùng chung mapping nghiệp vụ.
- `SplitPane`, `EmptyState`, `ErrorState`, `AccessDeniedState`.
- `ActionMenu` và dialog xác nhận có reason/audit khi cần.
- Quy ước typography, spacing, row height, button hierarchy và form validation.

Thứ tự đồng bộ sau màn hình bác sĩ:

1. Lưu trữ & trả kết quả.
2. Tiếp đón & danh sách chỉ định.
3. Hội chẩn.
4. Ca ngoài DICOM.
5. Thống kê/Trung tâm điều hành ở phần drill-down list.
6. Các trang danh mục và quản trị có bảng/lọc.

## 10. Kế hoạch triển khai theo phase

### Phase 0 — Chốt hợp đồng UX và baseline

Mục tiêu: thống nhất trước khi sửa luồng đang dùng.

- Chốt wireframe 7 vùng ở các breakpoint.
- Chốt menu cây, nhãn tiếng Việt và route mapping.
- Chốt danh sách cột mặc định, cột ghim và preset bộ lọc.
- Chốt taxonomy `FacilityUnit.type` và mapping máy/cơ sở hiện hữu.
- Lập dữ liệu mẫu cho nhiều bệnh viện, chuyên khoa, bác sĩ và quyền giao nhau.
- Ghi baseline hiệu năng và ảnh chụp giao diện hiện tại.

Đầu ra: wireframe được duyệt, menu map, data dictionary và test matrix.  
Điều kiện hoàn thành: không còn thuật ngữ hoặc phạm vi quyền mơ hồ ảnh hưởng kiến trúc.

### Phase 1 — App shell và menu cây

Mục tiêu: tạo khung điều hướng chung nhưng chưa thay đổi nghiệp vụ ca chụp.

Kế hoạch triển khai chi tiết: [DOCTOR_WORKSPACE_PHASE1_APP_SHELL_NAVIGATION_PLAN.md](./DOCTOR_WORKSPACE_PHASE1_APP_SHELL_NAVIGATION_PLAN.md).

- Chuyển cấu hình menu phẳng thành registry có `group`, `parent`, `label`, `href`, `permission`.
- Xây workspace switcher/menu cây, trạng thái mở/đóng và active route.
- Dịch toàn bộ nhãn người dùng sang tiếng Việt chuẩn.
- Dùng shell mới cho các route chính; giữ route cũ.
- Thêm test cho ẩn node cha khi không có child được phép.

Đầu ra: menu cây dùng chung.  
Điều kiện hoàn thành: các role chỉ thấy đúng mục, deep link vẫn hoạt động và không có trang bị mất đường truy cập.

### Phase 2 — Phân quyền phạm vi và cây tổ chức

Mục tiêu: khóa đúng dữ liệu trước khi làm worklist mới.

- Chuẩn hóa cây Chuỗi → Bệnh viện → Khoa/Chuyên khoa → Phòng/Máy.
- Bổ sung access grant theo scope/capability và migration dữ liệu.
- Xây một authorization resolver dùng chung cho list, facet, detail, related cases và actions.
- Tích hợp `DoctorMachinePermission`; xử lý explicit deny và ca chưa phân loại.
- Thêm audit cho thay đổi quyền, test chống rò rỉ dữ liệu giữa bệnh viện.

Đầu ra: lớp phân quyền theo phạm vi ở máy chủ.  
Điều kiện hoàn thành: không API nào trong workspace trả ca/metadata vượt quyền.

### Phase 3 — Worklist query, bộ lọc và bảng nhiều cột

Mục tiêu: thay tải toàn bộ + lọc client bằng truy vấn nhanh, chính xác.

- Xây API/query có search, date, status, facility, specialty, consultation, priority, doctor, HIS.
- Thêm server pagination/cursor, sorting và facet counts.
- Xây bảng có sticky/pinned columns, cuộn ngang, column chooser và preference.
- Đồng bộ filter/sort/selected study vào URL phù hợp.
- Bổ sung loading, empty, error, partial-sync và reconnect state.

Đầu ra: khu vực 2, 3, 4 và 5 hoạt động trên dữ liệu thật.  
Điều kiện hoàn thành: lọc đúng, không rò quyền, giữ tương tác mượt với tập dữ liệu UAT lớn.

### Phase 4 — Bố cục 7 vùng và ca liên quan

Mục tiêu: ghép thành không gian làm việc giống ảnh tham chiếu.

- Dựng CSS grid/split panes cho 7 khu vực.
- Cho phép thu gọn menu/filter, kéo độ rộng danh sách và report.
- Thêm truy vấn ca liên quan độc lập theo bệnh nhân và phạm vi thời gian.
- Giữ selection khi refresh/pagination hợp lệ; deep link vào một ca.
- Xử lý một click, double-click, keyboard navigation và focus.

Đầu ra: workspace tổng thể hoàn chỉnh về bố cục.  
Điều kiện hoàn thành: chọn ca cập nhật đúng vùng 6/7 và không làm nhảy/mất trạng thái không cần thiết.

### Phase 5 — Tích hợp báo cáo và hội chẩn trong workspace

Mục tiêu: bác sĩ hoàn tất công việc tại khu vực 7.

- Tái sử dụng report workflow hiện có trong panel mới.
- Thêm autosave status, dirty guard và read-only mode.
- Hiển thị `allowedActions` theo ca; kiểm tra lại ở server cho lưu/ký/duyệt/HIS.
- Đưa hội chẩn, second read, key image và viewer vào đúng ngữ cảnh.
- Kiểm thử cạnh tranh chỉnh sửa, đổi ca khi chưa lưu, session hết hạn và lỗi HIS.

Đầu ra: luồng đọc–soạn–ký/duyệt an toàn.  
Điều kiện hoàn thành: không mất bản nháp, không thực thi tác vụ vượt quyền và lifecycle report không bị thay đổi ngoài chủ đích.

### Phase 6 — Đồng nhất các trang danh sách/lọc

Mục tiêu: đưa ngôn ngữ giao diện mới ra toàn ứng dụng.

- Trích xuất component chung từ workspace đã ổn định.
- Chuyển lần lượt Archive, Worklist, Consultations, Non-DICOM rồi các trang admin.
- Chuẩn hóa toolbar, filter reset, saved views, table density, status, empty/error/loading.
- Loại bỏ component trùng lặp và màu hardcode mới phát sinh.

Đầu ra: hệ UI nhất quán.  
Điều kiện hoàn thành: các trang danh sách dùng cùng quy tắc mà không làm mất chức năng riêng.

### Phase 7 — Hiệu năng, UAT và phát hành kiểm soát

Mục tiêu: phát hành an toàn cho môi trường y tế.

- Test quyền theo role × cơ sở × chuyên khoa × máy × hành động.
- Test tập dữ liệu lớn, latency cao, Orthanc/HIS gián đoạn và nhiều user đồng thời.
- Kiểm tra accessibility, bàn phím, màn hình 1280/1440/1920/2560.
- Theo dõi query latency, error rate, autosave failure và time-to-first-worklist.
- Feature flag, pilot một nhóm bác sĩ, thu phản hồi rồi rollout theo bệnh viện.
- Có rollback plan không mất draft hoặc preference.

Đầu ra: bản phát hành được ký UAT và có giám sát.  
Điều kiện hoàn thành: đạt tiêu chí chức năng, bảo mật, hiệu năng và vận hành bên dưới.

## 11. Các lát cắt triển khai/PR đề xuất

1. Menu registry + bản dịch + test visibility.
2. Shared app shell + workspace switcher.
3. Facility taxonomy/migration + admin validation.
4. Access scope model + resolver + audit.
5. Worklist query contract + permission tests.
6. Filter/facet store + URL state.
7. Data grid + column preferences.
8. Seven-region layout + persisted splitters.
9. Related-study endpoint/panel.
10. Report panel dirty guard/autosave/read-only.
11. Consultation facet/actions.
12. Archive/Worklist adoption of shared list UI.
13. UAT fixtures, performance and rollout flags.

Mỗi PR cần nhỏ, có thể rollback và không trộn migration quyền với thay đổi giao diện lớn trong cùng một lần phát hành.

## 12. Tiêu chí nghiệm thu trọng yếu

### Phân quyền

- Bác sĩ bệnh viện A không thấy tên, count, ca liên quan hoặc kết quả của bệnh viện B nếu không có grant.
- Quyền xem ca không tự cấp quyền đọc báo cáo.
- Quyền đọc báo cáo không tự cấp quyền sửa, ký hoặc duyệt.
- Explicit deny theo máy chặn cả list visibility/action theo capability tương ứng.
- API/action bị gọi thủ công vẫn trả từ chối đúng chuẩn và có audit phù hợp.

### Menu

- Mỗi tài khoản chỉ thấy menu có quyền.
- Nhóm không có mục con được phép tự ẩn.
- Nhãn hoàn toàn bằng tiếng Việt chuẩn, ngoại trừ tên chuẩn cần giữ kèm chú thích như DICOM/HIS/PACS.
- Refresh/deep link giữ đúng active item.

### Danh sách và bộ lọc

- Kết hợp tìm kiếm + thời gian + trạng thái + cơ sở + chuyên khoa + hội chẩn trả đúng giao của các điều kiện.
- Count facet khớp danh sách và chỉ tính dữ liệu trong quyền.
- Bảng cuộn ngang nhưng vẫn giữ cột định danh và tác vụ cần thiết.
- Preference cột và panel được khôi phục đúng theo user.

### Ca liên quan và báo cáo

- Ca liên quan không phụ thuộc trang danh sách hiện tại.
- Đổi ca có thay đổi chưa lưu phải cảnh báo.
- Lỗi autosave được hiển thị và không giả báo `Đã lưu`.
- User read-only không thể sửa qua UI hoặc gọi action trực tiếp.
- Ký/duyệt/HIS tuân thủ đúng status transition và audit hiện hữu.

### Hiệu năng mục tiêu ban đầu

- First worklist hữu dụng: mục tiêu P95 dưới 2 giây trong mạng nội bộ UAT.
- Đổi filter/page: mục tiêu P95 dưới 1 giây với index phù hợp.
- Chọn ca và hiển thị metadata cơ bản: mục tiêu P95 dưới 1 giây; editor/report nặng có thể nạp tiếp theo.
- Không có truy vấn N+1 theo từng dòng ca hoặc từng node facility.

Các con số phải được đo lại trên hạ tầng thật trước khi ký SLA sản phẩm.

## 13. Rủi ro và cách giảm thiểu

| Rủi ro | Giảm thiểu |
| --- | --- |
| Permission UI và API lệch nhau | Một resolver dùng chung; contract test cho list/detail/action |
| Facility/máy chưa được map đầy đủ | Hàng đợi `Chưa phân loại`, dashboard chất lượng dữ liệu, không fail-open |
| Tải Orthanc chậm khi mở worklist | Đồng bộ metadata nền vào RIS; chỉ gọi Orthanc khi cần ảnh/detail |
| Bảng quá nhiều cột khó đọc | Preset cột theo vai trò, pinned columns, column chooser, density switch |
| Mất bản nháp khi đổi ca | Autosave, dirty guard, request cancellation và conflict handling |
| Thay menu làm user lạc đường | Giữ route, search menu, pilot, hướng dẫn ngắn trong lần đầu |
| Chuẩn hóa UI gây scope creep | Chốt component từ trang bác sĩ trước; migrate từng module theo phase |

## 14. Ngoài phạm vi của kế hoạch này

- Đổi bảng màu/thương hiệu.
- Thiết kế lại OHIF Viewer hoặc công cụ chẩn đoán ảnh.
- Thay đổi bản chất workflow/status đã được chốt trong tài liệu workflow policy.
- Xây mới HIS, video conference hoặc AI; kế hoạch này chỉ tích hợp điểm vào workspace.
- Tối ưu trải nghiệm lập báo cáo đầy đủ trên điện thoại.

## 15. Điểm chạm code dự kiến

Các file hiện hữu chính:

- `dashboard/app/components/AppSidebar.tsx`: chuyển từ menu phẳng sang menu registry/cây hoặc được thay bởi component mới.
- `dashboard/app/page.tsx`: tách màn hình nguyên khối thành workspace composition và các panel.
- `dashboard/app/actions.ts`: thay `getStudies()` bằng query có scope, filter và pagination ở máy chủ.
- `dashboard/lib/permissions.ts`, `dashboard/lib/authz.ts`: giữ global permission và kết nối resolver phạm vi mới.
- `dashboard/lib/authz/machine-permissions.ts`: thống nhất precedence và loại bỏ fail-open cho visibility nhạy cảm.
- `dashboard/prisma/schema.prisma`: bổ sung access grants/user preferences và index cần thiết; tái sử dụng `FacilityUnit`, `DicomNode`, `Consultation`.
- `dashboard/app/globals.css`, `dashboard/tailwind.config.js`: chỉ bổ sung token layout/density nếu cần, không đổi palette.

Component mới đề xuất:

```text
dashboard/app/components/navigation/
  NavigationRegistry.ts
  PermissionAwareNavigationTree.tsx
  WorkspaceSwitcher.tsx

dashboard/app/components/workspace/
  DoctorWorkspace.tsx
  WorkspaceSearchBar.tsx
  WorkQueueFacets.tsx
  FacilityScopeTree.tsx
  StudyDataGrid.tsx
  RelatedStudiesPanel.tsx
  ReportWorkspacePanel.tsx

dashboard/app/components/ui/
  SplitPane.tsx
  DataGrid.tsx
  StatusBadge.tsx
  EmptyState.tsx
  ErrorState.tsx
```

Tên chính xác có thể đổi khi triển khai, nhưng ranh giới trách nhiệm cần được giữ để tránh đưa toàn bộ logic trở lại một file `page.tsx` lớn.

## 16. Điều kiện bắt đầu và thứ tự bắt buộc

Có thể bắt đầu Phase 0 và Phase 1 ngay. Phase 3/4 không nên phát hành trước Phase 2 vì giao diện mới sẽ làm phạm vi dữ liệu dễ quan sát hơn trong khi quyền hiện tại chưa lọc đầy đủ ở server.

Thứ tự bắt buộc:

```text
UX/menu contract
  → permission scope
  → server worklist query
  → seven-region workspace
  → report integration
  → cross-page standardization
  → UAT/rollout
```
