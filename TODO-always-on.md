# TODO: Keep MunLink awake on free plans (copy Baul's setup)

> Status 2026-11-27 (branch `ops/always-on`): code done for 1, 2 and 4 (render.yaml static sites, `supabase/keep_alive.sql`, `/internal/notifications/run` + `supabase/notification_cron.sql`). Still manual: sync the Render blueprint, run the SQL files, set `INTERNAL_CRON_SECRET`, add the external pinger (3), delete the old Docker web/admin services.

**Goal:** no 30–60 second "waking up" delay on first visit, and the Supabase
database never gets paused. Stay on free plans.

## Why Baul never wakes up and MunLink does

| | Baul | MunLink today |
|---|---|---|
| Backend | Vercel serverless functions: start in well under a second, no sleeping container | Flask on Render **free**: the whole container **sleeps after 15 min with no traffic**, then takes ~30–60 s to boot |
| Frontend | Served by Vercel's CDN, never sleeps | `munlink-web` and `munlink-admin` are Docker/nginx **web services** on Render free, so they **also sleep** |
| Database | Supabase. Two **pg_cron** jobs run inside the database every 10 and 15 min (one calls an Edge Function over HTTP through **pg_net**), so the project always has activity | Supabase (`ap-southeast-1` pooler). Nothing scheduled, so it relies on real users to stay active |

What these things are called:
- **pg_cron**: Postgres extension that runs scheduled jobs inside the database.
- **pg_net**: Postgres extension that lets those jobs make HTTP requests.
- **Keep-alive (or heartbeat) ping**: hitting a URL on a schedule so the host doesn't put it to sleep.

Note: `render.yaml` says `plan: free  # always-on ...` for the API. That comment is wrong: the free plan sleeps. Fix the comment.

## Checklist

### 1. Turn web and admin into Render static sites (they stop sleeping)
- [ ] In `render.yaml`, change `munlink-web` and `munlink-admin` from `type: web` / `runtime: docker` to static sites (`runtime: static`) with a `buildCommand` and `staticPublishPath` (Vite `dist`).
- [ ] Add a rewrite rule `/*` → `/index.html` so the React router works.
- [ ] Admin currently injects `env-config.js` at runtime and uses an nginx `/api/` proxy fallback. Move those to build-time `VITE_*` variables. The frontend should call `VITE_API_URL` directly, since CORS is already set up for it.
- [ ] Why this matters: Render free gives **750 instance-hours a month per workspace**. Keeping one service awake all month uses about 744. Only the API can stay awake 24/7, so the other two must not count against the hours. Static sites don't.

### 2. Keep the API awake with a pg_cron ping (Baul's approach)
Run in the Supabase SQL editor of MunLink's project:

```sql
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'munlink-keep-alive',
  '*/10 * * * *',                -- every 10 min (Render sleeps after 15)
  $$
    select net.http_get(
      url := 'https://munlink-api-5s9w.onrender.com/health/db',
      timeout_milliseconds := 60000   -- allow time for a cold boot
    )
  $$
);
```

- [ ] Use `/health/db` rather than `/health`. Each ping then wakes Render **and** makes the API query Supabase, so both stay active with one job.
- [ ] Make sure `/health/db` returns only `ok`/`error`, with no error details or connection info, and isn't blocked by the rate limiter.
- [ ] Check it's running: `select * from cron.job_run_details order by start_time desc limit 10;` and `select * from net._http_response order by created desc limit 10;`

### 3. Add an outside backup pinger
- [ ] If Supabase ever pauses the project, the pg_cron job pauses with it. Add a free external monitor (e.g. UptimeRobot or cron-job.org) that hits `/health/db` every 5–10 min. It also emails you when the API is down.
- [ ] Don't use a GitHub Actions `schedule` for this: runs are often delayed 10–30+ min, which is longer than Render's 15-min sleep timer.

### 4. Move the notification worker off the sleep-prone process
- [ ] `apps/api/Dockerfile` starts `scripts/notification_worker.py` in the background inside the API container. When the container sleeps or restarts, notifications stop. With the keep-alive this mostly goes away, but it's still fragile.
- [ ] Better: add a protected endpoint, e.g. `POST /internal/notifications/run` with a shared-secret header, that processes one batch from the outbox. Then call it from pg_cron the same way Baul calls its `storage-cleanup` function. Store the secret in Supabase Vault, not inside the cron SQL. Baul's version is `supabase/production/configure-storage-cleanup.sql`.

### 5. Caveats to keep in mind
- [ ] Free plans can change their rules. Render may restrict keep-alive pings, and Supabase doesn't publish exactly what counts as "inactive". Check the free-plan terms every few months.
- [ ] Every 10-minute ping uses Render hours and a little bandwidth. Stay within 750 h/month by keeping only the API awake.
- [ ] For a guaranteed always-on API with no workarounds, the paid fix is Render's Starter plan, or moving the API to a serverless setup like Baul's.
