# Ke hoach chi tiet Phase 3 - Admin Catalogs And Permission Depth

Updated: 2026-07-03

## 1. Muc tieu

Phase 3 tap trung dong bo lop cau hinh quan tri cua MiniPACS voi cac nhom tinh nang admin trong tai lieu VRPACS. Muc tieu la de admin co the cau hinh nguoi dung, may chup, dich vu, ICD, mau ket qua, mau in, co so/phong ban, folder luu tru, va quyen chi tiet ma khong phai sua code, sua database thu cong, hoac tao workaround ben ngoai he thong.

Muc tieu cuoi phase:

- Co admin catalog day du cho service type, technical service/procedure, ICD, supplies/materials.
- Mo rong `ProcedureCatalog` hien co thanh nguon du lieu chuan cho worklist, report template, HIS mapping, thong ke, va ve sau la Non-DICOM.
- Co mapping procedure/ICD -> report template de report workflow goi dung mau ket qua.
- Co print template CRUD va default assignment ro rang theo facility, modality, procedure, hoac machine.
- Mo rong cau hinh DICOM node/machine de gan service, procedure, template, facility/folder, va co flag Non-DICOM cho phase sau.
- Co facility/area/folder hierarchy, gom cac folder type: `NORMAL`, `SHARE`, `UPLOAD`, `BACKUP`.
- Co backup/storage configuration UI o muc metadata va health/status toi thieu.
- Co per-doctor/per-machine/per-action permission matrix, dung chung cho DICOM workflow, HIS, viewer, share, consultation, va cac phase sau.
- Co user quick import tu Excel/CSV voi dry-run, validation, va audit.
- Co admin reset password action co audit va policy ro rang.
- Khong lam vo luong Phase 1/2: workflow, HIS, report final, audit, permission server-side van la nguon su that.

## 2. Khong nam trong Phase 3

Phase 3 khong lam cac viec sau:

- Khong trien khai Non-DICOM capture that. Chi them catalog/flag can thiet de Phase 6 dung.
- Khong trien khai share link, QR, video conference, consultation room. Chi them permission/action keys du phong neu can.
- Khong trien khai HIS production adapter. Chi bao dam procedure/service/facility fields co the dung cho Phase 2.
- Khong trien khai delete study/delete series production workflow. Chi them permission matrix va policy hooks.
- Khong thay doi viewer advanced tools.
- Khong thay doi clinical report lifecycle ngoai viec cung cap template/default config.
- Khong import PHI that vao seed/test data.
- Khong tao admin app moi tach roi dashboard hien tai.

Neu mot tinh nang admin yeu cau workflow lon hon, chi tao data/config boundary va de phan runtime sang phase phu hop.

## 3. He thong hien tai can ke thua

MiniPACS hien da co cac thanh phan nen:

- `User`, `AppRoleProfile`, `DoctorProfile`.
- Permission string trong `dashboard/lib/permissions.ts`.
- Admin user UI tai `dashboard/app/admin/users`.
- DICOM node UI tai `dashboard/app/admin/pacs/nodes`.
- `PrintTemplate`.
- `ReportTemplateText`.
- `ProcedureCatalog`.
- `ClinicProfile`.
- `AuditLog`.
- `DicomNode`.
- Worklist/report/archive/statistics dang dung cac field `modality`, `bodyPart`, `procedureCode`, `procedureDescription`, `scheduledStationAeTitle`, `doctorId`, `assignedDoctorId`.
- Settings report template UI tai `dashboard/app/settings/report-templates`.
- Clinic profile UI tai `dashboard/app/settings/clinic-profile`.

Phase 3 phai mo rong cac model/action/UI nay, khong tao bang va route trung nghia lam lech du lieu.

## 4. Nguyen tac kien truc

### 4.1 Extend-first

Neu model da ton tai, uu tien mo rong co kiem soat:

- `ProcedureCatalog` la nguon cho procedure/technical service.
- `ReportTemplateText` la nguon cho mau ket qua text.
- `PrintTemplate` la nguon cho mau in.
- `DicomNode` la nguon cho machine/DICOM modality.
- `AppRoleProfile` va `User` la nguon cho role/user.

Chi tao model moi khi thuc su can quan he many-to-many, hierarchy, audit/log, hoac config doc lap.

### 4.2 Code stable, name editable

Moi catalog nen co `code` on dinh va `name` co the sua:

- `code` dung cho mapping, import, HIS, report template, va audit.
- `name` dung cho UI.
- Khong doi `code` neu da co du lieu phat sinh, tru khi co tool rename co audit.

### 4.3 Soft deactivate before delete

Catalog da duoc tham chieu boi order/study/report khong nen xoa vat ly.

Chuan mac dinh:

- Cho `isActive=false`.
- An khoi dropdown tao moi.
- Van hien khi xem du lieu cu.
- Neu can xoa vat ly, chi cho xoa record chua co reference.

### 4.4 Server-side permission only

Nut tren UI chi la presentation. Moi action admin phai check permission server-side bang `requirePermission` hoac helper tuong duong.

### 4.5 Audit everything

Moi thay doi admin quan trong phai tao `AuditLog`:

- Create/update/deactivate catalog.
- Mapping procedure/template.
- Update DICOM node assignment.
- Update permission matrix.
- Import user.
- Reset password.
- Update storage/backup config.

Metadata audit phai scrub password, token, private path neu can.

### 4.6 No surprise runtime behavior

Them catalog/mapping khong duoc tu dong thay doi report/worklist dang final hoac dang ky neu chua co action ro rang.

Vi du:

- Doi default template chi ap dung cho ca moi.
- Doi machine default print template khong sua report da final.
- Doi procedure price khong sua order cu neu khong co action cap nhat.

## 5. Doi chieu gap Phase 3

| Nhom VRPACS | Hien tai MiniPACS | Can bo sung Phase 3 |
| --- | --- | --- |
| User/role | Co user, role profile, permissions | Excel/CSV quick import, reset password UI, permission matrix theo may/action |
| Service type | Chua co model/UI rieng | Them catalog service type |
| Technical service/procedure | Co `ProcedureCatalog` co ban | UI day du, gan service type, modality, body part, price, active, mapping template |
| ICD | Chua co | ICD catalog va mapping procedure/report template |
| Supplies/materials | Chua co | Supplies/material catalog toi thieu, chua can inventory full |
| Print template | Co `PrintTemplate` model | CRUD UI day du, category/default assignment, preview, active status |
| Report template | Co text template | Mapping procedure/ICD/machine/facility, priority, default/personal policy |
| PACS machine | Co DICOM node | Gan facility/folder/service/procedure/default templates/non-DICOM flag |
| Facility/folder | Co clinic profile, chua co hierarchy | Facility/area/room va folder type Normal/Share/Upload/Backup |
| Backup/storage | Statistics co storage health mot phan | Config UI, path metadata, status, last check |
| Per-action doctor permission | Chua co matrix | Doctor/machine/action matrix co helper enforce |

## 6. Data model de xuat

### 6.1 ServiceTypeCatalog

Muc dich: nhom cac procedure theo loai dich vu.

Fields de xuat:

- `id`
- `code` unique
- `name`
- `description`
- `defaultModality`
- `sortOrder`
- `isActive`
- `createdAt`
- `updatedAt`

Vi du:

- `CDHA` - Chan doan hinh anh
- `SA` - Sieu am
- `XN` - Xet nghiem, neu sau nay dung chung

Neu scope chi PACS, co the chi seed cac loai lien quan chan doan hinh anh.

### 6.2 ProcedureCatalog mo rong

`ProcedureCatalog` da co:

- `code`
- `name`
- `modality`
- `bodyPart`
- `defaultPrice`
- `isActive`

Mo rong de dung lam technical service:

- `serviceTypeId`
- `description`
- `defaultDurationMinutes`
- `defaultPriority`
- `defaultRoom`
- `hisCode`
- `insuranceCode`
- `requiresContrast`
- `isNonDicomEligible`
- `sortOrder`

Index de xuat:

- `serviceTypeId`
- `hisCode`
- `insuranceCode`
- `modality, bodyPart`
- `isActive`

Khong doi y nghia `code` hien co neu da co data.

### 6.3 IcdCatalog

Muc dich: quan ly ICD va mapping mau ket qua/chi dinh.

Fields de xuat:

- `id`
- `code` unique
- `name`
- `chapter`
- `groupCode`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

Phase 3 chi can catalog va search. Khong can import toan bo ICD neu chua co file chuan; co the ho tro CSV import dry-run.

### 6.4 ProcedureIcdMapping

Muc dich: goi y ICD theo procedure, hoac gioi han ICD hop le cho procedure.

Fields de xuat:

- `id`
- `procedureCatalogId`
- `icdCatalogId`
- `isDefault`
- `sortOrder`
- `createdAt`
- `updatedAt`

Unique de xuat:

- `procedureCatalogId, icdCatalogId`

### 6.5 ProcedureReportTemplateMapping

Muc dich: chon mau ket qua dung theo procedure/ICD/machine/facility.

Fields de xuat:

- `id`
- `procedureCatalogId`
- `reportTemplateTextId`
- `icdCatalogId`
- `dicomNodeId`
- `facilityId`
- `scope`
- `priority`
- `isDefault`
- `isActive`
- `createdAt`
- `updatedAt`

Policy chon template:

1. Personal template cua doctor neu report workflow chon personal.
2. Mapping procedure + machine + ICD neu co.
3. Mapping procedure + ICD.
4. Mapping procedure.
5. Mapping modality/bodyPart.
6. Global default.

Phase 3 chi can tao mapping va helper resolve. Phase 1 report UI co the goi helper nay.

### 6.6 PrintTemplate mo rong

`PrintTemplate` hien co `name`, `htmlContent`, `isDefault`.

Mo rong de admin quan ly an toan:

- `code`
- `description`
- `modality`
- `bodyPart`
- `facilityId`
- `procedureCatalogId`
- `dicomNodeId`
- `paperSize`
- `orientation`
- `isActive`
- `sortOrder`
- `metadataJson`

Can co preview voi sample data, nhung khong can print engine moi neu he thong da co render report.

### 6.7 Facility va area hierarchy

Muc dich: map phong kham, chi nhanh, khu/phong, room, va machine.

Model de xuat: `FacilityUnit`

Fields:

- `id`
- `code` unique
- `name`
- `type`
- `parentId`
- `address`
- `phone`
- `isActive`
- `sortOrder`
- `createdAt`
- `updatedAt`

`type` co the la string enum:

- `FACILITY`
- `DEPARTMENT`
- `AREA`
- `ROOM`

Neu chi co mot phong kham, van tao default facility de gan node/folder/template.

### 6.8 StorageFolderConfig

Muc dich: cau hinh folder logic cho media/report/export/share/upload/backup.

Fields:

- `id`
- `code` unique
- `name`
- `type`
- `path`
- `facilityId`
- `isActive`
- `lastCheckStatus`
- `lastCheckMessage`
- `lastCheckAt`
- `metadataJson`
- `createdAt`
- `updatedAt`

`type`:

- `NORMAL`
- `SHARE`
- `UPLOAD`
- `BACKUP`

Security:

- Khong expose full private path cho role khong can.
- Khong cho input path nguy hiem neu deployment khong cho phep.
- Path validation nen nam trong service rieng.

### 6.9 BackupStorageConfig

Neu khong muon tron backup vao `StorageFolderConfig`, co the tao model rieng:

- `id`
- `name`
- `path`
- `schedule`
- `retentionDays`
- `isActive`
- `lastRunAt`
- `lastStatus`
- `lastMessage`
- `metadataJson`

Khuyen nghi Phase 3 MVP: dung `StorageFolderConfig` voi type `BACKUP`, chua can scheduler backup production.

### 6.10 DicomNode mo rong

`DicomNode` hien co AE title, IP, port, modality, room, active, echo status.

Mo rong:

- `facilityId`
- `defaultFolderId`
- `defaultShareFolderId`
- `defaultUploadFolderId`
- `defaultProcedureCatalogId`
- `defaultPrintTemplateId`
- `defaultReportTemplateTextId`
- `serviceTypeId`
- `isNonDicom`
- `metadataJson`

Neu migration quan he phuc tap, co the tao mapping table thay vi field truc tiep.

### 6.11 MachineProcedureMapping

Muc dich: mot machine co the chay nhieu procedure.

Fields:

- `id`
- `dicomNodeId`
- `procedureCatalogId`
- `isDefault`
- `isActive`
- `sortOrder`
- `createdAt`
- `updatedAt`

Unique:

- `dicomNodeId, procedureCatalogId`

### 6.12 DoctorMachinePermission

Muc dich: per-doctor/per-machine/per-action matrix.

Fields:

- `id`
- `doctorId`
- `dicomNodeId`
- `actionKey`
- `allow`
- `reason`
- `createdAt`
- `updatedAt`
- `updatedByUserId`

Unique:

- `doctorId, dicomNodeId, actionKey`

`doctorId` tro den `User.id`, chi nen chon user co role/roleProfile phu hop va `DoctorProfile` neu action lien quan doc ket qua.

### 6.13 SupplyCatalog

Muc dich: catalog vat tu/co so de VRPACS admin parity, chua can inventory.

Fields:

- `id`
- `code` unique
- `name`
- `unit`
- `description`
- `defaultPrice`
- `isActive`
- `createdAt`
- `updatedAt`

Phase 3 khong can stock in/out.

### 6.14 UserImportJob

Neu import user can audit chi tiet:

- `id`
- `actorUserId`
- `fileName`
- `status`
- `totalRows`
- `validRows`
- `errorRows`
- `resultJson`
- `createdAt`
- `completedAt`

MVP co the chi log vao `AuditLog`, nhung job model se huu ich neu import Excel lon.

## 7. Permission de xuat

### 7.1 Global permissions

Hien tai co:

- `users.manage`
- `templates.manage`
- `clinic.manage`
- `pacs.manage`

Phase 3 co hai cach:

1. Toi thieu, dung permission hien co:
   - `users.manage` cho user/import/reset/matrix user.
   - `templates.manage` cho report/print template.
   - `clinic.manage` cho facility/folder/clinic.
   - `pacs.manage` cho DICOM node/machine.

2. Granular hon, them permission moi:
   - `catalogs.manage`
   - `printTemplates.manage`
   - `machinePermissions.manage`
   - `storage.manage`
   - `users.import`
   - `users.resetPassword`

Khuyen nghi: bat dau voi permission hien co neu muon it migration UI, nhung them `catalogs.manage` va `machinePermissions.manage` se ro nghia hon cho VRPACS parity.

### 7.2 Per-machine action keys

Action keys trong matrix nen la string on dinh, khong nhat thiet nam trong `permissionKeys`.

De xuat:

- `study.view`
- `study.delete`
- `report.read`
- `report.write`
- `report.approve`
- `report.cancelApproval`
- `report.editFinal`
- `his.update`
- `his.send`
- `share.create`
- `consult.create`
- `consult.cancel`
- `statistics.view`

Mot so action chua implement o Phase 3 van co the define de admin chuan bi, nhung helper runtime chi enforce action nao da co workflow.

### 7.3 Effective permission helper

Can tao helper:

- `hasGlobalPermission(user, permissionKey)`
- `getMachinePermission(userId, dicomNodeId, actionKey)`
- `canPerformMachineAction(user, context, actionKey)`

Policy de xuat:

1. Admin co allow mac dinh neu global permission phu hop.
2. User khong co global permission lien quan thi matrix khong duoc elevate qua muc nguy hiem, tru khi policy explicit cho phep.
3. Matrix `allow=false` co the deny user tren mot machine cu the.
4. Neu khong co record matrix, fallback theo role/global permission.
5. Moi deny quan trong nen tra loi loi ro rang va co audit neu la action nhay cam.

### 7.4 Action-to-global mapping

Vi du:

| Machine action | Global permission can thiet |
| --- | --- |
| `study.view` | `studies.read` |
| `report.read` | `reports.read` |
| `report.write` | `reports.write` |
| `report.approve` | `reports.write` |
| `report.cancelApproval` | `reports.write` hoac permission rieng Phase 1/2 |
| `his.update` | `his.sync` neu Phase 2 da them, fallback `worklist.manage` |
| `his.send` | `his.sync` neu Phase 2 da them, fallback `reports.write` |
| `share.create` | permission Phase 7 sau nay |
| `consult.create` | permission Phase 7 sau nay |
| `study.delete` | permission Phase 8 sau nay |
| `statistics.view` | `statistics.read` |

## 8. UI scope

### 8.1 Navigation

Them nhom Admin/Settings ro rang:

- `/admin/users`
- `/admin/catalogs`
- `/admin/templates`
- `/admin/pacs/nodes`
- `/admin/permissions/matrix`
- `/admin/storage`

Neu muon giu route hien co:

- Giu `/settings/report-templates` cho doctor/template user.
- Tao `/admin/templates` cho print template va mapping template.
- Giu `/settings/clinic-profile` cho clinic profile co ban.
- Tao `/admin/storage` cho folder/backup.

### 8.2 Catalogs page

Route de xuat: `/admin/catalogs`

Tabs:

- Service types
- Procedures
- ICD
- Procedure ICD mapping
- Supplies

Common UI:

- Search theo code/name.
- Filter active/inactive.
- Create/edit drawer hoac modal.
- Deactivate/activate.
- Audit timestamp.
- Import CSV/Excel dry-run neu can.

### 8.3 Procedure detail

Procedure detail nen hien:

- Code, name, modality, body part, service type.
- HIS/insurance code.
- Default price.
- Default duration.
- Requires contrast.
- Non-DICOM eligible flag.
- Linked ICD list.
- Linked report templates.
- Linked machines.
- Audit history.

### 8.4 Template admin

Route de xuat: `/admin/templates`

Tabs:

- Report template mappings.
- Print templates.
- Default template policy.

Report template mapping UI:

- Filter by modality/bodyPart/procedure/ICD/machine/facility.
- Select `ReportTemplateText`.
- Set priority/default.
- Preview selected template.

Print template UI:

- CRUD `PrintTemplate`.
- Preview HTML voi sample report data.
- Mark active/default.
- Assign by facility/procedure/machine.

### 8.5 Machine admin extension

Extend `/admin/pacs/nodes`:

- Facility/room.
- Service type.
- Allowed procedures.
- Default procedure.
- Default report template.
- Default print template.
- Folder assignment.
- Non-DICOM flag.
- Health/status section hien echo status hien co.

Khong doi DICOM echo logic neu khong can.

### 8.6 Permission matrix UI

Route de xuat: `/admin/permissions/matrix`

Capabilities:

- Filter doctor/user.
- Filter machine.
- Toggle action keys.
- Bulk apply theo role/machine group.
- Copy permission from doctor A to doctor B.
- Preview effective permission.
- Export matrix CSV.
- Audit changes.

Can co warning voi action nguy hiem:

- Delete study.
- Cancel approval.
- Edit final result.
- HIS send/update.
- Share/consult.

### 8.7 Storage admin

Route de xuat: `/admin/storage`

Tabs:

- Folder configs.
- Backup folders.
- Health check.

MVP behavior:

- CRUD metadata.
- Validate path format toi thieu.
- Test accessibility neu server co quyen.
- Hien last check status.

Khong can thuc hien backup scheduler production trong Phase 3.

### 8.8 User import va reset password

Extend `/admin/users`:

- Button import Excel/CSV.
- Download sample template.
- Dry-run preview.
- Validate username duplicate, role valid, role profile valid, required fields.
- Import only after confirm.
- Reset password action voi generated temporary password hoac manual set.
- Force change password flag neu he thong co ho tro; neu chua co, ghi backlog.

Security:

- Khong log password plain text.
- Chi hien temporary password mot lan sau khi reset neu policy cho phep.
- Audit actor/time/user target.

## 9. Backend structure de xuat

### 9.1 Catalog services

De xuat folder:

- `dashboard/lib/admin/catalogs/serviceTypes.ts`
- `dashboard/lib/admin/catalogs/procedures.ts`
- `dashboard/lib/admin/catalogs/icd.ts`
- `dashboard/lib/admin/catalogs/supplies.ts`
- `dashboard/lib/admin/catalogs/templateResolver.ts`

Actions:

- `listServiceTypesAction`
- `saveServiceTypeAction`
- `toggleServiceTypeAction`
- `listProceduresAction`
- `saveProcedureAction`
- `toggleProcedureAction`
- `listIcdAction`
- `saveIcdAction`
- `mapProcedureIcdAction`
- `saveProcedureTemplateMappingAction`

### 9.2 Template services

De xuat:

- `dashboard/lib/admin/templates/printTemplates.ts`
- `dashboard/lib/admin/templates/reportTemplateMappings.ts`
- `dashboard/lib/admin/templates/printTemplateResolver.ts`

Actions:

- `listPrintTemplatesAction`
- `savePrintTemplateAction`
- `togglePrintTemplateAction`
- `previewPrintTemplateAction`
- `resolveDefaultReportTemplateAction`
- `resolveDefaultPrintTemplateAction`

### 9.3 Machine config services

De xuat:

- `dashboard/lib/admin/machines/machineConfig.ts`
- `dashboard/lib/admin/machines/machineProcedures.ts`

Actions:

- `saveMachineAssignmentAction`
- `listMachineProceduresAction`
- `saveMachineProcedureMappingsAction`

### 9.4 Permission matrix services

De xuat:

- `dashboard/lib/admin/permissions/machinePermissions.ts`
- `dashboard/lib/authorization/machineAction.ts`

Actions:

- `getMachinePermissionMatrixAction`
- `saveMachinePermissionMatrixAction`
- `copyMachinePermissionsAction`
- `getEffectiveMachinePermissionAction`

Runtime helper:

- `canPerformMachineAction`

### 9.5 Storage services

De xuat:

- `dashboard/lib/admin/storage/storageFolders.ts`
- `dashboard/lib/admin/storage/storageHealth.ts`

Actions:

- `listStorageFoldersAction`
- `saveStorageFolderAction`
- `toggleStorageFolderAction`
- `checkStorageFolderAction`

### 9.6 User import services

De xuat:

- `dashboard/lib/admin/users/importUsers.ts`
- `dashboard/lib/admin/users/resetPassword.ts`

Actions:

- `previewUserImportAction`
- `confirmUserImportAction`
- `resetUserPasswordAction`

Import parser:

- Uu tien CSV neu khong muon them dependency.
- Neu repo da co dependency Excel hoac co utility san, co the ho tro `.xlsx`.
- Luon co dry-run.

## 10. Migration strategy

### 10.1 Buoc migration an toan

1. Them model moi va field nullable truoc.
2. Seed default facility, service type, folder config neu can.
3. Backfill procedure/machine/template mapping tu data hien co.
4. Them UI/action.
5. Chi them unique/index sau khi data da sach, neu migration yeu cau.
6. Khong drop/rename field cu trong Phase 3.

### 10.2 Backfill de xuat

- Tao facility default tu `ClinicProfile.name` neu co, fallback `DEFAULT_FACILITY`.
- Tao service type default `CDHA`.
- Gan procedure hien co vao service type default neu chua co.
- Gan DICOM node vao facility default.
- Tao folder configs tu env/path hien co neu co the suy ra, khong hard-code production path neu khong co.
- Tao machine permission records mac dinh chi khi admin confirm; neu khong, fallback role permission.

### 10.3 Rollback logic

Vi Phase 3 la admin/config:

- Runtime workflow phai chay neu tables moi trong trang thai rong.
- Resolver default template phai fallback ve logic hien co.
- Permission matrix rong phai fallback ve permission hien co.
- Storage config rong khong duoc lam hong report/image upload hien tai.

## 11. Integration voi Phase 1 va Phase 2

### 11.1 Phase 1 DICOM workflow

Phase 3 cung cap:

- Procedure options cho worklist/report.
- Default report template theo procedure.
- Default print template theo procedure/machine.
- Technologist/doctor permission theo machine.
- Action permission cho cancel approval/edit final/mark delivered neu Phase 1 da them.

Khong sua truc tiep status transition neu Phase 1 da co service rieng.

### 11.2 Phase 2 HIS integration

Phase 3 cung cap:

- `hisCode`/`insuranceCode` tren procedure.
- Facility/machine mapping cho HIS payload.
- Permission `his.update`/`his.send` trong machine matrix.
- Audit/admin view cho mapping loi.

Khong goi HIS truc tiep tu catalog UI, tru health/test mapping neu Phase 2 da co adapter.

### 11.3 Phase 4-8 sau nay

Phase 3 de san:

- Viewer/share/consult/delete action keys.
- Folder type `SHARE`, `UPLOAD`, `BACKUP`.
- Non-DICOM flag tren machine/procedure.
- Storage config cho download/retention/backup.

Nhung runtime workflow van de phase sau.

## 12. Trinh tu trien khai

### Step 1 - Doc baseline va chot scope

Can doc:

- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_PHASE0_PRODUCT_BASELINE_SAFETY_PLAN.md`
- `docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md`
- `docs/VRPACS_PHASE2_HIS_INTEGRATION_PLAN.md`
- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/app/admin/users/**`
- `dashboard/app/admin/pacs/nodes/**`
- `dashboard/app/settings/report-templates/**`
- `dashboard/app/settings/clinic-profile/**`
- `dashboard/app/worklist/**`
- `dashboard/app/report/[studyInstanceUid]/**`

Output:

- Xac nhan model nao dung lai, model nao tao moi.
- Xac nhan command migration/test cua repo.
- Xac nhan UI pattern hien co.

### Step 2 - Permission route scaffolding

Viec can lam:

- Cap nhat `dashboard/lib/permissions.ts`.
- Them route permission cho `/admin/catalogs`, `/admin/templates`, `/admin/permissions`, `/admin/storage`.
- Them labels/groups cho permission moi neu dung.
- Bao dam role ADMIN co permission moi.
- Khong lam mat permission hien co cua custom role profile.

Acceptance:

- User khong co quyen khong vao duoc route.
- Server action admin deu check permission.

### Step 3 - Schema va migration MVP

Tao/thay doi model:

- `ServiceTypeCatalog`
- Extend `ProcedureCatalog`
- `IcdCatalog`
- `ProcedureIcdMapping`
- `ProcedureReportTemplateMapping`
- Extend `PrintTemplate`
- `FacilityUnit`
- `StorageFolderConfig`
- Extend `DicomNode` hoac mapping table
- `MachineProcedureMapping`
- `DoctorMachinePermission`
- `SupplyCatalog`

Neu migration qua lon, tach lam 2 migration:

1. Catalog/template/facility.
2. Machine/permission/storage.

Acceptance:

- Prisma generate/build khong loi.
- Existing data van doc duoc.
- Resolver fallback khong can data moi.

### Step 4 - Catalog admin UI

Tao `/admin/catalogs`.

Lam MVP theo tabs:

- Service types.
- Procedures.
- ICD.
- Supplies.

Moi tab co:

- Table.
- Search/filter.
- Create/edit.
- Activate/deactivate.
- Audit.

Procedure tab them:

- Link service type.
- Modality/bodyPart.
- Price/duration.
- HIS/insurance code.
- Non-DICOM eligible.

Acceptance:

- Admin tao/sua/tat catalog duoc.
- Dropdown worklist/report sau nay co the lay procedure active.

### Step 5 - Procedure ICD va report template mapping

Them UI trong `/admin/catalogs` hoac `/admin/templates`.

Viec can lam:

- Mapping procedure -> ICD.
- Mapping procedure/ICD/machine/facility -> `ReportTemplateText`.
- Helper `resolveDefaultReportTemplate`.
- Unit/manual tests cho priority fallback.

Acceptance:

- Chon procedure A ra dung template theo priority.
- Neu khong co mapping, fallback template hien co.

### Step 6 - Print template admin

Tao `/admin/templates` hoac mo rong settings hien co.

Viec can lam:

- CRUD `PrintTemplate`.
- Preview voi sample data.
- Active/default.
- Assign theo facility/procedure/machine.
- Helper `resolveDefaultPrintTemplate`.

Acceptance:

- Report final/print co the lay default template ma khong can hard-code.
- Template inactive khong hien trong tao moi nhung van dung duoc cho record cu neu da gan.

### Step 7 - Machine assignment

Mo rong `/admin/pacs/nodes`.

Viec can lam:

- Gan facility/room.
- Gan service type.
- Gan allowed procedures.
- Default procedure.
- Default report template.
- Default print template.
- Folder assignment.
- Non-DICOM flag.

Acceptance:

- Machine CT co danh sach procedure CT rieng.
- Worklist co the loc/chon procedure phu hop theo machine sau nay.
- Existing DICOM node CRUD/echo khong bi hong.

### Step 8 - Permission matrix

Tao `/admin/permissions/matrix`.

Viec can lam:

- Matrix user/doctor x machine x action.
- Bulk apply/copy.
- Effective permission preview.
- Helper runtime `canPerformMachineAction`.
- Audit moi thay doi.

Acceptance:

- Matrix rong fallback theo global permission.
- Deny cu the tren mot machine co tac dung voi helper.
- Admin co the xem ai duoc doc/approve/HIS/share/delete tren may nao.

### Step 9 - Storage/folder admin

Tao `/admin/storage`.

Viec can lam:

- CRUD folder config.
- Type Normal/Share/Upload/Backup.
- Gan facility.
- Check status toi thieu.
- Scrub path trong audit neu can.

Acceptance:

- Admin thay duoc folder logic va trang thai check.
- Khong lam thay doi storage runtime hien co neu chua gan config.

### Step 10 - User import va reset password

Mo rong `/admin/users`.

Viec can lam:

- Import CSV/Excel dry-run.
- Validate duplicate username.
- Validate role/role profile.
- Confirm import.
- Reset password.
- Audit day du.

Acceptance:

- Import loi hien theo dong.
- Import thanh cong tao user active/inactive dung role.
- Reset password khong log password plain text.

### Step 11 - Seed va sample data

Neu repo co seed:

- Seed service type default.
- Seed facility default.
- Seed folder configs placeholder.
- Seed sample procedures khong co PHI.
- Seed action keys metadata neu can.

Acceptance:

- Dev environment co du data de test admin UI.
- Production deploy khong ghi de data that neu seed chay lai.

### Step 12 - QA va docs update

Can kiem tra:

- Permission route.
- CRUD catalog.
- Mapping resolver.
- Print template preview.
- DICOM node extension.
- Matrix fallback/deny.
- Storage check.
- User import/reset.
- Regression worklist/report/archive.

Docs can cap nhat:

- Implementation backlog.
- Permission/action matrix.
- Migration notes.
- Seed notes.

## 13. Acceptance criteria

Phase 3 duoc coi la xong khi:

- Admin co the tao/sua/tat service type, procedure, ICD, supplies.
- Procedure catalog co the dung trong worklist/report va mapping template.
- Admin co the map procedure/ICD/machine/facility toi report template.
- Admin co the CRUD va preview print template.
- Admin co the gan default report/print template cho machine/procedure/facility.
- Admin co the cau hinh DICOM node voi facility, folder, service/procedure, template.
- Admin co the cau hinh folder Normal/Share/Upload/Backup va xem health/status toi thieu.
- Admin co the cau hinh per-doctor/per-machine/per-action matrix.
- Runtime helper co the tinh effective permission va fallback theo permission hien co.
- Admin co the import user bang dry-run va reset password co audit.
- Moi action admin nhay cam co permission server-side va audit.
- Existing worklist/report/archive/statistics khong bi loi khi catalog/mapping moi rong hoac chua co data.
- Khong co secret/password/token trong audit log.

## 14. Test scenarios

### 14.1 Catalog CRUD

1. Admin tao service type `CDHA`.
2. Admin tao procedure `CT_BRAIN` modality `CT`, body part `HEAD`.
3. Admin deactivate procedure.
4. Procedure inactive khong hien trong dropdown tao moi.
5. Record cu van hien procedure name khi xem lai.

### 14.2 ICD mapping

1. Admin tao ICD `I63`.
2. Admin map `CT_BRAIN` voi `I63`.
3. Admin remove mapping.
4. Audit co create/remove mapping.

### 14.3 Report template resolver

1. Co template global CT.
2. Co template procedure `CT_BRAIN`.
3. Co template procedure + ICD `I63`.
4. Resolver tra ve template procedure + ICD khi co du context.
5. Resolver fallback global khi mapping bi inactive.

### 14.4 Print template resolver

1. Co print template default global.
2. Co print template cho facility A.
3. Co print template cho machine CT1.
4. Resolver uu tien machine CT1.
5. Inactive template khong duoc chon cho case moi.

### 14.5 Machine assignment

1. Admin gan CT1 vao facility A.
2. Admin gan allowed procedures CT cho CT1.
3. Admin gan default print template cho CT1.
4. Existing C-Echo CT1 van chay.

### 14.6 Permission matrix

1. Doctor A co `reports.write`.
2. Matrix deny `report.write` tren CT1.
3. Helper `canPerformMachineAction` tra false cho CT1.
4. Doctor A van co the write tren MR1 neu khong deny.
5. Admin copy matrix tu Doctor A sang Doctor B.

### 14.7 User import

1. Upload CSV co 5 user, 1 duplicate username.
2. Dry-run bao 4 valid, 1 error.
3. Confirm import chi tao 4 user hop le.
4. Audit ghi actor va summary, khong ghi password plain text.

### 14.8 Reset password

1. Admin reset password user B.
2. User B dang nhap bang password moi.
3. Audit co reset event.
4. Audit khong chua password.

### 14.9 Storage folder

1. Admin tao folder `UPLOAD_DEFAULT`.
2. Run check status.
3. Status va message duoc luu.
4. User khong co quyen khong xem/sua duoc storage config.

### 14.10 Regression

1. `/worklist` load duoc.
2. `/` study list load duoc.
3. `/report/[studyInstanceUid]` load duoc.
4. `/archive` load duoc.
5. `/statistics` load duoc.
6. Report final/print van dung template cu neu chua gan mapping moi.

## 15. Rui ro va cach xu ly

### 15.1 Schema qua lon

Rui ro: mot migration Phase 3 qua rong, de loi deploy.

Cach xu ly:

- Tach PR/migration nho.
- Add nullable fields truoc.
- Seed/backfill rieng.
- Khong drop field cu.

### 15.2 Permission conflict

Rui ro: matrix moi lam user mat quyen dang dung.

Cach xu ly:

- Matrix rong fallback permission hien co.
- Chi enforce matrix tai cac action da duoc review.
- Co effective preview.
- Co audit va revert/copy.

### 15.3 Template resolver doi hanh vi report

Rui ro: report lay template khac ngoai y muon.

Cach xu ly:

- Resolver chi dung khi user tao report moi hoac bam chon default.
- Report da final khong tu doi template.
- Log template source trong debug/audit neu can.

### 15.4 Storage path security

Rui ro: admin nhap path nguy hiem hoac expose path noi bo.

Cach xu ly:

- Validate path theo allowlist/env neu co.
- Khong cho role thuong xem full path.
- Khong log secret/token.
- Chua lam delete/cleanup runtime trong Phase 3.

### 15.5 Import user tao loi bao mat

Rui ro: import sai role, password lo tren audit.

Cach xu ly:

- Dry-run bat buoc.
- Validate role/role profile.
- Password hash server-side.
- Khong log password plain text.
- Neu co temporary password, chi hien mot lan.

### 15.6 Catalog trung voi HIS/procedure cu

Rui ro: procedure code local khac HIS code lam mapping sai.

Cach xu ly:

- Tach `code`, `hisCode`, `insuranceCode`.
- Unique tung truong neu can.
- Audit mapping.
- Import co preview conflict.

## 16. De xuat chia nho thanh PR

### PR 3.1 - Permission va schema baseline

- Add permission routes.
- Add/extend Prisma models.
- Add seed/backfill toi thieu.
- Add fallback helpers.

### PR 3.2 - Catalog admin

- `/admin/catalogs`.
- Service type, procedure, ICD, supplies CRUD.
- Audit.

### PR 3.3 - Template mapping va print template admin

- `/admin/templates`.
- Report template mapping.
- Print template CRUD/preview.
- Resolver default report/print template.

### PR 3.4 - Machine assignment

- Extend `/admin/pacs/nodes`.
- Facility/folder/service/procedure/template assignment.
- Machine procedure mapping.

### PR 3.5 - Permission matrix

- `/admin/permissions/matrix`.
- Matrix actions.
- Effective permission helper.
- Audit.

### PR 3.6 - Storage va user admin hardening

- `/admin/storage`.
- User import dry-run.
- Reset password.
- Final QA/docs.

## 17. Checklist ban giao Phase 3

Truoc khi ket thuc Phase 3, can co:

- [ ] Migration/schema da chay duoc.
- [ ] Prisma client da generate.
- [ ] Permission labels/routes da cap nhat.
- [ ] Admin catalog CRUD co permission server-side.
- [ ] Procedure/template resolver co fallback.
- [ ] Print template preview an toan.
- [ ] DICOM node UI cu khong bi vo.
- [ ] Machine assignment co audit.
- [ ] Permission matrix co effective preview.
- [ ] Storage folder config co check status toi thieu.
- [ ] User import co dry-run.
- [ ] Reset password khong log password plain text.
- [ ] Regression worklist/report/archive/statistics pass.
- [ ] Docs/backlog cap nhat neu scope thay doi.

## 18. Prompt ban giao cho AI khac

Copy prompt duoi day neu muon giao Phase 3 cho mot AI coding agent khac:

```text
Ban la AI coding agent trong repo MiniPACS. Hay thuc hien Phase 3 - Admin Catalogs And Permission Depth theo ke hoach da co.

Muc tieu:

- Tao/admin hoa service type, procedure/technical service, ICD, supplies.
- Mo rong ProcedureCatalog de lam nguon chuan cho worklist/report/HIS/template.
- Tao mapping procedure/ICD/machine/facility -> report template.
- Tao/hoan thien print template CRUD/preview/default assignment.
- Mo rong DICOM node/machine assignment: facility, folder, service/procedure, default report template, default print template, non-DICOM flag.
- Tao facility/area/folder hierarchy voi folder type NORMAL, SHARE, UPLOAD, BACKUP.
- Tao storage/backup config UI o muc metadata/status toi thieu.
- Tao per-doctor/per-machine/per-action permission matrix va helper effective permission.
- Mo rong user admin: import CSV/Excel dry-run va reset password co audit.

Truoc khi code, doc cac file:

- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_PHASE0_PRODUCT_BASELINE_SAFETY_PLAN.md`
- `docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md`
- `docs/VRPACS_PHASE2_HIS_INTEGRATION_PLAN.md`
- `docs/VRPACS_PHASE3_ADMIN_CATALOG_PERMISSION_PLAN.md`

Sau do doc code hien tai:

- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/lib/authz.ts`
- `dashboard/app/admin/users/**`
- `dashboard/app/admin/pacs/nodes/**`
- `dashboard/app/settings/report-templates/**`
- `dashboard/app/settings/clinic-profile/**`
- `dashboard/app/worklist/**`
- `dashboard/app/report/[studyInstanceUid]/**`
- `dashboard/app/archive/**`
- `dashboard/app/statistics/**`

Trien khai theo thu tu:

1. Permission va route:
   - Cap nhat `dashboard/lib/permissions.ts`.
   - Them route permission cho admin catalogs/templates/permissions/storage.
   - Bao dam ADMIN co quyen moi.
   - Server actions phai check permission server-side.

2. Schema/migration:
   - Them model/field cho service type, procedure extension, ICD, procedure-ICD mapping, procedure-template mapping, print template extension, facility, storage folder, machine-procedure mapping, doctor-machine permission, supplies.
   - Add nullable fields truoc, khong drop field cu.
   - Tao seed/backfill default neu phu hop.

3. Catalog UI:
   - Tao `/admin/catalogs`.
   - Tabs service types, procedures, ICD, supplies.
   - Search/filter/create/edit/activate/deactivate.
   - Audit moi thay doi.

4. Template UI/resolver:
   - Tao `/admin/templates` hoac mo rong settings theo pattern repo.
   - Mapping procedure/ICD/machine/facility -> ReportTemplateText.
   - PrintTemplate CRUD/preview/default assignment.
   - Implement resolver fallback an toan.

5. Machine assignment:
   - Mo rong `/admin/pacs/nodes`.
   - Gan facility/folder/service/procedure/default templates/non-DICOM flag.
   - Khong lam hong DICOM node CRUD/C-Echo hien co.

6. Permission matrix:
   - Tao `/admin/permissions/matrix`.
   - Matrix doctor/user x machine x action.
   - Bulk/copy neu kha thi.
   - Implement helper `canPerformMachineAction`.
   - Matrix rong phai fallback permission hien co.

7. Storage/user admin:
   - Tao `/admin/storage` cho folder configs va status check toi thieu.
   - Them user import dry-run vao `/admin/users`.
   - Them reset password action, khong log password plain text.

8. QA:
   - Test CRUD catalogs.
   - Test template resolver fallback.
   - Test print template preview.
   - Test machine assignment khong vo echo/node CRUD.
   - Test permission matrix fallback va deny.
   - Test user import duplicate row.
   - Test reset password audit.
   - Regression `/worklist`, `/`, `/report/[studyInstanceUid]`, `/archive`, `/statistics`.
   - Chay lint/build/test phu hop neu repo co command.

Rang buoc:

- Khong revert thay doi cua user.
- Khong dung command destructive nhu git reset hard.
- Khong hard-code data production.
- Khong commit PHI/DICOM that.
- Khong trien khai runtime Non-DICOM/share/consult/delete trong Phase 3.
- Moi action admin nhay cam phai co audit.
- Khong log password, token, secret, private path nhay cam.
- Neu schema/migration lon, chia PR nho.
- Neu gap blocker, ghi ro blocker, file lien quan, va workaround.

Ket qua mong muon:

- Code Phase 3 implement theo PR nho hoac batch ro rang.
- Docs/backlog/permission matrix duoc cap nhat neu scope thay doi.
- Tra loi cuoi cung gom: files changed, behavior changed, tests run, tests not run, migration notes, seed notes, config/env notes, remaining risks.
```

