# Phase 7: Root Vite Disposition Decision

**Date:** 2026-07-15
**Role:** OHIF/React integration specialist

## Evidence Gathering
- **Deployment Analysis (`docker-compose.yml`, `deploy.sh`, `update.sh`)**: There is no service for Vite. The system runs Next.js (`dashboard`), OHIF Viewer (`ohif`), Orthanc, Postgres, and Nginx. 
- **Traffic Routing (`nginx.conf.template`)**: All traffic is routed to `dashboard:3000` or `ohif:80`. No traffic routes to a Vite port.
- **Ownership/Usage**: The root `package.json` had a name `react-example` and scripts for Vite, but these were leftover scaffoldings. 
- **Codebase check**: the deleted `src` tree was a standalone AI Studio/Vite
  demonstration UI with its own `App.tsx` and `main.tsx`; it was not imported by
  the dashboard or OHIF deployment. Describing it as only “basic boilerplate”
  overstates the evidence and is intentionally avoided.

## Decision: RETIRE
Based on the lack of deployment, traffic, and owner evidence, the Root Vite App is confirmed to be unused legacy code.

## Execution
- Deleted `src` directory.
- Deleted `index.html` and `vite.config.ts`.
- Cleaned up `package.json` and regenerated `package-lock.json` to remove
  Vite-specific scripts and dependencies.
- Replaced the stale root README instructions that still advertised
  `npm run dev` for the retired application.
- No `Next SSR code` was copied or modified for the viewer.

## Rollback Plan
Since the Vite app was not in use in production, rollback is source-control
based: `git restore src index.html vite.config.ts package.json package-lock.json README.md`.
Run `npm install` after rollback if a local root Vite environment is required.
