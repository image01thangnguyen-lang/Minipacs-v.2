# UI Style & Layout Remediation — Implementation Evidence

## Implemented baseline

- `AppShell` now owns the viewport and provides one bounded, `min-h-0/min-w-0` content region.
- Canonical dark Vinmec tokens remain the single palette source in `globals.css` and `tailwind.config.js`.
- Added reusable `PageCanvas`, `PagePanel`, `KpiCard`, `FormLabel`, `FormInput`, and `FormSelect` primitives.
- Command Center now uses the canonical dark canvas, panels, controls, KPI cards, responsive columns, accessible tabs, and shared data grids by default.
- Permission Matrix shell plus Scope/Legacy tables now use canonical surfaces, sticky headers/identity columns, dark-theme states, and bounded overflow.
- P0/P1 follow-through normalized operational, account, non-DICOM, incident-support, and native-configuration screens to the canonical Vin palette; nested shell pages no longer introduce their own viewport-height canvas.
- Added `npm run check:ui-style` to reject legacy Vin token aliases and accidental nested `min-h-screen` usage (with explicit standalone-route exceptions).

## Validation matrix

Run from `dashboard/`:

```bash
npm run check:ui-style
npx tsc --noEmit
npm test
npm run build
```

Validation recorded on 2026-07-12:

- `npm run check:ui-style` — passed.
- `npx tsc --noEmit` — passed.
- `npm run build` — previously passed before the final P0/P1 token sweep, including Next.js lint/type validation and generation of all 54 static pages. The final rerun was blocked before compilation because Windows held Prisma's `query_engine-windows.dll.node` open (`EPERM` during `prisma generate`); this is an environment/file-lock condition, not a TypeScript or UI-style failure.
- The repository test suite was started and the completed suites reported no failures; production build remains the release-level compile gate.
- Standalone `next lint` cannot run unattended because this repository has no committed ESLint configuration and Next.js opens its first-run configuration prompt. The non-interactive lint/type stage embedded in `next build` passed.

Manual visual acceptance remains required at 1366×768, 1440×900, 1920×1080 and a narrow responsive viewport for the P0 routes listed in the remediation plan.

The final validation pass also confirmed `npm run check:ui-style` and `npx tsc --noEmit` after the broader route sweep. A configured authenticated stack is still required to complete definitive screenshot and interaction UAT for protected/data-backed routes.

## Screenshot evidence

Headless Chrome captures at 1440×900 are stored with this evidence document:

- [Command Center — 1440×900](evidence/ui-style-remediation/command-center-1440x900.png)
- [Permission Matrix route — 1440×900](evidence/ui-style-remediation/permission-matrix-1440x900.png)

> Capture limitation: the local development process used for these images did not have `AUTH_SECRET`, `DATABASE_URL`, or an authenticated admin browser session. Consequently, these captures are useful only as route/runtime evidence and may show an unauthenticated, redirected, loading, or error state rather than populated clinical/admin data. A definitive visual UAT capture of Permission Matrix requires logging in as an administrator against a configured local stack; this limitation is intentionally recorded rather than presenting redirected content as proof of the protected screen.