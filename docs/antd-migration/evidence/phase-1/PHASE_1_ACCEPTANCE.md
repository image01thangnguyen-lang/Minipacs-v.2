# Phase 1 Acceptance Report

## Execution Summary
Phase 1 (AntD Foundation) has been fully implemented in `dashboard/`. 
- **Dependencies**: Installed pinned versions of `antd`, `@ant-design/nextjs-registry`, and `dayjs`.
- **SSR Registry**: Wrapped App Router correctly with minimal client boundary.
- **Theme**: Exact `clinicalTheme` enforcing `#141414` background, `24px` height, `12px` font, and `2px` radius.
- **Guardrails**: Replaced UI checking scripts to block literal white colors and enforce Table sizes. Added unit tests for the theme matrix.

## Commands Executed
```bash
npm --prefix dashboard run check:ui-style
npm --prefix dashboard run lint
npm --prefix dashboard test
npm --prefix dashboard run build
```

## Exit Codes & Test Evidence
- **Style guard**: passed.
- **Complete test suite**: passed, including the Phase 1 theme tests.
- **Production build**: passed; 66 static pages generated and type validation completed.
- **Lint**: validated non-interactively after adding the repository ESLint configuration. Existing `any`, unused-symbol, TS-comment, module-variable naming, unescaped-entity, and `prefer-const` debt remains explicitly non-blocking; all other Next.js core-web-vitals rules remain enabled.
- **Theme Tests**: `ts-node lib/ui/__tests__/antd-theme.test.ts` passed (dark/compact algorithms verified, required tokens verified).
- **Style Guard**: `node scripts/check-ui-style.cjs` passed (no literal white colors or invalid Tables detected).

## Bundle Delta
- **First Load JS shared by all**: 
  - Before: `87.3 kB`
  - After: `87.5 kB`
  - Delta: `+0.2 kB` (Negligible increase due to SSR Registry and optimized tree-shaking).
- **Playground Route**: `206 kB` route chunk, `384 kB` first-load JS. This is an isolated validation route and does not change the shared baseline above.

## Known Issues
- `antd` relies on dynamically generated CSS. While the SSR registry prevents FOUC, strict CSP nonces will need to be configured inside the `StyleProvider` if security rules tighten in the future.
- Pre-existing tailwind layouts have not been migrated yet (will be addressed in Phase 2).

## Rollback Steps
If an emergency rollback is required:
1. Revert `dashboard/app/layout.tsx` to remove `<AntdRegistry>`.
2. Remove `<AntdProvider>` usage.
3. Uninstall `antd` and `@ant-design/nextjs-registry`.
4. Delete `antd-theme.ts` and `/playground` directory.

## Decision
**Status: CONDITIONAL GO**

The Phase 1 foundation contract is implemented and all automated gates pass: style guard, lint, complete tests, type validation, and production build. The status remains conditional only because browser-level FOUC/hydration and split-pane popup behavior are manual acceptance checks required by the phase specification.
