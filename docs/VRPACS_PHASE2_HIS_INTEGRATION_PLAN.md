# Ke hoach chi tiet Phase 2 - HIS Integration Layer

Updated: 2026-07-02

## 1. Muc tieu

Phase 2 tap trung xay lop tich hop HIS cho MiniPACS theo cach an toan, co adapter ro rang, co mock de test, co audit/retry, va khong lam vo luong DICOM workflow da co o Phase 1.

Muc tieu cuoi phase:

- Co abstraction HIS integration de MiniPACS co the ket noi nhieu kieu HIS: REST, HL7, FHIR, hoac custom API.
- Co mock HIS adapter de dev/test khong can HIS that.
- Co action `Cap nhat ca chup tu HIS` de lay demographics, chi dinh, clinical info, payment/source fields neu HIS cung cap.
- Co action `Gui ket qua sang HIS` khi report da final.
- Co HIS sync state tren UI va trong database: pending, sent, failed, skipped, disabled.
- Co retry flow cho HIS sync loi.
- Co audit day du cho inbound update, outbound result send, retry, cancel approval sync.
- Khong ghi de du lieu clinical/report quan trong ma khong co policy va audit.

## 2. Khong nam trong Phase 2

Phase 2 khong lam cac viec sau:

- Khong build mot HIS day du.
- Khong hard-code theo mot HIS vendor neu chua co spec chinh thuc.
- Khong trien khai Non-DICOM capture.
- Khong trien khai share link, QR, video conference, consultation room.
- Khong trien khai export/download manager lon.
- Khong xoa study/series hoac retention cleanup.
- Khong thay doi viewer advanced tools.
- Khong sua workflow report final ngoai nhung hook can thiet de send HIS.

Neu chua co spec HIS that, Phase 2 van co gia tri bang cach tao adapter boundary, mock adapter, UI/action, audit, va retry infrastructure.

## 3. He thong hien tai can ke thua

MiniPACS hien da co:

- `WorklistOrder` voi patient/procedure/accession/payment/source fields co ban.
- `ImagingStudy` voi studyInstanceUid, accessionNumber, patientId, patientName, status, assignedDoctorId.
- `Report` voi findings, conclusion, recommendation, doctorId, status.
- `AuditLog`, `StudyStatusHistory`, `ImagingStudyEvent`.
- `updateStudyStatusForReport` va `syncOrthancStudyToRis`.
- UI `/worklist`, `/`, `/report/[studyInstanceUid]`, `/archive`, `/statistics`.
- Permission `worklist.manage`, `reports.write`, `archive.deliver`, `pacs.manage`, `users.manage`.

Phase 2 phai mo rong cac model/action nay, khong tao luong HIS song song lam lech RIS/PACS workflow.

## 4. Nguyen tac kien truc

### 4.1 Adapter-first

Moi tich hop HIS phai di qua interface chung:

- `HisAdapter`
- `HisClient`
- `HisSyncService`

Khong goi HIS truc tiep tu UI component.

### 4.2 Mock-first

Phai co `MockHisAdapter` de:

- Test luong update ca chup tu HIS.
- Test gui ket qua sang HIS.
- Test retry failed sync.
- Test error/timeout/invalid payload.

Mock adapter nen doc data tu config hoac static fixture noi bo, khong can network.

### 4.3 No silent overwrite

Khi HIS tra ve data khac data hien co:

- Field hanh chinh co the cap nhat neu policy cho phep.
- Field clinical/procedure quan trong phai log diff.
- Field report final khong bi ghi de tu HIS.
- Neu conflict lon, ghi status `CONFLICT` hoac tao alert de user review.

### 4.4 Audit everything

Moi call HIS inbound/outbound/retry/cancel phai co audit:

- Actor.
- Entity.
- Direction.
- Endpoint/action.
- Request id/correlation id neu co.
- Success/failure.
- Error code/message da sanitize.
- Payload summary khong lo PHI qua muc can thiet.

### 4.5 Deployment-specific connector

Phase 2 chi can tao connector boundary. REST/HL7/FHIR production adapter co the lam khi co spec HIS that.

## 5. Data model de xuat

### 5.1 Enum/constant sync state

Neu dung Prisma enum:

- `HisSyncStatus`
  - `DISABLED`
  - `PENDING`
  - `SYNCED`
  - `FAILED`
  - `CONFLICT`
  - `SKIPPED`

Neu muon tranh migration enum phuc tap, dung string field co validation service.

### 5.2 Mo rong `WorklistOrder`

De xuat field:

- `hisOrderId String?`
- `hisPatientId String?`
- `hisVisitId String?`
- `hisDepartmentCode String?`
- `hisSyncStatus String?`
- `hisLastSyncedAt DateTime?`
- `hisLastError String? @db.Text`
- `hisPayloadJson String? @db.Text`

Ghi chu:

- `hisPayloadJson` chi luu summary hoac payload da scrub neu co PHI.
- Khong luu token/secret trong payload.

### 5.3 Mo rong `ImagingStudy`

De xuat field:

- `hisOrderId String?`
- `hisSyncStatus String?`
- `hisResultStatus String?`
- `hisLastSyncedAt DateTime?`
- `hisLastResultSentAt DateTime?`
- `hisLastError String? @db.Text`

### 5.4 Mo rong `Report`

De xuat field:

- `hisResultStatus String?`
- `hisResultSentAt DateTime?`
- `hisResultMessageId String?`
- `hisResultError String? @db.Text`

### 5.5 Model moi `HisSyncLog`

Nen tao model rieng de trace retry/history:

- `id String @id @default(uuid())`
- `direction String` - `INBOUND` hoac `OUTBOUND`
- `action String` - `UPDATE_ORDER`, `SEND_RESULT`, `CANCEL_RESULT`, `RETRY`
- `status String` - `SUCCESS`, `FAILED`, `CONFLICT`, `SKIPPED`
- `entityType String`
- `entityId String?`
- `studyInstanceUid String?`
- `accessionNumber String?`
- `hisOrderId String?`
- `hisMessageId String?`
- `requestSummaryJson String? @db.Text`
- `responseSummaryJson String? @db.Text`
- `errorCode String?`
- `errorMessage String? @db.Text`
- `actorUserId String?`
- `createdAt DateTime @default(now())`

Index de xuat:

- `createdAt`
- `studyInstanceUid`
- `accessionNumber`
- `hisOrderId`
- `status`
- `action`

## 6. Interface de xuat

### 6.1 Types

Can co cac type noi bo:

- `HisOrderQuery`
- `HisOrderPayload`
- `HisPatientPayload`
- `HisProcedurePayload`
- `HisReportPayload`
- `HisSendResultResponse`
- `HisSyncResult`
- `HisAdapterHealth`

### 6.2 `HisAdapter`

Interface de xuat:

```ts
export interface HisAdapter {
  id: string;
  label: string;
  isEnabled(): boolean;
  healthCheck(): Promise<HisAdapterHealth>;
  fetchOrder(query: HisOrderQuery): Promise<HisSyncResult<HisOrderPayload>>;
  sendResult(payload: HisReportPayload): Promise<HisSyncResult<HisSendResultResponse>>;
  cancelResult?(payload: HisReportPayload): Promise<HisSyncResult<HisSendResultResponse>>;
}
```

### 6.3 Adapter modes

Can ho tro config:

- `HIS_INTEGRATION_MODE=disabled`
- `HIS_INTEGRATION_MODE=mock`
- `HIS_INTEGRATION_MODE=rest`
- `HIS_INTEGRATION_MODE=hl7`
- `HIS_INTEGRATION_MODE=fhir`

Phase 2 MVP:

- `disabled`
- `mock`
- Skeleton cho `rest` neu co spec.

## 7. Pham vi backend

### 7.1 Services

Tao folder de xuat:

- `dashboard/lib/his/types.ts`
- `dashboard/lib/his/hisAdapter.ts`
- `dashboard/lib/his/mockHisAdapter.ts`
- `dashboard/lib/his/restHisAdapter.ts` neu co spec.
- `dashboard/lib/his/hisSyncService.ts`
- `dashboard/lib/his/hisPayloadMapper.ts`
- `dashboard/lib/his/hisAudit.ts`

### 7.2 Server actions

Can co:

- `getHisStatusAction(entityId)`
- `updateOrderFromHisAction(input)`
- `sendReportToHisAction(studyInstanceUid)`
- `retryHisSyncAction(syncLogId)`
- `cancelHisResultAction(studyInstanceUid, reason)` neu policy cho phep.
- `getHisSyncLogsAction(filters)`
- `testHisConnectionAction()`

### 7.3 API routes neu can

Neu UI/client can fetch logs rieng:

- `GET /api/his/status`
- `GET /api/his/logs`
- `POST /api/his/orders/update`
- `POST /api/his/reports/send`
- `POST /api/his/retry`

Tuy nhien nen uu tien server actions trong dashboard neu pattern hien tai dang dung server actions.

## 8. Mapping du lieu

### 8.1 HIS -> MiniPACS order/study

Mapping de xuat:

| HIS field | MiniPACS field | Rule |
| --- | --- | --- |
| orderId | `WorklistOrder.hisOrderId` | immutable neu da set |
| patientId | `patientId` / `hisPatientId` | cap nhat neu trong hoac user confirm |
| patientName | `patientName` / `patientName` | cap nhat co audit |
| dob | `dob` | cap nhat neu co |
| gender | `gender` | normalize M/F/O |
| phone | `phone` | optional |
| accessionNumber | `accessionNumber` | conflict neu khac |
| procedureCode | `procedureCode` | cap nhat |
| procedureDescription | `procedureDescription` | cap nhat |
| modality | `modality` | conflict neu khac anh DICOM da nhan |
| bodyPart | `bodyPart` | cap nhat |
| referringPhysician | `referringPhysician` | cap nhat |
| referringDepartment | `referringDepartment` | cap nhat |
| clinicalInfo | `clinicalInfo` neu co field Phase 1 | cap nhat co audit |
| paymentStatus | `paymentStatus` | cap nhat |
| priority | `priority` | normalize ROUTINE/URGENT/STAT |

### 8.2 MiniPACS report -> HIS

Payload result toi thieu:

- `hisOrderId`
- `accessionNumber`
- `studyInstanceUid`
- `patientId`
- `patientName`
- `modality`
- `procedureCode`
- `procedureDescription`
- `findings`
- `conclusion`
- `recommendation`
- `doctorName`
- `doctorLicenseNumber`
- `finalizedAt`
- `reportHtml` hoac plain text theo adapter.
- `pdfUrl` neu Phase 1/2 co export PDF reliable.

Rule:

- Chi send report khi status final/completed.
- Khong send draft.
- Neu report da sua sau final, send lai voi version/addendum info neu adapter support.
- Neu HIS response failed, khong rollback report final; chi mark HIS failed va cho retry.

## 9. Pham vi UI

### 9.1 Worklist va study list

Can bo sung:

- Cot/trang thai HIS sync: disabled, pending, synced, failed, conflict.
- Filter HIS status.
- Action row:
  - `Cap nhat tu HIS`.
  - `Xem log HIS`.
  - `Retry HIS` neu failed.

Neu HIS disabled:

- Hien action disabled voi tooltip/config note.

### 9.2 Report page

Can bo sung:

- HIS result status trong header/report action area.
- Nut `Gui ket qua sang HIS` chi hien khi report final va user co quyen.
- Nut `Retry gui HIS` khi failed.
- Hien last sent time, message id, error summary.
- Neu report final nhung chua gui HIS, hien badge `Chua gui HIS`.

### 9.3 Archive

Can bo sung:

- Filter/result status HIS neu co.
- Hien HIS sent/failed trong detail.
- Action retry send neu final va user co quyen.

### 9.4 Admin/PACS/IT

Phase 2 MVP co the them man hinh nho hoac panel trong settings:

- Mode HIS: disabled/mock/rest.
- Health check.
- Last sync logs.

Neu khong them UI admin ngay:

- Dung env vars va diagnostics page/logs.
- Van can docs cau hinh.

## 10. Permission

De xuat permission moi:

- `his.read`
- `his.sync`
- `his.retry`
- `his.manage`

Mapping mac dinh:

- `ADMIN`: tat ca.
- `DOCTOR`: `his.read`, `his.sync` cho send report neu duoc phep.
- `TECHNICIAN`: `his.read`, `his.sync` cho update order neu duoc phep.
- `RECEPTION`: `his.read`, update order neu phong kham muon le tan dong bo HIS.

Neu chua muon them permission moi:

- `worklist.manage` cho update order from HIS.
- `reports.write` hoac `reports.finalize` cho send result.
- `pacs.manage` cho HIS config/health.

Khuyen nghi them permission moi de Phase 2 ro rang va de audit.

## 11. Audit va security

### 11.1 Audit bat buoc

- HIS health check.
- Update order from HIS.
- Send result to HIS.
- Retry sync.
- Cancel result/unfinalize sync.
- HIS config change.
- Conflict accepted/ignored neu co.

### 11.2 Security rules

- Khong log secret/token.
- Scrub request/response payload truoc khi luu log.
- Khong expose raw HIS payload cho user khong co quyen.
- Timeout/retry co gioi han.
- Server-side permission cho moi action.
- HIS endpoint/token doc tu env hoac secure config, khong hard-code.

### 11.3 Error handling

Error status de xuat:

- `HIS_DISABLED`
- `HIS_TIMEOUT`
- `HIS_AUTH_FAILED`
- `HIS_NOT_FOUND`
- `HIS_VALIDATION_ERROR`
- `HIS_CONFLICT`
- `HIS_REMOTE_ERROR`
- `HIS_UNKNOWN_ERROR`

UI chi hien message da sanitize.

## 12. Retry va queue

Phase 2 MVP co the retry thu cong truoc:

- User bam `Retry`.
- Service doc log/entity va goi lai adapter.
- Cap nhat `HisSyncLog`.

Neu can auto retry:

- Them retry count.
- Them nextRetryAt.
- Them max retry.
- Chua can scheduler neu project chua co background job.

Khuyen nghi:

- Phase 2 lam manual retry.
- Phase 8/9 moi lam queue/scheduler neu can.

## 13. Trinh tu trien khai

### Step 1 - Chot HIS contract

- Tao types/interface adapter.
- Tao mock adapter.
- Tao mapper order/report.

Done khi:

- Co the unit test mock fetch order/send result khong can network.

### Step 2 - Schema va migration

- Them fields sync status toi thieu.
- Them `HisSyncLog`.
- Them indexes.

Done khi:

- Prisma generate/build pass.
- Existing data khong mat.

### Step 3 - Service layer

- Tao `hisSyncService`.
- Implement update order from HIS.
- Implement send report to HIS.
- Implement retry.
- Implement audit/log scrub.

Done khi:

- Server actions goi service chung, khong goi adapter truc tiep rai rac.

### Step 4 - Permissions

- Them permission HIS.
- Gan role default.
- Enforce server-side.

Done khi:

- User khong co quyen bi chan o action.

### Step 5 - UI worklist/study list

- Them HIS badge/status.
- Them filter HIS status.
- Them row action update/retry/log.

Done khi:

- User nhin duoc ca nao synced/failed/pending.

### Step 6 - UI report/archive

- Them HIS result status.
- Them send result/retry.
- Hien error/last sent/message id.

Done khi:

- Report final co the gui mock HIS va hien status.

### Step 7 - Admin/diagnostics

- Them health check action.
- Them docs env config.
- Them log view neu scope cho phep.

Done khi:

- Admin biet HIS dang disabled/mock/online/failed.

### Step 8 - QA

- Test disabled mode.
- Test mock success.
- Test mock order not found.
- Test mock timeout/failure.
- Test send report success.
- Test send report failed va retry.
- Test permission denied.
- Test payload scrub/audit.

Done khi:

- Manual scenarios pass va khong regression Phase 1.

## 14. Acceptance criteria

Phase 2 duoc xem la xong khi:

1. Co `HisAdapter` interface va `MockHisAdapter`.
2. Co config mode `disabled` va `mock`.
3. Co `HisSyncLog` hoac co cach log sync tuong duong.
4. Co action update order/study from HIS qua service chung.
5. Co action send final report to HIS qua service chung.
6. Co retry manual cho sync failed.
7. UI hien HIS status tren worklist/study/report/archive toi thieu.
8. Permission HIS duoc enforce server-side.
9. Audit/log co actor, entity, action, status, error sanitized.
10. Report draft khong gui HIS.
11. HIS failure khong rollback report final.
12. Mock test/manual scenarios pass.
13. Khong hard-code HIS vendor trong core workflow.
14. Docs cau hinh HIS duoc cap nhat.

## 15. Test scenarios

### Scenario 1 - HIS disabled

Precondition:

- `HIS_INTEGRATION_MODE=disabled`

Steps:

1. Mo worklist.
2. Chon action update from HIS.

Expected:

- Action bi disable hoac tra message HIS disabled.
- Co audit neu user thuc hien action.

### Scenario 2 - Mock update order success

Precondition:

- `HIS_INTEGRATION_MODE=mock`
- Mock co order match accession.

Steps:

1. Mo worklist.
2. Bam update from HIS.

Expected:

- Order/study cap nhat demographics/procedure/clinical info theo policy.
- HIS status thanh synced.
- Co HisSyncLog success.

### Scenario 3 - Mock update order not found

Expected:

- Status failed hoac skipped theo policy.
- UI hien error da sanitize.
- Khong ghi de data hien co.

### Scenario 4 - Send final report success

Precondition:

- Report final.
- Mock adapter send success.

Expected:

- Report/study result status synced/sent.
- Luu message id neu co.
- Co audit/log.

### Scenario 5 - Send draft report blocked

Expected:

- Server action reject.
- Khong goi adapter.
- UI bao report chua final.

### Scenario 6 - Send report failed then retry

Expected:

- Lan dau status failed.
- Retry tao log moi.
- Neu success, status synced.

### Scenario 7 - Permission denied

Expected:

- User khong co `his.sync` bi chan server-side.

### Scenario 8 - Conflict from HIS

Expected:

- Neu accession/modality/patient conflict, khong silent overwrite.
- Status conflict va log diff summary.

## 16. Rui ro va cach xu ly

### Rui ro 1 - Chua co spec HIS that

Xu ly:

- Lam mock adapter va interface truoc.
- De `rest/hl7/fhir` adapter skeleton hoac deferred.

### Rui ro 2 - HIS payload co PHI va secret

Xu ly:

- Scrub payload truoc khi log.
- Khong log token/header secret.

### Rui ro 3 - Sync HIS ghi de sai du lieu clinical

Xu ly:

- No silent overwrite.
- Field conflict can review.
- Audit diff.

### Rui ro 4 - Report final gui HIS that bai

Xu ly:

- Khong rollback final report.
- Mark failed, cho retry.
- Alert/statistics co the lam sau.

### Rui ro 5 - Adapter lam roi workflow core

Xu ly:

- UI/server action goi `hisSyncService`, khong goi adapter truc tiep.
- Core workflow van chay khi HIS disabled.

## 17. De xuat chia nho thanh PR

PR 2A:

- HIS types, adapter interface, mock adapter, config mode.

PR 2B:

- Schema fields, `HisSyncLog`, migration.

PR 2C:

- `hisSyncService`, update order from HIS, send report to HIS, retry, audit scrub.

PR 2D:

- Permission HIS va server action enforcement.

PR 2E:

- UI worklist/study list HIS status/action.

PR 2F:

- UI report/archive send/retry/result status.

PR 2G:

- QA, docs, diagnostics, backlog update.

## 18. Checklist ban giao Phase 2

- [ ] `HisAdapter` interface da co.
- [ ] `MockHisAdapter` da co.
- [ ] Config `disabled/mock` da hoat dong.
- [ ] Schema sync fields/log da co migration hoac note db push.
- [ ] Update order from HIS action da co.
- [ ] Send final report to HIS action da co.
- [ ] Retry failed sync da co.
- [ ] HIS status hien tren UI toi thieu.
- [ ] Permission server-side da enforce.
- [ ] Audit/log scrub da co.
- [ ] Manual scenarios pass.
- [ ] Docs cau hinh HIS da cap nhat.
- [ ] Khong regression Phase 1 workflow.

## 19. Prompt ban giao cho AI khac

Copy toan bo prompt duoi day de giao cho mot AI/coding agent khac lam Phase 2:

```text
Ban la coding agent dang lam trong repo MiniPACS tai `D:\Antigravity\Minipacs-v.2`.

Muc tieu cua ban la trien khai Phase 2 - HIS Integration Layer. Phase nay tao lop tich hop HIS an toan, adapter-first, mock-first, co sync status, audit, retry, va UI action toi thieu. Khong hard-code mot HIS vendor neu chua co spec chinh thuc. Khong lam Non-DICOM, share link, consultation/video, advanced viewer, bulk download, xoa study/series.

Hay doc ky truoc khi code:

- `docs/VRPACS_PHASE2_HIS_INTEGRATION_PLAN.md`
- `docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md`
- `docs/VRPACS_PHASE0_PRODUCT_BASELINE_SAFETY_PLAN.md`
- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- Neu da co, doc them:
  - `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
  - `docs/VRPACS_WORKFLOW_STATUS_POLICY.md`
  - `docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md`
  - `docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md`
  - `docs/VRPACS_IMPLEMENTATION_BACKLOG.md`

Sau do doc code hien tai:

- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/lib/studyStatus.ts`
- `dashboard/app/worklist/actions.ts`
- `dashboard/app/worklist/page.tsx`
- `dashboard/app/page.tsx`
- `dashboard/app/report/[studyInstanceUid]/actions.ts`
- `dashboard/app/report/[studyInstanceUid]/page.tsx`
- `dashboard/app/archive/actions.ts`
- `dashboard/app/archive/page.tsx`
- `dashboard/app/statistics/actions.ts`
- `dashboard/app/api/viewer/studies/[uid]/report-workspace/**`

Trien khai theo thu tu:

1. Tao HIS adapter boundary:
   - `dashboard/lib/his/types.ts`
   - `dashboard/lib/his/hisAdapter.ts`
   - `dashboard/lib/his/mockHisAdapter.ts`
   - `dashboard/lib/his/hisSyncService.ts`
   - `dashboard/lib/his/hisPayloadMapper.ts`
   - `dashboard/lib/his/hisAudit.ts`

2. Config:
   - Ho tro `HIS_INTEGRATION_MODE=disabled` va `mock`.
   - Neu mode disabled, core workflow van chay binh thuong.

3. Data model:
   - Them sync fields toi thieu vao `WorklistOrder`, `ImagingStudy`, `Report` neu can.
   - Tao `HisSyncLog` hoac logging tuong duong.
   - Tao migration neu repo dung migration; neu dung db push thi ghi ro.

4. Service/actions:
   - `updateOrderFromHisAction`
   - `sendReportToHisAction`
   - `retryHisSyncAction`
   - `getHisSyncLogsAction` hoac cach xem log toi thieu.
   - Moi action goi `hisSyncService`, khong goi adapter truc tiep rai rac.

5. Permission:
   - Them permission `his.read`, `his.sync`, `his.retry`, `his.manage` neu phu hop.
   - Enforce server-side.

6. UI:
   - Worklist/study list hien HIS sync status, filter status neu kha thi, action update/retry/log.
   - Report page hien HIS result status, send result khi report final, retry khi failed.
   - Archive hien HIS result status va retry neu co quyen.

7. Audit/security:
   - Scrub payload/log, khong log token/secret.
   - Audit update from HIS, send result, retry, health check.
   - Report draft khong duoc gui HIS.
   - HIS failed khong rollback final report.

8. QA:
   - Test disabled mode.
   - Test mock update success/not found/conflict.
   - Test send final report success/failure/retry.
   - Test permission denied.
   - Test payload scrub/audit.
   - Chay lint/build/test phu hop neu repo co command kha dung.

Rang buoc:

- Khong revert thay doi cua user.
- Khong dung command destructive nhu git reset hard.
- Khong commit PHI/DICOM that.
- Khong lam integration production neu chua co HIS spec.
- Neu gap blocker, ghi ro blocker, file lien quan, va de xuat workaround.

Ket qua mong muon:

- Code Phase 2 duoc implement theo PR nho hoac batch ro rang.
- Docs/backlog duoc cap nhat neu scope thay doi.
- Tra loi cuoi cung gom: files changed, behavior changed, tests run, tests not run, migration notes, config/env notes, remaining risks.
```

