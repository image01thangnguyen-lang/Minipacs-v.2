# MiniPACS Viewer Phase 7 - Viewer Persistence And Workflow Bridge Plan

Updated: 2026-06-28

## Entry Criteria

Phase 7 should start only after Phase 6 is stable:

- `/viewer/minipacs` opens the custom MiniPACS mode without a black screen.
- DICOM image, series rail, viewport overlays, mini toolbar, top toolbar, and left sidebar render together.
- Fullscreen/restore uses OHIF `toggleOneUp` and preserves viewport content.
- Snapshot/download opens the OHIF viewport download modal for the clicked viewport.
- Stack sync uses one shared `StackImageSync` state key across mini toolbar, sidebar, and top toolbar.
- Cine HUD uses `cineService.setCine(...)` for play/pause and does not call `toggleCine` as a play/pause command.
- Backend, advanced, and destructive actions remain disabled or guarded.
- Build checks pass:

```powershell
npm.cmd run build --workspace=@ohif/extension-minipacs
npm.cmd run build --workspace=@ohif/mode-minipacs-viewer
```

## Goal

Connect the custom viewer to MiniPACS workflow persistence while keeping image reading stable:

- Load study context from the MiniPACS backend when the viewer opens.
- Record lightweight viewer audit events.
- Save key-image metadata from the active viewport.
- Save snapshot metadata, and optionally a preview if a safe viewport capture path already exists.
- Show study/viewer history inside the custom viewer.
- Open the related report from the viewer through a backend-provided link.
- Prepare snapshot gallery and key-image gallery contracts for later phases.

Phase 7 should make backend-backed workflow actions useful, but it must not introduce destructive PACS operations.

## Non-Goals

Do not implement these in Phase 7:

- Delete study, series, instance, or image.
- Modify or upload DICOM objects.
- Report editor, report signing, or report final approval.
- Full export-video worker/backend.
- AI, advanced MPR, fusion, curved MPR, or mammography workflows.
- Replacing Cornerstone/OHIF viewport rendering.
- Changing `/viewer/minipacs` route behavior.
- Copying VRPACS source code or vendor assets.

## Implementation Strategy

Keep viewer-side workflow calls thin and fail-safe:

- Use OHIF services for viewport state and rendering behavior.
- Use MiniPACS extension services for backend calls.
- Do not block image viewing if any MiniPACS backend API fails.
- Convert all backend errors into short non-blocking command feedback toasts.
- Keep all destructive actions guarded.
- Prefer metadata persistence before attempting pixel/canvas persistence.

Avoid:

- Blocking `alert(...)` in viewer workflow paths.
- DOM scraping for patient/study metadata.
- Capturing canvas pixels without correct study/series/SOP/frame metadata.
- Saving incomplete or ambiguous key-image records.
- Running backend write calls from disabled menu items.

## Proposed Files

Add:

```text
ohif-viewer/extensions/minipacs/src/services/
  viewerApiClient.ts
  viewerContextService.ts
  viewerAuditService.ts
  viewerSnapshotService.ts
  viewerKeyImageService.ts
  viewerReportBridge.ts

ohif-viewer/extensions/minipacs/src/Components/
  MiniPacsHistoryPanel.tsx
  MiniPacsSnapshotGallery.tsx
  MiniPacsKeyImageDialog.tsx
```

Update:

```text
ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
ohif-viewer/extensions/minipacs/src/services/viewportStateAdapter.ts
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
ohif-viewer/extensions/minipacs/src/config/viewportWorkflowActions.ts
ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx
ohif-viewer/extensions/minipacs/src/Components/MiniPacsViewportOverflowMenu.tsx
ohif-viewer/extensions/minipacs/src/Components/MiniPacsSeriesContextMenu.tsx
ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx
```

## Backend APIs

Phase 7 can implement frontend calls against these contracts. If backend routes do not exist yet, add fail-safe placeholders and keep UI disabled or read-only until the API is available.

```text
GET  /api/viewer/studies/:studyInstanceUid/context
GET  /api/viewer/studies/:studyInstanceUid/history
GET  /api/viewer/studies/:studyInstanceUid/report-link

POST /api/viewer/snapshots
POST /api/viewer/studies/:studyInstanceUid/key-images
POST /api/audit/viewer-action
```

Suggested shared metadata payload:

```ts
type ViewerViewportMetadata = {
  studyInstanceUid: string;
  seriesInstanceUid?: string;
  sopInstanceUid?: string;
  frameNumber?: number;
  displaySetInstanceUID?: string;
  viewportId: string;
  imageIndex?: number;
  imageCount?: number;
  windowWidth?: number;
  windowCenter?: number;
  zoom?: number;
  pan?: { x: number; y: number };
  modality?: string;
  bodyPartExamined?: string;
  seriesDescription?: string;
  createdFrom: 'viewer-minipacs';
};
```

## Feature 1 - Viewer API Client

Create a small API wrapper for MiniPACS viewer calls.

Requirements:

- Use relative URLs so Docker/Nginx routing can proxy requests.
- Return typed-ish result objects instead of throwing through React event handlers.
- Include timeout/error handling where practical.
- Keep a single place to adjust base path later.

Suggested file:

```text
ohif-viewer/extensions/minipacs/src/services/viewerApiClient.ts
```

Acceptance:

- Backend unavailable does not crash the viewer.
- Callers receive `{ ok: false, message }` style results.
- Errors are routed to `commandFeedbackService`.

## Feature 2 - Study Context Service

Load MiniPACS study context when the viewer opens.

Context may include:

- Patient name, patient ID, accession number.
- Study status and report status.
- Assigned doctor or department.
- Existing report availability.
- Previous study count.
- Current user permissions.

Suggested implementation:

- Add `viewerContextService.ts`.
- Resolve `StudyInstanceUIDs` from route query.
- Fetch `GET /api/viewer/studies/:studyInstanceUid/context`.
- Store context in extension-local service state.
- Render non-critical context in the viewer header or a small info panel only if available.

Acceptance:

- Viewer still loads images when context API fails.
- Context loading has loading/empty/error states.
- No duplicate requests on every viewport render.

## Feature 3 - Viewer Audit Service

Record important viewer actions as fire-and-forget audit events.

Audit events:

- Viewer opened.
- Series selected or dropped into viewport.
- Layout changed.
- Fullscreen/restore toggled.
- Snapshot/download opened.
- Key image saved.
- History opened.
- Report link opened.
- Backend/guarded action attempted.

Suggested implementation:

- Add `viewerAuditService.ts`.
- Use `POST /api/audit/viewer-action`.
- Debounce or suppress noisy events such as frame scroll.
- Never block command execution on audit failure.

Acceptance:

- Audit API failure only shows debug log or non-blocking feedback when useful.
- No repeated audit spam while cine is playing or user scrolls stack frames.
- Audit payload includes study UID and action name when available.

## Feature 4 - Key Image Metadata Save

Enable the `KeyImage` action from the viewport overflow menu.

Requirements:

- Set clicked viewport active first.
- Collect viewport metadata from `viewportStateAdapter`.
- Ask for an optional note only if a simple non-blocking dialog already exists.
- Save via `POST /api/viewer/studies/:studyInstanceUid/key-images`.
- Show success/failure toast.

Do not:

- Save pixel data unless safe capture metadata is complete.
- Enable delete/unmark destructive flows yet.

Acceptance:

- Key image action is no longer backend-disabled when API exists or is mocked safely.
- Same SOP/frame cannot create uncontrolled duplicates. Prefer backend upsert or conflict handling.
- Failure does not break image viewing.

## Feature 5 - Snapshot Metadata Save And Gallery MVP

Keep OHIF download separate from MiniPACS persistence.

Two actions should be distinct:

- `Snapshot / Download`: opens OHIF download modal, already Phase 6 behavior.
- `Save Snapshot`: saves MiniPACS metadata, and optional preview if safely available.

Requirements:

- Add `viewerSnapshotService.ts`.
- Add a minimal `MiniPacsSnapshotGallery.tsx`.
- Show saved snapshots for the current study if backend returns them.
- Keep gallery read-only in Phase 7.

Acceptance:

- Existing OHIF download modal still works.
- Snapshot save includes study/series/SOP/frame metadata.
- Gallery has loading, empty, success, and error states.
- No database write happens from disabled buttons.

## Feature 6 - Study History Panel

Enable viewer-side history lookup.

Requirements:

- Add `MiniPacsHistoryPanel.tsx`.
- Call `GET /api/viewer/studies/:studyInstanceUid/history`.
- Show prior studies by date, modality, description, status, and report availability.
- Clicking a prior study can open a backend-provided viewer/report URL if present.

Do not:

- Auto-switch the current study without explicit user action.
- Query Orthanc/DICOMweb directly from the panel if backend API is intended to own history.

Acceptance:

- History panel opens from left sidebar or top/overflow workflow action.
- Empty state says there is no previous study.
- API failure does not affect current image reading.

## Feature 7 - Report Bridge

Open the report related to the current study.

Requirements:

- Add `viewerReportBridge.ts`.
- Call `GET /api/viewer/studies/:studyInstanceUid/report-link`.
- Open returned URL in the same app shell or a new tab depending on current dashboard convention.
- If no report exists, show a clear toast or open the create-report URL if backend returns one.

Do not:

- Build report editor inside OHIF in Phase 7.
- Sign/finalize reports from the viewer.

Acceptance:

- Report button gives useful feedback.
- Existing report opens correctly.
- Missing report does not crash or navigate to a blank page.

## Feature 8 - Cleanup Phase 6 Residue

Before Phase 7 work, clean up small Phase 6 leftovers:

- Remove unused `viewportLayoutState.ts` if no file imports it.
- Remove unused imports such as `runMiniPacsTool` from `MiniPacsCineHud.tsx` if no longer used.
- Replace any remaining blocking `alert(...)` in viewer command paths with `commandFeedbackService`.
- Keep disabled/backend/guarded actions visually disabled and non-clickable.

Acceptance:

- No unused Phase 6 files remain unless documented.
- No blocking alert is used for viewer workflow feedback.
- Build still passes after cleanup.

## Quality Bar

Functional checks:

- `/viewer/minipacs` opens without black screen.
- DICOM image renders.
- Series rail still routes series into viewports.
- Overlays and mini toolbar still render.
- Window/Level, Pan, Zoom, measurement tools still work.
- Fullscreen/restore still works.
- Snapshot/download modal still opens.
- Sync toggles remain visually consistent.
- Cine HUD still plays/pauses relevant stacks.
- Key image save returns success or safe failure feedback.
- History panel opens and handles empty/error states.
- Report bridge opens a valid link or shows useful feedback.
- Backend API failure never blocks image reading.

Build checks:

```powershell
npm.cmd run build --workspace=@ohif/extension-minipacs
npm.cmd run build --workspace=@ohif/mode-minipacs-viewer
```

Browser smoke check:

```text
http://localhost:8080/viewer/minipacs?StudyInstanceUIDs=1.2.840.113619.2.182.10808614472165.1782011637.895038
```

## Risks

- Backend routes may not exist yet; UI must degrade safely.
- Viewer route may not carry enough RIS/session context; API should use StudyInstanceUID as the minimum key.
- Snapshot pixel capture can be unsafe if metadata is incomplete.
- Key-image duplication can happen unless backend uses idempotent keys.
- History/report navigation can interrupt reading if it changes the current route unexpectedly.
- Audit can become noisy if hooked to high-frequency viewport events.

## Phase 7 Acceptance

Phase 7 is done when:

- Study context is fetched or safely failed.
- Audit events are recorded for important viewer actions without blocking.
- Key image save is implemented as metadata persistence.
- Snapshot save/gallery MVP is implemented or safely mocked behind backend availability.
- Study history panel works with loading/empty/error states.
- Report bridge opens backend-provided report links.
- No destructive action is enabled.
- Phase 6 viewer controls still work.
- Extension and mode builds pass.
- Browser smoke test passes on the known local study.

## Handoff Prompt

```text
You are continuing MiniPACS custom viewer implementation in Phase 7.

Repository:
D:\Antigravity\Minipacs-v.2

Read first:
- docs/VRPACS_TOOL_INVENTORY_PHASE1.md
- docs/MINIPACS_VIEWER_PHASE2_IMPLEMENTATION_PLAN.md
- docs/MINIPACS_VIEWER_PHASE3_HANDOFF_PROMPT.md
- docs/MINIPACS_VIEWER_PHASE4_SERIES_RAIL_PLAN.md
- docs/MINIPACS_VIEWER_PHASE5_VIEWPORT_OVERLAY_PLAN.md
- docs/MINIPACS_VIEWER_PHASE6_WORKFLOW_CONTROLS_PLAN.md
- docs/MINIPACS_VIEWER_PHASE7_VIEWER_PERSISTENCE_PLAN.md
- ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx
- ohif-viewer/extensions/minipacs/src/getCustomizationModule.ts
- ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
- ohif-viewer/extensions/minipacs/src/config/viewportWorkflowActions.ts
- ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
- ohif-viewer/extensions/minipacs/src/services/viewportStateAdapter.ts
- ohif-viewer/extensions/minipacs/src/services/commandFeedbackService.ts
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsViewportMiniToolbar.tsx
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsViewportOverflowMenu.tsx
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsSeriesRail.tsx

Do not revert user changes.
Do not change /viewer/minipacs routing.
Do not implement delete study/series/image.
Do not implement report signing/final approval inside OHIF.
Do not replace Cornerstone/OHIF viewport rendering.
Do not copy VRPACS source code or assets.

Goal:
Implement Phase 7 viewer persistence and workflow bridge:
- Viewer study context from backend.
- Fire-and-forget viewer audit.
- Key image metadata save.
- Snapshot metadata save and read-only gallery MVP.
- Study history panel.
- Report bridge through backend-provided report links.
- Cleanup Phase 6 leftovers such as unused imports/files and blocking alert feedback.

Required behavior:
- Backend failure must never black-screen or block image viewing.
- All workflow messages must use non-blocking viewer feedback.
- Key image and snapshot saves must include study/series/SOP/frame/viewport metadata when available.
- Existing Phase 6 fullscreen, snapshot download, sync, cine, overlays, and series rail must keep working.
- Destructive actions must remain disabled or guarded.

Suggested files to add:
- ohif-viewer/extensions/minipacs/src/services/viewerApiClient.ts
- ohif-viewer/extensions/minipacs/src/services/viewerContextService.ts
- ohif-viewer/extensions/minipacs/src/services/viewerAuditService.ts
- ohif-viewer/extensions/minipacs/src/services/viewerSnapshotService.ts
- ohif-viewer/extensions/minipacs/src/services/viewerKeyImageService.ts
- ohif-viewer/extensions/minipacs/src/services/viewerReportBridge.ts
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsHistoryPanel.tsx
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsSnapshotGallery.tsx
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsKeyImageDialog.tsx

Backend contracts:
- GET  /api/viewer/studies/:studyInstanceUid/context
- GET  /api/viewer/studies/:studyInstanceUid/history
- GET  /api/viewer/studies/:studyInstanceUid/report-link
- POST /api/viewer/snapshots
- POST /api/viewer/studies/:studyInstanceUid/key-images
- POST /api/audit/viewer-action

Verification:
- npm.cmd run build --workspace=@ohif/extension-minipacs
- npm.cmd run build --workspace=@ohif/mode-minipacs-viewer
- Open /viewer/minipacs with the known StudyInstanceUID.
- Confirm DICOM image, series rail, overlays, mini toolbar, sync, cine, and snapshot download still work.
- Confirm key-image save, snapshot save/gallery, history panel, report bridge, and audit fail safely.

Stop after Phase 7. Do not start delete workflows, report signing, export-video backend, AI, or advanced MPR/fusion.
```
