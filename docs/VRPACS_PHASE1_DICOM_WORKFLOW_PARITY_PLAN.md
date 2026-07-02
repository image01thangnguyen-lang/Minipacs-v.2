# Ke hoach chi tiet Phase 1 - DICOM Workflow Parity MVP

Updated: 2026-07-02

## 1. Muc tieu

Phase 1 tap trung lam cho luong DICOM hang ngay cua MiniPACS gan voi VRPACS nhat co the, nhung khong mo rong sang HIS that, Non-DICOM, hoi chan, share link, hay viewer tool nang cao.

Muc tieu cuoi phase:

- Bac si/KTV/le tan co the di tu order/worklist -> nhan anh -> nhan doc -> viet ket qua -> duyet/final -> in/xuat PDF -> tra ket qua -> archive.
- Moi thay doi trang thai quan trong deu co audit/history.
- Cac thao tac hay dung trong VRPACS co mat trong UI bang nut hoac menu theo dong ca chup.
- Report form du thong tin nghiep vu toi thieu: chi dinh, ky thuat vien, mau ket qua, ky thuat tham kham, mo ta, ket luan, de nghi, mau in, anh key/snapshot lien quan.
- Cac hanh dong nguy hiem nhu huy duyet, huy phieu, sua ket qua da final chi duoc lam theo policy ro rang.

## 2. Khong nam trong Phase 1

Nhung hang muc sau chi tao diem neo/UI placeholder neu can, khong lam day du trong Phase 1:

- Tich hop HIS production: keo ca tu HIS, day ket qua sang HIS, HL7/FHIR/REST.
- Non-DICOM camera capture.
- Share link, QR, mat khau, an thong tin benh nhan.
- Hoi chan/video conference/chat.
- Viewer advanced tools: NASCET, mammography, curved MPR, fusion MPR, export video.
- Admin catalog day du: ICD mapping, vat tu, khu vuc/thu muc, backup folder.
- Xoa ca chup khoi PACS hoac xoa series.
- Native workstation: open folder, DICOM print SCU, CD/DVD burn, scanner bridge.

## 3. Trang thai hien tai can ke thua

MiniPACS hien da co:

- `WorklistOrder`: tao order, ghi MWL file, check-in, huy order, tao lai MWL.
- `ImagingStudy`: vong doi ca chup va `StudyStatus`.
- `Report`: findings, conclusion, recommendation, status, doctor.
- `StudyStatusHistory`, `ImagingStudyEvent`, `AuditLog`.
- Trang `/worklist`, `/`, `/report/[studyInstanceUid]`, `/archive`, `/statistics`.
- Role/permission co ban: `studies.read`, `reports.read`, `reports.write`, `worklist.manage`, `archive.read`, `archive.deliver`.
- Viewer bridge: mo report, luu measurement, key image, snapshot, history.

Phase 1 phai uu tien mo rong tren cac nen tang nay, khong tao module song song neu khong bat buoc.

## 4. Luong nghiep vu Phase 1

### 4.1 Luong chuan

1. Le tan/KTV tao order tu `/worklist`.
2. May chup lay MWL va gui DICOM ve Orthanc.
3. Dashboard sync study tu Orthanc vao `ImagingStudy`.
4. Ca chup vao trang thai `RECEIVED` hoac `READY_TO_READ`.
5. Bac si chon `Nhan doc` de khoa/gan ca cho minh.
6. Bac si mo viewer va report.
7. Bac si chon mau ket qua, nhap ky thuat, mo ta, ket luan, de nghi.
8. Bac si co the chen measurement/key image/snapshot tu viewer vao report.
9. Bac si luu nhap hoac hoan tat/final.
10. Le tan/in an mo archive, in lai hoac xuat PDF, ghi nhan `Da tra ket qua`.

### 4.2 Luong sua/huy trong Phase 1

- `Huy phieu`: dung cho order/report chua final, can ly do.
- `Huy duyet`: dung cho report da final, can quyen, ly do, va tao addendum/history.
- `Cho phep sua ket qua`: chi admin hoac role duoc cap quyen duoc mo khoa report final.
- `Sua report sau final`: khong ghi de im lang; phai tao `ReportAddendum` hoac history change.
- `Cap nhat thong tin lam sang`: cho phep cap nhat field clinical info va audit.
- `Them chi dinh`: them/cap nhat procedure/indication tren order/study, khong can HIS that o Phase 1.

## 5. Pham vi UI

### 5.1 Trang danh sach ca chup `/`

Can bo sung:

- Bo loc trang thai workflow: cho chup, da nhan anh, cho doc, dang doc, da final, da tra, loi.
- Bo loc may chup/station AE.
- Bo loc bac si duoc gan.
- Bo loc uu tien.
- Bo loc body part/procedure/chi dinh.
- Bo loc ngay chup nhanh: hom nay, hom qua, 3 ngay, 7 ngay, tuy chon.
- Tim kiem theo patient ID, patient name, accession, study description, procedure.
- Menu thao tac theo dong:
  - Mo viewer.
  - Mo report.
  - Nhan doc.
  - Gan bac si.
  - Cap nhat lam sang.
  - Them chi dinh.
  - Huy phieu.
  - Huy duyet neu da final va co quyen.
  - Ghi nhan da tra ket qua neu da final.

### 5.2 Trang `/worklist`

Can bo sung:

- Hien ro study status neu anh da ve.
- Hien canh bao order qua han.
- Them nut `Nhan doc` khi order da co DICOM va user co quyen.
- Them action `Cap nhat lam sang` va `Them chi dinh`.
- Them cot assigned doctor neu co.
- Filter theo station AE, priority, body part/procedure.

### 5.3 Trang report `/report/[studyInstanceUid]`

Can bo sung:

- Header workflow: status, assigned doctor, technologist, accession, modality, body part.
- Field `Ky thuat vien chup`.
- Field `Ky thuat tham kham`.
- Field `Thong tin lam sang`.
- Field danh sach chi dinh/procedure.
- Chon loai mau ket qua:
  - Mau theo chi dinh/procedure.
  - Mau ca nhan.
  - Mau global.
- Chon mau in ket qua.
- Panel du lieu tu viewer:
  - Measurements.
  - Key images.
  - Snapshots.
- Nut thao tac:
  - Luu nhap.
  - Hoan tat/final.
  - In phieu.
  - Xuat PDF neu kha thi trong web.
  - Huy phieu neu chua final.
  - Huy duyet/sua sau final neu co quyen.

### 5.4 Trang archive `/archive`

Can bo sung:

- Filter theo da final, da tra, da archive, da xoa anh.
- Action `Ghi nhan da tra ket qua` da co, can chuan hoa audit.
- Action `Mo report`, `Mo viewer`, `In lai`, `Xuat PDF`.
- Hien ro canh bao neu anh khong con trong PACS.
- Hien status history gon va ly do huy/sua neu co.

## 6. Pham vi backend va data model

### 6.1 Prisma schema de xuat

Chi them field/model neu that su can cho Phase 1. De xuat:

#### `Report`

- `technique String? @db.Text`
- `clinicalInfo String? @db.Text`
- `technologistId String?`
- `printTemplateId String?`
- `finalizedAt DateTime?`
- `cancelledAt DateTime?`
- `cancelReason String? @db.Text`
- `reopenReason String? @db.Text`

Ghi chu: `doctorId` da co. Neu `finalizedAt` trung voi `ImagingStudy.finalizedAt`, van nen co tren `Report` de report lifecycle doc lap hon.

#### `ImagingStudy`

- `clinicalInfo String? @db.Text`
- `procedureCode String?`
- `procedureDescription String?`
- `technologistId String?`
- `reportLockedByUserId String?`
- `reportLockedAt DateTime?`

Ghi chu: `assignedDoctorId` da ton tai dang string. Phase 1 co the tiep tuc dung string, nhung nen can nhac relation sang `User` neu can query/assign tot hon.

#### `ReportSelectedImage`

Model moi neu muon gan anh vao report co cau truc thay vi JSON:

- `id`
- `reportId`
- `studyInstanceUid`
- `sourceType`: `KEY_IMAGE` hoac `SNAPSHOT`
- `sourceId`
- `caption`
- `sortOrder`
- `createdAt`

Neu muon tiet kiem scope, Phase 1 co the de UI doc truc tiep tu `ViewerKeyImage` va `ViewerSnapshot`, chua can model nay.

### 6.2 Service/action can co

- `getStudyWorkflowDetail(studyInstanceUid)`
- `assignStudyDoctorAction(studyId, doctorId)`
- `startReadingStudyAction(studyInstanceUid)`
- `updateClinicalInfoAction(studyInstanceUid, input)`
- `addOrUpdateIndicationAction(studyInstanceUid, input)`
- `saveReportDraftAction(studyInstanceUid, input)`
- `finalizeReportAction(studyInstanceUid, input)`
- `cancelReportDraftAction(studyInstanceUid, reason)`
- `requestOrPerformUnfinalizeReportAction(studyInstanceUid, reason)`
- `markDeliveredAction(studyInstanceUid)`
- `getReportWorkflowTimelineAction(studyInstanceUid)`

### 6.3 Status transition policy

Dung `StudyStatus` hien co:

- `ORDERED` -> `READY_FOR_SCAN`
- `READY_FOR_SCAN` -> `RECEIVED`
- `RECEIVED` -> `STABLE`
- `STABLE` -> `READY_TO_READ`
- `READY_TO_READ` -> `READING`
- `READING` -> `REPORTED`
- `REPORTED` -> `FINALIZED`
- `FINALIZED` -> `DELIVERED`
- `DELIVERED` -> `ARCHIVED`

Luot dac biet:

- Bat ky trang thai nao -> `ERROR` khi sync loi nghiem trong.
- `READING` -> `READY_TO_READ` khi bac si huy nhan doc va chua co final.
- `FINALIZED` -> `READING` chi khi co quyen huy duyet/sua sau final, co reason, audit, va addendum.
- Khong xoa metadata RIS trong Phase 1.

### 6.4 Audit bat buoc

Moi action sau phai ghi `AuditLog` va neu doi study status thi ghi `StudyStatusHistory`:

- Nhan doc.
- Gan bac si.
- Cap nhat lam sang.
- Them/sua chi dinh.
- Luu nhap report.
- Final report.
- In/xuat PDF.
- Huy phieu.
- Huy duyet.
- Sua report sau final.
- Ghi nhan da tra ket qua.

## 7. Permission

De xuat them permission keys trong Phase 1:

- `studies.assign`
- `studies.updateClinical`
- `reports.finalize`
- `reports.cancelDraft`
- `reports.unfinalize`
- `reports.print`

Mapping mac dinh:

- `ADMIN`: tat ca.
- `DOCTOR`: read/write/finalize, update clinical, print; unfinalize neu duoc cap rieng.
- `TECHNICIAN`: studies read, worklist manage, update clinical, assign neu duoc cap.
- `RECEPTION`: worklist manage, archive read, archive deliver, print.

Neu khong muon mo schema permission qua lon trong Phase 1, co the tam map vao permission hien co:

- `reports.write` cho draft/final.
- `worklist.manage` cho update clinical/add indication/check-in.
- `archive.deliver` cho mark delivered.
- `users.manage` hoac `reports.write + ADMIN baseRole` cho unfinalize.

Nhung nen tach permission som de tranh kho mo rong sau nay.

## 8. Trinh tu trien khai

### Step 1 - Chuan hoa workflow service

- Tao hoac mo rong service dung chung cho status transition.
- Gom logic hien co trong `studyStatus.ts` thanh API ro rang hon.
- Them validate transition va reason bat buoc voi action nguy hiem.
- Viet helper ghi `StudyStatusHistory`, `ImagingStudyEvent`, `AuditLog`.

Done khi:

- Moi action workflow goi qua service chung.
- Khong con trang thai cap nhat truc tiep roi quen history.

### Step 2 - Mo rong data model toi thieu

- Them field can thiet cho report/clinical/technologist/lock/finalization.
- Tao migration Prisma.
- Cap nhat seed neu can.
- Cap nhat type mapping/action.

Done khi:

- `prisma generate` va migration/db push chay duoc.
- Existing data khong bi mat.

### Step 3 - Bo loc va row action cho danh sach ca chup

- Them filter state tren `/`.
- Cap nhat action lay danh sach ca de filter server-side neu du lieu lon.
- Them row action menu.
- Them modal cap nhat lam sang/them chi dinh.
- Them action nhan doc/gan bac si.

Done khi:

- User co the tim dung ca theo cac truong VRPACS hay dung.
- User co the thao tac ca chup ma khong phai vao man hinh khac neu khong can.

### Step 4 - Nang cap `/worklist`

- Them cot assigned doctor/study status.
- Them filter station AE/body part/procedure/priority.
- Them action nhan doc khi anh da ve.
- Them update clinical/add indication.

Done khi:

- KTV/le tan nhin duoc order nao da co anh, order nao qua han, order nao dang cho doc.

### Step 5 - Nang cap report page

- Them field technique, clinical info, technologist, indication/procedure, print template.
- Them panel viewer artifacts: measurement/key image/snapshot.
- Them template picker theo scope: procedure/global/personal.
- Them buttons final/cancel/unfinalize theo permission.
- Chuan hoa print context.

Done khi:

- Report form dap ung day du luong "Quy trinh tra ket qua" trong HDSD DICOM o muc MVP.

### Step 6 - Nang cap archive va delivery

- Chuan hoa `mark delivered`.
- Hien status history va report lifecycle.
- Dam bao in lai/xuat PDF co audit.
- Hien canh bao khi anh da bi xoa hoac khong mo viewer duoc.

Done khi:

- Le tan co the tra ket qua va in lai ma khong can quay ve worklist.

### Step 7 - QA va regression

- Test luong order moi -> DICOM ve -> nhan doc -> draft -> final -> print -> delivered.
- Test huy phieu khi chua final.
- Test huy duyet/sua sau final co reason.
- Test role khong co quyen bi chan server-side.
- Test study co anh trong Orthanc nhung khong co order.
- Test order co accession nhung anh chua ve.
- Test report final trong archive van mo/in duoc.

Done khi:

- Cac test manual pass va khong lam hong viewer/report/archive/worklist hien co.

## 9. File/chuc nang du kien cham vao

Backend/dashboard:

- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/lib/studyStatus.ts`
- `dashboard/app/actions.ts`
- `dashboard/app/worklist/actions.ts`
- `dashboard/app/report/[studyInstanceUid]/actions.ts`
- `dashboard/app/archive/actions.ts`
- `dashboard/app/statistics/actions.ts` neu can dong bo KPI/status.

Frontend/dashboard:

- `dashboard/app/page.tsx`
- `dashboard/app/worklist/page.tsx`
- `dashboard/app/report/[studyInstanceUid]/page.tsx`
- `dashboard/app/archive/page.tsx`
- Component moi cho row action menu, clinical modal, indication modal, workflow timeline.

Viewer/report bridge:

- `dashboard/app/api/viewer/studies/[uid]/report-workspace/route.ts`
- `dashboard/app/api/viewer/studies/[uid]/report-workspace/measurements/route.ts`
- `dashboard/app/api/viewer/studies/[uid]/report-workspace/key-images/route.ts`

## 10. Acceptance criteria

Phase 1 duoc xem la xong khi dat cac tieu chi sau:

1. Mot ca DICOM co the di tron luong: worklist -> received -> ready to read -> reading -> finalized -> delivered -> archive.
2. Co filter theo status, date, modality, station AE, assigned doctor, priority, patient, accession, procedure.
3. Row action menu co it nhat: open viewer, open report, nhan doc, assign doctor, update clinical, add indication, cancel draft/form, mark delivered.
4. Report page co field technique, clinical info, technologist, indication/procedure, print template.
5. Report page chen duoc measurement/key image/snapshot da co tu viewer vao noi dung report hoac report workspace.
6. Final report bi khoa sua truc tiep; neu sua sau final phai co reason va addendum/history.
7. Archive co the in lai/xuat PDF/log thao tac va mark delivered.
8. Moi action quan trong co audit/history.
9. Permission duoc enforce server-side, khong chi an nut tren UI.
10. Khong regression luong mo OHIF viewer, luu report, tao worklist, archive search.

## 11. Rui ro va cach xu ly

### Rui ro 1 - Scope creep sang HIS

Xu ly:

- Phase 1 chi tao field/status placeholder neu can.
- Action `Cap nhat tu HIS` va `Gui sang HIS` de Phase 2.

### Rui ro 2 - Data model phinh qua som

Xu ly:

- Chi them field co UI va workflow dung ngay.
- Dung `AuditLog`/`StudyStatusHistory` hien co truoc khi tao them model moi.

### Rui ro 3 - Sua report final lam mat tinh phap ly

Xu ly:

- Final report mac dinh read-only.
- Sua sau final bat buoc reason.
- Tao addendum/history.
- Audit actor/time/content summary.

### Rui ro 4 - Logic status rai rac

Xu ly:

- Moi transition di qua service chung.
- Khong update `ImagingStudy.status` truc tiep trong UI action.

### Rui ro 5 - UI qua day

Xu ly:

- Row action menu gom thao tac phu.
- Toolbar chi giu action chinh.
- Modal nho cho update clinical/add indication.

## 12. De xuat chia nho thanh PR

PR 1:

- Workflow service, permission keys, schema toi thieu, migration.

PR 2:

- Study list filters va row action menu.

PR 3:

- Worklist enhancements va assign/nhan doc.

PR 4:

- Report page enhancements va report lifecycle policy.

PR 5:

- Archive/delivery polish va audit.

PR 6:

- QA fixes, regression, documentation update.

## 13. Checklist ban giao Phase 1

- [ ] Data model/migration duoc review.
- [ ] Permission matrix duoc review.
- [ ] Workflow transition table duoc review.
- [ ] UI filters va actions hoat dong tren du lieu that.
- [ ] Report final/unfinalize policy hoat dong va co audit.
- [ ] Archive delivery/in lai co audit.
- [ ] Manual QA tren it nhat 3 modality: DX/CR, US, CT hoac MR.
- [ ] Khong co action quan trong nao chi kiem tra quyen o client.
- [ ] Cap nhat roadmap neu scope thay doi.

## 14. Prompt ban giao cho AI khac

Copy toan bo prompt duoi day de giao cho mot AI/coding agent khac lam Phase 1:

```text
Ban la coding agent dang lam trong repo MiniPACS tai `D:\Antigravity\Minipacs-v.2`.

Muc tieu cua ban la trien khai Phase 1 - DICOM Workflow Parity MVP. Phase nay tap trung luong DICOM hang ngay: worklist/order -> DICOM received -> ready to read -> reading -> report draft/final -> print/PDF -> delivered -> archive. Khong mo rong sang HIS production, Non-DICOM, share link, hoi chan/video, advanced viewer tools, export video/download manager, hoac xoa study/series.

Hay doc ky truoc khi code:

- `docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md`
- `docs/VRPACS_PHASE0_PRODUCT_BASELINE_SAFETY_PLAN.md`
- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- Neu da co, doc them cac file Phase 0 output:
  - `docs/VRPACS_FEATURE_INVENTORY.md`
  - `docs/VRPACS_TERMINOLOGY_MAP.md`
  - `docs/VRPACS_MINIPACS_CAPABILITY_MATRIX.md`
  - `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
  - `docs/VRPACS_WORKFLOW_STATUS_POLICY.md`
  - `docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md`
  - `docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md`
  - `docs/VRPACS_IMPLEMENTATION_BACKLOG.md`

Sau do doc code hien tai:

- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/lib/studyStatus.ts`
- `dashboard/app/actions.ts`
- `dashboard/app/worklist/actions.ts`
- `dashboard/app/worklist/page.tsx`
- `dashboard/app/page.tsx`
- `dashboard/app/report/[studyInstanceUid]/actions.ts`
- `dashboard/app/report/[studyInstanceUid]/page.tsx`
- `dashboard/app/archive/actions.ts`
- `dashboard/app/archive/page.tsx`
- `dashboard/app/api/viewer/studies/[uid]/report-workspace/**`
- `dashboard/app/api/viewer/studies/[uid]/measurements/**`
- `dashboard/app/api/viewer/studies/[uid]/key-images/**`

Trien khai theo thu tu uu tien:

1. Workflow service va status transition:
   - Mo rong/chuan hoa service trong `dashboard/lib/studyStatus.ts` hoac tach helper moi neu can.
   - Moi transition quan trong phai ghi `StudyStatusHistory` va/hoac `AuditLog`.
   - Khong update `ImagingStudy.status` truc tiep rai rac trong UI actions.

2. Permission:
   - Mo rong `dashboard/lib/permissions.ts` neu can cho cac action Phase 1: assign study, update clinical, finalize, cancel draft, unfinalize, print.
   - Permission phai enforce server-side, khong chi an nut client.

3. Data model toi thieu:
   - Them field can dung ngay cho report/workflow, vi du technique, clinicalInfo, technologistId, printTemplateId, finalizedAt, cancelledAt, cancelReason, reopenReason, report lock neu can.
   - Tao migration Prisma neu repo dang dung migrations; neu workflow hien tai dung db push thi ghi ro trong ket qua.
   - Khong tao model lon neu UI/workflow Phase 1 chua dung.

4. Study list `/`:
   - Them filter theo status, date, modality, station AE, assigned doctor, priority, patient, accession, procedure.
   - Them row action menu: open viewer, open report, nhan doc, assign doctor, update clinical, add indication, cancel draft/form, mark delivered khi phu hop.

5. Worklist `/worklist`:
   - Hien study status khi anh da ve.
   - Hien order qua han neu co.
   - Them action nhan doc khi da co DICOM va user co quyen.
   - Them update clinical/add indication.
   - Them assigned doctor/station/body part/procedure filters neu kha thi.

6. Report page:
   - Them field technique, clinical info, technologist, indication/procedure, print template.
   - Them panel/doc du lieu tu viewer: measurements, key images, snapshots.
   - Them lifecycle buttons: save draft, finalize, print, cancel draft/form, unfinalize/sua sau final theo permission va reason.
   - Report final mac dinh read-only; sua sau final phai co reason va addendum/history.

7. Archive:
   - Chuan hoa mark delivered, print/PDF audit.
   - Hien workflow/status history va warning khi khong mo viewer duoc.

8. QA:
   - Test manual cac luong: order -> received -> reading -> draft -> final -> print -> delivered; cancel draft; unfinalize final co reason; role khong co quyen bi chan; archive search/open report/open viewer.
   - Chay lint/build/test phu hop neu repo co command kha dung.

Rang buoc:

- Giu scope Phase 1. HIS production, Non-DICOM, share/consultation, advanced viewer, bulk download/delete de Phase sau.
- Khong revert thay doi cua user.
- Khong dung command destructive nhu git reset hard.
- Neu co thay doi schema, giai thich migration/db push can chay.
- UI phai theo style hien co cua dashboard, khong tao landing page, khong doi palette lon ngoai scope.
- Moi action nhay cam phai co audit va permission server-side.
- Neu gap blocker, ghi ro blocker, file lien quan, va workaround de tiep tuc.

Ket qua mong muon:

- Code Phase 1 duoc implement theo PR nho hoac mot batch ro rang.
- Docs/backlog duoc cap nhat neu scope thay doi.
- Tra loi cuoi cung gom: files changed, behavior changed, tests run, tests not run, migration notes, remaining risks.
```
