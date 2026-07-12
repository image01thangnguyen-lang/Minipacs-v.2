# Phase 7 PR6 — Pilot/release-candidate evidence

## Baseline and inventory

- Baseline commit: `ec988b38e173a8403b82dca92da2e01676c6cb69`. The pre-existing dirty Phase 6/7 worktree was preserved; initial diff was 17 tracked files (1,381 insertions/1,190 deletions) plus prerequisite untracked artifacts, and initial `git diff --check` had no errors (only existing LF/CRLF warnings).
- PR1–PR5 provide scrubbed telemetry/SLO, security/accessibility regression, synthetic UAT/signatures, server-evaluated flags and optimistic rollback. Direct rollout callers were tests only; flags are file-backed and no Prisma model/migration is involved.
- Existing scoped worklist/detail/action services remain authoritative. PR6 does not create list/count/detail/action data access or trust client scope/workflow. Its evaluator is pure and bounded to at most 500 feedback records: zero DB queries, no row relation lookup and therefore no N+1.

## Contract and controls

- Strict typed evidence rejects unknown fields, invalid IDs/timestamps, missing owners and oversized arrays. Evidence contains operational metadata only and is suitable for the existing scrub policy.
- Stop-ship is fail-closed: scope parity failure, non-closed Sev1, or >=5% errors returns ROLLBACK. Non-closed Sev2, missing coverage/owners, insufficient soak/sample, security/rollback failure or SLO miss returns HOLD.
- Decisions carry the evaluated revision; stale asynchronous results are rejected. Evaluation is deterministic/idempotent for one immutable revision.
- RC is true only after pilot-hospital GO. No URL, status lifecycle, palette, package/lockfile, schema, draft, preference or permission semantics changed.

## Compatibility and rollback proof

- PR6 writes no clinical data and changes no schema. Rollback remains PR5's capability-specific ring-0 operation with timestamp/checksum stale protection and scrubbed audit.
- Old/new paths share existing drafts/preferences; disabling the capability does not delete or transform either. Automated evidence proves deterministic rollback; production support coverage, soak metrics and human GO signatures remain explicit operational gates and are not claimed by this repository change.