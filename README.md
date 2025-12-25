# Organic Vegetable Order Management System

A comprehensive full-stack web application for managing organic vegetable orders, invoicing, payments, and customer relationships. Built for small organic produce businesses handling 30-80 customers and 600-800 product orders weekly.

## ✨ Features

### Customer Features
- 📱 Mobile-responsive order placement
- 🔐 Secure authentication via WhatsApp/Email verification codes
- 🛒 Shopping cart with product categories
- 📅 Flexible delivery scheduling (Mon/Wed/Fri or collection)
- 📊 Order history and invoice tracking
- 💰 Credit balance management

### Admin Features
- 📦 Product catalog management with categories
- 📋 Order processing and bulk order consolidation
- 🧾 Automated invoice generation with credit application
- 💳 Multi-method payment tracking (Cash, Yoco, EFT)
- 📄 Packing list generation
- 📧 WhatsApp and email notifications
- 📈 Sales, payment, and customer reports
- 🔄 Short delivery credit management

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone and start
git clone <repository-url>
cd organic-veg-order-management
docker-compose up

# In a new terminal, seed the database
docker-compose exec backend npm run prisma:seed
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Admin Login**: admin@organicveg.com / +27123456789

See [QUICK_START.md](./QUICK_START.md) for detailed instructions.

### Manual Setup

See [DEPLOYMENT.md](./DEPLOYMENT.md) for manual installation instructions.

## 📁 Project Structure

```
.
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Environment validation
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access layer
│   │   └── middleware/     # Auth, validation, etc.
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── seed.ts         # Database seeding
│   │   └── migrations/     # Database migrations
│   ├── Dockerfile          # Backend container
│   └── package.json
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # React Query hooks
│   │   ├── stores/        # Zustand stores
│   │   └── lib/           # API client, utilities
│   ├── Dockerfile         # Frontend container
│   ├── nginx.conf         # Nginx configuration
│   └── package.json
├── docker-compose.yml      # Development setup
├── docker-compose.prod.yml # Production setup
└── .env.example           # Environment template
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20 + Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16 + Prisma ORM
- **Authentication**: JWT with verification codes
- **Validation**: Zod
- **PDF Generation**: PDFKit
- **Testing**: Vitest

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand + React Query
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (production)
- **External APIs**: WhatsApp Business API, SendGrid

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get running in 5 minutes
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[Environment Setup](./ENVIRONMENT_SETUP.md)** - Comprehensive environment configuration
- **[Database Seeding](./backend/prisma/README.md)** - Database seed script documentation
- **[Requirements](./kiro/specs/organic-veg-order-management/requirements.md)** - System requirements
- **[Design Document](./.kiro/specs/organic-veg-order-management/design.md)** - Architecture and design
- **[Implementation Tasks](./.kiro/specs/organic-veg-order-management/tasks.md)** - Development task list

## 🔧 Development

### Prerequisites
- Docker and Docker Compose (recommended)
- OR Node.js 20+ and PostgreSQL 16+ (manual setup)

### Environment Variables

Copy the example files and configure:

```bash
# Backend
cd backend
cp .env.development .env

# Frontend  
cd frontend
cp .env.development .env
```

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for all configuration options.

### Database Setup

```bash
# Run migrations
cd backend
npx prisma migrate dev

# Seed initial data
npm run prisma:seed
```

This creates:
- 1 admin user
- 3 sample customers  
- 40+ products across 6 categories

### Running Development Servers

**With Docker**:
```bash
docker-compose up
```

**Without Docker**:
```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

## 📋 Available Scripts

### Root
- `npm run dev` - Run both frontend and backend
- `npm run build` - Build both projects
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript for production
- `npm run start` - Run production build
- `npm run test` - Run tests
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:seed` - Seed database with initial data
- `npm run prisma:studio` - Open Prisma Studio GUI

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests

### Docker
- `docker-compose up` - Start all services (development)
- `docker-compose up -d` - Start in background
- `docker-compose down` - Stop all services
- `docker-compose logs -f` - View logs
- `docker-compose exec backend npm run prisma:seed` - Seed database

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test

# Run tests in Docker
docker-compose exec backend npm run test
docker-compose exec frontend npm run test
```

## 🚢 Production Deployment

### Docker Compose (Recommended)

```bash
# Set up environment
cp .env.example .env
# Edit .env with production values

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Platform-Specific Guides

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions:
- DigitalOcean App Platform
- Heroku
- AWS (EC2 + RDS)
- Vercel (Frontend)

## 🔐 Security

- JWT-based authentication with short-lived tokens
- Verification code authentication (WhatsApp/Email)
- Rate limiting on sensitive endpoints
- Input validation with Zod
- SQL injection prevention via Prisma ORM
- CORS configuration
- Environment variable validation

## 🤝 Contributing

This is a private project. For development:

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

Private - All rights reserved

## 🆘 Support

For issues or questions:
1. Check the [documentation](#-documentation)
2. Review [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
3. Check Docker logs: `docker-compose logs`
4. Review error messages and stack traces

## 🗺️ Roadmap

See [.kiro/specs/organic-veg-order-management/tasks.md](./.kiro/specs/organic-veg-order-management/tasks.md) for implementation status.

Completed features:
- ✅ Authentication system
- ✅ Product management
- ✅ Order processing
- ✅ Invoice generation
- ✅ Payment tracking
- ✅ Notification system
- ✅ Reporting dashboard
- ✅ Customer management
- ✅ Admin dashboard
- ✅ Customer web app
- ✅ Deployment infrastructure

Future enhancements:
- Mobile apps (iOS/Android)
- Inventory management
- Route optimization
- Customer subscriptions
- Loyalty program
