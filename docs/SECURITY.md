# Security

## Secrets

- Store credentials in `.env` for local use and in the hosting provider's secret manager for deployment.
- Commit only placeholders to `env.example.txt`.
- Never commit account passwords, API tokens, private keys, provider responses, or credential handoff files.
- If a secret enters Git history, revoke or rotate it immediately. Deleting the current file does not invalidate the secret.

## Authentication

- Use the shared password verification helper in `apps/api/utils/auth.py`.
- Keep refresh cookies `httpOnly`, `Secure` in production, and configured with an appropriate `SameSite` policy.
- Restrict credentialed CORS to explicit web and admin origins.
- Preserve rate limits on authentication, password reset, 2FA, and other abuse-prone routes.
- Protected frontend calls wait for `isAuthBootstrapped`.

## Authorization and tenant scope

- The backend is the authorization boundary.
- Admin scope comes only from `admin_municipality_id` and `admin_barangay_id`.
- Validate all incoming location identifiers against the Zambales scope.
- Apply scope filters to reads, writes, exports, notification audiences, and file access.
- Do not rely on a hidden menu item or client-provided municipality ID.

## Sensitive resident media

- Require `residents:id_view` independently from approval permissions.
- Record who viewed the file, why, when, and from which context.
- Render watermarks before display.
- Keep source files private and return them through an authorized API path.
- Apply the configured post-verification retention policy.

## Uploads

- Enforce content type, extension, size, and ownership checks.
- Generate server-side names rather than trusting client filenames.
- Keep payment proofs and identity media private.
- Treat local and cloud storage paths consistently through the central storage handler.
- Audit sensitive reads and administrative mutations.

## Payments and webhooks

- Verify Stripe webhook signatures with the configured secret.
- Keep manual proof review separate from automated payment confirmation.
- Make payment and document-release transitions idempotent.
- Never trust an amount, status, or document owner supplied only by the frontend.

## Review checklist

- No secret-like values in tracked files or staged diffs.
- No non-Zambales or Olongapo exposure.
- Role, permission, and jurisdiction checks are present.
- Sensitive actions are audited.
- Error responses do not reveal credentials, stack traces, or private storage paths.
- Tests cover denied access as well as successful access.
