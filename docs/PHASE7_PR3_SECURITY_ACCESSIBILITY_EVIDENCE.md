# Phase 7 PR3 — Security/accessibility automation evidence

## Baseline and preserved worktree

- Baseline commit: `ec988b38e173a8403b82dca92da2e01676c6cb69`.
- The pre-existing worktree was dirty (Phase 6/7 UI, telemetry and release-control files). It was inventoried with `git status --short`, `git diff --stat` and `git diff --check`; no reset, checkout, clean or overwrite was used.
- PR3 changes are limited to the shared grid regression boundary, the release regression test, and this evidence file. No URL, workflow status, palette token, schema, migration, infrastructure or dependency was changed by PR3.

## Inventory and call graph

- List/count/facet: server actions validate with strict `WorklistQueryRequestSchema`; `queryWorklist` and `queryWorklistFacets` apply the same scoped query policy before pagination/aggregation. Existing scope-filter tests prove empty scope is force-empty, deny wins, unknown classification is excluded, and AE/node grants do not broaden scope.
- Detail/related/report: `related-studies`, study workspace and report workspace actions require global permission and delegate to scoped services/batched allowed-action evaluation.
- Mutations: autosave and second-read boundaries use `requireScopedStudyMutation`, which reloads the study and evaluates READ plus action capability from DB context. Autosave atomically predicates revision, editable status and cancellation, and maps concurrent create uniqueness to stale revision.
- Audit/log: structured logger passes payloads through `scrubDiagnosticOutput`. Runtime regression covers PHI and bearer/JWT values.
- UI: `SharedDataGrid` is the common table boundary. Native table naming, roving row focus, arrow selection, Enter/Space activation, announced errors, sort state and visible focus are guarded.
- Flags: release flags remain server-side and are not changed by PR3. Existing legacy paths remain present; PR3 automation can be rolled back by removing its test/evidence and focus/name changes without data/schema impact.

## Automated release-candidate gates

`dashboard/lib/security/release-regression.test.ts` now fails the release candidate when:

1. A scoped list/detail boundary loses authentication or scoped-policy delegation.
2. A sensitive mutation stops reloading/reauthorizing the resource.
3. Stale/finalized/concurrent autosave protection disappears.
4. Forged unknown fields, page size >100, or more than 50 scope filters are accepted.
5. PHI/token scrubbing regresses.
6. Native accessible naming, keyboard selection/activation, focus visibility, ARIA sort/error semantics regress.
7. Core primary/secondary text contrast falls below WCAG AA 4.5:1.

## Honest limitations

- Source guards are deterministic architecture tripwires, not substitutes for authenticated browser/API penetration testing.
- CSRF protection is inherited from same-origin Next.js Server Actions/Auth.js. A real deployment must still run origin/cookie/session-expiry tests at its proxy boundary.
- Contrast automation covers stable core token pairs; browser-driven zoom, screen-reader and all-state visual checks remain UAT gates.
- No claim of zero production leaks or completed rollback drill is made until environment-backed security/UAT evidence is attached.