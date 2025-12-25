# Quick Start Guide

Get the Organic Vegetable Order Management System running in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Git installed

## Steps

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd organic-veg-order-management
```

### 2. Start with Docker Compose

```bash
docker-compose up
```

This command will:
- Start PostgreSQL database
- Start backend API on port 3000
- Start frontend on port 5173
- Automatically run database migrations

### 3. Seed the Database

In a new terminal:

```bash
docker-compose exec backend npm run prisma:seed
```

This creates:
- Admin user: `admin@organicveg.com` / `+27123456789`
- 3 sample customers
- 40+ products across all categories

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

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

1. **Backend**: Edit files in `backend/src/`
   - Changes auto-reload with hot module replacement
   
2. **Frontend**: Edit files in `frontend/src/`
   - Changes auto-reload in browser

3. **Database Schema**: Edit `backend/prisma/schema.prisma`
   ```bash
   docker-compose exec backend npx prisma migrate dev --name your_migration_name
   ```

## Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

## Troubleshooting

### Port Already in Use

If ports 3000 or 5173 are already in use:

```bash
# Edit docker-compose.yml and change port mappings
# For example, change "3000:3000" to "3001:3000"
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Seed Script Fails

```bash
# Ensure migrations are run first
docker-compose exec backend npx prisma migrate dev

# Then run seed
docker-compose exec backend npm run prisma:seed
```

## Documentation

- **Full Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Environment Configuration**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **Database Seeding**: [backend/prisma/README.md](./backend/prisma/README.md)
- **Requirements**: [.kiro/specs/organic-veg-order-management/requirements.md](.kiro/specs/organic-veg-order-management/requirements.md)
- **Design**: [.kiro/specs/organic-veg-order-management/design.md](.kiro/specs/organic-veg-order-management/design.md)

## Need Help?

1. Check the logs: `docker-compose logs`
2. Review the documentation above
3. Check for error messages in the terminal
4. Ensure all prerequisites are installed

## Production Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Key steps:
1. Set up production environment variables
2. Use managed PostgreSQL database
3. Configure WhatsApp and SendGrid APIs
4. Deploy with `docker-compose -f docker-compose.prod.yml up -d`
