# Handover plan: transferring MunLink Zambales to the local government

MunLink Zambales is a student/developer project. It is not an official service of the Province of Zambales or any of its municipalities. While it stays a project, it runs on the developer's personal accounts: a personal Gmail and mobile number for support, a personal bank QR for manual payments, and personal Stripe, SendGrid, Render, Supabase and GitHub accounts.

This document lists every one of those dependencies and the steps to move them to the local government if the officials decide to adopt the system. Work through it in order. Nothing here should be done before there is a written agreement (Phase 0).

> This file deliberately does not repeat personal contact details or account numbers. It points to where they live in the code and configuration.

## 1. Inventory: what is personal today

| # | What | Where it lives | Who it belongs to now | What it must become |
| --- | --- | --- | --- | --- |
| 1 | Support email and phone shown to the public | `apps/web/src/pages/About.tsx` (support panel), `PrivacyPolicy.tsx` section 10, `TermsOfService.tsx` section 9 | Developer's personal Gmail and mobile | Official office contact (MIS/ICT office or PIO) |
| 2 | Manual payment QR image | `apps/api/public/payment/paymentQR_fallback.jpg` (committed), path set by `MANUAL_QR_IMAGE_PATH` | Developer's personal bank account (InstaPay QR) | Treasurer's official collection account, or removed |
| 3 | Manual payment "pay to" number and name | `render.yaml` → `MANUAL_PAY_TO_NUMBER`; `MANUAL_PAY_TO_NAME` (env) | Developer's mobile number | Treasurer's account details |
| 4 | Card payments | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (Render env) | Developer's Stripe account | An LGU-approved payment channel (see Phase 2) |
| 5 | Outgoing email (verification, payment IDs, notices) | `SENDGRID_API_KEY`, `FROM_EMAIL` (Render env) | Developer's SendGrid account and sender | LGU SendGrid (or other provider) with an official sender address on an LGU domain |
| 6 | Source code | GitHub repository (public), developer's account | Developer | LGU or provincial GitHub organisation (or a private copy) |
| 7 | Hosting: API, resident site, admin site | Render (free plan), `render.yaml` blueprint | Developer's Render account | LGU hosting account, on a paid plan or government cloud |
| 8 | Database, file storage, Vault, scheduled jobs | Supabase project (Postgres, `munlink-files` and `munlinkprivate-files` buckets, `pg_cron`) | Developer's Supabase account | LGU-owned Supabase organisation or equivalent Postgres plus object storage |
| 9 | Web addresses | `*.onrender.com` subdomains in `render.yaml` (`WEB_URL`, `ADMIN_URL`, `BASE_URL`, `QR_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `VITE_API_URL`, `VITE_PUBLIC_SITE_URL`) | Render-provided names | Official domain, e.g. a `.gov.ph` subdomain |
| 10 | Superadmin account | Created with `apps/api/scripts/create_superadmin.py` | Developer | Named provincial or LGU administrator |
| 11 | Municipal admin accounts | `apps/api/scripts/seed_locations_and_admins.py` (pattern `<town>.munlink@gmail.com`) | Seed or test mailboxes | Each municipality's official office email |
| 12 | Names printed on generated documents | `apps/api/config/municipalityOfficials.json`, `barangayOfficials.json` | Collected from public sources | Confirmed by each office; updated after every election |
| 13 | Document fees and requirements | `document_types` table (all fees start `fee_confirmed = false`, shown as "provisional") | Seeded placeholders | Confirmed per office on the admin **Fees** page |
| 14 | Privacy Policy and Terms | `PrivacyPolicy.tsx`, `TermsOfService.tsx` | Written as "we" with the developer as contact | The LGU as personal information controller, with its Data Protection Officer |
| 15 | SMS | PhilSMS (`PHILSMS_*`); now `SMS_PROVIDER=disabled` | Developer's PhilSMS account (no credits) | LGU account, or keep disabled |
| 16 | Every secret | `SECRET_KEY`, `JWT_SECRET_KEY`, `ADMIN_SECRET_KEY`, `CLAIM_CODE_ENC_KEY`, Supabase keys, Vault cron secret | Generated or known by the developer | New values the developer never sees |

## 2. Decisions the officials must make first

These answers change the rest of the plan, so get them in writing before any transfer.

1. **Who operates it.** Choose one: the Provincial Government for all 13 towns, or each municipality separately. The code assumes one operator for the whole province, with a superadmin above per-town admins. A town-by-town split needs separate deployments.
2. **Who collects the money.** Fees for barangay and municipal documents belong to the barangay or municipal treasury, and the treasurer issues the official receipt. The system currently has **one** payment destination for all 13 towns. The officials must choose:
   - (a) **Pay at the office only.** This uses the existing office payment code. It needs no code change and is the safest start.
   - (b) **One provincial collection account.** This is the current design, but the funds would then need remitting to each town.
   - (c) **One account per municipality.** This needs the code change in section 4.
3. **Which online payment channel, if any.** Stripe does not onboard businesses based in the Philippines, so it cannot be the LGU's live channel; the current Stripe setup is for testing only. Government channels to ask the treasurer about include LANDBANK Link.BizPortal, DBP PayGate, and GCash or Maya merchant accounts. The choice must satisfy COA rules for official receipts.
4. **Domain.** Decide on the official address, for example `munlink.zambales.gov.ph`, and who manages its DNS.
5. **Data Protection Officer and privacy registration.** Name the DPO who answers resident data requests, and decide whether to register the system with the National Privacy Commission.
6. **Support desk.** Decide which office answers "the website is not working" reports, by email and by phone.
7. **Budget for hosting.** The free Render and Supabase plans sleep, have small limits, and come with no service-level agreement. Production use needs paid plans or government cloud hosting.

## 3. Transfer, step by step

### Phase 0: Agreement (before anything moves)

- [ ] Sign a memorandum of agreement or deed of donation covering: ownership of the code, licence, data controller, a support period from the developer, and the end of the developer's access.
- [ ] Get written answers to the decisions in section 2.
- [ ] The LGU creates its own accounts with official email addresses: GitHub organisation, hosting, Supabase, the email provider, and the payment channel. **The developer should not create them.**

### Phase 1: Code and infrastructure

- [ ] Transfer the GitHub repository to the LGU organisation, or the LGU forks it and the developer archives the original. Re-check the branch protection and required checks listed in `docs/DEPLOYMENT.md`.
- [ ] Create a new Supabase project under the LGU account. Run all migrations (`flask db upgrade`) and create both storage buckets. Keep `munlinkprivate-files` **private with no storage policies**.
- [ ] Decide on the data question (see Phase 4) before copying any rows.
- [ ] Create the Render (or other host) services from `render.yaml` under the LGU account. Enter every `sync: false` value fresh.
- [ ] Point the official domain at the new services. Update `WEB_URL`, `ADMIN_URL`, `BASE_URL`, `QR_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `VITE_API_URL` and `VITE_PUBLIC_SITE_URL` in `render.yaml`.
- [ ] Confirm `SCHEDULE_DB_CRON_JOBS=true` creates a **new** Vault cron secret in the new database. Never copy the old one.

### Phase 2: Money

- [ ] **Remove the developer's QR first.** Delete `apps/api/public/payment/paymentQR_fallback.jpg` from the repository, or replace it with the treasurer's official QR. If no QR file exists, the manual QR option switches itself off.
- [ ] Set `MANUAL_PAY_TO_NAME` and `MANUAL_PAY_TO_NUMBER` to the treasurer's account, or remove both. Remove the hard-coded `MANUAL_PAY_TO_NUMBER` value from `render.yaml`.
- [ ] Remove the Stripe keys. If the LGU picks another online channel, integrate it as new work; it is not a configuration change.
- [ ] If the choice is per-municipality collection (decision 2c), make the code change in section 4 first.
- [ ] Have the treasurer confirm how admins will match payments to official receipts.

### Phase 3: Contact details, legal pages and email

- [ ] Replace the support email and phone in `About.tsx`, `PrivacyPolicy.tsx` and `TermsOfService.tsx` with the support desk from decision 6.
- [ ] Rewrite the Privacy Policy with the LGU as personal information controller, the DPO's contact details, the retention period (`ID_RETENTION_DAYS`) and how residents can exercise their Data Privacy Act rights. Ask the LGU's legal office to review the Terms of Service.
- [ ] Set up the email provider on the official domain (SPF, DKIM, DMARC). Set `FROM_EMAIL` to an official no-reply address and `SENDGRID_API_KEY` to the LGU's key.
- [ ] Add a short line in the site footer naming the operating office.

### Phase 4: Data and accounts

- [ ] **Pilot data.** Residents who registered during the project gave their data to the developer, not to the LGU. Recommended: start the LGU deployment with an **empty** user table and keep only reference data: provinces, municipalities, barangays and document types. Delete the pilot database, including uploaded IDs and selfies, once the new system is live. If the LGU wants to keep pilot accounts, send those residents a notice first and let them opt out.
- [ ] Delete test accounts, test requests and test uploads.
- [ ] Create the superadmin for the named administrator with `scripts/create_superadmin.py` and the official email. Turn on 2FA.
- [ ] Create each municipal admin with the office's official email, **not** the `<town>.munlink@gmail.com` seed pattern. Barangay admins follow the same rule.
- [ ] Each municipal office confirms its fees, processing days and requirements on the admin **Fees** page. The "provisional" label disappears as each fee is confirmed.
- [ ] Each office confirms the names in `municipalityOfficials.json` and `barangayOfficials.json`.
- [ ] Each office confirms the requirement lists for its document types, especially the marriage license, the business permit and the cedula.

### Phase 5: Cut the developer's access

- [ ] Rotate every secret in section 1, item 16. Generate the new values on the LGU side.
- [ ] Remove the developer from GitHub, the host, Supabase, the email provider and the payment accounts, unless the support agreement keeps a limited role.
- [ ] Shut down or delete the developer's Render services, Supabase project and SendGrid sender.
- [ ] Revoke the developer's API keys at Stripe, SendGrid and PhilSMS.
- [ ] Check the audit log (`/audit-log` in admin) to confirm the developer's accounts no longer act.

### Phase 6: Go-live checks

- [ ] Register a test resident on the official domain. Confirm the verification email arrives from the official sender.
- [ ] Upload an ID and confirm that only that resident's own municipality admin can view it.
- [ ] Request a document, pay through the chosen channel, mark it ready, release it, and check the claim stub and QR verification.
- [ ] Confirm that `/health` responds and that the `pg_cron` keep-alive and notification jobs run (`docs/OPERATIONS.md`).
- [ ] Publish the support desk contact and announce the launch through the LGU's official channels.

## 4. Code changes to make before a real handover

The code cannot do these yet through configuration alone.

1. **Per-municipality payment destination.** Manual QR, pay-to name and pay-to number are global settings in `config.py` and are read in `routes/documents.py`. Move them to a per-municipality record (a table, or columns on `municipalities`) managed from the admin site. Payment-proof review must stay scoped to that municipality's admins.
2. **Contact details in one place.** The support email and phone are typed out in three pages. Move them into one setting (an env value such as `VITE_SUPPORT_EMAIL` and `VITE_SUPPORT_PHONE`, or an API setting) so the handover becomes a configuration change.
3. **Operator name.** Add a configurable "operated by" line for the footer and the legal pages.
4. **Remove the committed QR image** from the repository (item 2) and load the QR from private storage instead.
5. **Officials data in the database.** Move `municipalityOfficials.json` and `barangayOfficials.json` into tables the admins can edit after elections, instead of JSON files that need a deploy.

## 5. What stays with the developer

- Credit as the original author, per the agreement.
- Optionally, a support role for an agreed period: a GitHub collaborator with pull request rights only, no production database or payment access.
- Nothing else. After Phase 5 the developer should hold no secret and no resident data.
