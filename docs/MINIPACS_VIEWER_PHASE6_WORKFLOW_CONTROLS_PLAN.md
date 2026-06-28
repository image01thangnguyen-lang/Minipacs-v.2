# MiniPACS Viewer Phase 6 - Workflow Controls And Safe Actions Plan

Updated: 2026-06-28

## Entry Criteria

Phase 6 should start only after Phase 5 is stable:

- `/viewer/minipacs` opens the custom MiniPACS mode.
- Custom top toolbar, left tools sidebar, series rail, viewport overlays, and mini toolbar render together.
- Top toolbar, sidebar tools, and mini toolbar Window/Level still execute commands.
- Active viewport border and overlay labels update correctly.
- Series rail click and drag/drop still route display sets into viewports.
- `npm.cmd run build --workspace=@ohif/extension-minipacs` passes.
- `npm.cmd run build --workspace=@ohif/mode-minipacs-viewer` passes.

## Goal

Turn Phase 5 placeholder controls into useful VRPACS-style viewer workflow controls:

- Implement safe per-viewport fullscreen/one-up behavior.
- Implement first-tier sync controls for stack/image scroll, WW/WL, and zoom/pan where OHIF services support them.
- Improve cine and stack review UX for multi-frame/US studies.
- Wire snapshot/download current viewport through existing OHIF commands without MiniPACS persistence.
- Replace passive overflow placeholders with a guarded action menu that clearly separates ready, disabled, backend, and destructive actions.
- Add lightweight command feedback so users know when an action is applied or intentionally unavailable.

Phase 6 is still mostly viewer-side. It may prepare backend contracts, but it should not implement report/history/key-image persistence yet.

## Non-Goals

Do not implement these in Phase 6:

- Persistent snapshot gallery.
- Save key image to MiniPACS database.
- Export video worker/backend.
- Download manager with audit.
- Delete series or destructive PACS actions.
- Report editor or report signing.
- Patient history API.
- Advanced MPR, fusion, curved MPR, AI, or mammography-specific workflows.
- New Docker, Nginx, Orthanc, or dashboard routing changes.

## Implementation Strategy

Use OHIF services and existing commands first. Keep the MiniPACS extension as the orchestration layer.

Preferred:

- Keep all tool definitions in config files.
- Keep command dispatch inside `commandBridge.ts`.
- Use `viewportGridService`, `toolbarService`, `syncGroupService`, `cineService`, and `cornerstoneViewportService`.
- Store UI-only state in small extension-local services/hooks/components.
- Keep backend actions guarded or disabled until API contracts are ready.

Avoid:

- DOM scraping.
- Replacing Cornerstone renderers.
- Editing OHIF platform files unless extension-level wiring cannot solve the behavior.
- Saving data from canvas screenshots without study/series/SOP/frame metadata.

## Proposed Files

Add:

```text
ohif-viewer/extensions/minipacs/src/
  Components/
    MiniPacsViewportOverflowMenu.tsx
    MiniPacsCineHud.tsx
    MiniPacsCommandToast.tsx
  config/
    viewportWorkflowActions.ts
  services/
    viewportLayoutState.ts
    viewportSyncAdapter.ts
    viewportSnapshotAdapter.ts
    commandFeedbackService.ts
```

Update:

```text
ohif-viewer/extensions/minipacs/src/Components/MiniPacsViewportMiniToolbar.tsx
ohif-viewer/extensions/minipacs/src/Components/MiniPacsOverlayItems.tsx
ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx
ohif-viewer/extensions/minipacs/src/config/viewportMiniTools.ts
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
ohif-viewer/extensions/minipacs/src/services/viewportStateAdapter.ts
ohif-viewer/modes/minipacs-viewer/src/index.js
```

## Feature 1 - Fullscreen / One-Up Viewport

Implement the mini toolbar fullscreen button.

Requirements:

- Clicking fullscreen sets the clicked viewport active first.
- If current layout is not one-up, store previous layout and active viewport display set mapping.
- Switch to `1x1` with the selected viewport/display set.
- Clicking fullscreen again restores the previous layout and display sets.
- Do not lose display sets in other viewports.
- Do not force re-fetch studies.
- Do not break drag/drop from the series rail.

Suggested implementation:

- Add `viewportLayoutState.ts`.
- Store previous layout in memory, scoped to the viewer session:

```ts
type MiniPacsStoredLayout = {
  activeViewportId: string;
  numRows: number;
  numCols: number;
  viewports: Array<{
    viewportId: string;
    displaySetInstanceUIDs: string[];
  }>;
};
```

- Use `viewportGridService.getState()` to capture state.
- Use existing layout command path through `commandBridge.ts` or `viewportGridService.setDisplaySetsForViewports(...)`.
- Hide restore affordance only when there is no stored layout.

Acceptance:

- Fullscreen works from mini toolbar.
- Second click restores prior layout.
- Measurements and overlays remain visible.
- Series rail active state still follows the visible viewport.

## Feature 2 - Sync Controls

Phase 6 should implement sync modes that are useful and safe:

- Stack/image scroll sync.
- WW/WL sync.
- Zoom/pan sync.
- Visible sync state badge.
- Manual unlink all.

Rules:

- Do not enable every sync mode blindly.
- Disable stack sync for modalities/layouts where it is unsafe or meaningless.
- Prefer OHIF `syncGroupService` and existing sync commands.
- If the existing OHIF command already handles a mode, use it.
- Keep state visible in the UI.

Suggested implementation:

- Add `viewportSyncAdapter.ts`.
- Define sync state:

```ts
type MiniPacsSyncState = {
  stack: boolean;
  voi: boolean;
  zoomPan: boolean;
  linkedViewportIds: string[];
};
```

- Add sync controls to:
  - Left sidebar Sync Tools section.
  - Mini toolbar link button or overflow menu.
  - Small overlay badge when any sync mode is active.

Acceptance:

- Stack sync toggles on/off and visibly reflects state.
- WW/WL sync can be toggled separately if supported.
- Zoom/pan sync can be toggled separately if supported.
- Unlink all clears sync state.
- Unsupported sync mode is disabled with a clear tooltip/message.

## Feature 3 - Cine / Stack Review HUD

Improve cine UX for US and multi-frame studies without custom playback loops.

Requirements:

- Show cine/stack controls only when relevant.
- Use existing `cineService` and `toggleCine`.
- Show play/pause state.
- Show current frame/slice and total frame/slice count.
- Add previous/next frame buttons only if they can use existing Cornerstone stack/scroll commands safely.
- Keyboard support can be prepared but should not conflict with text inputs.

Suggested implementation:

- Add `MiniPacsCineHud.tsx`.
- Reuse `viewportStateAdapter.ts` and extend it with:
  - `isMultiFrame`
  - `isStack`
  - `canCine`
  - `imageIndex`
  - `imageCount`
- Render the HUD as a viewport overlay or portal, not over the center of the image.

Acceptance:

- Cine HUD appears for US/multi-frame/stack studies where useful.
- Play/pause toggles the active viewport.
- HUD does not appear for single-frame DX unless stack controls are meaningful.
- Normal image interactions are not blocked.

## Feature 4 - Snapshot / Download Current Viewport

Make the mini toolbar snapshot button useful without implementing MiniPACS persistence.

Phase 6 ready behavior:

- Call existing OHIF download/snapshot modal command such as `showDownloadViewportModal`.
- Set selected viewport active before opening the modal.
- Include study/series/viewport context in future-ready adapter state.
- Do not save to MiniPACS database.
- Do not create gallery records.

Suggested implementation:

- Add `viewportSnapshotAdapter.ts` as a thin command wrapper.
- Wire `snapshot` mini tool to an action with `commandName: 'showDownloadViewportModal'`.
- Keep `Gallery` in the left sidebar disabled as backend until Phase 7.

Acceptance:

- Snapshot button opens the OHIF viewport download modal.
- It targets the clicked viewport.
- It works from multi-viewport layout.
- No backend write occurs.

## Feature 5 - Overflow Menus

Replace placeholder console logs with real guarded menus.

Viewport mini toolbar overflow should show:

- Snapshot / download current viewport: ready.
- Fullscreen / restore viewport: ready.
- Link / unlink viewport: ui-state or ready.
- Key image: backend disabled.
- Export video: backend disabled.
- Download series: backend disabled.
- Delete series: guarded hidden or disabled, never active by default.

Series rail context menu should show:

- Open in active viewport: ready.
- Open in new layout slot if available: ready if safe.
- Convert to key images: backend disabled.
- Export to video: backend disabled.
- Download series: backend disabled.
- Delete series: guarded hidden or disabled.

Acceptance:

- Menus open at stable positions and close on outside click/Escape.
- Disabled/backend/guarded actions cannot mutate data.
- Ready actions execute through `commandBridge.ts`.
- Destructive actions are never enabled accidentally.

## Feature 6 - Command Feedback

Add lightweight feedback for user actions.

Examples:

- "Window/Level active"
- "Stack sync enabled"
- "Snapshot dialog opened"
- "Export video requires backend support"
- "Delete series is disabled"

Requirements:

- Do not use blocking `alert`.
- Use a small toast/status strip inside the viewer.
- Keep messages short.
- Do not cover image content for long.

Suggested implementation:

- Add `commandFeedbackService.ts`.
- Add `MiniPacsCommandToast.tsx` near the layout root.
- Have `commandBridge.ts` return structured results for ready/disabled/error states.

Acceptance:

- Unsupported actions produce clear feedback.
- Ready actions still run.
- Feedback disappears automatically.

## Backend Contracts To Prepare, Not Implement

Phase 6 can define but should not build these APIs:

```text
POST /api/viewer/snapshots
POST /api/studies/:studyInstanceUid/key-images
POST /api/viewer/export-video
GET  /api/viewer/studies/:studyInstanceUid/history
GET  /api/viewer/studies/:studyInstanceUid/report-link
POST /api/audit/viewer-action
```

For future persistence, every action must carry:

- `StudyInstanceUID`
- `SeriesInstanceUID`
- `SOPInstanceUID` when available
- `frameNumber` when available
- `displaySetInstanceUID`
- `viewportId`
- `imageIndex`
- `windowWidth/windowCenter`
- `zoom`
- active measurements if relevant
- current user/session metadata from dashboard when available

## Quality Bar

Functional checks:

- `/viewer/minipacs` opens without black screen.
- Phase 5 overlay and mini toolbar still render.
- Top toolbar and left sidebar tools still work.
- Fullscreen/restore preserves prior layout.
- Snapshot opens OHIF download modal for the clicked viewport.
- Sync toggles do not enable invalid sync modes blindly.
- Cine HUD appears only when useful.
- Overflow menu actions have correct ready/disabled/guarded states.
- No action writes backend data in Phase 6.
- Series rail routing still works.
- Measurements still draw and can be selected.
- No blocking console errors.

Build checks:

```powershell
npm.cmd run build --workspace=@ohif/extension-minipacs
npm.cmd run build --workspace=@ohif/mode-minipacs-viewer
```

Browser smoke check:

```text
http://localhost:8080/viewer/minipacs?StudyInstanceUIDs=1.2.840.113619.2.182.10808614472165.1782011637.895038
```

Expected:

- `PACS VIEWER` visible.
- Series rail visible.
- DICOM image visible.
- Viewport overlay visible.
- Mini toolbar visible.
- Fullscreen/restore works.
- Snapshot button opens a modal.
- Sync state is visible and reversible.

## Risks

- One-up layout can lose viewport assignments if prior grid state is captured incorrectly.
- Sync behavior differs between modalities; unsafe sync can confuse readers.
- Cine state can apply globally if commands are not scoped to active viewport first.
- Overlay/portal controls can block measurement interactions.
- Existing OHIF commands may require context names that differ from the custom command registry.
- Backend-looking actions can mislead users if disabled state is not clear.

## Phase 6 Acceptance

Phase 6 is done when:

- Fullscreen/restore is implemented safely.
- Snapshot uses existing OHIF download behavior for the clicked viewport.
- At least one sync mode is truly wired and visibly reversible.
- Unsupported sync/backend/destructive actions are clearly disabled.
- Cine/stack state is easier to control for relevant studies.
- Command feedback is non-blocking and consistent.
- Existing Phase 3, 4, and 5 behaviors still work.
- Extension and mode builds pass.
- Browser smoke test passes on the known local study.

## Handoff Prompt

```text
You are continuing MiniPACS custom viewer implementation in Phase 6.

Repository:
D:\Antigravity\Minipacs-v.2

Read first:
- docs/VRPACS_TOOL_INVENTORY_PHASE1.md
- docs/MINIPACS_VIEWER_PHASE2_IMPLEMENTATION_PLAN.md
- docs/MINIPACS_VIEWER_PHASE3_HANDOFF_PROMPT.md
- docs/MINIPACS_VIEWER_PHASE4_SERIES_RAIL_PLAN.md
- docs/MINIPACS_VIEWER_PHASE5_VIEWPORT_OVERLAY_PLAN.md
- docs/MINIPACS_VIEWER_PHASE6_WORKFLOW_CONTROLS_PLAN.md
- ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx
- ohif-viewer/extensions/minipacs/src/getCustomizationModule.ts
- ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
- ohif-viewer/extensions/minipacs/src/config/viewportMiniTools.ts
- ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
- ohif-viewer/extensions/minipacs/src/services/viewportStateAdapter.ts
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsViewportMiniToolbar.tsx
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsSeriesRail.tsx
- ohif-viewer/modes/minipacs-viewer/src/index.js

Do not revert user changes.
Do not implement backend persistence.
Do not implement report/history/key-image/export-video storage.
Do not enable delete series.
Do not change /viewer/minipacs routing.
Do not fork Cornerstone rendering unless extension-level wiring cannot solve the task.

Goal:
Turn Phase 5 placeholders into safe viewer workflow controls:
- Fullscreen/restore selected viewport.
- Snapshot/download current viewport through existing OHIF command.
- First-tier sync control using OHIF services.
- Cine/stack HUD for useful studies.
- Overflow menus with ready/disabled/backend/guarded action states.
- Non-blocking command feedback.

Required behavior:
- Clicking mini toolbar action sets that viewport active first.
- Fullscreen preserves and restores the previous layout.
- Snapshot opens the OHIF viewport download modal for the clicked viewport.
- Sync state is visible and can be turned off.
- Backend actions remain disabled and cannot mutate data.
- Delete/destructive actions are hidden or guarded.
- Phase 3 top toolbar, Phase 4 series rail, and Phase 5 overlays still work.

Verification:
- npm.cmd run build --workspace=@ohif/extension-minipacs
- npm.cmd run build --workspace=@ohif/mode-minipacs-viewer
- Open /viewer/minipacs with the known StudyInstanceUID.
- Confirm DICOM image, overlay, mini toolbar, series rail, and tools render.
- Confirm fullscreen/restore, snapshot modal, sync toggle, and cine HUD behavior.
- Confirm no blocking console errors.

Stop after Phase 6. Do not start persistent gallery, report bridge, patient history, export-video backend, or delete-series workflow.
```
