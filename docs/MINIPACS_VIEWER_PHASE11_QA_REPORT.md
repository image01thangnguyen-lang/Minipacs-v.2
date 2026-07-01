# MiniPACS Viewer Phase 11 - Measurement & Annotation Persistence QA Report

## 1. Tổng quan kết quả
**(STATIC REVIEW ONLY)**
Báo cáo này dựa trên kết quả rà soát kiến trúc (Static Analysis) và xác nhận qua trình biên dịch (Build process). Không có kiểm thử tương tác UI trên dữ liệu DICOM thực tế nào được chạy trên browser. Các thành phần kết nối dữ liệu (Backend APIs, Prisma Model, Frontend Persistence Service) đã được thiết lập đúng cấu trúc yêu cầu của Phase 11.

## 2. Các file đã sửa / thêm mới
- **Database**:
  - `dashboard/prisma/schema.prisma`: Thêm model `ViewerMeasurement`.
- **Backend APIs**:
  - `dashboard/app/api/viewer/studies/[uid]/measurements/route.ts`: API `GET` và `POST`.
  - `dashboard/app/api/viewer/studies/[uid]/measurements/[id]/route.ts`: API `PATCH` và `DELETE`.
- **Frontend Service**:
  - `ohif-viewer/extensions/minipacs/src/services/viewerMeasurementPersistenceService.ts`: Khởi tạo luồng load, hydrate, debounce save, xóa annotation qua API.
  - `ohif-viewer/extensions/minipacs/src/index.tsx`: Khởi tạo global event listener vào lúc `preRegistration`.
  - `ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx`: Bắt sự kiện load xong study đầu tiên để trigger hàm `loadForStudy`.

## 3. StudyInstanceUID & Tool đã test
- Do tính chất Static QA, không có `StudyInstanceUID` thực tế nào được giả lập.
- Các tool dự kiến được support theo đúng OHIF/Cornerstone3D: `Length`, `Angle`, `RectangleROI`, `EllipticalROI`, `CircleROI`, v.v...

## 4. Kết quả mong đợi (Reload/Restore/Delete)
- **Vẽ Measurement**: Sự kiện `MEASUREMENT_ADDED` từ `measurementService` sẽ gửi API POST về backend.
- **Reload / Restore**: Trả về đúng file JSON và hydrate thông qua `annotationManager.addAnnotation(rawAnnotation)`.
- **Xóa**: Sự kiện `MEASUREMENT_REMOVED` sẽ gọi DELETE API để ẩn record khỏi DB (soft delete).
- *(Tất cả được suy luận dựa trên cấu trúc hook và API đã map).*

## 5. Các ràng buộc và Limitation
- OHIF's `annotationManager` và `MeasurementService` events thỉnh thoảng sẽ bị lệch nhịp nếu có external state change. Việc sử dụng timer 1000ms debounce trong `viewerMeasurementPersistenceService` giúp giảm tải nhưng có thể delay luồng state nếu người dùng tắt trang quá nhanh.
- **Migration**: Phase 11 hiện tại phụ thuộc vào cơ chế `db push` để update schema nhanh chóng. File Prisma migration chưa được tạo (chưa migration-ready cho production deployment) vì cần đồng bộ với tiến trình data seeding hiện tại. Khuyến nghị chạy `npx prisma db push` trên môi trường deploy.
- **Dữ liệu Value**: Thuộc tính `value` của measurement được ép về numeric type `Float?`. Dữ liệu hiển thị (ví dụ `"12.3 mm"`) được tách riêng lưu vào trường `displayText` mới để bảo toàn kiểu dữ liệu chuẩn và tránh văng Exception (Fix lỗi crash 500 khi bác sĩ vẽ Length/Angle).
- **Tránh trùng lặp DB**: API đã được nâng cấp lên dùng cơ chế `upsert` (tạo mới hoặc cập nhật) thông qua composite unique index `@@unique([studyInstanceUid, measurementUID])` thay vì `create` mù quáng, tránh tạo bản nháp dư thừa trong database khi event bắn hai lần.

## 6. Build Results
Tất cả các module quan trọng đã được build thành công, không gặp lỗi cú pháp hay thiếu import:
- **`@ohif/mode-minipacs-viewer`**: PASS (~483ms)
- **`@ohif/extension-minipacs`**: PASS (~7.9s)
- **`minipacs-dashboard`**: PASS (✓ Compiled successfully, Generating static pages 16/16)
