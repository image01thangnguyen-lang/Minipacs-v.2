# Ke hoach chi tiet Phase 7.5 - HIS Production API Gateway And Admin Console

Updated: 2026-07-04

## 1. Muc tieu

Phase 7.5 nang lop HIS Integration da lam o Phase 2 tu muc mock/internal action len thanh mot cong ket noi HIS that, co API ro rang, co giao dien quan ly rieng, co log khi HIS goi vao MiniPACS va khi MiniPACS goi ra HIS.

Muc tieu cuoi phase:

- Co API inbound de HIS benh vien goi vao MiniPACS.
- Co production adapter de MiniPACS goi sang HIS theo spec trien khai.
- Co giao dien Admin HIS rieng tai `/admin/his`.
- Co API Explorer kieu Swagger mini de xem endpoint, payload mau, va thu request.
- Co HIS Call Logs tren UI cho nguoi dung du quyen xem request/response da scrub, loi, duration, request id.
- Co cau hinh HIS tren UI: mode, endpoint, auth, timeout, retry, health check.
- Co mapping HIS field sang MiniPACS field va preview mapping.
- Co conflict review khi HIS gui data khac data dang co.
- Tiep tuc dung status/log/retry/UI da co tu Phase 2, khong tao workflow song song.

## 2. Ly do tach Phase 7.5

Phase 2 da co nen tang:

- `HisAdapter` interface.
- `MockHisAdapter`.
- `HisSyncService`.
- `HisSyncLog`.
- Action cap nhat order tu HIS.
- Action gui ket qua sang HIS.
- Retry HIS.
- HIS status tren Study List, Worklist, Report, Archive, Statistics.
- Permission `his.read`, `his.sync`, `his.retry`, `his.manage`.

Tuy nhien Phase 2 chua nen hard-code HIS vendor khi chua co spec that. Phase 7.5 la phase bo sung cong ket noi production va man hinh quan tri API sau khi cac workflow van hanh, Non-DICOM, Share/Consultation da co UI day du.

## 3. Khong nam trong Phase 7.5

Phase 7.5 khong lam cac viec sau:

- Khong build mot HIS moi.
- Khong hard-code theo mot vendor neu chua co spec chinh thuc.
- Khong lam HL7 TCP listener production neu chua co yeu cau ha tang ro rang.
- Khong tu dong ghi de du lieu clinical/report quan trong khi conflict chua duoc duyet.
- Khong expose raw PHI/secret trong log UI.
- Khong thay workflow final report da on dinh o Phase 1/2/3/7.
- Khong lam destructive delete/retention/export bulk; cac muc do thuoc Phase 8.
- Khong lam native workstation; muc do thuoc Phase 9.

## 4. Nguyen tac kien truc

### 4.1 Gateway-first

Moi request HIS goi vao MiniPACS phai di qua HIS Gateway:

```text
HIS -> /api/his/inbound/* -> Auth -> Validate -> Map -> Service -> DB -> Log -> Response
```

Moi request MiniPACS goi ra HIS phai di qua adapter:

```text
UI/Workflow -> HisSyncService -> HisAdapter -> HIS -> Log -> UI Status
```

UI khong goi truc tiep endpoint HIS ben ngoai.

### 4.2 UI-first tu Phase 5 tro di

Moi schema, service, API, config, log, permission duoc them trong Phase 7.5 phai co UI de xem hoac thao tac:

- Config co UI.
- Log co UI.
- Endpoint co API Explorer.
- Mapping co UI.
- Conflict co UI.
- Retry/test co UI.

Khong de tinh nang chi ton tai trong code.

### 4.3 Security by default

- Inbound API phai co auth.
- Secret khong luu plain text.
- Log phai scrub payload.
- UI log chi hien chi tiet theo permission.
- Moi config change phai audit.
- Moi HIS call phai co request id/correlation id.

### 4.4 No silent overwrite

Khi HIS gui du lieu khac data dang co:

- Field hanh chinh co the update neu policy cho phep.
- Field clinical/procedure/payment quan trong phai log diff.
- Neu conflict lon, dua vao Conflict Review.
- Report final khong bi HIS ghi de.

## 5. Kien truc module

De xuat them cac module:

- `dashboard/lib/his/hisGatewayAuth.ts`
- `dashboard/lib/his/hisApiLogger.ts`
- `dashboard/lib/his/hisProductionAdapter.ts`
- `dashboard/lib/his/restHisAdapter.ts`
- `dashboard/lib/his/hisConfigService.ts`
- `dashboard/lib/his/hisMappingService.ts`
- `dashboard/lib/his/hisConflictService.ts`
- `dashboard/app/api/his/inbound/**`
- `dashboard/app/admin/his/page.tsx`
- `dashboard/app/admin/his/actions.ts`
- `dashboard/app/admin/his/components/**`

Khong thay the cac file Phase 2:

- `dashboard/lib/his/types.ts`
- `dashboard/lib/his/hisAdapter.ts`
- `dashboard/lib/his/mockHisAdapter.ts`
- `dashboard/lib/his/hisSyncService.ts`
- `dashboard/lib/his/hisPayloadMapper.ts`
- `dashboard/lib/his/hisAudit.ts`
- `dashboard/app/his/actions.ts`

Phase 7.5 chi mo rong chung.

## 6. API inbound de HIS goi vao MiniPACS

### 6.1 Endpoint de xuat

| Endpoint | Method | Muc dich | Permission/Auth |
| --- | --- | --- | --- |
| `/api/his/inbound/health` | GET | HIS/IT test MiniPACS alive | HIS API auth |
| `/api/his/inbound/orders/upsert` | POST | Tao/cap nhat chi dinh | HIS API auth |
| `/api/his/inbound/orders/cancel` | POST | Huy chi dinh tu HIS | HIS API auth |
| `/api/his/inbound/studies/status` | GET | HIS hoi trang thai ca chup | HIS API auth |
| `/api/his/inbound/reports/status` | GET | HIS hoi trang thai report | HIS API auth |
| `/api/his/inbound/reports/final` | GET | HIS lay ket qua final | HIS API auth |
| `/api/his/inbound/ack` | POST | HIS xac nhan da nhan ket qua | HIS API auth |

### 6.2 Payload mau - upsert order

```json
{
  "hisOrderId": "HIS-123",
  "accessionNumber": "ACC-20260704-001",
  "patientId": "BN001",
  "patientName": "Nguyen Van A",
  "dob": "1980-01-01",
  "gender": "M",
  "phone": "0900000000",
  "procedureCode": "CTHEAD",
  "procedureDescription": "CT so nao",
  "modality": "CT",
  "bodyPart": "HEAD",
  "clinicalInfo": "Dau dau",
  "priority": "ROUTINE",
  "paymentStatus": "PAID",
  "referringDepartment": "Khoa kham benh",
  "referringPhysician": "BS A"
}
```

### 6.3 Response mau

```json
{
  "success": true,
  "requestId": "req_abc",
  "accessionNumber": "ACC-20260704-001",
  "worklistOrderId": "uuid",
  "studyInstanceUid": null,
  "status": "SYNCED",
  "conflict": false
}
```

### 6.4 Error response mau

```json
{
  "success": false,
  "requestId": "req_abc",
  "errorCode": "HIS_VALIDATION_ERROR",
  "message": "Missing required field: accessionNumber"
}
```

## 7. MiniPACS goi sang HIS

Phase 7.5 can them production adapter, toi thieu REST:

- `RestHisAdapter`
- `healthCheck()`
- `fetchOrder(query)`
- `sendResult(payload)`
- `cancelResult(payload)` neu HIS support.

Adapter mode:

- `disabled`
- `mock`
- `rest`
- `custom` neu co spec rieng.

Neu sau nay co HL7/FHIR:

- `Hl7HisAdapter`
- `FhirHisAdapter`

Nhung Phase 7.5 chi implement khi co spec that. Neu chua co spec, can tao boundary va UI config de san sang.

## 8. Data model de xuat

### 8.1 `HisConnectionConfig`

Luu cau hinh ket noi HIS.

Fields de xuat:

- `id String @id @default(uuid())`
- `name String`
- `mode String`
- `baseUrl String?`
- `authMode String`
- `apiKeyEncrypted String? @db.Text`
- `bearerTokenEncrypted String? @db.Text`
- `basicUsername String?`
- `basicPasswordEncrypted String? @db.Text`
- `hmacSecretEncrypted String? @db.Text`
- `timeoutMs Int @default(10000)`
- `retryMax Int @default(0)`
- `isActive Boolean @default(true)`
- `lastHealthStatus String?`
- `lastHealthMessage String? @db.Text`
- `lastHealthCheckedAt DateTime?`
- `createdByUserId String?`
- `updatedByUserId String?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.2 `HisApiCallLog`

Log moi lan HIS goi vao hoac MiniPACS goi ra.

Fields de xuat:

- `id String @id @default(uuid())`
- `direction String` - `INBOUND` hoac `OUTBOUND`
- `method String`
- `path String`
- `endpointKey String?`
- `statusCode Int?`
- `success Boolean`
- `durationMs Int?`
- `requestId String?`
- `correlationId String?`
- `remoteIp String?`
- `actorType String?` - `HIS_SYSTEM`, `USER`, `SYSTEM`
- `actorUserId String?`
- `accessionNumber String?`
- `studyInstanceUid String?`
- `reportId String?`
- `hisOrderId String?`
- `hisMessageId String?`
- `requestSummaryJson String? @db.Text`
- `responseSummaryJson String? @db.Text`
- `errorCode String?`
- `errorMessage String? @db.Text`
- `createdAt DateTime @default(now())`

Indexes:

- `createdAt`
- `direction`
- `statusCode`
- `success`
- `endpointKey`
- `accessionNumber`
- `studyInstanceUid`
- `requestId`

### 8.3 `HisFieldMapping`

Mapping field theo deployment/vendor.

Fields de xuat:

- `id String @id @default(uuid())`
- `name String`
- `direction String` - `INBOUND` / `OUTBOUND`
- `sourceField String`
- `targetField String`
- `transformRule String? @db.Text`
- `isRequired Boolean @default(false)`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### 8.4 `HisConflict`

Dung khi HIS payload mau thuan voi data dang co.

Fields de xuat:

- `id String @id @default(uuid())`
- `entityType String`
- `entityId String?`
- `accessionNumber String?`
- `studyInstanceUid String?`
- `fieldName String`
- `currentValue String? @db.Text`
- `incomingValue String? @db.Text`
- `status String` - `OPEN`, `ACCEPTED`, `IGNORED`, `MERGED`
- `resolvedByUserId String?`
- `resolvedAt DateTime?`
- `resolutionNote String? @db.Text`
- `createdAt DateTime @default(now())`

## 9. Giao dien quan ly HIS

Route chinh:

- `/admin/his`

De xuat chia thanh tabs thay vi tao qua nhieu man hinh roi rac.

### 9.1 Tab Tong quan

Hien:

- HIS mode hien tai.
- Adapter dang dung.
- Health status.
- Last health check.
- Inbound requests 24h.
- Outbound requests 24h.
- Failed calls 24h.
- Pending/failed HIS sync count.
- Nut test connection.

### 9.2 Tab Cau hinh ket noi

Form:

- Mode: disabled/mock/rest/custom.
- Base URL.
- Auth mode: none/apiKey/bearer/basic/hmac.
- Secret/token input co mask.
- Timeout.
- Retry max.
- Active toggle.
- Test connection.
- Save config.

Rang buoc:

- Chi user co `his.manage` moi thay/sua tab nay.
- Secret chi hien dang masked, khong show plain value sau khi save.

### 9.3 Tab API Explorer

Giong Swagger mini, nhung gon cho nguoi van hanh:

- Danh sach endpoint inbound.
- Danh sach outbound operation.
- Method, path, description.
- Required auth.
- Payload mau.
- Response mau.
- Nut copy cURL.
- Nut Try request neu user co `his.apiTest`.
- Ket qua response hien ngay tren UI.

Endpoint docs can generate tu constant registry de tranh lech docs/code.

### 9.4 Tab Call Logs

Hien bang log:

- Direction.
- Endpoint.
- Status.
- Duration.
- Accession.
- Study UID.
- Request ID.
- Created at.

Filter:

- Direction.
- Success/failed.
- Endpoint.
- Status code.
- Accession number.
- Study UID.
- Date range.

Detail drawer:

- Request summary da scrub.
- Response summary da scrub.
- Error code/message.
- Correlation id.
- Actor.
- Nut retry neu outbound failed va user co `his.retry`.

### 9.5 Tab Field Mapping

Hien:

- Mapping inbound.
- Mapping outbound.
- Required field.
- Transform rule.
- Active/inactive.

Co preview:

- Paste payload HIS mau.
- Click Preview mapping.
- UI hien MiniPACS field se nhan gia tri nao.

### 9.6 Tab Conflict Review

Hien:

- Conflict open.
- Entity/order/study.
- Field.
- Current value.
- Incoming value.
- Created at.

Action:

- Accept incoming.
- Keep current.
- Merge/manual note.

Tat ca action phai audit.

## 10. Permission

Mo rong permission:

| Permission | Muc dich |
| --- | --- |
| `his.read` | Xem status/log co ban |
| `his.sync` | Dong bo/gui HIS |
| `his.retry` | Retry loi |
| `his.manage` | Quan ly cau hinh HIS |
| `his.apiLogs` | Xem API call log chi tiet |
| `his.apiTest` | Dung API Explorer Try request |
| `his.mapping` | Quan ly field mapping |
| `his.conflictReview` | Xu ly conflict HIS |

Mapping role de xuat:

- `ADMIN`: tat ca.
- `DOCTOR`: `his.read`, `his.sync` neu duoc phep gui report.
- `TECHNICIAN`: `his.read`, `his.sync`, `his.retry`.
- `RECEPTION`: `his.read`, co the `his.sync` neu phong kham cho phep cap nhat order.

Server-side permission bat buoc cho moi action. UI khong hien nut neu backend se tu choi.

## 11. Security

### 11.1 Auth inbound

Ho tro toi thieu:

- API key.
- Bearer token.
- HMAC signature.

Khuyen nghi production:

- HMAC signature voi timestamp va body hash.
- Reject request qua clock skew.
- Rate limit theo key/IP.
- Request id bat buoc hoac server tu sinh.

### 11.2 Secret storage

- Khong luu plain token/API key.
- Encrypt secret truoc khi luu DB.
- Env fallback cho secret bootstrap.
- UI chi hien masked secret.
- Audit khi secret bi thay doi, nhung khong log secret.

### 11.3 Payload logging

Log phai scrub:

- Token/header secret.
- Password.
- Signature.
- Raw PDF/report HTML neu qua dai.
- PHI nhay cam neu user khong co quyen xem chi tiet.

`HisApiCallLog` chi nen luu summary va payload da sanitize.

### 11.4 Data safety

- HIS khong duoc ghi de report final.
- HIS order cancel khong xoa DICOM image.
- HIS conflict khong auto overwrite field quan trong.
- HIS failed khong rollback report final.

## 12. Workflow chi tiet

### 12.1 HIS tao/cap nhat order

1. HIS goi `/api/his/inbound/orders/upsert`.
2. Gateway verify auth.
3. Validate payload.
4. Map payload theo `HisFieldMapping`.
5. Tim order theo `accessionNumber` hoac `hisOrderId`.
6. Neu chua co, tao `WorklistOrder`.
7. Neu da co, so sanh field quan trong.
8. Neu conflict, tao `HisConflict`.
9. Cap nhat field an toan.
10. Ghi `HisApiCallLog` va `HisSyncLog`.
11. Tra response co `requestId`.

### 12.2 HIS huy order

1. HIS goi `/api/his/inbound/orders/cancel`.
2. Neu order chua chup, chuyen cancel theo policy.
3. Neu da co image/report, khong xoa, tao alert/conflict.
4. Ghi audit/log.

### 12.3 MiniPACS gui final report sang HIS

1. User final report hoac bam Gui HIS.
2. `workflowService`/`sendReportToHisAction` goi `HisSyncService`.
3. `HisSyncService` lay active config.
4. Adapter tao request theo mapping.
5. Ghi outbound `HisApiCallLog`.
6. Neu success, cap nhat `hisResultStatus`.
7. Neu failed, cap nhat `FAILED`, hien retry.

### 12.4 Admin test API

1. Admin vao `/admin/his`.
2. Mo API Explorer.
3. Chon endpoint.
4. Sua payload mau.
5. Bam Try request.
6. UI hien response va link toi call log.

## 13. Trinh tu trien khai

### PR 7.5A - Schema, permissions, route guard

- Them model `HisConnectionConfig`.
- Them model `HisApiCallLog`.
- Them model `HisFieldMapping`.
- Them model `HisConflict`.
- Them permissions moi.
- Update seed/role map.
- Migration Prisma.

Done khi:

- `prisma validate/generate` pass.
- Build pass.
- Permission visible trong admin role UI neu co.

### PR 7.5B - Gateway auth va API logger

- Tao `hisGatewayAuth`.
- Tao `hisApiLogger`.
- Tao scrub helper.
- Tao request id/correlation id helper.
- Them rate limit boundary neu kha thi.

Done khi:

- Inbound endpoint co the reject invalid auth.
- Moi call duoc log vao `HisApiCallLog`.

### PR 7.5C - Inbound API

- `GET /api/his/inbound/health`.
- `POST /api/his/inbound/orders/upsert`.
- `POST /api/his/inbound/orders/cancel`.
- `GET /api/his/inbound/studies/status`.
- `GET /api/his/inbound/reports/status`.
- `GET /api/his/inbound/reports/final`.
- `POST /api/his/inbound/ack`.

Done khi:

- HIS mock/cURL co the tao order va xem status.
- Loi validate/auth deu co log.

### PR 7.5D - REST production adapter

- Tao `RestHisAdapter`.
- Doc config tu DB/env.
- Implement `healthCheck`.
- Implement `fetchOrder`.
- Implement `sendResult`.
- Implement `cancelResult` neu spec co.
- Error mapping.

Done khi:

- Co the test voi fake REST HIS server.
- Outbound success/failed log day du.

### PR 7.5E - Admin HIS Console

- Tao `/admin/his`.
- Tab Tong quan.
- Tab Cau hinh ket noi.
- Tab API Explorer.
- Tab Call Logs.
- Tab Field Mapping.
- Tab Conflict Review.

Done khi:

- Admin khong can terminal de biet HIS dang loi o dau.
- Co the test connection va xem log tren UI.

### PR 7.5F - Integration voi UI van hanh

- Link tu Worklist/Report/Archive HIS status sang call log lien quan.
- Nut retry dung log/action hien co.
- Hien conflict badge neu order co conflict.
- Statistics co KPI inbound/outbound failed neu can.

Done khi:

- Nguoi dung tu ca loi HIS co the mo log lien quan trong 1-2 click.

### PR 7.5G - QA va hardening

- Test auth sai.
- Test payload thieu field.
- Test upsert success.
- Test conflict.
- Test send report success/failed/retry.
- Test permission denied.
- Test scrub payload.
- Test health failed.
- Test build.

Done khi:

- QA scenarios pass.
- Docs/env note day du.

## 14. Acceptance criteria

Phase 7.5 chi duoc xem la xong khi:

1. Admin cau hinh duoc HIS tren UI.
2. Co API Explorer giong Swagger mini.
3. HIS inbound co auth va log.
4. HIS co the tao/cap nhat order vao Worklist.
5. MiniPACS co the gui final report sang HIS qua adapter production/mock-rest.
6. Moi inbound/outbound call co `HisApiCallLog`.
7. User du quyen xem duoc log tren UI.
8. Retry duoc tu UI voi outbound failed.
9. Conflict duoc hien va xu ly tren UI.
10. Payload log duoc scrub.
11. Secret khong hien plain text.
12. Permission server-side day du.
13. UI khong hien action neu backend se tu choi.
14. Build/typecheck pass.
15. Khong regression Phase 1-7.

## 15. QA scenarios

### Scenario 1 - HIS disabled

Expected:

- Admin UI hien disabled.
- Inbound API reject hoac tra disabled theo config.
- Call log ghi status.
- Workflow core van chay.

### Scenario 2 - Health check success

Expected:

- Admin bam Test connection.
- Status OK.
- Last checked updated.
- Co log outbound health.

### Scenario 3 - Health check failed

Expected:

- UI hien loi sanitized.
- Khong lo token/base secret.
- Co log failed.

### Scenario 4 - Inbound order upsert success

Expected:

- HIS goi order upsert.
- Worklist co order.
- HIS status synced.
- Log inbound success.

### Scenario 5 - Inbound payload invalid

Expected:

- Tra 400.
- Log validation error.
- DB khong tao order rac.

### Scenario 6 - Inbound auth invalid

Expected:

- Tra 401/403.
- Log failed neu policy cho phep.
- Khong vao service ghi data.

### Scenario 7 - Conflict data

Expected:

- Khong silent overwrite.
- Tao conflict.
- UI Conflict Review hien old/new.
- Accept/ignore co audit.

### Scenario 8 - Send final report success

Expected:

- Report final gui sang HIS.
- `hisResultStatus` thanh `SYNCED`.
- Co message id neu HIS tra.
- Log outbound success.

### Scenario 9 - Send final report failed

Expected:

- Report van final.
- `hisResultStatus` thanh `FAILED`.
- UI hien retry.
- Log outbound failed.

### Scenario 10 - Retry success

Expected:

- User co `his.retry` bam retry.
- Status thanh `SYNCED`.
- Log retry/success.

### Scenario 11 - Permission denied

Expected:

- User thieu quyen khong thay nut.
- Goi action truc tiep bi chan server-side.

### Scenario 12 - API Explorer

Expected:

- Admin xem endpoint docs.
- Copy payload mau.
- Try request tao log.
- Response hien tren UI.

## 16. Rui ro va cach xu ly

### Rui ro 1 - Chua co HIS spec that

Xu ly:

- Lam REST adapter theo contract chung.
- Dung fake server/mock-rest de QA.
- De field mapping linh hoat.
- Khong hard-code vendor.

### Rui ro 2 - Log lo PHI/secret

Xu ly:

- Scrub helper bat buoc.
- UI phan quyen chi tiet.
- Secret masked.
- Raw payload chi luu neu da sanitize.

### Rui ro 3 - HIS ghi de sai du lieu

Xu ly:

- No silent overwrite.
- Conflict Review.
- Audit old/new.

### Rui ro 4 - API inbound bi spam

Xu ly:

- Auth bat buoc.
- Rate limit.
- Request size limit.
- Validation schema.

### Rui ro 5 - Adapter lam vo workflow core

Xu ly:

- Core workflow van chay khi HIS disabled.
- HIS failed khong rollback final/delivery.
- Tat ca goi qua `HisSyncService`.

## 17. Ghi chu deploy/config

Env de xuat:

```env
HIS_INTEGRATION_MODE=disabled
HIS_BASE_URL=
HIS_AUTH_MODE=
HIS_TIMEOUT_MS=10000
HIS_RETRY_MAX=0
HIS_WEBHOOK_SECRET=
HIS_SECRET_ENCRYPTION_KEY=
```

Production:

- Khong duoc dung default secret.
- Can rotate secret khi lo.
- Can backup config.
- Can test health sau deploy.

## 18. Prompt giao cho AI coding agent

```text
Ban la coding agent trong repo MiniPACS. Hay thuc hien Phase 7.5 - HIS Production API Gateway And Admin Console theo file:

docs/VRPACS_PHASE7_5_HIS_PRODUCTION_API_GATEWAY_PLAN.md

Muc tieu:

- Nang Phase 2 HIS mock/internal action thanh API gateway production-ready.
- Tao API inbound de HIS goi vao MiniPACS.
- Tao production adapter de MiniPACS goi sang HIS.
- Tao giao dien /admin/his co API Explorer kieu Swagger mini, config, health check, call logs, field mapping, conflict review.
- Moi API/service/schema/permission lam ra phai co UI hien thi hoac thao tac.

Doc truoc:

- docs/VRPACS_PHASE2_HIS_INTEGRATION_PLAN.md
- docs/VRPACS_PHASE7_5_HIS_PRODUCTION_API_GATEWAY_PLAN.md
- docs/VRPACS_WORKFLOW_STATUS_POLICY.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_TERMINOLOGY_MAP.md
- dashboard/lib/his/**
- dashboard/app/his/actions.ts
- dashboard/prisma/schema.prisma
- dashboard/lib/permissions.ts

Rang buoc:

- Khong revert thay doi cua user.
- Khong hard-code vendor HIS neu chua co spec.
- Khong log secret/token/plain raw PHI.
- Khong cho HIS ghi de report final.
- Khong tao workflow HIS song song voi Phase 2.
- Server-side permission bat buoc.
- UI khong hien action neu backend se tu choi.
- Chay build/typecheck truoc khi bao xong.

Ket qua cuoi:

- Files changed list.
- Behavior changed summary.
- Migration/config notes.
- Tests/build da chay.
- Manual QA scenarios.
- Risks con lai.
```
