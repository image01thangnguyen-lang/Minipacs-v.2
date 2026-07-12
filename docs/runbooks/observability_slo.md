# Observability & SLO Runbook

## 1. Mục tiêu (Service Level Objectives)
- **Worklist Load (P95)**: Dưới 2000ms.
- **Search / Filter (P95)**: Dưới 1000ms.
- **Save Draft / Sign Report (P99)**: Dưới 1500ms.
- **Error Rate**: Dưới 0.1% / 30 ngày (Rolling window).

## 2. Metric Cardinality
Để tránh bùng nổ cơ sở dữ liệu Time-Series (High Cardinality):
- **Không bao giờ tag metric bằng**: `patientId`, `studyInstanceUid`, `userId` hoặc `reportId`.
- **Chỉ tag metric bằng allowlist trong code**: `action`, `status`, và `errorType`. Không dùng `facilityId` cho metric để tránh cardinality tăng theo tenant.

> Cấu hình này là mẫu ingestion/runbook. PR hiện tại chưa cung cấp dashboard, alert provisioning hoặc bằng chứng đo SLO thực tế; các hạng mục đó phải được kiểm chứng trên monitoring backend trước pilot.

## 3. Cấu hình Cảnh báo (Alert Routing)
- **Sev1 (Toàn hệ thống không thể load được Worklist/Báo cáo, Tỉ lệ lỗi > 5%)**: Gửi SMS & PagerDuty tới đội ngũ DevOps trực ban (On-Call Engineer).
- **Sev2 (Một cơ sở cụ thể không thể truy cập, P95 > 5s)**: Gửi cảnh báo lên kênh Slack `#alerts-minipacs`.
- **Sev3 (Các lỗi phân quyền scope lẻ tẻ tăng bất thường)**: Tạo issue trên Jira để xử lý trong Sprint tiếp theo.

## 4. Dashboard Permissions
- **Admin Dashboards**: Chứa toàn bộ log phân tích sâu. Bắt buộc phải có Role `sysadmin` hoặc `devops`. Mọi PHI đã được Scrubbing ở tầng Application nên Admin an toàn khi view payload (không lộ thông tin Bệnh nhân).
- **Facility Dashboards**: Chỉ hiển thị Count (số lượng ca) và Latency cho từng cơ sở. Không hiển thị chi tiết lỗi. Mở rộng cho Role `facility_manager`.
