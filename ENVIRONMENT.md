# Environment Configuration Guide

This document describes all environment variables used in the Organic Vegetable Order Management System.

## Quick Start

### Development Setup

1. **Backend**: Copy `.env.development` to `.env` in the `backend` directory
2. **Frontend**: Copy `.env.development` to `.env` in the `frontend` directory
3. Update database credentials if needed
4. Start the application

### Production Setup

1. **Backend**: Use `.env.production` as a template
2. **Frontend**: Use `.env.production` as a template
3. **IMPORTANT**: Replace all placeholder values with actual production credentials
4. Never commit `.env` files to version control

## Backend Environment Variables

### Database Configuration

#### `DATABASE_URL` (Required)
PostgreSQL connection string.

**Format**: `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`

**Examples**:
- Local: `postgresql://postgres:postgres@localhost:5432/vegshop?schema=public`
- Docker: `postgresql://vegshop:vegshop123@postgres:5432/vegshop?schema=public`
- Production: `postgresql://user:pass@db.example.com:5432/vegshop?schema=public`

### JWT Authentication

#### `JWT_SECRET` (Required)
Secret key for signing JWT access tokens. Must be at least 32 characters.

**Generate**: `openssl rand -base64 32`

**Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

#### `JWT_ACCESS_EXPIRY` (Optional, Default: "15m")
Access token expiration time.

**Format**: Time string (e.g., "15m", "1h", "2d")

#### `JWT_REFRESH_EXPIRY` (Optional, Default: "7d")
Refresh token expiration time.

**Format**: Time string (e.g., "7d", "30d")

### Server Configuration

#### `PORT` (Optional, Default: 3000)
Port the backend server listens on.

**Example**: `3000`

#### `NODE_ENV` (Optional, Default: "development")
Node environment mode.

**Values**: `development`, `production`, `test`

#### `CORS_ORIGIN` (Optional, Default: "http://localhost:5173")
Allowed CORS origins (comma-separated for multiple).

**Examples**:
- Single: `http://localhost:5173`
- Multiple: `http://localhost:5173,https://yourdomain.com`

### WhatsApp Business API

#### `WHATSAPP_API_URL` (Optional)
WhatsApp Business API endpoint URL.

**Default**: `https://graph.facebook.com/v18.0`

**Documentation**: https://developers.facebook.com/docs/whatsapp/cloud-api

#### `WHATSAPP_API_TOKEN` (Optional)
WhatsApp Business API access token.

**Get from**: Facebook Developer Console > WhatsApp > API Setup

#### `WHATSAPP_PHONE_NUMBER_ID` (Optional)
WhatsApp Phone Number ID for sending messages.

**Get from**: Facebook Developer Console > WhatsApp > API Setup

### Email Service (SendGrid)

#### `SENDGRID_API_KEY` (Optional)
SendGrid API key for sending emails.

**Get from**: https://app.sendgrid.com/settings/api_keys

#### `SENDGRID_FROM_EMAIL` (Optional)
Verified sender email address.

**Must be verified in SendGrid**: https://app.sendgrid.com/settings/sender_auth

**Example**: `noreply@yourdomain.com`

### File Storage

#### `FILE_STORAGE_PATH` (Optional, Default: "./uploads")
Local file storage path for uploads (PDFs, images).

**Note**: For production, consider using cloud storage (AWS S3, Google Cloud Storage)

### Rate Limiting

#### `RATE_LIMIT_VERIFICATION_CODES` (Optional, Default: 3)
Maximum verification codes per hour per contact.

#### `RATE_LIMIT_API_REQUESTS` (Optional, Default: 100)
Maximum API requests per minute per user.

#### `RATE_LIMIT_LOGIN_ATTEMPTS` (Optional, Default: 5)
Maximum login attempts per hour per contact.

## Frontend Environment Variables

### `VITE_API_URL` (Required)
Backend API URL.

**Examples**:
- Development: `http://localhost:3000`
- Production: `https://api.yourdomain.com`

### `VITE_APP_NAME` (Optional, Default: "Organic Veg Shop")
Application name displayed in the UI.

### `VITE_DEBUG` (Optional, Default: false)
Enable debug mode (shows additional logging in console).

**Values**: `true`, `false`

## Environment Validation

The backend automatically validates all required environment variables on startup using Zod schema validation.

If validation fails, the application will:
1. Print detailed error messages
2. Exit with code 1

**Example error output**:
```
❌ Environment validation failed:
  - DATABASE_URL: Required
  - JWT_SECRET: String must contain at least 32 character(s)
```

## Security Best Practices

### Development
- Use weak credentials for local development
- Keep `.env` files out of version control (already in `.gitignore`)
- Use test/sandbox credentials for external services

### Production
- **NEVER** use default or example credentials
- Generate strong random secrets: `openssl rand -base64 32`
- Use managed database services (AWS RDS, DigitalOcean Managed Databases)
- Store secrets in secure vaults (AWS Secrets Manager, HashiCorp Vault)
- Use environment variables in deployment platforms (Heroku, Vercel, etc.)
- Rotate secrets regularly
- Limit access to production environment variables

## Docker Environment Variables

When using Docker Compose, environment variables can be:
1. Defined in `.env` file in the project root
2. Passed through `docker-compose.yml`
3. Overridden with `docker-compose.override.yml`

**Example** (`.env` for Docker):
```env
POSTGRES_USER=vegshop
POSTGRES_PASSWORD=vegshop123
POSTGRES_DB=vegshop
JWT_SECRET=your-secret-key
```

## Troubleshooting

### "Environment validation failed"
- Check that all required variables are set
- Verify variable names match exactly (case-sensitive)
- Ensure `.env` file is in the correct directory

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check that PostgreSQL is running
- Ensure database exists
- Verify network connectivity

### "CORS error in browser"
- Check `CORS_ORIGIN` matches your frontend URL
- Include protocol (http/https) in the URL
- For multiple origins, use comma separation

### "WhatsApp/Email not sending"
- Verify API keys are correct
- Check that services are enabled in their respective dashboards
- Review service-specific logs for errors
- Ensure phone numbers/emails are in correct format

## Additional Resources

- [Prisma Environment Variables](https://www.prisma.io/docs/guides/development-environment/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [SendGrid API](https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/authentication)
