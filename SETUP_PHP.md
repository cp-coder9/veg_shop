# Setup Guide: Veg Shop PHP + MySQL Migration

This guide details how to set up the new PHP backend on a shared hosting environment (or local LAMP stack).

## Prerequisites

Ensure your hosting environment provides:
- **PHP 8.1** or higher
- **MySQL 5.7+** or MariaDB 10.3+
- **Apache Web Server**
- **Composer** (dependency manager)
- **SSH Access** (recommended for running commands)

## Step 1: Database Setup

1. Log in to your hosting control panel (cPanel, Plesk, etc.).
2. Creating a new MySQL database (e.g., `veg_shop_new`).
3. Create a database user and assign it to the database with all privileges.
4. Import the schema:
   - Use phpMyAdmin to import `backend-php/database/schema.sql`
   - OR use command line:
     ```bash
     mysql -u db_user -p veg_shop_new < backend-php/database/schema.sql
     ```

## Step 2: Backend Deployment

1. **Upload Files**:
   - Upload the contents of `backend-php` to a folder on your server (e.g., `public_html/api` or a private folder like `~/apps/veg_shop_api`).
   - If placing outside public root (recommended), ensure `public/` is the only accessible directory.

2. **Install Dependencies**:
   - SSH into your server and navigate to the project folder.
   - Run: `composer install --no-dev --optimize-autoloader`
   - *Note: If you can't run Composer on the server, run `composer install` locally and upload the `vendor/` directory.*

3. **Configuration**:
   - Rename `.env.example` to `.env`.
   - Edit `.env` with your database credentials and settings:
     ```ini
     DB_HOST=localhost
     DB_NAME=veg_shop_new
     DB_USER=your_db_user
     DB_PASS=your_db_password
     JWT_SECRET=generate-a-long-random-string
     APP_URL=https://yourdomain.com
     CORS_ORIGIN=https://yourdomain.com
     ```

4. **Web Server Config**:
   - Point your domain/subdomain document root to the `public/` directory.
   - Ensure the `.htaccess` file in `public/` is processed (AllowOverride All).

## Step 3: Frontend Update

The frontend needs to point to the new PHP API URL.

1. Open `frontend/.env.production` (or create it).
2. Set the API URL:
   ```env
   VITE_API_URL=https://your-php-api-domain.com/api
   ```
3. Rebuild the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
4. Upload the `frontend/dist` folder contents to your public web root.

## Step 4: Verification

1. **Test API**:
   - Visit `https://your-php-api-domain.com/api/health`
   - You should see: `{"success":true,"data":{"status":"ok",...}}`

2. **Test Frontend**:
   - Open your website.
   - Login (or register a new account).
   - Check if products load.

## Troubleshooting

- **500 Internal Server Error**: Check `server_error.log` or your hosting error logs.
- **404 Not Found**: Ensure `.htaccess` is working and `mod_rewrite` is enabled.
- **CORS Errors**: Check `CORS_ORIGIN` in `.env` matches your frontend URL exactly.
- **Database Connection**: Verify credentials in `.env` and that the user has permissions.

## Data Migration (Optional)

If you have existing data in SQLite, a custom migration script will be needed to export from SQLite and import into MySQL mapped to the new schema. 
