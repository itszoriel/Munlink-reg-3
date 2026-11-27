# Deployment

## Render

Render is the primary checked-in deployment configuration. The root `render.yaml` creates:

Service origins: `https://munlink-api-5s9w.onrender.com`, `https://munlink-zambales.onrender.com` (public site) and `https://munlink-zambales-admin.onrender.com` (admin).

| Service | Runtime | Build source | Health |
| --- | --- | --- | --- |
| `munlink-api` | Docker | `apps/api/Dockerfile` with `apps/api` context | `/health` |
| `munlink-zambales` | Static site | `npm run build -w apps/web` -> `apps/web/dist` | CDN, never sleeps |
| `munlink-zambales-admin` | Static site | `npm run build -w apps/admin` -> `apps/admin/dist` | CDN, never sleeps |

All services use `autoDeployTrigger: checksPass`: Render deploys a commit on `main` only after the GitHub `CI` workflow passes.

The API image is multi-stage, runs as a non-root user, and exits if `flask db upgrade` fails, so Render keeps the previous deploy instead of serving a half-migrated schema. It runs one gunicorn worker (8 threads) so in-memory rate limits stay accurate on the single free instance. `Dockerfile.web` and `Dockerfile.admin` remain for Docker Compose and Railway only.

### Provisioning

1. Connect the repository in Render and create a Blueprint from `render.yaml`.
2. Supply every variable marked `sync: false` in the Render dashboard.
3. Confirm the final service hostnames. If Render adds suffixes, update all URL, CORS, proxy, and sitemap values consistently.
4. Deploy the API and confirm `/health` before validating the frontends.
5. Run a login, refresh-token, upload, document generation, and notification smoke test.

### Staying awake on free plans

The API is a free web service and sleeps after 15 idle minutes; the free Supabase project pauses after about a week without database activity. Keep both awake:

1. In the Supabase SQL editor run `supabase/keep_alive.sql`. A `pg_cron` job calls `/health/db` every 10 minutes, which wakes Render and runs a real query.
2. Create the Vault secret described in `supabase/notification_cron.sql`, set the same value as `INTERNAL_CRON_SECRET` on `munlink-api`, then run that file. Every 5 minutes the database calls `POST /internal/notifications/run`, so queued notifications are delivered even if the in-container worker stops.
3. Add an external monitor (UptimeRobot or cron-job.org) on `/health/db` every 5-10 minutes. It keeps the API awake if the database job stops and emails you on outages. GitHub Actions schedules are too delayed for this.

Only the API uses free instance hours (about 744 of 750 per month); static sites use none.

### Required API secrets

- `DATABASE_URL`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `ADMIN_SECRET_KEY`

Common production integrations include `SENDGRID_API_KEY`, `FROM_EMAIL`, `SUPABASE_*`, `STRIPE_*`, `MANUAL_QR_*`, and `PHILSMS_*`.

### Frontend URL configuration

- Web: `VITE_API_URL`
- Admin: `VITE_API_URL` and `VITE_PUBLIC_SITE_URL`

Both are embedded at build time. Redeploy the static site after changing them. The browser calls the API directly; `CORS_ALLOWED_ORIGINS` on the API must list both site origins.

## Railway

Railway remains supported by the root and app-level `railway.toml` files.

Create three services from the same repository:

- API: use the API Dockerfile and `/health` check.
- Web: use the web build/start settings from `apps/web/railway.toml`.
- Admin: use `Dockerfile.admin` from the repository root.

Set the same API secrets and integration variables as Render. Set each public URL explicitly and make `CORS_ALLOWED_ORIGINS` match the deployed web and admin origins.

## Docker Compose

For local container testing:

```powershell
docker compose up -d
```

Do not copy `.env` into images. Secrets must be injected by Compose or the hosting platform.

## Release verification

- Database backup or PITR is available before migration-heavy releases.
- `flask db upgrade` completes against the target database.
- `/health` succeeds.
- Web and admin bundles call the expected API origin.
- Credentialed CORS works for both frontend origins.
- Upload and generated-document storage are writable.
- The notification worker starts and can claim an outbox row.
- Public `/verify/<request_number>` links use the correct base URL.
