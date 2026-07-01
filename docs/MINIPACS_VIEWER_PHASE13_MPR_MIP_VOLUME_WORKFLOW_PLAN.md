# MiniPACS Viewer Phase 13 - MPR, MIP & Volume Workflow Plan

## Muc tieu

Phase 13 tap trung bien nut `MPR` hien co trong viewer custom `/viewer/minipacs` thanh workflow doc CT/MR volume that su dung duoc, on dinh va de hieu cho bac si.

Sau phase nay, viewer phai:

- Vao/thoat MPR on dinh voi CT/MR reconstructable series.
- Hien 3 mat phang Axial / Sagittal / Coronal dung data.
- Ho tro Crosshairs trong MPR va thong bao ro khi khong the dung.
- Ho tro MIP/3D volume viewport neu OHIF hien tai da co protocol/viewport san.
- Khong lam hong Phase 11 measurement persistence.
- Khong lam hong Phase 12 hanging protocol/layout preset khi thoat MPR.
- Co guard voi XR/US/single-frame/non-reconstructable series de khong crash.
- Ghi audit cho cac action MPR/MIP quan trong.

Day la phase workflow va hardening. Khong viet lai Cornerstone volume renderer.

## Dieu kien tien quyet

Truoc khi code Phase 13, can dam bao:

- Phase 12 da sua xong loi `getDisplaySetsForStudy` va layout race condition.
- `MPR` button trong toolbar van goi dung `toggleHangingProtocol` voi `protocolId: 'mpr'`.
- `Crosshairs` button dang tro vao toolGroup `mpr`.
- Mode `minipacs-viewer` da init `mpr` toolGroup va `volume3d` toolGroup.
- Build `@ohif/extension-minipacs` va `@ohif/mode-minipacs-viewer` pass.
- Co it nhat mot CT study reconstructable de QA thuc te.

## Vi sao can Phase 13

Phase 12 da sap xep series/layout thong minh hon, nhung CT/MR workflow that can:

- Chuyen nhanh tu stack axial sang MPR.
- Scroll/crosshair dong bo giua Axial/Sagittal/Coronal.
- Xem thick slab/MIP khi can tim ton thuong/duong di.
- Quay lai layout custom ma khong mat context.
- Biet ro series nao khong reconstructable thay vi bam nut xong bi den man hinh.

OHIF/Cornerstone da co phan lon engine nay. Phase 13 chi nen tich hop dung, guard dung, UI ro rang va QA ky.

## Nguyen tac

- Uu tien dung `toggleHangingProtocol`, `hangingProtocolService`, `cornerstoneViewportService`, `toolGroupService`, `viewportGridService`.
- Khong tao renderer volume rieng.
- Khong hard-code StudyInstanceUID.
- Khong assume API. Phai grep va doc code hien co truoc khi sua.
- Neu data khong reconstructable, hien toast/feedback va giu layout hien tai.
- Khi thoat MPR, viewer phai ve duoc workflow Phase 12 hoac layout truoc do.
- Khong auto vao MPR khi mo ca, tru khi sau nay co user setting rieng. Phase 13 nen de user bam.
- Khong reset measurement/annotation DB khi doi MPR.
- Khong them migration DB neu chi can audit API da co.

## Scope

### In scope

- MPR eligibility check cho active display set.
- MPR enter/exit command wrapper cho MiniPACS.
- Toolbar/left-sidebar action state cho MPR/Crosshairs/MIP.
- Crosshairs workflow trong MPR.
- Optional MIP/3D volume button neu protocol `mprAnd3DVolumeViewport` da hoat dong trong repo.
- Volume HUD nho: orientation, slice/index, slab/MIP mode neu lay duoc.
- Audit actions:
  - `mpr_entered`
  - `mpr_exited`
  - `mpr_rejected`
  - `crosshairs_enabled`
  - `crosshairs_disabled`
  - `mip_entered` neu co MIP/3D workflow
- QA report voi CT reconstructable, XR/non-reconstructable, thoat/vao lai viewer.

### Out of scope

- Tu viet volume loader moi.
- Tu tinh MPR/MIP bang canvas rieng.
- PET/CT fusion nang cao.
- Mammography hanging protocol.
- DICOM Hanging Protocol IOD day du.
- Multi-monitor layout.
- Server-side volume preprocessing.

## 1. Inspect API that trong repo

Truoc khi code, can doc cac file sau:

```text
ohif-viewer/extensions/cornerstone/src/getHangingProtocolModule.ts
ohif-viewer/extensions/default/src/commandsModule.ts
ohif-viewer/extensions/cornerstone/src/commandsModule.ts
ohif-viewer/modes/minipacs-viewer/src/toolbarButtons.ts
ohif-viewer/modes/minipacs-viewer/src/initToolGroups.js
ohif-viewer/modes/minipacs-viewer/src/index.js
ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
ohif-viewer/extensions/minipacs/src/services/viewerHangingProtocolService.ts
ohif-viewer/extensions/minipacs/src/services/viewportStateAdapter.ts
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
```

Can xac nhan:

- Protocol `mpr` co san khong.
- Protocol `mprAnd3DVolumeViewport` co san khong va ten command de goi la gi.
- Command `toggleHangingProtocol` dang cache/restore layout nhu the nao.
- `displaySet.isReconstructable` duoc set o dau.
- Active viewport dang chua `displaySetInstanceUIDs` nao.
- Cach lay displaySet tu active viewport.
- Crosshairs tool co guard san trong cornerstone command hay chua.
- Nut MPR/Crosshairs trong MiniPACS left sidebar co dung command context khong.

Khong duoc chi dua vao build pass. Cac service OHIF nhieu cho la runtime dynamic.

## 2. Tao MPR Workflow Service

Them service moi:

```text
ohif-viewer/extensions/minipacs/src/services/viewerMprWorkflowService.ts
```

Nhiem vu:

- Initialize services/commands.
- Lay active viewport state.
- Tim active displaySet.
- Kiem tra reconstructable.
- Goi `toggleHangingProtocol` an toan.
- Ghi audit va feedback.
- Track state dang o MPR hay stack layout.

API goi y:

```ts
type MprEligibility = {
  ok: boolean;
  reason?: string;
  displaySetInstanceUID?: string;
  modality?: string;
  seriesDescription?: string;
};

class ViewerMprWorkflowService {
  initialize(servicesManager: any, commandsManager: any): void;
  getActiveDisplaySet(): any | null;
  canEnterMpr(displaySet?: any): MprEligibility;
  enterMpr(): Promise<boolean>;
  exitMpr(): Promise<boolean>;
  toggleMpr(): Promise<boolean>;
  enterMipVolume?(): Promise<boolean>;
  setCrosshairsEnabled(enabled: boolean): Promise<boolean>;
  isInMpr(): boolean;
}
```

Neu khong can class moi, co the mo rong `commandBridge.ts`, nhung nen tach service de tranh commandBridge qua lon.

## 3. Eligibility Check

Can guard truoc khi goi MPR:

- Active viewport phai co display set.
- Display set phai co `isReconstructable === true`.
- Modality nen la `CT` hoac `MR`. Co the cho modality khac neu OHIF set reconstructable true, nhung phai QA.
- Display set khong duoc unsupported/exclude.
- Neu study dang la XR/CR/DX/US single frame, khong goi MPR.

Pseudo:

```ts
const activeViewport = viewportGridService.getState().viewports.get(activeViewportId);
const uid = activeViewport?.displaySetInstanceUIDs?.[0];
const displaySet = displaySetService
  .getActiveDisplaySets()
  .find(ds => ds.displaySetInstanceUID === uid);

if (!displaySet?.isReconstructable) {
  toast('MPR', 'Series nay khong the dung MPR.');
  audit('mpr_rejected', { reason: 'not_reconstructable', uid });
  return false;
}
```

Khong nen dua vao `SeriesDescription` de quyet dinh reconstructable. Chi dung description de message/audit.

## 4. Command Wrapper

Dang co button:

```text
commandName: toggleHangingProtocol
commandOptions: { protocolId: 'mpr' }
context: DEFAULT
```

Phase 13 nen tao command MiniPACS wrapper:

```text
toggleMiniPacsMpr
enterMiniPacsMpr
exitMiniPacsMpr
toggleMiniPacsMipVolume
toggleMiniPacsCrosshairs
```

File:

```text
ohif-viewer/extensions/minipacs/src/commandsModule.ts
```

Command `toggleMiniPacsMpr` se:

1. Check active display set.
2. Neu khong reconstructable: toast + audit + return.
3. Neu hop le: goi `commandsManager.runCommand('toggleHangingProtocol', { protocolId: 'mpr' })`.
4. Set toolbar toggled state neu can.
5. Audit `mpr_entered` hoac `mpr_exited`.

Khong goi truc tiep `viewportGridService.setLayout` cho MPR. De OHIF hanging protocol lo.

## 5. MIP / 3D Volume Option

Trong repo co protocol:

```text
ohif-viewer/extensions/cornerstone/src/getHangingProtocolModule.ts
protocol id: mprAnd3DVolumeViewport
```

Phase 13 can test xem protocol nay co available trong minipacs mode khong.

Neu hoat dong:

- Them button/dropdown item:
  - `MPR 1x3`
  - `MPR + 3D`
- `MPR 1x3` goi `toggleMiniPacsMpr`.
- `MPR + 3D` goi `toggleHangingProtocol` voi `protocolId: 'mprAnd3DVolumeViewport'` qua wrapper eligibility.

Neu protocol khong hoat dong on dinh:

- Khong hien button `MPR + 3D` mac dinh.
- De trong overflow/advanced voi status disabled.
- Ghi ro trong QA report: "MPR 1x3 supported, MPR+3D deferred".

Khong duoc fake 3D/MIP bang UI neu viewport khong render duoc.

## 6. Toolbar va Sidebar UI

Cap nhat:

```text
ohif-viewer/modes/minipacs-viewer/src/toolbarButtons.ts
ohif-viewer/modes/minipacs-viewer/src/index.js
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx
```

Yeu cau UI:

- Nut MPR tren top toolbar goi wrapper MiniPACS, khong goi raw `toggleHangingProtocol`.
- Crosshairs chi active duoc trong MPR.
- Neu bam Crosshairs ngoai MPR, hien toast nhe: "Can vao MPR truoc".
- Neu co MIP/3D, de trong dropdown hoac overflow, khong chen them qua nhieu nut len top toolbar.
- Khong dung text huong dan dai trong UI.
- Icon dung icon co san: `icon-mpr`, `tool-crosshair`, icon volume neu co.

Khong nen lam UI card moi cho phase nay.

## 7. MPR State va Restore

Can xac dinh "dang o MPR" bang source that:

- `hangingProtocolService.getState().protocolId === 'mpr'`, hoac
- active viewport id bat dau `mpr-`, hoac
- viewport type la `volume`.

Uu tien `hangingProtocolService.getState()`.

Khi vao MPR:

- Luu current stack layout/context neu OHIF chua luu du.
- Disable auto layout Phase 12 trong khi o MPR.
- Khong goi `viewerHangingProtocolService.applySuggestion`.

Khi thoat MPR:

- De OHIF `toggleHangingProtocol` restore layout.
- Neu restore fail, fallback ve layout Phase 12 gan nhat hoac 1x1 active display set.
- Crosshairs phai off.
- Toolbar state phai refresh.

Can test:

- Stack 2x2 -> MPR -> back: ve dung 2x2/series.
- CT layout preset -> MPR -> back: khong bi auto-layout ghi de bat ngo.
- MPR -> reload viewer: khong bat buoc restore MPR; mac dinh co the ve normal viewer.

## 8. Crosshairs Workflow

Crosshairs hien co trong `mpr` toolGroup. Phase 13 can lam no ro rang hon:

- Button Crosshairs chi goi `setToolActive` voi `toolName: Crosshairs`, `toolGroupId: mpr`.
- Wrapper `toggleMiniPacsCrosshairs` nen check MPR truoc.
- Khi thoat MPR, goi command co san `cleanUpCrosshairs` hoac de protocol callback goi.
- Audit:
  - `crosshairs_enabled`
  - `crosshairs_disabled`

QA:

- Crosshair line hien tren ca 3 viewport.
- Keo crosshair o axial thi sagittal/coronal update.
- Chon Window/Zoom/Pan sau Crosshairs khong de tool bi stuck.

## 9. Volume HUD / Overlay Nho

Neu overlay hien tai da lay duoc viewport data, them nhe cac thong tin sau khi viewport la volume:

- Orientation: Axial / Sagittal / Coronal.
- Slice index/total neu lay duoc.
- MPR/MIP label neu trong mode volume.
- WW/WL van dung nhu Phase 5.

File co the lien quan:

```text
ohif-viewer/modes/minipacs-viewer/src/viewportOverlayConfig.ts
ohif-viewer/extensions/minipacs/src/services/viewportStateAdapter.ts
```

Khong bat buoc neu OHIF overlay da du. Neu lam, can khong che text de khong de len anh.

## 10. Audit va Feedback

Dung API audit da co:

```text
POST /api/audit/viewer-action
```

Payload dung format Phase 9:

```ts
{
  studyInstanceUid,
  action,
  metadata
}
```

Actions:

- `mpr_entered`
- `mpr_exited`
- `mpr_rejected`
- `mip_entered`
- `mip_rejected`
- `crosshairs_enabled`
- `crosshairs_disabled`

Audit fail khong duoc lam crash viewer.

Feedback:

- Dung `commandFeedbackService` neu da co.
- Hoac `uiNotificationService.show`.
- Khong dung `alert`.

## 11. Measurement Persistence Compatibility

Phase 11 co measurement/annotation persistence. MPR la volume viewport nen mapping SOP/frame co the khac stack viewport.

Trong Phase 13:

- Khong can persist measurement tao trong MPR neu mapping chua chac.
- Neu Phase 11 service tu dong bat measurement trong MPR, can test ky.
- Neu khong map duoc SOP/frame, khong luu fake measurement.
- QA report phai ghi ro:
  - measurement stack viewport con hoat dong.
  - measurement tao trong MPR duoc ho tro hay deferred.

Neu can guard:

- Khi viewport type la volume/MPR va khong xac dinh SOPInstanceUID, co the skip persistence va log debug.
- Khong tao record DB voi `sopInstanceUid` rong neu no gay restore sai anh.

## 12. Phase 12 Hanging Protocol Compatibility

Phase 12 co `viewerHangingProtocolService` auto layout.

Phase 13 can dam bao:

- Khi user bam MPR, set manual override hoac pause auto-layout.
- Khi user bam Auto Layout sau khi thoat MPR, auto layout van chay.
- Khi MPR active, khong apply layout preset 1x1/2x2 ngam.
- Neu user bam LayoutPresets trong MPR:
  - Hoac thoat MPR truoc roi apply preset.
  - Hoac disable LayoutPresets trong MPR.

Khuyen nghi scope nho:

- Khi MPR active va user bam layout preset khac `auto`, wrapper nen goi exit MPR truoc, doi layout restore xong moi apply preset.
- Ghi ro trong QA.

## 13. Files Du Kien Sua

Co the can sua/tao:

```text
ohif-viewer/extensions/minipacs/src/services/viewerMprWorkflowService.ts
ohif-viewer/extensions/minipacs/src/commandsModule.ts
ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx
ohif-viewer/modes/minipacs-viewer/src/toolbarButtons.ts
ohif-viewer/modes/minipacs-viewer/src/index.js
ohif-viewer/modes/minipacs-viewer/src/viewportOverlayConfig.ts
docs/MINIPACS_VIEWER_PHASE13_QA_REPORT.md
```

Chi sua file nao that su can. Khong refactor lon.

## 14. QA Checklist

Can tao:

```text
docs/MINIPACS_VIEWER_PHASE13_QA_REPORT.md
```

Checklist toi thieu:

### Build

- `cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs`
- `cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer`
- Neu co sua dashboard/API: `cd dashboard && npm run build`

### CT reconstructable

- Mo CT study reconstructable.
- Bam MPR.
- Viewer hien 3 viewport Axial/Sagittal/Coronal, khong den man hinh.
- Scroll mouse wheel hoat dong trong viewport volume.
- WW/WL dong bo VOI neu protocol co sync.
- Crosshairs active va dong bo.
- Bam MPR lan nua thoat ve layout cu.
- Snapshot/download van hoat dong voi active viewport neu OHIF ho tro.

### Non-reconstructable / XR

- Mo XR/CR/DX.
- Bam MPR.
- Viewer khong crash.
- Hien toast "series khong ho tro MPR".
- Layout hien tai giu nguyen.
- Audit `mpr_rejected`.

### Phase 12 regression

- Apply `CT 2x2` preset.
- Bam MPR.
- Thoat MPR.
- Layout khong bi roi vao default OHIF viewer.
- Series rail van click/double click duoc.
- Auto Layout van dung khi bam lai.

### Phase 11 regression

- Ve Length/Angle tren stack viewport.
- Reload viewer.
- Measurement stack restore duoc.
- Neu ve measurement trong MPR, ghi ro supported/deferred.

### Crosshairs

- Bam Crosshairs ngoai MPR -> toast, khong crash.
- Bam Crosshairs trong MPR -> active.
- Chuyen sang WindowLevel/Zoom/Pan -> Crosshairs khong stuck.
- Thoat MPR -> Crosshairs off.

### MIP/3D neu lam

- Bam MPR + 3D/MIP.
- 3D viewport render nonblank.
- Rotate/zoom/pan hoat dong.
- Thoat ve stack/MPR an toan.
- Neu khong on dinh, disable va ghi deferred.

## 15. Acceptance Criteria

Phase 13 chi duoc coi la xong khi:

- Khong con crash khi bam MPR tren XR/non-reconstructable.
- CT reconstructable vao MPR thanh cong.
- Thoat MPR restore workflow MiniPACS, khong quay ve route/viewer default.
- Crosshairs dung trong MPR va bi guard ngoai MPR.
- Audit/feedback khong lam viewer crash.
- Phase 12 LayoutPresets khong conflict voi MPR.
- Phase 11 measurement stack persistence khong bi hoi quy.
- Build pass.
- QA report noi ro cai nao test tren ca that, cai nao chi static review.

## 16. Cac Loi Can Tranh

- Khong goi raw `toggleHangingProtocol` tu UI ma khong guard reconstructable.
- Khong hard-code `viewportId` neu OHIF protocol tao id dong.
- Khong assume active viewport luon la stack.
- Khong set layout thu cong cho MPR bang `setViewportGridLayout`.
- Khong persist measurement MPR neu khong co mapping SOP/frame chinh xac.
- Khong de Crosshairs active sau khi thoat MPR.
- Khong them 3D/MIP UI neu viewport render blank.
- Khong viet QA report "fully verified" neu chua test ca that.

## 17. Prompt Cho AI Code Phase 13

Dung prompt nay de giao cho AI khac:

```text
Hay thuc hien Phase 13: MPR, MIP & Volume Workflow theo file:
docs/MINIPACS_VIEWER_PHASE13_MPR_MIP_VOLUME_WORKFLOW_PLAN.md

Muc tieu:
- Bien MPR trong /viewer/minipacs thanh workflow on dinh cho CT/MR reconstructable.
- Guard XR/US/non-reconstructable de khong crash.
- Ho tro Crosshairs dung trong MPR.
- Neu protocol mprAnd3DVolumeViewport hoat dong on dinh thi them MPR+3D/MIP option; neu khong thi de disabled/deferred.
- Khong lam hong Phase 11 measurement persistence va Phase 12 layout presets.

Bat buoc truoc khi code:
1. Inspect API that trong:
   - ohif-viewer/extensions/cornerstone/src/getHangingProtocolModule.ts
   - ohif-viewer/extensions/default/src/commandsModule.ts
   - ohif-viewer/extensions/cornerstone/src/commandsModule.ts
   - ohif-viewer/modes/minipacs-viewer/src/initToolGroups.js
   - ohif-viewer/modes/minipacs-viewer/src/toolbarButtons.ts
   - ohif-viewer/extensions/minipacs/src/commandsModule.ts
2. Khong assume command/service name.
3. Khong goi raw toggleHangingProtocol truc tiep tu UI nua; tao wrapper MiniPACS de check reconstructable truoc.

Implement goi y:
- Tao ohif-viewer/extensions/minipacs/src/services/viewerMprWorkflowService.ts
- Them commands:
  - toggleMiniPacsMpr
  - enterMiniPacsMpr
  - exitMiniPacsMpr
  - toggleMiniPacsCrosshairs
  - toggleMiniPacsMipVolume neu MIP/3D duoc support
- Cap nhat toolbar/sidebar de dung wrapper commands.
- Them audit actions:
  - mpr_entered
  - mpr_exited
  - mpr_rejected
  - crosshairs_enabled
  - crosshairs_disabled
  - mip_entered/mip_rejected neu co
- Neu MPR active, LayoutPresets phai khong conflict. Co the exit MPR truoc khi apply preset.

QA bat buoc:
- Build extension va mode.
- Test CT reconstructable vao/thoat MPR.
- Test XR/non-reconstructable bam MPR khong crash.
- Test Crosshairs trong/ngoai MPR.
- Test Phase 12 layout preset sau khi thoat MPR.
- Test Phase 11 measurement stack persistence khong hoi quy.
- Tao docs/MINIPACS_VIEWER_PHASE13_QA_REPORT.md, ghi ro test nao la real runtime, test nao la static.

Khong duoc:
- Viet renderer volume rieng.
- Fake MIP/3D UI neu viewport blank.
- Persist measurement MPR neu khong xac dinh duoc SOP/frame chinh xac.
- Sua unrelated files hoac reset DB.
```
