# MiniPACS Viewer Phase 2 Implementation Plan

Updated: 2026-06-27

## Current Verification

Checked local route:

`http://localhost:8080/viewer/minipacs?StudyInstanceUIDs=1.2.840.113619.2.182.10808614472165.1782011637.895038`

Observed state:

- Route renders the custom MiniPACS shell, not the default OHIF viewer.
- Header text is `PACS VIEWER`.
- DOM root has custom layout content.
- DICOM viewport canvas exists and is sized at approximately 1097 x 758 render pixels.
- Visible overlay includes study date, `Chest`, W/L values, image index, and orientation markers.
- Browser console showed only a non-blocking i18n warning, no blocking error.

Files already dirty before this plan was written:

- `ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx`
- `ohif-viewer/extensions/minipacs/src/Components/CustomTopToolbar.tsx`
- `ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx`

I did not change those files in this phase document step.

## Phase 1 Result To Carry Forward

Phase 1 gives us the target VRPACS workstation map:

- 10 tool sections.
- Top toolbar command list.
- Series/history behavior.
- Viewport overlay and mini toolbar behavior.
- Backend-dependent workflow tools.
- Advanced tools that need later modality-specific modules.

The next implementation should not hardcode one-off arrays in each component. It should introduce a single source of truth for tools and commands.

## Phase 2 Goal

Turn the current custom viewer into a maintainable workstation architecture:

- Same route: `/viewer/minipacs`.
- Same OHIF mode: `@ohif/mode-minipacs-viewer`.
- Same extension boundary: `@ohif/extension-minipacs`.
- New registry-driven tool model.
- Real series rail from OHIF display sets.
- Real layout/sync command bridge through OHIF services.
- Backend hooks only where needed.

## Proposed Source Structure

```text
ohif-viewer/extensions/minipacs/src/
  Components/
    CustomTopToolbar.tsx
    CustomToolsSidebar.tsx
    MiniPacsSeriesRail.tsx
    MiniPacsViewportOverlay.tsx
    MiniPacsViewportTools.tsx
  config/
    minipacsToolRegistry.ts
    windowLevelPresets.ts
    seriesLayoutRules.ts
  services/
    commandBridge.ts
    seriesAdapter.ts
    viewportStateAdapter.ts
  getLayoutTemplateModule.tsx
```

## Tool Registry Contract

```ts
export type MiniPacsToolStatus =
  | 'ready'
  | 'ui-state'
  | 'ohif-service'
  | 'backend'
  | 'advanced'
  | 'guarded';

export type MiniPacsToolPlacement =
  | 'top-toolbar'
  | 'left-panel'
  | 'viewport-toolbar'
  | 'series-menu';

export type MiniPacsTool = {
  id: string;
  label: string;
  section: string;
  placement: MiniPacsToolPlacement[];
  kind: 'tool' | 'action' | 'toggle' | 'menu' | 'placeholder';
  icon: string;
  hotkey?: string;
  commandName?: string;
  commandContext?: 'CORNERSTONE' | 'DEFAULT';
  commandOptions?: Record<string, unknown>;
  requires?: string[];
  status: MiniPacsToolStatus;
  destructive?: boolean;
};
```

This lets the UI render all VRPACS groups from the same data while the command bridge decides whether a click should call `commandsManager`, `toolbarService.recordInteraction`, `ViewportGridService`, `SyncGroupService`, or a MiniPACS API.

## Command Bridge Plan

| Tool class | Implementation path |
| --- | --- |
| Cornerstone active tool | `toolbarService.recordInteraction` first, fallback to `commandsManager.runCommand('setToolActive')` |
| One-shot viewport action | `commandsManager.runCommand(commandName, options, context)` |
| Layout | `ViewportGridService` and/or OHIF layout command, with active layout state |
| MPR/compare | `HangingProtocolService.setProtocol` or command wrapper for known protocol id |
| Sync | `SyncGroupService` with separate toggles for scroll, WW/WL, zoom/pan, reference line, crosshair |
| Series selection | `DisplaySetService` + `ViewportGridService` route selected display set into active viewport |
| Capture/report/history | MiniPACS backend endpoint and modal/panel UI |
| Guarded destructive action | Confirmation modal before API call; audit log required |

## Series Arrangement Plan

Data source:

- Use OHIF `DisplaySetService` for display sets already loaded by the mode.
- Use DICOM metadata fields for sorting and labels: `StudyDate`, `StudyTime`, `Modality`, `SeriesNumber`, `SeriesDescription`, `InstanceNumber`, `NumberOfSeriesRelatedInstances`, `BodyPartExamined`.
- Use MiniPACS backend only for non-DICOM items: report files, history studies, key images, user tags.

Default sorting:

1. Group by study date/time, newest current study first.
2. Sort series by numeric `SeriesNumber`.
3. Sort instances by numeric `InstanceNumber`.
4. If series number is absent, fallback to acquisition time then description.

Default layout rules:

| Modality/context | Default layout |
| --- | --- |
| DX/CR single image | 1x1 |
| US one series | 1x1 with cine/stack controls if multi-frame |
| US multiple related series | 1x2, first two display sets loaded side by side |
| CT/MR stack | 1x1 axial stack by default |
| CT/MR MPR command | MPR layout with axial/coronal/sagittal, then optional 3D/MIP |
| Prior/current compare | 1x2 current left, prior right |

Series rail behavior:

- Click series: load into active viewport.
- Double click series: maximize that series in 1x1.
- Drag series onto viewport: replace that viewport.
- Right/overflow menu: key image, export video, download series; delete is guarded.
- Active series border and viewport border must stay synchronized.

## Viewport Overlay Plan

The current overlay should move from placeholder display into a real viewport wrapper:

- Top left: acquisition date/time, modality/body part, optional series label.
- Top right: `Series Index`, `Image current/total`.
- Bottom left: description/report note if available.
- Bottom right: zoom, WW/WL, slice/cine state.
- Right mini toolbar: snapshot, crop, fullscreen, WW/WL, link/sync, overflow.

The overlay must not block measurements or image interaction. Use small controls and pointer-events only on actual buttons.

## Backend Endpoints Needed

| Endpoint | Purpose |
| --- | --- |
| `GET /api/studies/:studyUid/history` | History panel grouped by patient/current study |
| `GET /api/studies/:studyUid/attachments` | Report/file items in the series rail |
| `POST /api/studies/:studyUid/key-images` | Convert/save selected instance as key image |
| `POST /api/viewer/snapshots` | Save viewport/fullview snapshot to gallery |
| `POST /api/viewer/export-video` | Export current series or all videos |
| `GET /api/viewer/downloads` | Download manager |
| `POST /api/viewer/audit` | Action history/audit trail |

## Implementation Order

1. Add `minipacsToolRegistry.ts` and `windowLevelPresets.ts`.
2. Refactor `CustomTopToolbar` to render top-placement registry tools.
3. Refactor `CustomToolsSidebar` to render left-panel registry sections in VRPACS order.
4. Add `commandBridge.ts` so every tool click goes through one function.
5. Add `MiniPacsSeriesRail.tsx` using `DisplaySetService` metadata.
6. Add layout rules and active viewport/series state.
7. Add viewport overlay and per-viewport mini toolbar.
8. Add backend-backed History, Report, Capture/Gallery, Export/Download.
9. Add guarded modals for destructive/config actions.
10. Add Playwright smoke checks for route render, no black screen, tool click command path, and series selection.

## Phase 2 Acceptance

- MiniPACS keeps opening at `/viewer/minipacs`.
- The viewer shell is registry-driven, not hardcoded separately in toolbar and sidebar.
- Tool groups visually match VRPACS order: History, Layout, Measurement, Advance, Image, Sync, MPR, Annotation, Capture, More.
- Series rail loads real display sets and supports click/double-click behavior.
- Layout 1x1, 1x2, 2x1, 2x2 works through OHIF services.
- Core image tools run real OHIF/Cornerstone commands.
- Backend-only and advanced tools are visible only when safely implemented or clearly disabled.
- Browser smoke test shows a non-empty custom viewer with no blocking console errors.
