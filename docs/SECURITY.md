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
- Only `access` and `refresh` JWTs authenticate requests; a global verification loader in `apps/api/app.py` rejects every other token type.
- Email-verification links use signed `itsdangerous` tokens bound to the account's email (`apps/api/utils/auth.py`). They are never JWTs and cannot log anyone in.
- Every login path issues tokens through `_issue_session_tokens` in `apps/api/routes/auth.py`, so refresh tokens are always tracked, rotated, and checked for reuse. Superadmin access tokens last 15 minutes; others last 1 hour.
- `/refresh` fails closed: if rotation or reuse checks cannot run, no token is issued.
- Set `TRUST_PROXY_HOPS` to the number of proxies in front of the API (Render = 1) so rate limits and audit logs use the real client IP. Never read `X-Forwarded-For` directly.

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
- Serve stored files only through `apps/api/utils/file_streaming.py`. It fetches remote files only from the `SUPABASE_URL` host and `ALLOWED_FILE_DOMAINS`, never follows redirects, caps size, and renders only PDFs and images inline.
- Never store client-supplied file references. Document request supporting files come only from the upload endpoint, and downloads check that the path belongs to that request.
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
