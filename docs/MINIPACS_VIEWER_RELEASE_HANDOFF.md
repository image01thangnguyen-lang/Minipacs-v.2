# MiniPACS Viewer - Release Handoff

## Quick Links & Important Routes
- **Dashboard Root:** `/`
- **MiniPACS Custom Viewer:** `/viewer/minipacs?StudyInstanceUIDs=...`
- **Viewer Diagnostics API:** `/api/viewer/diagnostics`

## Deployment & Updates
To deploy or update the stack, run the following command in the project root:
```bash
sudo bash ./update.sh
```
This script will safely pull code, rebuild `ohif` and `dashboard`, apply the Prisma schema via `db push`, and restart the services without resetting the database or exposing the Postgres port publicly.

### Rollback Strategy
If a deployment fails or introduces critical issues:
1. Revert to the previous stable Git commit.
2. Rebuild the containers (`docker compose up -d --build`).
3. **DO NOT** reset the database unless a secure, verified backup is available.

## Completed Features (Phase 1 to 15)
The custom MiniPACS Viewer incorporates:
- **Custom Viewport Integration:** Overrides OHIF default routing to enforce safe layouts and integrations.
- **Series Rail & Toolbar:** Custom collapsible UI for quick series selection and tool access.
- **Measurement Persistence:** Safely persists bounding boxes, lengths, and angles to the PostgreSQL DB, restoring them on reload.
- **Key Images & Snapshots:** Allows capturing key clinical findings with metadata tracking.
- **Report Workspace Bridge:** Seamlessly integrates Viewer measurements and images into a draft report context, guarding against modifications to `FINAL` or `COMPLETED` reports.
- **Layout & Hanging Protocols:** Predictable layouts for multi-modality studies.
- **Advanced 3D/MPR:** Safely enables MPR/MIP workflows when reconstructable CT/MR data is detected.
- **Diagnostics UI:** Fast in-viewer status checks for database, auth, and DICOMweb connectivity.

## Remaining Limitations / Future Work
- **DICOM SR Export:** Currently deferred. Full authoring is unsupported until a comprehensive metadata mapping framework is introduced.
- **MPR Limitations:** MPR supports only reconstructable CT/MR images. Single-frame radiographs (XR) reject MPR commands securely.
- **US Cine Playback:** Contingent upon exact multi-frame / stack metadata configurations which may require tuning per device.

Please review `MINIPACS_VIEWER_PHASE15_FINAL_QA_REPORT.md` for specific test scenarios and limitations.
