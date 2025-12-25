# Environment Configuration Guide

This guide explains how to configure environment variables for the Organic Vegetable Order Management System.

## Table of Contents

- [Quick Start](#quick-start)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Environment-Specific Setup](#environment-specific-setup)
- [External Services Setup](#external-services-setup)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Local Development Setup

1. **Backend Setup**

```bash
cd backend
cp .env.development .env
# Edit .env with your local database credentials if needed
```

2. **Frontend Setup**

```bash
cd frontend
cp .env.development .env
# Usually no changes needed for local development
```

3. **Start Services**

```bash
# Start PostgreSQL (if using Docker)
docker-compose up postgres -d

# Or start everything with Docker
docker-compose up
```

## Backend Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/organic_veg_db?schema=public` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Generate with: `openssl rand -base64 32` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development`, `production`, or `test` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173` |
| `FILE_STORAGE_PATH` | Path for file uploads | `./uploads` |

### External Service Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WHATSAPP_API_URL` | WhatsApp API endpoint | Production only |
| `WHATSAPP_API_TOKEN` | WhatsApp access token | Production only |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID | Production only |
| `SENDGRID_API_KEY` | SendGrid API key | Production only |
| `SENDGRID_FROM_EMAIL` | Verified sender email | Production only |

### Rate Limiting Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_VERIFICATION_CODES` | Max codes per hour | `3` |
| `RATE_LIMIT_API_REQUESTS` | Max requests per minute | `100` |
| `RATE_LIMIT_LOGIN_ATTEMPTS` | Max login attempts per hour | `5` |

## Frontend Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` (dev)<br>`https://api.organicveg.com` (prod) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application name | `Organic Veg Order Management` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |
| `VITE_ENABLE_DEBUG_MODE` | Enable debug logging | `false` |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | `false` |

## Environment-Specific Setup

### Development Environment

**Backend** (`backend/.env.development`):
- Uses local PostgreSQL
- Relaxed rate limiting
- Mock external services (optional)
- Debug logging enabled

**Frontend** (`frontend/.env.development`):
- Points to `localhost:3000`
- Debug mode enabled
- Analytics disabled

**Setup**:
```bash
# Backend
cd backend
cp .env.development .env

# Frontend
cd frontend
cp .env.development .env
```

### Production Environment

**Backend** (`backend/.env.production`):
- Managed database with SSL
- Strict rate limiting
- Real external services required
- Production logging

**Frontend** (`frontend/.env.production`):
- Points to production API
- Debug mode disabled
- Analytics enabled

**Setup**:
```bash
# Backend
cd backend
cp .env.production .env
# IMPORTANT: Edit .env and set all production values
# Never commit the actual .env file!

# Frontend
cd frontend
cp .env.production .env
# Update VITE_API_URL to your production API
```

### Testing Environment

For running tests:

```bash
# Backend
cd backend
cp .env.development .env.test
# Update DATABASE_URL to use a test database
```

## External Services Setup

### WhatsApp Business API

1. **Create Facebook Developer Account**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add WhatsApp product

2. **Get Credentials**
   - Navigate to WhatsApp > API Setup
   - Copy the Phone Number ID
   - Generate a permanent access token
   - Copy the API URL (usually `https://graph.facebook.com/v18.0`)

3. **Configure Environment**
   ```bash
   WHATSAPP_API_URL=https://graph.facebook.com/v18.0
   WHATSAPP_API_TOKEN=your_permanent_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   ```

4. **Test Configuration**
   ```bash
   # Send a test message through the API
   curl -X POST "https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages" \
     -H "Authorization: Bearer ${WHATSAPP_API_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"messaging_product":"whatsapp","to":"YOUR_TEST_NUMBER","type":"text","text":{"body":"Test message"}}'
   ```

### SendGrid Email Service

1. **Create SendGrid Account**
   - Go to [SendGrid](https://sendgrid.com/)
   - Sign up for an account
   - Verify your email

2. **Create API Key**
   - Navigate to Settings > API Keys
   - Click "Create API Key"
   - Choose "Full Access" or "Restricted Access" with Mail Send permissions
   - Copy the API key (shown only once!)

3. **Verify Sender Email**
   - Navigate to Settings > Sender Authentication
   - Verify a single sender email OR
   - Authenticate your domain (recommended for production)

4. **Configure Environment**
   ```bash
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

5. **Test Configuration**
   ```bash
   # Send a test email
   curl -X POST "https://api.sendgrid.com/v3/mail/send" \
     -H "Authorization: Bearer ${SENDGRID_API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"'${SENDGRID_FROM_EMAIL}'"},"subject":"Test","content":[{"type":"text/plain","value":"Test email"}]}'
   ```

### PostgreSQL Database

#### Local Development

Using Docker:
```bash
docker-compose up postgres -d
```

Using local PostgreSQL:
```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb organic_veg_db

# Update DATABASE_URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/organic_veg_db?schema=public
```

#### Production

Use a managed database service:

**DigitalOcean Managed Database**:
```bash
DATABASE_URL=postgresql://user:password@host:25060/organic_veg_db?sslmode=require
```

**AWS RDS**:
```bash
DATABASE_URL=postgresql://user:password@instance.region.rds.amazonaws.com:5432/organic_veg_db?sslmode=require
```

**Heroku Postgres**:
```bash
# Automatically set by Heroku
DATABASE_URL=postgresql://...
```

## Security Best Practices

### JWT Secret

**Generate a secure secret**:
```bash
# Generate a 32-byte random string
openssl rand -base64 32
```

**Never use**:
- Default values from `.env.example`
- Short or predictable strings
- The same secret across environments

### Database Credentials

**Production**:
- Use strong, randomly generated passwords
- Enable SSL/TLS connections (`sslmode=require`)
- Restrict database access by IP
- Use managed database services when possible

### API Keys

**Storage**:
- Never commit API keys to version control
- Use environment variables or secret management services
- Rotate keys regularly

**Access**:
- Use restricted API keys with minimum required permissions
- Monitor API usage for anomalies
- Set up alerts for unusual activity

### Environment Files

**Version Control**:
```bash
# .gitignore should include:
.env
.env.local
.env.*.local
```

**Production Deployment**:
- Use platform environment variables (Heroku, Vercel, etc.)
- Or use secret management (AWS Secrets Manager, HashiCorp Vault)
- Never store secrets in Docker images

## Troubleshooting

### Backend Won't Start

**Error: "DATABASE_URL is required"**
```bash
# Solution: Check .env file exists and has DATABASE_URL
cd backend
cat .env | grep DATABASE_URL
```

**Error: "JWT_SECRET must be at least 32 characters"**
```bash
# Solution: Generate a proper secret
openssl rand -base64 32
# Add to .env file
```

**Error: "Cannot connect to database"**
```bash
# Check PostgreSQL is running
docker-compose ps postgres
# Or for local PostgreSQL
pg_isready

# Test connection
psql $DATABASE_URL
```

### Frontend Can't Connect to Backend

**Error: "Network Error" or "CORS Error"**
```bash
# Check VITE_API_URL in frontend/.env
cd frontend
cat .env | grep VITE_API_URL

# Check backend CORS_ORIGIN
cd backend
cat .env | grep CORS_ORIGIN

# They should match:
# Frontend: VITE_API_URL=http://localhost:3000
# Backend: CORS_ORIGIN=http://localhost:5173
```

### External Services Not Working

**WhatsApp messages not sending**:
1. Check token is valid: Test with curl (see above)
2. Check phone number is verified in Facebook console
3. Check API URL is correct
4. Review WhatsApp API logs in Facebook console

**Emails not sending**:
1. Check API key is valid: Test with curl (see above)
2. Check sender email is verified in SendGrid
3. Check SendGrid activity logs
4. Verify you haven't hit rate limits

### Environment Validation

The backend automatically validates environment variables on startup:

```bash
cd backend
npm run dev

# You should see:
# ✓ Environment variables validated
# 📋 Configuration:
#   - Environment: development
#   - Port: 3000
#   ...
```

If validation fails, you'll see specific error messages:
```bash
# ❌ Environment variable validation failed:
#   - JWT_SECRET: JWT_SECRET must be at least 32 characters for security
#   - DATABASE_URL: DATABASE_URL is required
```

## Docker Environment Variables

### Development (docker-compose.yml)

Environment variables are set directly in the compose file:

```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/organic_veg_db
      JWT_SECRET: dev-secret-key
      # ...
```

### Production (docker-compose.prod.yml)

Environment variables use `.env` file:

```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
      # ...
```

Create `.env` file in project root:
```bash
POSTGRES_USER=produser
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=organic_veg_db
JWT_SECRET=your_secure_jwt_secret_here
# ... other variables
```

## Additional Resources

- [Prisma Environment Variables](https://www.prisma.io/docs/guides/development-environment/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [SendGrid API Documentation](https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/authentication)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
