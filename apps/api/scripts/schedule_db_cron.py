"""Keep the database-side notification schedule in place (run at API start-up).

Creates the pg_cron shared secret in Supabase Vault if it is missing and
(re)schedules the job that calls POST /internal/notifications/run every
5 minutes. The secret is generated inside the database and never leaves it:
pg_cron reads it from Vault and the API reads it via vault.decrypted_secrets.

Runs only where SCHEDULE_DB_CRON_JOBS=true and BASE_URL is an https URL (the
Render API service), because local development shares the Supabase project and
must never repoint the production job. Idempotent; never blocks start-up.
"""
from __future__ import annotations

import os
import re
import sys

from sqlalchemy import create_engine, text

SECRET_NAME = 'munlink_internal_cron_secret'
JOB_NAME = 'munlink-notifications'


def _target_url():
    if os.getenv('SCHEDULE_DB_CRON_JOBS', '').lower() != 'true':
        return None
    base = (os.getenv('BASE_URL') or '').rstrip('/')
    if not re.fullmatch(r'https://[A-Za-z0-9.-]+', base):
        return None
    return f'{base}/internal/notifications/run'


def setup_sql(url):
    return f"""
DO $setup$
BEGIN
  IF to_regclass('vault.secrets') IS NULL
     OR to_regnamespace('cron') IS NULL
     OR to_regnamespace('net') IS NULL THEN
    RAISE WARNING 'MunLink cron setup skipped: Vault, pg_cron or pg_net is not installed';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = '{SECRET_NAME}') THEN
    PERFORM vault.create_secret(
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      '{SECRET_NAME}',
      'MunLink: pg_cron -> API /internal shared secret'
    );
  END IF;

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = '{JOB_NAME}';
  PERFORM cron.schedule(
    '{JOB_NAME}',
    '*/5 * * * *',
    $job$
      SELECT net.http_post(
        url := '{url}',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = '{SECRET_NAME}')
        ),
        body := '{{}}'::jsonb,
        timeout_milliseconds := 60000
      )
    $job$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'MunLink cron setup skipped: %', SQLERRM;
END
$setup$;
"""



def main() -> int:
    url = _target_url()
    database_url = os.getenv('DATABASE_URL', '')
    if not url or not database_url.startswith('postgres'):
        print('DB cron setup: not enabled here, skipping')
        return 0
    try:
        engine = create_engine(database_url, pool_pre_ping=True)
        with engine.begin() as conn:
            conn.execute(text(setup_sql(url)))
            scheduled = conn.execute(
                text("SELECT count(*) FROM cron.job WHERE jobname = :name"), {'name': JOB_NAME}
            ).scalar()
        print(f'DB cron setup: {JOB_NAME} scheduled={bool(scheduled)}')
    except Exception as exc:  # never block the API from starting
        print(f'DB cron setup skipped: {type(exc).__name__}', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
