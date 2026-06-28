# MiniPACS Viewer Phase 5 - Viewport Overlay And Per-Viewport Tools Plan

Updated: 2026-06-28

## Entry Criteria

Phase 5 should start only after Phase 4 is stable:

- `/viewer/minipacs` opens the custom MiniPACS mode.
- The custom top toolbar and left tool sidebar still render.
- `MiniPacsSeriesRail` is mounted between the left tools and the viewport grid.
- Series rail reads real `DisplaySetService` display sets.
- Click and drag/drop can route a display set into a viewport.
- Unsupported display sets are not routed into image viewports.
- `npm.cmd run build --workspace=@ohif/extension-minipacs` passes.

## Goal

Build the VRPACS-style viewport reading surface:

- Replace the generic OHIF overlay content with MiniPACS-specific overlay labels.
- Add clear active viewport styling that matches the VRPACS yellow/orange active frame.
- Add per-viewport mini tools on the right side of each viewport.
- Show live viewport state: image index, series index, zoom, WW/WL, cine/stack state.
- Keep measurement and image interaction usable; overlays must not block the canvas.

This phase is about viewport-level UI and service wiring. It is not about backend workflow.

## Non-Goals

Do not implement these in Phase 5:

- Snapshot persistence or gallery backend.
- Export video/download manager backend.
- Key image conversion persistence.
- Report editor, report files, or patient history API.
- Delete series or destructive actions.
- Advanced MPR, curved MPR, fusion, 3D volume rendering.
- Replacing Cornerstone rendering internals.
- New route, Docker, Nginx, or dashboard changes.

## Implementation Strategy

Use existing OHIF/Cornerstone services first. Do not use DOM scraping.

Preferred path:

- Use `customizationService.addModeCustomizations(...)` to configure the existing `CustomizableViewportOverlay`.
- Register MiniPACS overlay item definitions through the minipacs extension customization module.
- Add only small wrapper components where OHIF overlay customization cannot cover the right-side mini toolbar.

Avoid for Phase 5:

- Forking `OHIFCornerstoneViewport.tsx`.
- Editing `platform/app/src/components/ViewportGrid.tsx` unless there is no extension-level alternative.
- Drawing another canvas or absolute layer that captures mouse events over measurements.

## Confirmed Local APIs And Files

Use these existing hooks/patterns:

- `customizationService.addModeCustomizations(...)`
- `customizationService.getModeCustomization(...)`
- `customizationService.transform(...)`
- `cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED`
- `cornerstoneViewportService.getViewportInfo(viewportId)`
- `cornerstoneViewportService.getCornerstoneViewport(viewportId)`
- `viewportGridService.getState()`
- `viewportGridService.setActiveViewportId(viewportId)`
- `displaySetService.getDisplaySetByUID(displaySetInstanceUID)`
- `cineService.getState()`
- `commandsManager.runCommand(...)`

Reference files:

```text
ohif-viewer/extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx
ohif-viewer/extensions/cornerstone/src/Viewport/Overlays/CornerstoneOverlays.tsx
ohif-viewer/extensions/cornerstone/src/Viewport/Overlays/CustomizableViewportOverlay.tsx
ohif-viewer/extensions/cornerstone/src/Viewport/Overlays/ViewportImageScrollbar.tsx
ohif-viewer/extensions/cornerstone/src/components/CinePlayer/CinePlayer.tsx
ohif-viewer/platform/app/src/components/ViewportGrid.tsx
ohif-viewer/platform/docs/docs/platform/services/ui/customization-service.md
ohif-viewer/extensions/default/src/getCustomizationModule.tsx
ohif-viewer/modes/minipacs-viewer/src/index.js
```

## Proposed Files

Add:

```text
ohif-viewer/extensions/minipacs/src/
  Components/
    MiniPacsViewportMiniToolbar.tsx
    MiniPacsViewportStatusBadge.tsx
  config/
    viewportOverlayConfig.ts
    viewportMiniTools.ts
  services/
    viewportStateAdapter.ts
```

Update:

```text
ohif-viewer/extensions/minipacs/src/getCustomizationModule.ts
ohif-viewer/modes/minipacs-viewer/src/index.js
ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx
ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
```

Only add a custom viewport wrapper if customization-based overlay cannot support the mini toolbar:

```text
ohif-viewer/extensions/minipacs/src/
  Viewports/
    MiniPacsCornerstoneViewport.tsx
```

## Viewport State Adapter

Create `viewportStateAdapter.ts` to keep overlay components small and safe:

```ts
export type MiniPacsViewportState = {
  viewportId: string;
  isActive: boolean;
  displaySetInstanceUID?: string;
  StudyInstanceUID?: string;
  SeriesInstanceUID?: string;
  Modality?: string;
  SeriesNumber?: number | string;
  SeriesDescription?: string;
  BodyPartExamined?: string;
  imageIndex?: number;
  imageCount?: number;
  instanceNumber?: number | string;
  windowWidth?: number;
  windowCenter?: number;
  zoom?: number;
  isCineEnabled?: boolean;
  isCinePlaying?: boolean;
};
```

Adapter responsibilities:

- Read grid state from `viewportGridService`.
- Resolve display set metadata through `displaySetService`.
- Read viewport runtime state through `cornerstoneViewportService`.
- Normalize missing metadata to safe empty values.
- Return plain UI data, never raw Cornerstone objects.
- Fail soft if a viewport is not enabled yet.

## Overlay Content

Target VRPACS-style layout:

Top-left:

- Study date/time if available.
- Modality and body part.
- Series description.
- Optional active tool label.

Top-right:

- `Series Index: N` where `N` comes from sorted series order if available.
- `Image: current/total`.
- Optional cine timer/state for US/multiframe.

Bottom-left:

- Short series/body-part/description text.
- Non-backend placeholder for report note only if already in DICOM metadata.

Bottom-right:

- `Zoom: 1.02`
- `WW/WL: 255/128`
- Optional color preset label, defaulting to `Default`.

Use concise labels. Do not crowd the viewport.

## Overlay Customization Plan

Register MiniPACS overlay customizations during mode entry:

```js
customizationService.addModeCustomizations([
  {
    id: 'cornerstoneOverlayTopLeft',
    items: [
      { id: 'minipacs-study-line', customizationType: 'minipacs.overlayItem.studyLine' },
      { id: 'minipacs-series-line', customizationType: 'minipacs.overlayItem.seriesLine' },
    ],
  },
  {
    id: 'cornerstoneOverlayTopRight',
    items: [
      { id: 'minipacs-series-index', customizationType: 'minipacs.overlayItem.seriesIndex' },
      { id: 'minipacs-image-index', customizationType: 'ohif.overlayItem.instanceNumber' },
    ],
  },
  {
    id: 'cornerstoneOverlayBottomRight',
    items: [
      { id: 'minipacs-zoom', customizationType: 'ohif.overlayItem.zoomLevel' },
      { id: 'minipacs-window-level', customizationType: 'ohif.overlayItem.windowLevel' },
    ],
  },
]);
```

Register `minipacs.overlayItem.*` in `getCustomizationModule.ts`.

Implementation rule:

- If a value already exists in OHIF overlay props, use it.
- If a value must be derived from `displaySetService`, use the adapter.
- If a value is not reliably available, hide that line rather than showing `undefined`.

## Active Viewport Styling

Use the active viewport from `viewportGridService.getState()`.

Requirements:

- Active viewport border should be visually stronger than default OHIF active border.
- Use VRPACS-like amber/yellow for active viewport, while MiniPACS cyan remains for selected tools/series.
- Inactive viewport borders should stay subtle.
- Border must not resize or shift the viewport canvas.

Possible approaches:

- Prefer CSS override on existing active viewport classes.
- If needed, add a small `MiniPacsViewportStatusBadge` rendered through overlay customization.
- Avoid wrapping the whole viewport in a new border that changes grid math.

## Per-Viewport Mini Toolbar

Add a compact vertical toolbar on the right edge of each viewport, matching VRPACS behavior.

Phase 5 ready buttons:

| Button | Status | Implementation |
| --- | --- | --- |
| Snapshot | disabled | Placeholder only; no backend write |
| Fullscreen viewport | ready or ui-state | Toggle one-up layout if safe, otherwise placeholder |
| Window/brightness | ready | Activate WindowLevel or open preset menu |
| Link/sync state | ui-state | Show current sync placeholder; no full sync implementation unless already wired |
| Overflow menu | placeholder | Disabled key image/export/download/delete entries |

Interaction rules:

- Buttons must use `pointer-events: auto`.
- Overlay container around buttons must use `pointer-events: none`.
- Clicking a mini tool should first set that viewport active.
- Disabled backend actions must not mutate data.
- Destructive actions are hidden or disabled.

## Fullscreen / One-Up Behavior

Implement one-up only if it can preserve the previous layout safely.

Preferred:

- Store previous viewport grid state in local viewer UI state.
- Set layout to `1x1` for the selected viewport.
- A second click restores the previous layout.

Fallback:

- Leave fullscreen disabled in Phase 5 and document it for Phase 5.1.

Do not destroy display sets in other viewports.

## WW/WL And Zoom Display

Use existing OHIF overlay items where possible:

- `ohif.overlayItem.windowLevel`
- `ohif.overlayItem.zoomLevel`

For commands:

- WW/WL mini tool should activate `WindowLevel`.
- Preset menu should reuse Phase 3 `windowLevelPresets`.
- Avoid the bad `Default` preset behavior: default must reset VOI or do nothing, not apply `window: 0, level: 0`.

## Cine / Stack State

Phase 5 should show state, not rebuild cine.

Rules:

- Use existing `cineService` and `toggleCine` command.
- Display cine state only for multi-frame or stack display sets.
- Do not add custom playback loops.
- Do not break existing OHIF `CinePlayer`.

## Layout Integration

Phase 5 can be implemented without replacing `ViewportGridComp`.

Expected component relation:

```tsx
<CustomToolsSidebar />
<MiniPacsSeriesRail />
<div className="viewport-shell">
  <ViewportGridComp ... />
  // overlay customizations render inside each OHIF Cornerstone viewport
</div>
```

If the mini toolbar cannot be rendered through overlay customization, implement a minimal viewport wrapper module and update the MiniPACS mode viewport namespace for stack image viewports only:

```js
const minipacs = {
  viewport: '@ohif/extension-minipacs.viewportModule.minipacs-cornerstone',
};
```

That wrapper must delegate real image rendering to the existing Cornerstone viewport component.

## Quality Bar

Functional checks:

- `/viewer/minipacs` opens without black screen.
- Toolbar, left sidebar, series rail, and DICOM canvas still render.
- Overlay text appears in all four corners where metadata exists.
- Overlay never shows `undefined`, `null`, or `[object Object]`.
- WW/WL and zoom values update after user interaction.
- Image index updates while scrolling stack images.
- Active viewport border changes when clicking another viewport.
- Per-viewport mini toolbar appears on each viewport.
- Mini toolbar buttons do not block pan/zoom/measurement interactions outside the buttons.
- Disabled backend actions cannot mutate data.
- Series rail click/drag/drop still works after overlay work.

Build check:

```powershell
npm.cmd run build --workspace=@ohif/extension-minipacs
```

Browser smoke check:

```text
http://localhost:8080/viewer/minipacs?StudyInstanceUIDs=1.2.840.113619.2.182.10808614472165.1782011637.895038
```

Expected:

- `PACS VIEWER` visible.
- Series rail visible.
- DICOM image visible.
- Overlay labels visible.
- No blocking console errors.

## Risks

- Overlay customization may not expose every desired field; keep derived fields in `viewportStateAdapter`.
- Overlay text can block measurements if pointer events are wrong.
- Fullscreen one-up can destroy viewport state if implemented by replacing grid state carelessly.
- Some modalities may not have stack image count or instance number; hide missing values.
- Cine state differs between stack and multiframe studies; do not assume every display set can cine.
- If Phase 4 files are untracked and not committed, Phase 5 implementation may appear to compile locally but fail after push.

## Phase 5 Acceptance

Phase 5 is done when:

- MiniPACS viewport overlay labels are configured through OHIF customization service or an extension-level viewport wrapper.
- Top-left, top-right, bottom-left, and bottom-right overlay areas show useful DICOM/viewport data.
- Active viewport styling is clear and stable.
- A per-viewport mini toolbar exists with ready actions and disabled placeholders.
- Mini toolbar does not block normal image interactions.
- WW/WL, zoom, and image index update live.
- Existing Phase 4 series rail behavior still works.
- Extension build passes.
- The known local viewer route renders without black screen or blocking console errors.

## Handoff Prompt

```text
You are continuing MiniPACS custom viewer implementation in Phase 5.

Repository:
D:\Antigravity\Minipacs-v.2

Read first:
- docs/VRPACS_TOOL_INVENTORY_PHASE1.md
- docs/MINIPACS_VIEWER_PHASE2_IMPLEMENTATION_PLAN.md
- docs/MINIPACS_VIEWER_PHASE3_HANDOFF_PROMPT.md
- docs/MINIPACS_VIEWER_PHASE4_SERIES_RAIL_PLAN.md
- docs/MINIPACS_VIEWER_PHASE5_VIEWPORT_OVERLAY_PLAN.md
- ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx
- ohif-viewer/extensions/minipacs/src/getCustomizationModule.ts
- ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
- ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsSeriesRail.tsx
- ohif-viewer/extensions/cornerstone/src/Viewport/Overlays/CustomizableViewportOverlay.tsx
- ohif-viewer/extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx
- ohif-viewer/platform/app/src/components/ViewportGrid.tsx

Do not revert user changes.
Do not implement backend APIs.
Do not implement report/capture/export/delete persistence.
Do not change route /viewer/minipacs.
Do not fork Cornerstone rendering unless customization service cannot solve the task.

Goal:
Add VRPACS-style viewport overlay labels and per-viewport mini tools to the MiniPACS custom viewer.

Implement:
- config/viewportOverlayConfig.ts
- config/viewportMiniTools.ts
- services/viewportStateAdapter.ts
- Components/MiniPacsViewportMiniToolbar.tsx
- Components/MiniPacsViewportStatusBadge.tsx if useful
- Register minipacs overlay item customizations in getCustomizationModule.ts
- Register overlay positions through customizationService.addModeCustomizations in modes/minipacs-viewer/src/index.js
- Wire mini tool commands through commandBridge where possible

Required behavior:
- Overlay shows study/series metadata, series index, image current/total, zoom, WW/WL.
- Missing metadata is hidden, never rendered as undefined/null.
- Active viewport has a strong VRPACS-like amber/yellow frame.
- Per-viewport mini toolbar appears on the right side of each viewport.
- Mini toolbar buttons set their viewport active before running a command.
- Backend/destructive actions are disabled placeholders only.
- Series rail click/drag/drop from Phase 4 still works.

Verification:
- npm.cmd run build --workspace=@ohif/extension-minipacs
- Open /viewer/minipacs with the known StudyInstanceUID.
- Confirm PACS VIEWER, sidebar, series rail, overlay labels, mini toolbar, and DICOM canvas render.
- Confirm WW/WL, zoom, and image index update after interaction.
- Confirm no blocking console errors.

Stop after Phase 5. Do not start backend workflow, report, capture gallery, export/download, or advanced MPR.
```
