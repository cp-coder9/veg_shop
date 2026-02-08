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

### PHP Backend + Vite Frontend

```bash
# Clone the repository
git clone <repository-url>
cd organic-veg-order-management

# Start the PHP API
cd backend-php
composer install
php -S localhost:3000 -t public
```

In another terminal, run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/health

See [SETUP_PHP.md](./SETUP_PHP.md) for shared hosting setup.

## 📁 Project Structure

```
.
├── backend-php/             # PHP 8.1+ REST API
│   ├── public/             # Web root
│   ├── src/                # Controllers, services, middleware
│   ├── database/           # MySQL schema
│   ├── tests/              # PHPUnit tests
│   └── composer.json
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
└── .env.example           # Environment template
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: PHP 8.1+
- **Database**: MySQL 5.7+/MariaDB 10.3+
- **Authentication**: JWT with verification codes
- **Validation**: Request validation utilities
- **PDF Generation**: TCPDF (via Composer)
- **Testing**: PHPUnit

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand + React Query
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Web Server**: Apache/Nginx (shared hosting friendly)
- **External APIs**: WhatsApp Business API, SendGrid

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Local development overview
- **[PHP Backend Guide](./backend-php/README.md)** - PHP API structure and setup
- **[Shared Hosting Setup](./SETUP_PHP.md)** - PHP + MySQL deployment instructions
- **[Requirements](./kiro/specs/organic-veg-order-management/requirements.md)** - System requirements
- **[Design Document](./.kiro/specs/organic-veg-order-management/design.md)** - Architecture and design
- **[Implementation Tasks](./.kiro/specs/organic-veg-order-management/tasks.md)** - Development task list

## 🔧 Development

### Prerequisites
- PHP 8.1+ with MySQL (for the API)
- Node.js 20+ (for the frontend build/dev server)

### Environment Variables

Copy the example files and configure:

```bash
# Backend
cd backend-php
cp .env.example .env

# Frontend  
cd frontend
cp .env.development .env
```

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for all configuration options.

### Database Setup

```bash
cd backend-php
mysql -u root -p veg_shop < database/schema.sql
```

### Running Development Servers

```bash
# Backend (terminal 1)
cd backend-php
php -S localhost:3000 -t public

# Frontend (terminal 2)
cd frontend
npm run dev
```

## 📋 Available Scripts

### Root
- `npm run dev` - Run the frontend
- `npm run build` - Build the frontend
- `npm run lint` - Lint the frontend workspace
- `npm run format` - Format code with Prettier

### Backend (PHP)
- `composer install` - Install dependencies
- `php -S localhost:3000 -t public` - Run the API locally
- `vendor/bin/phpunit` - Run backend tests

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests

## 🧪 Testing

```bash
# Backend tests
cd backend-php
vendor/bin/phpunit

# Frontend tests
cd frontend
npm run test
```

## 🚢 Production Deployment

See [SETUP_PHP.md](./SETUP_PHP.md) for shared hosting deployment instructions.

## 🔐 Security

- JWT-based authentication with short-lived tokens
- Verification code authentication (WhatsApp/Email)
- Rate limiting on sensitive endpoints
- Input validation with Zod
- SQL injection prevention via parameterized queries
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
3. Review server error logs
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
