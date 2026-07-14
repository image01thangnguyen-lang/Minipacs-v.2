# Wave 4A Migration Report

## Route 1: `/admin/users`
**Status**: IMPLEMENTED — pending UAT/visual/rollback sign-off

### 1. Pre-migration Checks
- Baseline verified in Phase 0.
- Clinical tokens applied: `#141414` background for Modals, Table size `small`, Spacing `2/4/8`.
- No deep overrides used.

### 2. Implementation Details
- **Feature Flag**: Added `antd-admin-users` to `contracts.ts`.
- **Characterization Tests**: Wrote and executed `app/admin/users/__tests__/actions.test.ts`. Passed.
- **Server Component**: Converted `app/admin/users/page.tsx` to Server Component evaluating `antd-admin-users` capability.
- **Client Component**: Renamed original file to `UsersClient.tsx` and modified to conditionally render Antd components.
- **Antd Adapters**: Created `UsersAntd.tsx` using AntD `Modal`, `Form`, `Input`, `Select`, `Upload`, `Tabs` and existing `AdminUsersGrids.tsx`.
- **Logic Preservation**: Maintained `FormData` payloads and existing Server Actions without modifying Prisma or Database schema.

### 3. Verification & Testing
- **Characterization Tests**: Included in `npm run test:antd-phase4`; passed on 2026-07-14.
- **Typecheck**: `npm run typecheck` passed on 2026-07-14.
- **Build**: A prior build was reported as passing. Review rerun on 2026-07-14 was blocked by `ENOSPC` while webpack wrote its cache, after Prisma generation and during optimized compilation; this is an environment failure, not a TypeScript diagnostic.
- **Visual/UAT and rollback drill**: Still require recorded execution before this route can be marked `GO`.

---

## Route 2: `/admin/facilities`
**Status**: IMPLEMENTED — pending UAT/visual/rollback sign-off

- **Feature Flag**: Added `antd-admin-facilities` to `contracts.ts`.
- **Characterization Tests**: Wrote and executed `app/admin/facilities/__tests__/actions.test.ts`. Passed.
- **Server Component**: Created `app/admin/facilities/page.tsx` as Server Component evaluating `antd-admin-facilities` capability.
- **Client Component**: Renamed original file to `FacilitiesClient.tsx` and modified to conditionally render Antd components.
- **Antd Adapters**: 
  - `TreeEditorAntd.tsx` implemented using AntD `Tree` and `Modal`.
  - `MachineMappingAntd.tsx` implemented using AntD `Table` and `Select`.
  - `DataQualityPanelAntd.tsx` implemented using AntD `Card` and `Typography`.

### 3. Verification & Testing
- **Automated verification**: `npm run test:antd-phase4` and `npm run typecheck` passed on 2026-07-14.
- **Build rerun**: Blocked by host `ENOSPC` during webpack cache write. A clean build must be rerun after freeing disk space.
- **Visual/UAT**: Pending recorded execution.

---

## Route 3: `/admin/pacs/nodes`
**Status**: IMPLEMENTED — pending UAT/visual/rollback sign-off

- **Feature Flag**: Added `antd-admin-pacs-nodes` to `contracts.ts`.
- **Characterization Tests**: Wrote and executed `app/admin/pacs/nodes/__tests__/actions.test.ts`. Passed.
- **Server Component**: Created `app/admin/pacs/nodes/page.tsx` as Server Component evaluating `antd-admin-pacs-nodes` capability.
- **Client Component**: Renamed original file to `NodesClient.tsx` and modified to conditionally render Antd components.
- **Antd Adapters**: `NodesAntd.tsx` implemented using AntD `Table`, `Modal`, `Form`, `Select`, and `Input`.
- **Verification**: `npm run test:antd-phase4` and `npm run typecheck` passed on 2026-07-14. Build rerun was blocked by host `ENOSPC`; visual/UAT remains pending.

---

## Route 4: `/admin/storage`
**Status**: IMPLEMENTED — pending UAT/visual/rollback sign-off

- **Feature Flag**: Added `antd-admin-storage` to `contracts.ts`.
- **Characterization Tests**: Wrote and executed `app/admin/storage/__tests__/actions.test.ts`. Passed.
- **Server Component**: Created `app/admin/storage/page.tsx` as Server Component evaluating `antd-admin-storage` capability.
- **Client Component**: Renamed original file to `StorageClient.tsx` and modified to conditionally render Antd components.
- **Antd Adapters**: `StorageAntd.tsx` implemented using AntD `Card`, `Modal`, `Form`, `Select`, and `Input`.
- **Verification**: `npm run test:antd-phase4` and `npm run typecheck` passed on 2026-07-14. Build rerun was blocked by host `ENOSPC`; visual/UAT remains pending.

---

## Route 5: `/admin/templates`
**Status**: IMPLEMENTED — pending UAT/visual/rollback sign-off

- **Feature Flag**: Added `antd-admin-templates` to `contracts.ts`.
- **Characterization Tests**: Wrote and executed `app/admin/templates/__tests__/actions.test.ts`. Passed.
- **Server Component**: Created `app/admin/templates/page.tsx` as Server Component evaluating `antd-admin-templates` capability.
- **Client Component**: Renamed original file to `TemplatesClient.tsx` and modified to conditionally render Antd components.
- **Antd Adapters**: `TemplatesAntd.tsx` implemented using AntD `Table`, `Modal`, `Form`, `Select`, `Input`, `Checkbox`, `Row`, `Col`.
- **Verification**: `npm run test:antd-phase4` and `npm run typecheck` passed on 2026-07-14. Build rerun was blocked by host `ENOSPC`; visual/UAT remains pending.

## Rollback Drill
- Static review confirms disabled flags select the legacy `*Client.tsx` branches and action interfaces remain unchanged.
- An executed rollback drill with recorded evidence is still pending.

## Review Decision (2026-07-14)
- Feature flags are registered in both the release-control capability contract and `config/release/phase7-flags.json`, defaulting to disabled/0%.
- Route flags are intentionally route-granular for Wave 4A to isolate rollback blast radius.
- `GO` is withheld until the production build is rerun on a host with sufficient disk and visual/UAT plus rollback evidence are recorded.
