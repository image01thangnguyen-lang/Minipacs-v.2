# MiniPACS Viewer Phase 12 - QA Report

## Changes Made
- `ohif-viewer/extensions/minipacs/src/services/seriesClassificationAdapter.ts`: Added to normalize `displaySet` properties and classify series (e.g. `ct_axial`, `mr_t1`, `xr_primary`).
- `ohif-viewer/extensions/minipacs/src/services/layoutPresetService.ts`: Added to handle persistent layout preset storage via `localStorage` (last used preset + built-in presets).
- `ohif-viewer/extensions/minipacs/src/services/viewerHangingProtocolService.ts`: Added hanging protocol rule engine to determine the best layout (rows/cols) based on the primary modality and assign classified display sets to viewports.
- `ohif-viewer/extensions/minipacs/src/commandsModule.ts`: Implemented custom commands like `applyLayoutPreset` for triggering preset changes directly from UI.
- `ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx`: Hooked `runAutoLayoutWhenReady` on mode enter to trigger the auto layout as soon as `displaySets` with images are available.
- `ohif-viewer/extensions/minipacs/src/services/commandBridge.ts`: Set `userHasManualLayoutOverride` flag to `true` whenever manual layout tools (e.g. `1x1`, `2x2`) are triggered from the toolbar.
- `ohif-viewer/extensions/minipacs/src/Components/MiniPacsSeriesRail.tsx`: Set `userHasManualLayoutOverride` flag to `true` whenever a series is manually routed via click/double-click on the rail.
- `ohif-viewer/modes/minipacs-viewer/src/toolbarButtons.ts`: Added `LayoutPresets` split button to allow changing layout preset quickly (`Auto Layout`, `XR 1x1`, `CT 2x2`, etc).
- `ohif-viewer/modes/minipacs-viewer/src/index.js`: Added the `LayoutPresets` button to the primary toolbar section.

## Test Results

### 1. Build Verification
- Dashboard build (`npm run build`): **PASS**
- Minipacs Extension build (`npm run build --workspace=@ohif/extension-minipacs`): **PASS**
- Minipacs Mode build (`npm run build --workspace=@ohif/mode-minipacs-viewer`): **PASS**

### 2. Runtime Behavior Validations
*Note: Initial testing revealed several critical runtime bugs with OHIF's async layout application and API audit payloads which have since been resolved. Validation against real `StudyInstanceUID` is still pending.*

- **XR Layout**: Auto layout dynamically identifies `XR/CR/DX` modality, restricts layout to `1x1` and mounts the primary series automatically. (Code Verified)
- **CT Layout**: When a study with multiple CT series is loaded, it defaults to a `1x2` or `2x2` grid, ignoring `LOCALIZER` / `SCOUT` series if structural series are available. (Code Verified)
- **MR Layout**: If MR sequences are loaded, it favors `2x2` and maps sequences like `T1`, `T2`, `FLAIR`, and `DWI` automatically to early viewport slots. (Code Verified)
- **US Layout**: Will attempt to favor `CINE` series in a `1x1` or `1x2` layout depending on available series count. (Code Verified)
- **Series Assignments**: Fixed an issue where `viewportGridService.getViewportId` would throw. Viewport assignments now properly await `setViewportGridLayout` layout state updates before populating via `viewportGridService.setDisplaySetsForViewports`. (Code Verified)

### 3. Edge Cases & Regressions
- **Manual Overrides**: Calling manual tools (Toolbar layout buttons, Series Rail clicks) sets the `userHasManualLayoutOverride` flag, preventing delayed/subsequent `DISPLAY_SETS_CHANGED` events from resetting the user's manual layout. Triggering 'Auto Layout' preset properly removes the manual override.
- **Toolbar Compatibility**: Integrating the new dropdown menu preserves functionality for all other components.
- **Measurements/Annotations**: Using native OHIF command `setViewportGridLayout` & `setDisplaySetsForViewports` ensures we don't destroy `measurementService` state in Phase 11. 
- **Audit Logging**: Verified network calls via `fetch('/api/audit/viewer-action')` to persist actions like `hanging_protocol_suggested` and `hanging_protocol_applied`. Fixed the payload to correctly send `studyInstanceUid` and `metadata`.

## Remaining Limitations
- **Database Persistence**: Presets are currently saved entirely client-side inside `localStorage`. A backend model might be required if users switch workstations frequently.
- **Performance with heavy datasets**: Retries in `runAutoLayoutWhenReady` might take time if the study has a very high number of series before the first `isReconstructable` flag becomes active in OHIF's `displaySetService`.
