-- MunLink keep-alive (run in the Supabase SQL editor of the MunLink project).
-- Every 10 minutes the database calls the API's /health/db: that wakes the
-- Render free container (it sleeps after 15 idle minutes) and makes the API run a
-- real query, so the Supabase free project never counts as inactive.
-- Safe to re-run.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid) from cron.job where jobname = 'munlink-keep-alive';

select cron.schedule(
  'munlink-keep-alive',
  '*/10 * * * *',
  $$
    select net.http_get(
      url := 'https://munlink-api-5s9w.onrender.com/health/db',
      timeout_milliseconds := 60000   -- allow time for a cold boot
    )
  $$
);

-- Check it runs:
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select * from net._http_response order by created desc limit 10;
