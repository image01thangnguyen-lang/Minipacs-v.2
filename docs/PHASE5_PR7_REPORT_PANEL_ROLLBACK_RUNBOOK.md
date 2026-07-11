# Phase 5 PR7 — Report Panel pilot / rollback runbook

`NEXT_PUBLIC_*` flags are embedded into the Next.js client bundle at image
build time. Changing a container environment variable without rebuilding does
not change the UI.

## Enable the pilot

Set these values in the deployment `.env` beside `docker-compose.yml`:

```dotenv
NEXT_PUBLIC_PHASE4_WORKSPACE=true
NEXT_PUBLIC_ENABLE_REPORT_PANEL=true
```

Then rebuild only the dashboard (or the full stack):

```bash
sudo docker compose build --no-cache dashboard
sudo docker compose up -d dashboard nginx-gateway
sudo docker compose ps
sudo docker compose logs --tail=200 dashboard
```

Verify a permitted doctor can select a study, edit a draft, observe the saved
revision, reload, and see the same draft. Do not put patient/report text in
deployment logs or UAT evidence.

## UI rollback

Keep Phase 4 enabled and disable only the pilot panel:

```dotenv
NEXT_PUBLIC_PHASE4_WORKSPACE=true
NEXT_PUBLIC_ENABLE_REPORT_PANEL=false
```

Rebuild and restart the dashboard using the commands above. Open the legacy
route `/report/<studyInstanceUid>` and confirm the saved draft and revision are
present. This rollback changes only UI exposure; it does not delete or migrate
`Report` rows.

## Data safety

- Do not run `docker compose down -v`, `docker volume rm`, or
  `docker system prune --volumes` during a rollback.
- A plain container removal/recreation preserves the named PostgreSQL volume.
- If a stale container name blocks deployment, inspect it first and remove
  only that container; never remove the database volume.