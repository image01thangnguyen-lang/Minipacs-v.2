\# MiniPACS 100+ Tools - Phase 5 Native/Desktop, 3D Sculpt, Virtual Endoscopy And External Integrations Plan



Updated: 2026-07-02



\## 1. Phase 5 Goal



Phase 5 hoàn thiện các nhóm công cụ “workstation nâng cao” mà browser-only Phase 1-4 không nên làm vội:



\- 3D Sculpt / VOI editing.

\- Virtual Endoscopy.

\- Native/Desktop integrations.

\- Hardware workflows.

\- Vendor/external systems such as Xelis, D.gate, TFS.

\- Direct DICOM film print, CD burn, scanner, local DICOM folder.



Phase 5 nên tách thành hai nhánh song song nếu team đủ lực:



\- Phase 5A: 3D Sculpt + Virtual Endoscopy.

\- Phase 5B: Native/Desktop + External Integrations.



\## 2. Entry Criteria



Chỉ bắt đầu Phase 5 khi:



\- Phase 1 daily 2D viewer ổn định.

\- Phase 2 measurement/persistence/report bridge ổn định.

\- Phase 3 advanced 2D không còn regression nghiêm trọng.

\- Phase 4 MPR/MIP/VR có volume eligibility guard và enter/exit workflow ổn định.

\- Có quyết định deployment rõ:

&#x20; - browser-only;

&#x20; - browser + native companion;

&#x20; - Electron/Tauri packaged workstation.

\- Có chính sách audit/permission cho PHI export, local file, print, scan, capture.



\## 3. Phase 5A Scope - 3D Sculpt And Virtual Endoscopy



\### 3D Sculpt / VOI Tools



\- Crop Sculpt

\- Inverse

\- Remove

\- Done

\- Cancel

\- Freehand Area Sculpt

\- Cured / Curved Area Sculpt

\- Ellipse Area Sculpt

\- Rectangular Area Sculpt

\- Curved Line Sculpt

\- Freehand Line Sculpt

\- Undo Sculpt

\- VOI Move

\- VOI Rotation

\- VOI Thickness

\- VOI Center



\### Virtual Endoscopy Tools



\- Add Path

\- Remove Path

\- Camera on Path

\- Camera without Path

\- Forward

\- Backward



\### 3D Editing Rules



\- All sculpt operations must be reversible until committed.

\- Original DICOM pixel data must not be mutated.

\- Sculpt masks/VOI state must be stored separately.

\- Use clear Done/Cancel workflow.

\- No destructive delete without confirmation.

\- Do not persist sculpt state as clinical truth unless reviewed.



\## 4. Phase 5B Scope - Native/Desktop And External Integrations



\### Local/Native Tools



\- Send Local DICOM

\- Open local folder

\- Scan Doc

\- CD Burn

\- Direct Print

\- Capture monitor

\- Capture all screens

\- Global Capture variants

\- Exit

\- Minimize

\- Resize

\- Native Close behavior



\### Dictation And Legacy Media



\- Dictation

\- Tape Dictation

\- Play Dictation



\### External/Vendor Integrations



\- Execute 3D / Xelis

\- External Link 1-6

\- External Link D.gate

\- Send to TFS

\- Temp Volume if it depends on external 3D workflow

\- Demo Folder / Save Demo Study if mapped to external teaching/archive workflow



\## 5. Out Of Scope



Do not implement blindly:



\- Unrestricted local filesystem access from browser.

\- Silent upload of local DICOM folders.

\- CD burn directly from browser.

\- Scanner access directly from browser.

\- Direct film print from browser.

\- Global screen capture without explicit user permission and audit.

\- External executable launch from browser-only mode.

\- Vendor API calls without authentication/audit contract.

\- Any PHI export without audit.



\## 6. Recommended Architecture



\### 6.1 Deployment Modes



Define supported deployment mode:



| Mode | Capabilities |

| --- | --- |

| Browser-only | Phase 1-4 web-safe features only; native tools disabled. |

| Browser + Native Companion | Local folder, scanner, direct print, CD burn, external launcher through signed local service. |

| Electron/Tauri Workstation | Native window controls, local filesystem, controlled global capture, hardware workflows. |

| Server Gateway | DICOM send, DICOM print, TFS/D.gate, export jobs through backend service. |



\### 6.2 Native Companion



If using native companion:



\- Runs locally on workstation.

\- Exposes localhost HTTPS API.

\- Requires signed install.

\- Requires auth token or pairing.

\- Only accepts allowlisted operations.

\- Logs all PHI actions.

\- Has version compatibility with web app.



Example capabilities:



\- `POST /local/dicom/send-folder`

\- `POST /local/scanner/scan`

\- `POST /local/cd-burn/create`

\- `POST /local/print/dicom-film`

\- `POST /local/external/open-xelis`

\- `GET /local/health`



\### 6.3 Server Gateway



If using server gateway:



\- DICOM DIMSE C-STORE SCU.

\- STOW-RS upload.

\- DICOM Print SCU.

\- Export job queue.

\- Vendor connector service.



\### 6.4 3D Sculpt Architecture



Use:



\- VTK.js segmentation/mask pipeline.

\- Labelmap or VOI data model.

\- Separate sculpt state from DICOM image data.

\- Undo stack.

\- Commit/cancel state machine.

\- GPU/memory guard.



\## 7. Work Packages



\### WP1 - Deployment Mode Decision



Goal: decide what Phase 5B can actually support.



Tasks:



\- Choose browser-only, native companion, Electron/Tauri, server gateway, or hybrid.

\- Define security model.

\- Define install/update model.

\- Define hospital IT requirements.

\- Decide which native tools remain deferred.



Deliverable:



\- Native integration architecture decision record.



\### WP2 - Native Tool Registry And Capability Detection



Goal: UI only enables tools that current deployment supports.



Tasks:



\- Add capability service:

&#x20; - `localCompanionAvailable`

&#x20; - `dicomPrintAvailable`

&#x20; - `scannerAvailable`

&#x20; - `cdBurnAvailable`

&#x20; - `externalLauncherAvailable`

\- Registry tools must use capability guards.

\- Browser-only deployment shows clear disabled reason.



Deliverable:



\- Runtime capability guard system.



\### WP3 - Local DICOM Send/Open Folder



Goal: safely handle local DICOM workflows.



Tasks:



\- Implement only through native companion or controlled file picker.

\- Validate DICOM before upload/send.

\- Show progress.

\- Audit selected action.

\- Prevent silent folder traversal.



Deliverable:



\- Safe local DICOM import/send workflow.



\### WP4 - Scanner And Document Attachment



Goal: scan documents into current study/order safely.



Tasks:



\- Use native scanner bridge.

\- Attach scanned document to current order/study.

\- Store PDF/image in backend.

\- Add audit.

\- Do not pretend scanned documents are diagnostic DICOM unless converted properly.



Deliverable:



\- Scan Doc workflow.



\### WP5 - CD Burn / Media Export



Goal: create export media safely.



Tasks:



\- Build export package server-side or native-side.

\- Include DICOMDIR if required.

\- Include viewer if approved.

\- Burn through native service.

\- Audit export recipient and user.



Deliverable:



\- CD/DVD export workflow, or deferred if not approved.



\### WP6 - Direct DICOM Film Print



Goal: support direct film print only through proper DICOM Print SCU.



Tasks:



\- Configure printer AE title, host, port.

\- Create print job.

\- Support layout/film size if required.

\- Audit print.

\- Browser print remains separate.



Deliverable:



\- Direct Print workflow through gateway/native service.



\### WP7 - External App And Vendor Integration



Goal: integrate with external systems safely.



Tasks:



\- Xelis launcher only through native companion.

\- D.gate/TFS only through authenticated API/gateway.

\- External Link 1-6 must be allowlisted.

\- Add failure UI and audit.



Deliverable:



\- External integration framework.



\### WP8 - 3D Sculpt Foundation



Goal: add safe sculpt state machine.



Tasks:



\- Implement sculpt session start/end.

\- Add Done/Cancel/Undo.

\- Add mask/VOI state.

\- Add Crop Sculpt preview.

\- Add Remove/Inverse if safe.

\- Do not mutate source DICOM.



Deliverable:



\- Safe 3D sculpt foundation.



\### WP9 - VOI Manipulation



Goal: support VOI editing.



Tasks:



\- VOI Move

\- VOI Rotation

\- VOI Thickness

\- VOI Center

\- Validate view transform and world coordinates.

\- Persist VOI state only after explicit commit.



Deliverable:



\- VOI editing workflow.



\### WP10 - Virtual Endoscopy



Goal: support basic camera path workflow if volume/segmentation supports it.



Tasks:



\- Add Path

\- Remove Path

\- Camera on Path

\- Camera without Path

\- Forward

\- Backward

\- Validate hollow-organ or path-based workflow.

\- Defer if volume data is not appropriate.



Deliverable:



\- Basic virtual endoscopy workflow or clear deferral.



\### WP11 - QA, Security And Compliance



Goal: Phase 5 must be safe for PHI and workstation deployment.



Tasks:



\- Audit every native operation.

\- Validate permissions.

\- Test local companion unavailable state.

\- Test failed external app launch.

\- Test large DICOM send.

\- Test scanner unavailable.

\- Test print failure.

\- Test CD burn failure.

\- Test browser-only disabled states.

\- Test PHI leakage in logs.



Deliverable:



\- Phase 5 QA/security report.



\## 8. Security Requirements



All native/external tools must have:



\- Explicit user action.

\- Capability check.

\- Permission check.

\- Audit log.

\- Failure handling.

\- No silent PHI export.

\- No arbitrary command execution.

\- No unrestricted local filesystem traversal.

\- No unencrypted PHI transfer.



\## 9. QA Matrix



\### Browser-only Mode



\- Native tools disabled.

\- Disabled reason clear.

\- Phase 1-4 features unaffected.



\### Native Companion Mode



\- Companion available/unavailable.

\- Version mismatch.

\- Auth/pairing failure.

\- Local DICOM send success/failure.

\- Scanner success/failure.

\- CD burn success/failure.

\- Direct print success/failure.

\- External app launch success/failure.



\### 3D Sculpt



\- Start sculpt session.

\- Undo operation.

\- Cancel operation.

\- Done/commit operation.

\- Source DICOM unchanged.

\- GPU memory guard.

\- Exit/restore 2D workflow.



\### Virtual Endoscopy



\- Add/remove path.

\- Camera on/off path.

\- Forward/backward movement.

\- Unsupported volume handled gracefully.



\## 10. Acceptance Criteria



Phase 5 is complete when:



\- Browser-only deployment remains safe and stable.

\- Native tools only enable when native capability exists.

\- All native/external actions are audited.

\- No PHI leaves the system without explicit action.

\- 3D sculpt operations are reversible until committed.

\- Virtual endoscopy works only for validated data, or is clearly deferred.

\- External integrations fail gracefully.

\- Phase 1-4 workflows still work.



\## 11. Prompt For Another AI Implementation Agent



You are working in the `Minipacs-v.2` repository.



Your task is to implement Phase 5 of the MiniPACS 100+ tools roadmap: \*\*Native/Desktop, 3D Sculpt, Virtual Endoscopy And External Integrations\*\*.



Read these documents first:



\- `docs/MINIPACS\_100\_TOOLS\_MASTER\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE1\_WEB\_ONLY\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE2\_2D\_CLINICAL\_TOOLS\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE3\_ADVANCED\_2D\_SPECIALTY\_WORKFLOW\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE4\_MPR\_MIP\_VR\_VOLUME\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE5\_NATIVE\_3D\_SCULPT\_EXTERNAL\_INTEGRATIONS\_PLAN.md`



Primary goal:



Implement the final advanced workstation layer for MiniPACS, split into two safe tracks:



\- Phase 5A: 3D Sculpt and Virtual Endoscopy.

\- Phase 5B: Native/Desktop and External Integrations.



Do not treat browser-only deployment as if it can access local hardware or OS-level features. Every native feature must be capability-gated, permissioned, audited, and failure-safe.



Scope Phase 5A:



\- Crop Sculpt

\- Inverse

\- Remove

\- Done

\- Cancel

\- Freehand Area Sculpt

\- Cured/Curved Area Sculpt

\- Ellipse Area Sculpt

\- Rectangular Area Sculpt

\- Curved Line Sculpt

\- Freehand Line Sculpt

\- Undo Sculpt

\- VOI Move

\- VOI Rotation

\- VOI Thickness

\- VOI Center

\- Add Path

\- Remove Path

\- Camera on Path

\- Camera without Path

\- Forward

\- Backward



Scope Phase 5B:



\- Send Local DICOM

\- Open local folder

\- Scan Doc

\- CD Burn

\- Direct Print

\- Capture monitor

\- Capture all screens

\- Global Capture variants

\- Dictation / Tape Dictation / Play Dictation if native or legacy service exists

\- Execute 3D / Xelis

\- External Link 1-6

\- External Link D.gate

\- Send to TFS

\- Native Exit / Minimize / Resize behavior if Electron/Tauri mode exists



Architecture rules:



\- Keep browser-only mode safe.

\- Use capability detection before enabling native tools.

\- Use Electron/Tauri/native companion/server gateway only where required.

\- Do not use arbitrary command execution.

\- Do not allow unrestricted local filesystem traversal.

\- Do not silently export PHI.

\- Audit every local, native, print, scan, export, external launch, and vendor action.

\- Keep `minipacsToolRegistry.ts` as source of truth.

\- Route all UI actions through MiniPACS command bridge or a dedicated integration service.

\- 3D sculpt must not mutate original DICOM pixels.

\- Sculpt/VOI operations must support Undo and Cancel before commit.

\- Virtual endoscopy must be enabled only for validated volume data.



Do not implement:



\- Native features directly in browser-only mode.

\- CD burn from browser JavaScript.

\- Direct film print from browser JavaScript.

\- Scanner access from browser JavaScript.

\- External executable launch from browser JavaScript.

\- Any PHI export without explicit user action and audit.

\- Any vendor integration without an API/security contract.



Required work packages:



1\. Decide and document deployment mode: browser-only, native companion, Electron/Tauri, server gateway, or hybrid.

2\. Implement runtime capability detection.

3\. Update `minipacsToolRegistry.ts` with Phase 5 status, capability requirements, and deferred reasons.

4\. Implement local/native integration service stubs or real adapters only where deployment supports them.

5\. Implement safe local DICOM send/open workflow if approved.

6\. Implement scanner workflow if native bridge exists.

7\. Implement CD burn/media export workflow if approved.

8\. Implement direct DICOM print through gateway/native service if approved.

9\. Implement external app/vendor integration framework.

10\. Implement 3D sculpt session state machine.

11\. Implement VOI manipulation only after world-coordinate validation.

12\. Implement virtual endoscopy only for validated volume data.

13\. Add QA/security report.



Acceptance criteria:



\- Browser-only mode does not expose unsupported native tools as working.

\- Native tools enable only when capability is available.

\- Every native/external action has audit.

\- Local filesystem access is controlled.

\- External app launch is allowlisted and safe.

\- 3D sculpt operations are reversible until committed.

\- Source DICOM pixels are never mutated.

\- Virtual endoscopy handles unsupported data gracefully.

\- Phase 1-4 workflows still work.

\- No visible Phase 5 button is a silent no-op.



Before finishing:



\- Run available build/static checks if dependencies are present.

\- If checks cannot run, state why.

\- Provide implementation summary.

\- List files changed.

\- List deferred Phase 5 tools and reasons.

\- List security limitations and deployment assumptions.

