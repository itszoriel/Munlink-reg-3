# MunLink Region 3 API - Dockerfile (Fly.io optimized)
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create upload directory structure (will be overwritten by volume mount in production)
RUN mkdir -p uploads/region3/marketplace/items \
    uploads/region3/profiles \
    uploads/region3/verification \
    uploads/region3/generated_docs \
    uploads/region3/exports \
    uploads/region3/claims \
    uploads/region3/benefit_programs/admins

# Fly.io uses PORT env var, default to 8080
ENV PORT=8080
EXPOSE 8080

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Gunicorn with production settings:
# - 2 workers (appropriate for shared-cpu-1x)
# - 2 threads per worker
# - 120s timeout for long-running requests (PDF generation, etc.)
# - keep-alive 75s (higher than typical load balancer timeout)
# - max-requests to prevent memory leaks
CMD ["sh", "-c", "flask db upgrade && gunicorn app:app --bind 0.0.0.0:${PORT:-8080} --workers 2 --threads 2 --timeout 120 --max-requests 1000 --max-requests-jitter 50 --keep-alive 75 --worker-class sync --access-logfile - --error-logfile -"]
