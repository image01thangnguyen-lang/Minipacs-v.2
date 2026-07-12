# Phase 7 PR6 — Pilot and release-candidate runbook

## Entry and ownership

- Clinical super-users: minimum 5 participants, 25 critical journeys, 4-hour soak and 4-hour staffed support window.
- Pilot hospital: minimum 15 participants, 100 critical journeys, 24-hour soak and 24-hour staffed support window.
- Operations, clinical and security owners must be three distinct named owners; escalation must be tested before GO. Every feedback item requires an owner, due time and evidence reference.
- Use synthetic/de-identified evidence only. Never paste patient name, accession, report text, facility/user identifiers or raw request/Prisma/HIS payload into feedback/audit artifacts.

## Severity and decision policy

- **Sev1:** cross-scope disclosure, unsafe clinical corruption/loss, or broad outage. Any open/mitigated Sev1, scope-parity failure, or error rate >=5% means immediate **ROLLBACK**.
- **Sev2:** major workflow unavailable or credible clinical delay without safe workaround. Any open/mitigated Sev2 means **HOLD**.
- **Sev3/4:** owned with deadline and evidence; may proceed only when all quantitative gates pass.
- **GO:** security/scope/rollback gates pass, error rate <1%, P95 <=1500 ms, autosave success >=99%, sample/soak/support thresholds pass, and no Sev1/2 is open.
- A release candidate is produced only by GO at `PILOT_HOSPITAL`; clinical-super-user GO is only permission to enter pilot.

## Triage, soak and rollback

1. Freeze one evidence revision and evaluate it with `decidePilotGate`; reject unknown/oversized input.
2. Operations owns incident command, clinical owns workflow impact, security owns privacy/scope assessment, and product owns Sev3/4 disposition.
3. Do not accept a decision whose `evaluatedRevision` differs from the current revision; rerun after every feedback or metric change.
4. On ROLLBACK, use the PR5 capability rollback to ring 0. Confirm old UI reads existing drafts/preferences and audit remains intact; never delete grants, reports or audit rows.
5. Resume soak from zero after Sev1/2, rollback, scope failure, or material configuration change. Record human approvals and production dashboard links separately; automated tests do not claim production GO.