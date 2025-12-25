# Deployment Guide

This guide covers deploying the Organic Vegetable Order Management System to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [Platform-Specific Guides](#platform-specific-guides)

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (local or managed service)
- Node.js 20+ (for local development)
- WhatsApp Business API credentials (production)
- SendGrid account and API key (production)

## Local Development

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd organic-veg-order-management
   ```

2. **Start all services**
   ```bash
   docker-compose up
   ```

   This starts:
   - PostgreSQL database on port 5432
   - Backend API on port 3000
   - Frontend on port 5173

3. **Run database migrations and seed**
   ```bash
   # In a new terminal
   docker-compose exec backend npx prisma migrate dev
   docker-compose exec backend npm run prisma:seed
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Health: http://localhost:3000/health

### Without Docker

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cd backend
   cp .env.development .env
   
   # Frontend
   cd ../frontend
   cp .env.development .env
   ```

3. **Start PostgreSQL**
   ```bash
   # Using Docker
   docker run -d \
     --name postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=organic_veg_db \
     -p 5432:5432 \
     postgres:16-alpine
   
   # Or use local PostgreSQL installation
   ```

4. **Run migrations and seed**
   ```bash
   cd backend
   npx prisma migrate dev
   npm run prisma:seed
   ```

5. **Start development servers**
   ```bash
   # Backend (in one terminal)
   cd backend
   npm run dev
   
   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

## Production Deployment

### Step 1: Prepare Environment

1. **Create production environment files**
   ```bash
   # Root .env for Docker Compose
   cp .env.example .env
   
   # Backend
   cd backend
   cp .env.production .env
   
   # Frontend
   cd ../frontend
   cp .env.production .env
   ```

2. **Update environment variables**
   
   Edit `.env` files with production values:
   - Strong JWT secret (generate with `openssl rand -base64 32`)
   - Production database URL
   - WhatsApp API credentials
   - SendGrid API key
   - Production frontend URL

   See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed configuration.

### Step 2: Build Docker Images

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build
```

### Step 3: Deploy Database

1. **Set up managed PostgreSQL** (recommended)
   - DigitalOcean Managed Database
   - AWS RDS
   - Google Cloud SQL
   - Heroku Postgres

2. **Update DATABASE_URL** in backend `.env`
   ```bash
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```

3. **Run migrations**
   ```bash
   # If using Docker
   docker-compose -f docker-compose.prod.yml run backend npx prisma migrate deploy
   
   # Or locally
   cd backend
   npx prisma migrate deploy
   ```

4. **Seed initial data** (optional)
   ```bash
   docker-compose -f docker-compose.prod.yml run backend npm run prisma:seed
   ```

### Step 4: Start Production Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Step 5: Verify Deployment

1. **Check service health**
   ```bash
   # Check running containers
   docker-compose -f docker-compose.prod.yml ps
   
   # Check backend health
   curl http://localhost:3000/health
   
   # Check frontend
   curl http://localhost:80
   ```

2. **Check logs**
   ```bash
   # All services
   docker-compose -f docker-compose.prod.yml logs
   
   # Specific service
   docker-compose -f docker-compose.prod.yml logs backend
   docker-compose -f docker-compose.prod.yml logs frontend
   ```

3. **Test login**
   - Navigate to your frontend URL
   - Try logging in with admin credentials
   - Verify you can access the admin dashboard

## Database Setup

### Initial Migration

```bash
cd backend
npx prisma migrate deploy
```

### Seed Database

```bash
cd backend
npm run prisma:seed
```

This creates:
- 1 admin user (admin@organicveg.com)
- 3 sample customers
- 40+ products across all categories

See [backend/prisma/README.md](./backend/prisma/README.md) for details.

### Database Backups

**Automated backups** (recommended):
- Use managed database service with automatic backups
- DigitalOcean: Daily backups included
- AWS RDS: Automated backups with point-in-time recovery

**Manual backup**:
```bash
# Backup
docker-compose exec postgres pg_dump -U postgres organic_veg_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres organic_veg_db < backup.sql
```

## Environment Variables

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for comprehensive guide.

### Critical Production Variables

**Backend**:
- `DATABASE_URL` - Production database connection
- `JWT_SECRET` - Strong random secret (min 32 chars)
- `WHATSAPP_API_TOKEN` - WhatsApp Business API token
- `SENDGRID_API_KEY` - SendGrid API key
- `NODE_ENV=production`

**Frontend**:
- `VITE_API_URL` - Production backend URL

### Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Database uses SSL (`sslmode=require`)
- [ ] API keys are not committed to git
- [ ] CORS_ORIGIN is set to production domain
- [ ] Rate limiting is enabled
- [ ] File uploads directory has proper permissions

## Docker Deployment

### Development

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build
```

### Production

```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update and restart
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Useful Commands

```bash
# Execute command in container
docker-compose exec backend npm run prisma:seed

# Access container shell
docker-compose exec backend sh

# View container logs
docker-compose logs -f backend

# Restart specific service
docker-compose restart backend

# Remove all containers and volumes
docker-compose down -v
```

## Platform-Specific Guides

### DigitalOcean App Platform

1. **Create new app**
   - Connect GitHub repository
   - Select branch (main/production)

2. **Configure services**
   
   **Backend**:
   - Type: Web Service
   - Build Command: `cd backend && npm install && npm run build`
   - Run Command: `cd backend && npm start`
   - Port: 3000
   
   **Frontend**:
   - Type: Static Site
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`

3. **Add database**
   - Create Managed PostgreSQL database
   - Add DATABASE_URL to backend environment variables

4. **Set environment variables**
   - Add all required variables from `.env.production`
   - Use App Platform's encrypted environment variables

5. **Deploy**
   - Click "Deploy"
   - Monitor build logs

### Heroku

1. **Create apps**
   ```bash
   heroku create organic-veg-backend
   heroku create organic-veg-frontend
   ```

2. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini -a organic-veg-backend
   ```

3. **Set environment variables**
   ```bash
   heroku config:set JWT_SECRET=your_secret -a organic-veg-backend
   heroku config:set WHATSAPP_API_TOKEN=your_token -a organic-veg-backend
   # ... other variables
   ```

4. **Deploy**
   ```bash
   # Backend
   git subtree push --prefix backend heroku-backend main
   
   # Frontend
   git subtree push --prefix frontend heroku-frontend main
   ```

### AWS (EC2 + RDS)

1. **Set up RDS PostgreSQL**
   - Create RDS instance
   - Configure security groups
   - Note connection details

2. **Launch EC2 instance**
   - Ubuntu 22.04 LTS
   - Install Docker and Docker Compose
   - Configure security groups (ports 80, 443, 22)

3. **Deploy application**
   ```bash
   # SSH to EC2
   ssh ubuntu@your-ec2-ip
   
   # Clone repository
   git clone <repository-url>
   cd organic-veg-order-management
   
   # Set up environment
   cp .env.example .env
   # Edit .env with production values
   
   # Deploy
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Set up SSL with Let's Encrypt**
   ```bash
   # Install certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get certificate
   sudo certbot --nginx -d yourdomain.com
   ```

### Vercel (Frontend Only)

1. **Import project**
   - Connect GitHub repository
   - Select frontend directory

2. **Configure build**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set environment variables**
   - Add `VITE_API_URL` with backend URL

4. **Deploy**
   - Automatic deployment on git push

## Monitoring and Maintenance

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Logs

```bash
# Docker logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Database Maintenance

```bash
# Connect to database
docker-compose exec postgres psql -U postgres organic_veg_db

# Check database size
SELECT pg_size_pretty(pg_database_size('organic_veg_db'));

# Vacuum database
VACUUM ANALYZE;
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run new migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check environment variables
docker-compose exec backend env

# Restart container
docker-compose restart backend
```

### Database connection issues

```bash
# Test database connection
docker-compose exec backend npx prisma db pull

# Check PostgreSQL is running
docker-compose ps postgres

# Check DATABASE_URL
docker-compose exec backend echo $DATABASE_URL
```

### Frontend can't connect to backend

1. Check VITE_API_URL in frontend
2. Check CORS_ORIGIN in backend
3. Verify backend is accessible
4. Check network/firewall rules

## Rollback

```bash
# Rollback to previous version
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d --build

# Rollback database migration
cd backend
npx prisma migrate resolve --rolled-back <migration-name>
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
3. Check [backend/prisma/README.md](./backend/prisma/README.md)
4. Review error messages and stack traces
