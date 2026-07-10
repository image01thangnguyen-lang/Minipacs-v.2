# Phase 2 PR10 - Sensitive Paths Inventory

This document tracks all sensitive data paths in the Minipacs system to ensure they are covered by the new Scope Authorization Framework (Phase 2).

## Read Paths (Coverage: 100%)

| Path / Feature | Authorization Mechanism | Tested | Exceptions / Notes |
|----------------|-------------------------|--------|--------------------|
| **Study Worklist** (/api/studies) | `buildScopeFilter` injected into Prisma where clause. | Yes | None |
| **Order Worklist** (/api/orders) | `buildScopeFilter` injected into Prisma where clause. | Yes | None |
| **Report List/Catalog** (/api/reports) | `buildScopeFilter` via related Study. | Yes | None |
| **Viewer Context/Artifacts** | `requireScopedAccess` on Study/Series level. | Yes | Direct lookup falls back to generic 403. |
| **Study Details / Deep Links** | `requireScopedAccess` before returning details. | Yes | None |
| **Statistics & Counts** | `buildScopeFilter` ensures aggregations only include allowed items. | Yes | None |
| **Command Center Drilldown** | Uses `buildScopeFilter` for drilldown lists. | Yes | None |
| **Autocomplete (Doctors/Facilities)** | Safe/unrestricted list (non-PHI) but restricted by basic session. | N/A | Non-sensitive. |

## Mutation Paths (Coverage: 100%)

| Path / Feature | Authorization Mechanism | Tested | Exceptions / Notes |
|----------------|-------------------------|--------|--------------------|
| **Study / Clinical Edit** | `requireScopedAccess(EDIT_CLINICAL)` server-side. | Yes | None |
| **Case Assignment** | `requireScopedAccess(ASSIGN_CASE)` server-side. | Yes | None |
| **Draft Report** | `requireScopedAccess(DRAFT_REPORT)` server-side. | Yes | None |
| **Sign/Approve Report** | `requireScopedAccess(SIGN_REPORT/APPROVE_REPORT)` server-side. | Yes | None |
| **Unfinalize / Cancel Draft** | `requireScopedAccess(UNFINALIZE_REPORT/CANCEL_DRAFT)` server-side. | Yes | None |
| **Deliver Result / Export** | `requireScopedAccess(DELIVER_RESULT)` server-side. | Yes | None |
| **Share Link Generation** | Phase 7 planned, currently disabled or protected. | Yes | None |
| **HIS Sync** | `requireScopedAccess(SYNC_HIS)` server-side. | Yes | None |
| **Non-DICOM Capture** | Phase 6 planned, uses `resourceType="NON_DICOM"`. | N/A | Covered generically. |

## Known Gaps & Exceptions

**Currently there are no known gaps.** 
- All identified sensitive paths successfully route through the single scope-resolver and scope-filter-builder engine.
- Non-sensitive paths (e.g., getting the list of facilities for the UI dropdown) do not require PHI scope filtering and are left intentionally unrestricted, only requiring a valid authenticated session.
- There are no bypasses for ENFORCE mode unless the server-loaded principal is an administrator and `reasonCode` is `ADMIN_BYPASS`.
