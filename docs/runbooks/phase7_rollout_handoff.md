# Phase 7 controlled rollout and handoff

## Rings and gates

Promote only in order **10 → 25 → 50 → 100%**. Minimum soak is respectively 60, 240, 720 and 1440 minutes. `decideRolloutGate` returns GO only when security, accessibility, UAT and rollback evidence pass, no Sev1/Sev2 is open, error rate is below 1%, and P95 is at most 1500 ms.

Immediately rollback the affected capability on any Sev1 or error rate ≥5%. HOLD on missing evidence, elevated latency/error rate, open Sev2, or incomplete soak. Rollback changes server configuration only; it must not delete schema, drafts, preferences or audit records.

## Operator procedure
1. Verify backup restore point and on-call ownership.
2. Update one capability percentage in `config/release/phase7-flags.json`; preserve dependencies.
3. Validate a strict rollout manifest containing release ID, current/target/previous ring, SHA-256 flag checksum, backup restore point, on-call owner, and at least two distinct approvers.
4. Run validation/tests/build, deploy, record timestamp/checksum, then observe the full soak.
5. For rollback, set that capability to `enabled:false`/`percentage:0`, deploy, verify legacy read/write parity, and open an incident.
6. At 100%, retain flags through post-release review; do not delete legacy code until the agreed soak closes.

## Final handoff (human-controlled)
- Clinical owner: PENDING
- Security owner: PENDING
- Operations/on-call owner: PENDING
- Release manager GO decision: PENDING
- Post-release review date: PENDING

## Mandatory evidence per ring

| Ring | Minimum soak | Required before promotion |
| --- | ---: | --- |
| 10% | 60 min | scope parity, security/UAT/a11y, rollback drill, restore point, primary+secondary on-call |
| 25% | 240 min | prior ring closed, error <1%, P95 ≤1500 ms, autosave ≥99%, no open Sev1/2 |
| 50% | 720 min | same gates over the expanded cohort; escalation test and full coverage |
| 100% | 1440 min | all prior gates plus Clinical, Security, Operations, Product and Release Manager approvals |

Every issue must have `KI-*`, severity, owner, due date and evidence reference. Sev1/2 must be CLOSED; mitigation alone does not permit promotion. Evidence revisions are monotonic; stale asynchronous decisions must be rejected. Signature artifacts bind to a SHA-256 evidence checksum and must never contain patient/accession/report payloads.

## Backup/restore and rollback proof

1. Record the immutable restore-point identifier, verification time and measured RPO/RTO before each ring. A backup existing is insufficient: a restore drill in an isolated target must pass.
2. Snapshot the release manifest and flag checksum. Never include credentials or PHI in artifacts.
3. Drill `enabled:false` and `percentage:0`; confirm old/new draft and preference readability, audit retention, list/count/detail/action scope parity, and no destructive schema operation.
4. Reject stale rollback requests using manifest timestamp + checksum. Repeated request IDs must produce the same plan/audit outcome and no duplicate destructive operation.
5. On rollback trigger, page both on-call owners, preserve scrubbed incident evidence, verify legacy health, and schedule RCA/post-release review.

## Post-release review

Do not remove flags or legacy compatibility at 100%. At the scheduled review, record ring timestamps/checksums, incidents, SLO percentiles, scope-deny anomalies, autosave/conflicts, backup restore measurement, support load, known-issue closure and owner signatures. Any missing human signature or production soak remains **PENDING/HOLD**, never inferred from automated tests.

Automation prepares and validates evidence; it cannot claim production rollout, backup restore, soak, or signatures occurred.