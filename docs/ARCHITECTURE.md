# Architecture

## System boundaries

MunLink is an npm-workspace and Turborepo monorepo with three applications and one shared UI package.

```text
Browser
  |-- apps/web   ----\
  |-- apps/admin -----+--> apps/api --> PostgreSQL
                              |-----> Supabase Storage or local uploads
                              |-----> SendGrid or SMTP
                              |-----> PhilSMS
                              `-----> Stripe or manual QR payment flow
```

### API

`apps/api/app.py` creates the Flask application, initializes extensions, registers blueprints, applies CORS and security headers, and exposes health and public document-verification routes.

The API is organized into:

- `models/`: SQLAlchemy models
- `routes/`: public, resident, admin, and superadmin blueprints
- `utils/`: scope, auth, storage, notification, payment, PDF, and audit helpers
- `migrations/`: Alembic/Flask-Migrate revisions
- `scripts/`: maintained setup and operational commands
- `tests/`: backend regression tests

### Resident web application

`apps/web` is the resident and public React application. Routing starts in `src/App.tsx`; API and token behavior lives in `src/lib/api.ts`; auth state and bootstrapping live in `src/lib/store.ts`.

### Admin application

`apps/admin` contains municipal, barangay, provincial, and superadmin portals. It has a separate auth store and API client. Role layouts and protected routes must match backend authorization rather than acting as the security boundary themselves.

### Shared UI

`packages/ui` contains reusable React components and the shared Tailwind preset. Application-specific business components stay inside their application.

## Geographic scope

Region 3 reference data is seeded for compatibility, but user-visible behavior is limited to Zambales province ID `6`. Olongapo City ID `130` is excluded.

The three required enforcement points are:

- API: `apps/api/utils/zambales_scope.py`
- Resident web: `apps/web/src/lib/locations.ts`
- Admin web: `apps/admin/src/lib/locations.ts`

All new location-aware API queries must validate input and apply a Zambales filter. Frontend filtering is a UX safeguard, not a replacement for backend validation.

## Authentication and sessions

- Access tokens are kept by each frontend API layer.
- Refresh behavior uses cookies and a `HAS_SESSION_KEY` flag to avoid unnecessary refresh attempts for new visitors.
- Protected requests must wait until the store reports `isAuthBootstrapped`.
- Superadmin login adds an email 2FA step and uses dedicated routes.
- Password verification must use `apps/api/utils/auth.py` so bcrypt and legacy Werkzeug hashes remain compatible.

## Authorization

Admin jurisdiction comes from `admin_municipality_id` and `admin_barangay_id`. Resident `municipality_id` and `barangay_id` describe where a resident lives and must not authorize staff access.

Sensitive operations use the audit helpers in `apps/api/utils/admin_audit.py` and `apps/api/utils/audit.py`. See [PERMISSIONS.md](PERMISSIONS.md).

## Announcements

Announcements have `PROVINCE`, `MUNICIPALITY`, or `BARANGAY` scope. Municipality announcements may include additional valid Zambales targets through `shared_with_municipalities`. Barangay visibility remains exact-match. The legacy `public_viewable` field does not control current feed or detail visibility.

## Documents and payments

Document types and requests are municipality/barangay scoped. PDF generation uses ReportLab and stores generated files through the configured storage path. Public verification is available at `/verify/<request_number>`.

Payment support includes Stripe, manual QR proof review, office payment verification codes, and no-fee requests. Availability depends on environment configuration and document-type rules.

## Storage and uploads

`apps/api/utils/storage_handler.py` is the central storage abstraction. Supabase helpers live in `apps/api/utils/supabase_storage.py`; local development defaults to `uploads/region3`.

Endpoints accepting images or proofs should support `multipart/form-data` and JSON where the route contract requires both. Validate file type, size, ownership, and location scope before persistence.

## Notifications

Domain actions enqueue `NotificationOutbox` rows. Inline delivery attempts provide immediate feedback; `apps/api/scripts/notification_worker.py` retries outstanding rows. Claim-and-lease behavior prevents the inline path and worker from delivering the same row twice.

Email uses SendGrid when configured and otherwise SMTP. SMS uses the configured provider and should fail without breaking the underlying user action.
