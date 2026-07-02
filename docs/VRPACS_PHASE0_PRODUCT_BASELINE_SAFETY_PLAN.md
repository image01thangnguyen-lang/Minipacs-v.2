# Ke hoach chi tiet Phase 0 - Product Baseline And Safety Map

Updated: 2026-07-03

## 1. Muc tieu

Phase 0 la phase chot baseline san pham truoc khi code tiep. Phase nay khong uu tien xay tinh nang moi. Muc tieu la bien cac tai lieu HDSD VRPACS va tinh nang hien co cua MiniPACS thanh mot bo tai lieu ro rang de cac phase sau trien khai dung scope, dung thu tu, va khong tao logic song song.

Muc tieu cuoi phase:

- Co danh sach nguon tham chieu chinh thuc va ban gap matrix duoc chot.
- Co tu dien thuat ngu nghiep vu dung chung giua VRPACS va MiniPACS.
- Co inventory tinh nang theo module: DICOM, Viewer, Non-DICOM, Admin, Archive, Statistics, HIS, Share/Consultation.
- Co ma tran quyen/action cho cac thao tac clinical, admin, viewer, export, destructive.
- Co bang trang thai workflow va transition policy ban dau.
- Co ban do du lieu nhay cam va action can audit.
- Co test dataset va manual acceptance scenarios cho Phase 1 tro di.
- Co backlog chia label/priority/phase de bat dau implement Phase 1.

## 2. Khong nam trong Phase 0

Phase 0 khong lam cac viec sau:

- Khong them migration schema san pham, tru khi chi de kiem ke hoac ghi chu.
- Khong doi UI runtime.
- Khong refactor viewer/toolbar/report/worklist.
- Khong ket noi HIS that.
- Khong code share link, Non-DICOM, video conference, download manager.
- Khong sua permission runtime neu chua co implementation phase sau.
- Khong xoa, reset, hoac thay doi du lieu production/local dang co.

Neu phat hien bug nghiem trong trong Phase 0, tao muc `Phase 0 blocker` trong backlog, khong sua chen vao neu khong duoc uu tien rieng.

## 3. Dau vao can dung

### 3.1 Tai lieu VRPACS

- `HDSD _VIEWER da chuyen ISOFH.docx`
- `HDSD_DICOM da chuyen ISOFH.docx`
- `HDSD_NON-DICOM da chuyen ISOFH.docx`
- `HDSD_ADMIN da chuyen ISOFH.docx`

Can trich xuat cac nhom thong tin:

- Ten module.
- Man hinh/chuc nang.
- Action nguoi dung.
- Trang thai lien quan.
- Quyen lien quan.
- Du lieu dau vao/dau ra.
- Co lien quan HIS hay khong.
- Co lien quan viewer/anh DICOM hay khong.
- Co phai action nguy hiem hay khong.

### 3.2 Code MiniPACS hien tai

Can kiem ke:

- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/lib/studyStatus.ts`
- `dashboard/app/actions.ts`
- `dashboard/app/worklist/actions.ts`
- `dashboard/app/report/[studyInstanceUid]/actions.ts`
- `dashboard/app/archive/actions.ts`
- `dashboard/app/statistics/actions.ts`
- `dashboard/app/admin/users/actions.ts`
- `dashboard/app/admin/pacs/nodes/actions.ts`
- `dashboard/app/api/viewer/**`
- `ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts`
- `ohif-viewer/extensions/minipacs/src/services/**`
- `ohif-viewer/modes/minipacs-viewer/src/**`
- `docker-compose.yml`
- `config/orthanc.json` hoac template tuong ung neu co.

### 3.3 Tai lieu noi bo da co

- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_TOOL_INVENTORY_PHASE1.md`
- `docs/RIS_PACS_NEXT_MODULES_PLAN.md`
- `docs/OHIF_VR_PACS_VIEWER_CUSTOMIZATION_PLAN.md`
- Cac plan viewer phase 2-15 neu can tra cuu tinh nang viewer da lam.

## 4. Deliverables cua Phase 0

Phase 0 nen tao/cap nhat cac file sau:

- `docs/VRPACS_PHASE0_PRODUCT_BASELINE_SAFETY_PLAN.md`
- `docs/VRPACS_FEATURE_INVENTORY.md`
- `docs/VRPACS_MINIPACS_CAPABILITY_MATRIX.md`
- `docs/VRPACS_TERMINOLOGY_MAP.md`
- `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
- `docs/VRPACS_WORKFLOW_STATUS_POLICY.md`
- `docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md`
- `docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md`
- `docs/VRPACS_IMPLEMENTATION_BACKLOG.md`

Status 2026-07-03: da tao baseline v0.1 cho tat ca file tren. Cac phase sau phai doc bo file nay truoc khi code de tranh conflict ve thuat ngu, status, permission, audit, va backlog.

Thu tu doc khuyen nghi:

1. `docs/VRPACS_TERMINOLOGY_MAP.md`
2. `docs/VRPACS_FEATURE_INVENTORY.md`
3. `docs/VRPACS_MINIPACS_CAPABILITY_MATRIX.md`
4. `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
5. `docs/VRPACS_WORKFLOW_STATUS_POLICY.md`
6. `docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md`
7. `docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md`
8. `docs/VRPACS_IMPLEMENTATION_BACKLOG.md`

Neu muon giam so file, co the gom cac noi dung tren vao 2 file:

- `docs/VRPACS_PHASE0_BASELINE_PACK.md`
- `docs/VRPACS_IMPLEMENTATION_BACKLOG.md`

Khuyen nghi: tach file de de review va de cac phase sau tham chieu.

## 5. Workstream 1 - Source inventory va traceability

Muc tieu: moi gap hoac tinh nang trong roadmap deu co nguon tham chieu.

Can lam:

- Tao bang source inventory cho 4 HDSD.
- Moi module trong VRPACS phai co source: Viewer, DICOM, Non-DICOM, Admin.
- Moi item quan trong phai co `sourceDoc`, `sourceSection`, `rawLabel`, `normalizedFeature`.
- Danh dau item nao da co trong MiniPACS, co mot phan, chua co, khong lam, de phase sau.
- Danh dau item nao can xac minh them bang demo/UI that.

Bang de xuat:

| id | sourceDoc | sourceSection | rawLabel | normalizedFeature | module | status | note |
| --- | --- | --- | --- | --- | --- | --- | --- |

Status de xuat:

- `implemented`
- `partial`
- `missing`
- `deferred`
- `not_planned`
- `needs_validation`

Done khi:

- Khong con tinh nang lon nao trong HDSD bi bo qua ma khong co ly do.
- Gap matrix co the trace nguoc ve tai lieu goc.

## 6. Workstream 2 - Terminology map

Muc tieu: tranh viec cung mot khai niem co nhieu ten trong code va product.

Can chot mapping:

| VRPACS term | MiniPACS term/code | Y nghia | Ghi chu |
| --- | --- | --- | --- |
| Ca chup | ImagingStudy / Study | Mot lan chup/khai thac anh | Gan voi StudyInstanceUID khi co DICOM |
| Chi dinh | Procedure / Indication | Lenh/dich vu can thuc hien | Co the den tu worklist hoac HIS |
| Nhan doc | Start reading / lock study | Bac si bat dau doc ca | Gan assigned doctor/reading status |
| Duyet ket qua | Finalize report | Ky/hoan tat report | Can lock report sau final |
| Huy duyet | Unfinalize/reopen report | Mo lai report final | Can reason va audit |
| Huy phieu | Cancel draft/order/report form | Huy phieu chua final | Khac voi xoa anh |
| Tra ket qua | Mark delivered | Le tan tra report cho benh nhan | Archive/delivery |
| May chup | DicomNode / Station AE | Thiet bi gui anh/MWL | Co DICOM va Non-DICOM |
| Mau ket qua | ReportTemplateText | Mau noi dung report | Global/procedure/personal |
| Mau in | PrintTemplate | HTML print template | Gan phong kham/may/dich vu |
| Lich su kham | Patient/study history | Cac ca truoc cua patient | Dung cho compare/history |

Done khi:

- Tat ca phase docs dung cung mot tu.
- Cac ten field/model moi o Phase 1 duoc chon theo terminology nay.

## 7. Workstream 3 - Capability matrix

Muc tieu: biet ro MiniPACS da co gi, con thieu gi, va can lam o phase nao.

Can lap matrix theo module:

- DICOM workflow.
- Report workflow.
- Viewer 2D.
- Viewer MPR/3D.
- Viewer workflow tools.
- Non-DICOM.
- Admin users/roles.
- Admin catalogs.
- PACS/IT.
- Archive/delivery.
- Statistics.
- HIS sync.
- Share/consultation.
- Export/download/delete.
- Native workstation.

Bang de xuat:

| module | feature | VRPACS expected | MiniPACS current | gap | targetPhase | priority | risk |
| --- | --- | --- | --- | --- | --- | --- | --- |

Priority de xuat:

- `P0`: blocker cho luong doc tra ket qua.
- `P1`: can cho parity hang ngay.
- `P2`: quan trong nhung co workaround.
- `P3`: nang cao/deferred.

Risk de xuat:

- `clinical`
- `security`
- `data_loss`
- `integration`
- `performance`
- `native_dependency`
- `low`

Done khi:

- Moi item trong roadmap co target phase.
- Phase 1 co danh sach scope ro, khong lan sang Phase 2+.

## 8. Workstream 4 - Permission/action matrix

Muc tieu: moi action quan trong deu co rule quyen truoc khi code.

Role hien co:

- `ADMIN`
- `DOCTOR`
- `TECHNICIAN`
- `RECEPTION`
- Custom role profile qua `AppRoleProfile`

Permission hien co:

- `studies.read`
- `reports.read`
- `reports.write`
- `worklist.manage`
- `archive.read`
- `archive.deliver`
- `statistics.read`
- `statistics.doctorStats`
- `users.manage`
- `templates.manage`
- `clinic.manage`
- `pacs.manage`

Can de xuat permission moi cho cac phase:

- `studies.assign`
- `studies.updateClinical`
- `reports.finalize`
- `reports.cancelDraft`
- `reports.unfinalize`
- `reports.print`
- `viewer.share`
- `viewer.export`
- `viewer.anonymize`
- `studies.delete`
- `admin.catalogs.manage`
- `his.sync`
- `consultation.manage`

Action matrix can co:

| action | module | defaultRoleAllowed | permission | requiresReason | auditRequired | phase |
| --- | --- | --- | --- | --- | --- | --- |
| Open viewer | DICOM/Viewer | ADMIN, DOCTOR, TECHNICIAN | studies.read | no | yes | 1 |
| Start reading | Report | ADMIN, DOCTOR | reports.write | no | yes | 1 |
| Assign doctor | Workflow | ADMIN, TECHNICIAN | studies.assign | no | yes | 1 |
| Finalize report | Report | ADMIN, DOCTOR | reports.finalize | no | yes | 1 |
| Unfinalize report | Report | ADMIN | reports.unfinalize | yes | yes | 1 |
| Mark delivered | Archive | ADMIN, RECEPTION | archive.deliver | no | yes | 1 |
| Push result to HIS | HIS | ADMIN, DOCTOR | his.sync | no | yes | 2 |
| Delete study | PACS | ADMIN | studies.delete | yes | yes | 8 |

Done khi:

- Phase 1 implementation khong phai doan quyen theo cam tinh.
- Cac action nguy hiem da co rule reason/audit.

## 9. Workstream 5 - Workflow status policy

Muc tieu: chot vong doi ca chup/report truoc khi code Phase 1.

Status hien co trong `StudyStatus`:

- `ORDERED`
- `READY_FOR_SCAN`
- `IN_PROGRESS`
- `RECEIVED`
- `STABLE`
- `NEEDS_QC`
- `QC_REJECTED`
- `READY_TO_READ`
- `READING`
- `REPORTED`
- `FINALIZED`
- `DELIVERED`
- `ARCHIVED`
- `DELETED_FROM_PACS`
- `ERROR`

Can lap bang:

| from | to | trigger | actor | reasonRequired | auditEvent | allowedWhen |
| --- | --- | --- | --- | --- | --- | --- |

Can chot:

- Khi nao Orthanc sync tu dong day status.
- Khi nao user action duoc doi status.
- Khi nao report status keo theo study status.
- Khi nao delivery/archived co the thay doi.
- Khi nao duoc quay lui status.
- Trang thai nao khong duoc mo viewer.
- Trang thai nao khong duoc sua report.

Nguyen tac:

- Khong update status truc tiep trong UI action.
- Moi transition di qua service chung.
- Transition nguy hiem can reason.
- Moi transition can history.
- Report final khong bi ghi de im lang.

Done khi:

- Co bang transition duoc review.
- Phase 1 service co the implement theo bang nay.

## 10. Workstream 6 - Data, audit, va safety map

Muc tieu: biet du lieu nao nhay cam, action nao can audit, va action nao co nguy co mat du lieu.

### 10.1 Data classification

Can phan loai:

- PHI: patient name, patient ID, DOB, gender, phone, address neu co.
- Clinical: study description, procedure, clinical info, findings, conclusion, recommendation.
- Image: DICOM pixel data, snapshot, key image, video.
- Credential/config: Orthanc user/pass, DB URL, DICOM node config.
- Operational: audit log, status history, performance metrics.

Bang de xuat:

| dataType | examples | storage | exposureRisk | protectionRule |
| --- | --- | --- | --- | --- |

### 10.2 Audit map

Action can audit:

- Login/logout neu kha thi.
- Open viewer.
- Open report.
- Start reading.
- Assign doctor.
- Update clinical info.
- Add/update indication.
- Save draft.
- Finalize.
- Print/export PDF.
- Unfinalize.
- Cancel form.
- Mark delivered.
- Share/export/download/delete trong phase sau.
- Admin config/user/role/template changes.

Bang de xuat:

| action | entityType | entityId | actor | metadata | retention |
| --- | --- | --- | --- | --- | --- |

### 10.3 Destructive action map

Action nguy hiem:

- Delete study.
- Delete series.
- Delete report/template/user.
- Unfinalize report.
- Cancel approval.
- Export anonymized/non-anonymized images.
- Change PACS/DICOM config.
- Change user permission.

Rule mac dinh:

- Can server-side permission.
- Can reason voi action clinical/destructive.
- Can confirmation voi delete/export sensitive.
- Can audit truoc va sau action.
- Khong xoa RIS metadata khi xoa anh.

Done khi:

- Phase 1 biet action nao bat buoc audit.
- Phase 8 co baseline cho delete/export/retention.

## 11. Workstream 7 - Test dataset va acceptance scenarios

Muc tieu: co bo test lap lai duoc cho Phase 1+.

### 11.1 Dataset can co

Toi thieu:

- 1 study DX/CR single series.
- 1 study US co cine/multiframe neu co.
- 1 study CT multi-series >= 20 images.
- 1 study MR multi-series neu co.
- 1 study co DICOM SR/SEG/PDF neu co.
- 1 study da final report.
- 1 order chua co anh.
- 1 order da co anh nhung chua doc.
- 1 study khong co order tu truoc.
- 1 patient co nhieu study de test history.

Neu chua co DICOM mau trong repo:

- Ghi lai cach import DICOM vao Orthanc local.
- Ghi accession/patient ID/study UID dung cho test.
- Khong commit DICOM co PHI that vao repo.

### 11.2 Manual scenarios

Can viet acceptance scenarios:

- Scenario 1: Tao order va check MWL file.
- Scenario 2: Orthanc nhan DICOM va dashboard sync study.
- Scenario 3: Bac si nhan doc va mo viewer/report.
- Scenario 4: Luu draft report.
- Scenario 5: Final report va in phieu.
- Scenario 6: Archive search va mark delivered.
- Scenario 7: Huy phieu chua final.
- Scenario 8: Huy duyet report final co reason.
- Scenario 9: User khong co quyen bi chan server-side.
- Scenario 10: Study da xoa anh hoac khong mo viewer duoc hien canh bao.

Bang de xuat:

| scenarioId | title | precondition | steps | expected | phase |
| --- | --- | --- | --- | --- | --- |

Done khi:

- Co it nhat 10 manual scenarios.
- Moi scenario co du precondition, steps, expected result.

## 12. Workstream 8 - Backlog va phase labels

Muc tieu: bien gap matrix thanh danh sach task co the lam.

Backlog item format:

| id | title | module | phase | priority | type | risk | dependsOn | acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Type de xuat:

- `schema`
- `backend`
- `frontend`
- `viewer`
- `admin`
- `integration`
- `security`
- `qa`
- `docs`

Label phase:

- `phase-0-baseline`
- `phase-1-dicom-workflow`
- `phase-2-his`
- `phase-3-admin-catalog`
- `phase-4-viewer-web`
- `phase-5-advanced-viewer`
- `phase-6-nondicom`
- `phase-7-share-consult`
- `phase-8-export-retention`
- `phase-9-hardening-native`

Done khi:

- Phase 1 co backlog du de implement theo PR.
- Cac item ngoai Phase 1 co label deferred, khong bi mat.

## 13. Trinh tu thuc hien Phase 0

### Step 1 - Dong goi nguon va doc lai baseline

- Xac nhan 4 file HDSD con doc duoc.
- Xac nhan roadmap/gap analysis hien co.
- Ghi lai ngay cap nhat va commit/worktree state neu can.

Output:

- Source list va note ve phien ban tai lieu.

### Step 2 - Tao feature inventory

- Tach feature tu Viewer/DICOM/Non-DICOM/Admin.
- Chuan hoa ten feature.
- Gan module/status/phase.

Output:

- `VRPACS_FEATURE_INVENTORY.md`

### Step 3 - Tao terminology map

- Map thuat ngu VRPACS sang model/code MiniPACS.
- Chot ten dung trong Phase 1.

Output:

- `VRPACS_TERMINOLOGY_MAP.md`

### Step 4 - Tao capability matrix

- Doi chieu feature inventory voi code hien tai.
- Danh dau implemented/partial/missing/deferred.
- Gan priority va risk.

Output:

- `VRPACS_MINIPACS_CAPABILITY_MATRIX.md`

### Step 5 - Tao permission/action matrix

- Lien ke tat ca action clinical/admin/viewer/export/destructive.
- Gan permission hien co hoac permission de xuat.
- Danh dau reason/audit bat buoc.

Output:

- `VRPACS_PERMISSION_ACTION_MATRIX.md`

### Step 6 - Tao workflow status policy

- Lap bang transition.
- Chot rule report final/unfinalize/cancel.
- Chot rule study co/khong co anh trong PACS.

Output:

- `VRPACS_WORKFLOW_STATUS_POLICY.md`

### Step 7 - Tao data/audit/safety map

- Phan loai du lieu.
- Lap audit map.
- Lap destructive action map.

Output:

- `VRPACS_DATA_AUDIT_SAFETY_MAP.md`

### Step 8 - Tao acceptance scenarios

- Chon bo test data.
- Viet manual scenarios cho Phase 1.
- Ghi expected result ro rang.

Output:

- `VRPACS_ACCEPTANCE_TEST_SCENARIOS.md`

### Step 9 - Tao implementation backlog

- Chuyen capability matrix thanh task.
- Sap xep Phase 1 theo PR.
- Gan dependency.

Output:

- `VRPACS_IMPLEMENTATION_BACKLOG.md`

### Step 10 - Review va chot Phase 0

- Kiem tra cac file docs khong mau thuan.
- Kiem tra Phase 1 scope khop voi backlog.
- Chot acceptance criteria de bat dau code.

Output:

- Phase 0 sign-off note trong file nay hoac backlog.

## 14. Acceptance criteria cho Phase 0

Phase 0 duoc xem la xong khi:

1. Co source inventory cho 4 HDSD.
2. Co terminology map VRPACS -> MiniPACS.
3. Co feature inventory gom Viewer, DICOM, Non-DICOM, Admin.
4. Co capability matrix voi status implemented/partial/missing/deferred.
5. Moi missing/partial quan trong co target phase.
6. Co permission/action matrix cho it nhat cac action Phase 1 va destructive action sau nay.
7. Co workflow status policy du de implement Phase 1.
8. Co data/audit/safety map cho PHI, report, image, config, audit.
9. Co it nhat 10 manual acceptance scenarios.
10. Co implementation backlog va PR grouping cho Phase 1.
11. Phase 1 plan khong con item mo hoac phu thuoc chua ro trong scope MVP.
12. Khong co docs moi chua trace duoc nguon hoac quyet dinh.

## 15. Rui ro va cach xu ly

### Rui ro 1 - Tai lieu VRPACS mo ta thao tac nhung khong ro data model

Xu ly:

- Ghi item la `needs_validation`.
- Khong dua vao Phase 1 neu anh huong schema lon.

### Rui ro 2 - Scope Phase 1 bi phinh

Xu ly:

- Bat buoc moi backlog item co phase label.
- HIS, Non-DICOM, Share/Consultation, Advanced Viewer phai de phase sau neu khong phai blocker.

### Rui ro 3 - Permission khong du min

Xu ly:

- Phase 0 de xuat permission moi.
- Phase 1 co the implement permission moi hoac map tam, nhung phai ghi ro.

### Rui ro 4 - Test data co PHI that

Xu ly:

- Khong commit DICOM that co PHI.
- Dung data sample/anonymized.
- Neu dung local data that, chi ghi UID/gia tri da an danh trong docs.

### Rui ro 5 - Gap matrix qua rong va kho lam

Xu ly:

- Tach priority P0/P1/P2/P3.
- Phase 1 chi lay P0/P1 lien quan luong DICOM workflow.

## 16. De xuat chia nho thanh PR

Phase 0 la docs/baseline, co the lam trong 1 hoac 2 PR:

PR 0A:

- Feature inventory.
- Terminology map.
- Capability matrix.

PR 0B:

- Permission/action matrix.
- Workflow status policy.
- Data/audit/safety map.
- Acceptance scenarios.
- Implementation backlog.

Neu lam nhanh trong mot PR:

- PR title: `docs: add VRPACS phase 0 baseline pack`

## 17. Checklist ban giao Phase 0

- [x] `VRPACS_FEATURE_INVENTORY.md` da tao/cap nhat.
- [x] `VRPACS_TERMINOLOGY_MAP.md` da tao/cap nhat.
- [x] `VRPACS_MINIPACS_CAPABILITY_MATRIX.md` da tao/cap nhat.
- [x] `VRPACS_PERMISSION_ACTION_MATRIX.md` da tao/cap nhat.
- [x] `VRPACS_WORKFLOW_STATUS_POLICY.md` da tao/cap nhat.
- [x] `VRPACS_DATA_AUDIT_SAFETY_MAP.md` da tao/cap nhat.
- [x] `VRPACS_ACCEPTANCE_TEST_SCENARIOS.md` da tao/cap nhat.
- [x] `VRPACS_IMPLEMENTATION_BACKLOG.md` da tao/cap nhat.
- [x] Phase 1 plan da doi chieu voi backlog o muc baseline.
- [x] Cac item ngoai Phase 1 da co target phase.
- [x] Cac action nguy hiem da co permission, reason, audit rule.
- [x] Test scenarios co du precondition, steps, expected result.

## 18. Prompt ban giao cho AI khac

Copy toan bo prompt duoi day de giao cho mot AI/coding agent khac lam Phase 0:

```text
Ban la coding/documentation agent dang lam trong repo MiniPACS tai `D:\Antigravity\Minipacs-v.2`.

Muc tieu cua ban la hoan thanh Phase 0 - Product Baseline And Safety Map cho chuong trinh so sanh VRPACS voi MiniPACS. Phase 0 la phase docs/baseline, khong code tinh nang moi, khong doi UI runtime, khong refactor san pham, khong xoa/reset du lieu.

Hay doc ky cac file sau truoc khi lam:

- `docs/VRPACS_PHASE0_PRODUCT_BASELINE_SAFETY_PLAN.md`
- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md`
- `docs/VRPACS_TOOL_INVENTORY_PHASE1.md`
- `docs/RIS_PACS_NEXT_MODULES_PLAN.md`
- `docs/OHIF_VR_PACS_VIEWER_CUSTOMIZATION_PLAN.md`
- Cac file code lien quan: `dashboard/prisma/schema.prisma`, `dashboard/lib/permissions.ts`, `dashboard/lib/studyStatus.ts`, `dashboard/app/**`, `dashboard/app/api/viewer/**`, `ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts`, `ohif-viewer/extensions/minipacs/src/services/**`, `ohif-viewer/modes/minipacs-viewer/src/**`.

Neu co quyen doc cac tai lieu HDSD trong Downloads, dung cac file:

- `C:\Users\ngtua\Downloads\HDSD _VIEWER da chuyen ISOFH.docx`
- `C:\Users\ngtua\Downloads\HDSD_DICOM da chuyen ISOFH.docx`
- `C:\Users\ngtua\Downloads\HDSD_NON-DICOM da chuyen ISOFH.docx`
- `C:\Users\ngtua\Downloads\HDSD_ADMIN da chuyen ISOFH.docx`

Can tao hoac cap nhat cac docs sau, viet tieng Viet khong dau, uu tien ASCII:

1. `docs/VRPACS_FEATURE_INVENTORY.md`
2. `docs/VRPACS_TERMINOLOGY_MAP.md`
3. `docs/VRPACS_MINIPACS_CAPABILITY_MATRIX.md`
4. `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
5. `docs/VRPACS_WORKFLOW_STATUS_POLICY.md`
6. `docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md`
7. `docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md`
8. `docs/VRPACS_IMPLEMENTATION_BACKLOG.md`

Yeu cau noi dung:

- Moi feature quan trong tu VRPACS phai co module, source, status hien tai cua MiniPACS, gap, target phase, priority, risk.
- Terminology map phai chot mapping giua VRPACS term va model/code MiniPACS.
- Permission/action matrix phai gom clinical, admin, viewer, export, destructive actions; moi action can permission, actor mac dinh, reasonRequired, auditRequired, targetPhase.
- Workflow status policy phai gom transition table cho `StudyStatus` va report lifecycle, dac biet start reading, finalize, unfinalize, cancel draft/form, mark delivered.
- Data/audit/safety map phai phan loai PHI, clinical, image, credential/config, operational data; action nao can audit; action nao destructive.
- Acceptance scenarios phai co it nhat 10 manual scenarios voi precondition, steps, expected result.
- Implementation backlog phai chia item theo phase, priority, type, risk, dependency, acceptance. Phase 1 phai du ro de bat dau code.

Rang buoc:

- Khong sua code runtime trong Phase 0 neu khong duoc yeu cau rieng.
- Khong xoa hoac revert thay doi co san.
- Khong commit DICOM/PHI that vao repo.
- Neu thieu thong tin, ghi `needs_validation` va tiep tuc voi assumption ro rang.
- Kiem tra cuoi cung rang cac docs moi khong co ky tu tieng Viet co dau neu project dang yeu cau khong dau.

Sau khi lam xong, tra loi ngan gon:

- Da tao/cap nhat nhung file nao.
- Cac quyet dinh baseline quan trong.
- Cac item can user xac nhan truoc Phase 1.
- Kiem tra nao da chay.
```
