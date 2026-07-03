# VRPACS Workflow Status Policy

Updated: 2026-07-03

## 1. Muc dich

Tai lieu nay chot status policy baseline cho order, study, report, archive, HIS sync, viewer artifacts, export jobs, share, va consultation. Muc tieu la tranh update status truc tiep rai rac trong UI/action ma quen audit/history.

## 2. General rules

- Moi transition quan trong phai di qua service/helper chung khi co the.
- Moi transition phai co actor, source, timestamp, va audit/history.
- Khong update `ImagingStudy.status` truc tiep trong UI component.
- Final report khong duoc ghi de im lang.
- Cancel phai noi ro target: order, report draft, final approval, HIS sync, share, consult, export job.
- Delete khong dong nghia cancel; delete la destructive va thuoc Phase 8 policy.

## 3. Worklist order lifecycle

| From | To | Action | Permission | Reason required | Audit/history | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| none | `REQUESTED` | create order | `worklist.manage` | no | yes | Create `WorklistOrder` |
| `REQUESTED` | `SCHEDULED` | generate/regenerate MWL | `worklist.manage` | no | yes | MWL file path in metadata |
| `REQUESTED`/`SCHEDULED` | `ARRIVED` | check in | `worklist.manage` | no | yes | Set arrivedAt |
| `ARRIVED` | `IN_PROGRESS` | start exam/capture | `worklist.manage` | no | yes | Optional if modality workflow supports |
| any non-final | `CANCELLED` | cancel order | `worklist.manage` | yes | yes | Do not delete DICOM study |
| `CANCELLED` | `REQUESTED` | reopen order | admin policy | yes | yes | Needs validation |

Order terminal states:

- `CANCELLED` terminal unless admin reopens with reason.
- If a DICOM study already exists, cancel order must not remove study images.

## 4. Imaging study lifecycle

| From | To | Action | Permission | Reason required | Audit/history | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| none | `RECEIVED` | Orthanc sync received study | system | no | yes | Source `ORTHANC_SYNC` |
| `RECEIVED` | `READY_TO_READ` | metadata/order matched | system/technician | no | yes | Ready for doctor |
| `READY_TO_READ` | `READING` | start reading/receive read | `reports.write` | no | yes | Lock/assign doctor if needed |
| `READING` | `REPORTED` | finalize report | `reports.write`/`reports.finalize` | no | yes | Report final |
| `REPORTED` | `DELIVERED` | mark delivered | `archive.deliver` | optional | yes | SAU khi gui HIS thanh cong. Bypass neu HIS loi ket noi (can reason) |
| `DELIVERED` | `ARCHIVED` | archive policy | system/admin | no | yes | May be same as delivered in UI |
| any | `CANCELLED` | cancel study metadata | admin policy | yes | yes | Must not delete DICOM images unless Phase 8 |
| `REPORTED`/`DELIVERED` | `READING` | unfinalize/cancel approval | `reports.unfinalize` | yes | yes | Must create addendum/history |

Recommended StudyStatus values:

- `RECEIVED`
- `READY_TO_READ`
- `READING`
- `REPORTED`
- `DELIVERED`
- `ARCHIVED`
- `CANCELLED`

If existing enum differs, map old values in a compatibility helper rather than rewriting data immediately.

## 5. Report lifecycle

| From | To | Action | Permission | Reason required | Audit/history | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| none | `DRAFT` | save first draft | `reports.write` | no | yes | Study should be `READING` or ready |
| `DRAFT` | `DRAFT` | update draft | `reports.write` | no | optional/yes | Store updatedAt |
| `DRAFT` | `FINAL` | finalize/approve | `reports.write` or `reports.finalize` | no | yes | Lock report |
| `DRAFT` | `CANCELLED` | cancel report form | `reports.cancel` | yes | yes | Keep audit |
| `FINAL` | `ADDENDUM` | addendum | `reports.unfinalize` or policy | yes | yes | Do not edit old final silently |
| `FINAL` | `DRAFT`/`READING` | cancel approval/unfinalize | `reports.unfinalize` | yes | yes | Needs addendum/version |
| `FINAL` | `SENT_TO_HIS` | send result to HIS | `his.sync` | no | yes | Phase 2; report remains final |
| `FINAL` | `DELIVERED` | mark delivered | `archive.deliver` | optional | yes | Delivery status may live on study/archive |

Report edit rules:

- Draft can be edited by authorized report writer.
- Final is read-only by default.
- Final correction must create addendum or new version/history with reason.
- HIS send failure must not rollback final report.
- Draft report must not be sent to HIS.

Approval modes:

- 1-step: bac si chuyen mon tu finalize (khong can nguoi khac duyet lai).
- 2-step: bac si khong chuyen mon finalize -> senior/specialist doctor review va approve.
- Ho tro ca 2 mode. Mode duoc chon theo role/permission profile, khong phai config rieng.
- Khi 2-step, report status co the la `PENDING_APPROVAL` truoc khi chuyen `FINAL`.

## 6. HIS sync lifecycle

| From | To | Action | Permission | Reason required | Audit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| none | `DISABLED` | HIS mode disabled | system | no | yes optional | Core workflow still works |
| none | `PENDING` | create sync task | `his.sync`/system | no | yes | Inbound/outbound |
| `PENDING` | `SENT` | sync success | system | no | yes | Store response summary |
| `PENDING` | `FAILED` | sync failure | system | no | yes | Store scrubbed error |
| `FAILED` | `PENDING` | retry | `his.retry` | optional | yes | Increment attempt |
| any | `SKIPPED` | skip by policy | admin/system | yes optional | yes | e.g. HIS disabled for study |

HIS status values:

- `DISABLED`
- `PENDING`
- `SENT`
- `FAILED`
- `SKIPPED`

## 7. Viewer artifact lifecycle

| Artifact | Status/policy | Notes |
| --- | --- | --- |
| Measurement | created/updated/deleted by viewer; persisted JSON-first | Delete selected annotation needs audit if persisted |
| Key image | create/update note/select/delete artifact | Delete artifact does not delete DICOM image |
| Snapshot | create/crop/fullview/update/delete artifact | Protected media, not public path |
| Action history | append-only | Use `ViewerAuditLog` |

Viewer artifact rules:

- Saving key image/snapshot must not alter DICOM study.
- Sending artifact to report creates reference/payload, not copy of entire study.
- Local-only artifact must be labeled if not persisted.
- Anonymized export must not change source artifact identity unless stored as separate export.

## 8. Download/export job lifecycle

| From | To | Action | Notes |
| --- | --- | --- |
| none | `PENDING` | create job | Validate permission and scope |
| `PENDING` | `RUNNING` | worker starts | Optional for sync MVP |
| `RUNNING` | `READY` | file generated | Set file/expiresAt |
| `RUNNING`/`PENDING` | `FAILED` | error | Store scrubbed error |
| `PENDING`/`RUNNING` | `CANCELLED` | cancel | If supported |
| `READY` | `EXPIRED` | cleanup | File unavailable |

Export rules:

- Large exports must be job-based.
- PHI-bearing export must audit download.
- Anonymized export must scrub filenames/metadata where possible.

## 9. Share lifecycle

Phase 7 target:

| From | To | Action |
| --- | --- | --- |
| none | `ACTIVE` | create share link |
| `ACTIVE` | `REVOKED` | revoke |
| `ACTIVE` | `EXPIRED` | expiry |
| `ACTIVE` | `LOCKED` | too many failed password attempts, optional |

Share rules:

- Public/share viewer is read-only.
- Link must have expiry.
- Password optional but supported.
- Hide patient info option must be explicit.

## 10. Consultation lifecycle

Phase 7 target:

| From | To | Action |
| --- | --- | --- |
| none | `REQUESTED` | create consultation |
| `REQUESTED` | `STARTED` | accept/start |
| `STARTED` | `IN_PROGRESS` | room active |
| `IN_PROGRESS` | `FINISHED` | finish |
| `REQUESTED`/`STARTED` | `CANCELLED` | cancel with reason |

Consultation rules:

- Participant changes audited.
- Chat/video provider integration must not expose PHI beyond scope.
- Consultation status does not change report final status automatically.

## 11. Destructive operations

Delete study/series/retention are Phase 8.

Mandatory guardrails:

- Dedicated permission.
- Reason required.
- Confirmation phrase.
- Dry-run summary.
- Audit before and after.
- Clear restore/backup note.
- Never run from viewer click without server policy.

## 12. Blockers/validation

- Confirm exact existing `StudyStatus` enum values before changing schema.
- Confirm whether `DELIVERED` should be study status, report status, or separate archive event.
- Confirm policy for multiple final reports per study.

## 13. Resolved decisions (2026-07-03)

- Approval: ho tro 1-step (specialist) va 2-step (non-specialist + reviewer). Ca 2 mode.
- Cancel form (`huy phieu`): ap dung cho CA HAI order va report draft.
- HIS order code = accession number. Canonical: `accessionNumber`.
- Encode patient = ma hoa thong tin BN tren man hinh (display mask), khac anonymize export.
- Non-anonymized DICOM export: permission-based (`viewer.export`), khong fix role.
- Retention duration: 10 nam.
- Report PDF filename: dung ma/ID, khong chua ten benh nhan.
- `delivered` timing: mark SAU khi gui HIS thanh cong. Ngoai le: HIS loi ket noi cho phep bypass voi reason/audit.
- Share link default: KHONG an thong tin BN mac dinh. Co option toggle an.
- Audit retention: 10 nam.

> Tat ca open items da resolve. Phase 1+ co the bat dau code.

