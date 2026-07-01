# MiniPACS 100+ Tools - Phase 1 Web-Only Implementation Plan

Updated: 2026-07-01

## 1. Decision

Phase 1 is web-only. Do not build Electron, Tauri, desktop companion, TWAIN/WIA scanner bridge, CD burner, local folder watcher, or native DICOM print client in this phase.

The goal is to make the current OHIF v3.7 based MiniPACS viewer feel like a usable PACS workstation for daily 2D review, while keeping the architecture clean for later Cornerstone3D custom tools and VTK/MPR work.

## 2. Phase 1 Goal

By the end of Phase 1, a user can:

- Search/filter a worklist.
- Open a study from worklist into the MiniPACS OHIF viewer.
- Use a workstation-style toolbar and left tool panel.
- Navigate series/images reliably.
- Switch common viewport layouts.
- Use core 2D viewer operations: select, pan, zoom, window/level, fit, reset, stack scroll, cine where supported.
- Apply window presets.
- Inspect DICOM metadata.
- Open a report shell/context for the current study.
- Use browser-safe capture/print placeholders where feasible.
- See unsupported native/advanced tools clearly disabled or deferred, not broken.

## 3. Baseline In Current Repo

Relevant code already exists and should be used as the starting point:

- Worklist UI/API: `dashboard/app/worklist`
- Viewer route/context APIs: `dashboard/app/api/viewer`
- OHIF custom mode: `ohif-viewer/modes/minipacs-viewer`
- OHIF custom extension: `ohif-viewer/extensions/minipacs`
- Tool registry candidate: `ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts`
- Custom toolbar/sidebar components:
  - `ohif-viewer/extensions/minipacs/src/Components/CustomTopToolbar.tsx`
  - `ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx`
  - `ohif-viewer/extensions/minipacs/src/Components/MiniPacsSeriesRail.tsx`
  - `ohif-viewer/extensions/minipacs/src/Components/MiniPacsViewportMiniToolbar.tsx`
  - `ohif-viewer/extensions/minipacs/src/Components/MiniPacsOverlayItems.tsx`
- Viewer services:
  - `viewerContextService`
  - `viewerAuditService`
  - `viewerDiagnosticsService`
  - `viewerHangingProtocolService`
  - `layoutPresetService`
  - `seriesAdapter`
  - `seriesClassificationAdapter`
  - `commandBridge`
  - `commandFeedbackService`

Phase 1 should consolidate and harden these pieces rather than start a parallel viewer implementation.

## 4. Phase 1 Scope

### 4.1 In Scope

Worklist and study entry:

- Search Filter Wizard, simplified as advanced worklist filters.
- View: open normal viewer.
- View to dictate: web-only study lock/read-status transition, no audio dictation yet.
- KO / key object entry point: show placeholder or existing key image panel if available; full KO DICOM object persistence is later.
- Hide folders/custom folder: web-only UI grouping/filtering, not local filesystem folders.
- Settings: web app user/viewer preferences.
- HP: basic hanging protocol/layout preset selector.
- External link: HTTP/HTTPS links only.

Basic viewer titlebar and toolbar:

- View Type selector: 2D stack first; MPR/VR entries visible only as disabled/deferred if not ready.
- Cell Layout: 1x1, 1x2, 2x1, 2x2, 3x3; optional custom selector can be planned but not mandatory.
- Image Number: current frame/image index display and jump-to-image if cheap to implement.
- Windowing Preset: default/head/chest/abdomen/spine presets.
- Apply All: apply basic viewport changes to current display set group where OHIF supports it.
- Crosslink/reference line: enable only if available through current OHIF/Cornerstone services; otherwise mark deferred.
- Display Set Layout: basic layout preset per modality.
- Related Exam: read-only previous studies list if backend context API supports it; otherwise placeholder.
- Series List: series rail/list from DICOMweb/OHIF display sets.
- Report Viewer: open existing report workspace/shell.

Core 2D tools:

- Selector.
- Pan.
- Zoom.
- Windowing.
- Magnification if current Cornerstone tool is registered.
- Fit.
- Reset.
- 100% Zoom / Actual Size if existing viewport APIs and pixel spacing make it reliable; otherwise defer with disabled state.
- Stack scroll.
- Cine for multiframe/stack data where OHIF supports it.
- Print through browser print only.
- DICOM Info / tag viewer.
- About / diagnostics.

Capture, safe subset:

- Capture current viewport image, if current implementation can do it without native APIs.
- Capture as shown can be a Phase 1 stretch goal.
- Capture monitor/all screens/global capture are explicitly out of Phase 1 because browser support is permission-bound and not PACS-workstation reliable.

### 4.2 Out Of Scope

Native/Desktop/hardware features:

- CD Burn.
- Scan Doc through scanner.
- Open local folder / local folder watcher.
- Send Local DICOM from arbitrary filesystem folder.
- Execute external 3D application such as Xelis.
- Window minimize/resize/exit as desktop controls.
- Direct DICOM film print.
- Multi-monitor capture/all screens/global capture.
- Dictation hardware/audio workflow beyond study lock/status shell.
- D.gate/TFS/vendor-specific deep integration unless already exposed as normal HTTPS API.

Advanced imaging:

- 3D VR.
- 3DMPR production workflow.
- MIP production workflow.
- Curved MPR / freehand MPR / virtual endoscopy.
- 3D sculpt/crop/VOI object editing.
- Custom clinical measurement packages such as CT ratio, LLD, spine balance, acetabular angle, cardiothoracic tools.
- DICOM SR authoring/export as the authoritative persistence format.
- GSPS/KO full DICOM persistence.

These are Phase 2+ or Phase 3+ depending on complexity.

## 5. Tool Classification For Phase 1

| Bucket | Tools | Phase 1 action |
| --- | --- | --- |
| Ready/OHIF command | Selector, Pan, Zoom, Windowing, Fit, Reset, Stack Scroll, Cine, basic window presets, DICOM Info | Wire through toolbar/registry and verify command behavior. |
| OHIF service/config | Cell Layout, Display Set Layout, Image Number, Series List, HP/basic hanging protocol, Apply All basic, Crosslink/ref line where supported | Use `ViewportGridService`, `DisplaySetService`, `HangingProtocolService`, `CineService`, `ToolbarService`, `commandsManager`. |
| MiniPACS UI/backend | Search Filter Wizard, View, View to dictate lock shell, Related Exam, Report Viewer, Settings, About/Diagnostics, audit events | Use dashboard APIs, viewer context APIs, React panels, and existing MiniPACS services. |
| Browser-safe stretch | Capture current viewport, browser print, export visible image | Implement only if it can be done without native APIs and with clear browser permission behavior. |
| Deferred/native | CD Burn, Scan Doc, Open folder, Send Local DICOM folder, Direct Print, Execute 3D app, Minimize/Resize/Exit | Keep hidden or disabled with reason: "Requires native integration; not in Phase 1." |
| Deferred/advanced imaging | VR, MPR production, MIP, sculpt, curved MPR, virtual endoscopy, custom orthopedic/cardiac measurements | Keep in registry as advanced/deferred so UI does not promise unavailable behavior. |

## 6. Architecture Approach

### 6.1 Extension-first

Do not patch OHIF core unless absolutely unavoidable. Implement through:

- Custom OHIF mode: `ohif-viewer/modes/minipacs-viewer`
- Custom OHIF extension: `ohif-viewer/extensions/minipacs`
- Toolbar module / custom toolbar component.
- Panel module / left tool panel.
- Commands module for MiniPACS commands.
- Existing OHIF services from `servicesManager`.

### 6.2 Registry-driven tools

All visible Phase 1 tools should be declared in `minipacsToolRegistry.ts` with:

- `id`
- `label`
- `type`
- `commandName`
- `commandOptions`
- `context`
- `status`
- `placement`
- `section`
- optional `requires`
- optional `destructive`
- optional `phase`

Recommended Phase 1 status values:

- `ready`: wired and verified.
- `ohif-service`: requires OHIF service call, not raw DOM.
- `backend`: requires MiniPACS API.
- `deferred-native`: not web-only.
- `deferred-advanced`: later imaging phase.
- `guarded`: risky/destructive admin action.

If adding new status strings is too invasive, map them to existing values but keep the deferred reason in metadata.

### 6.3 Command bridge

Use a MiniPACS command bridge for:

- Translating registry tool IDs to OHIF command names.
- Detecting unsupported tools and showing a controlled toast.
- Recording audit events.
- Avoiding silent no-op buttons.

Minimum rule: every visible button either performs the action, is disabled, or shows a clear "not in Phase 1" message.

### 6.4 Web-only limitations

For Phase 1, prefer:

- HTTPS APIs.
- DICOMweb through Orthanc/PACS gateway.
- Browser print.
- Browser file upload only if explicitly scoped.
- Browser local storage/server-side preferences.

Avoid:

- Filesystem polling.
- Native scanner APIs.
- Burning media.
- Launching `.exe`.
- Controlling OS windows.

### 6.5 Icon and tool visual language

Phase 1 tools must use icons that fit the current MiniPACS/OHIF interface and are quickly understandable at a glance. The goal is not decorative icons; the goal is fast clinical recognition.

Guidelines:

- Reuse the existing OHIF/MiniPACS icon system first. Do not introduce a second visual style unless a tool has no suitable existing icon.
- Use simple, high-contrast, single-purpose symbols: hand for pan, magnifier for zoom, sun/contrast for windowing, ruler for length, angle mark for angle, grid for layout, tag/info for DICOM metadata, document/report for report.
- Keep icon geometry consistent: same visual weight, same viewbox size, same padding, and same active/disabled states across toolbar, left panel, and viewport mini toolbar.
- Avoid text-only buttons for core tools when a familiar visual symbol exists.
- For advanced or deferred tools, use muted/disabled styling plus tooltip text. Do not make unavailable tools look operational.
- Do not copy vendor icon assets from the reference screenshots. Create equivalent MiniPACS icons or use existing project/OHIF icons.
- Tooltips must include the tool name and short clinical action, for example `Windowing - adjust brightness/contrast`.
- Icon meaning should be validated during QA: a new user should be able to infer the main action without reading long instructions.

Implementation notes:

- Prefer existing OHIF icon identifiers when available.
- For dashboard-side controls, follow the current app's `lucide-react` style if the control is outside OHIF.
- For custom OHIF viewer icons, keep assets as small SVG components or icon mappings inside the MiniPACS extension, not scattered through unrelated components.
- Add new icon names to the tool registry metadata so toolbar/sidebar rendering remains registry-driven.

## 7. Work Packages

### WP1 - Phase 1 audit and source-of-truth registry

Owner: Tech Lead + FE

Goal: one registry defines all Phase 1 visible/deferred tools.

Tasks:

- Review current `minipacsToolRegistry.ts`.
- Add missing Phase 1 tools from the 100+ list.
- Add phase/deferred metadata if needed.
- Normalize labels into consistent English/internal IDs.
- Map each Phase 1 tool to one of:
  - OHIF command.
  - MiniPACS command.
  - Backend action.
  - Disabled/deferred.
- Mark native desktop tools as deferred-native.
- Mark MPR/VR/sculpt/advanced measurement as deferred-advanced.

Deliverables:

- Updated registry.
- Tool mapping table in docs or in code comments near registry.
- No visible button without known status.
- Icon mapping table for Phase 1 visible tools.

Acceptance:

- Top toolbar and left sidebar render from the registry.
- Unsupported tools do not look broken or clickable without feedback.
- Destructive/admin tools are guarded or hidden.
- Phase 1 icons are visually consistent with the current MiniPACS/OHIF UI.

### WP2 - Worklist filter and study open workflow

Owner: Full-stack

Goal: stable entry from worklist to viewer.

Tasks:

- Harden Search Filter Wizard as worklist filters:
  - Patient name/ID.
  - Accession number.
  - Modality.
  - Study status.
  - Date range.
  - Priority.
- Add/reset filter UX.
- Confirm `View` opens `/viewer/minipacs?StudyInstanceUIDs=...`.
- Implement `View to dictate` as:
  - set study/read status to `READING` or equivalent;
  - create audit event;
  - open viewer;
  - no audio recording in Phase 1.
- Keep `View with T volume images` hidden or disabled unless it maps safely to existing viewer mode.
- Related Exam endpoint/UI read-only if backend has patient history data.

Deliverables:

- Worklist filters usable.
- Viewer opens consistently from a worklist row.
- Audit event for open/view-to-dictate if audit service is available.

Acceptance:

- User can filter by modality/date/status and open a study.
- Direct viewer URL still works.
- Study with missing/invalid UID fails gracefully.
- No native desktop assumptions.

### WP3 - Viewer shell, top toolbar, and left panel

Owner: FE/OHIF

Goal: workstation-like shell for Phase 1 tools.

Tasks:

- Confirm `CustomTopToolbar` consumes registry or align it to registry.
- Confirm `CustomToolsSidebar` consumes registry sections.
- Group Phase 1 controls:
  - Workstation/navigation.
  - Layout.
  - Windowing.
  - Core image tools.
  - Series/report/info.
  - Deferred tools section if needed.
- Provide active tool state.
- Provide command feedback toast/status.
- Add basic hotkeys only for verified commands:
  - W Window/Level.
  - Z Zoom.
  - P Pan.
  - S Stack Scroll.
  - R Reset.
  - F Fit/fullscreen only if reliable.
  - Space Cine only when supported.
  - 1/2/3/4 layout presets.

Deliverables:

- Clean Phase 1 toolbar and sidebar.
- Disabled/deferred state for out-of-scope items.
- Feedback for successful/failed command invocation.

Acceptance:

- No toolbar button causes an uncaught JS error.
- Active tool state is visible.
- Buttons fit on common desktop viewport widths.
- Hotkeys ignore input/textarea/contenteditable focus.

### WP4 - Core Cornerstone/OHIF 2D commands

Owner: OHIF/Cornerstone developer

Goal: basic viewing tools behave reliably.

Tasks:

- Verify tool group registration for:
  - Selector/Cursor.
  - Pan.
  - Zoom.
  - WindowLevel.
  - StackScroll.
  - Magnify.
  - Reset.
  - Cine.
- Verify commands in `toolbarButtons.ts` and extension command modules.
- Add MiniPACS wrappers only where command names/options differ.
- Avoid DOM-click command hacks for final Phase 1 behavior.
- Add friendly error when a command is unavailable.

Deliverables:

- Command mapping table.
- Updated command bridge if needed.
- Core tool smoke tests/manual QA script.

Acceptance:

- Pan, Zoom, W/L, Stack Scroll, Fit, Reset work on CT/MR/US/DX where applicable.
- Cine only appears/enables on suitable data.
- Magnify is either working or disabled with reason.

### WP5 - Layout, series rail, and basic hanging protocol

Owner: OHIF developer

Goal: users can move through series and common layouts.

Tasks:

- Verify `MiniPacsSeriesRail` uses OHIF display sets, not fragile DOM scraping.
- Ensure active series/viewport state is clear.
- Implement layout presets:
  - 1x1.
  - 1x2.
  - 2x1.
  - 2x2.
  - 3x3 optional.
- Add basic modality defaults:
  - DX/CR/XR: 1x1.
  - US: 1x1 or 1x2 depending number of series.
  - CT/MR: 1x1 first; 2x2 optional if multiple display sets.
- Use `ViewportGridService` and `HangingProtocolService` where feasible.
- Preserve current image/tool state as much as OHIF permits during layout changes.
- Add image index display and optional jump-to-image field if straightforward.

Deliverables:

- Layout preset commands.
- Series rail selection.
- Basic HP/default layout rules.

Acceptance:

- Study opens with deterministic default layout.
- User can switch layouts without blanking all viewports.
- Series list shows modality, description, image count when available.
- Active viewport/series is visually clear.

### WP6 - Window presets, apply-all, and sync-lite

Owner: OHIF developer

Goal: daily windowing workflow is fast.

Tasks:

- Normalize preset list:
  - Default.
  - Brain.
  - Subdural.
  - Stroke.
  - Temporal bone.
  - Lung.
  - Mediastinum.
  - Abdomen soft tissue.
  - Liver.
  - Bone/spine.
- Map presets to `setWindowLevel`.
- Add modality/body-part grouping if UI already supports it.
- Implement Apply All for windowing/zoom/pan only where service support is reliable.
- Reference line/crosslink only if current OHIF services are wired; otherwise mark deferred.

Deliverables:

- Preset menu.
- Apply-all behavior documented.
- Disabled state for unsupported sync modes.

Acceptance:

- Presets apply immediately to active viewport.
- Apply All does not corrupt unrelated studies/viewports.
- Unsupported sync/crosslink actions are not silently broken.

### WP7 - Report, DICOM info, settings, about, diagnostics

Owner: Full-stack + FE

Goal: Phase 1 viewer has clinical workflow hooks without overbuilding.

Tasks:

- Report Viewer opens existing report route/workspace for current `StudyInstanceUID`.
- DICOM Info opens tag viewer or existing OHIF DICOM tag dialog.
- Settings opens web user/viewer preferences:
  - default layout.
  - preferred window presets.
  - toolbar density if already implemented.
  - show/hide overlay options if available.
- About shows version/build/environment.
- Diagnostics shows backend/DICOMweb/auth health if existing endpoint supports it.
- External link supports configured HTTPS links only.

Deliverables:

- Report shell entry.
- DICOM info entry.
- Settings/about/diagnostics entries.

Acceptance:

- Each workflow button opens a real panel/modal/page or is disabled with reason.
- No native app launch behavior.
- Links are sanitized/allowlisted.

### WP8 - Browser-safe capture and print

Owner: FE/OHIF

Goal: provide useful capture/print without native promises.

Tasks:

- Confirm existing snapshot/capture implementation.
- Implement current viewport capture if available through canvas/viewport APIs.
- Save snapshot to backend only if current API exists and is stable.
- Browser print opens a print-friendly image/report view where possible.
- Mark all monitor/all-screen/global capture variants as deferred-native or deferred-browser-permission.

Deliverables:

- Current viewport capture, or explicit deferral if not technically reliable.
- Browser print action.
- Deferred labels for advanced capture variants.

Acceptance:

- Capture either creates a usable image/snapshot or clearly explains not implemented in Phase 1.
- Browser print does not depend on DICOM film printer.
- No multi-monitor/native capture claims.

### WP9 - QA, performance, and release hardening

Owner: QA + Tech Lead

Goal: Phase 1 is deployable as a safe web viewer increment.

Tasks:

- Prepare test dataset matrix:
  - DX/CR single image.
  - US single and multiframe if available.
  - CT stack.
  - MR stack.
  - Study with multiple series.
  - Study with missing metadata.
- Manual QA scripts:
  - Worklist filter/open.
  - Core tools.
  - Layout switch.
  - Series selection.
  - Window presets.
  - Report/DICOM info.
  - Disabled tools behavior.
- Browser matrix:
  - Chrome current.
  - Edge current.
- Performance checkpoints:
  - initial viewer open time.
  - CT stack scroll responsiveness.
  - memory growth after study switch.
- Error logging:
  - command failures.
  - DICOMweb failures.
  - missing metadata.

Deliverables:

- Phase 1 QA report.
- Known limitations list.
- Go/no-go release note.

Acceptance:

- No critical JS console errors during smoke test.
- No blank viewer for valid study.
- Disabled native/advanced tools are clearly marked.
- Worklist -> viewer -> basic read workflow succeeds.

## 8. Suggested 6-Week Timeline

| Week | Focus | Output |
| --- | --- | --- |
| Week 1 | Audit + registry | Final Phase 1 tool map, deferred list, command/service inventory. |
| Week 2 | Worklist + viewer entry | Search filters hardened, open/view-to-dictate web workflow, route validation. |
| Week 3 | Toolbar/sidebar + core commands | Registry-driven shell, active tool state, Pan/Zoom/WL/Scroll/Fit/Reset verified. |
| Week 4 | Layout + series + HP-lite | 1x1/1x2/2x1/2x2, series rail, default modality layout, image index. |
| Week 5 | Presets + report/info/settings + capture/print | Window presets, report shell, DICOM info, browser-safe capture/print decision. |
| Week 6 | QA + hardening + release | Test matrix complete, bugs fixed, release note and limitations. |

If team capacity is small, split Phase 1 into 1A and 1B:

- Phase 1A: worklist, viewer entry, core toolbar, core tools, layout 1x1/1x2/2x2.
- Phase 1B: report/info/settings, related exam, apply-all/sync-lite, capture/print, broader QA.

## 9. Backlog

| ID | Task | Area | Priority | Notes |
| --- | --- | --- | --- | --- |
| P1-001 | Audit current MiniPACS mode/extension command paths | Foundation | P0 | Confirm command names before wiring. |
| P1-002 | Add/normalize Phase 1 tool metadata in registry | Foundation | P0 | Include deferred-native and deferred-advanced reasons. |
| P1-003 | Render top toolbar from registry or reconcile static toolbar with registry | UI | P0 | Avoid duplicate source of truth. |
| P1-004 | Render left panel sections from registry | UI | P0 | Layout, tools, series/report/info groups. |
| P1-005 | Implement disabled/deferred button state and toast | UX | P0 | No silent no-op buttons. |
| P1-006 | Harden worklist filters | Worklist | P0 | Patient/date/modality/status/accession. |
| P1-007 | Validate viewer launch URL from worklist | Worklist | P0 | `/viewer/minipacs?StudyInstanceUIDs=...`. |
| P1-008 | Implement View to dictate as read-lock/status shell | Workflow | P1 | No audio dictation. |
| P1-009 | Wire Selector/Pan/Zoom/WL/StackScroll | Core tools | P0 | OHIF/Cornerstone commands. |
| P1-010 | Wire Fit/Reset/Magnify/Cine safely | Core tools | P0 | Cine data-dependent. |
| P1-011 | Add command failure feedback/audit | Core tools | P1 | Use command feedback service. |
| P1-012 | Implement layout preset commands | Layout | P0 | 1x1, 1x2, 2x1, 2x2. |
| P1-013 | Verify series rail display set source | Series | P0 | Avoid DOM scraping. |
| P1-014 | Add active viewport/series styling | Series/Layout | P1 | Workstation clarity. |
| P1-015 | Add image index display | Viewport | P1 | Jump-to-image stretch. |
| P1-016 | Add modality default layout rules | HP-lite | P1 | DX/CR, US, CT/MR. |
| P1-017 | Normalize window preset list | Windowing | P0 | Brain/lung/abdomen/bone etc. |
| P1-018 | Implement Apply All for safe viewport properties | Windowing | P1 | Window/zoom/pan only if reliable. |
| P1-019 | Gate crosslink/reference line by service availability | Sync | P1 | Do not fake state. |
| P1-020 | Wire Report Viewer/workspace entry | Workflow | P0 | Current study context. |
| P1-021 | Wire DICOM Info/tag viewer | Workflow | P0 | OHIF tag viewer preferred. |
| P1-022 | Wire Settings/About/Diagnostics | Workflow | P1 | Web-only settings. |
| P1-023 | Decide capture current viewport implementation | Capture | P1 | Implement or explicitly defer. |
| P1-024 | Browser print action | Print | P2 | Not DICOM film print. |
| P1-025 | QA dataset and script | QA | P0 | DX/CR/US/CT/MR smoke. |
| P1-026 | Browser matrix QA | QA | P1 | Chrome + Edge. |
| P1-027 | Release notes and limitation banner/doc | Release | P0 | Explicit no desktop/native. |
| P1-028 | Define and QA Phase 1 icon mapping | UI/UX | P0 | Icons must match current system and be recognizable at a glance. |

## 10. Phase 1 Milestones

### M1 - Tool Map Locked

Exit criteria:

- Phase 1 included/deferred tool list is approved.
- Registry has all Phase 1 tool IDs.
- Native and advanced tools are clearly deferred.

### M2 - Worklist To Viewer Flow

Exit criteria:

- Search/filter works.
- View opens current study.
- View-to-dictate locks/statuses study in web workflow or is disabled with reason.

### M3 - Core Viewer Controls

Exit criteria:

- Pan/Zoom/WL/Scroll/Fit/Reset work.
- Window presets work.
- No visible core tool is a silent no-op.

### M4 - Layout And Series Navigation

Exit criteria:

- 1x1/1x2/2x1/2x2 switch.
- Series rail/list works.
- Active viewport/series is clear.

### M5 - Workflow Hooks

Exit criteria:

- Report Viewer opens.
- DICOM Info opens.
- Settings/About/Diagnostics are wired or cleanly disabled.
- Capture/print decision implemented and documented.

### M6 - Phase 1 Pilot Release

Exit criteria:

- QA matrix passed.
- Known limitations documented.
- Release candidate deployable.

## 11. Acceptance Criteria

Functional:

- Worklist can filter and open a valid study.
- Viewer loads valid DICOMweb study without blank viewport.
- Core tools work on active viewport.
- Layout changes do not crash the viewer.
- Series rail/list allows user to navigate series.
- Window presets apply to active viewport.
- Unsupported native/advanced tools are not exposed as working tools.

Clinical workflow:

- User can open report context from viewer.
- User can inspect DICOM tags.
- User can identify current patient/study/series/image position.
- User can return to worklist/dashboard safely.
- User can recognize core tool purpose from icon + tooltip without reading external documentation.

Technical:

- No Electron/desktop dependency.
- No native scanner/CD/local-folder behavior.
- No OHIF core fork unless approved.
- No uncaught runtime errors in normal smoke test.
- Commands use OHIF/Cornerstone services rather than DOM-click hacks.

QA:

- Smoke test on Chrome and Edge.
- Test at least DX/CR, US, CT, MR.
- Test missing metadata fallback.
- Test disabled/deferred tool behavior.
- Visual QA verifies icon consistency, active/disabled states, and tooltip clarity.

## 12. Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| OHIF command names differ from assumptions | Broken tools | Audit command modules before wiring; use command bridge feedback. |
| Registry and UI drift apart | Duplicate bugs | Make registry the source of truth for visible tool state. |
| Series rail relies on fragile DOM | Breaks after OHIF update | Use `DisplaySetService`/metadata, not DOM scraping. |
| Browser cannot support native workstation features | User confusion | Hide/disable native tools with explicit reason. |
| Large CT/MR stack performance | Slow viewer | Measure open/scroll time; defer volume/MPR work. |
| Apply All/sync corrupts unrelated viewports | Clinical risk | Limit to verified viewport group; add QA cases. |
| Existing docs say later phases are complete | Planning confusion | Treat this document as the new web-only Phase 1 for the 100+ tools program. |

## 13. Phase 1 Not-To-Do List

Do not:

- Build desktop app.
- Integrate scanner.
- Burn CD/DVD.
- Launch external `.exe` viewer.
- Implement native local folder watcher.
- Promise DICOM film print.
- Implement VR/MPR/sculpt/virtual endoscopy as production tools.
- Build custom clinical measurement packages.
- Store fake GSPS/SR/KO objects without validated DICOM mapping.
- Leave placeholder buttons that look operational.

## 14. Handoff To Phase 2

Phase 2 should start only after Phase 1 pilot release is stable.

Recommended Phase 2 themes:

- Measurement and annotation expansion.
- Persistence for key image, snapshot, measurement, and basic annotation.
- GSPS/KO/SR strategy decision.
- More robust capture/export.
- Advanced 2D image operations such as shutter, filters, pseudo color.
- Deeper reporting workflow.

Phase 3+ can then take MPR/MIP/VR, VTK.js, 3D tools, and external integrations as separate tracks.

## 15. Prompt For Another AI Implementation Agent

Use the following prompt when assigning Phase 1 implementation work to another AI coding agent.

### Copy Prompt

Most Markdown viewers show a copy button on the code block below. Copy the full block when handing this work to another AI agent.

```text
You are a Senior Technical Project Manager and Tech Lead for a MiniPACS system based on OHIF Viewer v3.7, Cornerstone3D, and a Next.js dashboard.

Your task is to implement Phase 1 of the MiniPACS 100+ tools roadmap in this repository.

Read this plan first:
- docs/MINIPACS_100_TOOLS_PHASE1_WEB_ONLY_PLAN.md

Important decision:
- Phase 1 is web-only.
- Do not build Electron, Tauri, desktop companion, scanner integration, CD burn, local folder watcher, native DICOM film print, external .exe launcher, or OS window controls.
- Native/hardware/desktop tools must be hidden, disabled, or clearly marked as deferred.

Repository areas to inspect before coding:
- dashboard/app/worklist
- dashboard/app/api/viewer
- ohif-viewer/modes/minipacs-viewer
- ohif-viewer/extensions/minipacs
- ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
- ohif-viewer/extensions/minipacs/src/Components/CustomTopToolbar.tsx
- ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsSeriesRail.tsx
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsViewportMiniToolbar.tsx
- ohif-viewer/extensions/minipacs/src/Components/MiniPacsOverlayItems.tsx
- ohif-viewer/extensions/minipacs/src/commandsModule.ts

Primary Phase 1 goal:
Make the current OHIF v3.7 MiniPACS viewer usable as a web PACS workstation for daily 2D review:
- worklist search/filter;
- open study from worklist;
- registry-driven toolbar and left tool panel;
- core 2D tools: selector, pan, zoom, window/level, fit, reset, stack scroll, cine where supported;
- layout presets: 1x1, 1x2, 2x1, 2x2;
- series rail/list;
- window presets;
- DICOM info/tag viewer;
- report viewer/workspace entry;
- settings/about/diagnostics entry points;
- browser-safe capture/print only if technically reliable.

Implementation rules:
- Use existing OHIF v3.7 extension/mode patterns.
- Prefer OHIF services and commands: servicesManager, commandsManager, ToolbarService, ViewportGridService, DisplaySetService, HangingProtocolService, CineService, MeasurementService where applicable.
- Do not patch OHIF core unless there is no practical extension-based path, and document the reason before doing it.
- Do not rely on DOM-click hacks for final Phase 1 behavior.
- Every visible tool must either work, be disabled, or show a clear deferred/unsupported message.
- Use minipacsToolRegistry.ts as the source of truth for tool status, placement, icon, command mapping, and deferred reason.
- Keep destructive/admin tools guarded or hidden.
- Preserve existing user changes and do not revert unrelated files.

Icon and UI rules:
- Icons must match the current MiniPACS/OHIF visual system.
- A clinician should understand the main tool action at a glance.
- Reuse existing OHIF/MiniPACS icons first.
- For dashboard-side controls outside OHIF, follow the current lucide-react style.
- Do not copy vendor icon assets from screenshots.
- Keep icon size, stroke weight, padding, active state, hover state, and disabled state consistent across top toolbar, left panel, and viewport mini toolbar.
- Add icon identifiers to the registry instead of scattering icon choices through components.
- Add concise tooltips, for example: "Windowing - adjust brightness/contrast".

Recommended execution order:
1. Audit current MiniPACS viewer mode/extension and command paths.
2. Update minipacsToolRegistry.ts with Phase 1 included/deferred tools, command mappings, icon identifiers, and statuses.
3. Make toolbar/sidebar render consistently from the registry or reconcile existing static definitions to avoid duplicate source of truth.
4. Wire core OHIF/Cornerstone commands: selector, pan, zoom, window/level, stack scroll, fit, reset, cine where supported.
5. Implement disabled/deferred state and command feedback for unsupported tools.
6. Harden worklist filters and viewer launch URL.
7. Implement or verify layout presets and series rail behavior using OHIF services.
8. Normalize window presets and safe Apply All behavior.
9. Wire DICOM Info, Report Viewer, Settings, About, Diagnostics.
10. Decide and implement browser-safe capture/print only if reliable; otherwise explicitly defer.
11. Create or update QA notes for Chrome/Edge and datasets: DX/CR, US, CT, MR.

Acceptance criteria:
- Worklist can filter and open a valid study.
- Viewer loads a valid DICOMweb study without blank viewport.
- Core tools work on the active viewport.
- Layout changes do not crash the viewer.
- Series rail/list allows study navigation.
- Window presets apply to the active viewport.
- Unsupported native/advanced tools do not appear operational.
- Icons are consistent, recognizable, and have clear tooltips.
- No critical uncaught JavaScript errors during smoke testing.
- No desktop/native dependency is introduced.

Deliverables:
- Code changes implementing the selected Phase 1 backlog items.
- Updated docs if scope/status changes.
- A short implementation summary.
- A test/QA summary with commands run, scenarios tested, and known limitations.

Before finishing:
- Run the relevant lint/build/test commands available in this repository.
- If a command cannot run because of environment limitations, document that clearly.
- Report any deferred tools explicitly and explain why they remain out of Phase 1.
```
