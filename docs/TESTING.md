# Testing

## Standard checks

From the repository root:

```powershell
npm run lint
npm run test
npm run build
```

`npm run test` runs the API test suite and both frontend linters.

For backend-only work (install `apps/api/requirements-dev.txt` first):

```powershell
npm run test:api
```

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and push to `main`:

- API: flake8 (syntax errors and undefined names), pytest, and `pip-audit` on `requirements.txt`.
- Frontend: lint, type-check and build web and admin, and `npm audit --omit=dev --audit-level=high`.
- Docker: builds `apps/api/Dockerfile`.

`.github/workflows/secret-scan.yml` runs gitleaks. Render deploys only after these checks pass.

Use the existing commands from `package.json` and `scripts/`; do not invent alternate project runners.

## High-risk regression areas

Run focused tests for the area changed and then the full backend suite when changes affect:

- Zambales and Olongapo scope enforcement
- Admin authorization fields or role checks
- Refresh cookies, token bootstrapping, or 2FA
- Announcement sharing and detail visibility
- Document fees, PDF generation, claim verification, or payment states
- Benefit program and application scope
- Notification outbox claiming and retry behavior
- Sensitive resident ID/selfie access and audit logging

## Manual smoke checks

- Fresh guest visit does not issue unnecessary refresh requests.
- Resident login survives a page refresh after auth bootstrap.
- Non-Zambales locations and Olongapo never appear.
- Municipal and barangay admins cannot cross their assigned scope.
- A multipart upload and a JSON-only request both follow the endpoint contract.
- Document generation creates a valid PDF and public verification link.
- Payment state is visible and enforced before document release where required.
- Notification failure does not roll back the underlying domain action.
- Mobile layouts have no horizontal scrolling and interactive targets remain usable.

## Test artifacts

Temporary pytest directories, Playwright sessions, screenshots, local logs, coverage output, and generated documents are ignored. Keep durable regression coverage in the application test directories instead of committing test-run artifacts.
