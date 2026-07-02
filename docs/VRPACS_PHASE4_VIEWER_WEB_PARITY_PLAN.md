# Ke hoach chi tiet Phase 4 - Viewer Web Parity

Updated: 2026-07-03

## 1. Muc tieu

Phase 4 tap trung hoan thien trai nghiem web viewer cua MiniPACS de gan hon voi VRPACS Viewer trong pham vi web an toan. Phase nay khong nhay sang advanced MPR/3D/specialty AI, ma uu tien cac tool va workflow bac si dung hang ngay: tool registry chay that, cau hinh viewer theo user, key image/snapshot/gallery, action history, download manager, anonymize/encode cho export, hide/show DICOM tag, va history compare.

Muc tieu cuoi phase:

- Cac tool web-feasible dang `deferred-advanced` duoc audit va chuyen sang `ready`, `backend`, hoac `guarded` dung nghia.
- Registry la source of truth cho toolbar, left panel, viewport mini toolbar, series menu, disabled state, tooltip, hotkey, va command mapping.
- Bac si co the cau hinh viewer theo user: toolbar position, hotkeys, WW/WL presets F1-F10, layout default theo modality/service, tool visibility, overlay fields, reset/save.
- Key image, snapshot, crop, fullview snapshot, note, gallery, selected/all export, va send-to-report co flow ro rang.
- Co action history UI doc tu `ViewerAuditLog`.
- Series overflow co cac action web: convert series to key images, download series, export video neu du lieu phu hop, guarded delete-series request/policy.
- Co download manager voi job status, progress, expires, retry/cancel khi kha thi.
- Co encode/anonymize patient mode cho share/download/export ma khong ghi de patient identity goc.
- Co hide/show DICOM tags toggle rieng voi DICOM tag browser.
- History panel co the mo prior/current compare layout khi co study truoc.
- Moi action viewer quan trong co permission, audit, va khong lam hong report/worklist/archive.

## 2. Khong nam trong Phase 4

Phase 4 khong lam cac viec sau:

- Khong trien khai advanced MPR/3D production: curved MPR, fusion MPR, clipping, virtual endoscopy, 3D sculpt, 3D print.
- Khong trien khai specialty measurement package: NASCET/ESCT, cardiopulmonary, mammography full workflow, brain mirror, AI labeling.
- Khong trien khai Non-DICOM capture.
- Khong trien khai consultation/video conference/chat.
- Khong trien khai public share link day du co QR/password/expiry. Phase 4 chi chuan bi anonymize/export/share artifact boundary.
- Khong trien khai destructive delete study production.
- Khong trien khai delete series production neu chua co policy Phase 8. Phase 4 chi nen co guarded request/dry-run UI hoac disabled state ro rang.
- Khong trien khai native workstation features: open folder, DICOM print SCU, CD/DVD burn, scanner, external app launcher.
- Khong thay doi report lifecycle final/addendum ngoai viec send viewer artifacts vao report workspace.
- Khong commit PHI/DICOM that trong test data.

Neu mot tool trong registry can engine hoac backend chua an toan, khong ep `ready`; cap nhat status va deferred reason dung phase.

## 3. He thong hien tai can ke thua

MiniPACS hien da co cac thanh phan viewer nen:

- OHIF custom mode: `ohif-viewer/modes/minipacs-viewer`.
- OHIF custom extension: `ohif-viewer/extensions/minipacs`.
- Tool registry: `ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts`.
- Top toolbar, left panel, viewport mini toolbar, series rail:
  - `CustomTopToolbar.tsx`
  - `CustomToolsSidebar.tsx`
  - `MiniPacsViewportMiniToolbar.tsx`
  - `MiniPacsViewportOverflowMenu.tsx`
  - `MiniPacsSeriesRail.tsx`
  - `MiniPacsSeriesContextMenu.tsx`
- Existing viewer dialogs:
  - `MiniPacsHistoryPanel.tsx`
  - `MiniPacsSnapshotGallery.tsx`
  - `MiniPacsKeyImageDialog.tsx`
  - `MiniPacsReportWorkspaceDialog.tsx`
  - `MiniPacsDiagnosticsDialog.tsx`
- Existing services:
  - `viewerApiClient`
  - `viewerAuditService`
  - `viewerContextService`
  - `viewerDiagnosticsService`
  - `viewerHangingProtocolService`
  - `viewerKeyImageService`
  - `viewerMeasurementPersistenceService`
  - `viewerReportWorkspaceService`
  - `viewerSnapshotService`
  - `layoutPresetService`
  - `viewportStateAdapter`
  - `commandBridge`
  - `commandFeedbackService`
- Dashboard viewer APIs:
  - `/api/viewer/studies/[uid]/context`
  - `/api/viewer/studies/[uid]/history`
  - `/api/viewer/studies/[uid]/measurements`
  - `/api/viewer/studies/[uid]/key-images`
  - `/api/viewer/snapshots`
  - `/api/viewer/studies/[uid]/report-workspace`
  - `/api/audit/viewer-action`
- Prisma viewer models:
  - `ViewerMeasurement`
  - `ViewerKeyImage`
  - `ViewerSnapshot`
  - `ViewerAuditLog`

Phase 4 phai noi tiep cac thanh phan nay, khong tao viewer moi ngoai OHIF/MiniPACS extension.

## 4. Nguyen tac kien truc

### 4.1 Registry is the contract

Moi tool visible trong viewer phai co metadata dung trong `minipacsToolRegistry.ts`:

- `id`
- `label`
- `type`
- `status`
- `placement`
- `commandName` hoac action handler ro rang
- `hotkey` neu co
- `requires` hoac `requiresCapability` neu can
- `destructive` neu nguy hiem
- `deferredReason` neu chua ready

Toolbar, left panel, viewport mini toolbar, va series menu nen doc tu registry hoac tu config co lien ket registry. Khong them button hard-code ma khong co registry entry.

### 4.2 Ready means verified

Chi chuyen tool sang `ready` khi da co:

- Command handler hoat dong.
- UI feedback khi success/fail.
- Permission/backend neu action nhay cam.
- Manual test tren study that/anonymized.
- Khong crash viewport khi tool bi goi sai context.

Neu tool co UI nhung chua co backend, de `backend`. Neu tool nguy hiem, de `guarded`. Neu phu thuoc advanced engine, de Phase 5.

### 4.3 No silent patient identity mutation

Encode/anonymize trong Phase 4 la presentation/export mode, khong sua patient identity goc trong `ImagingStudy`, Orthanc, report, hay HIS data.

### 4.4 Export is job-based

Download/export lon nen di qua job status thay vi blocking request:

- Tao job.
- Poll status.
- Download file khi ready.
- Het han file theo policy.
- Audit request va download.

### 4.5 Viewer actions are audited

Moi action sau phai audit:

- Save key image/snapshot.
- Crop/fullview snapshot.
- Send artifact to report.
- Export/download.
- Toggle anonymize/encode for export.
- Open history/compare.
- Change viewer preferences.
- Guarded series delete request.
- Tool failure neu co tac dong clinical/workflow.

### 4.6 Preferences must have fallback

Neu user preference API loi, viewer van phai load voi default config hoac localStorage fallback. Khong de viewer blank chi vi preference loi.

### 4.7 Web first, native later

Phase 4 chi lam tool web co the chay trong browser. Cac tool can native companion phai de `deferred-native` va hien tooltip ro.

## 5. Doi chieu gap Phase 4

| Nhom VRPACS Viewer | Hien tai MiniPACS | Can bo sung Phase 4 |
| --- | --- | --- |
| Tool registry | Co registry lon, nhieu status deferred/guarded | Audit status, map command, ready only after verify |
| Basic 2D tools | Nhieu tool ready: pan, zoom, WL, length, angle, ROI co ban | Caliper, polygon ROI, text marker, eraser, free rotate neu web-safe |
| Capture/gallery | Co key image/snapshot metadata va gallery co ban | Image capture/thumbnail, crop, fullview snapshot, note, categories, export/send selected |
| Report bridge | Co report workspace API | Send selected measurement/key/snapshot ro rang, audit, error UI |
| Action history | Co `ViewerAuditLog` | UI Action History trong viewer |
| User config | Co local layoutPresetService mot phan | Server preference, toolbar/hotkey/WL/layout/tool/overlay config |
| DICOM tags | Co tag browser | Hide/show DICOM overlay tags toggle rieng |
| History | Co history endpoint/panel | Prior/current compare layout open tu history |
| Series menu | Co context menu item | Convert series to key images, download series, export video, guarded delete |
| Download/export | Mostly missing | Download manager job UI/API |
| Anonymize/encode | Missing | Export/share artifact anonymize mode, khong sua identity goc |

## 6. Data model de xuat

### 6.1 ViewerUserPreference

Muc dich: luu cau hinh viewer theo user.

Fields de xuat:

- `id`
- `userId`
- `toolbarPosition`
- `theme`
- `hotkeysJson`
- `windowLevelPresetsJson`
- `layoutDefaultsJson`
- `toolVisibilityJson`
- `overlayFieldsJson`
- `seriesRailJson`
- `anonymizeDefault`
- `metadataJson`
- `createdAt`
- `updatedAt`

Unique:

- `userId`

Fallback:

- Neu khong co record, dung default config trong extension.
- Neu API loi, viewer co the dung localStorage tam thoi.

### 6.2 ViewerSnapshot mo rong

`ViewerSnapshot` hien co metadata va `imageUrl`.

Mo rong de ho tro Phase 4:

- `thumbnailUrl`
- `storageKey`
- `category`
- `sourceType`
- `cropRectJson`
- `cropRatio`
- `isFullViewport`
- `includeOverlay`
- `isAnonymized`
- `metadataJson`

`category` de xuat:

- `SERVER`
- `LOCAL`
- `REPORT`
- `EXPORT`

Neu migration lon, co the dung `metadataJson` truoc cho crop/category, sau do normalize.

### 6.3 ViewerKeyImage mo rong

`ViewerKeyImage` hien co metadata va note.

Mo rong:

- `thumbnailUrl`
- `storageKey`
- `category`
- `cropRectJson`
- `cropRatio`
- `isSelectedForReport`
- `isAnonymized`
- `metadataJson`

Khong bat buoc tao image file cho moi key image neu key image chi la reference. Nhung gallery/export can thumbnail/preview nen nen tao thumbnail neu co the.

### 6.4 ViewerDownloadJob

Muc dich: quan ly export/download job.

Fields de xuat:

- `id`
- `jobType`
- `status`
- `studyInstanceUid`
- `seriesInstanceUid`
- `requestedByUserId`
- `progress`
- `itemCount`
- `fileName`
- `filePath`
- `fileSizeBytes`
- `mimeType`
- `expiresAt`
- `errorMessage`
- `anonymize`
- `includePatientInfo`
- `metadataJson`
- `createdAt`
- `updatedAt`
- `completedAt`

`jobType` de xuat:

- `SNAPSHOT_ZIP`
- `KEY_IMAGE_ZIP`
- `SERIES_DICOM`
- `SERIES_JPEG`
- `STUDY_DICOM`
- `VIDEO_EXPORT`
- `REPORT_ARTIFACTS`

`status` de xuat:

- `PENDING`
- `RUNNING`
- `READY`
- `FAILED`
- `CANCELLED`
- `EXPIRED`

### 6.5 ViewerSeriesActionRequest

Muc dich: ghi nhan action nguy hiem tren series, dac biet delete.

Fields de xuat:

- `id`
- `studyInstanceUid`
- `seriesInstanceUid`
- `actionType`
- `status`
- `reason`
- `requestedByUserId`
- `approvedByUserId`
- `metadataJson`
- `createdAt`
- `updatedAt`

Phase 4 co the dung model nay cho guarded delete-series request. Actual delete Orthanc nen de Phase 8 neu chua co policy.

### 6.6 ViewerAuditLog mo rong hoac tiep tuc dung hien co

Hien co `ViewerAuditLog` du dung cho action history.

Neu can mo rong:

- `severity`
- `entityType`
- `entityId`
- `ipAddress`
- `userAgent`

MVP Phase 4 co the dung `metadataJson` va index hien co.

## 7. API scope de xuat

### 7.1 Preferences

Routes:

- `GET /api/viewer/preferences`
- `PUT /api/viewer/preferences`
- `POST /api/viewer/preferences/reset`

Behavior:

- Require authenticated user.
- Return default + user overrides.
- Validate hotkeys, WL presets, layout defaults, tool visibility, overlay fields.
- Audit save/reset.

### 7.2 Action history

Routes:

- `GET /api/viewer/studies/[uid]/action-history`

Behavior:

- Require `studies.read`.
- Return `ViewerAuditLog` filtered by study.
- Support paging, action filter, date filter.
- Scrub metadata secrets.

### 7.3 Snapshot/key image update

Routes can extend existing:

- `PATCH /api/viewer/snapshots/[id]`
- `DELETE /api/viewer/snapshots/[id]`
- `PATCH /api/viewer/studies/[uid]/key-images/[id]`
- `DELETE /api/viewer/studies/[uid]/key-images/[id]`

Behavior:

- Update note/category/selection.
- Delete only artifact metadata/file, khong delete DICOM study.
- Audit all changes.

### 7.4 Capture upload

Routes:

- `POST /api/viewer/studies/[uid]/captures`

Payload:

- `type`: `SNAPSHOT`, `KEY_IMAGE`, `FULLVIEW`, `CROP`
- `imageData` hoac `storageKey`
- `viewportState`
- `cropRect`
- `note`
- `includeOverlay`
- `anonymize`

Behavior:

- Limit image size.
- Validate study UID.
- Save image/thumbnail.
- Create `ViewerSnapshot` hoac `ViewerKeyImage`.
- Audit.

### 7.5 Download jobs

Routes:

- `POST /api/viewer/download-jobs`
- `GET /api/viewer/download-jobs`
- `GET /api/viewer/download-jobs/[id]`
- `POST /api/viewer/download-jobs/[id]/cancel`
- `GET /api/viewer/download-jobs/[id]/file`

Behavior:

- Require `viewer.export` neu da co permission, fallback `studies.read` + `reports.read` theo policy.
- Job async neu co queue; MVP co the tao job sync nho va cap nhat status.
- File expires theo config.
- Audit create/download/cancel/fail.

### 7.6 Anonymize/encode

Routes:

- `POST /api/viewer/anonymize/preview`
- `POST /api/viewer/download-jobs` voi `anonymize=true`

Behavior:

- Return anonymized display/export metadata.
- Khong update `ImagingStudy`.
- Khong update Orthanc tags.
- Audit khi export/download anonymized.

### 7.7 Series actions

Routes:

- `POST /api/viewer/studies/[uid]/series/[seriesUid]/key-images`
- `POST /api/viewer/studies/[uid]/series/[seriesUid]/download`
- `POST /api/viewer/studies/[uid]/series/[seriesUid]/video-export`
- `POST /api/viewer/studies/[uid]/series/[seriesUid]/delete-request`

Behavior:

- Convert series to key images co limit va progress.
- Download/export tao `ViewerDownloadJob`.
- Delete request la guarded, can reason, permission, audit.
- Actual delete co the deferred Phase 8.

### 7.8 History compare

Extend:

- `GET /api/viewer/studies/[uid]/history`

Optional new:

- `POST /api/viewer/studies/[uid]/compare-session`

Behavior:

- Return prior studies co `studyInstanceUid`, modality, date, description, report status.
- UI co action open current/prior compare URL.
- Audit `history_compare_opened`.

## 8. Tool registry target

### 8.1 Web feasible in Phase 4

Nhung tool nen audit va implement/verify trong Phase 4:

| Tool id | Target status | Huong xu ly |
| --- | --- | --- |
| `Caliper` | `ready` neu map duoc | Map toi `CalibrationLine`/length calibration; neu khac y nghia, de `backend`/`deferred-phase5` |
| `PolygonROI` | `ready` neu toolGroup co polygon/freehand | Map toi `PlanarFreehandROI` hoac polygon ROI co san |
| `TextAnnotation` / `TextMarker` | `ready` neu command co san | Map toi `ArrowAnnotate` text mode hoac custom text annotation nho |
| `Eraser` | `ready` hoac `guarded` | Delete selected annotation, confirm neu delete all |
| `FreeRotate` | `ready` chi neu viewport transform an toan | Neu khong persist duoc, giu deferred voi reason dung |
| `CropImage` | `ready` | Crop modal/canvas capture tao snapshot/key image |
| `FullviewSnapshot` | `ready` | Capture full viewport hoac all visible viewport |
| `ActionHistory` | `ready` | Open action history panel tu `ViewerAuditLog` |
| `UserConfig` | `ready` | Open viewer preference dialog |
| `DownloadManager` | `ready`/`backend` | Open job panel; ready khi API co |
| `EncodePatient` | `guarded`/`ready` | Toggle export anonymize mode; khong sua data goc |
| `Gallery` | `ready` | Gallery co thumbnail/note/filter/export/send report |
| `StudyHistory` | `ready` | History panel + compare open |
| `TagBrowser` | `ready` | Giu tag browser; them overlay tag toggle rieng |
| `DeleteSeries` | `guarded` | Request/dry-run, actual delete de Phase 8 neu chua policy |

### 8.2 Keep deferred to Phase 5

Cac tool sau khong nen ep vao Phase 4:

- `FusionMPR`
- `CurvedMPR`
- `CompareMPR`
- `Axial`, `Coronal`, `Sagittal` neu can MPR orientation production.
- `Volume`, `VolumePolygon`
- `Cardiopulmonary`
- `Mammography`
- `NASCET`
- `BrainMirror`
- `3D sculpt`
- `Virtual Endoscopy`
- `AI Labeling`

Neu registry hien ghi deferred reason "Phase 3" cho cac item nay, nen cap nhat lai thanh Phase 5 hoac Phase sau dung roadmap VRPACS.

### 8.3 Native deferred

Cac tool sau giu `deferred-native`:

- `OpenFolder`
- `DirectPrint`
- `CDBurn`
- `ScanDoc`
- `CaptureMonitor`
- `CaptureAllScreens`
- `ExternalLink*`
- `Dictation`
- `NativeExit/Minimize/Resize`

## 9. Frontend scope OHIF

### 9.1 Command routing

Can mo rong:

- `ohif-viewer/extensions/minipacs/src/commandsModule.ts`
- `commandBridge.ts`
- `commandFeedbackService.ts`

Command can co:

- `openMiniPacsDialog`
- `saveFullviewSnapshot`
- `startCropCapture`
- `openActionHistory`
- `openViewerConfig`
- `openDownloadManager`
- `toggleAnonymizedDisplay`
- `toggleDicomOverlayTags`
- `openCompareStudy`
- `createSeriesKeyImages`
- `downloadSeries`
- `exportSeriesVideo`
- `requestDeleteSeries`

Moi command can:

- Try/catch.
- User feedback.
- Audit neu co study UID.
- Context guard neu missing active viewport/study.

### 9.2 User config dialog

Component de xuat:

- `MiniPacsViewerConfigDialog.tsx`

Tabs:

- Toolbar.
- Hotkeys.
- WW/WL presets.
- Layout defaults.
- Tool visibility.
- Overlay fields.
- Reset.

Data service:

- `viewerPreferenceService.ts`

Behavior:

- Load preference on viewer init.
- Merge default + user overrides.
- Save to API.
- Fallback localStorage neu API loi.

### 9.3 Action history panel

Component de xuat:

- `MiniPacsActionHistoryPanel.tsx`

Features:

- List action/time/actor.
- Filter by action.
- Expand metadata.
- Link related artifact neu co.
- Export small CSV optional.

Use:

- `GET /api/viewer/studies/[uid]/action-history`

### 9.4 Gallery upgrade

Mo rong:

- `MiniPacsSnapshotGallery.tsx`
- `MiniPacsKeyImageDialog.tsx`
- `viewerSnapshotService.ts`
- `viewerKeyImageService.ts`

Features:

- Show snapshots and key images in same gallery hoac tabs.
- Thumbnail/preview.
- Note edit.
- Category filter.
- Select multiple.
- Send selected to report.
- Export selected/all.
- Delete artifact metadata/file voi confirm.
- Crop source image.

### 9.5 Crop/fullview capture

New components/services:

- `MiniPacsCropCaptureDialog.tsx`
- `viewerCaptureService.ts`

Behavior:

- Capture active viewport canvas.
- Option include overlay.
- Option anonymize overlay.
- Crop ratio presets: free, 1:1, 4:3, 16:9, report.
- Save as key image or snapshot.
- Audit.

### 9.6 Download manager

Component de xuat:

- `MiniPacsDownloadManager.tsx`

Features:

- Jobs list.
- Status/progress.
- Download ready file.
- Retry failed.
- Cancel pending/running if backend supports.
- Expiration display.
- Filter current study/all user jobs.

### 9.7 Series overflow

Mo rong:

- `MiniPacsSeriesContextMenu.tsx`
- `MiniPacsSeriesRail.tsx`

Actions:

- Convert to key images.
- Download DICOM/JPEG.
- Export video for cine/multiframe/US.
- Delete request.

Every action:

- Confirm if bulk/destructive.
- Require reason for delete request.
- Create audit.
- Show job in download manager if export.

### 9.8 History compare

Mo rong:

- `MiniPacsHistoryPanel.tsx`
- `viewerHangingProtocolService.ts`

Features:

- Button `Open compare`.
- Open URL voi current + prior study UID.
- Apply 1x2 or compare layout.
- Show report link for prior study.
- Audit.

### 9.9 DICOM tag visibility

Add:

- Toggle `Show DICOM overlay tags`.
- Separate from `TagBrowser`.

Behavior:

- TagBrowser van mo modal/table.
- Overlay toggle chi an/hien DICOM overlay fields tren viewport.
- Preference luu default.

### 9.10 Anonymize display/export

Add viewer state:

- `anonymizeMode`
- `includePatientInfo`

Behavior:

- Display overlay anonymized patient name/id when mode on.
- Export/download uses anonymized metadata.
- Report workspace va DB goc khong bi sua.
- Clear visual indicator when anonymize mode on.

## 10. Backend scope dashboard

### 10.1 Permissions

Can cap nhat `dashboard/lib/permissions.ts` neu Phase 3 chua lam:

- `viewer.configure`
- `viewer.export`
- `viewer.anonymize`
- `viewer.history`
- `viewer.deleteSeries`

Fallback neu khong them granular permission:

- Configure: `studies.read` for own preference.
- Export: `archive.read` hoac `reports.read` theo policy.
- Anonymize: `viewer.export` hoac `archive.read`.
- History: `studies.read`.
- Delete series request: `pacs.manage` hoac permission Phase 8.

Server action/API phai enforce permission; client hide button khong du.

### 10.2 Storage

Capture/export files nen luu vao folder da cau hinh tu Phase 3 neu co:

- `UPLOAD`
- `SHARE`
- `NORMAL`

Neu Phase 3 chua implement storage config:

- Dung env/config hien co.
- Khong hard-code path production.
- Ghi ro config note.

### 10.3 Jobs

Neu chua co queue:

- MVP co the tao job row va xu ly sync cho file nho.
- Jobs lon de `PENDING`/`FAILED` voi reason "queue not configured" neu can.
- Khong block request lau khi export study lon.

### 10.4 Image processing

MVP co the crop/capture tren client canvas va upload PNG/JPEG.

Backend can:

- Validate content type.
- Limit size.
- Generate storage key.
- Save thumbnail neu co library.
- Return URL qua protected route, khong expose raw filesystem path.

### 10.5 Protected media route

Neu imageUrl/fileUrl duoc luu:

- Nen la protected route, khong public file path.
- Check permission by study UID.
- Audit download neu can.

## 11. User preference chi tiet

### 11.1 Toolbar position

Options:

- `top`
- `left`
- `compact`

Phase 4 co the chi ho tro top/left neu UI hien tai phu hop.

### 11.2 Hotkeys

MVP:

- Read defaults.
- Allow remap selected commands.
- Validate duplicate hotkeys.
- F1-F10 for WW/WL presets.
- Reset to default.

### 11.3 WW/WL presets

Existing file:

- `ohif-viewer/extensions/minipacs/src/config/windowLevelPresets.ts`

Phase 4:

- Cho user edit label/window/level/hotkey.
- Save per user.
- Keep built-in defaults.
- Validate numeric range.

### 11.4 Layout defaults

Existing:

- `layoutPresetService.ts`
- `viewerHangingProtocolService.ts`

Phase 4:

- Save default layout by modality/service/procedure if data available.
- Use server preference when viewer loads.
- Fallback localStorage.

### 11.5 Tool visibility

Allow user hide/show:

- Top toolbar tools.
- Left panel sections.
- Viewport mini toolbar actions.

Cannot hide safety-critical controls if policy requires:

- Close.
- Reset.
- Diagnostics.

### 11.6 Overlay fields

Allow user choose overlay fields:

- Patient name.
- Patient ID.
- Accession.
- Study date.
- Series description.
- Image index.
- WW/WL.
- Zoom.
- Modality/body part.

If anonymize mode on:

- Patient name/id display masked.

## 12. Capture, gallery, report bridge

### 12.1 Save key image

Current service saves metadata. Phase 4 should add:

- Optional note.
- Optional thumbnail.
- Optional crop.
- Audit with viewport metadata.
- Error UI if backend fails.

### 12.2 Save snapshot

Current snapshot service saves metadata. Phase 4 should add:

- Actual image capture or clear reason if image unavailable.
- Thumbnail/preview.
- Fullview snapshot.
- Include overlay yes/no.
- Anonymize yes/no.

### 12.3 Crop workflow

Flow:

1. User clicks Crop Image.
2. Viewer captures active viewport image.
3. Crop modal opens.
4. User picks ratio and note.
5. Save as snapshot/key image.
6. Gallery refreshes.
7. Audit logs `crop_snapshot_saved` or `crop_key_image_saved`.

### 12.4 Send selected to report

Flow:

1. User opens gallery/report workspace.
2. Select measurements/key images/snapshots.
3. Click send to report.
4. API attaches references to report workspace or returns payload to report editor.
5. Report page can insert artifact list/images.
6. Audit logs selection.

### 12.5 Local vs server category

Policy:

- `SERVER`: persisted and usable for report/export.
- `LOCAL`: browser-only draft, not clinical source of truth.
- UI must label local artifacts clearly.

For clinical workflow, prefer server save.

## 13. Download, export, anonymize

### 13.1 Job types MVP

Phase 4 MVP should support:

- Export selected snapshots/key images as ZIP.
- Export series as JPEG ZIP if backend can render/collect images.
- Export DICOM series if Orthanc/DICOMweb route available.
- Export video for cine/multiframe only if safe.

If DICOM/JPEG full export is too large for Phase 4, create job UI/API boundary and implement selected artifacts first.

### 13.2 Anonymize policy

Anonymize for export should:

- Replace patient name/id/accession in exported metadata/display where possible.
- Remove or mask PHI from filenames.
- Avoid logging PHI in job metadata.
- Not update source study/report/HIS.

### 13.3 Download manager UX

Job row should show:

- Type.
- Study/series.
- Status.
- Progress.
- Created time.
- Expiry.
- File size.
- Error message.
- Download/retry/cancel actions.

### 13.4 Audit

Audit events:

- `download_job_created`
- `download_job_ready`
- `download_job_failed`
- `download_file_downloaded`
- `download_job_cancelled`
- `anonymized_export_created`

## 14. Series overflow policy

### 14.1 Convert series to key images

Behavior:

- User chooses current image, every Nth image, selected range, or all frames if small.
- Limit max key images per action.
- Bulk creates references and thumbnails.
- Audit count and series UID.

### 14.2 Download series

Behavior:

- Opens modal choose DICOM/JPEG.
- Optional anonymize.
- Creates download job.
- Shows job in Download Manager.

### 14.3 Export video

Behavior:

- Available only for cine/multiframe/US loop or loaded stack when feasible.
- Choose fps and anonymize overlay.
- Creates job or browser capture.
- If unsupported, show clear deferred reason.

### 14.4 Guarded delete series

Policy:

- Phase 4 should not hard-delete from Orthanc unless Phase 8 policy exists.
- Provide request/dry-run workflow:
  - Requires permission.
  - Requires reason.
  - Shows affected instances count.
  - Writes `ViewerSeriesActionRequest` or audit.
  - Shows pending/blocked status.
- If actual delete is intentionally implemented, require server-side permission, confirmation phrase, audit, and rollback/restore note.

## 15. History compare

### 15.1 Current state

Existing endpoint/panel returns patient history for same patient.

### 15.2 Phase 4 target

User can:

- Open history panel.
- See prior studies sorted by date.
- Open prior report.
- Open compare current + prior.

Compare options:

- New viewer URL with both `StudyInstanceUIDs`.
- Apply 1x2 layout.
- Put current on left, prior on right where possible.
- Keep a visible label for current/prior.

### 15.3 Guardrails

- Do not compare different patients unless explicit warning.
- If prior study has no images, show report-only option.
- Audit compare open.

## 16. Trinh tu trien khai

### Step 1 - Baseline audit

Doc cac file:

- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_PHASE0_PRODUCT_BASELINE_SAFETY_PLAN.md`
- `docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md`
- `docs/VRPACS_PHASE2_HIS_INTEGRATION_PLAN.md`
- `docs/VRPACS_PHASE3_ADMIN_CATALOG_PERMISSION_PLAN.md`
- `docs/VRPACS_PHASE4_VIEWER_WEB_PARITY_PLAN.md`
- `docs/VRPACS_TOOL_INVENTORY_PHASE1.md`
- `docs/MINIPACS_100_TOOLS_PHASE1_WEB_ONLY_PLAN.md`
- `docs/MINIPACS_100_TOOLS_PHASE2_2D_CLINICAL_TOOLS_PLAN.md` neu can

Doc code:

- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/app/api/viewer/**`
- `dashboard/app/api/audit/viewer-action/route.ts`
- `ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts`
- `ohif-viewer/extensions/minipacs/src/config/windowLevelPresets.ts`
- `ohif-viewer/extensions/minipacs/src/config/viewportWorkflowActions.ts`
- `ohif-viewer/extensions/minipacs/src/config/viewportMiniTools.ts`
- `ohif-viewer/extensions/minipacs/src/commandsModule.ts`
- `ohif-viewer/extensions/minipacs/src/Components/**`
- `ohif-viewer/extensions/minipacs/src/services/**`
- `ohif-viewer/modes/minipacs-viewer/src/**`

Output:

- Tool status audit table.
- Command/API inventory.
- Clear list of Phase 4 ready/backend/guarded/deferred.

### Step 2 - Registry cleanup

Viec can lam:

- Cap nhat deferred reason theo roadmap moi.
- Chuyen cac web-feasible tools sang target status sau khi command/API co.
- Them commandName/action metadata thieu.
- Dam bao UI disabled/tooltip dung status.
- Khong de button visible ma click khong co feedback.

Acceptance:

- Tool nao hien thi cung hoat dong hoac co message ro.
- Registry khong con reason sai "Phase 3" cho item thuc ra Phase 5/8.

### Step 3 - Preferences API va UI

Viec can lam:

- Them model `ViewerUserPreference` hoac storage tuong duong.
- Tao APIs preferences.
- Tao `viewerPreferenceService`.
- Tao `MiniPacsViewerConfigDialog`.
- Load/apply preference khi viewer init.
- Save/reset/audit.

Acceptance:

- User doi hotkey/WL preset/layout/tool visibility va reload van giu.
- API loi khong lam viewer blank.

### Step 4 - Web-feasible tool commands

Viec can lam:

- Wire Caliper/Polygon/Text/Eraser/FreeRotate neu safe.
- Neu tool khong safe, giu disabled/deferred reason ro.
- Them crop/fullview/action history/download/user config commands.
- Add try/catch va feedback.

Acceptance:

- Cac tool Phase 4 click khong crash.
- Measurement/annotation tools persist neu da co persistence.

### Step 5 - Capture/gallery upgrade

Viec can lam:

- Capture active viewport image.
- Crop modal.
- Fullview snapshot.
- Thumbnail/preview.
- Note/category.
- Select/delete/export/send report.
- Extend APIs/model neu can.

Acceptance:

- Save snapshot/key image co preview.
- Gallery reload van hien.
- Send selected artifacts to report hoat dong.

### Step 6 - Action history

Viec can lam:

- API action history.
- Panel action history.
- Add audit events thieu.
- Scrub metadata.

Acceptance:

- User mo Action History trong viewer va thay cac action vua lam.

### Step 7 - Download manager

Viec can lam:

- Add `ViewerDownloadJob`.
- Add APIs create/list/status/file/cancel.
- Add `MiniPacsDownloadManager`.
- Implement selected artifact ZIP truoc.
- Series/study export co the la job boundary neu backend lon.

Acceptance:

- Tao job, xem status, download file ready.
- Failed job hien error.
- Export anonymized khong lo PHI trong file name/job metadata.

### Step 8 - Series overflow

Viec can lam:

- Convert series to key images.
- Download series job.
- Export video neu feasible.
- Delete series request/dry-run guarded.

Acceptance:

- Series menu action co confirm/feedback/audit.
- Delete request khong hard-delete neu policy chua san sang.

### Step 9 - History compare va DICOM overlay toggle

Viec can lam:

- History panel `Open compare`.
- Compare URL/layout.
- Current/prior labels.
- Toggle DICOM overlay tags.
- Save default overlay visibility in preference.

Acceptance:

- Prior/current compare opens with two studies neu data co.
- Toggle overlay tags khong dong tag browser.

### Step 10 - QA, docs, cleanup

Viec can lam:

- Run dashboard build/lint neu kha thi.
- Run OHIF relevant build/test neu kha thi.
- Manual viewer QA voi study anonymized.
- Playwright/browser screenshot neu thay doi frontend lon.
- Update docs/backlog neu scope thay doi.

Commands tham khao:

- Dashboard: `npm run lint`, `npm run build` trong `dashboard`.
- OHIF extension: `yarn workspace @ohif/extension-minipacs test:unit:ci`.
- OHIF mode: `yarn workspace @ohif/mode-minipacs-viewer test:unit:ci`.
- OHIF build relevant: `yarn build:package-all` hoac command nho hon neu repo ho tro.

## 17. Acceptance criteria

Phase 4 duoc coi la xong khi:

- Tool registry duoc audit, status/deferredReason dung roadmap.
- Cac tool web-feasible Phase 4 hoat dong hoac disabled co reason ro.
- Viewer preferences load/save/reset duoc theo user.
- Hotkeys va WW/WL presets F1-F10 co the cau hinh va validate duplicate.
- Tool visibility/overlay/layout defaults co the cau hinh.
- Key image/snapshot co preview/thumbnail, note, category, edit/delete neu co quyen.
- Crop image va fullview snapshot tao artifact dung.
- Gallery co multi-select, export selected/all, send selected to report.
- Action History panel doc duoc `ViewerAuditLog`.
- Download Manager tao/xem/download job artifact toi thieu.
- Anonymize/encode mode ap dung cho export/download ma khong sua data goc.
- Hide/show DICOM overlay tags tach rieng voi DICOM tag browser.
- History panel co open prior/current compare layout.
- Series menu co convert to key images, download/export job, delete request guarded.
- Moi API nhay cam co permission server-side.
- Moi action quan trong co audit.
- Viewer khong blank tren study hop le.
- Worklist -> viewer -> report bridge -> archive khong regression.

## 18. Test scenarios

### 18.1 Viewer open regression

1. Mo study tu `/worklist` hoac `/`.
2. Viewer load DICOM image.
3. Khong co blank viewport.
4. Toolbar/left panel/series rail hien dung.

### 18.2 Registry feedback

1. Click moi tool visible trong top toolbar va left panel.
2. Tool ready chay dung.
3. Tool deferred/guarded hien tooltip/toast ro.
4. Khong co uncaught JS error.

### 18.3 Preferences

1. Mo User Config.
2. Doi WL preset F1.
3. Doi tool visibility.
4. Doi overlay fields.
5. Save, reload viewer.
6. Config van giu.
7. Reset ve default.

### 18.4 Key image

1. Mo active viewport.
2. Save key image voi note.
3. Mo gallery.
4. Key image co preview/note.
5. Send selected to report workspace.
6. Audit co `key_image_saved` va send report event.

### 18.5 Snapshot/fullview

1. Save snapshot active viewport.
2. Save fullview snapshot.
3. Gallery hien ca hai.
4. Preview khong bi loi.
5. Delete artifact neu co quyen.

### 18.6 Crop

1. Click Crop Image.
2. Chon ratio 1:1.
3. Save as snapshot.
4. Gallery preview dung crop.
5. Report workspace nhan artifact.

### 18.7 Action history

1. Save snapshot.
2. Save key image.
3. Open Action History.
4. Thay cac action moi voi time/actor.

### 18.8 Download manager

1. Chon 2 artifacts trong gallery.
2. Export selected.
3. Download Manager hien job PENDING/RUNNING/READY.
4. Download file.
5. Audit co create/download.

### 18.9 Anonymized export

1. Bat anonymize mode.
2. Export selected artifact.
3. File name va metadata display khong lo patient name/id that.
4. Source study/report khong bi doi.

### 18.10 Series overflow

1. Right-click series.
2. Convert current/range to key images.
3. Tao job download series.
4. Delete request bat buoc reason va khong hard-delete neu policy chua co.

### 18.11 History compare

1. Mo study co prior study cung patient.
2. Open History.
3. Click Open compare.
4. Viewer mo current + prior voi layout compare.
5. Audit co compare open.

### 18.12 DICOM overlay tags

1. Toggle hide DICOM tags.
2. Overlay patient/study tags an/hien dung.
3. Tag Browser van mo duoc rieng.
4. Preference luu default.

### 18.13 Permission denied

1. User khong co export permission click export.
2. UI/Server chan action.
3. Error ro rang.
4. Audit optional cho denied event neu policy can.

### 18.14 Large study safety

1. Open CT/MR nhieu series.
2. Viewer van responsive.
3. Export lon tao job, khong block UI.
4. Download job failed/queued co message ro neu backend chua ho tro.

## 19. Rui ro va cach xu ly

### 19.1 Registry status qua lac quan

Rui ro: chuyen tool sang ready khi command chua on dinh.

Cach xu ly:

- Ready only after manual verification.
- Them smoke checklist cho moi tool.
- Giu deferred/guarded neu nghi ngo.

### 19.2 Capture canvas bi chan boi CORS

Rui ro: browser khong cho read canvas neu image cross-origin.

Cach xu ly:

- Kiem tra DICOMweb/CORS.
- Neu khong capture duoc client-side, dung server-side render/thumbnail fallback.
- UI hien error ro, khong tao artifact rong.

### 19.3 Export lon lam treo server

Rui ro: series/study export lon blocking request.

Cach xu ly:

- Job-based.
- Limit item count.
- Background worker sau neu can.
- MVP export selected artifacts truoc.

### 19.4 PHI leak trong export/anonymize

Rui ro: patient name/id nam trong file name, metadata, audit.

Cach xu ly:

- Scrub metadata.
- Mask file names.
- Khong log PHI thua.
- Test anonymized export.

### 19.5 Preference loi lam viewer blank

Rui ro: config JSON loi lam UI crash.

Cach xu ly:

- Validate zod/schema.
- Merge default.
- Try/catch parse.
- Reset fallback.

### 19.6 Delete series nguy hiem

Rui ro: xoa anh that khi chua co policy.

Cach xu ly:

- Phase 4 chi request/dry-run.
- Actual delete de Phase 8.
- Neu implement actual delete, can confirmation phrase, permission, audit, backup/restore note.

### 19.7 OHIF version compatibility

Rui ro: command/tool API khac voi assumption.

Cach xu ly:

- Reuse OHIF services hien co.
- Kiem tra command truoc khi wire.
- Test build extension/mode.

## 20. De xuat chia nho thanh PR

### PR 4.1 - Viewer registry audit va command feedback

- Audit `minipacsToolRegistry`.
- Cap nhat status/deferredReason.
- Them missing command metadata.
- Dam bao disabled/guarded feedback.

### PR 4.2 - Viewer preferences

- Schema/API `ViewerUserPreference`.
- Preference service.
- User Config dialog.
- Hotkeys, WL presets, layout, overlay, tool visibility.

### PR 4.3 - Capture, crop, gallery

- Capture upload API.
- Crop/fullview snapshot.
- Gallery upgrade.
- Key image/snapshot preview/note/category.

### PR 4.4 - Report bridge va action history

- Send selected artifacts to report.
- Action history API/panel.
- Audit gaps.

### PR 4.5 - Download manager va anonymize export

- `ViewerDownloadJob`.
- Download Manager UI.
- Selected artifacts export.
- Anonymize mode/export policy.

### PR 4.6 - Series overflow va history compare

- Series convert/download/export video boundary.
- Guarded delete request.
- History compare layout.
- DICOM overlay tag toggle.

### PR 4.7 - QA hardening

- Regression fixes.
- Build/test.
- Browser screenshot/canvas checks.
- Docs/backlog updates.

## 21. Checklist ban giao Phase 4

Truoc khi ket thuc Phase 4, can co:

- [ ] Registry status audit hoan tat.
- [ ] Cac tool Phase 4 co command/feedback hoac deferred reason dung.
- [ ] User viewer preferences load/save/reset.
- [ ] Hotkeys va WL presets validate duplicate/range.
- [ ] Tool visibility va overlay fields ap dung vao UI.
- [ ] Snapshot/key image co preview/thumbnail va note.
- [ ] Crop/fullview snapshot hoat dong.
- [ ] Gallery co select/export/send report.
- [ ] Action History panel hoat dong.
- [ ] Download Manager co job status.
- [ ] Anonymize export khong sua data goc.
- [ ] DICOM overlay tag toggle tach voi tag browser.
- [ ] History compare current/prior hoat dong.
- [ ] Series menu action co confirm/feedback/audit.
- [ ] Delete series chi request/dry-run neu chua co Phase 8 policy.
- [ ] Permission server-side cho action nhay cam.
- [ ] Audit cho action quan trong.
- [ ] Viewer khong blank tren study hop le.
- [ ] Dashboard build/lint va OHIF test/build phu hop da chay hoac ghi ro vi sao chua chay.

## 22. Prompt ban giao cho AI khac

Copy prompt duoi day neu muon giao Phase 4 cho mot AI coding agent khac:

```text
Ban la AI coding agent trong repo MiniPACS. Hay thuc hien Phase 4 - Viewer Web Parity theo ke hoach da co.

Muc tieu:

- Hoan thien VRPACS web-viewer parity trong pham vi web-safe.
- Audit va cap nhat `minipacsToolRegistry.ts` de tool visible co status/command/tooltip/deferredReason dung.
- Implement user viewer config: toolbar position, hotkeys, WW/WL presets F1-F10, layout defaults, tool visibility, overlay fields, reset/save.
- Implement/verify cac tool web-feasible: Caliper, PolygonROI, TextAnnotation/TextMarker, Eraser, CropImage, FullviewSnapshot, ActionHistory, UserConfig, DownloadManager, EncodePatient/anonymize, DICOM overlay tag toggle.
- Nang cap key image/snapshot/gallery: preview/thumbnail, note, crop, category, selected/all export, send selected to report.
- Them Action History UI doc tu `ViewerAuditLog`.
- Them Download Manager voi job status va selected artifact export toi thieu.
- Them anonymize/encode cho export/download ma khong sua patient identity goc.
- Them History compare current/prior.
- Them series overflow actions: convert series to key images, download/export job, guarded delete-series request/dry-run.

Truoc khi code, doc cac file:

- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_PHASE0_PRODUCT_BASELINE_SAFETY_PLAN.md`
- `docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md`
- `docs/VRPACS_PHASE2_HIS_INTEGRATION_PLAN.md`
- `docs/VRPACS_PHASE3_ADMIN_CATALOG_PERMISSION_PLAN.md`
- `docs/VRPACS_PHASE4_VIEWER_WEB_PARITY_PLAN.md`
- `docs/VRPACS_TOOL_INVENTORY_PHASE1.md`
- `docs/MINIPACS_100_TOOLS_PHASE1_WEB_ONLY_PLAN.md`
- `docs/MINIPACS_100_TOOLS_PHASE2_2D_CLINICAL_TOOLS_PLAN.md` neu can

Sau do doc code hien tai:

- `dashboard/prisma/schema.prisma`
- `dashboard/lib/permissions.ts`
- `dashboard/app/api/viewer/**`
- `dashboard/app/api/audit/viewer-action/route.ts`
- `dashboard/app/api/images/**`
- `dashboard/app/report/[studyInstanceUid]/**`
- `ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts`
- `ohif-viewer/extensions/minipacs/src/config/windowLevelPresets.ts`
- `ohif-viewer/extensions/minipacs/src/config/viewportWorkflowActions.ts`
- `ohif-viewer/extensions/minipacs/src/config/viewportMiniTools.ts`
- `ohif-viewer/extensions/minipacs/src/commandsModule.ts`
- `ohif-viewer/extensions/minipacs/src/Components/**`
- `ohif-viewer/extensions/minipacs/src/services/**`
- `ohif-viewer/modes/minipacs-viewer/src/**`

Trien khai theo thu tu:

1. Registry audit:
   - Cap nhat status/deferredReason trong `minipacsToolRegistry.ts`.
   - Tool nao visible phai co command hoac disabled/guarded feedback.
   - Khong chuyen sang `ready` neu chua verify command/API.

2. Permission/backend baseline:
   - Them permission viewer neu can: `viewer.configure`, `viewer.export`, `viewer.anonymize`, `viewer.history`, `viewer.deleteSeries`.
   - Enforce server-side cho APIs nhay cam.
   - Khong chi an nut client.

3. Preferences:
   - Them `ViewerUserPreference` hoac storage tuong duong.
   - Tao `GET/PUT/POST reset /api/viewer/preferences`.
   - Tao `viewerPreferenceService`.
   - Tao `MiniPacsViewerConfigDialog`.
   - Support toolbar, hotkeys, WW/WL presets, layout defaults, tool visibility, overlay fields, reset.
   - API loi khong duoc lam viewer blank.

4. Tool commands:
   - Wire web-feasible tools qua `commandsModule.ts`/`commandBridge`.
   - Add try/catch, toast feedback, audit.
   - FreeRotate chi ready neu transform/persistence an toan; neu khong, giu deferred reason ro.

5. Capture/gallery:
   - Them capture/crop/fullview flow.
   - Luu thumbnail/preview cho snapshot/key image.
   - Note/category/edit/delete artifact.
   - Gallery multi-select.
   - Send selected artifacts to report workspace.

6. Action history:
   - Tao API `GET /api/viewer/studies/[uid]/action-history`.
   - Tao `MiniPacsActionHistoryPanel`.
   - Scrub metadata, paging/filter neu can.

7. Download manager/anonymize:
   - Them `ViewerDownloadJob`.
   - Tao APIs create/list/status/file/cancel.
   - Tao `MiniPacsDownloadManager`.
   - Implement selected artifacts ZIP toi thieu.
   - Anonymize export/download khong sua data goc va khong lo PHI trong filename/log.

8. Series/history/overlay:
   - Series menu: convert to key images, download/export job, guarded delete request/dry-run.
   - History panel: open current/prior compare layout.
   - DICOM overlay tag toggle rieng voi Tag Browser.

9. QA:
   - Dashboard: chay `npm run lint` va `npm run build` trong `dashboard` neu kha thi.
   - OHIF: chay `yarn workspace @ohif/extension-minipacs test:unit:ci` va `yarn workspace @ohif/mode-minipacs-viewer test:unit:ci` neu kha thi.
   - Chay build OHIF relevant neu scope anh huong bundling.
   - Manual/browser test viewer: valid study khong blank, toolbar commands khong crash, gallery/report bridge/download/history compare hoat dong.
   - Neu co dev server/browser automation, chup screenshot va kiem canvas nonblank.

Rang buoc:

- Khong revert thay doi cua user.
- Khong dung command destructive nhu git reset hard.
- Khong commit PHI/DICOM that.
- Khong hard-code path production.
- Khong implement advanced MPR/3D/specialty measurements trong Phase 4; de Phase 5.
- Khong implement Non-DICOM/share public/consultation/video trong Phase 4; de phase sau.
- Khong hard-delete series/study neu chua co Phase 8 policy. Chi request/dry-run/guarded UI.
- Moi action viewer quan trong phai co audit.
- Moi API nhay cam phai co permission server-side.
- Anonymize/encode khong duoc sua patient identity goc trong DB/Orthanc/HIS.
- Neu gap blocker, ghi ro blocker, file lien quan, va workaround.

Ket qua mong muon:

- Code Phase 4 implement theo PR nho hoac batch ro rang.
- Docs/backlog/tool inventory duoc cap nhat neu scope thay doi.
- Tra loi cuoi cung gom: files changed, behavior changed, tests run, tests not run, migration notes, config/env notes, remaining risks, va danh sach tool con deferred.
```
