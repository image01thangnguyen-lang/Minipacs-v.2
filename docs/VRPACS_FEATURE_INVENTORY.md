# VRPACS Feature Inventory

Updated: 2026-07-03

## 1. Muc dich

Tai lieu nay gom inventory tinh nang VRPACS va tinh trang MiniPACS hien tai. Day la baseline v0.1 cho Phase 0, dung de tao backlog, scope phase, va tranh viec cac AI/PR sau trien khai trung hoac lech.

## 2. Source

- VRPACS Viewer manual: `HDSD _VIEWER da chuyen ISOFH.docx`
- VRPACS DICOM manual: `HDSD_DICOM da chuyen ISOFH.docx`
- VRPACS Non-DICOM manual: `HDSD_NON-DICOM da chuyen ISOFH.docx`
- VRPACS Admin manual: `HDSD_ADMIN da chuyen ISOFH.docx`
- MiniPACS repo: `dashboard`, `ohif-viewer`, Prisma schema, existing docs.

## 3. Status convention

| Status | Y nghia |
| --- | --- |
| `implemented` | Da co va co workflow chay duoc trong MiniPACS |
| `partial` | Da co mot phan, con thieu UI/action/policy/backend |
| `missing` | Chua co |
| `deferred` | Co trong registry/backlog nhung chu dong de phase sau |
| `not_planned` | Khong dinh lam trong product web hien tai |
| `needs_validation` | Can doi chieu them voi user/HDSD/demo |

## 4. Feature inventory tong hop

| ID | Module | VRPACS feature | MiniPACS status | Current MiniPACS evidence | Gap | Target phase | Priority | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LOGIN-001 | Login/account | Login user/password | implemented | NextAuth/dashboard login | Need hardening only | 9 | P1 | medium |
| LOGIN-002 | Login/account | Change password by user | missing | Admin user exists, self-service not clear | User self change password | 9 | P2 | medium |
| LOGIN-003 | Login/account | Language switch | missing | Vietnamese UI fixed | i18n preference | 9 | P3 | low |
| LOGIN-004 | Login/account | Digital signature/certificate register | partial | `DoctorProfile.signatureImagePath` | Certificate/signature registration policy | 9 | P3 | high |
| DICOM-001 | DICOM worklist | Create order/MWL | implemented | `WorklistOrder`, `/worklist`, MWL file | More catalog-backed fields | 1,3 | P0 | medium |
| DICOM-002 | DICOM worklist | Check-in/arrive | implemented | worklist actions | Status policy needs baseline | 1 | P0 | medium |
| DICOM-003 | DICOM worklist | Cancel order/form | partial | cancel order exists | Cancel form/report distinction | 1 | P0 | high |
| DICOM-004 | DICOM worklist | Receive/read action | partial | start reading/lock exists | VRPACS action parity, audit/history | 1 | P0 | high |
| DICOM-005 | DICOM worklist | Device/status/overdue filters | partial | basic filters exist | More filters by machine/status/overdue/doctor/procedure | 1 | P0 | medium |
| DICOM-006 | DICOM worklist | Add indication/clinical info | partial | notes/procedure fields exist | Standalone update clinical action | 1 | P0 | medium |
| DICOM-007 | DICOM worklist | Select technologist | missing | No stable technologist field | Add technologist to workflow/report | 1 | P1 | medium |
| REPORT-001 | Report | Draft report | implemented | report editor/actions | More fields and viewer artifact insertion | 1 | P0 | medium |
| REPORT-002 | Report | Final/approve report | implemented | report status final | Need cancel approval/addendum policy | 1 | P0 | high |
| REPORT-003 | Report | Cancel approval | partial | addendum/unfinalize planning | Need reason, permission, audit, optional HIS sync | 1,2 | P0 | high |
| REPORT-004 | Report | Cancel report form | partial | draft/report handling exists | Need explicit report cancel action | 1 | P1 | high |
| REPORT-005 | Report | Previous/other doctor result reuse | missing | No picker evidence | Result picker from prior report | 1 | P2 | medium |
| REPORT-006 | Report | Procedure/personal template mode | partial | `ReportTemplateText` scope/owner | Template policy UI | 1,3 | P1 | medium |
| REPORT-007 | Report | Print template select | partial | `PrintTemplate`, report preview | Admin CRUD/default assignment | 1,3 | P1 | medium |
| REPORT-008 | Report | Key images/snapshots in report | partial | report workspace APIs | Select/insert artifacts more complete | 1,4 | P1 | medium |
| HIS-001 | HIS | Update case from HIS | missing | No adapter | HIS inbound adapter/action | 2 | P0 | high |
| HIS-002 | HIS | Send result to HIS | missing | No adapter | HIS outbound adapter/action | 2 | P0 | high |
| HIS-003 | HIS | HIS sync status/filter | missing | No sync fields | Status, retry, error | 2 | P0 | high |
| HIS-004 | HIS | Cancel approval to HIS | missing | No HIS | Cancel/retract policy | 2 | P1 | high |
| ARCH-001 | Archive | Search archive | implemented | `/archive` | More filters/export | 1,8 | P1 | medium |
| ARCH-002 | Archive | Reprint/PDF | implemented | PDF/reprint log evidence | Standardize final PDF consistency | 1 | P1 | medium |
| ARCH-003 | Archive | Mark delivered | implemented | `archive.deliver` | Audit/status policy hardening | 1 | P0 | medium |
| ARCH-004 | Archive | Reopen/addendum from archive | partial | addendum model | UI policy | 1 | P1 | high |
| ADMIN-USER-001 | Admin users | User CRUD | implemented | `/admin/users` | Quick import/reset UX | 3 | P1 | medium |
| ADMIN-USER-002 | Admin users | Role profile/permissions | implemented | `AppRoleProfile`, permissions | Per-machine/action matrix | 3 | P0 | high |
| ADMIN-USER-003 | Admin users | Excel quick import | missing | No import UI | CSV/XLSX dry-run import | 3 | P1 | medium |
| ADMIN-USER-004 | Admin users | Reset password UI | partial | user admin can edit? | Explicit reset with audit | 3 | P1 | medium |
| ADMIN-CAT-001 | Admin catalogs | Service type catalog | missing | No model/UI | `ServiceTypeCatalog` | 3 | P0 | medium |
| ADMIN-CAT-002 | Admin catalogs | Technical service/procedure | partial | `ProcedureCatalog` | Full UI and mapping | 3 | P0 | medium |
| ADMIN-CAT-003 | Admin catalogs | ICD catalog/mapping | missing | No model/UI | ICD catalog and mapping | 3 | P1 | medium |
| ADMIN-CAT-004 | Admin catalogs | Supplies/materials | missing | No model/UI | Catalog MVP | 3 | P3 | low |
| ADMIN-CAT-005 | Admin catalogs | Patient admin | partial | patient fields embedded in order/study | Standalone patient catalog needs validation | 3/9 | P3 | high |
| PACS-001 | PACS admin | DICOM node CRUD | implemented | `/admin/pacs/nodes`, `DicomNode` | Machine assignment extensions | 3 | P0 | medium |
| PACS-002 | PACS admin | C-Echo/sync modality | implemented | node actions | Health history already partial | 3/9 | P1 | medium |
| PACS-003 | PACS admin | Machine-template assignment | missing | No mapping | Report/print default by node | 3 | P0 | medium |
| PACS-004 | PACS admin | Facility/folder hierarchy | missing | Clinic profile only | Facility/area/folder configs | 3 | P1 | medium |
| PACS-005 | PACS admin | Backup folder/storage config | partial | statistics storage health | Admin config/status | 3,8 | P1 | high |
| VIEW-001 | Viewer basic | Open OHIF viewer | implemented | `/viewer/minipacs` links | Regression only | 4 | P0 | high |
| VIEW-002 | Viewer basic | Pan/zoom/WL/scroll/cine | implemented | tool registry ready | Verify command smoke | 4 | P0 | medium |
| VIEW-003 | Viewer measurements | Length/angle/ROI/basic annotations | partial | registry, measurement persistence | Tool status audit, persistence QA | 4 | P0 | medium |
| VIEW-004 | Viewer tools | Caliper/polygon/text/eraser/free rotate | partial/deferred | registry has deferred entries | Implement web-feasible or reason | 4 | P1 | medium |
| VIEW-005 | Viewer workflow | Action history UI | missing | `ViewerAuditLog` exists | Panel/API | 4 | P1 | low |
| VIEW-006 | Viewer config | User viewer config/hotkeys/WL/layout | partial | `layoutPresetService` local | Server preference UI | 4 | P1 | medium |
| VIEW-007 | Viewer capture | Key images/snapshots | partial | `ViewerKeyImage`, `ViewerSnapshot` | Thumbnail/crop/fullview/gallery/export | 4 | P1 | medium |
| VIEW-008 | Viewer history | Prior studies/history | partial | history endpoint/panel | Compare current/prior layout | 4 | P2 | medium |
| VIEW-009 | Viewer tags | DICOM tag browser | implemented | `TagBrowser` ready | Overlay tag toggle | 4 | P2 | low |
| VIEW-010 | Viewer export | Download manager/export | missing/partial | OHIF viewport download only | Job-based manager | 4,8 | P1 | high |
| VIEW-011 | Viewer anonymize | Encode/anonymize patient | missing | registry guarded | Export/display anonymize mode | 4,8 | P1 | high |
| VIEW-ADV-001 | Viewer advanced | MPR/MIP/VR/3D | partial/deferred | MPR/MIP services exist but advanced parity not stable | Phase 5 eligibility/controls | 5 | P1 | high |
| VIEW-ADV-002 | Viewer specialty | NASCET, mammo, cardio, brain mirror | missing/deferred | registry deferred | Custom tools, modality guard | 5 | P2 | high |
| NONDICOM-001 | Non-DICOM | Non-DICOM queue | missing | No module | Route/queue/status | 6 | P1 | high |
| NONDICOM-002 | Non-DICOM | Camera live capture | missing | No module | Browser camera, capture, permissions | 6 | P1 | high |
| NONDICOM-003 | Non-DICOM | Video recording/playback | missing | No module | Media capture/storage | 6 | P2 | high |
| NONDICOM-004 | Non-DICOM | Upload pathology/files | missing | Generic upload maybe report image only | Typed attachments | 6 | P2 | medium |
| NONDICOM-005 | Non-DICOM | Copy/print/delete media | missing | No module | Media workflow and audit | 6 | P2 | high |
| SHARE-001 | Share | Protected share link | missing | No module | Expiry/password/QR | 7 | P1 | high |
| SHARE-002 | Share | Hide patient info | missing | anonymize planned | Patient-info hiding in share viewer | 7 | P1 | high |
| CONSULT-001 | Consultation | Consult request/room/status | missing | No module | Lifecycle and audit | 7 | P1 | high |
| CONSULT-002 | Consultation | Video/chat | missing | No module | WebRTC/provider integration | 7 | P2 | high |
| EXPORT-001 | Export | DICOM/JPEG/bulk ZIP | missing/partial | no job manager | Job, progress, expiry | 8 | P1 | high |
| EXPORT-002 | Export | Anonymized export | missing | no policy | Anonymize metadata/files | 8 | P1 | high |
| DELETE-001 | Destructive | Delete study | missing/guarded | no production workflow | Guarded delete policy | 8 | P1 | critical |
| DELETE-002 | Destructive | Delete series | missing/guarded | registry guarded | Guarded delete policy | 8 | P1 | critical |
| RETENTION-001 | Storage | Retention cleanup | missing | no cleanup policy | Cleanup metadata/report-safe | 8 | P2 | high |
| NATIVE-001 | Native | Open folder | missing/deferred-native | registry deferred | Native companion only if needed | 9 | P3 | medium |
| NATIVE-002 | Native | DICOM print/CD burn/scanner | missing/deferred-native | registry deferred | Native/server gateway | 9 | P3 | high |
| STATS-001 | Statistics | Realtime/statistics/SLA | implemented | `/statistics` | Extend with new statuses/jobs | 9 | P2 | medium |

## 5. Current implementation anchors

| Area | Main files/models |
| --- | --- |
| Permissions | `dashboard/lib/permissions.ts`, `dashboard/lib/authz.ts` |
| Worklist/order | `dashboard/app/worklist/**`, `WorklistOrder` |
| Study sync/status | `dashboard/lib/studyStatus.ts`, `ImagingStudy`, `StudyStatusHistory`, `ImagingStudyEvent` |
| Report | `dashboard/app/report/[studyInstanceUid]/**`, `Report`, `ReportAddendum` |
| Archive | `dashboard/app/archive/**` |
| Admin users | `dashboard/app/admin/users/**`, `User`, `AppRoleProfile`, `DoctorProfile` |
| PACS nodes | `dashboard/app/admin/pacs/nodes/**`, `DicomNode` |
| Catalog/template | `ProcedureCatalog`, `ReportTemplateText`, `PrintTemplate` |
| Viewer UI | `ohif-viewer/extensions/minipacs/src/**`, `ohif-viewer/modes/minipacs-viewer/src/**` |
| Viewer artifacts | `ViewerMeasurement`, `ViewerKeyImage`, `ViewerSnapshot`, viewer APIs |
| Statistics | `dashboard/app/statistics/**`, `PacsHealthSnapshot`, `OperationalAlert` |

## 6. Items can validation

- Exact VRPACS `approve` vs MiniPACS `finalize` semantics.
- Whether `cancel form` means order cancel, report draft cancel, or final report cancel.
- HIS payload fields and order code/accession mapping.
- Non-DICOM media storage policy and retention.
- Actual expected behavior of `encode patient` in VRPACS Viewer.
- Which native workstation features are truly required in deployment.

