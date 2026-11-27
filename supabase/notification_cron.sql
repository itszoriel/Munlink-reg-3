-- MunLink notification delivery via pg_cron.
-- Normally NOT needed: every start of munlink-api runs scripts/schedule_db_cron.py,
-- which creates the Vault secret munlink_internal_cron_secret and schedules this
-- job. The API reads the secret from Vault, so it never has to be copied.
-- Use this file only to reschedule by hand. Safe to re-run.
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
