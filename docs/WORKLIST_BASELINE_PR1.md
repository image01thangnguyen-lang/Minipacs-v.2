# Phase 3 PR1: Worklist Baseline & Inventory

## 1. Inventory Caller & Auth Scope
**Hàm mục tiêu thay thế:** `getStudies()` trong `dashboard/app/actions.ts`
**Caller legacy đã xác minh:** `dashboard/app/page.tsx` gọi trực tiếp server action
`getStudies()`; không có route `/api/studies` trong `dashboard/app/api` tại thời điểm ghi baseline.

**Authz Scope:**
- Yêu cầu `studies.read`.
- Legacy path chỉ có global permission tại đầu action; dữ liệu Orthanc được tải trước khi ghép Prisma nên chưa có resource-scope predicate trong truy vấn nguồn.

## 2. Baseline Performance & Query Budget (Trước Tối Ưu)
Hành vi hiện tại của hệ thống khi lấy worklist:
1. **Network IO:**
   - GET `http://orthanc:8042/studies?expand` (Tải toàn bộ DB PACS)
   - N+1 requests: GET `http://orthanc:8042/series/{id}` cho mỗi ca.
   - N+1 requests: GET `http://orthanc:8042/studies/{id}/statistics` cho mỗi ca.
2. **Database (Prisma):**
   - Query với list IN array cực lớn `OR: [{ studyInstanceUid: { in: [...] } }, { isNonDicom: true }]`
3. **In-Memory Manipulation:**
   - Dùng vòng lặp O(N) ghép dữ liệu.

**Ngân sách (Query Budget) - Trước PR1:**
- Thời gian/payload/query count thực đo: **chưa có evidence trên dataset chuẩn**. Không coi ước lượng là benchmark đã pass.
- Payload trả về (Response Size): Rất lớn, không phân trang ở backend.
- Rủi ro: OOM (Out of Memory) ở Node.js server, quá tải kết nối Orthanc.

**Kỳ vọng (Sau Phase 3 - Khởi đầu từ PR1):**
- DB Plan phải sử dụng được các Index mới:
  - Phân trang theo `createdAt`: `@@index([createdAt, id])`
  - Ưu tiên: `@@index([priority, createdAt, id])`
  - Tình trạng: `@@index([status, createdAt, id])`
- EXPLAIN plan: phải được thu trên PostgreSQL với dataset đại diện sau khi migration được deploy; PR1 chưa có quyền tuyên bố index scan/P95 pass nếu chưa đính kèm output.
- Thời gian DB (P95) < 100ms.
- API Response (P95) < 1 giây.
- Zero N+1: JOIN (include) trực tiếp qua bảng quan hệ `order`, `reports`, `performingUnit` với số lượng giới hạn theo trang.

## 3. Data Dictionary
Hợp đồng mới đã được chốt qua `WorklistQueryRequest` (Zod Schema) trong `dashboard/lib/worklist/contract.ts`.

- Contract version hiện tại: `1`; object input strict, unknown field bị reject.
- Phân trang: contract nhận opaque cursor có giới hạn; cursor ký/versioned và filter/sort hash thuộc PR2, chưa được triển khai trong PR1.
- Timezone: validate IANA timezone; input date-time bắt buộc có UTC offset, `from < to`, tối đa 366 ngày. Việc tính local preset boundary thuộc PR4.
- Output typed gồm stable IDs, freshness, typed generic error và `allowedActions`; mapper/server boundary thuộc các PR sau.

## 4. Evidence và giới hạn PR1

- Additive migration: `20260711000000_phase3_pr1_worklist_indexes`.
- Contract unit test kiểm tra defaults, allowlist, unknown fields, timezone/date bounds, cursor/page/filter limits và version.
- PR1 không thay read path, do đó N+1 legacy vẫn tồn tại có chủ đích cho tới PR2/cutover.
- Cần chạy `EXPLAIN (ANALYZE, BUFFERS)` và ghi P50/P95 trên dữ liệu UAT trước khi đánh dấu performance acceptance.
