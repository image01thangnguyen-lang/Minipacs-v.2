\# MiniPACS 100+ Tools - Phase 3 Advanced 2D, Specialty Measurements And Workflow Automation Plan



Updated: 2026-07-02



\## 1. Phase 3 Goal



Phase 3 mở rộng viewer từ “2D clinical workstation cơ bản” sang nhóm công cụ 2D nâng cao, đo đạc chuyên khoa và workflow tự động.



Mục tiêu chính:



\- Có các công cụ 2D nâng cao như shutter, filter, pseudo color, actual size.

\- Có các tool đo chuyên khoa: CT Ratio, LLD, Cobb nâng cao, spine balance, acetabular angle.

\- Có workflow tự động: refresh exam, auto refresh, apply previous/next HP, advanced thumbnail.

\- Tất cả tool phải có guard theo modality, pixel spacing, calibration, và metadata.

\- Không làm MPR/MIP/VR/3D trong Phase 3.



\## 2. Entry Criteria



Chỉ bắt đầu Phase 3 khi Phase 2 đã ổn định:



\- Core 2D annotation hoạt động.

\- Core 2D measurement hoạt động.

\- Measurement/annotation persistence không lỗi nghiêm trọng.

\- Key image/snapshot/report bridge dùng được hoặc được defer rõ.

\- `minipacsToolRegistry.ts` có trạng thái rõ cho Phase 1-2 tools.

\- Không còn silent no-op button ở tool Phase 1-2.



\## 3. In Scope



\### Advanced 2D Display



\- Display Image Only

\- 100% Zoom

\- 1:1 Actual Size

\- Select All

\- Select All Inverse

\- Select Image Set

\- Monitor Cine

\- Auto Scroll

\- Refresh Exam

\- Auto Refresh

\- Apply Previous HP

\- Apply Next HP

\- Advanced Thumbnail



\### Shutter And Image Processing



\- Ellipse Shutter

\- Rectangle Shutter

\- Polyline Shutter

\- Sharpen

\- Average Filter

\- Pseudo Color Mapping



\### Specialty Measurements



\- CT Ratio

\- CT Ratio2

\- Limb Length Discrepancy

\- Center Line

\- Profile

\- 2D Table

\- Calibrate

\- Spine Label

\- Volume Measure from 2D contours

\- Measure Center Line Angle

\- Multiple Circle

\- Measure Multiple Cobb Angle

\- Time Intensity Curve

\- Curve

\- Acetabular Angle

\- Spine Balance

\- Spine Cobb Angle

\- Spine Pelvic Incidence Angle

\- Parallel Line



\### Workflow Automation



\- Related exam comparison refinement.

\- Richer hanging protocol rules.

\- Sync presets for scroll, WW/WL, zoom/pan.

\- ECG View only if waveform data is available and readable.

\- Better modality gating for CT/MR/DX/CR/US.



\## 4. Out Of Scope



Do not implement in Phase 3:



\- MPR / MIP / VR.

\- VolumeViewport production workflow.

\- 3D annotation.

\- 3D sculpt.

\- Virtual endoscopy.

\- Native scanner.

\- CD burn.

\- Local folder watcher.

\- Direct DICOM film print.

\- Global capture / multi-monitor capture.

\- Xelis / D.gate / TFS native integration.

\- Authoritative DICOM SR/GSPS export unless already validated.



\## 5. Technical Approach



Use OHIF/Cornerstone first:



\- `ViewportGridService`

\- `DisplaySetService`

\- `HangingProtocolService`

\- `SyncGroupService`

\- `CineService`

\- `commandsManager`

\- Cornerstone3D viewport APIs

\- Cornerstone annotation state

\- OHIF `MeasurementService`



Use custom tools when needed:



\- Extend `BaseTool` for custom measurements.

\- Use annotation handles/state for specialty geometry.

\- Use calibration metadata for real-world units.

\- Add modality/body-part guards before enabling specialty tools.

\- Use canvas/WebGL filters only as reversible viewport presentation changes.



Do not mutate original DICOM pixel data.



\## 6. Tool Rules



Calibration-dependent tools must check:



\- Pixel Spacing

\- Imager Pixel Spacing

\- Ultrasound region calibration if applicable

\- SOPInstanceUID and frame number

\- Modality

\- Body part/procedure if needed



If metadata is missing:



\- Disable tool, or

\- Allow drawing but mark result as `uncalibrated`, depending on clinical safety.



Image processing tools must be:



\- Reversible.

\- Viewport-local unless Apply All is explicitly chosen.

\- Excluded from persisted measurement values unless intentionally saved as presentation state.



\## 7. Work Packages



\### WP1 - Phase 3 Tool Audit



\- Audit existing OHIF/Cornerstone tools.

\- Map Phase 3 tools to existing command, custom tool, backend workflow, or deferred.

\- Update registry with `phase: 3`, status, dependencies, and deferred reason.



\### WP2 - Advanced Display Controls



\- Implement Display Image Only overlay toggle.

\- Implement 100% Zoom and Actual Size with calibration guard.

\- Implement Select All / Inverse / Image Set behavior if compatible with current viewport state.

\- Implement Monitor Cine and Auto Scroll where viewport/cine service supports it.



\### WP3 - Shutter Tools



\- Implement ellipse, rectangle, and polyline shutter as presentation overlays.

\- Ensure shutter can be toggled, edited, reset, and persisted if safe.

\- Do not save fake GSPS unless GSPS strategy is approved.



\### WP4 - Image Filters



\- Implement Sharpen, Average Filter, and Pseudo Color Mapping as reversible viewport filters.

\- Add reset filter command.

\- Add Apply All only if safe for current display set group.



\### WP5 - Specialty Measurement Tools



\- Implement or defer each specialty tool explicitly.

\- Start with lower-risk geometry tools:

&#x20; - Parallel Line

&#x20; - Multiple Circle

&#x20; - Center Line

&#x20; - Measure Center Line Angle

&#x20; - Multiple Cobb

\- Add calibration-heavy tools after metadata validation:

&#x20; - LLD

&#x20; - CT Ratio

&#x20; - Acetabular Angle

&#x20; - Spine Balance

&#x20; - Spine Pelvic Incidence



\### WP6 - Profile, 2D Table, Time Intensity Curve



\- Implement Profile as sampled pixel values along a line/curve.

\- Implement 2D Table as ROI pixel statistics.

\- Implement Time Intensity Curve only for multiframe or temporal data with valid frame timing.

\- PET SUV display only if SUV metadata is available.



\### WP7 - Workflow Automation



\- Implement Refresh Exam and Auto Refresh safely.

\- Implement Apply Previous/Next HP.

\- Add richer layout/hanging protocol presets.

\- Add sync presets with modality guards.

\- Do not auto-sync unrelated modalities blindly.



\### WP8 - QA And Clinical Validation



\- Build QA cases for each modality.

\- Validate measurement values on known datasets.

\- Validate missing metadata behavior.

\- Confirm filters/shutters do not corrupt source data.

\- Confirm persistence does not attach tools to wrong frame.



\## 8. QA Matrix



Datasets:



\- DX/CR chest.

\- Full-leg standing X-ray if available.

\- Spine X-ray if available.

\- CT chest.

\- CT abdomen.

\- MR spine.

\- US single frame.

\- US multiframe.

\- PET/CT if SUV/probe is tested.



Tests:



\- 100% Zoom and Actual Size.

\- Shutter create/edit/reset.

\- Filter apply/reset.

\- Pseudo color apply/reset.

\- CT Ratio calculation.

\- LLD measurement.

\- Cobb and Multiple Cobb.

\- Spine balance.

\- Pixel spacing missing fallback.

\- Auto refresh does not duplicate series.

\- HP prev/next does not destroy measurements.

\- Sync only applies to compatible viewports.



\## 9. Acceptance Criteria



Phase 3 is complete when:



\- Advanced 2D display controls work or are deferred with clear reason.

\- Shutter tools are reversible and safe.

\- Filters are reversible and do not mutate DICOM source.

\- Specialty measurements are calibrated, validated, or clearly marked uncalibrated.

\- Missing metadata does not produce unsafe numeric results.

\- Workflow automation does not break Phase 1-2 behavior.

\- No visible Phase 3 button is a silent no-op.

\- Phase 2 persistence and report bridge still work.



\## 10. Prompt For Another AI Implementation Agent



You are working in the `Minipacs-v.2` repository.



Your task is to implement Phase 3 of the MiniPACS 100+ tools roadmap: \*\*Advanced 2D, Specialty Measurements And Workflow Automation\*\*.



Read these documents first:



\- `docs/MINIPACS\_100\_TOOLS\_MASTER\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE1\_WEB\_ONLY\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE2\_2D\_CLINICAL\_TOOLS\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE3\_ADVANCED\_2D\_SPECIALTY\_WORKFLOW\_PLAN.md`



Primary goal:



Extend the Phase 2 clinical 2D viewer with advanced 2D display controls, shutters, reversible image filters, specialty measurement tools, and workflow automation, while preserving all Phase 1 and Phase 2 behavior.



Scope:



\- Advanced 2D display:

&#x20; - Display Image Only

&#x20; - 100% Zoom

&#x20; - 1:1 Actual Size

&#x20; - Select All

&#x20; - Select All Inverse

&#x20; - Select Image Set

&#x20; - Monitor Cine

&#x20; - Auto Scroll

&#x20; - Refresh Exam

&#x20; - Auto Refresh

&#x20; - Apply Previous HP

&#x20; - Apply Next HP

&#x20; - Advanced Thumbnail



\- Shutters and image processing:

&#x20; - Ellipse Shutter

&#x20; - Rectangle Shutter

&#x20; - Polyline Shutter

&#x20; - Sharpen

&#x20; - Average Filter

&#x20; - Pseudo Color Mapping



\- Specialty measurements:

&#x20; - CT Ratio

&#x20; - CT Ratio2

&#x20; - Limb Length Discrepancy

&#x20; - Center Line

&#x20; - Profile

&#x20; - 2D Table

&#x20; - Calibrate

&#x20; - Spine Label

&#x20; - Volume Measure from 2D contours

&#x20; - Measure Center Line Angle

&#x20; - Multiple Circle

&#x20; - Measure Multiple Cobb Angle

&#x20; - Time Intensity Curve

&#x20; - Curve

&#x20; - Acetabular Angle

&#x20; - Spine Balance

&#x20; - Spine Cobb Angle

&#x20; - Spine Pelvic Incidence Angle

&#x20; - Parallel Line



Architecture rules:



\- Use existing OHIF v3.7 and Cornerstone3D services first.

\- Add custom Cornerstone3D tools only when existing tools are insufficient.

\- Keep `minipacsToolRegistry.ts` as the source of truth.

\- Route all tool clicks through the MiniPACS command bridge.

\- Do not use DOM-click hacks as final behavior.

\- Do not mutate original DICOM pixel data.

\- Image filters and shutters must be reversible.

\- Calibration-heavy tools must check pixel spacing and modality before producing clinical values.

\- If metadata is missing, disable the tool or mark output as uncalibrated.

\- Preserve Phase 1 core viewer behavior.

\- Preserve Phase 2 measurement/annotation persistence and report bridge.



Do not implement:



\- MPR / MIP / VR.

\- VolumeViewport production workflow.

\- 3D annotation.

\- 3D sculpt.

\- Virtual endoscopy.

\- Native scanner integration.

\- CD burn.

\- Direct DICOM film print.

\- Local folder watcher.

\- Global/multi-monitor capture.

\- Xelis / D.gate / TFS native integration.



Required work packages:



1\. Audit existing repo support for Phase 3 tools.

2\. Update `minipacsToolRegistry.ts` with Phase 3 statuses, command mappings, requirements, and deferred reasons.

3\. Implement advanced display controls where safe.

4\. Implement reversible shutter tools.

5\. Implement reversible image filters.

6\. Implement specialty measurement tools incrementally, starting with lower-risk geometry tools.

7\. Add calibration and modality guards.

8\. Implement refresh/auto-refresh and HP prev/next workflow safely.

9\. Add QA notes or QA report for Phase 3.



Acceptance criteria:



\- No visible Phase 3 button is a silent no-op.

\- Advanced display controls work or are clearly deferred.

\- Shutters are editable/resettable and do not corrupt source data.

\- Filters are reversible.

\- Specialty measurements are clinically guarded by metadata checks.

\- Missing pixel spacing does not produce unsafe values.

\- Phase 1 and Phase 2 workflows still work.

\- Build/static checks are run if dependencies are present.

\- If build/tests cannot run, state why.



Before finishing:



\- Provide implementation summary.

\- List files changed.

\- List deferred Phase 3 tools and reasons.

\- List known clinical limitations.

