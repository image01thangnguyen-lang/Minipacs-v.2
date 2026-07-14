# Phase 0 Acceptance & Plan (GO/NO-GO)

## Topology Findings
- `dashboard/`: Next.js 14, deployed via Docker. Target for migration.
- `src/` Vite App: **Legacy/Preview**. Not deployed in standard docker-compose. Exclusion confirmed.
- `ohif-viewer/`: External ecosystem. Exclusion confirmed (CSS sync only).

## Backlog Waves
- **Wave 1 (Phase 1-2):** Foundation (Registry, Theme) & Adapters (`Button`, `Input`, `Select`, `DatePicker`).
- **Wave 2 (Phase 3):** Pilot Route (`/admin/catalogs` or similar).
- **Wave 3 (Phase 4):** Admin, Settings, Support modules.
- **Wave 4 (Phase 5):** Worklist, Consultations, Statistics.
- **Wave 5 (Phase 6):** Clinical Workspace (Critical Path).
- **Wave 6 (Phase 7-8):** Cleanup, OHIF Theme Sync, Cutover.

## Estimate
Total effort: **10-16 weeks** (2 Frontend Engineers + QA).

## Decision
**Status: GO**
The scope is well defined. Inventory is complete (62 routes). Risks are registered and mitigations planned. Ready for Phase 1.
