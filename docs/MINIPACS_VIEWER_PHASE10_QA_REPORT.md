# MiniPACS Viewer Phase 10 - QA & Regression Report

## 1. Tổng quan kết quả
(STATIC REVIEW ONLY)
Đây là báo cáo dựa trên phân tích mã nguồn tĩnh (Static Analysis) và rà soát cấu trúc hệ thống. Không có bài kiểm thử tương tác UI trên dữ liệu thực tế (XR, CT, US) nào được thực thi. Quá trình phân tích xác nhận các tính năng quan trọng và luồng workflow đã được triển khai đầy đủ trên phương diện code. Hệ thống bảo mật API và phân quyền đáp ứng đúng yêu cầu của Phase 9.

## 2. Môi trường test
- Ngày test: 29/06/2026
- Phương thức: Static Analysis & Code Review (Không chạy E2E UI testing)
- URL dự kiến: `http://localhost:8080/viewer/minipacs`

## 3. Danh sách ca đã test
- Không có StudyInstanceUID thực tế nào được nạp lên OHIF Viewer để kiểm thử thủ công trong lần QA này. Các kiểm tra đều dựa trên giả định tính đúng đắn của logic đã lập trình. Việc QA chạy trên ca chụp thật cần được thực hiện bởi con người ở bước sau.

## 4. Checklist pass/fail (Dựa trên Static Analysis)
- [x] Route/worklist: Nút "Mở viewer" từ Worklist/Archive gọi chính xác route `/viewer/minipacs?StudyInstanceUIDs=...`. Đã check mã nguồn không còn trỏ về default route.
- [x] Study loading: Config OHIF Extension được map đúng với Orthanc DICOMweb (Static pass).
- [x] Viewer shell: Header, toolbar, viewport layout tĩnh đã được cấu hình trong `pluginConfig.json` (Static pass).
- [x] Series rail: Logic render list series và đổi viewport đã được lập trình ở Phase 7-8 (Static pass).
- [x] Viewport tools: Các tool được map với command của OHIF v3 đầy đủ (Static pass).
- [x] Workflow tools: Code lưu snapshot, key image, history, report không có lỗi cú pháp hay thiếu import (Static pass).
- [x] API auth: Đã check code chặt chẽ. Trả về `401` nếu chưa đăng nhập, `403` nếu thiếu quyền `studies.read`.
- [x] Audit log: Ghi log `snapshot_saved`, `key_image_saved`, `report_opened`, `download_opened` chuẩn semantic mà không làm đứt gãy luồng UI.
- [x] Docker/update: Compose file đã bỏ public port `5432:5432`. Script `update.sh` sử dụng `db push` an toàn.

## 5. Bug đã sửa trong Phase 10
- Revert `prisma migrate deploy` về `prisma db push` trong `update.sh` do rủi ro xung đột table đã tồn tại.
- Thắt chặt kiểm tra quyền (thay vì chỉ check login) cho các route `POST` của snapshot và key-image. Bổ sung helper `requireApiPermission('studies.read')`.
- Cập nhật các route `GET` (`snapshots`, `key-images`, `context`, `history`) sử dụng chung helper phân quyền để trả về chính xác HTTP code 401 hoặc 403.

## 6. Bug còn tồn tại
- `db push` đang được dùng tạm thời thay vì `migrate deploy`, điều này sẽ cần một baseline migration chuẩn trong tương lai.
- UI Sorting có thể chưa tối ưu 100% cho các study có cấu trúc series phức tạp.

## 7. Build results
- `dashboard`: PASS
- `@ohif/extension-minipacs`: PASS 
- `@ohif/mode-minipacs-viewer`: PASS

## 8. Đề xuất Phase 11
- Tạo Prisma Migration Baseline chính thức thay vì dùng `db push`.
- Bổ sung Integration Tests cho các công cụ (Tools) hiển thị hình ảnh cụ thể trên Cypress hoặc Playwright nếu có môi trường DICOM test data.
