# Phase 7 UAT and sign-off

Only `dashboard/prisma/uat-phase7-fixtures.json` synthetic identities may be used. Never copy production PHI into evidence.

## Execution
1. Record build commit/checksum and fixture version.
2. Execute every case for each role/facility pair; attach only scrubbed technical IDs.
3. Link defects by case ID and severity. Any open Sev1/Sev2 blocks approval.
4. Tester signs first; clinical owner and security owner sign independently. The deploy operator cannot self-approve.
5. From `dashboard`, run `npx ts-node scripts/phase7-uat-validate.ts <evidence.json>`. Any fixture/result/revision change invalidates all signatures and requires re-signing.
6. Evidence must cover the exact deterministic case × actor matrix. Failed/blocked cases require a linked `DEF-*`; open Sev1/Sev2 is stop-ship.

| Gate | Owner | Evidence | Signature/time |
|---|---|---|---|
| Scope/tamper | Security | test output | PENDING |
| Keyboard/ARIA | Accessibility | test output | PENDING |
| Clinical UAT | Clinical owner | UAT run ID | PENDING |
| Rollback | Operations | drill ID | PENDING |

`PENDING` is deliberately not a release approval. Runtime signatures must be supplied by humans.

Signature records bind owner ID/role, decision, UTC timestamp and the canonical evidence checksum. Do not put names, patient identifiers, accession numbers, report text, screenshots containing PHI, tokens or raw service payloads in evidence references.