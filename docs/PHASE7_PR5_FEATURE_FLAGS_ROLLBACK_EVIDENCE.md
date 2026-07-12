# Phase 7 PR5 — Feature flags/cohort/rollback evidence

## Baseline and inventory

- Baseline commit: `ec988b38e173a8403b82dca92da2e01676c6cb69`; worktree already contained Phase 6/7 prerequisite changes and was preserved.
- Before PR5, release-control had three capabilities and deterministic SHA-256 cohort bucketing, but no application caller/server boundary. Direct callers were limited to the release-control test. No Prisma model/migration stores flags; config is `config/release/phase7-flags.json`, so rollback is schema-free and does not touch report drafts/preferences/audit.
- Scope/authz remains in existing scoped worklist/detail/action services. PR5 does not replace those policies: the new boundary requires an injected resource loader that reauthorizes server-side and derives facility from the loaded resource. Client role/facility/scope fields are rejected.
- Baseline evaluator cost is one bounded pass per capability (maximum three), no DB query and no row loop/N+1. Boundary cost is one authentication, one resource reauthorization and one config load per request.

## Contract and threat evidence

- Strict request/config/rollback schemas reject unknown and oversized values.
- Full dependency-cycle detection, missing dependencies, deny-wins, invalid config and missing subject all fail closed.
- Cohort key is stable `(capability, facility, user)` and calculated only on the server. Audit emits capability/boolean/reason, not user, resource, facility, bucket or PHI.
- Rollback is capability-specific, optimistic-concurrency protected by manifest timestamp and config checksum, deterministic for a request/clock, and produces a scrubbed audit record.
- Existing URLs, workflow statuses, palette, package/lockfile, Prisma schema, draft revision and preference versions are unchanged. Legacy path remains available when a capability evaluates false.

## Rollback drill (synthetic)

The automated drill moves only `doctor-workspace` from ring 10 to 0, verifies stale requests are rejected, repeats the same request deterministically, and confirms actor identity is hashed. Because no schema/data mutation occurs, old/new readers keep the same drafts and preferences. Production deployment, restore point and human sign-off remain operational gates and are not claimed here.