# VRPACS Data Audit Safety Map

Updated: 2026-07-03

## 1. Muc dich

Tai lieu nay phan loai du lieu, audit rule, va safety rule cho MiniPACS khi trien khai cac phase VRPACS parity. Muc tieu la tranh lo PHI, log secret, xoa nham anh, va thay doi clinical data khong co trace.

## 2. Data classification

| Class | Examples | Sensitivity | Storage examples | Rule |
| --- | --- | --- | --- | --- |
| PHI | patient name, patient ID, DOB, phone, accession, address | high | `WorklistOrder`, `ImagingStudy`, reports, exports | Minimize logging, scrub in anonymized export |
| Clinical | indication, clinical info, findings, conclusion, recommendation, ICD | high | Report/order/catalog mappings | Version/audit important changes |
| Imaging | DICOM pixels, series, snapshots, key images, videos | high | Orthanc, viewer artifact storage | Protected access, audit export/delete |
| Credentials/secrets | passwords, HIS tokens, DICOM credentials, API keys | critical | env/config | Never log, never expose to client |
| Config | DICOM nodes, storage folders, templates, permissions | medium/high | admin tables | Audit create/update/delete |
| Operational | status history, audit logs, job status, alerts | medium | audit/status/job tables | Append-only where possible |
| Analytics | counts, SLA, performance, workload | low/medium | statistics | Avoid PHI in aggregates where possible |

## 3. Data safety rules

- Do not commit real PHI or DICOM data into repo.
- Do not log passwords, tokens, secrets, raw HIS payloads, or large DICOM payloads.
- Do not expose filesystem paths to users without need.
- Do not return public media URLs for PHI-bearing snapshots/key images unless share policy allows.
- Do not mutate patient identity in source DB/Orthanc for anonymized export.
- Do not delete study/series from PACS outside Phase 8 guarded policy.
- Do not overwrite final report content without addendum/version/history.
- Do not update HIS silently; every inbound/outbound sync must be traceable.

## 4. Audit action map

| Action group | Must audit | Metadata to include | Metadata to avoid |
| --- | --- | --- | --- |
| Login/security | failed login, password reset, role change | actor/target/status/IP summary | password, hash, token |
| Worklist | create/check-in/cancel/regenerate MWL/update clinical | order id, accession, before/after summary, reason | full PHI dump |
| Study status | received/ready/reading/reported/delivered/cancelled | study UID, from/to, actor, source | raw DICOM |
| Report | draft save, finalize, unfinalize, addendum, print/PDF | report id, study UID, status, reason | full report body if not needed |
| HIS | inbound update, outbound send, retry, fail, skip | adapter, status, accession, scrubbed error | token, full payload with PHI |
| Admin user | create/update/deactivate/import/reset password | target user, role/profile, summary | plain password |
| Catalog/template | create/update/deactivate/mapping/default change | code/name/id, before/after summary | large HTML unless needed |
| PACS node | create/update/echo/config assignment | node id, AE, status summary | credentials/secrets |
| Storage config | create/update/check | folder code/type, scrubbed path/status | secret path/token |
| Viewer | open viewer, save measurement/key/snapshot/crop, action history, compare | study UID, artifact id, viewport metadata summary | pixel data/base64 |
| Export/download | job create/ready/fail/download/cancel | job id, type, anonymize flag, item count | file path if private, PHI filename |
| Share | create/revoke/access denied/access granted | share id, study UID, expiry, options summary | password |
| Consultation | create/start/finish/cancel/message/video event | room id, participants summary, status | chat content unless policy |
| Destructive | delete request/dry-run/execute/retention cleanup | target, reason, dry-run count, confirmation, actor | unnecessary PHI |

## 5. Audit storage policy

Use existing:

- `AuditLog` for app/admin/workflow events.
- `ViewerAuditLog` for viewer-specific events.
- `StudyStatusHistory` and `ImagingStudyEvent` for study transitions.

Recommended:

- Keep audit append-only.
- Use structured `metadataJson`.
- Store summary not raw payload.
- Add indexes by entity/time/action.
- Provide scrub helper for secrets/PHI-heavy payload.

## 6. Protected data map

| Data | Source | Allowed readers | Export allowed | Anonymize required |
| --- | --- | --- | --- | --- |
| Patient demographics | Worklist/study/HIS | clinical users with `studies.read` | yes with permission | for public/share/external unless policy says no |
| Report final | Report/archive | `reports.read`/`archive.read` | yes | for public/share external option |
| Draft report | Report | report owner/authorized | no external export | n/a |
| DICOM image | Orthanc/viewer | `studies.read` | yes Phase 8 | optional/required by policy |
| Key image/snapshot | Viewer artifacts | `studies.read` | yes Phase 4/8 | optional/required by policy |
| HIS payload | HIS logs | admin/support only | no | scrub |
| Password/temp password | user admin | target user only at reset moment | no | n/a |
| Storage path | config | admin | no | scrub |

## 7. PHI in filenames and logs

Avoid:

- patient name in exported ZIP/PDF/JPEG filenames
- patient ID in public URLs
- accession in public share path
- full report text in generic logs

Use:

- job id
- study UID hash or short id
- timestamp
- anonymized label when enabled

Example:

- Good: `export_JOB123_20260703.zip`
- Avoid: `NguyenVanA_PID123_CT.zip`

## 8. Destructive safety levels

| Level | Operation | Requirements |
| --- | --- | --- |
| L0 | Read/view/search | permission |
| L1 | Create/update draft/config | permission + audit |
| L2 | Finalize/send/export PHI | permission + audit + status policy |
| L3 | Unfinalize/cancel approval/anonymized export | permission + reason + audit |
| L4 | Delete series/study/retention cleanup | permission + reason + confirmation phrase + dry-run + audit + restore note |

## 9. File/media safety

- Viewer artifact media must be served by protected route.
- Upload/capture size must be limited.
- Content type must be validated.
- Image processing must not trust filename.
- Export job files must expire.
- Cleanup jobs must not remove source clinical data.

## 10. Open validation items

- Confirm retention duration and legal archive policy.
- Confirm if report PDF filenames may include patient name in local clinical network.
- Confirm which roles can export non-anonymized DICOM.
- Confirm if share links must always hide patient info by default.
- Confirm audit retention duration.

