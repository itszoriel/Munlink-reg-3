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

Databases seeded before November 2026 have marriage-license requirements that say "resident of Porac". `python scripts/fix_marriage_license_residency.py` lists them (dry run), and `--apply` rewrites them to the current template wording.

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

## Private storage migration

Sensitive files uploaded before the private bucket was used are still in the public bucket and referenced by public URL. The API keeps reading them, but they stay publicly reachable until they are moved. Deploy the API first, then run against dev before prod:

```powershell
# Report only
python apps/api/scripts/migrate_private_storage.py --env dev

# Copy to the private bucket and rewrite database references to storage paths
python apps/api/scripts/migrate_private_storage.py --env dev --apply

# Optional, after checking the app: also delete each public copy
python apps/api/scripts/migrate_private_storage.py --env dev --apply --delete-public

# Leftover sensitive files nobody references (old ID re-uploads, failed requests)
python apps/api/scripts/migrate_private_storage.py --env dev --orphans
python apps/api/scripts/migrate_private_storage.py --env dev --orphans --apply
```

The script uses `DEV_*` / `PROD_*` credentials (or `--env current` for the API's own `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`), creates the private bucket when it is missing, refuses to run if that bucket is public, and can be re-run safely. Files that exist only on an old server's local disk are reported as missing; they cannot be recovered by the script.

## Verification-image retention

Preview cleanup:

```powershell
python apps/api/scripts/cleanup_verification_images.py --dry-run
```

Run the cleanup command on a schedule after configuring `ID_RETENTION_DAYS`. It deletes ID and selfie images of residents verified (or deactivated) more than that many days ago, and clears a database reference only after the file is gone. Verified residents keep full access after their images are removed. The audit record remains after the underlying sensitive file is removed.

## Health and status

- API health: `GET /health`
- Windows local status: `.\scripts\check_status.ps1`
- Public document verification: `GET /verify/<request_number>`

## Storage checks

- Confirm the configured upload directory is writable.
- Confirm the private bucket (`SUPABASE_PRIVATE_BUCKET`) is private and has no storage policies.
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
