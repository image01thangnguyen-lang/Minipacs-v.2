# Ke hoach chi tiet Phase 6 - Non-DICOM Capture Module

Updated: 2026-07-04

## 1. Muc tieu

Phase 6 dua workflow Non-DICOM thanh mot module van hanh cap 1 trong MiniPACS, khong chi la nut upload anh vao report.

Non-DICOM o day bao gom cac nguon anh/video khong di qua Orthanc/DICOMweb:

- Noi soi.
- Sieu am mau / may chua gui DICOM.
- Camera phong kham.
- Anh chup tai cho.
- Video thuat thu thuan hoac video clinical ngan.
- File dinh kem lien quan ca chup: anh, PDF, tai lieu benh ly/pathology, bien ban, file tu thiet bi ngoai.

Muc tieu cuoi phase:

- Le tan/KTV/Bac si co the tao va xu ly ca Non-DICOM tu hang doi rieng.
- Co UI queue Non-DICOM voi filter theo trang thai, may, bac si, dich vu, ngay, qua han, HIS status.
- Co man hinh capture that bang browser camera: xin quyen camera, preview live, chup anh, crop, rotate, ghi chu, chon anh chinh.
- Co video recording MVP: bat dau/dung quay, playback, luu metadata, tai xuong neu duoc phep.
- Co upload typed attachments: anh, video, PDF/pathology/file lien quan ca.
- Co gallery/media manager: xem, chon, xoa mem, copy sang ca khac, in/xuat chon loc.
- Reuse workflow report Phase 1/2/3: gan bac si, thong tin lam sang, procedure/template, luu nhap, ky/duyet, HIS sync, in/tra ket qua.
- Moi du lieu/action lam ra trong Phase 6 phai hien tren UI tuong ung: queue, detail panel, capture page, report detail, archive, statistics.
- Khong co backend/schema/service nao duoc them ma khong co UI hien thi, disabled state, hoac tooltip giai thich.

## 2. Khong nam trong Phase 6

Phase 6 khong lam cac viec sau:

- Khong lam share link public, QR, password, consultation room, video conference, chat. Phan nay thuoc Phase 7.
- Khong lam destructive delete study/media production. Xoa trong Phase 6 la soft-delete/void artifact co audit; policy xoa vat ly thuoc Phase 8.
- Khong lam native scanner bridge, CD/DVD burn, DICOM print SCU, global screen capture, open local folder. Cac muc nay thuoc Phase 9/native companion.
- Khong convert media Non-DICOM thanh DICOM object neu chua co policy va DICOM encapsulation spec ro rang.
- Khong viet HIS production adapter rieng. Phase 6 chi dung adapter Phase 2 da co.
- Khong hard-code PHI trong seed/test.
- Khong dua camera stream len public URL.
- Khong auto bat camera khi user chua bam va browser chua cap quyen.
- Khong luu password/token/path local vao audit metadata.

Neu mot tinh nang can thiet bi/native API ma browser khong ho tro an toan, UI phai hien disabled/tooltip ro, khong lam ready gia.

## 3. Dieu kien tien quyet

Chi nen bat dau Phase 6 khi:

- Phase 1 workflow report/order/study/delivery da on dinh.
- Phase 2 HIS adapter/status/retry da on dinh.
- Phase 3 admin co DICOM node/machine flag `isNonDicom`, procedure/facility/folder/template assignment.
- Phase 3.5 da dua assigned doctor/procedure/machine/facility/HIS status ra UI van hanh.
- Phase 4 artifact/storage/download/audit boundary da co the reuse cho media.
- Permission server-side da co pattern ro: `requirePermission`, route guard, audit.
- Co folder storage `UPLOAD` hoac Non-DICOM media folder duoc cau hinh trong admin.
- Browser QA co it nhat 1 may co camera hoac mock camera permission de test.

## 4. He thong hien tai can ke thua

Truoc khi code, can doc va ke thua:

```text
docs/VRPACS_GAP_ANALYSIS_ROADMAP.md
docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md
docs/VRPACS_PHASE2_HIS_INTEGRATION_PLAN.md
docs/VRPACS_PHASE3_ADMIN_CATALOG_PERMISSION_PLAN.md
docs/VRPACS_PHASE3_5_OPERATIONAL_UI_VISIBILITY_PLAN.md
docs/VRPACS_PHASE4_VIEWER_WEB_PARITY_PLAN.md
docs/VRPACS_PHASE5_ADVANCED_MPR_3D_SPECIALTY_TOOLS_PLAN.md
docs/VRPACS_WORKFLOW_STATUS_POLICY.md
docs/VRPACS_PERMISSION_ACTION_MATRIX.md
docs/VRPACS_TERMINOLOGY_MAP.md
docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md
dashboard/prisma/schema.prisma
dashboard/lib/permissions.ts
dashboard/lib/workflowService.ts
dashboard/app/actions.ts
dashboard/app/page.tsx
dashboard/app/worklist/actions.ts
dashboard/app/worklist/page.tsx
dashboard/app/report/[studyInstanceUid]/actions.ts
dashboard/app/report/[studyInstanceUid]/page.tsx
dashboard/app/archive/actions.ts
dashboard/app/archive/page.tsx
dashboard/app/statistics/actions.ts
dashboard/app/admin/pacs/nodes/page.tsx
dashboard/app/admin/storage/page.tsx
dashboard/app/admin/catalogs/page.tsx
```

Phase 6 khong tao report engine moi. Non-DICOM phai dung chung report lifecycle, print template, delivery, HIS status, archive, statistics neu co the.

## 5. Nguyen tac UI visibility bat buoc

Tu Phase 5 tro di nguyen tac nay bat buoc tiep tuc ap dung.

### 5.1 Khong co backend-only feature

Moi thay doi Phase 6 phai co day du:

- Schema/model hoac field neu can.
- Server action/API co permission.
- Service/helper chung cho transition.
- UI surface hien thi.
- Empty/loading/error state.
- Disabled state neu user thieu quyen hoac thieu camera/storage.
- Audit log.
- Build/test/QA scenario.

Vi du: neu them `nonDicomMedia.status`, UI phai hien status do trong media gallery/detail. Neu them `copyToExam`, UI phai co dialog copy va lich su audit.

### 5.2 UI noi that

UI chi duoc hien action active khi backend se chap nhan:

- User co permission.
- Case dung status.
- Camera/storage/browser capability du.
- Media chua bi final-lock neu policy khong cho sua.
- Report final/delivered khong bi sua artifact im lang.

Neu khong du dieu kien:

- Button disabled.
- Tooltip ly do ngan gon.
- Neu user bam vao action guarded, backend van phai reject an toan va audit neu can.

### 5.3 UI surfaces bat buoc

Phase 6 can co it nhat cac UI surface:

- Nav/menu entry: `Non-DICOM`.
- Non-DICOM queue page.
- Non-DICOM exam detail/capture page.
- Capture/live camera panel.
- Media gallery/grid.
- Attachment upload panel.
- Video recording/playback panel.
- Report detail media strip.
- Archive media/HIS/delivery columns.
- Worklist/Study List badges neu case la Non-DICOM.
- Statistics Non-DICOM cards/charts.
- Admin machine/storage/folder validation state cho Non-DICOM.

## 6. Permission contract de xuat

Them hoac map cac permission sau:

| Permission | Muc dich | Default actors |
| --- | --- | --- |
| `nonDicom.read` | Xem queue/detail/media Non-DICOM | ADMIN, DOCTOR, TECHNICIAN, RECEPTION theo policy |
| `nonDicom.create` | Tao ca Non-DICOM | ADMIN, TECHNICIAN, RECEPTION |
| `nonDicom.capture` | Chup anh/quay video/upload media | ADMIN, TECHNICIAN, DOCTOR neu phong kham cho phep |
| `nonDicom.edit` | Sua metadata/media note/procedure/KTV | ADMIN, TECHNICIAN |
| `nonDicom.deleteMedia` | Xoa mem/void media | ADMIN, TECHNICIAN theo policy |
| `nonDicom.copyMedia` | Copy media sang ca khac | ADMIN, TECHNICIAN, DOCTOR theo policy |
| `nonDicom.print` | In/xuat media Non-DICOM | ADMIN, DOCTOR, TECHNICIAN |
| `nonDicom.video` | Ghi video va playback/download | ADMIN, TECHNICIAN, DOCTOR theo policy |

Khong chi an/hiện nut bang UI. Tat ca action server/API phai check permission server-side.

Neu muon giai doan MVP gon hon, co the map tam:

- `nonDicom.read` -> `studies.read`
- `nonDicom.create/capture/edit` -> `worklist.manage` hoac `studies.updateClinical`
- `nonDicom.print` -> `reports.print`

Nhung nen co key rieng trong Phase 6 de de audit va quan tri.

## 7. Data model de xuat

### 7.1 Extend ImagingStudy de dung chung workflow

De report/archive/statistics khong phai tao song song, moi Non-DICOM exam nen co mot record `ImagingStudy` dai dien.

Fields de xuat neu chua co:

- `sourceType`: `DICOM | NON_DICOM`
- `isNonDicom`: boolean convenience neu khong muon enum ngay.
- `nonDicomExamId`: optional relation neu tao model rieng.
- `mediaCount`
- `videoCount`
- `attachmentCount`
- `primaryMediaId`
- `captureStartedAt`
- `captureCompletedAt`
- `captureStatus`: `PENDING | CAPTURING | COMPLETED | CANCELLED`

`studyInstanceUid` voi Non-DICOM:

- Khong duoc gia mao DICOM UID neu khong convert thanh DICOM.
- Co the tao synthetic UID internal dang `NONDICOM.<uuid>` hoac luu `studyInstanceUid` nullable chi khi report route cho phep.
- Neu report route hien tai bat buoc `studyInstanceUid`, dung internal UID co prefix ro va UI hien `Non-DICOM Case ID`, khong goi la DICOM Study UID.

### 7.2 NonDicomExam

Muc dich: luu session/queue metadata cua ca Non-DICOM.

Fields de xuat:

- `id`
- `caseCode` unique, hien tren UI.
- `imagingStudyId` hoac `studyInstanceUid`
- `worklistOrderId`
- `patientId`, `patientName`, `patientBirthDate`, `patientSex` theo policy hien co.
- `accessionNumber`
- `status`: `REQUESTED | ARRIVED | CAPTURING | READY_TO_READ | READING | REPORTED | DELIVERED | CANCELLED`
- `facilityId`
- `machineId` -> `DicomNode` co `isNonDicom=true`
- `procedureCatalogId`
- `serviceTypeId`
- `assignedDoctorId`
- `technologistId`
- `clinicalInfo`
- `indication`
- `captureStartedAt`
- `captureCompletedAt`
- `createdByUserId`
- `updatedByUserId`
- `cancelledAt`
- `cancelReason`
- `createdAt`
- `updatedAt`

Index:

- `status`
- `machineId`
- `assignedDoctorId`
- `technologistId`
- `procedureCatalogId`
- `createdAt`
- `accessionNumber`
- `caseCode`

### 7.3 NonDicomMedia

Muc dich: luu anh/video/file cua ca.

Fields de xuat:

- `id`
- `examId`
- `studyInstanceUid` optional den `ImagingStudy`
- `mediaType`: `IMAGE | VIDEO | PDF | PATHOLOGY | DOCUMENT | OTHER`
- `source`: `CAMERA | UPLOAD | COPY | IMPORT`
- `status`: `ACTIVE | VOIDED`
- `filePath` protected server path hoac storage key.
- `thumbnailPath`
- `mimeType`
- `fileSizeBytes`
- `durationMs` cho video.
- `width`, `height`
- `captureDeviceId` browser deviceId hash hoac machine id, khong luu raw private info neu khong can.
- `isPrimary`
- `sortOrder`
- `note`
- `cropRectJson`
- `metadataJson`
- `copiedFromMediaId`
- `createdByUserId`
- `voidedByUserId`
- `voidedAt`
- `voidReason`
- `createdAt`
- `updatedAt`

Rule:

- Xoa trong UI la soft void, khong hard-delete file trong Phase 6.
- File path khong public direct. Media xem qua API permission.
- Thumbnail duoc tao/luu rieng neu co the, fallback icon neu khong.

### 7.4 NonDicomCaptureSession

Muc dich: track permission/camera session/audit ngan.

Fields de xuat:

- `id`
- `examId`
- `startedByUserId`
- `deviceLabel`
- `deviceIdHash`
- `status`: `STARTED | STOPPED | FAILED`
- `failureReason`
- `startedAt`
- `stoppedAt`
- `createdAt`

Khong luu stream raw vao DB.

### 7.5 NonDicomAuditLog

Co the reuse `AuditLog` neu da du metadata. Neu can model rieng:

- `id`
- `examId`
- `mediaId`
- `actorUserId`
- `action`
- `metadataJson`
- `createdAt`

Khuyen nghi MVP: reuse `AuditLog` de khong tao audit song song.

## 8. Storage va file policy

### 8.1 Storage source

Phase 6 phai dung cau hinh Phase 3:

- Folder type `UPLOAD` cho upload/capture raw.
- Folder type `NORMAL` cho artifact luu chinh neu policy yeu cau.
- Folder type `BACKUP` chi dung khi Phase 8 backup/retention san sang.

Khong hard-code `C:\uploads` hoac public path.

### 8.2 File naming

Filename khong chua ten benh nhan.

Format de xuat:

```text
ND_{caseCode}_{mediaId}.{ext}
ND_{caseCode}_{mediaId}_thumb.jpg
```

Neu can export:

```text
NONDICOM_{accessionNumberOrCaseCode}_{timestamp}.zip
```

### 8.3 Upload validation

Bat buoc:

- Allowlist MIME: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`, `application/pdf`.
- Size limit theo config.
- Video duration limit MVP.
- Reject executable/script/html/svg neu khong sanitize.
- PDF chi view/download qua protected route.
- Log error scrubbed, khong tra stack trace ra UI.

## 9. Workflow chi tiet

### 9.1 Tao ca Non-DICOM

Nguon tao:

- Tu Worklist order co procedure `isNonDicomEligible=true`.
- Tu route Non-DICOM `Tao ca moi`.
- Tu HIS inbound neu Phase 2 co order.

UI bat buoc:

- Form tao ca: patient/order fields, procedure, machine Non-DICOM, assigned doctor, KTV, clinical info, indication.
- Dropdown chi hien machine `isNonDicom=true` va active.
- Dropdown procedure fallback neu catalog chua co data.
- Warning neu chua cau hinh storage/camera.
- Sau khi tao, dieu huong den capture detail.

Server bat buoc:

- Permission `nonDicom.create`.
- Validate machine la Non-DICOM.
- Validate procedure active/eligible neu co.
- Tao audit.
- Tao/sync `ImagingStudy` dai dien neu dung chung report/archive.

### 9.2 Queue Non-DICOM

Route de xuat:

```text
dashboard/app/non-dicom/page.tsx
dashboard/app/non-dicom/actions.ts
```

UI columns:

- Case code / accession.
- Patient.
- Procedure/service.
- Machine/facility.
- Assigned doctor.
- Technologist.
- Capture status.
- Report status.
- HIS order/result status.
- Media count / video count / attachment count.
- Waiting time/SLA.
- Row actions.

Filters:

- Search patient/accession/case code.
- Status.
- Date preset.
- Machine Non-DICOM.
- Procedure/service.
- Assigned doctor.
- Technologist.
- HIS status.
- Has media / no media.
- Overdue capture.

Row actions:

- Open capture.
- Open report.
- Assign doctor.
- Update clinical info.
- Add indication.
- Mark capture complete.
- Cancel exam with reason.
- Print/export selected if media exists and permission ok.

UI action khong hien neu backend se reject.

### 9.3 Capture detail page

Route de xuat:

```text
dashboard/app/non-dicom/[examId]/page.tsx
dashboard/app/non-dicom/[examId]/actions.ts
dashboard/app/api/non-dicom/exams/[examId]/media/route.ts
dashboard/app/api/non-dicom/media/[mediaId]/file/route.ts
dashboard/app/api/non-dicom/media/[mediaId]/thumbnail/route.ts
```

Layout:

- Header: patient/order/procedure/status/HIS/assigned doctor.
- Left: camera/live preview va capture controls.
- Center/right: media gallery.
- Side panel: clinical info, indication, notes, audit snippets.
- Bottom/action bar: save, complete capture, open report, print/export, upload.

Panel camera:

- Browser camera permission state.
- Device selector neu browser cho phep.
- Preview live.
- Capture still.
- Start/stop video recording.
- Camera unavailable empty state.
- HTTPS/browser permission guidance.

Panel gallery:

- Grid anh/video/file.
- Badge: primary, copied, upload, voided hidden by default.
- Select multi.
- Set primary.
- Add note.
- Crop/rotate image MVP neu safe.
- Delete/void selected with reason.
- Copy selected to another exam.
- Print selected.

### 9.4 Still image capture

Flow:

1. User open capture page.
2. User chon camera.
3. User bam `Capture`.
4. Browser tao image blob.
5. Upload qua API protected.
6. Server luu file va `NonDicomMedia`.
7. UI gallery append media ngay, khong can reload.
8. Audit `non_dicom_image_captured`.

UI bat buoc:

- Loading/progress.
- Error neu permission denied/storage fail.
- Thumbnail hien ngay sau upload.
- Count media cap nhat tren header.

### 9.5 Crop/rotate image

MVP:

- Crop client-side bang canvas neu image cung origin/blob local.
- Rotate 90/180/270.
- Luu thanh media version moi hoac update `cropRectJson` tuy policy.

Khuyen nghi an toan:

- Tao media moi `source=COPY`/`metadataJson.createdFromCropOf`.
- Khong ghi de file goc trong MVP.

UI:

- Crop modal voi ratio presets: free, 1:1, 4:3, 16:9.
- Preview before save.
- Save as new / cancel.

### 9.6 Video recording

MVP web:

- Dung `MediaRecorder` neu browser support.
- Format `webm` truoc, `mp4` chi neu browser support.
- Gioi han duration/size.
- Playback trong gallery.
- Download neu `nonDicom.video`/`nonDicom.print` policy cho phep.

UI:

- Start/Stop recording.
- Timer.
- Size/duration warning.
- Playback modal.
- Upload progress.
- Status neu browser khong support.

Server:

- Validate MIME/size.
- Store protected file.
- Audit `non_dicom_video_recorded`.

### 9.7 Upload attachment/pathology

UI:

- Upload dropzone.
- Select type: image, video, PDF, pathology, document, other.
- Optional note.
- Progress and error.
- Filter gallery by type.

Server:

- Permission `nonDicom.capture` hoac `nonDicom.edit`.
- MIME allowlist.
- Size limit.
- Audit `non_dicom_attachment_uploaded`.

### 9.8 Copy media between cases

UI:

- Dialog chon target case.
- Search case code/accession/patient.
- Confirm copy count.
- Show copied badge on target.

Server:

- Permission `nonDicom.copyMedia`.
- Validate source/target accessible.
- Copy metadata and file reference according to storage policy:
  - MVP co the tao record moi tro cung file path neu retention policy cho phep.
  - Tot hon la copy physical file sang target folder va link `copiedFromMediaId`.
- Audit source and target.

### 9.9 Complete capture -> report workflow

Action:

- `Mark capture complete` chuyen case sang `READY_TO_READ`.
- Gan bac si neu chua co.
- Open report route dung workflowService hien co.
- Report detail hien media strip/gallery.
- Print template co the include selected media thumbnails neu template support.

UI:

- Capture page co button `Hoan tat chup`.
- Queue cap nhat row status ngay.
- Report detail co tab/strip `Non-DICOM media`.
- Report final/delivery/HIS status hien nhu DICOM.

## 10. Integration voi cac man hinh san co

### 10.1 Study List `/`

Hien:

- Badge `Non-DICOM`.
- Machine/facility/procedure.
- Assigned doctor/KTV.
- Media count.
- Capture status.
- Report/HIS/delivery status.

Actions:

- Open capture.
- Open report.
- Assign doctor.
- Update clinical info.
- Mark delivered neu final.

Neu DICOM-only filter dang co, them filter `Nguon: DICOM / Non-DICOM / Tat ca`.

### 10.2 Worklist `/worklist`

Hien:

- Procedure co Non-DICOM eligible badge.
- Order da tao Non-DICOM exam hay chua.
- Button `Tao/ Mo ca Non-DICOM` chi hien khi procedure/machine eligible va user co quyen.
- Overdue no-media neu qua SLA ma chua capture media.

### 10.3 Report detail `/report/[studyInstanceUid]`

Hien:

- Media strip Non-DICOM: primary image, selected images, video/file count.
- Nut chen media selected vao report body/print payload neu policy cho phep.
- Link mo capture page.
- HIS result status nhu DICOM.
- Khong cho sua/xoa media sau final neu policy khong cho phep.

### 10.4 Archive `/archive`

Hien:

- Badge Non-DICOM.
- Media/video/attachment count.
- Assigned doctor/report doctor.
- Delivery/HIS status.
- Actions: view media, reprint, export selected, mark delivered.

### 10.5 Statistics `/statistics`

Them:

- So ca Non-DICOM theo ngay/procedure/machine.
- Capture waiting time.
- Media count trung binh / ca.
- Overdue capture.
- Workload KTV/Bac si cho Non-DICOM.
- HIS failed/sent cho Non-DICOM.

### 10.6 Admin

Can hien:

- PACS nodes: machine `isNonDicom=true`, default procedure/template/folder.
- Catalogs: procedure `isNonDicomEligible`.
- Storage: folder upload health.
- Permission matrix: action keys Non-DICOM.

## 11. API va service boundaries

### 11.1 Server actions

De xuat:

```text
dashboard/app/non-dicom/actions.ts
```

Functions:

- `getNonDicomQueueAction(filters)`
- `createNonDicomExamAction(payload)`
- `getNonDicomExamDetailAction(examId)`
- `updateNonDicomClinicalInfoAction(examId, payload)`
- `assignNonDicomDoctorAction(examId, doctorId)`
- `markNonDicomCaptureCompleteAction(examId)`
- `cancelNonDicomExamAction(examId, reason)`
- `copyNonDicomMediaAction(sourceMediaIds, targetExamId)`
- `voidNonDicomMediaAction(mediaIds, reason)`

### 11.2 API routes

De xuat:

```text
POST /api/non-dicom/exams/[examId]/media
GET  /api/non-dicom/media/[mediaId]/file
GET  /api/non-dicom/media/[mediaId]/thumbnail
POST /api/non-dicom/exams/[examId]/recording
```

Rules:

- Protected route only.
- No public file path.
- Range requests cho video neu kha thi.
- Cache private.
- Audit download/print/export.

### 11.3 Service

De xuat:

```text
dashboard/lib/nonDicomWorkflowService.ts
dashboard/lib/nonDicomMediaService.ts
dashboard/lib/nonDicomStorageService.ts
```

Service chiu trach nhiem:

- Status transitions.
- Audit.
- Storage path resolution.
- Media validation.
- Link voi `ImagingStudy`/report/archive.
- HIS sync hook neu final report.

## 12. Report/print template integration

MVP:

- Report page load media list cua case.
- User chon media nao dua vao print payload.
- Print template viewer co placeholder:
  - `{{nonDicomPrimaryImage}}`
  - `{{nonDicomSelectedImages}}`
  - `{{nonDicomMediaTable}}`
- Neu template khong support image, hien warning nhe nhung khong fail final report.

Không luu image base64 lon vao report body. Luu reference/media id.

## 13. HIS integration

Phase 6 dung lai Phase 2:

- Inbound HIS order co the tao Non-DICOM worklist/exam neu procedure eligible.
- Outbound final result gui HIS nhu DICOM.
- HIS status hien tren queue/detail/report/archive/statistics.
- Retry HIS action chi hien neu user co quyen va report final.

Khong tao adapter HIS rieng cho Non-DICOM neu adapter chung da du.

## 14. Audit actions

Audit action names de xuat:

- `non_dicom_exam_created`
- `non_dicom_exam_opened`
- `non_dicom_capture_started`
- `non_dicom_capture_completed`
- `non_dicom_image_captured`
- `non_dicom_video_recorded`
- `non_dicom_attachment_uploaded`
- `non_dicom_media_cropped`
- `non_dicom_media_rotated`
- `non_dicom_media_set_primary`
- `non_dicom_media_voided`
- `non_dicom_media_copied`
- `non_dicom_media_printed`
- `non_dicom_media_exported`
- `non_dicom_report_opened`
- `non_dicom_exam_cancelled`

Metadata chi gom ID/summary. Khong dua raw PHI, raw filename local, hay base64 vao audit.

## 15. PR breakdown de xuat

### PR 6.1 - Schema, permissions, storage boundary

Files du kien:

```text
dashboard/prisma/schema.prisma
dashboard/prisma/migrations/*_phase6_non_dicom_capture/migration.sql
dashboard/lib/permissions.ts
dashboard/prisma/seed.ts
dashboard/prisma/seed.js
dashboard/lib/nonDicomWorkflowService.ts
dashboard/lib/nonDicomMediaService.ts
dashboard/lib/nonDicomStorageService.ts
```

Scope:

- Them model/fields Non-DICOM.
- Them permissions.
- Them storage helper.
- Them audit helper.
- Prisma validate/generate.

UI bat buoc trong PR nay:

- Khong duoc chi schema. Phai them it nhat badge/empty entry hoac admin visibility:
  - Admin PACS node hien Non-DICOM machine da san sang.
  - Storage UI hien folder upload duoc dung cho Non-DICOM.
  - Permission UI hien permission labels.

### PR 6.2 - Non-DICOM queue va create exam UI

Files du kien:

```text
dashboard/app/non-dicom/page.tsx
dashboard/app/non-dicom/actions.ts
dashboard/app/non-dicom/components/*
dashboard/app/page.tsx
dashboard/app/worklist/page.tsx
dashboard/app/worklist/actions.ts
```

Scope:

- Route Non-DICOM.
- Queue filters.
- Create exam modal/form.
- Worklist action tao/mo Non-DICOM.
- Study List badge/filter.

Exit:

- User co the tao case va thay row moi ngay tren UI.

### PR 6.3 - Capture detail, camera still image, gallery

Files du kien:

```text
dashboard/app/non-dicom/[examId]/page.tsx
dashboard/app/non-dicom/[examId]/actions.ts
dashboard/app/non-dicom/components/CameraCapturePanel.tsx
dashboard/app/non-dicom/components/NonDicomMediaGallery.tsx
dashboard/app/api/non-dicom/exams/[examId]/media/route.ts
dashboard/app/api/non-dicom/media/[mediaId]/file/route.ts
dashboard/app/api/non-dicom/media/[mediaId]/thumbnail/route.ts
```

Scope:

- Browser camera permission.
- Capture still image.
- Upload to protected storage.
- Gallery update realtime.
- Set primary, note, soft void.

Exit:

- Capture -> thumbnail hien -> media count cap nhat -> audit co log.

### PR 6.4 - Upload, crop/rotate, print selected, copy media

Scope:

- Upload dropzone with typed attachment.
- Crop/rotate modal.
- Print/export selected media MVP.
- Copy media to another exam.

UI bat buoc:

- Progress/error state.
- Confirmation dialog for copy/void.
- Badge copied/upload/camera.

### PR 6.5 - Video recording MVP

Scope:

- MediaRecorder support detection.
- Start/stop recording.
- Playback modal with protected file route.
- Duration/size validation.
- Download if permission allows.

UI bat buoc:

- Timer.
- Unsupported browser message.
- Upload progress.
- Video thumbnail/icon and duration.

### PR 6.6 - Report/archive/statistics integration

Scope:

- Report detail media strip.
- Selected media reference in print payload.
- Archive columns/actions.
- Statistics Non-DICOM cards.
- HIS result status integration.

Exit:

- Non-DICOM case can go capture -> report -> final/HIS -> print/delivery/archive with visible status.

### PR 6.7 - QA, security, browser compatibility

Scope:

- Build.
- Permission bypass tests.
- Upload validation tests.
- Camera denied/unavailable tests.
- Storage failure tests.
- Final report lock tests.
- Manual scenario documentation.

## 16. QA scenarios

### SCN-6.1 Create Non-DICOM exam

1. Login as technician.
2. Open Non-DICOM queue.
3. Create exam with Non-DICOM machine and procedure.
4. Verify row appears with `REQUESTED`/`CAPTURING`.
5. Verify Study List/Worklist badge if linked.

Expected:

- UI updates without reload.
- Audit `non_dicom_exam_created`.

### SCN-6.2 Camera permission denied

1. Open capture page.
2. Deny browser camera permission.

Expected:

- UI shows clear denied state.
- No empty media record created.
- Capture button disabled.

### SCN-6.3 Still capture

1. Grant camera permission.
2. Capture image.
3. Add note.
4. Set primary.

Expected:

- Thumbnail appears.
- Media count increments.
- Primary badge visible.
- File route is protected.

### SCN-6.4 Upload attachment

1. Upload JPG/PDF allowed.
2. Try upload disallowed file type.

Expected:

- Allowed files appear with type badge.
- Disallowed file rejected with UI error.
- No PHI filename exposed in UI/download name.

### SCN-6.5 Video recording

1. Start recording.
2. Stop before duration limit.
3. Playback.

Expected:

- Timer works.
- Video appears in gallery.
- Playback uses protected route.

### SCN-6.6 Complete capture and report

1. Mark capture complete.
2. Open report.
3. Select media for print.
4. Finalize report.

Expected:

- Status moves to READY_TO_READ/READING/REPORTED according to workflow.
- Report detail shows media strip.
- HIS result status visible.

### SCN-6.7 Final lock

1. Finalize Non-DICOM report.
2. Try delete/modify media as unauthorized user.

Expected:

- UI action hidden/disabled.
- Backend rejects direct call.

### SCN-6.8 Archive and delivery

1. Open archive.
2. Search Non-DICOM case.
3. Mark delivered.

Expected:

- Archive shows Non-DICOM badge/media counts.
- Delivery status updates with audit.

## 17. Acceptance criteria

Phase 6 chi duoc coi la hoan thanh khi:

- Co route Non-DICOM queue va capture detail dung duoc.
- Non-DICOM machine/procedure/folder config tu Phase 3 duoc dung that.
- Tao case/capture/upload/video/gallery/report/archive deu co UI.
- Khong co action Non-DICOM nao backend accept ma UI khong hien duoc ket qua.
- Khong co nut active nao se bi backend tu choi do thieu permission.
- Camera denied/unavailable co UI graceful.
- Upload validation co server-side guard.
- Media file khong public direct.
- Xoa media la soft-delete/void co reason/audit.
- Report final/delivery lock duoc ton trong.
- HIS status hien tren queue/detail/report/archive/statistics.
- Build pass.
- Manual QA co it nhat 1 browser camera scenario hoac mock camera scenario.

## 18. Rui ro va guardrails

| Rui ro | Giam thieu |
| --- | --- |
| Browser camera khong kha dung do HTTP/permission | UI guidance, require HTTPS/localhost, disabled state |
| File upload gay lo hong bao mat | MIME allowlist, size limit, protected file route, no public path |
| Luu PHI trong filename | Use caseCode/mediaId only |
| Non-DICOM tao workflow song song voi DICOM | Reuse ImagingStudy/report/archive/status helpers |
| Media bi sua sau final report | Lock policy + backend reject + audit |
| Storage fail lam mat media | Transaction metadata after file write; UI retry; storage health |
| Video file qua lon | Duration/size limit + progress + reject |
| UI qua phuc tap | Queue/detail/gallery ro, khong chen controls vao Study List qua nhieu |

## 19. Prompt giao cho AI coding agent

Copy prompt duoi day neu muon giao Phase 6 cho AI khac:

```text
Ban la coding agent trong repo MiniPACS. Hay thuc hien Phase 6 - Non-DICOM Capture Module theo file:

- docs/VRPACS_PHASE6_NON_DICOM_CAPTURE_MODULE_PLAN.md

Can doc truoc:

- docs/VRPACS_GAP_ANALYSIS_ROADMAP.md
- docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md
- docs/VRPACS_PHASE2_HIS_INTEGRATION_PLAN.md
- docs/VRPACS_PHASE3_ADMIN_CATALOG_PERMISSION_PLAN.md
- docs/VRPACS_PHASE3_5_OPERATIONAL_UI_VISIBILITY_PLAN.md
- docs/VRPACS_PHASE4_VIEWER_WEB_PARITY_PLAN.md
- docs/VRPACS_PHASE5_ADVANCED_MPR_3D_SPECIALTY_TOOLS_PLAN.md
- docs/VRPACS_WORKFLOW_STATUS_POLICY.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_TERMINOLOGY_MAP.md

Muc tieu:

- Tao module Non-DICOM co queue, create exam, capture detail, camera still capture, gallery, upload attachment, video MVP, report/archive/statistics integration.
- Tat ca schema/service/API/action them moi phai co UI hien thi/tuong tac tuong ung.
- Khong tao backend-only feature.
- Khong lam share/consultation/video conference/chat; de Phase 7.
- Khong lam destructive hard delete; de Phase 8.
- Khong lam native scanner/CD/open-folder/global screen capture; de Phase 9.

Uu tien:

1. Schema/permissions/storage/audit boundary.
2. Non-DICOM queue + create exam UI.
3. Capture detail + browser camera still image + media gallery.
4. Upload/crop/copy/print selected media.
5. Video recording MVP.
6. Report/archive/statistics/HIS status integration.
7. QA/security/browser compatibility.

Rang buoc:

- Server-side permission bat buoc.
- File media phai qua protected route, khong public direct.
- Upload MIME/size validate server-side.
- Filename khong chua ten benh nhan.
- Xoa media la soft delete/void co reason/audit.
- UI khong hien action neu backend se reject.
- Graceful fallback neu Phase 3 catalog/storage chua co data.
- Khong revert thay doi cua user.

Ket qua mong muon:

- Files changed list.
- Behavior/UI changed summary.
- Build/test da chay.
- Manual scenarios da test.
- UI fields/action nao hien duoc va fallback nao con lai.
- Rui ro con lai neu co.
```

