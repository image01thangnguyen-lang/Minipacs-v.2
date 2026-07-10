# Phase 2: Scope Authorization Enforcement Cutover Runbook

This runbook describes the procedure to cutover, rollback, and break-glass for the new Scope Authorization Framework (Phase 2).

## 1. Prerequisites (GO/NO-GO Gate)
1. **Regression**: From the repository root, run `npx tsx scripts/authorization-regression.ts`.
2. **Data Readiness**: From the repository root, run `npx tsx scripts/check-grant-readiness.ts`. It must exit successfully without unclassified data or duplicate active AE titles.
3. **Config Preflight**: Run `npx tsx scripts/cutover-preflight.ts`. In `OFF`, this validates configuration only; it is not cutover approval.
4. **Approval**: `dashboard/config/authorization-rollout.json` must have `approvedBy` set to a valid Security / DBA / Hospital owner name before `SHADOW` or `ENFORCE`.
5. **Shadow Soak Period**: Must have operated in SHADOW mode for at least 7 days with mismatched requests explained or resolved.

## 2. Cutover Procedure (OFF → SHADOW → ENFORCE)
1. Edit dashboard/config/authorization-rollout.json:
   - Set "mode": "SHADOW"
   - Set "ring": "INTERNAL_TEST" (or the appropriate hospital ring).
2. Deploy the configuration (or wait 60 seconds for the cache to invalidate if hot-reloading is supported).
3. Monitor SHADOW_MISMATCH events in Telemetry.
4. If mismatch rate is < 1% and explained, update dashboard/config/authorization-rollout.json to "mode": "ENFORCE".
5. Monitor DENIED_MUTATION and UNCLASSIFIED_RESOURCE events.

## 3. Rollback Procedure (ENFORCE → SHADOW)
**DO NOT RUN DATABASE MIGRATIONS FOR ROLLBACK.**
1. Edit dashboard/config/authorization-rollout.json.
2. Change "mode": "ENFORCE" back to "mode": "SHADOW".
3. Legacy DoctorMachinePermission records remain intact, ensuring read-only fallback and dual-write consistency is preserved.
4. Create an incident ticket, attach telemetry metrics window, and assign an RCA owner.

## 4. Break-Glass Procedure
1. In the event a critical user (e.g. Head of Department) is entirely blocked, a System Admin can bypass restrictions.
2. A System Admin logs in. Admin operations bypass the scoped filtering (but still require basic global permissions).
3. The Admin resolves the configuration in the new Scope Grant Admin UI (/admin/permissions/matrix).
4. **Do not** grant wildcard database access.
