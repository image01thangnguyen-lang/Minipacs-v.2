# Rollback Drill

- **Date**: 2026-07-14
- **Feature Flag**: `antd-admin-pilot`
- **Configured safe default**: `antd-admin-pilot` is explicitly present in `config/release/phase7-flags.json` with `enabled=false` and `percentage=0`.
- **Planned procedure**:
  1. Enable the capability for an approved test cohort and verify `CatalogsAntd`.
  2. Toggle `antd-admin-pilot` OFF in server configuration.
  3. Refresh the page and verify `CatalogsClient` renders.
  4. Exercise read/create/edit behavior and record timestamps/screenshots.
- **Status**: PENDING MANUAL DRILL
- **Conclusion**: A fail-closed rollback path exists in code, but a successful drill must not be claimed until runtime evidence is attached.
