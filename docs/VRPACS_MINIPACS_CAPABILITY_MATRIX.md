# VRPACS - MiniPACS Capability Matrix

Updated: 2026-07-03

## 1. Muc dich

Tai lieu nay doi chieu nang luc VRPACS voi MiniPACS hien tai theo nhom san pham. Khac voi feature inventory chi tiet, file nay la matrix cap cao de quyet dinh scope phase va tranh conflict.

## 2. Status scale

| Status | Meaning |
| --- | --- |
| `strong` | MiniPACS da dap ung tot |
| `partial` | Co nen tang, can bo sung UI/policy/backend |
| `missing` | Chua co module/chuc nang |
| `deferred` | Co trong backlog/registry, se lam sau |
| `blocked` | Can spec/vendor/deployment decision |

## 3. Capability matrix

| Area | VRPACS expected capability | MiniPACS current capability | Status | Main gap | Target phase | Conflict risk |
| --- | --- | --- | --- | --- | --- | --- |
| Login/account | Login, change password, language, signature/certificate | Login/auth, admin user, signature image | partial | self-service, i18n, certificate policy | 9 | medium |
| Role/permission | Role, per-action permissions | Global permission keys, role profiles | partial | per-machine/per-action matrix | 3 | high |
| DICOM worklist | Create/check-in/cancel/order filters | Worklist order + MWL + check-in/cancel | partial | richer filters, cancel semantics, clinical update | 1 | high |
| Study sync | DICOM received -> RIS/PACS study | Orthanc sync to `ImagingStudy` | strong | more status policy/audit | 1 | medium |
| Reading workflow | receive/read/lock/assign doctor | start reading/assigned doctor partial | partial | VRPACS action menu and transitions | 1 | high |
| Report draft/final | Draft, approve, cancel approval, print | Report draft/final, templates, PDF/print | partial | cancel approval, addendum, previous result picker | 1 | high |
| Report templates | Global/personal/procedure templates | `ReportTemplateText` with scope/owner | partial | procedure/ICD/machine mapping | 1,3 | medium |
| Print templates | CRUD/default templates | `PrintTemplate` model/render | partial | admin CRUD/default assignment | 3 | medium |
| HIS sync | update from HIS/send result/retry | missing | missing | adapter, sync state, retry, audit | 2 | high |
| Archive/result delivery | Search, reprint, deliver, reopen | Archive search/reprint/deliver | partial | export, addendum/reopen, bulk download | 1,8 | medium |
| Admin catalogs | Service type, procedure, ICD, supplies | `ProcedureCatalog` basic | partial | full catalogs and mappings | 3 | medium |
| PACS machine admin | DICOM nodes, machine config, templates, folder | DICOM node CRUD/C-Echo | partial | facility/folder/template/procedure assignment | 3 | medium |
| Storage/backup | Folder hierarchy, backup config/status | storage health in statistics partial | partial | admin config, backup policy | 3,8 | high |
| Viewer basic 2D | Open viewer, pan/zoom/WL/measurements | OHIF MiniPACS viewer | strong | smoke hardening | 4 | medium |
| Viewer workflow | history, gallery, report bridge, action history | history/gallery/report bridge partial | partial | action history, compare, export/send selected | 4 | medium |
| Viewer config | user hotkeys/WL/layout/tool visibility | local layout presets partial | partial | server preference UI | 4 | medium |
| Viewer capture | key image, snapshot, crop, fullview | key/snapshot metadata | partial | actual preview/crop/fullview/category | 4 | medium |
| Viewer download/export | DICOM/JPEG/video/download manager | viewport download only | missing | job-based export/download | 4,8 | high |
| Viewer anonymize | encode/anonymize patient | missing/guarded | missing | export/display anonymize mode | 4,8 | high |
| Viewer MPR/3D | MPR/MIP/VR/fusion/curved/clipping | some MPR/MIP service, not parity | partial/deferred | stability, eligibility, controls | 5 | high |
| Viewer specialty | mammo, NASCET, cardio, AI | mostly missing/deferred | missing | custom tool packages | 5 | high |
| Non-DICOM | camera/photo/video/upload/report | missing | missing | full module | 6 | high |
| Share | expiry/password/QR/hide patient | missing | missing | share links and public viewer | 7 | high |
| Consultation | request/room/video/chat/status | missing | missing | consult lifecycle and provider | 7 | high |
| Destructive ops | delete study/series/retention | missing/guarded | missing | permission, confirmation, audit, restore note | 8 | critical |
| Native workstation | open folder, DICOM print, CD burn, scanner | missing/deferred-native | deferred | native companion/gateway decision | 9 | high |
| Statistics | operational dashboards | strong statistics dashboard | strong | include new phase metrics | 9 | medium |

## 4. Phase dependency view

| Phase | Depends on | Unlocks |
| --- | --- | --- |
| Phase 0 | docs and current code inventory | Safe implementation plan |
| Phase 1 | Phase 0 terminology/status/permission | DICOM daily workflow parity |
| Phase 2 | Phase 0/1 data semantics | HIS adapter and retry |
| Phase 3 | Phase 0/1 data model decisions | Catalogs, templates, machine permission |
| Phase 4 | Viewer registry and existing APIs | Viewer web parity |
| Phase 5 | Phase 4 stable viewer shell | Advanced MPR/3D/specialty tools |
| Phase 6 | Phase 1 report workflow, Phase 3 catalogs/storage | Non-DICOM capture |
| Phase 7 | Phase 4 anonymize/export boundary, Phase 6 optional | Share and consultation |
| Phase 8 | Phase 3 storage/permission, Phase 4 download jobs | Export/delete/retention safety |
| Phase 9 | All core product phases | Production hardening/native extensions |

## 5. High-conflict areas

| Area | Why conflict likely | Guardrail |
| --- | --- | --- |
| Study/report status | Many actions want to update status | Use `VRPACS_WORKFLOW_STATUS_POLICY.md`; no direct scattered status writes |
| Permission keys | Each phase may add new permissions | Use `VRPACS_PERMISSION_ACTION_MATRIX.md`; enforce server-side |
| HIS fields | Phase 1/2/3 all touch procedure/order/report | HIS adapter-first, separate local code and HIS code |
| Template selection | Phase 1 report and Phase 3 catalogs overlap | Phase 3 owns mappings; Phase 1 can use fallback |
| Viewer registry | Many viewer tools already present but deferred | Registry is contract; ready only after verification |
| Export/anonymize | Phase 4 and Phase 8 overlap | Phase 4 artifact export; Phase 8 DICOM/bulk/destructive |
| Delete series/study | Viewer menu may expose delete | Phase 4 request/dry-run only; Phase 8 actual policy |
| Storage folders | Upload/share/backup/download all need paths | Phase 3 config, Phase 8 retention/backup runtime |

## 6. Recommended source of truth

| Question | Read this file first |
| --- | --- |
| What feature exists/missing? | `VRPACS_FEATURE_INVENTORY.md` |
| What phase owns a feature? | `VRPACS_IMPLEMENTATION_BACKLOG.md` |
| What does a term mean? | `VRPACS_TERMINOLOGY_MAP.md` |
| What permission should an action use? | `VRPACS_PERMISSION_ACTION_MATRIX.md` |
| What status transition is allowed? | `VRPACS_WORKFLOW_STATUS_POLICY.md` |
| What must be audited? | `VRPACS_DATA_AUDIT_SAFETY_MAP.md` |
| How to test acceptance? | `VRPACS_ACCEPTANCE_TEST_SCENARIOS.md` |

