# Kế hoạch custom OHIF Viewer theo phong cách VR-PACS workstation

Ngày cập nhật: 2026-06-22

## Cập nhật triển khai 2026-06-22: Giai đoạn 1-3

Kết quả audit repo hiện tại:

- Viewer đang chạy từ Docker image `ohif/viewer:latest`.
- Repo hiện chưa có source OHIF `platform/app`, `extensions`, `modes`, nên chưa thể tạo custom `mode/extension` đúng chuẩn ngay trong codebase này.
- Docker Compose đã mount sẵn `config/ohif-custom.css` và `config/ohif-custom.js` vào OHIF, vì vậy Giai đoạn 1-3 được triển khai trước bằng runtime custom shell để mở viewer custom được ngay.

Phạm vi đã triển khai cho MVP workstation shell:

- Shell tự kích hoạt trên route `/viewer` và `/viewer/:StudyInstanceUID`.
- Top toolbar kiểu workstation với nhóm tool chính: Select, Window/Level, Zoom, Pan, Stack, Layout, Measurement, Cine, Annotation, Reset.
- Cụm action bên phải: Capture, Print, Report, Close.
- Left tool palette dạng accordion: History, Layout, Measurement Tools, Advanced Tools, Image Tools, Sync Tools.
- Giữ nguyên luồng mở viewer hiện tại từ dashboard: `http://<host>:3000/viewer/<StudyInstanceUID>`.
- Một số nút tool sẽ cố gắng gọi native OHIF button bằng label nếu button có sẵn trong DOM; các nút chưa có command thật đóng vai trò shell/UI skeleton cho các giai đoạn sau.

Giới hạn cần nhớ:

- Đây là bước runtime shell MVP để có trải nghiệm viewer custom sớm, chưa thay thế kế hoạch dài hạn dùng OHIF mode/extension.
- Khi bổ sung source/fork OHIF vào repo, cần chuyển logic toolbar/panel này sang extension `@minipacs/extension-workstation-ui` và mode `@minipacs/mode-workstation`.

## Cập nhật triển khai 2026-06-22: Giai đoạn 4-6

Phạm vi đã triển khai tiếp trong runtime workstation shell:

- Thêm series strip nằm giữa tool palette và viewport.
- Series strip đọc danh sách series thật từ Orthanc DICOMweb qua `/dicom-web/studies/:StudyInstanceUID/series`.
- Mỗi series hiển thị modality, mô tả series, series number, số ảnh và body part nếu DICOM tag có dữ liệu.
- Click series cập nhật active series trong shell và cố gắng kích native series/thumbnail của OHIF nếu tìm được element phù hợp.
- Layout controls `1x1`, `1x2`, `2x1`, `2x2` có active state, layout badge trên topbar và cố gắng gọi native layout menu/button của OHIF.
- Thêm CSS fallback theo `data-mpacs-layout` để hỗ trợ grid nếu DOM OHIF hiện tại cho phép override.
- Thêm viewport overlay nhẹ: series index, image count, mô tả series, body part, layout, zoom/WW-WL placeholder.
- Thêm mini toolbar cạnh viewport: Fit, Fullscreen, Window/Level, Link, Capture. Các nút này cố gắng gọi native OHIF commands theo label.

Giới hạn cần nhớ:

- Series strip hiện đọc được metadata DICOMweb, nhưng chưa gán display set trực tiếp bằng `DisplaySetService` vì repo chưa có OHIF source/runtime service access.
- Overlay zoom và WW/WL hiện là placeholder vì cần viewport wrapper/Cornerstone viewport service để đọc state chính xác.
- Layout thật vẫn phụ thuộc native OHIF layout command có trong DOM; bản mode/extension chuẩn cần dùng `HangingProtocolService` và `ViewportGridService`.

## Cập nhật triển khai 2026-06-22: Giai đoạn 7-10

Phạm vi đã triển khai tiếp trong runtime workstation shell:

- Viewport overlay có status strip hiển thị active tool, sync state, cine state và command feedback.
- Mini toolbar cạnh viewport tiếp tục bridge các lệnh Fit, Fullscreen, Window/Level, Link, Capture.
- Thêm cine HUD dưới viewport với Previous frame, Play/Pause, Next frame.
- Thêm sync toggles có state riêng cho Scroll, W/L và Zoom/Pan; nút Unlink tắt toàn bộ sync state.
- Topbar có sync badge để thấy nhanh trạng thái sync đang bật/tắt.
- Tool buttons cập nhật active state ổn định hơn, không phụ thuộc hoàn toàn vào việc OHIF native command có chạy được hay không.
- Thêm hotkeys runtime:
  - `W`: Window/Level.
  - `Z`: Zoom.
  - `P`: Pan.
  - `S`: Stack scroll.
  - `L`: Length.
  - `A`: Angle.
  - `R`: Reset.
  - `F`: Fullscreen.
  - `C`: Capture.
  - `Space`: Cine play/pause.
  - `1`, `2`, `3`, `4`: layout `1x1`, `1x2`, `2x1`, `2x2`.
- Hotkeys tự bỏ qua khi focus đang ở input, textarea, select hoặc contenteditable.

Giới hạn cần nhớ:

- Cine control hiện là bridge command theo label; để chạy frame/cine chính xác theo từng viewport cần Cornerstone viewport/stack service.
- Sync state hiện là UI/runtime state và cố gọi native command nếu tìm được; bản chuẩn cần dùng `SyncGroupService`.
- Measurement persistence, key image, audit export/capture vẫn cần API Minipacs và OHIF service access, chưa nên lưu giả từ DOM.
- QA hiệu năng lâm sàng vẫn cần test trên Ubuntu với Docker/Orthanc thật và dataset US/DX/CT/MR thật.

## 1. Kết luận ngắn

OHIF có thể custom được rất gần bố cục viewer trong ảnh tham chiếu, nhưng nên làm bằng `mode` và `extension` riêng thay vì CSS/DOM patch trên bản OHIF build sẵn.

Mức khả thi thực tế:

- Bố cục toolbar trên cùng, left tool palette, series strip, multi-viewport: khả thi cao.
- Tool groups đo đạc, image tools, sync tools, layout tools: khả thi cao nếu tận dụng Cornerstone/OHIF commands.
- Overlay viewport như `Series Index`, `Image 1/15`, zoom, WW/WL, active border vàng, mini toolbar bên phải viewport: khả thi cao, cần custom viewport wrapper.
- History theo lần chụp, badge modality, link report/file, export/capture/print: khả thi cao nhưng cần API từ RIS/Minipacs.
- Workflow giống hoàn toàn workstation thương mại, ví dụ tool icon/behavior 1:1, advanced ultrasound/cine/timeline rất đặc thù: khả thi trung bình, cần làm từng phần và test kỹ với dữ liệu DICOM thật.

Khuyến nghị: xây một custom OHIF mode tên tạm `minipacs-workstation` và một extension tên tạm `@minipacs/extension-workstation-ui`.

## 2. Cơ sở kỹ thuật từ OHIF

OHIF v3 được thiết kế để mở rộng bằng `extensions` và `modes`. Tài liệu OHIF nêu rõ kiến trúc v3 nhằm tránh phải hard fork khi muốn thay đổi toolbar/tool/workflow, và các module extension có thể cung cấp `LayoutTemplate`, `Panel`, `Viewport`, `Commands`, `Toolbar`, `HangingProtocol`... Đây là đúng các điểm cần để làm viewer như ảnh.

Nguồn chính:

- OHIF Extensions: https://docs.ohif.org/platform/extensions/
- OHIF Modes: https://docs.ohif.org/platform/modes/
- Toolbar Service: https://docs.ohif.org/platform/services/data/toolbarservice/
- Hanging Protocol Service: https://docs.ohif.org/platform/services/data/hangingprotocolservice/
- Sync Group Service: https://docs.ohif.org/platform/services/data/syncgroupservice/
- Viewport Module: https://docs.ohif.org/platform/extensions/modules/viewport/

Các ý quan trọng:

- `Mode` có thể định nghĩa route, layout, left/right panels, viewports, hanging protocol, hotkeys và toolbar sections.
- `Extension` có thể thêm panel, toolbar buttons, command module, viewport wrapper, hanging protocol, SOP class handler.
- `ToolbarService` hỗ trợ add/set/remove button, tạo section, nested/split button và command khi click.
- `HangingProtocolService` điều khiển cách sắp xếp display set vào viewport, phù hợp cho layout 1x1, 1x2, 2x1, US comparison, prior/current.
- `SyncGroupService` hỗ trợ sync viewport theo camera position, VOI/window-level, zoom/pan, image slice position.
- `ViewportModule` cho phép đăng ký React viewport component, nghĩa là có thể wrap Cornerstone viewport để thêm overlay và mini toolbar.

## 3. Đánh giá các thành phần trong ảnh

## 3.1 Top header / toolbar

Trong ảnh:

- Brand `VR-PACS VIEWER`.
- Toolbar icon dày: pointer, window/level, zoom, pan, stack/layers, ruler, 3D, play/cine, annotation, undo, share, print, video, report, history, close.
- Toolbar đặt ngang phía trên, icon trắng/xám, active tool nền xanh.

Khả thi trong OHIF:

- Làm được bằng `ToolbarModule` + `ToolbarService`.
- Các tool image/measurement cơ bản nên gọi command có sẵn từ Cornerstone extension.
- Các nút nghiệp vụ như share, print, report, history nên là custom command gọi API RIS/Minipacs hoặc mở modal/panel.

Rủi ro:

- Nếu ép quá nhiều icon vào `primary` toolbar mặc định, responsive có thể vỡ.
- Nên tạo toolbar layout riêng trong custom layout template hoặc custom header component thay vì nhồi hết vào toolbar mặc định.

## 3.2 Left sidebar tool palette

Trong ảnh:

- Accordion group: `History`, `Layout`, `Measurement Tools`, `Advance Tools`, `Image Tools`, `Sync Tools`.
- Mỗi group có icon grid/dense.
- History có danh sách lần chụp theo modality/date.

Khả thi trong OHIF:

- Làm tốt bằng custom `PanelModule`.
- Panel này có thể thay thế left panel mặc định hoặc nằm cạnh series browser.
- Các nút trong panel gọi `commandsManager.runCommand(...)`.

Phần cần API riêng:

- `History`: cần API từ RIS để lấy các study trước theo `patientId`, `accessionNumber`, `StudyInstanceUID`, modality, ngày chụp.
- Badge số lượng series/images cần lấy từ DICOM metadata hoặc RIS index.

## 3.3 Series strip / thumbnail column

Trong ảnh:

- Cột thumbnail series nằm sát viewport.
- Mỗi thumbnail có title, số image, active border vàng/cam.
- Có mục file/report Word.

Khả thi trong OHIF:

- OHIF đã có Study/Series browser, có thể custom panel lại.
- Nên viết `MiniPacsSeriesStrip` dùng `DisplaySetService`/metadata store để đọc display sets.
- Report/file Word không phải DICOM image, nên lấy từ RIS API và render thành item riêng.

Rủi ro:

- Nếu dùng trực tiếp component series browser mặc định thì khó giống ảnh 1:1.
- Nên custom panel nhỏ, giữ logic kéo/thả display set vào viewport.

## 3.4 Multi-viewport layout

Trong ảnh:

- Layout 1x2, hai viewport cạnh nhau.
- Active viewport border vàng.
- Header overlay từng viewport có time, series index, image count.

Khả thi trong OHIF:

- Layout 1x1, 1x2, 2x1, 2x2 làm được bằng viewport grid và hanging protocol.
- Rule tự mở 1x2 cho US comparison hoặc study có nhiều display set làm được bằng custom hanging protocol.
- Active border/overlay cần custom viewport wrapper hoặc CSS theo active viewport service.

## 3.5 Viewport overlay và mini toolbar

Trong ảnh:

- Overlay trên ảnh: series index, image count, timer, patient banner, zoom, WW/WL, scale, text mô tả.
- Mini toolbar dọc bên phải mỗi viewport: copy/export, fullscreen, brightness, link.

Khả thi trong OHIF:

- Overlay custom làm được bằng `ViewportModule` wrapper quanh Cornerstone viewport.
- Per-viewport toolbar làm được nếu wrapper nhận `viewportId` và gọi command theo active viewport hoặc viewport cụ thể.
- Patient/study/series text lấy từ DICOM metadata và RIS order.

Rủi ro:

- Không nên che mất pixel ảnh quan trọng. Overlay phải nhỏ, có opacity/spacing chuẩn.
- Với ultrasound, nhiều thông tin đã burn-in trên pixel ảnh; overlay app chỉ nên bổ sung metadata, không cố OCR.

## 3.6 Measurement / annotation tools

Trong ảnh:

- Ruler, probe/caliper, angle, rectangle, circle/ellipse, polygon/freehand, text/arrow, reset/undo.

Khả thi trong OHIF:

- Nhiều tool cơ bản có sẵn qua Cornerstone Tools/OHIF.
- Cần map lại button theo nhóm như ảnh.
- Measurement persistence có thể dùng OHIF MeasurementService trước, sau đó nâng cấp lưu DICOM SR hoặc lưu JSON vào Minipacs.

Rủi ro:

- DICOM SR interoperability cần làm cẩn thận, nhất là nếu muốn máy/PM khác đọc lại measurement.
- Ultrasound measurement đôi khi cần calibration theo pixel spacing/region calibration; cần test tag DICOM của máy thật.

## 3.7 Image tools

Trong ảnh:

- Rotate, flip, invert, reset, zoom, pan, fit, window/level.

Khả thi:

- Hầu hết có sẵn trong Cornerstone tool commands.
- Cần tạo toolbar button group riêng và hotkeys.

## 3.8 Sync tools

Trong ảnh:

- Link viewport, numbered sync, orientation/slice/zoom type.

Khả thi:

- `SyncGroupService` hỗ trợ sync camera position, VOI/window-level, image slice position và custom synchronizer.
- Nên có các nút:
  - Link scroll/slice.
  - Link WW/WL.
  - Link zoom/pan.
  - Unlink all.

Rủi ro:

- Với US/DX không cùng spatial frame, slice sync không có ý nghĩa. UI cần disable theo modality/layout.

## 3.9 Report, capture, print, export

Trong ảnh:

- Icon report/file, print, camera/capture, video/share.

Khả thi:

- Custom command gọi API Minipacs.
- Capture viewport: dùng Cornerstone canvas hoặc OHIF screenshot utility nếu có sẵn trong version đang dùng.
- Print/export report: tích hợp với report page hiện có, tạo PDF/Word từ RIS.

Rủi ro:

- Export ảnh có chứa PHI cần quyền và audit log.
- Capture/key image cần lưu metadata: study uid, series uid, sop uid, viewport transform, measurement state.

## 4. Kiến trúc đề xuất

## 4.1 Không hard fork sâu nếu chưa cần

Ưu tiên:

1. Fork/clone OHIF source theo version ổn định đang dùng.
2. Thêm extension riêng trong `extensions/minipacs-workstation`.
3. Thêm mode riêng trong `modes/minipacs-workstation`.
4. Giữ DICOM rendering chính của `@ohif/extension-cornerstone`.
5. Chỉ wrap UI/layout/commands cần thiết.

Tránh:

- Patch DOM runtime bằng selector.
- Sửa trực tiếp quá nhiều file core OHIF.
- Copy nguyên toolbar mặc định rồi sửa rải rác.

## 4.2 Các module cần tạo

### Extension: `@minipacs/extension-workstation-ui`

Các module:

- `getPanelModule`
  - `MiniPacsToolPanel`
  - `MiniPacsSeriesStrip`
  - `MiniPacsHistoryPanel`
- `getToolbarModule`
  - Tool buttons top toolbar.
  - Split buttons cho measurement/image/sync nếu cần.
- `getCommandsModule`
  - `openReport`
  - `captureViewport`
  - `printStudy`
  - `toggleViewportLink`
  - `setMiniPacsLayout`
  - `openHistoryStudy`
  - `createKeyImage`
- `getViewportModule`
  - `MiniPacsCornerstoneViewportWrapper`
- `getHangingProtocolModule`
  - `minipacsDefault`
  - `minipacsUSCompare`
  - `minipacsDXUSCompare`
- `getUtilityModule`
  - Helper format patient/study/series overlay.
  - Helper map RIS study history to display items.

### Mode: `@minipacs/mode-workstation`

Route đề xuất:

- `/viewer/:StudyInstanceUID`
- hoặc `/minipacs-viewer/:StudyInstanceUID`

Mode config:

- `leftPanels`: custom tool/history panel.
- `rightPanels`: measurement/report panel tùy giai đoạn.
- `viewports`: Cornerstone stack viewport wrapper.
- `toolbarSections`: top toolbar, có thể chia `primary`, `rightActions`, `advanced`.
- `hangingProtocol`: dùng `minipacsDefault`, `minipacsUSCompare`.
- `hotkeys`: map phím thao tác bác sĩ hay dùng.

## 5. Tích hợp với Minipacs/RIS hiện tại

## 5.1 Launch viewer

Hiện dashboard đang mở OHIF bằng URL kiểu:

- `http://<host>:3000/viewer/<StudyInstanceUID>`

Nên giữ luồng này, nhưng có thể thêm query params:

- `?mode=minipacs`
- `?accession=<accessionNumber>`
- `?patientId=<patientId>`
- `?token=<short-lived-token>` nếu cần auth giữa RIS và viewer.

## 5.2 API viewer cần từ dashboard/RIS

Tối thiểu:

- `GET /api/viewer/studies/:studyInstanceUid/context`
  - patient info
  - order info
  - accession
  - modality
  - priority
  - report status
  - assigned doctor
- `GET /api/viewer/patients/:patientId/history`
  - danh sách study trước đó theo thời gian.
- `POST /api/viewer/studies/:studyInstanceUid/key-images`
  - lưu key image/capture.
- `POST /api/viewer/studies/:studyInstanceUid/measurements`
  - lưu measurement JSON giai đoạn đầu.
- `POST /api/viewer/studies/:studyInstanceUid/audit`
  - ghi audit mở viewer, capture, print, export.
- `GET /api/viewer/studies/:studyInstanceUid/report-link`
  - link mở report trong dashboard.

## 5.3 Orthanc/DICOMweb

Giữ Orthanc làm PACS/DICOMweb backend.

Không đổi:

- WADO/QIDO endpoint nếu đang chạy ổn.
- Luồng nhận DICOM.
- StudyInstanceUID routing.

Cần kiểm tra:

- CORS.
- Auth/proxy nếu viewer và dashboard khác port.
- Cache WADO-RS/frame cho cine ultrasound.
- Compression/transfer syntax với US/DX/CT/MR thật.

## 6. Lộ trình triển khai chi tiết

## Giai đoạn 0: Audit OHIF hiện tại

Mục tiêu:

- Biết viewer hiện đang dùng OHIF version nào, build từ source hay image/package có sẵn.
- Biết vị trí source/config/plugin của OHIF trong repo/deploy.

Việc cần làm:

- Xác định repo/thư mục OHIF thật.
- Kiểm tra `platform/app`, `extensions`, `modes`, `pluginConfig`, `app-config`.
- Ghi lại version OHIF và Cornerstone.
- Kiểm tra custom hiện có: nút ngôn ngữ, header patch, theme patch.

Acceptance:

- Có bản đồ file OHIF hiện tại.
- Biết có thể build custom OHIF từ source hay cần tạo workspace mới.

## Giai đoạn 1: Skeleton custom mode/extension

Mục tiêu:

- Có route viewer custom chạy được, vẫn load ảnh DICOM.

Việc cần làm:

- Tạo extension `minipacs-workstation-ui`.
- Tạo mode `minipacs-workstation`.
- Đăng ký mode/extension bằng cơ chế chính thống của OHIF.
- Route custom vẫn dùng data source DICOMweb hiện tại.
- Render layout ban đầu với toolbar/topbar và viewport mặc định.

Acceptance:

- Mở một study từ dashboard vào custom mode.
- Ảnh load đúng.
- Không hỏng route OHIF mặc định nếu vẫn giữ.

## Giai đoạn 2: Top toolbar giống workstation

Mục tiêu:

- Toolbar trên cùng gần phong cách ảnh tham chiếu.

Việc cần làm:

- Tạo danh sách button:
  - Pointer/select.
  - Window level.
  - Zoom.
  - Pan.
  - Stack scroll.
  - Layout.
  - Measurement group.
  - Cine/play.
  - Annotation/arrow/text.
  - Reset/undo.
  - Capture.
  - Print.
  - Report.
  - Close.
- Map button vào OHIF commands.
- Active state rõ bằng nền xanh đậm/cyan.
- Tooltip tiếng Việt/English tùy i18n.

Acceptance:

- Bác sĩ nhìn toolbar là hiểu tool.
- Click tool đổi active tool đúng.
- Toolbar không vỡ ở 1366x768, 1440x900, 1920x1080.

## Giai đoạn 3: Left tool palette accordion

Mục tiêu:

- Tạo panel trái giống ảnh: History, Layout, Measurement Tools, Advanced Tools, Image Tools, Sync Tools.

Việc cần làm:

- Custom `PanelModule`.
- Tạo accordion UI.
- `Layout`: 1x1, 1x2, 2x1, 2x2.
- `Measurement Tools`: length, angle, rectangle, ellipse, freehand, bidirectional, probe.
- `Image Tools`: rotate, flip, invert, reset, zoom, fit.
- `Sync Tools`: link scroll, link WW/WL, link zoom/pan, unlink.
- Disable tool không phù hợp theo modality.

Acceptance:

- Panel trái hoạt động như tool launcher.
- Các tool phổ biến không cần tìm trong menu sâu.
- Không chiếm quá nhiều diện tích viewport.

## Giai đoạn 4: History và series strip

Mục tiêu:

- Bác sĩ thấy lịch sử chụp và series hiện tại như ảnh.

Việc cần làm:

- Tạo API RIS history.
- Tạo `MiniPacsHistoryPanel`.
- Tạo `MiniPacsSeriesStrip`.
- Hiển thị modality badge, thời gian, số series/image.
- Click history mở study tương ứng hoặc mở comparison mode.
- Click thumbnail gán display set vào active viewport.
- Kéo/thả series vào viewport nếu OHIF hỗ trợ dễ.

Acceptance:

- Mở study US/DX thấy thumbnail series.
- Click thumbnail đổi ảnh/series trong viewport.
- History theo patient hoạt động.

## Giai đoạn 5: Hanging protocols và layout thông minh

Mục tiêu:

- Tự sắp xếp layout theo modality/workflow.

Việc cần làm:

- `minipacsDefault`: 1 viewport cho study đơn.
- `minipacsUSCompare`: 1x2 cho US có nhiều cine/key image.
- `minipacsDXUSCompare`: 1x2 nếu có DX và US gần nhau trong cùng đợt/clinical context.
- `priorCurrent`: current/prior nếu mở từ history.
- Layout selector gọi hanging protocol hoặc viewport grid.

Acceptance:

- US nhiều series mở ra 1x2 hợp lý.
- Active viewport có border rõ.
- Bác sĩ đổi layout thủ công được.

## Giai đoạn 6: Viewport overlay và per-viewport toolbar

Mục tiêu:

- Viewport giống ảnh hơn, ít cảm giác OHIF mặc định.

Việc cần làm:

- Wrap Cornerstone viewport bằng `MiniPacsCornerstoneViewportWrapper`.
- Overlay:
  - Patient banner tùy cấu hình.
  - Series Index.
  - Image current/total.
  - Zoom.
  - WW/WL.
  - Study description/procedure.
  - Scale bar nếu có metadata.
- Mini toolbar dọc:
  - Copy/capture.
  - Fullscreen.
  - Brightness/WL.
  - Link/unlink.
  - More menu.
- Active viewport border vàng/cyan.

Acceptance:

- Overlay không che ảnh quan trọng.
- Fullscreen/fit/reset hoạt động theo viewport.
- 1x2 layout nhìn rõ active viewport.

## Giai đoạn 7: Cine/video và ultrasound workflow

Mục tiêu:

- US cine review mượt và có control rõ.

Việc cần làm:

- Detect multi-frame/cine display set.
- Play/pause, FPS, loop.
- Show timer/frame count.
- Stack scroll bằng mouse wheel.
- Có nút key image/capture.
- Test với US thật từ máy đang dùng.

Acceptance:

- US cine chạy mượt.
- Play/pause không làm treo viewport.
- Measurement trên frame đúng vẫn giữ được reference.

## Giai đoạn 8: Measurement persistence và report bridge

Mục tiêu:

- Measurement/capture từ viewer quay lại được report/RIS.

Việc cần làm:

- Lưu measurement JSON vào Minipacs giai đoạn đầu.
- Lưu key image/capture kèm SOPInstanceUID/frame/viewport state.
- Nút `Report` mở report page hiện tại đúng study.
- Nút `Print/Export` gọi flow in/export hiện có.
- Audit log mọi hành động xuất/capture.

Acceptance:

- Bác sĩ đo/capture trong viewer, report page thấy được dữ liệu liên quan.
- Export/capture có audit.
- Không mất measurement khi reload cùng study.

## Giai đoạn 9: Theme, i18n, keyboard

Mục tiêu:

- Viewer đồng bộ với dark teal Minipacs và dùng tốt lâu dài.

Việc cần làm:

- Theme token:
  - background navy/teal rất tối.
  - active cyan/blue.
  - active viewport yellow/cyan.
  - text trắng/xám rõ.
- Tooltip đầy đủ.
- i18n tiếng Việt/English.
- Hotkeys:
  - W window level.
  - Z zoom.
  - P pan.
  - L length.
  - A angle.
  - Space play/pause cine.
  - R reset.
  - F fullscreen/fit.

Acceptance:

- Không còn cảm giác OHIF generic.
- Toolbar đọc rõ ở 1366x768.
- Hotkeys không xung đột input/report.

## Giai đoạn 10: QA lâm sàng và hiệu năng

Mục tiêu:

- Viewer dùng được trong ca thật, không chỉ đẹp.

Test dataset:

- US single-frame.
- US multi-frame/cine.
- DX/CR.
- CT nhiều series.
- MR nhiều series.
- Study thiếu tag.
- Study có pixel spacing.
- Study không có pixel spacing.

Checklist:

- Mở viewer từ dashboard/report/archive/worklist.
- DICOM load đúng.
- Layout đổi đúng.
- Tool active đúng.
- Measurement đúng đơn vị.
- Cine không giật quá mức.
- Sync không áp dụng sai modality.
- Capture/export có audit.
- Không rò PHI qua URL/log.

## 7. Những thứ nên làm và không nên làm

Nên làm:

- Custom bằng OHIF mode/extension.
- Giữ rendering Cornerstone/OHIF càng nhiều càng tốt.
- Tách UI workstation khỏi DICOM data source.
- Làm từng nhóm tool, không build cả “workstation clone” một lần.
- Tạo feature flag để có thể quay lại viewer OHIF mặc định.

Không nên làm:

- Không patch DOM runtime để di chuyển toolbar/panel.
- Không sửa sâu core OHIF nếu có thể làm bằng extension.
- Không tự viết DICOM renderer mới.
- Không overlay thông tin lên ảnh quá nhiều.
- Không bật sync cho mọi modality một cách mù quáng.
- Không lưu capture/export mà thiếu audit.

## 8. Ước lượng mức độ khó

| Hạng mục | Độ khó | Ghi chú |
|---|---:|---|
| Theme/top toolbar | Trung bình | Cần hiểu ToolbarService và layout hiện tại |
| Left tool palette | Trung bình | Custom PanelModule là hướng phù hợp |
| Series strip custom | Trung bình-cao | Cần hiểu DisplaySetService/metadata |
| Layout/hanging protocol | Cao | Dễ sai khi study nhiều modality |
| Viewport overlay | Cao | Phải wrap viewport mà không phá Cornerstone |
| Per-viewport mini toolbar | Cao | Cần command theo viewport id |
| Cine ultrasound | Cao | Phụ thuộc DICOM thật |
| Measurement persistence | Cao | Cần quyết định JSON nội bộ hay DICOM SR |
| Report/export bridge | Trung bình-cao | Phụ thuộc API Minipacs |

## 9. Đề xuất thứ tự MVP

MVP 1: Workstation shell

- Header/toolbar mới.
- Left tool palette.
- Theme dark teal.
- Layout buttons 1x1/1x2/2x1.
- Series strip cơ bản.

MVP 2: Clinical tools

- Measurement/image tools đầy đủ.
- Sync controls.
- Viewport overlay.
- Active viewport border.

MVP 3: RIS bridge

- History theo bệnh nhân.
- Report/open report.
- Capture/key image.
- Audit.

MVP 4: Ultrasound refinement

- Cine controls.
- US-specific hanging protocol.
- Frame/time overlay.
- Key image workflow.

## 10. Tiêu chí hoàn thành cuối

Viewer đạt yêu cầu khi:

- Bố cục tổng thể giống workstation trong ảnh: toolbar trên, panel tool trái, series strip, multi-viewport lớn.
- Bác sĩ có thể thao tác các tool thường dùng trong 1 click.
- US/DX/CT/MR load ổn từ Orthanc DICOMweb.
- Layout 1x1/1x2/2x1 hoạt động mượt.
- Measurement và image tools chính xác.
- Viewer tích hợp được history/report/capture với Minipacs.
- Không giảm an toàn dữ liệu PHI.
- Có đường rollback về OHIF mặc định.

## 11. Kết luận chuyên môn

OHIF là nền phù hợp để custom thành viewer kiểu trong ảnh. Tuy nhiên, đây không phải bài toán “đổi giao diện” đơn thuần. Nó là một custom viewer mode cho workflow đọc phim của trung tâm, gồm:

1. UI workstation.
2. Tool orchestration.
3. Hanging protocol/layout.
4. Viewport overlay.
5. RIS bridge.
6. Measurement/capture persistence.

Nếu làm đúng bằng mode/extension, khả năng nâng cấp OHIF sau này vẫn giữ được. Nếu làm bằng patch DOM/CSS sâu trên build sẵn, ban đầu có thể nhanh nhưng sẽ rất dễ vỡ khi đổi version hoặc thêm workflow mới.
