# MiniPACS Viewer Phase 4 - Series Rail And Viewport Routing Plan

Updated: 2026-06-28

## Entry Criteria

Phase 4 should start only after the Phase 3 viewer shell is stable:

- `/viewer/minipacs` still opens the custom MiniPACS mode.
- Toolbar and sidebar render from `minipacsToolRegistry`.
- `commandBridge` handles ready tools and blocks backend/advanced/guarded tools.
- Layout buttons use ids like `1x1`, `1x2`, `2x1`, `2x2`, `3x3`.
- The `Default` window preset must not apply `window: 0, level: 0`; fix or disable that preset before relying on Phase 4 QA.

## Goal

Build the first real VRPACS-style series workflow:

- Add a narrow series rail between the tool sidebar and the viewport grid.
- Populate it from real OHIF `DisplaySetService` display sets.
- Sort and label series predictably.
- Show active series state synchronized with the active viewport.
- Allow click/double-click/drag-like routing of a display set into the active viewport.
- Keep all behavior DICOM/OHIF-service based; no backend workflow yet.

This phase is about image series navigation, not reporting/capture/export.

## Non-Goals

Do not implement these in Phase 4:

- Backend patient history API.
- Report/file attachments.
- Key image persistence.
- Save snapshot/gallery.
- Export video/download manager.
- Delete series.
- Full viewport overlay rewrite.
- Advanced MPR, curved MPR, fusion, 3D volume rendering.
- New route, Docker, Nginx, dashboard changes.

## Local OHIF APIs Confirmed

Use existing OHIF services rather than DOM hacks:

- `displaySetService.getActiveDisplaySets()`
- `displaySetService.activeDisplaySets`
- `displaySetService.getDisplaySetByUID(displaySetInstanceUID)`
- `displaySetService.getDisplaySetsForSeries(seriesInstanceUID)`
- `displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_ADDED, ...)`
- `displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_CHANGED, ...)`
- `displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED, ...)`
- `viewportGridService.getState()`
- `viewportGridService.getActiveViewportId()`
- `viewportGridService.setActiveViewportId(viewportId)`
- `viewportGridService.setDisplaySetsForViewport(...)`
- `viewportGridService.setDisplaySetsForViewports(...)`

Reference implementation patterns exist in:

- `ohif-viewer/extensions/default/src/Panels/PanelStudyBrowser.tsx`
- `ohif-viewer/extensions/measurement-tracking/src/panels/PanelStudyBrowserTracking/PanelStudyBrowserTracking.tsx`
- `ohif-viewer/platform/app/src/components/ViewportGrid.tsx`

## Proposed Files

```text
ohif-viewer/extensions/minipacs/src/
  Components/
    MiniPacsSeriesRail.tsx
    MiniPacsSeriesThumbnail.tsx
    MiniPacsSeriesContextMenu.tsx
  config/
    seriesLayoutRules.ts
  services/
    seriesAdapter.ts
    viewportRouting.ts
  types/
    series.ts
```

Update:

```text
ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx
```

## Series Data Model

Create a UI-safe model so React components do not depend on raw display-set shape everywhere:

```ts
export type MiniPacsSeriesItem = {
  displaySetInstanceUID: string;
  SeriesInstanceUID?: string;
  StudyInstanceUID?: string;
  Modality?: string;
  SeriesNumber?: number;
  SeriesDescription?: string;
  BodyPartExamined?: string;
  numInstances?: number;
  thumbnailSrc?: string;
  isMultiFrame?: boolean;
  isVideoLike?: boolean;
  sortKey: string;
};
```

`seriesAdapter.ts` should:

- Read from `displaySetService.getActiveDisplaySets()`.
- Map raw display sets into `MiniPacsSeriesItem`.
- Normalize missing values.
- Sort by `StudyDate/StudyTime`, numeric `SeriesNumber`, then description.
- Exclude unsupported/non-image display sets only if they cannot be displayed in a viewport.
- Keep a fallback item for display sets without thumbnail.

## Series Rail UI

`MiniPacsSeriesRail.tsx`:

- Width target: 96-128 px, between tools sidebar and viewport grid.
- Dark background matching the viewer shell.
- Vertical scroll, thin scrollbar.
- Header: compact label `Series` and count.
- Render `MiniPacsSeriesThumbnail` for each display set.
- Show loading/empty states:
  - `Loading series...`
  - `No image series`
- Subscribe to display set events and refresh list.

`MiniPacsSeriesThumbnail.tsx`:

- Stable size to avoid layout shifts.
- Active state border using MiniPACS cyan or VRPACS-like amber.
- Show:
  - Series number/index.
  - Modality.
  - Image count.
  - Short description.
  - Optional body part.
- Use thumbnail image if available.
- Fallback visual if thumbnail is missing.

## Viewport Routing

`viewportRouting.ts` should expose:

```ts
export function routeDisplaySetToActiveViewport({
  servicesManager,
  displaySetInstanceUID,
}): { ok: boolean; reason?: string };

export function routeDisplaySetToViewport({
  servicesManager,
  viewportId,
  displaySetInstanceUID,
}): { ok: boolean; reason?: string };
```

Implementation rules:

- Read `viewportGridService.getState()`.
- Use `activeViewportId` for normal click.
- If there is no active viewport, choose the first available viewport.
- Call `viewportGridService.setDisplaySetsForViewport` with the target viewport and selected display set.
- Preserve existing viewport options where possible.
- Return structured errors; do not throw for ordinary missing state.

Use the same display-set payload shape used by existing OHIF panel code in this repository. If uncertain, copy the pattern from `PanelStudyBrowser.tsx` rather than inventing a new structure.

## Interaction Rules

Click:

- Route clicked series into active viewport.
- Mark series active if the active viewport contains its `displaySetInstanceUID`.

Double click:

- Route clicked series into active viewport.
- Optionally switch layout to `1x1` through `setViewportGridLayout` with `context: DEFAULT`.
- Do not destroy other viewport state; if one-up is risky, keep double click same as click for Phase 4 and document it.

Drag/drop:

- Preferred: implement native drag payload compatible with OHIF `ViewportGrid` drop handler.
- Fallback for Phase 4: click-to-active only, with drag/drop deferred to Phase 4.1.

Context menu:

- Show non-destructive placeholders only:
  - Convert to key images: disabled.
  - Export to video: disabled.
  - Download series: disabled.
  - Delete series: hidden or disabled.
- Do not call backend or delete display sets.

## Active State Synchronization

The rail should listen to:

- Viewport active changes.
- Viewport grid state changes.
- Display set changes.

Active rail item logic:

- Get `activeViewportId` from `viewportGridService.getState()`.
- Get active viewport's `displaySetInstanceUIDs`.
- A series item is active if its UID is included.
- If no active viewport exists, no active item is shown.

## Layout Rules

Create `seriesLayoutRules.ts` for future-proofing, but keep Phase 4 conservative:

```ts
export type MiniPacsLayoutRule = {
  id: string;
  predicate: (items: MiniPacsSeriesItem[]) => boolean;
  layout: { numRows: number; numCols: number };
  description: string;
};
```

Initial rules:

- DX/CR single image: keep `1x1`.
- US one series: keep `1x1`.
- US two or more series: offer `1x2`, but do not auto-switch unless user confirms by clicking layout.
- CT/MR stack: keep `1x1`.

Do not auto-change layout aggressively in Phase 4. The first implementation should be predictable.

## Layout Template Update

Update `getLayoutTemplateModule.tsx` structure to:

```tsx
<CustomToolsSidebar servicesManager={servicesManager} />
<MiniPacsSeriesRail
  servicesManager={servicesManager}
  commandsManager={commandsManager}
/>
<ViewportGridComp ... />
```

Keep the viewport grid as the main flex area. The series rail must not cover or absolute-position over the canvas.

## Quality Bar

Functional checks:

- Viewer still opens at `/viewer/minipacs`.
- Toolbar and sidebar still render.
- Series rail appears between sidebar and viewport.
- Rail shows at least one series for the known DX sample study.
- Clicking a series does not crash.
- Active series highlight follows the active viewport.
- Layout buttons still work after adding the rail.
- Disabled context menu actions cannot mutate data.

Build checks:

- Run:

```powershell
npm.cmd run build --workspace=@ohif/extension-minipacs
```

Browser smoke check:

```text
http://localhost:8080/viewer/minipacs?StudyInstanceUIDs=1.2.840.113619.2.182.10808614472165.1782011637.895038
```

Expected:

- `PACS VIEWER` visible.
- Left tools visible.
- Series rail visible.
- DICOM canvas visible.
- No blocking console error.

## Risks

- OHIF display set shape may differ by modality; normalize defensively.
- Thumbnail generation may be async or missing; fallback UI is required.
- `setDisplaySetsForViewport` payload shape must follow existing OHIF panel patterns.
- Auto-layout can surprise radiology workflow; avoid automatic layout changes in this phase.
- Large studies may have many display sets; rail rendering should stay lightweight.

## Phase 4 Acceptance

Phase 4 is done when:

- `MiniPacsSeriesRail` exists and is mounted in the custom layout.
- It reads real display sets from `DisplaySetService`.
- It updates when display sets change.
- It routes selected display sets to the active viewport.
- It highlights the active viewport's display set.
- It has safe placeholder context actions only.
- Extension build passes.
- The known local viewer route renders without black screen or blocking console errors.

## Handoff Prompt

```text
You are continuing MiniPACS custom viewer implementation in Phase 4.

Repository:
D:\Antigravity\Minipacs-v.2

Read first:
- docs/VRPACS_TOOL_INVENTORY_PHASE1.md
- docs/MINIPACS_VIEWER_PHASE2_IMPLEMENTATION_PLAN.md
- docs/MINIPACS_VIEWER_PHASE3_HANDOFF_PROMPT.md
- docs/MINIPACS_VIEWER_PHASE4_SERIES_RAIL_PLAN.md
- ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx
- ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
- ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
- ohif-viewer/extensions/default/src/Panels/PanelStudyBrowser.tsx
- ohif-viewer/platform/app/src/components/ViewportGrid.tsx

Do not revert user changes.
Do not implement backend APIs.
Do not implement report/capture/export/delete.
Do not change route /viewer/minipacs.

Goal:
Add a VRPACS-style series rail between the left tools and the viewport grid, backed by OHIF DisplaySetService and ViewportGridService.

Implement:
- Components/MiniPacsSeriesRail.tsx
- Components/MiniPacsSeriesThumbnail.tsx
- Optional Components/MiniPacsSeriesContextMenu.tsx
- services/seriesAdapter.ts
- services/viewportRouting.ts
- config/seriesLayoutRules.ts
- types/series.ts if useful
- Mount the rail in getLayoutTemplateModule.tsx

Required behavior:
- Read real display sets from displaySetService.getActiveDisplaySets().
- Subscribe to display set changes.
- Sort and label series consistently.
- Show active series based on active viewport displaySetInstanceUIDs.
- Click routes selected display set into active viewport using viewportGridService.
- Use existing OHIF PanelStudyBrowser patterns for payload shape.
- Keep destructive/backend actions disabled.

Verification:
- npm.cmd run build --workspace=@ohif/extension-minipacs
- Open /viewer/minipacs with the known StudyInstanceUID.
- Confirm PACS VIEWER, sidebar, series rail, and DICOM canvas render.
- Confirm no blocking console errors.

Stop after Phase 4. Do not start viewport overlay rewrite or backend workflow.
```
