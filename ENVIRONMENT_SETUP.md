# Environment Configuration Guide

This guide explains how to configure environment variables for the PHP backend and React frontend.

## Quick Start

### Backend (PHP)

```bash
cd backend-php
cp .env.example .env
```

Update the database credentials and security values in `backend-php/.env`:

```ini
DB_HOST=localhost
DB_PORT=3306
DB_NAME=veg_shop
DB_USER=your_db_user
DB_PASS=your_db_password

JWT_SECRET=replace-with-long-random-string
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:3000

CORS_ORIGIN=http://localhost:5173
```

### Frontend (Vite)

Create `frontend/.env` if needed:

```bash
cd frontend
cp .env.development .env
```

Set the API URL for the PHP backend:

```env
VITE_API_URL=http://localhost:3000/api
```

## Environment Variables

### Backend (`backend-php/.env`)

| Variable | Description | Example |
| --- | --- | --- |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `veg_shop` |
| `DB_USER` | Database user | `veg_shop_user` |
| `DB_PASS` | Database password | `strong-password` |
| `JWT_SECRET` | JWT signing secret | long random string |
| `JWT_ACCESS_EXPIRY` | Access token TTL (seconds) | `900` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL (seconds) | `604800` |
| `APP_ENV` | Environment name | `development` |
| `APP_DEBUG` | Debug output | `true` |
| `APP_URL` | API base URL | `http://localhost:3000` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:5173` |
| `RATE_LIMIT_REQUESTS` | Rate limit count | `100` |
| `RATE_LIMIT_WINDOW` | Rate limit window (seconds) | `60` |
| `UPLOAD_MAX_SIZE` | Upload size limit (bytes) | `10485760` |
| `UPLOAD_ALLOWED_TYPES` | Allowed MIME types | `image/jpeg,image/png` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_API_URL` | Backend API base URL | `https://your-domain.com/api` |

## External Services

Configure these in `backend-php/.env` if you use them:

- `WHATSAPP_API_URL`
- `WHATSAPP_API_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`

## Security Best Practices

- Use a strong `JWT_SECRET` (32+ characters).
- Disable `APP_DEBUG` in production.
- Lock `CORS_ORIGIN` to your frontend domain.
- Keep database credentials in server-side environment variables only.

## Troubleshooting

- **CORS errors**: ensure `CORS_ORIGIN` matches your frontend URL.
- **Database connection failures**: verify credentials and MySQL user permissions.
- **File upload failures**: check `UPLOAD_MAX_SIZE` and PHP `upload_max_filesize` settings.

For shared hosting setup steps, see [SETUP_PHP.md](./SETUP_PHP.md).
