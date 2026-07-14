# Phase 2 Acceptance Report (UI Adapters)

## Execution Summary
Phase 2 (UI Adapters) has been fully implemented in `dashboard/`. 
- **`CustomSelect`**: Refactored to wrap AntD `<Select size="small">`. Hidden input retained for FormData compatibility.
- **`CustomDatePicker`**: Refactored to wrap AntD `<DatePicker size="small">`. Handled translation between `dayjs` objects and `YYYY-MM-DD` strings to preserve the API contract.
- **`StatusBadge`**: Refactored to use AntD `<Tag>`. Updated the domain registry to resolve strict AntD colors (`success`, `warning`, `processing`, `error`, `default`).
- **Tests**: Written automated logical unit tests for the adapters and registry (`dashboard/lib/ui/__tests__/adapters.test.tsx`).

## DataGrid Benchmark & ADR
We conducted a spike benchmarking the existing `SharedDataGrid` vs AntD `<Table>` on a 5000-row fixture.

**Findings:**
1. AntD `Table` without its optional `virtual` mode and with pagination disabled renders the full fixture. This spike deliberately measures that direct-replacement configuration; it does not prove browser main-thread behavior because it uses server rendering.
2. `SharedDataGrid` implements a hard `renderLimit` that bounds rendered rows in this fixture. This is a render cap, not true virtualization and not a general O(1) complexity claim.
3. `SharedDataGrid` implements a strict custom keyboard navigation contract (Up/Down arrow to change selection, Enter to trigger action), which is completely lost in AntD Table.

**Decision: NO-GO for direct AntD Table replacement.**
*Architectural Decision*: We will retain `SharedDataGrid` as the core grid component. In Phase 3, we will apply AntD semantic CSS tokens (`colorBgContainer`, `colorBorder`) to `SharedDataGrid` to visually harmonize it, rather than rewriting its complex logical capabilities.

## Commands Executed
```text
npm run benchmark:datagrid
npm run typecheck
npm run test:ui
npm run check:ui-style
npm run lint
npm run test
npm run build
```

## Exit Codes & Test Evidence
- Final exit codes and measured benchmark output are recorded after the review verification run below.

## Known Issues & Compatibility Risks
- Component refs (`forwardRef`) on original elements might act differently when wrapped in AntD components. Next phase will require verifying consumer `useRef` calls if they attempt to focus the inner input manually.
- The benchmark is an SSR micro-benchmark, so it compares render cost and output size only. Browser interaction, resize, sticky/pin behavior, and AntD's optional virtual mode still require a browser benchmark before a permanent grid decision.

## Rollback Steps
If an emergency rollback is required:
1. Revert `dashboard/app/components/CustomSelect.tsx`.
2. Revert `dashboard/app/components/CustomDatePicker.tsx`.
3. Revert `dashboard/app/components/ui/StatusBadge.tsx` and `status-badge-registry.ts`.
4. Run `npm run build` to verify restoration.

## Decision
**Status: GO** 🟢
Adapters successfully replaced existing primitives without breaking the application build or contract tests. Ready for Phase 3 (Back-office Migration).
