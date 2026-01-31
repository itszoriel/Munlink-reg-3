# MunLink API container for Railway (API only)

FROM python:3.12-slim AS base

# Prevent Python from writing .pyc and ensure stdout flush
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    FLASK_APP=app:create_app

# Work under /app to preserve repo structure
WORKDIR /app

# Install system deps (add here if psycopg2 needs build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy API requirements first for layer caching
COPY apps/api/requirements.txt apps/api/requirements.txt

# Install Python deps
RUN pip install --upgrade pip && pip install -r apps/api/requirements.txt

# Copy entire repo (frontends are ignored via .dockerignore)
COPY . .

# Set runtime working directory to API folder
WORKDIR /app/apps/api

# Default command: run migrations then start gunicorn
CMD ["sh", "-c", "flask db upgrade && gunicorn app:app --bind 0.0.0.0:${PORT:-5000} --workers 2 --timeout 120"]
