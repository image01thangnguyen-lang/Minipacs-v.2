# Phase 5 — Operational Lists Migration Review

## Scope reviewed

- Wave 5A: `/command-center`, `/statistics`
- Wave 5B: `/non-dicom`
- Wave 5C: `/consultations`
- Wave 5D: `/archive`
- Wave 5E: `/worklist`

## Implemented

- Ant Design implementations and legacy/AntD client switches exist for all six routes.
- Route permissions use registered, type-safe permission keys:
  - Command Center: `commandCenter.read`
  - Statistics: `statistics.read`
  - Non-DICOM: `nonDicom.read`
  - Consultations: `consult.read`
  - Archive: `archive.read`
  - Worklist: `worklist.manage`
- Release capabilities are registered in both the typed capability contract and
  `config/release/phase7-flags.json`. They default to disabled (0%), preserving the legacy rollback path.
- Archive retains its split detail layout. Worklist retains row double-click and keyboard viewer launch behavior.

## Review corrections

The original evidence was stored below `dashboard/docs`, while the migration plan requires
`docs/antd-migration/evidence/phase-5/`. This report is now in the canonical location.

The original report also claimed that server pagination and all quality gates were verified.
That claim was not supported by the implementation or attached command output:

- Archive is server-capped at 150 records, not paginated.
- The legacy Worklist action currently loads the scoped date result without `take`, cursor, or page parameters.
- No Phase 5 conformance harness, 100/1,000/10,000-row benchmark, visual comparison,
  authorization matrix, rollback drill, or signed Worklist UAT artifact is present.

## Validation

Record the final commands and exit codes here after review:

| Check | Result |
| --- | --- |
| TypeScript typecheck | **Blocked outside Phase 5**: `WorkspaceSwitcherAntd.tsx` has four `NavigationNode` narrowing errors; no Phase 5 error remains in the reported output |
| Next.js production build | **Blocked by environment**: `prisma generate` failed with `ENOSPC` while copying the Prisma query engine; therefore the earlier “build successful” claim is not reproducible |
| Grid conformance harness | **PASS**: `grid conformance checks passed` |
| Phase 5 UI-style subset | **PASS** after adding explicit `size="small"`; the full repository guard still fails on unrelated admin/settings files |
| Release-control tests | Not run: `package.json` has no `test:release-control` script |
| Phase 5 route/UAT regression | Missing dedicated test artifact |

## Disposition

**NO-GO for Phase 5 acceptance/cutover.** Compilation may establish code health, but it does
not replace the plan's performance, authorization, rollback, and human clinical Worklist UAT gates.
The flags remain off by default until those gates have evidence.