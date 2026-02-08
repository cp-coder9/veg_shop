# Quick Start Guide

Get the Organic Vegetable Order Management System running locally with the PHP backend.

## Prerequisites

- PHP 8.1+ and MySQL 5.7+ (or MariaDB 10.3+)
- Composer
- Node.js 20+ (for the frontend)

## Steps

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd organic-veg-order-management
```

### 2. Set Up the Database

```bash
cd backend-php
mysql -u root -p veg_shop < database/schema.sql
```

### 3. Start the Backend API

```bash
cd backend-php
composer install
php -S localhost:3000 -t public
```

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/health

### 5. Login

**Admin Dashboard**:
- Email: `admin@organicveg.com`
- Phone: `+27123456789`
- Use verification code authentication

**Customer App**:
- Use any of the sample customer emails:
  - `john.doe@example.com`
  - `jane.smith@example.com`
  - `mike.johnson@example.com`

## What's Next?

### Explore the Admin Dashboard

1. **Products**: View and manage the product catalog
2. **Orders**: See customer orders and generate bulk orders
3. **Invoices**: Generate invoices with automatic credit application
4. **Payments**: Record payments and manage credits
5. **Reports**: View sales, payment, and customer reports

### Place a Customer Order

1. Login as a customer
2. Browse products by category
3. Add items to cart
4. Select delivery date (Mon/Wed/Fri)
5. Submit order

### Development

To make code changes:

1. **Backend**: Edit files in `backend-php/src/`
2. **Frontend**: Edit files in `frontend/src/`
3. **Database Schema**: Update `backend-php/database/schema.sql` and re-import as needed

## Troubleshooting

### Port Already in Use

If ports 3000 or 5173 are already in use, stop the other process or choose another port.

## Documentation

- **Shared Hosting Setup**: [SETUP_PHP.md](./SETUP_PHP.md)
- **Environment Configuration**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **PHP Backend**: [backend-php/README.md](./backend-php/README.md)
- **Requirements**: [.kiro/specs/organic-veg-order-management/requirements.md](.kiro/specs/organic-veg-order-management/requirements.md)
- **Design**: [.kiro/specs/organic-veg-order-management/design.md](.kiro/specs/organic-veg-order-management/design.md)

## Need Help?

1. Check the PHP/Apache/Nginx logs
2. Review the documentation above
3. Check for error messages in the terminal
4. Ensure all prerequisites are installed

## Production Deployment

For production deployment instructions, see [SETUP_PHP.md](./SETUP_PHP.md).
