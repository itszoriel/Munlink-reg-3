# Deployment

## Render

Render is the primary checked-in deployment configuration. The root `render.yaml` creates:

| Service | Runtime | Build source | Health |
| --- | --- | --- | --- |
| `munlink-api` | Docker | `apps/api/Dockerfile` with `apps/api` context | `/health` |
| `munlink-web` | Docker | `Dockerfile.web` with repository context | Static nginx app |
| `munlink-admin` | Docker | `Dockerfile.admin` with repository context | Static nginx app |

### Provisioning

1. Connect the repository in Render and create a Blueprint from `render.yaml`.
2. Supply every variable marked `sync: false` in the Render dashboard.
3. Confirm the final service hostnames. If Render adds suffixes, update all URL, CORS, proxy, and sitemap values consistently.
4. Deploy the API and confirm `/health` before validating the frontends.
5. Run a login, refresh-token, upload, document generation, and notification smoke test.

The blueprint currently selects free plans. Free services can sleep. Since the API container also starts the notification worker, queued retries pause while that service is suspended. Use an always-on plan or a separate worker when continuous delivery is required.

### Required API secrets

- `DATABASE_URL`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `ADMIN_SECRET_KEY`

Common production integrations include `SENDGRID_API_KEY`, `FROM_EMAIL`, `SUPABASE_*`, `STRIPE_*`, `MANUAL_QR_*`, and `PHILSMS_*`.

### Frontend URL configuration

- Web: `VITE_API_URL`
- Admin: `VITE_API_URL`, `VITE_PUBLIC_SITE_URL`, and `API_PROXY_TARGET`

`VITE_API_URL` is embedded during the image build. Redeploy after changing it. The admin image writes `VITE_PUBLIC_SITE_URL` into `/env-config.js` at container startup.

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
