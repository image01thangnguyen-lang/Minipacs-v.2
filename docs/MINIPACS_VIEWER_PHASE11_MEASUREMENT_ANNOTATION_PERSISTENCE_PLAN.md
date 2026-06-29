# MiniPACS Viewer Phase 11 - Measurement & Annotation Persistence Plan

## Muc tieu

Phase 11 tap trung vao viec luu va khoi phuc measurement/annotation trong viewer custom. Sau phase nay, bac si co the ve line/angle/ROI/shape/note tren anh, reload viewer hoac mo lai ca chup ma cac annotation van con dung study, dung series, dung image/frame.

Phase nay khong lam them tool moi phuc tap. Uu tien dung nhung tool OHIF/Cornerstone da co, bat su kien thay doi, persist vao backend, va hydrate lai khi mo viewer.

## Vi sao can Phase 11

Viewer hien tai da co:

- Route custom `/viewer/minipacs`.
- Series rail, overlay, toolbar, workflow controls.
- Snapshot/key image/history/report backend.
- Auth/API hardening.
- QA checklist.

Nhung workflow doc phim that chua du neu measurement bi mat sau reload. Measurement/annotation la du lieu lam viec quan trong cua bac si, can ton tai doc lap voi session browser.

## Nguyen tac

- Khong viet lai rendering/measurement engine.
- Uu tien dung OHIF MeasurementService va Cornerstone annotation state hien co.
- Khong luu fake measurement.
- Khong gan annotation vao sai series/image/frame.
- Khong lam viewer crash neu backend loi.
- Audit failure khong duoc lam hong workflow.
- Khong export DICOM SR trong phase nay, tru khi OHIF da co module san va viec tich hop rat nho.
- Khong reset DB/volume.

## Scope

### In scope

- Luu measurement/annotation vao DB.
- Doc lai measurement/annotation theo `StudyInstanceUID`.
- Hydrate annotation khi mo lai viewer.
- Update annotation khi user move/edit.
- Soft delete annotation khi user xoa.
- Audit cac action chinh.
- Auth/permission cho API measurement.
- QA voi XR va CT, them US/multi-frame neu co data.

### Out of scope

- DICOM SR export/import day du.
- AI measurement.
- Collaborative realtime multi-user editing.
- Version history chi tiet tung diem keo.
- Complex hanging protocol.
- Report auto insert measurement table, tru khi chi them link/placeholder nho.

## Tool can uu tien ho tro

Kiem tra tool registry hien tai va OHIF commands truoc khi code. Phase 11 toi thieu can persist cac loai sau neu project da map san:

- Length.
- Angle.
- Rectangle ROI.
- Elliptical/Circle ROI.
- Bidirectional neu co.
- Arrow/Label/Probe neu co.
- Freehand ROI neu co.
- Cobb Angle neu co.

Neu tool nao chua map trong viewer thi khong them tool moi lon trong Phase 11. Chi ghi vao report la "not available yet".

## 1. Inventory OHIF Measurement/Annotation APIs

Truoc khi code, can doc code OHIF extension/mode de xac dinh dung service/event:

- `ohif-viewer/extensions/minipacs/src/**`
- OHIF measurement service usage trong repo:
  - `measurementService`
  - `annotationManager`
  - `cornerstoneTools`
  - `ToolGroupService`
  - `displaySetService`
  - `viewportGridService`

Can tim:

- Event khi measurement duoc add.
- Event khi measurement update.
- Event khi measurement remove.
- Cach lay current measurement list theo study.
- Cach hydrate measurement/annotation tu raw data.
- Truong id nao on dinh:
  - `measurement.uid`
  - `annotationUID`
  - `trackingIdentifier`
  - `SOPInstanceUID`
  - `FrameOfReferenceUID`
  - `SeriesInstanceUID`
  - `displaySetInstanceUID`

Khong duoc assume event name. Neu OHIF version hien tai khac, phai dung API that trong codebase.

## 2. Database Model

Them Prisma model moi trong `dashboard/prisma/schema.prisma`.

Ten model goi y:

```prisma
model ViewerMeasurement {
  id                    String   @id @default(uuid())
  studyInstanceUid      String
  seriesInstanceUid     String?
  sopInstanceUid        String?
  frameNumber           Int?
  displaySetInstanceUID String?
  viewportId            String?

  toolName              String
  measurementType       String?
  annotationUID         String?
  measurementUID        String?
  label                 String?
  value                 Float?
  unit                  String?

  dataJson              String   @db.Text
  isDeleted             Boolean  @default(false)
  createdByUserId       String?
  updatedByUserId       String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  @@index([studyInstanceUid])
  @@index([seriesInstanceUid])
  @@index([sopInstanceUid])
  @@index([toolName])
  @@index([createdAt])
  @@map("viewer_measurements")
}
```

Neu muon tranh duplicate khi sync:

- Co the them unique composite tren `studyInstanceUid + annotationUID` neu `annotationUID` on dinh.
- Neu `annotationUID` khong on dinh qua reload thi khong dat unique cung luc dau.

Tao Prisma migration neu project dang theo migration. Neu moi truong production dang dung `db push`, phai ghi ro cach deploy an toan trong report.

## 3. Backend API

Them cac endpoint:

```text
GET    /api/viewer/studies/[uid]/measurements
POST   /api/viewer/studies/[uid]/measurements
PATCH  /api/viewer/studies/[uid]/measurements/[id]
DELETE /api/viewer/studies/[uid]/measurements/[id]
POST   /api/viewer/studies/[uid]/measurements/bulk-sync
```

Neu muon giam scope, `PATCH` va `DELETE` co the thay bang `POST bulk-sync` trong version dau. Tuy nhien endpoint delete rieng se de QA hon.

### Auth

Dung helper Phase 9:

- GET can `studies.read`.
- POST/PATCH/DELETE can `studies.read` toi thieu.
- Neu tao permission moi `viewer.write`, phai cap nhat permissions UI/role. Neu khong, dung `studies.read` de tranh scope phinh ra.

### GET response

Tra ve cac measurement chua deleted:

```json
[
  {
    "id": "...",
    "studyInstanceUid": "...",
    "seriesInstanceUid": "...",
    "sopInstanceUid": "...",
    "frameNumber": 1,
    "displaySetInstanceUID": "...",
    "toolName": "Length",
    "annotationUID": "...",
    "measurementUID": "...",
    "label": "...",
    "value": 12.3,
    "unit": "mm",
    "data": {}
  }
]
```

`dataJson` nen parse thanh `data` khi response. Neu parse loi, bo qua record loi va log server-side.

### POST body

```json
{
  "studyInstanceUid": "...",
  "seriesInstanceUid": "...",
  "sopInstanceUid": "...",
  "frameNumber": 1,
  "displaySetInstanceUID": "...",
  "viewportId": "default",
  "toolName": "Length",
  "measurementType": "distance",
  "annotationUID": "...",
  "measurementUID": "...",
  "label": "Lesion 1",
  "value": 12.3,
  "unit": "mm",
  "data": {}
}
```

Route `[uid]` la source of truth. Neu body co `studyInstanceUid` khac `params.uid`, return `400`.

### Validation

Can validate:

- `toolName` la string khong rong, max 80 chars.
- `studyInstanceUid` match route.
- `seriesInstanceUid`, `sopInstanceUid`, `displaySetInstanceUID`, `annotationUID`, `measurementUID` max 256 chars.
- `label` max 500 chars.
- `value` number finite hoac null.
- `frameNumber` integer finite hoac null.
- `data` object JSON serializable.
- `dataJson` max size, goi y 200KB/measurement.

Neu payload sai:

- Return `400`.
- Body co `{ success: false, message: "..." }`.

## 4. Frontend Persistence Service

Tao service moi:

```text
ohif-viewer/extensions/minipacs/src/services/viewerMeasurementPersistenceService.ts
```

Nhiem vu:

- Load measurements tu backend khi study open.
- Hydrate vao OHIF/Cornerstone.
- Subscribe measurement add/update/remove.
- Debounce save update.
- Queue retry nhe neu API fail.
- Khong spam toast khi autosave loi.
- Co flag `isHydrating` de tranh loop: hydrate -> event add -> save lai duplicate.

API goi y:

```ts
class ViewerMeasurementPersistenceService {
  initialize(servicesManager: any): void;
  loadForStudy(studyInstanceUid: string, servicesManager: any): Promise<void>;
  dispose(): void;
}
```

Dang ky trong layout/mode initialization noi viewer custom da co `servicesManager`.

## 5. Mapping Measurement Data

Can tao adapter tach rieng:

```text
ohif-viewer/extensions/minipacs/src/services/measurementPersistenceAdapter.ts
```

Adapter gom:

- `toPersistedMeasurement(rawMeasurement, servicesManager)`
- `fromPersistedMeasurement(record, servicesManager)`

Payload luu phai co du data de restore:

- Tool name.
- Annotation UID/measurement UID.
- Referenced image:
  - StudyInstanceUID.
  - SeriesInstanceUID.
  - SOPInstanceUID.
  - frameNumber neu multi-frame.
  - displaySetInstanceUID.
- Geometry:
  - points/handles.
  - cached stats neu co.
  - text box position neu co.
  - label/note neu co.
- View/reference:
  - FrameOfReferenceUID neu co.
  - viewport/reference image id neu OHIF can.

Khong nen chi luu text/value. Phai luu raw annotation/measurement JSON du de hydrate.

## 6. Hydration Strategy

Khi viewer load study:

1. Lay `StudyInstanceUID` tu URL hoac active viewport state.
2. Goi `GET /api/viewer/studies/[uid]/measurements`.
3. Doi den khi display sets/viewport da san sang.
4. Map records ve raw OHIF annotation.
5. Add vao measurement/annotation service.
6. Render/refresh viewport.
7. Dat flag da hydrate de khong load lap lai vo han.

Can handle:

- Record refer toi series chua load: giu pending, thu lai khi display set available.
- SOP/frame khong con trong study: skip va log warning.
- Backend 401/403: show toast nhe "Khong the tai annotation: chua dang nhap/khong co quyen".
- Backend 500: khong crash viewer.

## 7. Save/Update/Delete Strategy

### Add

Khi user ve measurement moi:

- Convert measurement sang persisted payload.
- POST API.
- Gan returned DB id vao local metadata neu co the.
- Audit `measurement_created`.

### Update

Khi user keo/doi measurement:

- Debounce 500-1000ms.
- PATCH theo DB id neu co.
- Neu chua co DB id nhung co annotationUID, POST upsert.
- Audit `measurement_updated` co the debounce hoac chi server-side ghi it hon de tranh spam.

### Delete

Khi user xoa measurement:

- DELETE API hoac PATCH `isDeleted`.
- Remove local annotation.
- Audit `measurement_deleted`.

Neu API fail:

- Khong revert UI ngay lap tuc.
- Hien toast warning ngan neu user vua bam delete/save manual.
- Autosave update fail thi chi log/indicator nhe, khong spam.

## 8. UI Feedback

Khong them UI lon. Chi can:

- Toast nhe khi load annotations fail do auth/backend.
- Optional small status trong toolbar/panel:
  - "Annotations saved"
  - "Saving..."
  - "Save failed"

Neu them indicator, phai gon, khong che viewport.

## 9. Audit

Them audit actions:

- `measurements_loaded`
- `measurement_created`
- `measurement_updated`
- `measurement_deleted`
- `measurement_restore_failed`

Payload audit nen co:

- studyInstanceUid
- seriesInstanceUid
- sopInstanceUid
- frameNumber
- toolName
- annotationUID
- measurementUID
- measurementId

Audit failure khong crash viewer.

## 10. Security & Privacy

- API measurement phai dung `requireApiPermission`.
- Khong tra measurement cua study khac.
- Khong cho body study UID override route UID.
- Gioi han payload size.
- Note/label phai trim va limit length.
- Khong log full `dataJson` ra console server neu co PHI.
- Khong expose DB port.

## 11. QA Checklist

Can tao/cap nhat report:

```text
docs/MINIPACS_VIEWER_PHASE11_QA_REPORT.md
```

Test toi thieu:

### XR

- Mo ca XR.
- Ve Length.
- Reload viewer.
- Length van hien dung anh.
- Xoa Length.
- Reload viewer.
- Length khong con.

### CT

- Mo ca CT nhieu series.
- Ve Length tren series A.
- Ve Angle/ROI tren series B.
- Doi layout 1x2 hoac 2x2.
- Reload viewer.
- Measurement van dung series/image.
- Scroll stack, measurement chi hien dung slice/frame neu OHIF ho tro.

### US/multi-frame neu co

- Ve measurement tren frame cu the.
- Scroll frame.
- Reload.
- Measurement restore dung frame hoac report limitation neu OHIF khong support.

### Auth

- Chua login goi API measurement: 401.
- Login thieu `studies.read`: 403.
- Login co quyen: GET/POST/PATCH/DELETE thanh cong.

### Failure

- Tat backend dashboard hoac mock API 500 neu co cach test.
- Viewer khong crash.
- Toast/log hop ly.

## 12. Build Bat Buoc

Chay:

```bash
cd dashboard && npm run build
cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer
```

Neu co Prisma schema change:

```bash
cd dashboard && npx prisma generate
```

Khong bo qua build fail.

## 13. Migration/Deploy

Neu them model moi:

- Tao migration neu repo dang track migrations.
- Neu production hien dang dung `db push`, ghi ro trong report cach apply schema.
- Khong doi `update.sh` sang `migrate deploy` neu chua baseline DB cu.
- Khong xoa du lieu cu.

## 14. Deliverables

Phase 11 can giao:

- Prisma model/API cho viewer measurements.
- Frontend service load/save/hydrate measurements.
- Adapter map OHIF measurement <-> persisted record.
- Auth/validation cho API.
- Audit actions.
- QA report:
  - `docs/MINIPACS_VIEWER_PHASE11_QA_REPORT.md`
- Build results.

## 15. Acceptance Criteria

Phase 11 coi la xong khi:

- Tao measurement tren viewer va reload van thay lai.
- Measurement gan dung study/series/image/frame.
- Xoa measurement va reload khong thay lai.
- Snapshot/key image/history/report khong bi regression.
- API measurement co 401/403 dung.
- Backend loi khong lam viewer man hinh den.
- Build pass dashboard, extension va mode.
- Co QA report voi StudyInstanceUID that neu da test runtime.

## Prompt Cho AI Code Phase 11

```text
Hay thuc hien Phase 11: Measurement & Annotation Persistence theo file:
docs/MINIPACS_VIEWER_PHASE11_MEASUREMENT_ANNOTATION_PERSISTENCE_PLAN.md

Muc tieu:
- Luu va khoi phuc measurement/annotation cua viewer custom /viewer/minipacs.
- Khong them feature UI lon.
- Khong viet lai engine measurement; dung OHIF/Cornerstone service hien co.

Viec can lam:
1. Doc ky Phase 11 plan.
2. Inspect OHIF measurement/annotation APIs that trong repo truoc khi code. Khong assume event name.
3. Them DB model ViewerMeasurement va migration/db schema update an toan.
4. Them API:
   - GET /api/viewer/studies/[uid]/measurements
   - POST /api/viewer/studies/[uid]/measurements
   - PATCH /api/viewer/studies/[uid]/measurements/[id] neu can
   - DELETE /api/viewer/studies/[uid]/measurements/[id] neu can
   - POST /api/viewer/studies/[uid]/measurements/bulk-sync neu dung bulk strategy
5. Dung requireApiPermission('studies.read') cho API measurement.
6. Validate payload va gioi han dataJson size.
7. Tao frontend persistence service de:
   - load measurements khi viewer open study
   - hydrate vao OHIF/Cornerstone
   - save add/update/delete measurement
   - debounce autosave
   - tranh duplicate khi hydrate
8. Them audit:
   - measurements_loaded
   - measurement_created
   - measurement_updated
   - measurement_deleted
9. Test voi it nhat XR va CT neu co data:
   - ve measurement
   - reload viewer
   - measurement restore dung anh
   - xoa measurement
   - reload khong con
10. Chay build:
    - cd dashboard && npm run build
    - cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
    - cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer
11. Tao docs/MINIPACS_VIEWER_PHASE11_QA_REPORT.md ghi:
    - file da sua
    - StudyInstanceUID da test
    - tool measurement da test
    - ket qua reload/restore/delete
    - loi con ton tai
    - build results

Rang buoc:
- Khong reset DB.
- Khong xoa Docker volume.
- Khong chay destructive command.
- Khong them DICOM SR export trong phase nay.
- Khong refactor lan rong.
- Neu OHIF API khong cho hydrate day du, dung lai va ghi ro limitation vao QA report thay vi fake pass.
```
