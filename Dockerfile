# MunLink API - Railway Dockerfile
# Backend API service (Python/Flask)

FROM python:3.12-slim

# Prevent Python from writing .pyc and ensure stdout flush
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    FLASK_APP=app:create_app \
    FLASK_ENV=production

# Work under /app to preserve repo structure
WORKDIR /app

# Install system deps (psycopg2 needs libpq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy API requirements first for layer caching
COPY apps/api/requirements.txt apps/api/requirements.txt

# Install Python deps
RUN pip install --upgrade pip && pip install -r apps/api/requirements.txt

# Copy entire repo (frontends are ignored via .dockerignore)
COPY . .

# Create upload directories
RUN mkdir -p uploads/region3/marketplace/items \
    uploads/region3/profiles \
    uploads/region3/verification \
    uploads/region3/generated_docs

# Set runtime working directory to API folder
WORKDIR /app/apps/api

# Expose port (Railway uses PORT env variable)
EXPOSE 5000

# Start gunicorn - PORT is provided by Railway
CMD ["sh", "-c", "flask db upgrade && gunicorn app:app --bind 0.0.0.0:${PORT:-5000} --workers 2 --threads 2 --timeout 120"]
