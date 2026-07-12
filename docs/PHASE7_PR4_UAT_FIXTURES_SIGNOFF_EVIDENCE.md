# Phase 7 PR4 — UAT fixtures/sign-off evidence

## Baseline (read-only, 2026-07-12)

- Baseline commit: `ec988b38e173a8403b82dca92da2e01676c6cb69`; branch `main` tracking `origin/main`.
- Worktree was already dirty (17 tracked files plus untracked Phase 7/shared-UI artifacts). It was preserved; PR4 changes are limited to release-control fixture/evidence files, fixture JSON, `dashboard/scripts/phase7-uat-validate.ts`, runbook and this evidence.
- Existing PR4 seed had 2 facilities, 2 actors, 6 cases, strict Zod parsing and a deterministic matrix, but no executable sign-off contract, complete role matrix, defect linkage, stale-signature protection, or script.
- Call graph: fixture JSON → `parseSyntheticUatFixture` → `fixtureMatrix` → release-control test. Sign-off subsequently gates `planPromotion`; flags are server evaluated and deny wins.
- Schema/authz/workflow/audit inventory: no Prisma model/migration is required because evidence is immutable file/artifact input. Clinical list/count/facet/detail/actions remain enforced by the existing shared scope resolver and workflow actions; this PR adds no alternate data access. Evidence allows only synthetic technical IDs and artifact references and never raw payload/report/accession fields.
- Baseline query count for PR4 fixture/evidence validation: **0 database queries**; matrix creation and validation are in-memory O(cases × actors), batched, with no row/node query and therefore no N+1. No URL, status lifecycle, palette, dependency or lockfile change.

## Contract and policy matrix

- Strict v1 contracts reject unknown/oversized input. Fixtures require `syntheticOnly: true`, synthetic actor IDs, known facilities/actors, unique actors and bounded cases.
- UAT evidence requires exact case × actor coverage, stable fixture checksum/build commit, unique results, defects linked to known cases, and independent TESTER/CLINICAL/SECURITY/OPERATIONS approvals.
- Any open Sev1/Sev2, failed result without defect, rejection, missing owner, duplicate signer, or signature over an old revision fails closed.
- Signatures bind to canonical SHA-256 of the complete evidence with an empty signature list. Changing results, defects, revision or build invalidates every prior signature, preventing stale overwrite.
- Human signatures remain `PENDING`; automation must not fabricate release approval.

## Compatibility and rollback

The fixture/evidence path is additive and makes no database mutation. Rollback is removal/disablement of the PR4 artifact validator; existing flags and legacy UI paths are unchanged, and draft, preference, grants, reports and audit records are untouched. Re-running validation is deterministic and idempotent.

## Verification record

- `npx tsc --noEmit`: PASS.
- `npx ts-node lib/release-control/release-control.test.ts`: PASS.
- `npm test`: PASS, including scope fail-closed, query contract, PHI scrubber, security/accessibility regression and release-control suites.
- `DATABASE_URL=postgresql://synthetic:synthetic@localhost:5432/synthetic_phase7 npx prisma validate`: PASS (synthetic validation URL; no connection or mutation).
- `npm run build`: PASS (Next.js optimized production build, 54 static pages).
- `git diff --check`: PASS; only pre-existing LF/CRLF warnings were emitted.
- Final worktree review confirms the pre-existing dirty files remain present and no URL, status, palette, schema migration, package or lockfile was changed by PR4.

Human owner approvals remain `PENDING` in `docs/runbooks/phase7_uat_signoff.md` and cannot be claimed by automation. Accordingly, implementation and automated verification are complete, but release sign-off remains fail-closed until actual owners provide checksum-bound signatures.