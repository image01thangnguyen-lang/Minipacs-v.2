# MiniPACS Viewer Phase 3 Handoff Prompt

Use this prompt with another coding AI when you want it to continue implementation from the current Phase 2 plan.

```text
You are a coding agent working in the MiniPACS repository.

Workspace:
- Windows repo path: D:\Antigravity\Minipacs-v.2
- Docker/WSL runtime path used by the user: /home/thang/Minipacs-v.2

Important constraints:
- Do not revert user changes.
- The worktree may already be dirty. Treat existing changes as user work unless you clearly made them.
- Do not implement backend APIs yet unless explicitly asked.
- Do not copy VRPACS source/assets. Recreate equivalent behavior using our own OHIF/Cornerstone implementation.
- Keep the viewer route as /viewer/minipacs.
- Stop after Phase 3 unless the user asks to continue.

Read these files first:
- docs/VRPACS_TOOL_INVENTORY_PHASE1.md
- docs/MINIPACS_VIEWER_PHASE2_IMPLEMENTATION_PLAN.md
- ohif-viewer/extensions/minipacs/src/getLayoutTemplateModule.tsx
- ohif-viewer/extensions/minipacs/src/Components/CustomTopToolbar.tsx
- ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx

Current verified state:
- The custom viewer route works at:
  http://localhost:8080/viewer/minipacs?StudyInstanceUIDs=1.2.840.113619.2.182.10808614472165.1782011637.895038
- It renders the custom MiniPACS shell with header PACS VIEWER.
- A DICOM canvas renders in the viewport.
- Console had no blocking errors during the last check, only a non-blocking i18n warning.

Goal for Phase 3:
Implement the registry-driven tool architecture, but do not move on to full series rail/backend workflow yet.

Phase 3 tasks:
1. Create:
   - ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
   - ohif-viewer/extensions/minipacs/src/config/windowLevelPresets.ts
   - ohif-viewer/extensions/minipacs/src/services/commandBridge.ts

2. In minipacsToolRegistry.ts:
   - Define MiniPacsToolStatus, MiniPacsToolPlacement, MiniPacsTool, and MiniPacsToolSection types.
   - Encode the VRPACS tool order from docs/VRPACS_TOOL_INVENTORY_PHASE1.md.
   - Include placements for top-toolbar, left-panel, viewport-toolbar, and series-menu.
   - Mark tools with statuses:
     ready, ui-state, ohif-service, backend, advanced, guarded.
   - Mark destructive tools such as Delete series as destructive/guarded.

3. In windowLevelPresets.ts:
   - Add presets observed from VRPACS:
     Default, Brain F1, Subdural F2, Stroke F3, Temporal bones F4, Soft tissues F6, Lung F7, Mediastinum F8, Abdomen soft tissues F9, Liver F10, Spine soft tissues, Spine bone.
   - Include width/level where known:
     Lung 1200/-600 from VRPACS dropdown; keep existing MiniPACS values for presets already implemented if a better value is not known.

4. In commandBridge.ts:
   - Export a runMiniPacsTool function.
   - It should receive servicesManager, commandsManager, the tool item, and optional state callbacks.
   - For ready Cornerstone tools, call toolbarService.recordInteraction first and fallback to commandsManager.runCommand.
   - For one-shot actions, call commandsManager.runCommand(commandName, commandOptions, context).
   - For tools with backend/advanced/guarded status that are not implemented, do not pretend success. Return a structured result like { ok: false, reason: 'not_implemented' } so UI can show disabled/future state.
   - Do not add destructive behavior.

5. Refactor CustomTopToolbar.tsx:
   - Remove local duplicated topTools array.
   - Render tools from minipacsToolRegistry filtered by placement top-toolbar.
   - Keep existing styling and active/toggled behavior where possible.
   - Use the command bridge for click handling.
   - Preserve title/tooltips.

6. Refactor CustomToolsSidebar.tsx:
   - Remove local duplicated toolSections array.
   - Render sections from minipacsToolRegistry filtered by placement left-panel.
   - Keep the accordion UI and current dark teal styling.
   - Keep existing icon components for now. Add fallback icons when a registry icon is not mapped.
   - Disabled/not-yet-implemented tools should be visibly disabled or have a tooltip, but should not crash.

7. Keep the layout stable:
   - Do not change route config.
   - Do not change docker/nginx/dashboard code.
   - Do not change patient data or DICOM data.

8. Verification:
   - Run TypeScript/build check if available and reasonably fast.
   - If a dev server/container is running, verify:
     http://localhost:8080/viewer/minipacs?StudyInstanceUIDs=1.2.840.113619.2.182.10808614472165.1782011637.895038
   - Confirm the page still renders PACS VIEWER and the DICOM canvas.
   - Confirm toolbar/sidebar render from the registry and no blocking console errors appear.

Expected deliverable:
- Code changes only for Phase 3 registry + command bridge + toolbar/sidebar refactor.
- A short summary of files changed and verification performed.
- Stop before implementing MiniPacsSeriesRail, viewport overlay rewrite, backend APIs, capture/gallery, report, export video, or advanced MPR tools unless the user explicitly asks.
```
