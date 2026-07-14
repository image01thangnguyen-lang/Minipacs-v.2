# Rollback Runbook

**Date:** 2026-07-15
**Status:** DRAFT / UNVALIDATED / PENDING HUMAN APPROVAL

## Rollback Triggers
- Error rate >=1% (aligned with `release-control/gates.ts` hold threshold; >=5% is an emergency rollback condition).
- Hydration failures.
- Action failures or autosave conflicts.
- Viewer launch failures.
- Report completion time increases by >15%.

## Rollback Procedure
Capability rollback exists for controlled routes, while other routes may require deployment-artifact rollback. The exact production image/tag, owners, cache commands, RTO, and RPO must be filled and drilled before this runbook can be marked READY.

1. **Stop Rollout:** Pause any gradual rollout mechanism (if using Cloudflare Workers or server-side feature flags).
2. **Capability rollback where supported:** set the affected capability to ring/percentage 0 using the approved release-control path and verify the configuration checksum/audit record.
3. **Revert deployment if required:** deploy the last known-good immutable image tag: `[PENDING OPERATIONS OWNER]`.
4. **Cache invalidation if required:** execute the environment-specific, approved Nginx/CDN procedure: `[PENDING VALIDATED COMMANDS]`.
5. **Verification:** run health, authentication, authorization, viewer launch, report load/save, and telemetry checks; confirm no PHI in logs.
6. **Communication:** notify Clinical Operations, Security, Operations, Product, and Helpdesk.

## Remaining Risks
- The legacy implementation is preserved and active until the soak period finishes.
- Phase 6 clinical UAT and a timed operator rollback drill are still missing.
- This document must not be represented as validated until owner names, immutable artifact identifiers, commands, RTO/RPO, and drill evidence are attached.
