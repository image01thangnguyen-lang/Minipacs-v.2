# Ke hoach chi tiet Phase 5 - Advanced MPR/3D And Specialty Tools

Updated: 2026-07-04

## 1. Muc tieu

Phase 5 tiep noi Phase 4 Viewer Web Parity, tap trung vao nhom tool nang cao trong VRPACS Viewer: MPR/MIP/3D volume, curved/fusion/compare MPR, va cac specialty measurement nhu NASCET/ESCT, cardiothoracic ratio, brain mirror, mammography workflow.

Nguyen tac moi tu Phase 5 tro di: **bat ky thu gi duoc lam backend, schema, service, command, hoac registry deu phai co UI hien thi/tuong tac tuong ung**. Khong chap nhan tinh nang "lam xong trong code nhung nguoi dung khong thay".

Muc tieu cuoi phase:

- Bac si co the vao/thoat MPR tu viewer mot cach on dinh tren CT/MR reconstructable.
- Viewer hien ro eligibility cua active series: dung duoc MPR/MIP/3D hay khong, ly do neu khong dung duoc.
- Co UI control cho axial/coronal/sagittal, crosshairs, MIP mode, slab thickness, va reset/exit.
- Co 3D/volume panel neu engine hien tai ho tro: volume render, camera preset, clipping safe, snapshot/export 3D.
- Co curved MPR/compare MPR/fusion MPR o muc guarded/deferred neu engine chua an toan; khong bat nut ready gia.
- Co specialty tool panel cho NASCET/ESCT, cardiothoracic ratio, volume/cylinder volume, brain mirror, mammography layout/tools neu du data.
- Tat ca action co feedback UI, audit, permission check, va khong lam hong measurement/report/key-image workflow Phase 4.
- Moi artifact sinh ra tu advanced viewer phai hien trong viewer gallery/report workspace neu da luu thanh snapshot/key image/measurement.

## 2. Khong nam trong Phase 5

Phase 5 khong lam cac viec sau:

- Khong viet lai Cornerstone/OHIF volume renderer tu dau neu repo da co engine.
- Khong lam native workstation: open folder, direct DICOM print SCU, CD/DVD burn, scanner bridge, external app launcher.
- Khong lam Non-DICOM capture module. Phan nay thuoc Phase 6.
- Khong lam share link/consultation/video/chat. Phan nay thuoc Phase 7.
- Khong lam destructive delete study/series production. Phan nay thuoc Phase 8.
- Khong lam AI labeling production neu chua co model/service boundary, dataset validation, va policy review.
- Khong luu PHI vao filename/test fixture.
- Khong ep tool sang `ready` neu chua co command, UI feedback, eligibility guard, va QA dataset.

Neu tool can native/GPU/backend chua san sang, phai de `deferred-advanced`, `backend`, hoac `guarded` voi tooltip ly do ro tren UI.

## 3. Dieu kien tien quyet

Chi nen bat dau Phase 5 khi:

- Phase 4 build pass va viewer registry khong con ready gia cho tool chua chay.
- `minipacsToolRegistry.ts` la source of truth cho tool visibility/status.
- `commandsModule.ts` da co pattern command wrapper + UI feedback.
- `viewerAuditService` hoac API audit viewer da dung duoc.
- `ViewerMeasurement`, `ViewerSnapshot`, `ViewerKeyImage`, `ViewerAuditLog` da on dinh.
- Co it nhat cac dataset QA:
  - CT reconstructable multi-slice.
  - MR reconstructable multi-slice.
  - XR/CR/DX single frame de test reject MPR.
  - US/cine neu co de test reject/disabled state.
  - CTA carotid hoac sample phu hop NASCET/ESCT neu muon bat specialty.
  - Chest X-ray de test cardiothoracic ratio.
  - Mammography study neu muon bat mammography layout.

## 4. He thong hien tai can ke thua

Can doc va ke thua cac file/khai niem sau truoc khi code:

```text
docs/VRPACS_GAP_ANALYSIS_ROADMAP.md
docs/VRPACS_PHASE4_VIEWER_WEB_PARITY_PLAN.md
docs/VRPACS_PERMISSION_ACTION_MATRIX.md
docs/VRPACS_WORKFLOW_STATUS_POLICY.md
docs/VRPACS_TERMINOLOGY_MAP.md
dashboard/prisma/schema.prisma
dashboard/lib/permissions.ts
dashboard/app/api/viewer/studies/[uid]/context/route.ts
dashboard/app/api/viewer/studies/[uid]/measurements/route.ts
dashboard/app/api/viewer/studies/[uid]/key-images/route.ts
dashboard/app/api/viewer/snapshots/route.ts
dashboard/app/api/audit/viewer-action/route.ts
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
ohif-viewer/extensions/minipacs/src/commandsModule.ts
ohif-viewer/extensions/minipacs/src/services/viewerMprWorkflowService.ts
ohif-viewer/extensions/minipacs/src/services/viewerHangingProtocolService.ts
ohif-viewer/extensions/minipacs/src/services/viewportStateAdapter.ts
ohif-viewer/extensions/minipacs/src/services/viewerMeasurementPersistenceService.ts
ohif-viewer/extensions/minipacs/src/services/viewerSnapshotService.ts
ohif-viewer/extensions/minipacs/src/services/viewerKeyImageService.ts
ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx
ohif-viewer/extensions/minipacs/src/Components/CustomTopToolbar.tsx
ohif-viewer/extensions/minipacs/src/Components/MiniPacsViewportMiniToolbar.tsx
```

Khong tao viewer moi. Phase 5 phai mo rong OHIF/MiniPACS extension hien co.

## 5. Nguyen tac UI visibility bat buoc

### 5.1 Khong co backend-only feature

Moi capability moi phai co day du:

- Registry entry voi status dung.
- Command handler hoac service method.
- UI surface: button/panel/dialog/HUD/detail row.
- Disabled state va tooltip neu khong du dieu kien.
- Success/fail feedback.
- Audit event neu action thay doi state, tao artifact, hoac bat workflow nang cao.
- QA scenario trong plan.

### 5.2 Tool visible phai noi that

Tool chi duoc `ready` khi:

- Bam duoc tren viewer.
- Khong crash khi active viewport khong hop le.
- Co eligibility guard.
- Co toast/dialog feedback.
- Co manual QA tren dataset phu hop.
- Neu tao measurement/snapshot/key image thi artifact hien lai tren UI sau reload.

Neu chi co icon nhung chua chay, de `deferred-advanced` va tooltip ro.

### 5.3 UI surfaces can co

Phase 5 can co it nhat cac UI surface sau:

- Advanced Viewer Status HUD: hien active series co reconstructable hay khong, modality, slice count, active mode.
- MPR Control Panel: axial/coronal/sagittal, crosshairs, reset, exit, layout.
- MIP/Slab Control Panel: MIP/MinIP/AvgIP, thickness preset, reset.
- Volume/3D Panel: mode, camera preset, clipping toggle, snapshot/export neu support.
- Specialty Tools Panel: NASCET/ESCT, CTR, volume/cylinder, brain mirror, mammography.
- Artifact output UI: measurement list, key image/gallery, report workspace receive state.
- QA/Diagnostics panel: engine capability, rejection reason, memory/GPU warning neu co.

### 5.4 Graceful fallback

Neu repo/OHIF hien tai chua co engine cho mot tool:

- Khong viet fake/mock clinical result.
- Khong luu measurement gia.
- Hien disabled reason: "Can CT/MR reconstructable series", "Can MPR engine", "Can mammography dataset", "Can AI service".
- Audit `*_rejected` neu user bam vao tool nhung data khong hop le.

## 6. Data va permission contract

### 6.1 Permission keys de xuat

Neu chua co, them hoac map cac permission sau:

| Permission | Muc dich | Default actors |
| --- | --- | --- |
| `viewer.advanced` | Dung MPR/MIP/3D va specialty tools | ADMIN, DOCTOR |
| `viewer.measureAdvanced` | Tao/sua specialty measurements | ADMIN, DOCTOR |
| `viewer.export` | Export snapshot/3D/artifact | ADMIN, DOCTOR, TECHNICIAN theo policy |
| `viewer.history` | Xem action history | ADMIN, DOCTOR, TECHNICIAN theo policy |

Neu muon tranh them key moi trong Phase 5, co the dung `studies.read` cho open viewer va `reports.write`/`viewer.export` cho artifact/export. Tuy nhien cac tool nang cao nen co gate rieng trong UI de de quan tri.

### 6.2 Audit actions

Them audit event names:

- `mpr_entered`
- `mpr_exited`
- `mpr_rejected`
- `mpr_orientation_changed`
- `crosshairs_enabled`
- `crosshairs_disabled`
- `mip_entered`
- `mip_mode_changed`
- `mip_thickness_changed`
- `volume3d_entered`
- `volume3d_snapshot_saved`
- `curved_mpr_requested`
- `fusion_mpr_requested`
- `compare_mpr_opened`
- `specialty_measurement_started`
- `specialty_measurement_saved`
- `specialty_measurement_rejected`

Audit metadata chi nen gom summary: study UID, series UID, tool id, reason, mode, va measurement id. Khong luu raw DICOM payload.

### 6.3 Persisted artifacts

Neu Phase 5 tao artifact:

- Specialty measurement: uu tien luu vao `ViewerMeasurement` voi `toolName`, `measurementType`, `dataJson`, `displayText`, `value`, `unit`.
- 3D/MPR snapshot: luu vao `ViewerSnapshot` hoac `ViewerKeyImage` voi `sourceType` nhu `MPR`, `MIP`, `VOLUME3D`, `SPECIALTY`.
- Khong tao schema moi neu cac model Phase 4 du dap ung.
- Chi tao migration moi neu can metadata co cau truc khong the luu an toan trong `dataJson`/`metadataJson`.

### 6.4 UI field mapping

Moi persisted artifact phai hien o:

- Viewer gallery/key image panel.
- Report workspace neu artifact duoc mark selected/send-to-report.
- Action history panel.
- Neu lien quan report final, khong cho sua/xoa tuy tien neu report da final ma policy khong cho phep.

## 7. Scope chi tiet

### 7.1 MPR eligibility va mode switch

In scope:

- Kiem tra active display set reconstructable.
- Cho phep vao/thoat MPR tu toolbar/left panel.
- Hien HUD: `MPR ready`, `MPR active`, hoac reason reject.
- Disable MPR button neu active series khong phu hop, neu UI co the biet truoc.
- Audit enter/exit/reject.
- Khi thoat MPR, restore layout Phase 4 hoac layout truoc do.

Out of scope:

- Tu tinh lai volume neu OHIF/Cornerstone khong support.
- Auto vao MPR khi mo study.

UI bat buoc:

- Button MPR co tooltip.
- Toast khi reject.
- MPR HUD/panel co active mode va exit button.

### 7.2 Axial/Coronal/Sagittal controls

In scope:

- Hien 3 plane labels ro tren viewport.
- Nut chuyen orientation neu engine support.
- Crosshairs toggle trong MPR.
- Reset MPR orientation.

UI bat buoc:

- Segmented control hoac icon buttons cho Axial/Coronal/Sagittal.
- Crosshairs toggle co state.
- Disabled reason neu dang khong o MPR.

### 7.3 MIP/MinIP/AvgIP va slab thickness

In scope:

- MIP mode neu OHIF/Cornerstone protocol support.
- Thickness presets: `thin`, `5mm`, `10mm`, `20mm`, custom neu lay duoc spacing.
- Reset thickness.
- Hien active MIP mode trong HUD.

UI bat buoc:

- Select/segmented control cho MIP/MinIP/AvgIP.
- Slider hoac stepper thickness.
- Warning neu volume spacing/slice geometry khong hop le.

### 7.4 3D volume controls

In scope neu engine co san:

- Enter/exit 3D volume mode.
- Camera presets: anterior/posterior/left/right/top/reset.
- Basic clipping safe preview neu supported.
- Save 3D snapshot vao `ViewerSnapshot`.

Out of scope:

- 3D sculpt production.
- 3D print production.
- Virtual endoscopy.
- Native external renderer.

UI bat buoc:

- Volume panel voi mode/status.
- Camera preset buttons co icon/tooltip.
- Snapshot button neu capture that lam duoc; neu chua thi disabled, khong mock.

### 7.5 Curved MPR va Compare MPR

In scope:

- Audit current engine support.
- Neu repo da co command/protocol: expose guarded UI.
- Neu chua co: registry de `deferred-advanced`, UI disabled tooltip.
- Compare MPR: chi mo khi co prior/current study reconstructable.

UI bat buoc:

- Curved MPR entry trong Advanced panel, khong ready neu chua verify.
- Compare MPR dialog/list prior studies neu co history API.
- Rejection reason ro: no prior, not reconstructable, engine unavailable.

### 7.6 Fusion MPR

In scope:

- Eligibility check: multi-modality/co-registered data neu co metadata.
- Registry status dung: `backend`/`deferred-advanced` neu chua co registration.
- UI placeholder co reason neu chua support.

Out of scope:

- Tu viet registration/fusion algorithm production.

UI bat buoc:

- Fusion MPR disabled/guarded state tren Advanced panel.
- Neu supported, opacity slider va modality labels.

### 7.7 Specialty measurements

In scope theo thu tu uu tien:

1. Cardiothoracic ratio (CTR) cho chest X-ray.
2. Volume/cylinder volume neu engine/tool math an toan.
3. NASCET/ESCT neu co measurement workflow ro.
4. Brain mirror neu co layout/tool support.
5. Mammography layout/tools neu co dataset va hanging protocol.

Moi tool phai co:

- Start tool UI.
- Step guidance nho trong panel, khong text dai che anh.
- Measurement preview.
- Save/cancel.
- Persist vao `ViewerMeasurement`.
- Hien trong measurement list va report workspace.

Khong duoc:

- Luu ket qua neu input chua du diem/duong can thiet.
- Gan nhan chan doan tu dong nhu AI neu chua co clinical validation.

### 7.8 Mammography workflow

In scope neu co dataset:

- Mammography layout preset co labels CC/MLO/L/R neu metadata du.
- Breast side/view badges.
- Invert/WL preset phu hop.
- Measurement/tool buttons relevant.

Out of scope:

- CAD/AI mammography production.
- Tu suy dien view neu metadata khong du va khong co user confirmation.

UI bat buoc:

- Mammography mode badge.
- Missing metadata warning.
- Layout reset/exit.

### 7.9 AI labeling boundary

Phase 5 chi lam boundary neu can:

- Registry entry `AILabeling` de `backend` hoac `deferred-advanced`.
- API contract draft neu co service sau nay.
- UI disabled state: "Chua cau hinh AI service".

Khong lam:

- Fake AI label.
- Hard-code label.
- Luu label vao report nhu ket luan.

## 8. Implementation packages

### PR 5.1 - Registry audit va eligibility UI

Files chinh:

```text
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
ohif-viewer/extensions/minipacs/src/commandsModule.ts
ohif-viewer/extensions/minipacs/src/services/viewportStateAdapter.ts
ohif-viewer/extensions/minipacs/src/services/viewerMprWorkflowService.ts
ohif-viewer/extensions/minipacs/src/Components/MiniPacsAdvancedViewerHud.tsx
ohif-viewer/extensions/minipacs/src/Components/MiniPacsAdvancedToolsPanel.tsx
```

Tasks:

- Audit cac tool Phase 5 trong registry.
- Cap nhat status/deferredReason dung Phase 5/Phase 8/Native.
- Tao eligibility helper cho active series.
- Hien HUD/panel eligibility tren viewer.
- Khong chuyen tool sang ready neu chua co command/QA.

Acceptance:

- XR/US/single-frame hien MPR disabled voi reason.
- CT/MR reconstructable hien MPR available.
- UI hien ro active series va capability.

### PR 5.2 - MPR enter/exit, orientation, crosshairs

Tasks:

- Hardening `viewerMprWorkflowService`.
- Them command wrappers:
  - `enterMiniPacsMpr`
  - `exitMiniPacsMpr`
  - `toggleMiniPacsMpr`
  - `setMiniPacsMprOrientation`
  - `toggleMiniPacsCrosshairs`
- UI MPR Control Panel.
- Audit enter/exit/reject/orientation/crosshairs.

Acceptance:

- CT/MR vao/thoat MPR khong crash.
- Thoat MPR restore layout hop ly.
- Crosshairs state khong bat neu khong o MPR.
- Viewer action history hien events.

### PR 5.3 - MIP/slab controls

Tasks:

- Kiem tra protocol MIP/3D co san.
- Them MIP mode state neu engine support.
- UI MIP mode + thickness presets.
- Audit MIP mode/thickness.
- Disabled state neu engine unavailable.

Acceptance:

- MIP controls chi hien enabled khi volume mode support.
- Thickness thay doi co feedback.
- Reject message ro neu data khong du.

### PR 5.4 - 3D volume safe controls

Tasks:

- Expose 3D mode neu protocol/viewport support.
- Camera preset buttons.
- Optional clipping safe toggle neu support.
- Save 3D snapshot neu capture real viewport duoc.
- Persist snapshot voi `sourceType: "VOLUME3D"`.

Acceptance:

- 3D button khong crash voi CT/MR hop le.
- XR/US reject dung.
- Snapshot neu enabled phai hien trong Gallery sau reload.

### PR 5.5 - Specialty measurement MVP

Tasks:

- Chon 1-2 tool co do rui ro thap de lam truoc:
  - CTR cho chest X-ray.
  - Cylinder/volume neu co engine measurement support.
- Tao Specialty Tools Panel.
- Persist ket qua vao `ViewerMeasurement`.
- Hien measurement trong measurement list/report workspace.
- Audit start/save/reject.

Acceptance:

- Tool khong luu ket qua neu input thieu.
- Ket qua co displayText, value, unit.
- Reload viewer van thay measurement.
- Send-to-report neu workflow hien co support.

### PR 5.6 - Curved/Fusion/Compare/Mammography guarded UI

Tasks:

- Audit support that trong repo.
- Chi enable tool nao co engine.
- Nhung tool chua support phai hien disabled reason.
- Mammography layout chi enable khi co dataset/metadata.
- Compare MPR dung history/prior API neu available.

Acceptance:

- Khong co ready gia.
- User biet vi sao tool chua dung duoc.
- Registry status/deferredReason khop roadmap.

### PR 5.7 - QA, performance, va UI visibility closure

Tasks:

- Chay build.
- Browser QA tren CT/MR/XR/US.
- Test permission: user khong co `viewer.advanced` khong thay/khong chay tool nang cao.
- Test audit history.
- Test artifact hien tren Gallery/Report Workspace.
- Cap nhat docs/walkthrough.

Acceptance:

- Moi feature da lam co UI.
- Moi UI ready co behavior that.
- Moi tool khong support co disabled/deferred reason ro.

## 9. UI changes bat buoc theo man hinh

### 9.1 Viewer

Can hien:

- Advanced capability HUD.
- MPR/MIP/3D panels.
- Specialty tool panel.
- Tool disabled reason.
- Measurement/artifact output.
- Action history events.

### 9.2 Report detail

Neu artifact/measurement Phase 5 duoc gui sang report:

- Report workspace hien nguon artifact: `MPR`, `MIP`, `VOLUME3D`, `SPECIALTY`.
- Report khong bi chen anh/measurement am tham; user phai thay va chon.
- Final report khong cho sua artifact neu policy khong cho.

### 9.3 Study List / Archive

Khong can them nhieu cot moi trong Phase 5, nhung neu co advanced artifact:

- Detail panel co the hien badge "Co MPR/3D artifact" hoac "Co specialty measurement" neu khong gay roi UI.
- Archive/report workspace co the hien artifact summary.

### 9.4 Admin

Neu them permission moi:

- User/role UI phai hien permission label.
- Role defaults va seed phai dong bo.
- Khong chi them key trong code.

## 10. Tool registry target

| Tool | Phase 5 target | UI requirement |
| --- | --- | --- |
| `MPR` | `ready` neu guarded enter/exit on dinh | Button + MPR panel + reject reason |
| `Axial`/`Coronal`/`Sagittal` | `ready` neu orientation command support | Segmented controls + active state |
| `MIP` | `ready`/`backend` tuy engine | MIP panel + thickness |
| `3D` | `ready`/`backend` tuy protocol | Volume panel + camera presets |
| `CurvedMPR` | `guarded`/`deferred-advanced` | Disabled reason hoac guarded dialog |
| `CompareMPR` | `guarded` neu prior + reconstructable | Prior picker + reject reason |
| `FusionMPR` | `backend`/`deferred-advanced` | Disabled/opacity UI neu support |
| `Volume`/`VolumePolygon` | `guarded`/`deferred-advanced` | Specialty/volume panel |
| `NASCET` | `guarded` neu tool implemented | Step UI + persisted measurement |
| `Cardiopulmonary` | `ready` neu CTR MVP done | Step UI + measurement list |
| `Mammography` | `guarded` neu dataset/layout support | Mammo layout badge/panel |
| `BrainMirror` | `deferred-advanced` tru khi verified | Disabled reason |
| `AILabeling` | `backend`/`deferred-advanced` | No fake labels |

## 11. QA scenarios

### 11.1 CT/MR reconstructable

1. Open CT study.
2. Verify HUD says MPR available.
3. Enter MPR.
4. Toggle crosshairs.
5. Change axial/coronal/sagittal orientation if available.
6. Enter MIP/slab if available.
7. Exit MPR.
8. Verify no measurement lost.
9. Verify action history.

### 11.2 Non-reconstructable study

1. Open XR/US/single-frame study.
2. Verify MPR/MIP/3D disabled or rejects with clear message.
3. Verify no blank viewport/crash.
4. Verify `mpr_rejected` audit if user attempted.

### 11.3 Specialty measurement

1. Open eligible study.
2. Start specialty tool.
3. Try save with missing points: must reject.
4. Complete measurement.
5. Save.
6. Reload viewer.
7. Verify measurement persists and appears in report workspace.

### 11.4 Permission

1. Login as role without advanced viewer permission.
2. Verify advanced tools hidden/disabled.
3. Direct command/API must be blocked server-side if persistence/export involved.

### 11.5 Regression

1. Basic pan/zoom/WL still works.
2. Key image save still works.
3. Snapshot/gallery still works.
4. Report workspace still loads.
5. Phase 4 Download Manager still works.

## 12. Build/test requirements

Moi PR trong Phase 5 can ghi ro:

- Files changed.
- UI surfaces changed.
- Behavior changed.
- Tool registry status changed.
- Permissions changed.
- Migration needed or not.
- Tests/build run.
- Manual browser scenarios tested.
- Tools intentionally still deferred.

Lenh verify toi thieu:

```bash
cd dashboard
npm run build
```

Neu sua OHIF package, can build/typecheck OHIF theo script repo hien co. Neu repo chua co script on dinh, ghi ro "not run" va ly do.

## 13. Rui ro va cach giam rui ro

| Rui ro | Giam rui ro |
| --- | --- |
| MPR crash voi data khong reconstructable | Eligibility guard + disabled UI + reject audit |
| Ready gia trong registry | Ready only after command + QA |
| GPU/memory cao voi CT lon | Memory warning, fail gracefully, khong auto enter |
| Measurement sai clinical | Step validation, no AI diagnosis, clear label |
| Mat measurement 2D khi doi layout | Regression test measurement persistence |
| UI qua day/roi | Dung panel/HUD nho, khong chen text len anh |
| Permission bi bypass | Server-side check cho persistence/export/audit-sensitive actions |
| Engine OHIF dynamic runtime loi | Browser QA, khong chi tin build |

## 14. Exit criteria

Phase 5 chi duoc coi la hoan thanh khi:

- Build pass.
- Viewer registry khong co tool Phase 5 ready gia.
- CT/MR reconstructable vao/thoat MPR on dinh.
- Non-reconstructable study reject ro, khong crash.
- MIP/3D controls neu implemented co UI va disabled state dung.
- Specialty measurement MVP neu implemented co persist/reload/report workspace.
- Tat ca feature da code co UI hien thi/tuong tac.
- Tat ca action quan trong co audit/history.
- Permission/seed/default role dong bo neu them key.
- QA report ghi ro dataset da test va tool nao con deferred.

## 15. Prompt ban giao cho AI coding agent

Copy prompt duoi day neu muon giao Phase 5 cho AI coding agent khac:

```text
Ban la coding agent trong repo MiniPACS. Hay thuc hien Phase 5 - Advanced MPR/3D And Specialty Tools theo file:

- docs/VRPACS_PHASE5_ADVANCED_MPR_3D_SPECIALTY_TOOLS_PLAN.md

Truoc khi code, doc them:

- docs/VRPACS_GAP_ANALYSIS_ROADMAP.md
- docs/VRPACS_PHASE4_VIEWER_WEB_PARITY_PLAN.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_WORKFLOW_STATUS_POLICY.md
- docs/VRPACS_TERMINOLOGY_MAP.md

Rang buoc bat buoc:

- Tu Phase 5 tro di, tat ca backend/schema/service/command/registry lam duoc phai co UI hien thi hoac disabled/tooltip state ro rang.
- Khong tao ready gia trong `minipacsToolRegistry.ts`.
- Khong viet fake clinical measurement/AI label.
- Khong tao renderer volume moi neu OHIF/Cornerstone da co engine.
- Khong lam Non-DICOM, share/consultation, destructive delete, native workstation trong Phase 5.
- Khong revert thay doi cua user.
- Khong hard-code PHI.

Uu tien:

1. Audit registry va tao Advanced Viewer HUD/Panel.
2. Hardening MPR eligibility + enter/exit + audit.
3. Axial/coronal/sagittal + crosshairs UI.
4. MIP/slab controls neu engine support.
5. 3D volume safe controls neu engine support.
6. Specialty measurement MVP voi persistence va UI.
7. Guarded/deferred UI cho curved/fusion/compare/mammography/AI neu chua support.

Ket qua mong muon:

- Files changed list.
- Behavior/UI changed summary.
- Tool registry status summary.
- Tests/build da chay.
- Manual QA scenarios da test.
- Cac tool con deferred va ly do.
- Rui ro con lai.
```

