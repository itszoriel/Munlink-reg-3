# MunLink agent entry point

Read [AGENTS.md](AGENTS.md) before changing this repository. It is the authoritative operating guide. Use [README.md](README.md) for setup and [docs/README.md](docs/README.md) for maintained technical documentation.

The critical rules are:

- Keep the product Zambales-only: province `6`, with Olongapo City (`130`) excluded.
- Preserve the backend and frontend location guards.
- Authorize admins with `admin_municipality_id` and `admin_barangay_id`.
- Wait for `isAuthBootstrapped` before protected frontend fetches.
- Audit sensitive admin actions and ID/selfie access.
- Keep credentials, runtime uploads, dependencies, build output, and temporary test files out of Git.
- Update the README or relevant document when user-visible behavior changes.
