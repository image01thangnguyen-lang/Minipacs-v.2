# MiniPACS v2

MiniPACS is deployed as a Docker Compose stack. The user-facing applications
are the Next.js dashboard in `dashboard/` and the OHIF viewer in
`ohif-viewer/`; Nginx routes `/` to the dashboard and `/viewer/` to OHIF.

The former root Vite demonstration app has been retired. Do not use
`npm run dev` from the repository root. See `README.md` files in the relevant
application directories and the deployment scripts (`deploy.sh`, `update.sh`)
for environment-specific startup instructions.

Phase 7 disposition evidence is recorded under
`docs/antd-migration/evidence/phase-7/`.
