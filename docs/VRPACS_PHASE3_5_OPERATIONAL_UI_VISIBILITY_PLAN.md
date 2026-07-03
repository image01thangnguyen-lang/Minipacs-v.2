# Ke hoach chi tiet Phase 3.5 - Operational UI Visibility

Updated: 2026-07-03

## 1. Muc tieu

Phase 3.5 la phase UI van hanh nam giua Phase 3 va Phase 4.

Muc tieu cua phase nay: dua nhung gi Phase 1, Phase 2, va Phase 3 da lam duoc ra giao dien hang ngay, de nguoi dung nhin thay va thao tac duoc tren Study List, Worklist, Report, Archive, va Statistics.

Ly do can phase rieng:

- Phase 1 tao workflow, status, report lifecycle, assign doctor, update clinical info, delivery, audit.
- Phase 2 tao HIS sync, HIS result status, retry, audit.
- Phase 3 tao admin catalogs, procedure/service/template/machine/facility/permission mapping.
- Nhieu du lieu va action da co backend, nhung UI danh sach ca chup van con mong, nen nguoi dung khong nhin thay ket qua cua cac thao tac nhu "gan bac si", "cap nhat HIS", "chon procedure", "gan KTV", "cho duyet", "da tra".

Phase 3.5 phai bien man hinh van hanh thanh noi dieu phoi that su, khong chi la bang ca chup toi thieu.

## 2. Ket qua mong muon

Sau Phase 3.5:

- Nguoi dung nhin thay bac si duoc gan doc ca ngay tren danh sach ca chup.
- Nguoi dung phan biet duoc bac si duoc gan va bac si da ky report.
- Nguoi dung nhin thay KTV, procedure, chi dinh, clinical info rut gon, may chup, facility/room neu co.
- Nguoi dung nhin thay trang thai ca chup, trang thai report, trang thai HIS order, trang thai HIS result trong cung mot row.
- Nguoi dung loc duoc ca chua gan bac si, ca theo bac si, ca HIS failed, ca qua SLA, ca theo procedure/service/machine/facility.
- Detail panel cho mot ca chup hien day du thong tin Phase 1/2/3, gom order, study, report, assignment, HIS, audit/history ngan.
- Worklist hien ro order nao chua co DICOM, order nao da match study, order nao sync HIS loi.
- Archive hien du thong tin report doctor, assigned doctor, delivery, HIS result.
- UI khong hien nut/action ma backend se tu choi vi thieu quyen.

## 3. Khong nam trong Phase 3.5

Phase 3.5 khong lam cac viec sau:

- Khong tao workflow moi ngoai cac action Phase 1/2/3 da co.
- Khong tao HIS production adapter moi.
- Khong lam viewer advanced tools, MPR, 3D, key image workflow nang cao.
- Khong lam Non-DICOM capture.
- Khong lam share link, consultation, video, chat.
- Khong hard-delete study/series.
- Khong thay doi clinical report lifecycle neu chi can hien thi.
- Khong import PHI that vao seed/test.

Neu thieu du lieu do Phase 3 chua xong, UI phai graceful fallback: hien "Chua cau hinh", "Chua gan", hoac an filter lien quan.

## 4. Nguon du lieu can surfacing

### 4.1 Phase 1 - DICOM workflow parity

Can dua ra UI:

- `ImagingStudy.status`
- `Report.status`
- `WorklistOrder.orderStatus`
- `ImagingStudy.assignedDoctorId`
- `Report.doctorId`
- `Report.finalizedAt`
- `ImagingStudy.technologistId`
- `ImagingStudy.clinicalInfo`
- `ImagingStudy.procedureCode`
- `ImagingStudy.procedureDescription`
- `ImagingStudy.bodyPart`
- `ImagingStudy.stationAeTitle`
- `ImagingStudy.scheduledAt`, `receivedAt`, `stableAt`, `finalizedAt`, `deliveredAt`
- Delivery status and delivered time.
- Report addendum/unfinalize/cancel states where available.

### 4.2 Phase 2 - HIS integration

Can dua ra UI:

- `WorklistOrder.hisOrderId`
- `WorklistOrder.hisPatientId`
- `WorklistOrder.hisVisitId`
- `WorklistOrder.hisDepartmentCode`
- `WorklistOrder.hisSyncStatus`
- `WorklistOrder.hisLastSyncedAt`
- `WorklistOrder.hisLastError`
- `ImagingStudy.hisSyncStatus`
- `ImagingStudy.hisResultStatus`
- `ImagingStudy.hisLastSyncedAt`
- `ImagingStudy.hisLastResultSentAt`
- `ImagingStudy.hisLastError`
- `Report.hisResultStatus`
- `Report.hisResultSentAt`
- `Report.hisResultMessageId`
- `Report.hisResultError`
- Recent `HisSyncLog` rows for selected study/order.

### 4.3 Phase 3 - Admin catalogs and permissions

Can dua ra UI neu Phase 3 da co data:

- Procedure/service display name from `ProcedureCatalog`.
- Service type display name.
- Machine/DICOM node display name, facility, room, department.
- Print template assignment/source.
- Report template mapping source: personal, procedure, ICD, machine, facility, default.
- Per-doctor/per-machine/per-action effective permission indicator if useful.
- Facility/area/folder labels.

## 5. Nguyen tac UX

### 5.1 Bang van hanh phai scan nhanh

Study List va Worklist la man hinh lam viec lap lai nhieu lan trong ngay. UI can:

- Mat do thong tin cao nhung khong roi mat.
- Badge ngan, co mau on dinh.
- Ten bac si/KTV/procedure phai thay ngay.
- Dong phu duoi ten benh nhan dung cho accession, indication, body part.
- Khong day tat ca vao mot cot lon.

### 5.2 Tach row summary va detail panel

Row chi hien thong tin quan trong nhat.

Detail panel ben phai hien day du:

- Patient/order summary.
- Procedure/clinical info.
- Assignment.
- Workflow status timeline.
- HIS sync/result.
- Report and delivery.
- Audit/history ngan.

### 5.3 Role-based visibility

UI co the an nut theo quyen, nhung server-side permission van la nguon su that.

Vi du:

- Reception thay check-in, delivery, print, HIS update neu co quyen.
- Technician thay worklist, KTV, clinical info, QC/action neu co.
- Doctor thay assigned-to-me, start reading, report, finalize.
- Admin thay full metadata, audit, abnormal state correction.

### 5.4 PHI and safety

- Khong dua patient name/id vao file PDF filename.
- HIS/audit error hien message sanitize.
- Detail panel khong log token/raw HIS payload.
- Download/export/share related UI de Phase 4/6/8 xu ly.

## 6. Data contract de xuat

Tao hoac chuan hoa cac view model server-side, tranh frontend ghep du lieu lung tung.

### 6.1 `StudyListRowView`

Fields de xuat:

```ts
type StudyListRowView = {
  studyInstanceUid: string;
  orthancStudyId?: string | null;
  accessionNumber?: string | null;

  patientName?: string | null;
  patientId?: string | null;
  patientDob?: string | null;
  patientSex?: string | null;

  modality?: string | null;
  bodyPart?: string | null;
  studyDescription?: string | null;
  stationAeTitle?: string | null;
  stationName?: string | null;
  facilityName?: string | null;

  procedureCode?: string | null;
  procedureName?: string | null;
  procedureDescription?: string | null;
  serviceTypeName?: string | null;

  clinicalInfo?: string | null;
  clinicalInfoSnippet?: string | null;
  indicationText?: string | null;

  orderStatus?: string | null;
  workflowStatus: string;
  reportStatus?: string | null;

  assignedDoctorId?: string | null;
  assignedDoctorName?: string | null;
  assignedDoctorTitle?: string | null;

  reportDoctorId?: string | null;
  reportDoctorName?: string | null;
  reportDoctorTitle?: string | null;

  technologistId?: string | null;
  technologistName?: string | null;

  hisSyncStatus?: string | null;
  hisResultStatus?: string | null;
  hisLastError?: string | null;
  hisLastSyncedAt?: string | null;
  hisLastResultSentAt?: string | null;

  scheduledAt?: string | null;
  receivedAt?: string | null;
  stableAt?: string | null;
  finalizedAt?: string | null;
  deliveredAt?: string | null;

  waitingMinutes?: number | null;
  readingMinutes?: number | null;
  slaStatus?: "OK" | "WARNING" | "BREACH" | null;

  canOpenViewer: boolean;
  canOpenReport: boolean;
  canAssignDoctor: boolean;
  canUpdateClinical: boolean;
  canStartReading: boolean;
  canFinalize: boolean;
  canDeliver: boolean;
  canSyncHis: boolean;
};
```

### 6.2 `WorklistOrderRowView`

Can bo sung:

- `matchedStudyInstanceUid`
- `hasDicomImages`
- `dicomReceivedAt`
- `assignedDoctorName`
- `technologistName`
- `procedureName`
- `serviceTypeName`
- `facilityName`
- `hisSyncStatus`
- `overdueNoDicom`
- `canUpdateFromHis`
- `canOpenStudy`

### 6.3 `ArchiveRowView`

Can bo sung:

- `assignedDoctorName`
- `reportDoctorName`
- `deliveredAt`
- `deliveredByName` neu co audit/user data.
- `hisResultStatus`
- `hisResultSentAt`
- `hisMessageId`
- `printTemplateName`
- `procedureName`

## 7. Man hinh can cap nhat

### 7.1 Dashboard Study List route `/`

Muc tieu: man hinh dieu phoi ca chup trong ngay.

Cot/section de xuat:

1. Patient/Study
   - Patient name.
   - Patient ID.
   - Accession number.
   - Study date/time.

2. Procedure
   - Modality badge.
   - Procedure name/code.
   - Body part.
   - Machine/facility small text.

3. Workflow
   - Study status badge.
   - Report status badge.
   - Order status badge neu co.

4. Assignment
   - Assigned doctor.
   - Reading/report doctor.
   - Technologist.
   - Neu chua gan: badge "Chua gan".

5. HIS
   - HIS order sync.
   - HIS result sync.
   - Failed state with warning icon.

6. SLA/Time
   - Waiting time.
   - Received/stable/finalized/delivered time.
   - SLA warning.

7. Actions
   - Open viewer.
   - Open report.
   - Start reading.
   - Assign doctor.
   - Update clinical info.
   - Add indication.
   - Mark delivered.
   - Retry/update HIS if allowed.

Filters de xuat:

- Date preset.
- Workflow status.
- Report status.
- Assigned doctor.
- "Chua gan bac si".
- Technologist.
- Modality.
- Machine/station AE.
- Facility.
- Procedure/service type.
- HIS status: all, order failed, result failed, pending, synced.
- SLA: all, warning, breach.
- Search: patient, accession, procedure, doctor.

Detail panel:

- Header: patient, accession, modality, status stack.
- Assignment card: assigned doctor, report doctor, technologist.
- Procedure card: service, procedure, body part, clinical info, indication.
- HIS card: order sync, result sync, last error, retry.
- Timeline card: order, received, stable, reading, finalized, delivered.
- Action history summary: last 5 workflow/audit events.

### 7.2 Worklist route `/worklist`

Muc tieu: reception/technician thay order truoc khi co anh va sau khi da match DICOM.

Can hien:

- Order status.
- Study/matched DICOM status.
- Overdue >24h without DICOM.
- Procedure/service name.
- Scheduled machine/facility.
- Assigned doctor neu da gan tu study/order.
- Technologist neu co.
- HIS order sync status.
- Clinical info/indication snippet.

Actions:

- Update from HIS.
- Check-in.
- Regenerate MWL.
- Cancel order.
- Update clinical info.
- Add indication.
- Open viewer/report only when matched DICOM exists.

Filters:

- Order status.
- Has DICOM / no DICOM.
- HIS failed.
- Scheduled machine.
- Procedure/service.
- Date.
- Patient/accession.

### 7.3 Report detail route `/report/[studyInstanceUid]`

Muc tieu: bac si thay day du context truoc khi doc va sau khi ky.

Can hien:

- Assigned doctor vs current reading doctor/report doctor.
- Technologist.
- Procedure/service/template source.
- Clinical info/indication.
- HIS result status, retry when failed and report final/delivered.
- Print template selected.
- Viewer artifacts summary: measurements, key images, snapshots.
- Workflow status and report status.
- Warning if user is not assigned doctor but has override permission.

### 7.4 Archive route `/archive`

Muc tieu: tim lai, in lai, giao tra, va kiem tra sync result.

Can hien:

- Assigned doctor.
- Report/finalizing doctor.
- Procedure/service.
- Delivery status/time.
- HIS result sent/failed.
- Last print/export.
- Can open viewer or images deleted warning.

Filters:

- Doctor.
- Procedure/service.
- HIS result status.
- Delivery status.
- Date finalized/delivered.
- Modality/facility.

### 7.5 Statistics route `/statistics`

Muc tieu: surface aggregate cua cac field Phase 1/2/3.

Bo sung neu chua co:

- Unassigned studies count.
- Assigned by doctor queue.
- HIS failed count.
- Pending HIS result count.
- Procedure/service volume.
- Machine/facility workload.
- SLA breach by doctor/machine/procedure.

## 8. Component de xuat

Tao component dung chung:

- `StudyStatusStack`
- `ReportStatusBadge`
- `OrderStatusBadge`
- `HisStatusBadge`
- `AssignmentBadge`
- `DoctorLabel`
- `TechnologistLabel`
- `ProcedurePill`
- `SlaBadge`
- `ClinicalSnippet`
- `WorkflowTimelineMini`
- `OperationalDetailPanel`
- `StudyListFilterBar`
- `ColumnVisibilityMenu` neu can.

Khong lap lai logic mau badge trong tung page neu co the gom lai.

## 9. Backend/action work

### 9.1 Query enrichment

Can bo sung server-side enrichment:

- Map `assignedDoctorId` -> user display name/title.
- Map `Report.doctorId` -> report doctor name/title.
- Map `technologistId` -> user display name.
- Map procedure code/id -> `ProcedureCatalog`.
- Map station AE/DICOM node -> machine display name/facility.
- Map HIS status and last error.

Tranh N+1:

- Lay danh sach doctor/technologist ids, query `User` mot lan.
- Lay procedure codes, query catalog mot lan.
- Lay station AE, query `DicomNode` mot lan.
- Map vao rows server-side.

### 9.2 Actions can cap nhat

Files co kha nang dung:

- `dashboard/app/actions.ts`
- `dashboard/app/worklist/actions.ts`
- `dashboard/app/archive/actions.ts`
- `dashboard/app/report/[studyInstanceUid]/actions.ts`
- `dashboard/app/statistics/actions.ts`
- `dashboard/lib/studyStatus.ts`
- `dashboard/lib/workflowService.ts`

Actions/view functions de xuat:

- `getStudyListRowsAction(filters)`
- `getStudyOperationalDetailAction(studyInstanceUid)`
- `getWorklistRowsAction(filters)`
- `getArchiveRowsAction(filters)`
- `getAssignableDoctorsAction(studyInstanceUid?)`
- `getOperationalFilterOptionsAction()`

Neu khong muon tao action moi, co the mo rong action hien co, nhung phai giu return shape ro rang.

### 9.3 Permission

Moi action mutating van dung server-side permission:

- Assign doctor: `studies.assign`.
- Update clinical: `studies.updateClinical`.
- Start reading/write report: `reports.write`.
- Finalize/approve: `reports.finalize`.
- Delivery: `archive.deliver`.
- HIS sync/retry: `his.sync`, `his.retry`.
- Admin catalog data: permission Phase 3 tuong ung.

UI chi hien nut khi co permission, nhung backend van enforce.

## 10. Hien thi assigned doctor

Day la yeu cau uu tien P0 cua Phase 3.5.

Acceptance:

- Sau khi user bam "Gan bac si", row tren Study List doi tu "Chua gan" sang ten bac si ngay.
- Detail panel hien:
  - "Bac si duoc gan": assigned doctor.
  - "Bac si doc/ky": report doctor neu da co report.
- Filter "Chua gan" hien dung cac ca `assignedDoctorId` null.
- Filter theo bac si hien cac ca assigned cho bac si do.
- Neu report doctor khac assigned doctor, UI hien ca hai, khong ghi de nhau.

## 11. Visual layout de xuat

Study row nen co cau truc:

```text
Patient / Accession        Procedure / Machine        Status stack        Assignment        HIS        Time/SLA        Actions
Nguyen Van A               CT Brain                   READY_TO_READ       Dr. B             OK/FAILED  42m wait        ...
PID / ACC...               Head, clinical snippet     Report: DRAFT       KTV: C            Result...  Stable 09:20
```

Detail panel nen co section:

```text
[Patient]
[Procedure & Clinical]
[Assignment]
[Workflow]
[HIS]
[Report & Delivery]
[Recent History]
```

Mobile/tablet:

- Row card compact thay cho bang rong.
- Action menu gom nut phu.
- Filter drawer hoac collapsed filter.

## 12. PR breakdown de xuat

### PR 3.5A - Data contracts and serializers

- Tao/chuan hoa view model types.
- Enrich rows voi doctor/technologist/procedure/machine names.
- Them helper format status/SLA.
- Khong thay doi UI lon trong PR nay.

### PR 3.5B - Study List operational table

- Them cot assignment, procedure, HIS, SLA.
- Them status stack.
- Them filter assigned doctor/unassigned/HIS/SLA/procedure.
- Update inline state sau assign/finalize/HIS retry.

### PR 3.5C - Detail panel

- Rework right-side detail panel.
- Hien assignment, clinical, procedure, HIS, workflow timeline.
- Them recent history/audit summary.

### PR 3.5D - Worklist operational UI

- Hien order vs DICOM match.
- Hien overdue no DICOM.
- Hien HIS sync and update action.
- Hien procedure/service/machine/facility.
- Hien assigned doctor/KTV neu co.

### PR 3.5E - Report and Archive visibility

- Report detail hien assigned doctor/report doctor/KTV/procedure/template/HIS.
- Archive hien assigned doctor/report doctor/procedure/delivery/HIS.
- Filter archive theo doctor/procedure/HIS/delivery.

### PR 3.5F - Statistics and QA

- Them operational counters neu data co san.
- Regression worklist/report/archive/statistics.
- Build/typecheck.
- Update docs and acceptance checklist.

## 13. Acceptance scenarios

### Scenario 1 - Gan bac si thay ngay tren Study List

1. Mo `/`.
2. Chon mot ca chua gan.
3. Bam "Gan bac si".
4. Chon bac si.
5. Row hien ten bac si ngay.
6. Detail panel hien assigned doctor.
7. Filter "Chua gan" khong con hien ca do.

### Scenario 2 - Report doctor khac assigned doctor

1. Gan ca cho Doctor A.
2. Doctor B co quyen override doc/ky.
3. Final report.
4. UI hien:
   - Assigned doctor: Doctor A.
   - Report doctor: Doctor B.
5. Audit/history khong bi mat.

### Scenario 3 - HIS failed thay tren row

1. Mock HIS send result failed.
2. Study List row hien `HIS Result: FAILED`.
3. Report detail hien nut Retry neu report final/delivered va user co quyen.
4. Retry success thi row/detail cap nhat `SYNCED`.

### Scenario 4 - Worklist no DICOM overdue

1. Tao order.
2. Qua 24h chua co `orthancStudyId`.
3. Worklist hien warning.
4. Neu DICOM match ve sau, warning bien mat.

### Scenario 5 - Procedure catalog display

1. Phase 3 co `ProcedureCatalog`.
2. Worklist/Study List hien procedure name thay vi chi code.
3. Neu catalog inactive, record cu van hien ten/code cu, dropdown tao moi khong hien inactive.

### Scenario 6 - Permission UI match backend

1. User thieu `studies.assign`.
2. UI khong hien action assign.
3. Goi action truc tiep van bi server reject.

## 14. Test/build checklist

Can chay neu moi truong cho phep:

- `npm run build` trong `dashboard`.
- Type check neu co command rieng.
- Manual `/`.
- Manual `/worklist`.
- Manual `/report/[studyInstanceUid]`.
- Manual `/archive`.
- Manual `/statistics`.
- Kiem tra user role: admin, doctor, technician, reception.
- Kiem tra HIS mode disabled va mock.
- Kiem tra UI voi catalog Phase 3 rong/chua co data.

Neu co Playwright/dev server:

- Screenshot desktop 1440px.
- Screenshot tablet/mobile neu layout responsive co thay doi.
- Check khong overlap text trong table/card.

## 15. Migration note

Phase 3.5 uu tien surfacing UI, nen ly tuong la khong can migration moi.

Chi tao migration neu that su can:

- User column/view preference.
- Saved filters.
- Explicit assignment history model neu Phase 1/3 chua co audit du.

Neu Phase 3 da them catalog/mapping, Phase 3.5 chi doc va hien thi, khong doi schema.

## 16. Rui ro va cach giam

| Rui ro | Tac dong | Giam thieu |
| --- | --- | --- |
| Bang qua nhieu cot | Kho dung hang ngay | Dung column priority, detail panel, column visibility |
| N+1 query khi enrich doctor/procedure | Cham list | Query batch va map server-side |
| Assigned doctor va report doctor bi nham | Sai nghiep vu | Label ro hai field, acceptance test rieng |
| HIS status stale sau unfinalize/retry | UI gay hieu nham | Clear/cap nhat ca `Report` va `ImagingStudy`, refetch detail |
| Catalog Phase 3 chua co data | UI trong/loi | Fallback code/raw text va "Chua cau hinh" |
| Permission UI lech backend | Dead click/bao loi muon | Tao permission flags server-side cho row/action |
| Text dai overlap | UI xau | Truncate, tooltip, detail panel |

## 17. Checklist ban giao Phase 3.5

- [ ] Study List hien assigned doctor.
- [ ] Study List hien report doctor neu da co report.
- [ ] Study List hien KTV neu co.
- [ ] Study List hien procedure/service/machine/facility neu co.
- [ ] Study List hien workflow/report/HIS status stack.
- [ ] Study List co filter unassigned/doctor/HIS/SLA/procedure.
- [ ] Detail panel hien day du Phase 1/2/3 summary.
- [ ] Worklist hien order vs DICOM match, HIS, procedure, assignment.
- [ ] Report detail hien assigned doctor, report doctor, KTV, procedure, HIS.
- [ ] Archive hien assigned doctor, report doctor, delivery, HIS.
- [ ] Permission flags khop server-side.
- [ ] Build pass.
- [ ] Manual scenarios pass.
- [ ] Docs updated.

## 18. Prompt ban giao cho AI khac

Copy prompt duoi day cho coding agent thuc hien Phase 3.5:

```text
Ban la coding agent trong repo MiniPACS. Hay thuc hien Phase 3.5 - Operational UI Visibility.

Muc tieu: dua tat ca du lieu/action da lam trong Phase 1, Phase 2, va Phase 3 ra UI van hanh, dac biet Study List `/`, Worklist `/worklist`, Report detail `/report/[studyInstanceUid]`, Archive `/archive`, va Statistics `/statistics`.

Hay doc truoc:

- `docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md`
- `docs/VRPACS_PHASE2_HIS_INTEGRATION_PLAN.md`
- `docs/VRPACS_PHASE3_ADMIN_CATALOG_PERMISSION_PLAN.md`
- `docs/VRPACS_PHASE3_5_OPERATIONAL_UI_VISIBILITY_PLAN.md`
- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_WORKFLOW_STATUS_POLICY.md`
- `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
- `docs/VRPACS_TERMINOLOGY_MAP.md`

Sau do doc code hien tai:

- `dashboard/prisma/schema.prisma`
- `dashboard/app/actions.ts`
- `dashboard/app/page.tsx`
- `dashboard/app/worklist/actions.ts`
- `dashboard/app/worklist/page.tsx`
- `dashboard/app/report/[studyInstanceUid]/actions.ts`
- `dashboard/app/report/[studyInstanceUid]/page.tsx`
- `dashboard/app/archive/actions.ts`
- `dashboard/app/archive/page.tsx`
- `dashboard/app/statistics/actions.ts`
- `dashboard/lib/studyStatus.ts`
- `dashboard/lib/workflowService.ts`
- `dashboard/lib/permissions.ts`

Uu tien P0:

1. Study List phai hien bac si duoc gan (`assignedDoctorId -> user name`) tren tung row.
2. Detail panel phai hien bac si duoc gan, bac si report/ky, KTV, procedure, clinical info, workflow/report/HIS status.
3. Filter duoc "Chua gan bac si" va theo bac si.
4. Sau action gan bac si, UI row/detail cap nhat ngay, khong can reload.

Uu tien P1:

1. Hien HIS order/result status tren Study List, Worklist, Report, Archive.
2. Hien procedure/service/machine/facility neu Phase 3 da co data.
3. Hien SLA/waiting time.
4. Worklist hien no-DICOM overdue va match DICOM.
5. Archive hien assigned doctor/report doctor/delivery/HIS.

Rang buoc:

- Khong tao workflow moi neu action Phase 1/2/3 da co.
- Khong lam viewer advanced tools.
- Khong lam HIS production adapter.
- Khong revert thay doi cua user.
- Khong hard-code PHI vao seed/test.
- Khong de UI action hien neu backend se tu choi do thieu quyen.
- Server-side permission van la bat buoc.
- Tranh N+1 query khi map doctor/procedure/machine names.
- Neu Phase 3 catalog chua co data, graceful fallback.

Ket qua mong muon:

- Files changed list.
- Behavior changed summary.
- Tests/build da chay.
- Manual scenarios da test.
- Nhung UI field nao hien duoc va field nao fallback.
- Rui ro con lai neu co.
```
