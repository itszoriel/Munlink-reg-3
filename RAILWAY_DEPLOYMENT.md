# Railway Deployment Guide for MunLink

This guide explains how to deploy MunLink to Railway.

## Project Structure

This is a monorepo with 3 services:
- **munlink-api** - Python/Flask backend API
- **munlink-web** - React/Vite public website  
- **munlink-admin** - React/Vite admin dashboard

## Step 1: Create Railway Services

In Railway, create 3 separate services pointing to this repository:

### 1.1 munlink-api (API Service)
- **Name**: `munlink-api`
- **Dockerfile Path**: `Dockerfile` (root)
- **Root Directory**: `/` (root)

### 1.2 munlink-web (Public Website)
- **Name**: `munlink-web`  
- **Dockerfile Path**: `Dockerfile.web`
- **Root Directory**: `/` (root)

### 1.3 munlink-admin (Admin Dashboard)
- **Name**: `munlink-admin`
- **Dockerfile Path**: `Dockerfile.admin`
- **Root Directory**: `/` (root)

## Step 2: Set Environment Variables

### munlink-api Service Variables

Copy these from your Render dashboard:

```
# Required - Security Keys
SECRET_KEY=<copy from Render>
JWT_SECRET_KEY=<copy from Render>
ADMIN_SECRET_KEY=<copy from Render>
CLAIM_CODE_ENC_KEY=<copy from Render>

# Required - Database
DATABASE_URL=<your Supabase connection string>

# Required - Flask Config
FLASK_ENV=production
DEBUG=False
FLASK_APP=app.py
APP_NAME=MunLink Zambales

# Supabase (if using Supabase features)
SUPABASE_URL=<copy from Render>
SUPABASE_KEY=<copy from Render>
SUPABASE_SERVICE_KEY=<copy from Render>

# Frontend URLs - UPDATE THESE after deploying web/admin
WEB_URL=https://<your-munlink-web>.up.railway.app
ADMIN_URL=https://<your-munlink-admin>.up.railway.app
BASE_URL=https://<your-munlink-api>.up.railway.app
QR_BASE_URL=https://<your-munlink-web>.up.railway.app/verify

# JWT Settings
JWT_ACCESS_TOKEN_EXPIRES=86400

# File Uploads
UPLOAD_FOLDER=uploads/region3
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png,doc,docx

# Email (if using)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=<copy from Render>
SMTP_PASSWORD=<copy from Render>
FROM_EMAIL=<copy from Render>

# SMS (if using)
SMS_PROVIDER=philsms
PHILSMS_API_KEY=<copy from Render>
PHILSMS_SENDER_ID=<copy from Render>
```

### munlink-web Service Variables

```
VITE_API_URL=https://<your-munlink-api>.up.railway.app
VITE_APP_NAME=MunLink Zambales
```

### munlink-admin Service Variables

```
VITE_API_URL=https://<your-munlink-api>.up.railway.app
VITE_APP_NAME=MunLink Zambales Admin
VITE_PUBLIC_SITE_URL=https://<your-munlink-web>.up.railway.app
```

## Step 3: Configure Each Service in Railway

### For munlink-api:
1. Go to Settings → Build
2. Set **Dockerfile Path** to: `Dockerfile`
3. Go to Settings → Networking
4. Generate a public domain (e.g., `munlink-api-production.up.railway.app`)
5. Set health check path to `/health`

### For munlink-web:
1. Go to Settings → Build
2. Set **Dockerfile Path** to: `Dockerfile.web`
3. Go to Settings → Networking
4. Generate a public domain

### For munlink-admin:
1. Go to Settings → Build
2. Set **Dockerfile Path** to: `Dockerfile.admin`
3. Go to Settings → Networking
4. Generate a public domain

## Step 4: Update URLs

After all services are deployed:

1. Get the Railway URLs for each service
2. Update the environment variables:
   - In **munlink-api**: Update `WEB_URL`, `ADMIN_URL`, `BASE_URL`, `QR_BASE_URL`
   - In **munlink-web**: Update `VITE_API_URL`
   - In **munlink-admin**: Update `VITE_API_URL`, `VITE_PUBLIC_SITE_URL`

## Step 5: Redeploy

After updating environment variables, redeploy all services.

## Troubleshooting

### Health Check Failing
1. Check logs for startup errors
2. Ensure `DATABASE_URL` is set correctly
3. Ensure all required secrets are set

### CORS Errors
- Ensure `WEB_URL` and `ADMIN_URL` in the API service match your actual frontend URLs

### Database Connection Issues
- Use the **Transaction Pooler** connection string from Supabase (port 6543)
- Ensure `sslmode=require` is in the connection string
