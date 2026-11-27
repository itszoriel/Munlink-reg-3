-- MunLink notification delivery via pg_cron (run after keep_alive.sql).
-- 1. Create the shared secret once (32+ random characters) in Supabase Vault:
--      select vault.create_secret('<random-secret>', 'munlink_internal_cron_secret');
-- 2. Put the SAME value in Render as INTERNAL_CRON_SECRET on munlink-api.
-- 3. Run this file. Safe to re-run.
select cron.unschedule(jobid) from cron.job where jobname = 'munlink-notifications';

select cron.schedule(
  'munlink-notifications',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := 'https://munlink-api-5s9w.onrender.com/internal/notifications/run',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'munlink_internal_cron_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    )
  $$
);
