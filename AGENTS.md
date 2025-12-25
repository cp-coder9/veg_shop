# Organic Vegetable Order Management System - Agent Guide

## Project Overview

This is a full-stack web application for managing organic vegetable orders, invoicing, payments, and customer relationships. Built for small organic produce businesses handling 30-80 customers and 600-800 product orders weekly.

**Key Features:**
- Customer order placement with mobile-responsive interface
- Admin dashboard for order processing and management
- Automated invoice generation with credit application
- Multi-method payment tracking (Cash, Yoco, EFT)
- WhatsApp and email notifications
- Sales, payment, and customer reports
- Short delivery credit management

## Technology Stack

### Backend
- **Runtime**: Node.js 20 + Express.js
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Authentication**: JWT with verification codes (WhatsApp/Email)
- **Validation**: Zod schemas
- **PDF Generation**: PDFKit
- **Testing**: Vitest
- **External APIs**: WhatsApp Business API, SendGrid

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand stores + React Query
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Database**: SQLite (file-based, no server needed)
- **Package Manager**: npm with workspaces

## Project Structure

```
.
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Environment validation (env.ts)
│   │   ├── routes/         # API endpoints (auth, products, orders, etc.)
│   │   ├── services/       # Business logic layer
│   │   ├── repositories/   # Data access layer
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── lib/            # Utilities (PDF generator, Prisma client)
│   │   └── tests/          # Service tests
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── seed.ts         # Database seeding script
│   │   └── migrations/     # Database migrations
│   └── package.json
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components (customer + admin)
│   │   ├── hooks/          # React Query custom hooks
│   │   ├── stores/         # Zustand state stores
│   │   ├── lib/            # API client, utilities
│   │   └── test/           # Test utilities
│   └── package.json
├── .env.example           # Environment variables template
└── package.json           # Root workspace configuration
```

## Database Schema

### Core Models
- **User**: Customers and admin users (phone/email auth)
- **Product**: Product catalog with categories, pricing, availability
- **Order**: Customer orders with delivery scheduling
- **OrderItem**: Individual products in orders
- **Invoice**: Automated invoice generation with credit application
- **Payment**: Multi-method payment tracking
- **Credit**: Customer credit management for short deliveries
- **Notification**: WhatsApp/email notification tracking
- **VerificationCode**: Auth verification codes
- **AuditLog**: System audit trail

### Key Relationships
- Users have many Orders, Invoices, Payments, Credits
- Orders have many OrderItems, one Invoice
- Invoices have many Payments, belong to User and Order
- Products have PriceHistory for tracking price changes

## Development Commands

### Root Level
```bash
# Install all dependencies
npm install

# Run both frontend and backend in development
npm run dev

# Build both projects
npm run build

# Lint all workspaces
npm run lint

# Format code with Prettier
npm run format
```

### Backend
```bash
cd backend

# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm run start

# Database operations
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations
npm run prisma:seed        # Seed database
npm run prisma:studio      # Open Prisma Studio GUI

# Testing
npm run test              # Run tests once
npm run test:watch        # Watch mode
```

### Frontend
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Testing
npm run test              # Run tests
npm run test:ui          # Run tests with UI
```

### Database Commands (SQLite)
```bash
# Push schema to database
cd backend && npx prisma db push

# Seed database
npm run prisma:seed

# View database in Prisma Studio
cd backend && npx prisma studio
```

## Environment Configuration

### Backend Environment Variables (.env in backend/)
```bash
# Database (SQLite file-based)
DATABASE_URL=file:./dev.db

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# External APIs
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@organicveg.com

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
FILE_STORAGE_PATH=./uploads
```

### Frontend Environment Variables (.env in frontend/)
```bash
VITE_API_URL=http://localhost:3000
```

## Testing Strategy

### Backend Tests (97% passing - 128/132)
- **Service Layer**: Comprehensive business logic testing
- **Security**: JWT auth, rate limiting, input validation
- **Known Issues**: 4 minor test assertion failures (functionality works)

### Frontend Tests (95% passing - 83/87)
- **Component Tests**: React Testing Library
- **Page Tests**: User interaction flows
- **Store Tests**: Zustand state management
- **Known Issues**: 4 login page tests missing mocks

### Test Commands
```bash
# Backend
cd backend && npm run test

# Frontend
cd frontend && npm run test

# In Docker
docker-compose exec backend npm run test
docker-compose exec frontend npm run test
```

## Authentication System

### Verification Code Flow
1. User enters phone/email on login page
2. System generates 6-digit code, sends via WhatsApp/email
3. User enters code on verification page
4. System validates code, issues JWT tokens
5. Access token (15min) + Refresh token (7 days)

### JWT Implementation
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Token refresh endpoint for seamless UX
- Role-based access control (admin/customer)

## API Architecture

### Route Structure
```
/api/auth/*           # Authentication endpoints
/api/products/*       # Product catalog
/api/orders/*         # Order management
/api/invoices/*       # Invoice generation
/api/payments/*       # Payment tracking
/api/credits/*        # Credit management
/api/packing-lists/*  # Packing list generation
/api/notifications/*  # Notification management
/api/reports/*        # Business reports
/api/customers/*      # Customer management
/api/audit-logs/*     # Audit trail
```

### Middleware Stack
- **CORS**: Configured per environment
- **Rate Limiting**: Express-rate-limit on API routes
- **Auth**: JWT verification middleware
- **Validation**: Zod schema validation
- **Audit**: Automatic audit logging

## Development Setup

### Prerequisites
- Node.js 20+
- npm

### Running Locally
1. Install dependencies: `npm install`
2. Setup backend environment: Copy `backend/.env.example` to `backend/.env`
3. Create database: `cd backend && npx prisma db push`
4. Seed database: `npm run prisma:seed`
5. Start development servers: `npm run dev` (runs both frontend and backend)
6. Access at http://localhost:5173

### Production Deployment
- **Vercel/Netlify**: Frontend (static build)
- **Railway/Render**: Backend API with PostgreSQL
- **Note**: For production, migrate back to PostgreSQL for better performance and features

## Code Style Guidelines

### TypeScript Configuration
- **Backend**: ES modules (`"type": "module"`)
- **Frontend**: Vite + TypeScript
- **Strict mode**: Enabled
- **Target**: ES2020+

### Linting & Formatting
- **ESLint**: TypeScript rules for both frontend and backend
- **Prettier**: Consistent code formatting
- **Commands**: `npm run lint`, `npm run format`

### Naming Conventions
- **Files**: kebab-case for routes, camelCase for others
- **Components**: PascalCase (React components)
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase with T prefix (e.g., `TUser`)

## Security Considerations

### Implemented Measures
- JWT-based authentication with short-lived tokens
- Verification code system (no passwords)
- Rate limiting on all API endpoints
- Input validation with Zod schemas
- CORS configuration per environment
- SQL injection prevention via Prisma ORM
- Environment variable validation
- Audit logging for all actions

### Environment-Specific Security
- **Development**: Loose CORS, detailed error messages
- **Production**: Strict CORS, minimal error exposure, SSL required

### Secrets Management
- Never commit `.env` files
- Use strong JWT secrets (min 32 chars)
- Rotate API keys regularly
- Use managed secrets in production

## Database Management

### Migrations
```bash
# Development
cd backend && npx prisma migrate dev

# Production
cd backend && npx prisma migrate deploy
```

### Seeding
- Initial admin: `admin@organicveg.com` / `+27123456789`
- 3 sample customers with realistic data
- 40+ products across 6 categories
- Run with: `npm run prisma:seed`

### Backup & Restore
```bash
# Backup
docker-compose exec postgres pg_dump -U postgres organic_veg_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres organic_veg_db < backup.sql
```

## External Integrations

### WhatsApp Business API
- Send verification codes
- Order notifications
- Invoice notifications
- Configuration: `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

### SendGrid Email
- Verification codes
- Invoice emails
- Configuration: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`

## Troubleshooting

### Common Issues
1. **Database connection**: Check `DATABASE_URL`, ensure PostgreSQL is running
2. **CORS errors**: Verify `CORS_ORIGIN` matches frontend URL
3. **WhatsApp API**: Check token validity and phone number ID
4. **JWT errors**: Ensure `JWT_SECRET` is set and consistent

### Log Locations
- **Backend**: Terminal output (stdout)
- **Frontend**: Browser dev console
- **Database**: SQLite file at `backend/dev.db`

### Health Checks
- Backend: `GET /health` → `{"status":"ok","timestamp":"..."}`
- Frontend: Check root path loads
- Database: `pg_isready` command

## Performance Considerations

### Backend Optimizations
- Prisma query optimization
- Rate limiting prevents abuse
- File upload size limits
- Connection pooling for PostgreSQL

### Frontend Optimizations
- React Query caching
- Code splitting via Vite
- Image optimization
- Minimal bundle size

### Database Optimizations
- Proper indexing (see schema.prisma)
- Foreign key constraints
- Cascading deletes where appropriate
- Regular vacuuming in production
