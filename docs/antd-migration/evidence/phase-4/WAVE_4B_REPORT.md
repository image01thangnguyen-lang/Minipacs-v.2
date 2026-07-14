# Wave 4B: Settings Migration Evidence Report

## Target Overview
Wave 4B covers the personal and clinic-level settings:
1. `/settings/account`
2. `/settings/clinic-profile`
3. `/settings/report-templates`

## Route 1: `/settings/account`
**Status**: IMPLEMENTED — pending UAT/visual/rollback sign-off

- **Feature Flag**: `antd-admin-settings`
- **Characterization Tests**: Executed
- **Server Component**: `app/settings/account/page.tsx`
- **Antd Adapters**: `ChangePasswordAntd.tsx`
- **Verification**: Included in `npm run test:antd-phase4`; passed on 2026-07-14. `npm run typecheck` also passed. Build rerun was blocked by host `ENOSPC` during webpack cache write.

## Route 2: `/settings/clinic-profile`
**Status**: IMPLEMENTED — pending UAT/visual/rollback sign-off

- **Feature Flag**: `antd-admin-settings`
- **Characterization Tests**: Wrote and executed `app/settings/clinic-profile/__tests__/actions.test.ts`. Passed.
- **Server Component**: Created `app/settings/clinic-profile/page.tsx` as Server Component.
- **Client Component**: Renamed original file to `ClinicProfileClient.tsx`.
- **Antd Adapters**: `ClinicProfileAntd.tsx` using `Card`, `Form`, `Input`, `Select`, `Upload`.
- **Verification**: Included in `npm run test:antd-phase4`; passed on 2026-07-14. Typecheck passed; build rerun was blocked by host `ENOSPC`.
## Route 3: `/settings/report-templates`
**Status**: IMPLEMENTED — pending UAT/visual/rollback sign-off

- **Feature Flag**: `antd-admin-settings`
- **Characterization Tests**: Wrote and executed `app/settings/report-templates/__tests__/actions.test.ts`. Passed.
- **Server Component**: Created `app/settings/report-templates/page.tsx` as Server Component.
- **Client Component**: Renamed original file to `ReportTemplatesClient.tsx`.
- **Antd Adapters**: `ReportTemplatesAntd.tsx` using `Table`, `Form`, `Input`, `Select`, `Checkbox`, `Modal`, `Card`.
- **Verification**: Included in `npm run test:antd-phase4`; passed on 2026-07-14. Typecheck passed; build rerun was blocked by host `ENOSPC`.

## Rollback Drill
- Static review confirms the disabled `antd-admin-settings` flag selects each legacy client and action interfaces remain unchanged.
- An executed rollback drill with recorded evidence is still pending.

## Review Decision (2026-07-14)
- A wave-level flag is retained for Wave 4B because these three settings routes form one low-risk settings cohort; Wave 4A remains route-granular.
- The flag is registered in the capability contract and release JSON and defaults to disabled/0%.
- `GO` is withheld until a production build succeeds after disk cleanup and visual/UAT plus rollback evidence are recorded.
