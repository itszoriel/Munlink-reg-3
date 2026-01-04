# MunLink Region 3 API - Dockerfile
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create upload directories
RUN mkdir -p uploads/region3/marketplace/items \
    uploads/region3/profiles \
    uploads/region3/verification \
    uploads/region3/generated_docs

# Expose port
EXPOSE 5000

# Run migrations and start server
CMD ["sh", "-c", "flask db upgrade && gunicorn app:app --bind 0.0.0.0:${PORT:-5000} --workers 2 --threads 2 --timeout 120 --max-requests 1000 --max-requests-jitter 50"]
