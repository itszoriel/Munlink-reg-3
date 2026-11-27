# MunLink Zambales

MunLink is a municipal digital-governance platform for residents and local-government staff. The monorepo contains a Flask API, a resident-facing React application, an admin React application, and a shared UI package.

## Scope

The public product is strictly limited to Zambales:

- Province ID: `6`
- Supported municipalities: the 13 Zambales municipalities
- Excluded municipality: Olongapo City (`130`, `city-of-olongapo`)
- Region 3 reference data remains available internally for compatibility and future expansion

Do not expose other Region 3 provinces or Olongapo through API responses, selectors, feeds, or admin scope checks. See [AGENTS.md](AGENTS.md) for the required guardrails.

## What the platform provides

- Residents can register, request and verify documents, report issues, use the marketplace, apply for benefit programs and special statuses, and receive email or SMS notifications.
- Municipal and barangay staff can work within their assigned jurisdiction, process service requests, review residents and applications, publish scoped announcements, and audit sensitive actions.
- Provincial admins can publish province-wide communications.
- Superadmins manage admin accounts through email 2FA and review platform audit logs.
- Document requests support free, office-payment, manual QR, and Stripe-backed flows where configured.

## Repository layout

```text
apps/
  api/       Flask 3 and SQLAlchemy 2 API
  web/       Resident and public React application
  admin/     Admin and superadmin React application
packages/
  ui/        Shared React components and Tailwind preset
data/        Region 3 reference data
public/      Shared static assets
scripts/     Windows development helpers
docs/        Maintained technical documentation
```

## Requirements

- Node.js 20
- npm 9 or newer
- Python 3.12 recommended
- PostgreSQL 15+ for normal development and production

SQLite is only a limited fallback for health-oriented startup paths. Use PostgreSQL for feature work and migration verification.

## Local setup

From the repository root:

```powershell
npm install
Copy-Item env.example.txt .env

cd apps/api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
flask db upgrade
python scripts/seed_data.py

cd ../..
npm run dev
```

Configure at least `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY`, and `ADMIN_SECRET_KEY` in `.env`. Never commit `.env` or real provider credentials.

To create the first superadmin after the database is ready:

```powershell
python apps/api/scripts/create_superadmin.py
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start workspace development servers through Turborepo |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run test` | Run the workspace test suites |
| `npm run clean` | Remove workspace build outputs |
| `npm run setup` | Install root, API, web, and admin dependencies |
| `.\scripts\start_project.ps1` | Start the local project with Windows helpers |
| `.\scripts\check_status.ps1` | Check local service status |

Backend migrations and tests can also be run directly:

```powershell
cd apps/api
flask db upgrade
pytest
```

## Branch workflow

The repository uses two long-lived branches:

| Branch | Purpose |
| --- | --- |
| `main` | Deployment-ready code. Only merge changes that have passed review and testing. |
| `testing` | Integration branch for developing and validating new features before promotion to `main`. |

Create feature branches from `testing` and merge them back into `testing` for validation. After lint, tests, and deployment checks pass, promote the tested commits to `main` through a reviewed pull request. Avoid committing unfinished experiments or unverified changes directly to `main`.

Production releases are tagged from `main` using semantic versions such as `v1.0.0`. Pushing a version tag creates the corresponding GitHub release and retains only the 10 newest GitHub deployment records.

## Configuration

Start with [env.example.txt](env.example.txt). Common integration groups are:

- Database and auth: `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY`, `ADMIN_SECRET_KEY`
- URLs and CORS: `WEB_URL`, `ADMIN_URL`, `BASE_URL`, `QR_BASE_URL`, `CORS_ALLOWED_ORIGINS`
- Email: `SENDGRID_API_KEY`, `FROM_EMAIL`, or `SMTP_*`
- SMS: `SMS_PROVIDER`, `SMS_MAINTENANCE_MODE`, `PHILSMS_API_KEY`, `PHILSMS_SENDER_ID`, `PHILSMS_BASE_URL`
- Storage: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`
- Payments: `STRIPE_*`, `MANUAL_QR_*`

Frontend `VITE_*` values are normally embedded at build time. The admin container also supports runtime `VITE_PUBLIC_SITE_URL` injection through `/env-config.js`.

SMS delivery is currently under maintenance because PhilSMS credits are unavailable. Keep `SMS_MAINTENANCE_MODE=true`; after replenishing credits and configuring a production API key, set it to `false` and change `SMS_PROVIDER` to `philsms`.

## Deployment

[Render](docs/DEPLOYMENT.md#render) is the primary configuration. The root [render.yaml](render.yaml) provisions `munlink-api` and the static sites `munlink-zambales` and `munlink-zambales-admin`.

The blueprint uses free plans. Supabase `pg_cron` jobs keep the API and database awake and deliver queued notifications every 5 minutes; see [Staying awake on free plans](docs/DEPLOYMENT.md#staying-awake-on-free-plans).

## Documentation

- [Documentation index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Permissions and scope](docs/PERMISSIONS.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Operations](docs/OPERATIONS.md)
- [Testing](docs/TESTING.md)
- [Security](docs/SECURITY.md)
- [Design system](docs/DESIGN.md)

## Security baseline

- Admin authorization uses `admin_municipality_id` and `admin_barangay_id`, never resident location fields.
- Protected frontend requests wait for `isAuthBootstrapped`.
- Sensitive ID and selfie access requires permission checks, watermarking, and audit logs.
- Upload endpoints validate scope and support multipart input where files are accepted.
- Real credentials belong only in environment variables or provider dashboards.

If a credential has ever been committed, removing the file is not enough: revoke or rotate the credential and rewrite or purge the affected Git history.
