# Phase 10 QA And Operations Handoff

This document supplements the persisted handoff record at:

`/admin/release/go-live/[releaseId]/handoff`

The UI record is canonical for approval status, owners, timestamps, and attestations. Do not place PHI, passwords, tokens, raw report text, or production secrets in this document or in the UI record.

## Release Evidence

Before moving a release to `READY_FOR_SIGNOFF`:

- Record Git commit, container image tag, and build checksum.
- Link the release-specific UAT suite.
- Mark migration and seed status accurately.
- Complete release notes and rollback plan.
- Register known issues and accept or resolve high-risk issues.

## Automated Verification

Run from `dashboard`:

```powershell
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run build
```

Record the results in the release handoff UI. The checkboxes are attestations; the application does not execute shell commands from the browser.

## Manual Smoke Scenarios

1. Create a release candidate and verify metadata is visible.
2. Run the linked UAT suite and complete all required cases.
3. Confirm failed or pending UAT blocks sign-off.
4. Confirm stale health/security/performance/DICOM checks block sign-off.
5. Confirm open SEV1/SEV2 incidents and P0/P1 security findings block sign-off.
6. Add a known issue; verify an open HIGH issue blocks sign-off until accepted or resolved.
7. Verify one user cannot sign more than one required role.
8. Verify release data locks after the first sign-off and reopening clears prior signatures.
9. Complete the handoff checklist, mark it `READY`, and verify release requires the confirmation phrase.
10. After release, have a different authorized user accept the operations handoff.
11. Verify rollback requires a reason and exact confirmation phrase.
12. Verify Doctor, Technician, and Reception users cannot access management/sign-off actions without permission.

## Operations Handoff

The persisted handoff must name:

- Operations owner.
- Support contact or escalation channel.
- Rollback owner.
- Monitoring/log review responsibility.
- Deployment and rollback notes.

The preparer cannot accept their own handoff. Acceptance is available only after the release is `RELEASED`.

## Deployment Notes

- Apply the Phase 10 migration before opening the Release Center.
- Regenerate Prisma Client in the dashboard image.
- Run the seed step so role-profile permissions remain synchronized.
- Verify Cloudflare/base URL, database, Orthanc, storage volumes, HIS secrets, and worker secret through the Deployment Readiness UI.
- Keep release evidence scrubbed and link to internal pages or HTTPS evidence locations.
