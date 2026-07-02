# VRPACS Permission Action Matrix

Updated: 2026-07-03

## 1. Muc dich

Tai lieu nay la baseline quyen/action cho MiniPACS khi doi chieu VRPACS. Moi action nhay cam phai co permission server-side, reason policy neu can, va audit rule. Client hide/show button khong du de bao ve action.

## 2. Existing MiniPACS permission keys

Hien tai `dashboard/lib/permissions.ts` co cac key:

- `studies.read`
- `reports.read`
- `reports.write`
- `worklist.manage`
- `archive.read`
- `archive.deliver`
- `statistics.read`
- `statistics.doctorStats`
- `users.manage`
- `templates.manage`
- `clinic.manage`
- `pacs.manage`

Phase sau co the them granular keys, nhung phai cap nhat file nay truoc hoac cung PR.

## 3. Proposed new permission keys

| Permission | Target phase | Purpose |
| --- | --- | --- |
| `reports.finalize` | 1 | Final/approve report, neu tach khoi `reports.write` |
| `reports.unfinalize` | 1 | Cancel approval/edit final with reason |
| `reports.cancel` | 1 | Cancel draft/report form |
| `his.read` | 2 | View HIS sync details/logs |
| `his.sync` | 2 | Update from HIS/send result |
| `his.retry` | 2 | Retry failed HIS sync |
| `his.manage` | 2 | Configure HIS adapter/health |
| `catalogs.manage` | 3 | Service/procedure/ICD/supplies catalogs |
| `machinePermissions.manage` | 3 | Per-machine/action matrix |
| `storage.manage` | 3 | Folder/backup/storage config |
| `viewer.configure` | 4 | Save viewer user/admin preferences |
| `viewer.export` | 4/8 | Export/download viewer artifacts |
| `viewer.anonymize` | 4/8 | Use anonymized export/share |
| `viewer.history` | 4 | Open history/compare, can fallback `studies.read` |
| `viewer.deleteSeries` | 8 | Actual delete series, not Phase 4 |
| `share.manage` | 7 | Create/revoke share links |
| `consult.manage` | 7 | Create/cancel consultation |
| `study.delete` | 8 | Actual delete study |
| `retention.manage` | 8 | Retention cleanup |
| `system.audit` | 9 | View audit/security logs |

## 4. Action matrix

| Action ID | Action | Module | Default actors | Permission baseline | Reason required | Audit required | Target phase | Risk | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACT-001 | Open study list | DICOM | admin, doctor, technician, reception | `studies.read` | no | optional | 1 | low | Existing |
| ACT-002 | Open viewer | Viewer | admin, doctor, technician | `studies.read` | no | yes | 1/4 | medium | Audit viewer open |
| ACT-003 | Create worklist order | Worklist | admin, reception, technician | `worklist.manage` | no | yes | 1 | medium | Writes PHI/order |
| ACT-004 | Check in order | Worklist | admin, reception, technician | `worklist.manage` | no | yes | 1 | medium | Status change |
| ACT-005 | Cancel order | Worklist | admin, reception | `worklist.manage` | yes | yes | 1 | high | Must not delete study images |
| ACT-006 | Regenerate MWL | Worklist | admin, technician | `worklist.manage` | optional | yes | 1 | medium | Keep file path audit |
| ACT-007 | Update clinical info | Worklist/report | admin, doctor, technician | `worklist.manage` or `reports.write` | optional | yes | 1 | medium | Track old/new summary |
| ACT-008 | Add indication | Worklist/report | admin, doctor, technician | `worklist.manage` or `reports.write` | optional | yes | 1 | medium | Catalog-backed later |
| ACT-009 | Assign doctor | DICOM | admin, technician | `worklist.manage` | optional | yes | 1 | medium | Per-machine permission later |
| ACT-010 | Start reading | Report | doctor, admin | `reports.write` | no | yes | 1 | high | Lock/transition to READING |
| ACT-011 | Save report draft | Report | doctor, admin | `reports.write` | no | yes | 1 | medium | Not sent to HIS |
| ACT-012 | Finalize report | Report | doctor, admin | `reports.finalize` or `reports.write` | no | yes | 1 | high | Lock report |
| ACT-013 | Print/export report PDF | Report/archive | doctor, reception, admin | `reports.read` or `archive.read` | no | yes | 1 | medium | PHI output |
| ACT-014 | Mark delivered | Archive | reception, admin | `archive.deliver` | optional | yes | 1 | medium | Result handoff |
| ACT-015 | Cancel report draft/form | Report | doctor, admin | `reports.cancel` or `reports.write` | yes | yes | 1 | high | Do not delete final silently |
| ACT-016 | Unfinalize/cancel approval | Report | admin, senior doctor | `reports.unfinalize` | yes | yes | 1/2 | critical | Must create addendum/history |
| ACT-017 | Edit final report | Report | admin, senior doctor | `reports.unfinalize` | yes | yes | 1 | critical | Addendum or versioning only |
| ACT-018 | Send selected viewer artifacts to report | Viewer/report | doctor | `reports.write` | no | yes | 1/4 | medium | Key/snapshot/measurement |
| ACT-019 | Update case from HIS | HIS | reception, technician, admin | `his.sync` | optional | yes | 2 | high | Adapter only |
| ACT-020 | Send final result to HIS | HIS | doctor, admin | `his.sync` | no | yes | 2 | high | Only final report |
| ACT-021 | Retry HIS sync | HIS | admin, technician | `his.retry` | optional | yes | 2 | medium | Log attempts |
| ACT-022 | Configure HIS adapter | HIS | admin | `his.manage` | yes | yes | 2 | high | No secrets in logs |
| ACT-023 | Manage users | Admin | admin | `users.manage` | no | yes | 3 | high | Existing |
| ACT-024 | Import users | Admin | admin | `users.manage` or `users.import` | no | yes | 3 | high | Dry-run, no password logs |
| ACT-025 | Reset user password | Admin | admin | `users.manage` or `users.resetPassword` | optional | yes | 3 | high | Temporary password one-time only |
| ACT-026 | Manage role profile | Admin | admin | `users.manage` | optional | yes | 3 | high | Prevent self-lockout |
| ACT-027 | Manage service/procedure/ICD catalogs | Admin | admin | `catalogs.manage` or `templates.manage` | optional | yes | 3 | medium | Soft deactivate |
| ACT-028 | Manage report template mappings | Admin | admin | `templates.manage` | optional | yes | 3 | medium | Default only for new reports |
| ACT-029 | Manage print templates | Admin | admin | `templates.manage` | optional | yes | 3 | medium | Preview/sanitize |
| ACT-030 | Manage DICOM nodes | PACS | admin | `pacs.manage` | optional | yes | 3 | high | Existing |
| ACT-031 | Configure machine assignments | PACS/admin | admin | `pacs.manage` | optional | yes | 3 | high | Procedure/template/folder |
| ACT-032 | Manage per-machine permission matrix | Admin | admin | `machinePermissions.manage` or `users.manage` | optional | yes | 3 | high | Fallback global permissions |
| ACT-033 | Manage storage/folder config | Admin | admin | `storage.manage` or `clinic.manage` | yes | yes | 3 | high | No secret/path leak |
| ACT-034 | Save viewer preference | Viewer | authenticated user | `viewer.configure` or `studies.read` | no | yes | 4 | low | Own preference |
| ACT-035 | Save key image | Viewer | doctor, technician | `studies.read` | no | yes | 4 | medium | PHI context |
| ACT-036 | Save snapshot/crop/fullview | Viewer | doctor, technician | `studies.read` | no | yes | 4 | medium | Protected media |
| ACT-037 | Open viewer action history | Viewer | doctor, admin | `viewer.history` or `studies.read` | no | yes | 4 | low | Study-scoped |
| ACT-038 | Export viewer artifacts | Viewer/export | doctor, admin | `viewer.export` | optional | yes | 4 | high | Job-based |
| ACT-039 | Anonymized export | Viewer/export | doctor, admin | `viewer.anonymize` or `viewer.export` | optional | yes | 4/8 | high | Do not mutate source |
| ACT-040 | Convert series to key images | Viewer | doctor | `studies.read` | optional | yes | 4 | medium | Limit count |
| ACT-041 | Request delete series | Viewer | admin, senior doctor | `viewer.deleteSeries` or `pacs.manage` | yes | yes | 4/8 | critical | Phase 4 request only |
| ACT-042 | Create share link | Share | doctor, admin | `share.manage` | optional | yes | 7 | high | Expiry/password |
| ACT-043 | Revoke share link | Share | owner, admin | `share.manage` | optional | yes | 7 | high | Must stop access |
| ACT-044 | Create consultation | Consult | doctor | `consult.manage` | optional | yes | 7 | medium | Participants audit |
| ACT-045 | Cancel consultation | Consult | owner, admin | `consult.manage` | yes | yes | 7 | medium | Lifecycle status |
| ACT-046 | Download DICOM/JPEG study/series | Export | doctor, admin | `viewer.export` or `archive.read` | optional | yes | 8 | high | Job, expiry |
| ACT-047 | Delete series actual | Destructive | admin | `viewer.deleteSeries` | yes | yes | 8 | critical | Confirmation phrase, dry-run |
| ACT-048 | Delete study actual | Destructive | admin | `study.delete` | yes | yes | 8 | critical | Preserve report metadata if policy says |
| ACT-049 | Run retention cleanup | Storage | admin | `retention.manage` | yes | yes | 8 | critical | Dry-run first |
| ACT-050 | View system audit logs | Security | admin | `system.audit` | no | yes | 9 | high | PHI-safe display |

## 5. Per-machine action keys

Phase 3 should support matrix keys:

- `study.view`
- `study.delete`
- `report.read`
- `report.write`
- `report.approve`
- `report.cancelApproval`
- `report.editFinal`
- `his.update`
- `his.send`
- `share.create`
- `consult.create`
- `consult.cancel`
- `statistics.view`

Policy:

- Global permission is the base gate.
- Machine matrix can narrow or allow within policy.
- Matrix must not silently elevate destructive permissions without explicit global permission.
- Empty matrix falls back to global permissions.

## 6. Reason policy

Reason is required for:

- Cancel order.
- Cancel report form/draft.
- Unfinalize/cancel approval.
- Edit final report.
- Configure HIS adapter.
- Storage/folder config change if path/schedule changes.
- Request or execute delete series/study.
- Retention cleanup.
- Cancel consultation.

Reason is optional but useful for:

- Update clinical info.
- Assign doctor.
- Retry HIS sync.
- Export PHI-bearing data.

## 7. Audit metadata rules

Audit should include:

- actor user id
- action id/action name
- entity type and id
- study/order/report UID when applicable
- before/after summary for config/status changes
- reason when required
- result status success/failure
- timestamp

Audit must not include:

- passwords
- tokens/secrets
- raw large DICOM payloads
- full PHI dump if a summary is enough
- filesystem path if not needed or not scrubbed

