# VRPACS Gap Analysis And Roadmap

Updated: 2026-07-02

## Sources

- `C:\Users\ngtua\Downloads\HDSD _VIEWER da chuyen ISOFH.docx`
- `C:\Users\ngtua\Downloads\HDSD_NON-DICOM da chuyen ISOFH.docx`
- `C:\Users\ngtua\Downloads\HDSD_ADMIN da chuyen ISOFH.docx`
- `C:\Users\ngtua\Downloads\HDSD_DICOM da chuyen ISOFH.docx`
- Current MiniPACS repository: `dashboard`, `ohif-viewer`, Prisma schema, and existing docs.

Note: the DOCX filenames contain Vietnamese accents on disk. They are normalized above only to keep this Markdown stable across terminals.

## Executive Summary

MiniPACS already has a solid RIS/PACS foundation: Orthanc-backed DICOM study list, DICOM Modality Worklist creation, report editor, report templates, archive/reprint workflow, role profiles, DICOM node management, statistics/SLA dashboard, and a custom OHIF-based viewer with series rail, overlays, key images, snapshots, history, measurement persistence, and report bridge.

Compared with VRPACS user manuals, the largest gaps are not basic DICOM viewing. The missing surface is the complete operational product around it:

1. HIS two-way synchronization and HIS status handling.
2. Full report lifecycle actions: receive/read, approve, cancel approval, cancel form, update clinical info, add indication, select technologist, choose print/image template, and multi-reader result reuse.
3. Non-DICOM camera capture workflow, including live camera, image/video capture, crop, print, copy, upload pathology/files, and consultation flow.
4. Share links with expiry/password/QR and optional patient-info hiding.
5. Online consultation/video conference/chat workflow.
6. Viewer advanced tools: specialized measurements, mammography, curved/fusion MPR, advanced sync, crop/fullview snapshot, export video, download manager, anonymize/encode patient, action history UI, and user-level viewer configuration.
7. Admin catalog depth: service type, technical service/procedure catalog UI, ICD-template mapping, facility/folder hierarchy, backup folders, print-template management, machine-template assignment, supplies, and per-machine/per-action doctor permissions.
8. DICOM/JPEG/bulk download, anonymization, guarded study deletion, backup/retention operations.

## Current MiniPACS Capability Snapshot

### Already Strong

- Authentication with NextAuth and server-side permission checks.
- Role profiles and permission groups: admin, doctor, technician, reception, plus custom role profiles.
- Doctor profile with title, specialty, license number, and signature image.
- Orthanc study sync into RIS workflow statuses.
- Worklist order creation and Modality Worklist file generation.
- Check-in, cancel order, regenerate MWL, and lock/start reading.
- Report editor with findings, conclusion, recommendation, draft/final workflow, templates, print template rendering, and final-report addendum tracking.
- Archive search, report reprint/PDF log, mark delivered, and open viewer when images still exist.
- Statistics dashboard with realtime queue, SLA/TAT, alerts, workload, PACS health, export CSV/XLSX, and filter presets.
- DICOM node CRUD, Orthanc modality sync, and C-Echo.
- Custom OHIF viewer mode with top toolbar, left tool accordion, series rail, overlay, viewport mini toolbar, history, gallery, key image, report workspace, diagnostics, measurement persistence, and audit logs.

### Present But Partial

- Report status flow exists, but VRPACS-style actions such as receive/read, approve, cancel approval, cancel form, HIS update/send, select image/print template, and multi-reader result selection are incomplete.
- Report templates exist, but ICD/procedure-to-template assignment and machine-to-template assignment are incomplete.
- DICOM nodes exist, but broader PACS server/storage/backup configuration is incomplete.
- Viewer tool registry includes most VRPACS labels, but many are `deferred-*`, `backend`, or `guarded`.
- Key images and snapshots exist, but crop workflow, fullview snapshot, local/server gallery distinctions, and hard-drive export are incomplete.
- History exists, but VRPACS-style comparison/current-prior workflow is incomplete.
- Download exists as OHIF viewport download, but not DICOM/JPEG/bulk ZIP with anonymization.

### Mostly Missing

- HIS integration: update study from HIS, send result to HIS, HIS sync state filters, cancel approval on HIS.
- Non-DICOM module: camera setup, live capture, video recording, upload pathology/files, copy images between cases, and non-DICOM report workflow.
- Share/collaboration: password/expiry share links, QR links, hide/show patient information, video conference rooms, consult lifecycle, chat.
- Admin catalogs: patients, service types, technical services, procedure catalog UI, ICD mapping, supplies, backup folder config, facility/folder hierarchy, print-template CRUD, machine-template assignment.
- Fine-grained doctor permissions by machine and action.
- User self-service: change password, language, viewer shortcut/WL/layout/tool visibility config.
- Digital signature registration beyond uploaded signature image.
- Guarded destructive workflows: delete study from PACS, delete series, cancel final result with audit/policy, retention cleanup.
- Native/desktop workflows: open folder, direct DICOM print, CD/DVD burn, scanner bridge, external app launch.

## Gap Matrix

| VRPACS area | Current MiniPACS status | Main gaps |
| --- | --- | --- |
| Login/account | Partial | User self change password, language switch, digital certificate/signature registration |
| DICOM worklist/search | Partial | Device/status/HIS sync/overdue filters; detailed filters by referring doctor, indication, body part/protocol, conclusion, group, record code |
| Report workflow | Partial | Receive/read action parity, technologist selection, indication list, personal/order template mode, previous reader result selection, approve/cancel approval/cancel form |
| HIS sync | Missing | Pull/update case from HIS, push result to HIS, sync status display, retry/error audit |
| Add patient/add indication/clinical info | Partial | Standalone actions from DICOM worklist and context menus |
| Archive/result delivery | Partial | Result handoff is present, but bulk export/download/anonymize and cancel/reopen workflows are missing |
| Admin users/roles | Partial | Excel quick import, reset password UI parity, per-machine/per-action permission matrix |
| Admin catalogs | Mostly missing | Patient admin, service type, technical service, ICD mapping, supplies, area/folder hierarchy |
| PACS machines | Partial | Machine-template/print-template/facility assignment, non-DICOM machines, broader server/storage/backup config |
| Viewer basic 2D | Mostly present | Caliper, polygon, mirror ROI, eraser, text marker, free rotate, advanced selection/display controls |
| Viewer MPR/3D | Partial | Robust axial/coronal/sagittal controls, MIP thickness presets, curved MPR, fusion MPR, 3D clipping, 3D print |
| Viewer advanced clinical tools | Mostly missing | NASCET/ESCT, cardiopulmonary, mammography workflow, brain mirror, volume polygon, AI labeling |
| Viewer workflow tools | Partial | Share, video conference, 5D reporting, action history UI, download manager, encode/anonymize patient, PACS/user config |
| Viewer capture/key image | Partial | Crop workflow, fullview snapshot, export all key images, local/server gallery separation |
| Non-DICOM | Missing | Browser camera capture, video recording, image/file/pathology upload, copy/print/delete media |
| Collaboration | Missing | Consultation request/room/status, WebRTC/video, chat, share link QR/password/expiry |
| Download/export/delete | Mostly missing | DICOM/JPEG ZIP, bulk download, anonymization, delete study/series with guardrails |
| Native workstation | Missing | Open folder, DICOM print SCU, CD/DVD burn, scanner capture, external app launcher |

## Roadmap

### Phase 0 - Product Baseline And Safety Map

Goal: freeze the comparison baseline and prevent duplicated/unsafe work.

- Convert this gap analysis into tracked product backlog items.
- Normalize terminology between VRPACS and MiniPACS: study, order, report, final, delivered, cancelled, HIS sync, consultation.
- Add a permission/action matrix covering report, study, viewer, admin, and destructive operations.
- Audit current viewer registry statuses and mark each item as ready, partial, backend-needed, advanced, native, or not planned.
- Define acceptance test cases with sample DICOM, multi-series CT/MR, US cine, and final report cases.

Deliverable: signed-off gap matrix, scope labels, and implementation sequence.

### Phase 1 - DICOM Workflow Parity MVP

Goal: make the main DICOM/RIS workflow feel close to VRPACS for daily reading and result delivery.

- Expand study/worklist filters: machine/device, workflow status, overdue, doctor, indication/procedure, body part/protocol, conclusion, and date presets.
- Add right-click or row action menu: receive/read, open viewer, open report, update clinical info, add indication, cancel form, cancel approval request, mark delivered.
- Extend report form: indication list, technologist, template type `procedure/default` vs `personal`, previous/other-doctor result picker, technique field, selected key images, print template selection.
- Add status transition policy for draft/final/cancel/reopen with audit and addendum rules.
- Improve archive handoff: reopen/report addendum policy, result delivery audit, final report PDF export consistency.

Exit criteria: a DICOM case can move from worklist/order to reading, final report, print/PDF, delivery, and archive without manual database or Orthanc operations.

### Phase 2 - HIS Integration Layer

Goal: implement VRPACS-style HIS update/send workflows behind stable adapters.

- Create HIS integration abstraction with mock adapter first, then HL7/FHIR/REST adapter as deployment-specific.
- Add inbound actions: update case from HIS by order code/accession, refresh demographics, indications, clinical information, and payment/source fields.
- Add outbound actions: send final result to HIS, retry failed result sync, show sync state and error reason.
- Add HIS sync filters and alerting: not synced, failed, pending, sent.
- Add cancel-approval-to-HIS workflow for finalized reports that must be corrected.

Exit criteria: every HIS action is audited, retryable, visible in UI, and can run with a mock HIS in development.

### Phase 3 - Admin Catalogs And Permission Depth

Goal: close the admin/documented catalog gap that supports report automation.

- Add catalog UIs for service type, technical service/procedure, ICD, supplies/materials.
- Implement ICD/procedure to report-template mapping.
- Implement PACS machine assignment: service/procedure, default report templates, print templates, facility/folder, non-DICOM flag.
- Add facility/area and folder hierarchy with `Normal`, `Share`, and `Upload` folder types.
- Add print-template CRUD and default assignment.
- Add backup folder/storage configuration UI and operational status.
- Add per-doctor/per-machine/per-action permission matrix: view, delete study, read result, update HIS, approve, share, consult, cancel consult, cancel approval, edit final result, statistics.
- Add user quick import from Excel and admin reset-password action.

Exit criteria: an admin can configure users, machines, services, ICD/template mappings, print templates, and permissions without editing files.

### Phase 4 - Viewer Web Parity

Goal: finish the VRPACS web-viewer experience before advanced native/AI tools.

- Complete registry-backed tool execution for currently deferred but web-feasible tools: caliper, polygon ROI, mirror ROI, eraser, text marker, free rotate, crop image, fullview snapshot, action history UI.
- Add user viewer config: toolbar position, hotkeys, WW/WL presets F1-F10, per-service layout defaults, tool visibility, overlay fields, and reset/save.
- Enhance key-image/gallery workflow: crop ratio, note, server/local categories, export selected/all, send selected images to report.
- Implement series overflow: convert series to key images, download series, export video, guarded delete series.
- Add download manager with per-job status.
- Add encode/anonymize patient for share/download flows.
- Add hide/show DICOM tags toggle separate from tag browser.
- Improve history panel to open prior/current compare layouts.

Exit criteria: a radiologist can read, annotate, capture, configure the viewer, compare history, and export/share viewer artifacts without leaving the viewer.

### Phase 5 - Advanced MPR/3D And Specialty Tools

Goal: cover high-value advanced imaging tools from the Viewer manual.

- Stabilize CT/MR MPR eligibility and orientation controls: axial, coronal, sagittal.
- Add MIP thickness presets and MIP/MinIP/AvgIP controls.
- Add curved MPR and compare patients on MPR.
- Add fusion MPR when multi-modality data is available.
- Add 3D volume controls: rotate camera, clipping tools, reset camera, print/export 3D snapshot.
- Add specialty measurements: NASCET/ESCT, volume/cylinder volume, cardiothoracic ratio, brain mirror, mammography layout/tools.
- Add AI labeling only after a clear model/service boundary exists.

Exit criteria: advanced tools are guarded by modality/data eligibility and do not corrupt persisted 2D measurements.

### Phase 6 - Non-DICOM Capture Module

Goal: support the NON-DICOM workflow as a first-class module, not as report image upload only.

- Add non-DICOM route and queue with device/status/date/search filters.
- Add browser camera configuration guidance and secure camera permission checks.
- Implement live camera preview, still image capture, crop by ratio, delete, print selected, and copy images between cases.
- Add video recording, playback, fullscreen, delete, and download.
- Add upload file/pathology to a case with typed attachments.
- Reuse report workflow: templates, result form, final/print/deliver.
- Add non-DICOM audit trail and storage lifecycle.

Exit criteria: a clinic can run a non-DICOM exam from capture to report and delivery inside MiniPACS.

### Phase 7 - Sharing And Consultation

Goal: implement VRPACS share and online consultation workflows.

- Add share links with expiry, optional password, QR code, optional patient-info hiding, and revocation.
- Add public/share viewer with strict read-only scope and audit.
- Add consultation request workflow from DICOM and Non-DICOM cases.
- Add room lifecycle: requested, started, in-progress, finished, cancelled.
- Add WebRTC/video room or integrate a deployable video provider.
- Add chat/messages and participant audit.

Exit criteria: a doctor can request consultation, invite participants, share a protected case, and close the consultation with traceable history.

### Phase 8 - Download, Retention, Backup, And Destructive Operations

Goal: make export/delete/backup safe enough for production.

- Add DICOM/JPEG download per study, per series, selected images, and bulk list.
- Add ZIP generation jobs with progress, expiration, and download manager.
- Add anonymization/encode patient options for exports.
- Add guarded delete study and delete series workflows with role, status, confirmation phrase, dry-run, and audit.
- Add retention cleanup for old studies while preserving RIS metadata/report.
- Add backup path configuration, storage health, and restore checklist.

Exit criteria: destructive operations are policy-controlled, reversible where possible, and fully audited.

### Phase 9 - Production Hardening And Native Workstation Extensions

Goal: close operational and workstation-only gaps after web parity is stable.

- Security review: auth, share links, permission bypass, audit completeness, PHI exposure, upload validation.
- Performance/load testing for large CT/MR studies, US cine, viewer hydration, report printing, and export jobs.
- DICOM conformance testing: C-STORE, C-FIND/C-MOVE if enabled, DICOMweb, MWL, SR export.
- Native companion only if needed: open folder, direct DICOM print, CD/DVD burn, scanner bridge, local monitor capture, external viewer launch.
- Deployment observability: logs, health checks, backup verification, alerting.

Exit criteria: MiniPACS is deployable as a production RIS/PACS replacement with a clear boundary between web, server, and optional native companion.

## Recommended Priority

1. Phase 1 and Phase 2 first: they close daily operation gaps and HIS dependency.
2. Phase 3 in parallel after Phase 1 data model decisions: catalogs and permissions unlock automation.
3. Phase 4 next: viewer parity improves doctor adoption.
4. Phase 6 and Phase 7 after core DICOM is stable: non-DICOM and consultation are separate product surfaces.
5. Phase 5, Phase 8, and Phase 9 should be planned deliberately because they carry higher technical, safety, and deployment risk.

