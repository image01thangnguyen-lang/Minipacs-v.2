\# MiniPACS 100+ Tools - Phase 2 Clinical 2D Tools, Persistence, Capture And Reporting Plan



Updated: 2026-07-02



\## 1. Phase 2 Goal



Phase 2 turns the Phase 1 web-only viewer into a practical clinical 2D workstation.



By the end of Phase 2, a doctor can:



\- Draw and edit common 2D annotations.

\- Perform common measurements safely.

\- Mark key images.

\- Capture current viewport or current image context.

\- Save and reload measurements/annotations.

\- Send measurement and key-image context into the report workflow.

\- View existing DICOM SR where available, without pretending full SR authoring is ready.



\## 2. Entry Criteria



Start Phase 2 only after Phase 1 is stable:



\- Worklist opens study into MiniPACS viewer.

\- Core tools work: Pan, Zoom, Windowing, Stack Scroll, Fit, Reset.

\- Layout and series rail are stable.

\- Tool registry has clear `ready`, `deferred-advanced`, `deferred-native`, `backend`, or `guarded` status.

\- Unsupported tools do not look operational.

\- No critical runtime errors in basic viewer smoke test.



\## 3. Scope



\### In Scope



2D annotation and measurement:



\- 2D Arrow

\- 2D Text

\- 2D Box

\- Circle / Ellipse

\- Rectangle

\- Polyline

\- Freehand line

\- Measure 2D line

\- Measure 2D curve

\- Measure 2D angle

\- Measure area Ellipse

\- Measure area Rectangle

\- Measure area Freehand

\- Measure Cobb angle

\- Marking

\- Lens / Hounsfield unit / SUV probe

\- Measure ratio



Persistence:



\- Save measurement JSON.

\- Reload measurement JSON.

\- Save annotation JSON.

\- Restore annotation state on viewer reopen.

\- Store StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID, frame index, tool name, coordinates, unit, viewport metadata.



Key image and snapshot:



\- Mark current image as key image.

\- Save key-image metadata.

\- Capture current viewport where browser/OHIF APIs are reliable.

\- Capture as shown if overlay/canvas composition is reliable.

\- Show captured images for current study.



Reporting:



\- Open report workspace from viewer.

\- Send measurement summary to report workspace.

\- Send key-image/snapshot summary to report workspace.

\- Show existing DICOM SR if current OHIF/SR support can read it.



\### Out Of Scope



Do not implement in Phase 2:



\- Full 3D/MPR/MIP/VR.

\- 3D annotation.

\- 3D sculpt.

\- Virtual endoscopy.

\- Native scanner.

\- CD burn.

\- Direct DICOM film print.

\- Local folder watcher.

\- Global multi-monitor capture.

\- External Xelis/D.gate/TFS integration unless already exposed as safe HTTPS API.

\- Authoritative DICOM SR/GSPS/KO export unless the data model is fully validated.



\## 4. Tool Classification For Phase 2



| Tool | Phase 2 action |

| --- | --- |

| 2D Arrow | Use existing ArrowAnnotate if available; otherwise wrap as MiniPACS annotation command. |

| 2D Text | Implement text annotation UI if not already supported. |

| 2D Box | Use rectangle annotation or custom text box overlay tool. |

| Circle / Ellipse / Rectangle | Use Cornerstone ROI tools. |

| Polyline / Freehand line | Use PlanarFreehandROI or custom polyline tool. |

| Measure 2D line | Use LengthTool. |

| Measure 2D curve | Custom tool or defer to Phase 3 if curve length is not available. |

| Measure 2D angle | Use AngleTool. |

| Measure area tools | Use ROI tools and persist area/stat values. |

| Cobb angle | Use CobbAngleTool if stable. |

| Marking | Implement as lightweight text/marker annotation. |

| HU/SUV probe | Use Probe/DragProbe; SUV only if PET metadata exists. |

| Measure ratio | Custom 2-line ratio tool or Phase 2 stretch. |

| Key image | MiniPACS key-image API. |

| Capture current viewport | Browser/OHIF canvas capture; audit required. |

| DICOM SR read | Read/display only if supported. |

| GSPS/KO/SR write | Strategy only; do not force production authoring. |



\## 5. Architecture



\### 5.1 Registry First



Every Phase 2 tool must be declared in `minipacsToolRegistry.ts`.



Recommended metadata:



\- `id`

\- `label`

\- `type`

\- `commandName`

\- `commandOptions`

\- `status`

\- `placement`

\- `phase: 2`

\- `requires`

\- `persistence`

\- `deferredReason`



\### 5.2 Command Bridge



Use `runMiniPacsTool` for all Phase 2 actions.



Responsibilities:



\- Route basic Cornerstone tools to OHIF commands.

\- Route MiniPACS actions to local services.

\- Show clear feedback when a tool is unsupported.

\- Record audit events.

\- Prevent silent no-op buttons.



\### 5.3 Persistence Service



Create or extend a viewer persistence service.



Suggested service:



\- `viewerMeasurementPersistenceService`

\- `viewerAnnotationPersistenceService`

\- or a combined `viewerClinicalStateService`



Responsibilities:



\- Serialize annotations from Cornerstone/OHIF state.

\- Normalize coordinates and metadata.

\- Save to MiniPACS backend.

\- Reload on viewer open.

\- Avoid duplicate annotations.

\- Handle missing metadata safely.



\## 6. Data Model



Minimum persisted measurement fields:



\- `id`

\- `studyInstanceUid`

\- `seriesInstanceUid`

\- `sopInstanceUid`

\- `frameNumber`

\- `toolName`

\- `label`

\- `data`

\- `unit`

\- `value`

\- `createdBy`

\- `createdAt`

\- `updatedAt`

\- `source: "minipacs-ohif"`

\- `version`



Minimum key image fields:



\- `id`

\- `studyInstanceUid`

\- `seriesInstanceUid`

\- `sopInstanceUid`

\- `frameNumber`

\- `viewportId`

\- `note`

\- `snapshotId`

\- `createdBy`

\- `createdAt`



Minimum snapshot fields:



\- `id`

\- `studyInstanceUid`

\- `seriesInstanceUid`

\- `sopInstanceUid`

\- `frameNumber`

\- `imageUrl`

\- `thumbnailUrl`

\- `viewportState`

\- `containsOverlay`

\- `createdBy`

\- `createdAt`



\## 7. Work Packages



\### WP1 - Phase 2 Tool Audit



Goal: confirm which 2D tools already exist in Cornerstone/OHIF.



Tasks:



\- Audit registered tools in `initCornerstoneTools.js`.

\- Audit MiniPACS registry.

\- Map Phase 2 tools to existing commands or custom implementation.

\- Mark stretch/deferred tools clearly.



Deliverable:



\- Phase 2 tool mapping table.



\### WP2 - Basic 2D Annotation Wiring



Goal: make common annotation tools usable from toolbar/sidebar.



Tasks:



\- Wire Arrow, Text, Box, Circle, Rectangle, Ellipse, Freehand.

\- Ensure active state updates correctly.

\- Ensure tool switching does not leave conflicting active tools.

\- Add tooltip and disabled states.



Deliverable:



\- Working annotation group.



\### WP3 - Measurement Tool Wiring



Goal: make common measurement tools clinically usable.



Tasks:



\- Wire Length, Angle, Cobb, ROI area tools, Probe.

\- Validate units.

\- Handle missing pixel spacing.

\- Add warning when measurement is not calibrated.



Deliverable:



\- Working measurement group with safe unit handling.



\### WP4 - Persistence



Goal: measurements and annotations survive reload.



Tasks:



\- Serialize tool state.

\- Save through MiniPACS API.

\- Reload on viewer open.

\- Avoid duplicate restore.

\- Track study/series/SOP/frame correctly.



Deliverable:



\- Measurement/annotation persistence.



\### WP5 - Key Image And Snapshot



Goal: doctors can mark important images and capture useful images.



Tasks:



\- Implement Key Image command.

\- Save key image metadata.

\- Implement current viewport snapshot if reliable.

\- Show captured images gallery for current study.

\- Add audit events.



Deliverable:



\- Key image and snapshot workflow.



\### WP6 - Report Bridge



Goal: report workspace can consume viewer clinical context.



Tasks:



\- Open report workspace for current study.

\- Generate measurement summary.

\- Include key images/snapshots in summary.

\- Avoid overwriting existing report text.

\- Keep DICOM SR export deferred unless validated.



Deliverable:



\- Report workspace integration.



\### WP7 - DICOM Object Strategy



Goal: decide future path for GSPS/KO/SR.



Tasks:



\- Document JSON-first persistence.

\- Define KO requirements for key images.

\- Define GSPS requirements for presentation state.

\- Define SR requirements for structured measurement export.

\- Decide which are Phase 3+.



Deliverable:



\- GSPS/KO/SR decision matrix.



\## 8. QA Matrix



Test datasets:



\- DX/CR single image.

\- CT stack with pixel spacing.

\- MR stack with pixel spacing.

\- US single frame.

\- US multiframe if available.

\- Study with missing pixel spacing.

\- Study with multiple series.



Manual tests:



\- Draw each annotation.

\- Edit/move/delete annotation where supported.

\- Measure line/angle/ROI.

\- Reload viewer and confirm objects return.

\- Switch series and confirm annotations do not attach to wrong image.

\- Mark key image.

\- Capture viewport.

\- Open report workspace and confirm summary.

\- Confirm audit events for save/capture/key image/export.

\- Confirm unsupported SR/GSPS/KO write is not presented as production-ready.



\## 9. Acceptance Criteria



Phase 2 is complete when:



\- Core 2D annotations work.

\- Core 2D measurements work.

\- Measurement units are correct or clearly marked uncalibrated.

\- Measurements/annotations persist and reload on the correct image/frame.

\- Key image workflow works.

\- Snapshot/capture works or is explicitly deferred with reason.

\- Report workspace receives measurement/key-image context.

\- No visible Phase 2 button is a silent no-op.

\- No native/3D feature is accidentally exposed as ready.



\## 10. Risks



| Risk | Impact | Mitigation |

| --- | --- | --- |

| Wrong SOP/frame mapping | Clinical risk | Persist full DICOM identity for every object. |

| Missing pixel spacing | Wrong measurement | Warn and mark measurement uncalibrated. |

| Duplicate restore | UI clutter, wrong report | Use stable IDs and restore guards. |

| SR/GSPS rushed too early | Interoperability failure | JSON-first, DICOM export later. |

| Capture includes PHI unexpectedly | Privacy risk | Add audit and clear capture mode labels. |

| Tool state conflicts | Broken interaction | Centralize activation through command bridge. |



\## 11. Handoff Prompt For Implementation Agent



Implement Phase 2 of the MiniPACS 100+ tools roadmap.



Read first:



\- `docs/MINIPACS\_100\_TOOLS\_MASTER\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE1\_WEB\_ONLY\_PLAN.md`



Scope:



\- 2D annotations.

\- 2D measurements.

\- Measurement/annotation persistence.

\- Key image.

\- Snapshot/capture if reliable.

\- Report workspace bridge.

\- GSPS/KO/SR strategy documentation.



Do not implement:



\- MPR/MIP/VR.

\- 3D sculpt.

\- Native scanner/CD/local folder/direct print.

\- External Xelis/D.gate/TFS integrations.



Rules:



\- Use OHIF/Cornerstone services where available.

\- Use custom Cornerstone tools only when needed.

\- Keep `minipacsToolRegistry.ts` as source of truth.

\- No silent no-op buttons.

\- No DOM-click hacks as final behavior.

\- Persist measurements only with study/series/SOP/frame metadata.

\- Report any unsupported tools explicitly.


## Prompt For Another AI Implementation Agent

You are working in the `Minipacs-v.2` repository.

Your task is to implement Phase 2 of the MiniPACS 100+ tools roadmap: **Clinical 2D Tools, Persistence, Capture, And Reporting**.

Read these documents first:

- `docs/MINIPACS_100_TOOLS_MASTER_PLAN.md`
- `docs/MINIPACS_100_TOOLS_PHASE1_WEB_ONLY_PLAN.md`
- `docs/MINIPACS_100_TOOLS_PHASE2_2D_CLINICAL_TOOLS_PLAN.md`

Primary goal:

Turn the current Phase 1 web-only OHIF v3.7 MiniPACS viewer into a practical clinical 2D workstation where a doctor can draw annotations, perform common measurements, mark key images, capture useful viewport images, persist/reload clinical viewer state, and send measurement/key-image context into the report workflow.

Scope for Phase 2:

- Wire or implement core 2D annotation tools:
  - 2D Arrow
  - 2D Text
  - 2D Box
  - Circle / Ellipse
  - Rectangle
  - Polyline
  - Freehand line
  - Marking

- Wire or implement core 2D measurement tools:
  - Measure 2D line
  - Measure 2D curve, only if feasible with current Cornerstone/OHIF APIs
  - Measure 2D angle
  - Measure area Ellipse
  - Measure area Rectangle
  - Measure area Freehand
  - Measure Cobb angle
  - Lens / Hounsfield unit / SUV probe
  - Measure ratio, only if feasible; otherwise mark as deferred with reason

- Implement measurement and annotation persistence:
  - Save measurement/annotation JSON.
  - Reload measurement/annotation JSON when reopening the same study.
  - Persist full identity: StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID, frame number, tool name, coordinates, values, units, viewport metadata, createdBy, createdAt.
  - Prevent duplicate restore.
  - Warn or mark uncalibrated measurements when pixel spacing is missing.

- Implement key image and snapshot workflow:
  - Mark current image as key image.
  - Save key-image metadata.
  - Capture current viewport if technically reliable through OHIF/Cornerstone/browser canvas APIs.
  - Capture as shown only if overlay/canvas composition is reliable.
  - Show captured images for the current study if the existing services support it.
  - Add audit events for key image, capture, save, export.

- Implement report workflow bridge:
  - Open report workspace for the current study.
  - Generate a safe measurement summary.
  - Include key image/snapshot references in the report workspace.
  - Do not overwrite existing report text.
  - DICOM SR export is strategy/deferred unless already validated.

Architecture rules:

- Use OHIF v3.7 and Cornerstone3D services first.
- Use existing registered tools from `ohif-viewer/extensions/cornerstone/src/initCornerstoneTools.js` where possible.
- Add custom Cornerstone tools only when existing tools cannot satisfy the Phase 2 requirement.
- Keep `ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts` as the source of truth for all Phase 2 tool IDs, labels, placement, status, command mapping, and deferred reason.
- Route tool clicks through the MiniPACS command bridge instead of ad hoc UI handlers.
- Every visible button must either work, be disabled, or show a clear controlled message. No silent no-op buttons.
- Do not use DOM-click hacks as final behavior.
- Do not modify unrelated OHIF core files unless there is no extension-level alternative.
- Preserve existing Phase 1 behavior.

Do not implement in Phase 2:

- MPR / MIP / VR.
- 3D annotation.
- 3D sculpt.
- Virtual endoscopy.
- Native scanner integration.
- CD burn.
- Direct DICOM film print.
- Local folder watcher.
- Global/multi-monitor capture.
- External Xelis, D.gate, or TFS integration unless already exposed as a safe HTTPS API.
- Authoritative DICOM SR/GSPS/KO authoring unless the mapping and validation are already production-ready.

Required work packages:

1. Audit existing Phase 2 tool availability in the current repo.
2. Update `minipacsToolRegistry.ts` with Phase 2 statuses and deferred reasons.
3. Wire core 2D annotation tools.
4. Wire core 2D measurement tools.
5. Implement or extend measurement/annotation persistence services.
6. Implement key image and snapshot workflow where reliable.
7. Integrate measurement/key-image summary into report workspace.
8. Document GSPS/KO/SR strategy and defer unsafe authoring.
9. Add QA notes or a QA report for Phase 2.

Acceptance criteria:

- Core 2D annotations work.
- Core 2D measurements work.
- Measurement units are correct or clearly marked uncalibrated.
- Measurements and annotations reload on the correct study/series/SOP/frame.
- Key image workflow works.
- Snapshot/capture works or is explicitly deferred with a clear reason.
- Report workspace receives measurement/key-image context.
- No visible Phase 2 button is a silent no-op.
- Phase 1 core viewer behavior still works.
- Native and 3D features remain deferred.

Before finishing:

- Run available static checks/build checks if dependencies are present.
- If tests/build cannot run, state why.
- Provide a concise implementation summary.
- List files changed.
- List remaining deferred Phase 2 tools and the reason for each.
