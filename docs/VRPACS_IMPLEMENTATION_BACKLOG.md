# VRPACS Implementation Backlog

Updated: 2026-07-03

## 1. Muc dich

Tai lieu nay bien gap analysis thanh backlog theo phase, priority, dependency, va acceptance. Day la v0.1 baseline; moi PR/phase co the cap nhat khi scope thay doi.

## 2. Priority

| Priority | Meaning |
| --- | --- |
| P0 | Must have for phase exit or safety |
| P1 | High value, should include if feasible |
| P2 | Useful, can move to later PR |
| P3 | Nice-to-have or needs validation |

## 3. Backlog fields

| Field | Meaning |
| --- | --- |
| ID | Stable backlog id |
| Phase | Target phase |
| Type | docs, backend, frontend, schema, integration, QA |
| Risk | low, medium, high, critical |
| Dependency | Prior item/phase |
| Acceptance | Minimum done signal |

## 4. Phase 0 - Baseline

| ID | Item | Type | Priority | Risk | Dependency | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| P0-001 | Create terminology map | docs | P0 | low | none | `VRPACS_TERMINOLOGY_MAP.md` exists |
| P0-002 | Create feature inventory | docs | P0 | low | roadmap | Inventory covers main modules |
| P0-003 | Create capability matrix | docs | P0 | low | inventory | Matrix maps status/gap/phase |
| P0-004 | Create permission action matrix | docs | P0 | medium | current permissions | Actions have permission/audit/reason |
| P0-005 | Create workflow status policy | docs | P0 | high | status code review | Transitions and guards documented |
| P0-006 | Create data audit safety map | docs | P0 | high | audit model review | Sensitive data and audit rules documented |
| P0-007 | Create acceptance scenarios | docs | P0 | medium | matrix | At least 10 manual scenarios |
| P0-008 | Create implementation backlog | docs | P0 | low | all above | Backlog grouped by phase |

## 5. Phase 1 - DICOM Workflow Parity MVP

| ID | Item | Type | Priority | Risk | Dependency | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| P1-001 | Normalize workflow/status service usage | backend | P0 | high | P0-005 | Important transitions use helper and history |
| P1-002 | Expand study/worklist filters | frontend/backend | P0 | medium | current list pages | Filters by status/date/modality/doctor/procedure |
| P1-003 | Add row action menu | frontend | P0 | medium | P1-001 | open viewer/report/start reading/update clinical/mark delivered |
| P1-004 | Add update clinical/add indication actions | backend/frontend | P1 | medium | P1-001 | Server-side permission and audit |
| P1-005 | Extend report fields | schema/frontend | P1 | medium | P0 terminology | technique, clinical info, technologist, print template |
| P1-006 | Final/unfinalize/addendum policy | backend/frontend | P0 | critical | P1-001 | Final locked; unfinalize requires reason/history |
| P1-007 | Viewer artifact panel in report | frontend/backend | P1 | medium | existing viewer APIs | Measurements/key/snapshot usable in report |
| P1-008 | Archive handoff hardening | backend/frontend | P1 | medium | P1-006 | deliver/reprint/addendum history visible |
| P1-009 | Phase 1 regression QA | QA | P0 | high | P1 items | SCN-001 to SCN-006 and SCN-018 pass |

## 6. Phase 2 - HIS Integration Layer

| ID | Item | Type | Priority | Risk | Dependency | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| P2-001 | HIS adapter interface and mock adapter | backend | P0 | high | Phase 1 data semantics | disabled/mock modes work |
| P2-002 | HIS sync fields/log model | schema | P0 | high | P2-001 | Sync status/log persisted |
| P2-003 | Update case from HIS action | backend/frontend | P0 | high | P2-001 | Pull demographics/clinical info with audit |
| P2-004 | Send final result to HIS action | backend/frontend | P0 | high | P1 final policy | Draft blocked, final sent/retryable |
| P2-005 | HIS retry/error UI | frontend/backend | P1 | medium | P2-002 | failed/pending/sent visible |
| P2-006 | HIS permissions | backend | P0 | medium | P0-004 | `his.*` permissions enforced |
| P2-007 | Phase 2 QA | QA | P0 | high | P2 items | SCN-007 passes in mock mode |

## 7. Phase 3 - Admin Catalogs And Permission Depth

| ID | Item | Type | Priority | Risk | Dependency | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| P3-001 | Add catalog schemas | schema | P0 | high | P0 inventory | service/procedure/ICD/supplies/mappings |
| P3-002 | Admin catalogs UI | frontend/backend | P0 | medium | P3-001 | CRUD active/inactive audited |
| P3-003 | Procedure/template resolver | backend | P0 | medium | P3-001 | Specific mapping fallback works |
| P3-004 | Print template CRUD/default assignment | frontend/backend | P1 | medium | `PrintTemplate` | Preview and mapping work |
| P3-005 | Extend DICOM node machine assignment | frontend/backend/schema | P1 | high | P3-001 | facility/folder/procedure/template assignment |
| P3-006 | Facility/folder/storage config | frontend/backend/schema | P1 | high | P3-001 | folder types and status check |
| P3-007 | Per-machine permission matrix | frontend/backend/schema | P0 | high | P0-004 | Empty fallback, deny override works |
| P3-008 | User import dry-run | backend/frontend | P1 | medium | users admin | duplicate validation and audit |
| P3-009 | Reset password hardening | backend/frontend | P1 | high | users admin | no plain password in audit |
| P3-010 | Phase 3 QA | QA | P0 | high | P3 items | SCN-008, SCN-009, SCN-018 pass |

## 8. Phase 4 - Viewer Web Parity

| ID | Item | Type | Priority | Risk | Dependency | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| P4-001 | Viewer registry audit | frontend/docs | P0 | medium | existing registry | Status/reason/commands accurate |
| P4-002 | Viewer preferences API/UI | schema/backend/frontend | P1 | medium | P4-001 | save/reload/reset works |
| P4-003 | Web-feasible tool commands | frontend | P1 | medium | P4-001 | Ready tools do not crash |
| P4-004 | Capture/crop/fullview snapshot | frontend/backend | P1 | high | viewer artifacts | preview/artifact saved |
| P4-005 | Gallery multi-select/send report/export | frontend/backend | P1 | medium | P4-004 | selected artifacts usable |
| P4-006 | Action history panel | frontend/backend | P1 | low | `ViewerAuditLog` | study-scoped action list |
| P4-007 | Download manager jobs | schema/backend/frontend | P1 | high | storage config optional | selected artifact export |
| P4-008 | Anonymize export mode | backend/frontend | P1 | high | P4-007 | no source mutation, no PHI filename |
| P4-009 | History compare | frontend | P2 | medium | history endpoint | current/prior compare opens |
| P4-010 | Series overflow actions | frontend/backend | P2 | high | P4-007 | key images/download/delete request |
| P4-011 | Phase 4 QA | QA | P0 | high | P4 items | SCN-010 to SCN-013 and SCN-018 pass |

## 9. Phase 5 - Advanced MPR/3D And Specialty Tools

| ID | Item | Type | Priority | Risk | Dependency | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| P5-001 | MPR eligibility guard | frontend | P0 | high | Phase 4 viewer stable | CT/MR only when safe |
| P5-002 | Axial/coronal/sagittal controls | frontend | P1 | high | P5-001 | Orientation controls verified |
| P5-003 | MIP/MinIP/AvgIP thickness controls | frontend | P1 | high | P5-001 | Presets work on eligible data |
| P5-004 | Curved MPR | frontend | P2 | high | P5-001 | Guarded by data eligibility |
| P5-005 | Fusion MPR | frontend | P2 | high | multi-modality data | No corrupt measurement state |
| P5-006 | 3D volume controls | frontend | P2 | high | volume engine | rotate/clip/reset/export snapshot |
| P5-007 | Specialty measurements | frontend/backend | P2 | high | modality-specific design | NASCET/mammo/cardio etc guarded |

## 10. Phase 6 - Non-DICOM Capture Module

| ID | Item | Type | Priority | Risk | Dependency | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| P6-001 | Non-DICOM data model/queue | schema/backend/frontend | P0 | high | Phase 3 catalogs/storage | queue filters/status |
| P6-002 | Browser camera still capture | frontend/backend | P1 | high | P6-001 | capture/save/delete audited |
| P6-003 | Crop/print/copy images | frontend/backend | P2 | medium | P6-002 | media workflow works |
| P6-004 | Video recording/playback | frontend/backend | P2 | high | media storage | record/play/download |
| P6-005 | File/pathology upload | frontend/backend | P2 | medium | storage | typed attachments |
| P6-006 | Reuse report workflow | backend/frontend | P0 | high | Phase 1 reports | draft/final/print/deliver |
| P6-007 | Phase 6 QA | QA | P0 | high | P6 items | SCN-014 passes |

## 11. Phase 7 - Sharing And Consultation

| ID | Item | Type | Priority | Risk | Dependency | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| P7-001 | Share link model/API | schema/backend | P0 | high | Phase 4 anonymize boundary | expiry/password/revoke |
| P7-002 | Public read-only share viewer | frontend/backend | P0 | high | P7-001 | scoped access only |
| P7-003 | QR/password/hide patient info | frontend/backend | P1 | high | P7-001 | options enforced |
| P7-004 | Consultation model/lifecycle | schema/backend/frontend | P1 | high | Phase 1/6 cases | request/start/finish/cancel |
| P7-005 | Chat/video provider integration | integration/frontend | P2 | high | provider decision | participants audited |
| P7-006 | Phase 7 QA | QA | P0 | high | P7 items | SCN-015, SCN-016 pass |

## 12. Phase 8 - Download, Retention, Backup, Destructive Operations

| ID | Item | Type | Priority | Risk | Dependency | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| P8-001 | DICOM/JPEG study/series export | backend/frontend | P1 | high | Phase 4 jobs | ZIP jobs with progress |
| P8-002 | Anonymized DICOM/JPEG export | backend | P1 | high | P8-001 | metadata scrub verified |
| P8-003 | Guarded delete series | backend/frontend | P0 | critical | P0 safety, Phase 3 permissions | dry-run, confirmation, audit |
| P8-004 | Guarded delete study | backend/frontend | P0 | critical | P8-003 | policy-controlled execution |
| P8-005 | Retention cleanup | backend/admin | P2 | critical | storage policy | dry-run and audit |
| P8-006 | Backup config/status/restore checklist | backend/frontend/docs | P1 | high | Phase 3 storage | health/status visible |
| P8-007 | Phase 8 QA | QA | P0 | critical | P8 items | SCN-017 passes |

## 13. Phase 9 - Production Hardening And Native Extensions

| ID | Item | Type | Priority | Risk | Dependency | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| P9-001 | Security review | QA/security | P0 | critical | core phases | auth/share/PHI/audit review |
| P9-002 | Performance/load testing | QA | P1 | high | viewer/export/report | large CT/MR and jobs tested |
| P9-003 | DICOM conformance testing | QA/integration | P1 | high | PACS features | C-STORE/MWL/DICOMweb verified |
| P9-004 | Observability/health checks | backend/devops | P1 | medium | deployment | logs/alerts/backups visible |
| P9-005 | User self-service | frontend/backend | P2 | medium | auth | change password/language |
| P9-006 | Native companion decision | architecture | P3 | high | deployment need | open folder/print/CD/scanner decision |

## 14. Next implementation recommendation

Recommended order after this baseline:

1. Finish Phase 1 workflow/status/report parity before large HIS or viewer export work.
2. Implement Phase 2 mock HIS adapter once report final policy is stable.
3. Do Phase 3 catalogs/permissions in parallel only if schema decisions are coordinated.
4. Do Phase 4 viewer parity after registry audit, keeping destructive delete deferred.
5. Leave Phase 5/8 high-risk work until safety policies are implemented.

