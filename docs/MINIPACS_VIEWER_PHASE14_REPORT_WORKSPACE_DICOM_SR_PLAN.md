# MiniPACS Viewer Phase 14 - Report Workspace, Measurement Summary & DICOM SR Readiness Plan

## Muc tieu

Phase 14 tap trung noi viewer custom `/viewer/minipacs` voi workflow bao cao chan doan that te.

Sau phase nay, bac si co the:

- Mo report lien quan tu viewer nhu hien tai, nhung co them context ro rang.
- Xem trang thai report/draft/final ngay trong viewer.
- Dua measurement dang co trong viewer vao report draft duoi dang text co cau truc.
- Dua key images/snapshots vao report workflow de bac si chon khi viet ket qua.
- Tao measurement summary an toan tu du lieu Phase 11.
- Chuan bi duong DICOM SR export/import, nhung khong fake DICOM SR neu chua map du metadata.

Phase nay khong phai la viet lai trang report. No la "report workspace bridge" giua viewer, measurement persistence va report page hien co.

## Dieu kien tien quyet

Truoc khi code Phase 14, can dam bao:

- Phase 8 report-link API hoat dong.
- Phase 9 auth/audit hardening da on.
- Phase 11 measurement persistence khong con loi duplicate/runtime nghiem trong.
- Phase 13 MPR/Crosshairs khong con bypass guard chinh.
- `/report/[studyInstanceUid]` hien co mo duoc report page.
- Prisma schema hien co co:
  - `Report`
  - `ReportAddendum`
  - `ViewerMeasurement`
  - snapshot/key image models neu da co tu Phase 8.

Neu Phase 11 measurement trong MPR chua map SOP/frame chinh xac, Phase 14 chi dua measurement stack viewport vao report summary. Khong dua measurement MPR vao report nhu du lieu chinh neu mapping chua chac.

## Vi sao can Phase 14

Tu Phase 1 den 13, viewer da gan giong workstation hon:

- Series rail.
- Viewer overlay.
- Toolbar/custom tools.
- Snapshot/key image/history/report bridge.
- Measurement persistence.
- Hanging protocol/layout presets.
- MPR/MIP workflow.

Nhung workflow doc phim that con thieu mot buoc rat quan trong: measurement va key image phai di vao bao cao. Neu bac si do kich thuoc, chup key image, danh dau anh quan trong, nhung khi sang report phai go lai thu cong thi viewer chua tiet kiem thoi gian.

Phase 14 giai quyet diem nay theo huong an toan:

- Lay measurement da persist.
- Tao summary text co the chen vao `findings`.
- Mo report page voi context.
- Ghi audit.
- Chuan bi nen cho DICOM SR nhung khong lam qua scope.

## Nguyen tac

- Khong viet report editor day du trong OHIF viewer neu report page da co.
- Khong luu fake DICOM SR.
- Khong sua report final/completed im lang. Neu report da final, chi tao addendum hoac can confirm.
- Khong auto chen measurement vao report khi user chua bam.
- Khong lam mat measurement/annotation state.
- Khong tao DB migration neu co the dung model hien co.
- Neu can schema moi, phai giai thich migration va backward compatibility.
- Auth phai dung `reports.read`, `reports.write`, `studies.read`.
- Audit fail khong duoc lam hong viewer.

## Scope

### In scope

- Report workspace panel/dialog trong viewer.
- API lay report context tong hop cho viewer.
- Measurement summary formatter.
- Action "Send measurements to report".
- Action "Open report with context".
- Key image/snapshot handoff vao report workflow.
- Report draft update neu user co quyen `reports.write`.
- Neu report final: tao addendum draft hoac hien option mo report/addendum, khong overwrite.
- Audit actions:
  - `report_workspace_opened`
  - `measurements_sent_to_report`
  - `key_images_sent_to_report`
  - `report_draft_updated_from_viewer`
  - `report_addendum_suggested_from_viewer`
  - `dicom_sr_export_requested`
  - `dicom_sr_export_deferred`
- QA report voi XR/CT measurement va report status draft/final.

### Out of scope

- Full DICOM SR authoring neu chua du metadata.
- Sign/final report truc tiep trong OHIF.
- Voice dictation.
- AI report generation.
- Multi-doctor collaborative report editing realtime.
- HL7/FHIR outbound integration.
- PDF layout redesign.
- MPR measurement persistence neu Phase 11 chua support.

## 1. Inspect Existing Report & Measurement APIs

Truoc khi code, phai inspect dung code hien co:

```text
dashboard/prisma/schema.prisma
dashboard/app/actions.ts
dashboard/app/report/[studyInstanceUid]/**
dashboard/app/api/viewer/studies/[uid]/report-link/route.ts
dashboard/app/api/viewer/studies/[uid]/measurements/route.ts
dashboard/app/api/viewer/studies/[uid]/measurements/[id]/route.ts
ohif-viewer/extensions/minipacs/src/services/viewerReportBridge.ts
ohif-viewer/extensions/minipacs/src/services/viewerMeasurementPersistenceService.ts
ohif-viewer/extensions/minipacs/src/Components/**
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
```

Can xac nhan:

- Report model co fields nao: `findings`, `conclusion`, `recommendation`, `status`, `doctorId`.
- `saveReportAction` co the reuse tu API route khong hay chi server action.
- Existing report page co template picker, print, addendum logic chua.
- Measurement JSON dang luu structure nao.
- ToolName/value field nao dung de format text.
- Key image/snapshot API tra metadata nao.
- User permissions dang check o dau.

Khong duoc assume field name. Phai grep va doi chieu code that.

## 2. Backend Report Context API

Them API moi cho viewer:

```text
GET /api/viewer/studies/[uid]/report-workspace
```

Response goi y:

```ts
type ViewerReportWorkspaceResponse = {
  studyInstanceUid: string;
  report: {
    id: string | null;
    status: 'none' | 'draft' | 'final' | 'completed' | string;
    url: string;
    canRead: boolean;
    canWrite: boolean;
    findingsPreview?: string;
    conclusionPreview?: string;
    updatedAt?: string;
    doctorName?: string;
  };
  measurements: Array<{
    measurementUID: string;
    toolName: string;
    label?: string;
    seriesInstanceUid?: string;
    sopInstanceUid?: string;
    frameNumber?: number;
    summaryText: string;
    valueText?: string;
    unit?: string;
    isSafeForReport: boolean;
    unsafeReason?: string;
  }>;
  keyImages: Array<{
    id: string;
    label?: string;
    thumbnailUrl?: string;
    seriesInstanceUid?: string;
    sopInstanceUid?: string;
  }>;
  snapshots: Array<{
    id: string;
    label?: string;
    imageUrl?: string;
    createdAt?: string;
  }>;
};
```

Permission:

- User phai login.
- `studies.read` de lay study context.
- `reports.read` de lay report preview.
- `reports.write` de tra `canWrite: true`.
- Neu user khong co `reports.read`, khong tra findings/conclusion preview.

Khong tra raw measurement JSON qua API nay neu khong can; chi tra summary an toan.

## 3. Backend Action: Send Measurements To Report

Them API:

```text
POST /api/viewer/studies/[uid]/report-workspace/measurements
```

Payload:

```ts
{
  measurementUIDs: string[];
  mode: 'append_findings' | 'replace_measurement_section';
  target: 'draft_report' | 'addendum';
}
```

Behavior:

1. Auth login.
2. Check `reports.write`.
3. Load report by `studyInstanceUid`.
4. Load selected measurements owned by study.
5. Format measurement summary text.
6. If report missing, create draft report if existing workflow allows.
7. If report status draft/unread/reading:
   - append or replace a marked section in `findings`.
8. If report final/completed:
   - do not overwrite `findings`.
   - create `ReportAddendum` draft/suggestion if model supports.
   - or return `requiresAddendum: true` with prepared text.
9. Audit action.

Section marker goi y:

```text
[VIEWER_MEASUREMENTS_START]
...
[VIEWER_MEASUREMENTS_END]
```

Nhung UI hien thi report khong nen expose marker neu khong can. Neu marker xau trong report print, dung heading human-readable:

```text
Measurements from viewer:
- Length: 12.4 mm (Series 3, Image 42)
```

Can tranh duplicate:

- Neu same measurementUID da co trong section, update line thay vi append duplicate.
- Luu metadata audit voi measurementUID list.

## 4. Measurement Summary Formatter

Tao helper backend:

```text
dashboard/lib/viewer-measurement-summary.ts
```

Nhiem vu:

- Parse `ViewerMeasurement.dataJson`.
- Tao text ngan, doc duoc.
- Chi include measurement co mapping du tin cay.
- Detect unsafe measurement:
  - thieu `measurementUID`
  - thieu toolName
  - thieu value
  - MPR/volume measurement khong map du SOP/frame neu Phase 11 chua support

Format goi y:

```text
- Length: 23.5 mm, Liver lesion, Series 4, Image 36
- Angle: 42.1 deg, Series 2
- ROI: mean 58 HU, area 1.2 cm2, Series 5
```

Can ho tro toi thieu:

- Length.
- Angle.
- Bidirectional.
- Rectangle ROI.
- Elliptical/Circle ROI.
- Arrow/label neu co text.
- Probe neu co value.

Neu khong parse duoc value:

```text
- Length measurement, Series 4, Image 36
```

Khong crash khi JSON loi.

## 5. Viewer Report Workspace UI

Them component:

```text
ohif-viewer/extensions/minipacs/src/Components/MiniPacsReportWorkspaceDialog.tsx
```

Hoac neu da co dialog framework:

- Dung `window.dispatchEvent(new CustomEvent('minipacs:open-dialog', ...))`.
- Them dialog id `report-workspace`.

UI can co:

- Report status: none/draft/final/completed.
- Nut `Open Report`.
- Nut `Send selected measurements`.
- List measurements:
  - checkbox
  - tool name
  - summary text
  - warning icon neu unsafe
- List key images/snapshots:
  - thumbnail nho neu co
  - checkbox
  - label
- Option:
  - Append to findings.
  - Replace viewer measurement section.
- Neu report final:
  - Button text: `Prepare addendum`.
  - Khong cho overwrite.

Khong dat report editor full trong dialog. Neu can edit noi dung, mo `/report/[uid]`.

## 6. Viewer Service

Them service:

```text
ohif-viewer/extensions/minipacs/src/services/viewerReportWorkspaceService.ts
```

API goi y:

```ts
class ViewerReportWorkspaceService {
  async loadWorkspace(studyInstanceUid: string): Promise<ViewerReportWorkspaceResponse>;
  async sendMeasurements(studyInstanceUid: string, measurementUIDs: string[], mode: string): Promise<Result>;
  async sendKeyImages(studyInstanceUid: string, ids: string[]): Promise<Result>;
  openReport(studyInstanceUid: string): Promise<void>;
}
```

Service phai:

- Dung `viewerApiClient` de parse loi 401/403.
- Hien toast/feedback ro.
- Khong redirect im lang sang login.
- Audit client-side chi khi action thanh cong neu backend chua audit.

## 7. Commands & Registry

Cap nhat:

```text
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
ohif-viewer/extensions/minipacs/src/commandsModule.ts
```

Them command/tool:

```text
ReportWorkspace
SendMeasurementsToReport
OpenReport
```

De xuat:

- Nut `Report` hien co tiep tuc mo report page nhanh.
- Them nut/overflow `Report Workspace` trong workflow/report group.
- Context menu measurement neu co: `Send this measurement to report`.

Khong thay doi command `Report` hien co neu no dang on; them workspace rieng de khong gay regression.

## 8. Key Image / Snapshot To Report

Neu Phase 8 da co key image/snapshot persistence:

- API workspace load danh sach key images/snapshots.
- Cho user chon anh de dua vao report.
- Backend co the:
  - Luu reference vao report metadata neu model co field metadata.
  - Hoac tao text section trong findings:

```text
Key images selected:
- Key image 1: Series 3, Image 42
- Snapshot: AP chest overview
```

Neu report page hien co da support upload image/report images:

- Reuse API upload/images neu an toan.
- Khong duplicate binary neu snapshot da co file.

Neu model chua support attachment:

- Chi append textual references trong Phase 14.
- De attachment embed vao Phase 15.

## 9. DICOM SR Readiness

Day la phan can lam can than.

Phase 14 nen them capability check va skeleton, khong full SR export neu chua du mapping.

### Inspect

Can inspect:

```text
ohif-viewer/extensions/cornerstone-dicom-sr/**
ohif-viewer/extensions/measurement-tracking/**
ohif-viewer/extensions/cornerstone/src/utils/measurementServiceMappings/**
```

Can xac dinh:

- OHIF hien co co export SR command khong.
- Measurement mapping co du:
  - StudyInstanceUID
  - SeriesInstanceUID
  - SOPInstanceUID
  - FrameOfReferenceUID
  - tool type
  - coordinates
  - units
- DICOM SR extension hien tai chu yeu read/render hay co write/export.

### Minimal safe output

Neu chua co SR export that:

- API `POST /api/viewer/studies/[uid]/dicom-sr/export` co the return:

```json
{
  "success": false,
  "status": "deferred",
  "message": "DICOM SR export requires complete SOP/frame mapping.",
  "eligibleMeasurementCount": 3,
  "ineligibleMeasurementCount": 2
}
```

- Audit `dicom_sr_export_deferred`.
- UI hien "DICOM SR export not ready" ro rang.

Neu co du support:

- Tao file DICOM SR bang library co san trong repo (dcmjs neu da co).
- Khong tu tao binary bang string manipulation.
- Luu file vao storage an toan.
- Optionally POST vao Orthanc neu config co.
- Audit `dicom_sr_exported`.

Khong duoc tao file `.dcm` gia voi metadata thieu.

## 10. Permissions & Security

API moi:

- `GET report-workspace`: login + `studies.read`; report preview can `reports.read`.
- `POST measurements`: login + `reports.write`.
- `POST key-images`: login + `reports.write`.
- `POST dicom-sr/export`: login + `reports.write` hoac role admin/doctor theo policy.

Validation:

- `uid` phai non-empty string, length hop ly.
- `measurementUIDs` max count, vi du 100.
- Khong cho update report cua study khac.
- Khong cho user khong co quyen doc report xem findings preview.
- Metadata JSON size limit.

Audit:

- User id.
- StudyInstanceUID.
- MeasurementUID count, khong log raw PHI thua.
- Report id neu co.

## 11. Report Status Rules

Can xu ly status ro:

- `none`: co the tao draft neu workflow cho phep.
- `UNREAD`/`DRAFT`/`DRAFTING`: append/replace findings section.
- `FINAL`/`COMPLETED`: khong overwrite.
- Unknown status: fallback safe, yeu cau mo report page.

Neu tao report moi:

- Dung logic/status mapping hien co trong `saveReportAction` hoac service tuong duong.
- Khong tao duplicate report neu unique `studyInstanceUid`.

Neu final report:

- Neu `ReportAddendum` model ho tro, tao addendum suggestion.
- Neu khong, return prepared text de user copy/open report.

## 12. UI Copy & Localization

Viewer UI dang tieng Viet/English tron lan. Phase 14 nen dung tieng Viet ngan gon:

- `Bao cao`
- `Mo bao cao`
- `Gui do dac vao bao cao`
- `Chon measurement`
- `Bao cao da final. Tao phu luc/addendum thay vi ghi de.`
- `Ban khong co quyen sua bao cao.`

Khong hien huong dan dai trong viewer.

## 13. Files Du Kien Sua

Co the can tao/sua:

```text
dashboard/app/api/viewer/studies/[uid]/report-workspace/route.ts
dashboard/app/api/viewer/studies/[uid]/report-workspace/measurements/route.ts
dashboard/app/api/viewer/studies/[uid]/report-workspace/key-images/route.ts
dashboard/app/api/viewer/studies/[uid]/dicom-sr/export/route.ts
dashboard/lib/viewer-measurement-summary.ts
dashboard/lib/api-auth.ts
ohif-viewer/extensions/minipacs/src/services/viewerReportWorkspaceService.ts
ohif-viewer/extensions/minipacs/src/Components/MiniPacsReportWorkspaceDialog.tsx
ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
docs/MINIPACS_VIEWER_PHASE14_QA_REPORT.md
```

Chi sua Prisma schema neu that su can attachment/report section metadata moi.

## 14. Testing & QA

Tao:

```text
docs/MINIPACS_VIEWER_PHASE14_QA_REPORT.md
```

### Build

- `cd dashboard && npm run build`
- `cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs`
- `cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer`

### API tests

- Login doctor co `reports.write`.
- GET report workspace co report draft.
- GET report workspace voi user khong co `reports.read` khong tra preview.
- POST measurements voi report draft append dung.
- POST measurements duplicate khong nhan doi section.
- POST measurements voi report final khong overwrite.
- 401/403 tra message ro.

### Viewer tests

- Mo viewer ca XR/CT co measurement.
- Mo Report Workspace.
- Chon 1-2 measurements.
- Gui vao report.
- Bam Open Report, kiem tra findings co summary.
- Key image/snapshot list load duoc neu co data.
- Loi API hien toast, viewer khong crash.

### Measurement formatting

- Length co unit.
- Angle co degree.
- ROI co area/mean neu data co.
- JSON loi/unknown tool khong crash.
- Measurement MPR unsafe khong duoc auto chen neu mapping chua chac.

### DICOM SR readiness

- Bam export DICOM SR khi chua du support -> message deferred ro.
- Neu implement export that, file DICOM SR phai mo/parse duoc bang tool/library phu hop.
- Khong tao `.dcm` gia.

### Regression

- Phase 8 Report button van mo link.
- Phase 11 measurement persistence van save/reload.
- Phase 12 layout preset khong bi anh huong.
- Phase 13 MPR/Crosshairs khong bi broken.

## 15. Acceptance Criteria

Phase 14 chi xong khi:

- Report Workspace mo duoc trong viewer.
- Measurement summary tao dung tu ViewerMeasurement.
- Gui selected measurements vao draft report duoc.
- Final report khong bi overwrite.
- Permission 401/403 dung.
- Audit actions duoc ghi.
- DICOM SR export neu chua support phai deferred trung thuc, khong fake.
- Build dashboard, extension, mode pass.
- QA report noi ro test nao real runtime, test nao static.

## 16. Cac Loi Can Tranh

- Khong append duplicate measurement moi lan bam.
- Khong sua report final/completed im lang.
- Khong expose report preview cho user thieu `reports.read`.
- Khong persist/report measurement MPR neu SOP/frame mapping chua chac.
- Khong tao DICOM SR binary tu JSON/string thu cong.
- Khong lam Report button hien co bi doi behavior bat ngo.
- Khong de API report-workspace tra raw PHI/metadata khong can thiet.
- Khong ghi QA "fully verified" neu chua test voi ca that.

## 17. Prompt Cho AI Code Phase 14

Dung prompt nay de giao cho AI khac:

```text
Hay thuc hien Phase 14 theo file:
docs/MINIPACS_VIEWER_PHASE14_REPORT_WORKSPACE_DICOM_SR_PLAN.md

Muc tieu:
- Them Report Workspace trong /viewer/minipacs.
- Lay report context, measurement summary, key images/snapshots.
- Cho bac si gui selected measurements vao report draft.
- Khong overwrite report final/completed; neu final thi tao addendum/suggestion hoac return requiresAddendum.
- Chuan bi DICOM SR export readiness, khong tao fake DICOM SR neu mapping chua du.

Bat buoc truoc khi code:
1. Inspect dung code hien co:
   - dashboard/prisma/schema.prisma
   - dashboard/app/actions.ts
   - dashboard/app/report/[studyInstanceUid]/**
   - dashboard/app/api/viewer/studies/[uid]/report-link/route.ts
   - dashboard/app/api/viewer/studies/[uid]/measurements/**
   - ohif-viewer/extensions/minipacs/src/services/viewerReportBridge.ts
   - ohif-viewer/extensions/minipacs/src/services/viewerMeasurementPersistenceService.ts
2. Khong assume field name.
3. Khong sua report final truc tiep.
4. Khong fake DICOM SR.

Implement goi y:
- Backend:
  - GET /api/viewer/studies/[uid]/report-workspace
  - POST /api/viewer/studies/[uid]/report-workspace/measurements
  - optional POST /api/viewer/studies/[uid]/report-workspace/key-images
  - optional POST /api/viewer/studies/[uid]/dicom-sr/export neu chi deferred/skeleton
  - dashboard/lib/viewer-measurement-summary.ts
- Viewer:
  - viewerReportWorkspaceService.ts
  - MiniPacsReportWorkspaceDialog.tsx
  - command/tool registry entry ReportWorkspace
  - command bridge/open dialog wiring
- QA:
  - docs/MINIPACS_VIEWER_PHASE14_QA_REPORT.md

Yeu cau behavior:
- User co reports.write moi duoc gui measurement vao report.
- Draft report append/replace measurement section.
- Final/completed report khong overwrite.
- Duplicate measurement khong bi append lap lai.
- API loi phai hien toast, viewer khong crash.
- Measurement MPR/volume neu unsafe thi khong auto dua vao report.
- DICOM SR neu chua du mapping thi return deferred va audit dicom_sr_export_deferred.

Build:
- cd dashboard && npm run build
- cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
- cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer

Khong duoc:
- Reset DB.
- Sua unrelated UI lon.
- Ghi QA pass runtime neu chua test ca that.
```

