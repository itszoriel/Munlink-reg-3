# MunLink Zambales API
# Build stage compiles wheels; the runtime image has no compiler and runs as a
# non-root user.

FROM python:3.12-slim AS builder
WORKDIR /build
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt


FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=5000

# libpq5: psycopg2 runtime. libmagic1: python-magic file-type checks.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 libmagic1 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 munlink

WORKDIR /app
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

COPY --chown=munlink:munlink . .
RUN mkdir -p uploads/region3 && chown -R munlink:munlink uploads

# Startup:
# - migrations must succeed, otherwise the container exits and Render keeps the
#   previous deploy running instead of serving a half-migrated schema;
# - the database-side notification schedule (Vault secret + pg_cron job) is
#   ensured on every start; it never blocks start-up;
# - the notification worker restarts itself if it crashes (pg_cron also calls
#   /internal/notifications/run, so delivery continues either way);
# - one gunicorn worker keeps the in-memory rate limits accurate on the single
#   free instance; threads handle concurrency.
RUN printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    'echo "Running database migrations..."' \
    'flask db upgrade heads' \
    'python scripts/schedule_db_cron.py || true' \
    '(while true; do python scripts/notification_worker.py || true; echo "Notification worker exited; restarting in 5s"; sleep 5; done) &' \
    'exec gunicorn app:app --bind 0.0.0.0:${PORT} --workers 1 --threads 8 --timeout 120 --max-requests 1000 --max-requests-jitter 50 --access-logfile - --error-logfile -' \
    > /app/start.sh \
    && chmod 755 /app/start.sh

USER munlink
EXPOSE 5000
CMD ["/app/start.sh"]
