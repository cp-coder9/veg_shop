# Deployment Guide (PHP Backend)

This project now uses a PHP 8.1+ backend suitable for shared hosting environments. For step-by-step shared hosting instructions, follow [SETUP_PHP.md](./SETUP_PHP.md).

## Recommended Production Flow

1. **Prepare the database**
   - Create a MySQL database and user in your hosting control panel.
   - Import `backend-php/database/schema.sql` using phpMyAdmin or the CLI.

2. **Deploy the PHP API**
   - Upload the `backend-php` directory to your server.
   - Run `composer install --no-dev --optimize-autoloader`.
   - Point your document root to `backend-php/public`.
   - Configure `backend-php/.env` with production credentials.

3. **Deploy the Frontend**
   - Set `VITE_API_URL` to your API URL (e.g., `https://example.com/api`).
   - Run `npm run build` in `frontend/`.
   - Upload the `frontend/dist` contents to your public web root.

4. **Verify**
   - Visit `/api/health` on the API domain.
   - Log in and load products in the web app.

## Notes

- Use HTTPS in production for all domains.
- Ensure `.htaccess` is enabled if you are using Apache.
- For troubleshooting and configuration, see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md).
