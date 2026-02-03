# Organic Veg Shop - PHP Backend

This is a **PHP 8.1+ REST API** backed by **MySQL**, replacing the original Node.js backend.

## Requirements

- PHP 8.1 or higher
- MySQL 5.7 or MariaDB 10.3+
- Composer
- Apache (with mod_rewrite enabled) or Nginx

## Installation

1. **Install Dependencies**
   ```bash
   cd backend-php
   composer install
   ```

2. **Database Setup**
   - Create a MySQL database (e.g., `veg_shop`)
   - Import the schema:
     ```bash
     mysql -u root -p veg_shop < database/schema.sql
     ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update database credentials and other settings

4. **Serve**
   - **Local Development**:
     ```bash
     php -S localhost:3000 -t public
     ```
   - **Apache**: Point document root to `public/` directory
   - **Nginx**: Configure standard PHP setup pointing to `public/index.php`

## Project Structure

```
backend-php/
├── public/              # Web root
│   ├── index.php        # Entry point
│   ├── .htaccess        # Apache rules
│   └── uploads/         # User uploads
├── src/
│   ├── Config/          # Database & Env config
│   ├── Controllers/     # API Controllers
│   ├── Core/            # Framework core (Router, Request, Response)
│   ├── Middleware/      # Auth, CORS, RateLimit
│   ├── Services/        # Business logic
│   └── routes.php       # Route definitions
├── database/
│   └── schema.sql       # Database schema
└── vendor/              # Composer packages
```

## API Documentation

The API endpoints mirror the original TypeScript implementation.
Authentication is handled via JWT Bearer tokens.

### Key Endpoints

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/products` - List products
- `POST /api/orders` - Place order
- `GET /api/orders` - List orders

## Migration from Node.js

Warning: This is a complete replacement. Ensure you migrate your data using the provided migration scripts before switching over in production.
