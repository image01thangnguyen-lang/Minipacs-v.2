# MiniPACS Viewer Phase 12 - Hanging Protocol & Layout Presets Plan

## Muc tieu

Phase 12 tap trung vao viec sap xep viewport/series thong minh hon khi mo viewer custom `/viewer/minipacs`.

Sau phase nay, viewer phai co kha nang:

- Tu chon layout phu hop theo modality/study.
- Tu dua series vao cac viewport theo rule on dinh.
- Nho layout/preset nguoi dung chon.
- Cho phep bac si doi layout/preset nhanh ma khong lam mat anh dang xem.
- Khong lam hoi quy series rail, overlay, toolbars, snapshot/key image/history/report, measurement persistence.

Phase nay khong lam MPR/MIP nang cao. Neu can MPR/MIP thi de Phase sau.

## Dieu kien tien quyet

Truoc khi code Phase 12, can dam bao:

- Phase 9 auth/API hardening da on.
- Phase 10 route custom `/viewer/minipacs` va build da pass.
- Phase 11 measurement persistence khong con loi runtime nghiem trong.
- Neu Phase 11 van con loi `value Float`/duplicate measurement, phai sua truoc hoac ghi ro khong dung Phase 11 lam baseline QA.

## Vi sao can Phase 12

Hien viewer da co series rail va layout controls, nhung bac si van phai tu sap xep series moi lan mo ca. PACS workstation that thuong co hanging protocol de:

- XR/CR/DX mo nhanh 1 anh lon.
- CT nhieu series tu chia layout 2x2 hoac 1x2.
- MR nhieu sequence co thu tu on dinh.
- US multi-frame uu tien cine/stack.
- Bac si co the luu preset rieng theo workflow.

Day la buoc giup viewer custom tien gan workstation that hon ma khong can them engine anh moi.

## Nguyen tac

- Uu tien dung OHIF `hangingProtocolService`, `displaySetService`, `viewportGridService`, `toolbarService` va commands co san.
- Khong viet lai OHIF viewport engine.
- Khong hard-code theo mot StudyInstanceUID cu the.
- Sap xep series phai deterministic: cung data thi cung layout.
- Neu khong du metadata, fallback an toan ve 1x1.
- Khong lam mat viewport state khi user doi layout neu OHIF co command ho tro giu state.
- Khong reset measurements/annotations khi doi layout.
- Khong reset DB/volume.

## Scope

### In scope

- Hanging protocol rules cho XR/CR/DX, CT, MR, US.
- Series sorting/selection rules.
- Layout preset mac dinh theo modality.
- User layout preset persistence.
- Last-used layout per user/modality.
- UI nho de chon preset/layout.
- Audit action layout/preset.
- QA report voi ca that.

### Out of scope

- MPR/MIP volume reconstruction.
- AI series classification.
- DICOM Hanging Protocol IOD day du.
- Multi-monitor workstation.
- Cross-study comparison auto fetch.
- Advanced mammography hanging protocol.

## 1. Inspect Existing OHIF Layout/Hanging APIs

Truoc khi code, can inspect dung API that trong codebase:

- `hangingProtocolService`
- `displaySetService`
- `viewportGridService`
- `commandsManager`
- `toolbarService.recordInteraction`
- `setViewportGridLayout`
- `setDisplaySetsForViewport`
- `toggleOneUp`
- series rail implementation Phase 4

Can tim:

- Noi nao displaySets duoc load xong.
- Cach lay danh sach displaySets cua study.
- Cach gan displaySet vao viewport cu the.
- Cach doi layout ma giu viewport state.
- Co event nao bao "display sets ready" khong.
- Hanging protocol hien tai cua mode custom dang dung gi.

Khong duoc assume command name. Phai grep va doi chieu code OHIF hien tai.

## 2. Hanging Protocol Rule Engine

Tao service moi:

```text
ohif-viewer/extensions/minipacs/src/services/viewerHangingProtocolService.ts
```

Nhiem vu:

- Nhan `studyInstanceUid`, `displaySets`, current context.
- Xac dinh modality chinh.
- Chon layout rows/cols.
- Chon displaySet cho tung viewport slot.
- Apply vao OHIF.
- Ghi audit/log.

API goi y:

```ts
type HangingProtocolSuggestion = {
  protocolId: string;
  label: string;
  reason: string;
  layout: { rows: number; cols: number };
  assignments: Array<{
    viewportIndex: number;
    displaySetInstanceUID: string;
    seriesInstanceUid?: string;
    reason?: string;
  }>;
};

class ViewerHangingProtocolService {
  initialize(servicesManager: any): void;
  suggestForStudy(studyInstanceUid: string): HangingProtocolSuggestion | null;
  applySuggestion(suggestion: HangingProtocolSuggestion): Promise<boolean>;
  applyPreset(presetId: string, studyInstanceUid: string): Promise<boolean>;
}
```

Neu OHIF HangingProtocolService da co co che custom protocol phu hop, dung no. Neu khong, service nay co the wrap commands/layout services nhung phai gon va tach rieng.

## 3. Series Metadata Normalization

Tao adapter:

```text
ohif-viewer/extensions/minipacs/src/services/seriesClassificationAdapter.ts
```

Can normalize cac truong:

- `displaySetInstanceUID`
- `SeriesInstanceUID`
- `SeriesNumber`
- `SeriesDescription`
- `Modality`
- `BodyPartExamined`
- `ImageType`
- `ProtocolName`
- `numImageFrames`
- `isMultiFrame`
- `isReconstructable`
- `instances.length`
- `firstInstanceNumber`
- `AcquisitionTime`/`SeriesTime` neu co

Ham goi y:

```ts
normalizeDisplaySet(displaySet): NormalizedSeries
classifySeries(series): SeriesClass
sortSeriesForModality(seriesList, modality): NormalizedSeries[]
```

SeriesClass goi y:

- `xr_primary`
- `ct_axial`
- `ct_sagittal`
- `ct_coronal`
- `ct_localizer`
- `ct_thin_slice`
- `mr_t1`
- `mr_t2`
- `mr_flair`
- `mr_dwi`
- `us_cine`
- `us_still`
- `unknown`

## 4. Default Hanging Rules

### XR / CR / DX

Rule:

- Layout: 1x1.
- Chon series co image count lon nhat hoac SeriesNumber nho nhat.
- Neu co nhieu projection, giu series rail de user doi.

Fallback:

- Neu co 2 series/projection quan trong, co the suggest 1x2 nhung khong auto neu metadata khong ro.

### CT

Rule mac dinh:

- Neu co 1 series: 1x1.
- Neu co 2 series: 1x2.
- Neu co 3-4 series: 2x2.
- Neu nhan dien duoc axial/sagittal/coronal:
  - slot 0: axial
  - slot 1: coronal
  - slot 2: sagittal
  - slot 3: series con lai hoac thin slice
- Bo qua localizer/scout neu co series chinh khac.

Keywords:

- axial: `AX`, `AXIAL`, `TRA`, `TRANSVERSE`
- coronal: `COR`, `CORONAL`
- sagittal: `SAG`, `SAGITTAL`
- localizer: `LOCALIZER`, `SCOUT`, `TOPO`, `SURVIEW`

Fallback:

- Sort by SeriesNumber asc, image count desc, then SeriesDescription.

### MR

Rule mac dinh:

- 2x2 neu co tu 3 series tro len.
- Uu tien T1/T2/FLAIR/DWI neu detect duoc.
- Neu khong detect, sort by SeriesNumber.

Keywords:

- T1: `T1`
- T2: `T2`
- FLAIR: `FLAIR`
- DWI: `DWI`, `DIFF`, `ADC`
- contrast: `POST`, `CE`, `C+`, `GAD`

### US

Rule mac dinh:

- 1x1 neu chi co 1 cine/stack.
- 1x2 neu co cine + still/key images.
- 2x2 neu co nhieu series va man hinh du lon.
- Uu tien multi-frame/cine series truoc.

Fallback:

- Sort multi-frame desc, SeriesNumber asc.

### Unknown / Mixed

Rule:

- 1x1.
- First displaySet theo sort stable.
- Khong auto 2x2 neu metadata khong chac.

## 5. User Layout Presets

Them kha nang luu preset nguoi dung. Co hai lua chon:

### Option A - LocalStorage first

Nhanh, it backend:

- Luu last-used layout/preset theo user browser.
- Khong sync giua may tram.
- Phu hop neu muon scope nho.

Key goi y:

```text
minipacs.viewer.layoutPresets.v1
minipacs.viewer.lastLayoutByModality.v1
```

### Option B - Backend persistence

Dung cho workstation that:

Them Prisma model:

```prisma
model ViewerLayoutPreset {
  id              String   @id @default(uuid())
  userId          String?
  name            String
  modality        String?
  bodyPart        String?
  protocolJson    String   @db.Text
  isDefault       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([modality])
  @@map("viewer_layout_presets")
}
```

API:

```text
GET    /api/viewer/layout-presets
POST   /api/viewer/layout-presets
PATCH  /api/viewer/layout-presets/[id]
DELETE /api/viewer/layout-presets/[id]
```

Auth:

- Require login.
- Read/write own preset.
- Admin co the manage global preset neu can, nhung khong bat buoc Phase 12.

Khuyen nghi:

- Neu thoi gian ngan: dung Option A cho Phase 12, de backend preset Phase 13/14.
- Neu muon workstation dung that nhieu may: dung Option B.

## 6. UI Changes

Khong lam UI lon. Them controls gon:

- Preset dropdown trong header hoac mini toolbar:
  - `Auto`
  - `XR 1x1`
  - `CT 2x2`
  - `MR 2x2`
  - `US Cine`
  - `Last Used`
- Button nho:
  - `Save Layout`
  - `Reset Auto`

Yeu cau UI:

- Khong che viewport.
- Khong dung hero/card marketing.
- Icon/button gon theo design hien tai.
- Neu preset apply fail, toast can noi ro.
- Khong can modal phuc tap neu chua can.

## 7. Apply Layout Safely

Flow apply:

1. Tinh suggestion.
2. Snapshot current active viewport id.
3. Doi grid layout.
4. Gan displaySets vao viewport slots.
5. Restore active viewport neu co the.
6. Trigger render/resize.
7. Audit `layout_preset_applied`.

Can tranh:

- Xoa measurement annotations.
- Lam mat selected series trong rail.
- Gan cung displaySet vao nhieu viewport ngoai y muon.
- Doi layout khi displaySets chua ready.

Neu displaySets chua ready:

- Retry nhe 3-5 lan.
- Hoac wait event.
- Neu van fail, fallback 1x1 va toast/log.

## 8. Interaction With Series Rail

Series rail Phase 4 phai tiep tuc:

- Hien active series theo viewport active.
- Click series sau khi auto layout van doi dung viewport active.
- Khi user click series, khong auto overwrite ngay.
- Neu user bam `Auto Layout` moi apply lai rule.

Can co flag:

```ts
userHasManualLayoutOverride
```

Khi user tu doi layout/click series:

- Dat override true.
- Khong auto reapply khi minor event load them displaySet, tru khi user chon Auto.

## 9. Audit Actions

Them audit:

- `hanging_protocol_suggested`
- `hanging_protocol_applied`
- `layout_preset_saved`
- `layout_preset_applied`
- `layout_preset_reset`
- `series_auto_assigned`

Payload:

- studyInstanceUid
- modality
- protocolId
- layout rows/cols
- assignments displaySetInstanceUIDs
- user override true/false

Audit fail khong crash viewer.

## 10. Backend/API Optional

Neu chon backend presets, can tao:

```text
dashboard/app/api/viewer/layout-presets/route.ts
dashboard/app/api/viewer/layout-presets/[id]/route.ts
```

Validation:

- `name` max 80 chars.
- `modality` max 16 chars.
- `bodyPart` max 64 chars.
- `protocolJson` max 100KB.
- Khong cho user sua preset cua user khac.

Neu chon localStorage, khong can backend API trong Phase 12.

## 11. QA Checklist

Tao report:

```text
docs/MINIPACS_VIEWER_PHASE12_QA_REPORT.md
```

### XR

- Mo ca XR.
- Auto layout phai la 1x1.
- Series chinh hien ngay.
- Doi 1x2 manual.
- Bam Auto reset ve 1x1.

### CT

- Mo ca CT nhieu series.
- Auto suggest 2x2 neu co >= 3 series.
- Neu co axial/coronal/sagittal, gan vao slot dung.
- Localizer/scout khong chiem slot chinh neu co series khac.
- Series rail click van doi viewport active.
- Doi layout manual khong bi auto overwrite.

### MR

- Mo ca MR neu co.
- Auto 2x2 voi T1/T2/FLAIR/DWI neu detect duoc.
- Neu khong co MR data, ghi "not tested - no data".

### US

- Mo ca US/multi-frame neu co.
- Cine/multi-frame duoc uu tien.
- Layout khong lam cine toolbar/stack HUD che viewport.

### Preset

- Chon preset dropdown.
- Save layout.
- Reload viewer.
- Last used/preset duoc restore neu scope co lam.
- Reset Auto hoat dong.

### Regression

- Snapshot save van hoat dong.
- Key Image van hoat dong.
- History/Report van hoat dong.
- Measurement/annotation tu Phase 11 khong bi mat khi doi layout.
- Fullscreen/Restore van hoat dong.
- Sync viewport khong crash.

## 12. Build Bat Buoc

Chay:

```bash
cd dashboard && npm run build
cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer
```

Neu co Prisma schema/API backend preset:

```bash
cd dashboard && npx prisma generate
```

Khong bo qua build fail.

## 13. Deliverables

Phase 12 can giao:

- Hanging protocol service/rule engine.
- Series classification adapter.
- Default modality rules.
- Preset storage localStorage hoac backend.
- UI dropdown/button nho de apply preset.
- Audit actions.
- QA report:
  - `docs/MINIPACS_VIEWER_PHASE12_QA_REPORT.md`
- Build results.

## 14. Acceptance Criteria

Phase 12 coi la xong khi:

- XR auto 1x1 dung.
- CT nhieu series auto 2x2 hoac 1x2 dung theo data.
- User doi layout manual khong bi auto overwrite bat ngo.
- Series rail van click doi viewport active dung.
- Preset `Auto` apply lai duoc.
- Last layout/preset restore duoc neu scope co lam.
- Measurement/annotation khong mat khi doi layout.
- Build pass dashboard, extension va mode.
- QA report co StudyInstanceUID that neu da test runtime.

## Risk Can Chu Y

- OHIF command gan displaySet vao viewport co the khac version, phai inspect truoc.
- Auto layout qua som khi displaySets chua ready se khong gan duoc series.
- CT/MR metadata description khong dong nhat, keyword rule can fallback.
- Doi layout co the lam mat active viewport/measurement display neu dung command sai.
- Preset backend co the phinh scope migration; localStorage co the la buoc dau an toan hon.

## Prompt Cho AI Code Phase 12

```text
Hay thuc hien Phase 12: Hanging Protocol & Layout Presets theo file:
docs/MINIPACS_VIEWER_PHASE12_HANGING_PROTOCOL_LAYOUT_PRESETS_PLAN.md

Muc tieu:
- Tu sap xep layout/series cho viewer custom /viewer/minipacs theo modality.
- Them preset/layout controls gon.
- Khong them MPR/MIP.
- Khong refactor lan rong.

Viec can lam:
1. Doc ky Phase 12 plan.
2. Inspect OHIF APIs that trong repo:
   - hangingProtocolService
   - displaySetService
   - viewportGridService
   - commandsManager
   - toolbarService.recordInteraction
   - command setViewportGridLayout va gan displaySet vao viewport
3. Tao series classification adapter:
   - normalize displaySet metadata
   - classify XR/CT/MR/US series
   - sort deterministic
4. Tao viewer hanging protocol service:
   - suggest layout theo modality
   - apply layout safely
   - retry/wait neu displaySets chua ready
5. Them default rules:
   - XR/CR/DX: 1x1
   - CT: 1x1/1x2/2x2, uu tien axial/coronal/sagittal, bo localizer
   - MR: 2x2 neu nhieu sequence, uu tien T1/T2/FLAIR/DWI
   - US: uu tien cine/multi-frame
6. Them UI preset gon:
   - Auto
   - modality presets
   - Save Layout neu scope cho phep
   - Reset Auto
7. Chon persistence:
   - uu tien localStorage neu muon scope nho
   - backend preset chi lam neu chac migration/deploy an toan
8. Dam bao series rail van doi viewport active dung sau khi auto layout.
9. Dam bao manual override khong bi auto overwrite bat ngo.
10. Them audit actions:
    - hanging_protocol_suggested
    - hanging_protocol_applied
    - layout_preset_saved
    - layout_preset_applied
11. Test runtime voi XR va CT neu co data:
    - mo viewer
    - auto layout
    - doi manual
    - reset auto
    - click series rail
12. Regression:
    - snapshot
    - key image
    - history/report
    - measurement/annotation Phase 11
    - fullscreen/sync
13. Chay build:
    - cd dashboard && npm run build
    - cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
    - cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer
14. Tao docs/MINIPACS_VIEWER_PHASE12_QA_REPORT.md ghi:
    - file da sua
    - StudyInstanceUID da test
    - modality/layout expected vs actual
    - series assignments
    - bug da sua
    - limitation con lai
    - build results

Rang buoc:
- Khong reset DB.
- Khong xoa Docker volume.
- Khong chay destructive command.
- Khong them MPR/MIP trong phase nay.
- Khong fake pass neu chi static review.
- Neu OHIF API khong cho gan displaySet an toan, dung lai va ghi limitation vao QA report.
```
