# Operations

## Database migrations

From `apps/api` with the virtual environment active:

```powershell
flask db upgrade
```

The maintained helper is:

```powershell
python scripts/run_migrations.py
```

Back up production before applying destructive or migration-heavy changes. Never edit an already-deployed migration to change its meaning; add a new revision.

## Seed data

```powershell
cd apps/api
python scripts/seed_data.py
```

Seeding retains Region 3 reference data internally. Public APIs and both frontends must still expose only the supported Zambales scope and exclude Olongapo.

## Superadmin bootstrap

```powershell
python apps/api/scripts/create_superadmin.py
```

Run this interactively and store the resulting credential outside the repository. Do not create credential handoff text files in Git.

## Notification worker

Continuous retry mode:

```powershell
cd apps/api
python scripts/notification_worker.py
```

Single batch:

```powershell
python scripts/notification_worker.py --once
```

The API also performs inline delivery attempts. Running the worker is still recommended so transient failures are retried.

### SMS maintenance

SMS delivery is currently paused because the PhilSMS account has no available credits. Keep `SMS_MAINTENANCE_MODE=true` so the API skips SMS attempts and the resident profile reports maintenance. After replenishing credits, configure a production API key, set `SMS_PROVIDER=philsms`, and set `SMS_MAINTENANCE_MODE=false`.

## Verification-image retention

Preview cleanup:

```powershell
python apps/api/scripts/cleanup_verification_images.py --dry-run
```

Run the cleanup command on a schedule after configuring `ID_RETENTION_DAYS`. The audit record remains after the underlying sensitive file is removed.

## Health and status

- API health: `GET /health`
- Windows local status: `.\scripts\check_status.ps1`
- Public document verification: `GET /verify/<request_number>`

## Storage checks

- Confirm the configured upload directory is writable.
- Confirm the manual payment-proof bucket is private.
- Confirm the service key is available only to the API.
- Confirm generated PDFs can be uploaded and retrieved using the expected authorization path.
- Treat local `uploads/` as runtime data; it is gitignored.

## Operational failure triage

1. Check service health and deployment logs.
2. Verify URLs, CORS origins, and frontend build-time variables.
3. Verify the current migration heads and database connectivity.
4. Inspect pending, leased, and failed notification outbox rows.
5. Verify storage credentials and bucket permissions.
6. Reproduce with the narrowest relevant automated test.

Do not place logs, screenshots, database dumps, generated documents, or provider responses in the repository root.
