# Organic Vegetable Order Management System - Technical Overview

## 1. Tech Stack

### Backend
- **Runtime**: Node.js 20 + Express.js
- **Language**: TypeScript (ES modules)
- **Database ORM**: Prisma v7.3.0
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod schemas
- **PDF Generation**: PDFKit
- **Testing**: Vitest
- **External APIs**: Firebase Admin, Axios, node-cron

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand + React Query (@tanstack/react-query)
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library
- **Icons**: Lucide React

---

## 2. Data Storage & Database

The application uses **SQLite** (file-based) with **Prisma ORM** for data access.

### Configuration
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

- **Database File**: `backend/dev.db` (SQLite file-based)
- **Note**: The original specification mentioned PostgreSQL 16, but the current implementation uses SQLite for development simplicity and for production, stored on Firebase

---

## 3. Repository Setup

Yes, a **Repository Pattern** has been implemented. The repositories are located in `backend/src/repositories/`:

| Repository | Purpose |
|------------|---------|
| `user.repository.ts` | User/Customer data access |
| `product.repository.ts` | Product catalog data access |
| `order.repository.ts` | Order management |
| `invoice.repository.ts` | Invoice operations |
| `payment.repository.ts` | Payment tracking |
| `credit.repository.ts` | Credit management |
| `supplier.repository.ts` | Supplier data |
| `product-category.repository.ts` | Category management |
| `notification.repository.ts` | Notification tracking |
| `audit-log.repository.ts` | Audit trail |
| `price-history.repository.ts` | Price tracking |
| `verification-code.repository.ts` | Auth codes |
| `order-item.repository.ts` | Order items |

---

## 4. Product Setup with Identifier Fields

Products have specific identifier fields for **Supplier**, **Category**, and **Storage Type**.

### Product Model
```prisma
model Product {
  id          String    @id @default(cuid())
  name        String    @unique
  price       Decimal 
  category    String                     // Category identifier (String key)
  unit        String
  description String?
  imageUrl    String?
  isAvailable Boolean  @default(true)
  isSeasonal  Boolean  @default(false)
  packingType String   @default("box")  // Storage Type: "box", "bag", "fridge", "freezer"
  deliveryDay String?                   // Delivery day for the product
  supplierId  String?                   // Supplier identifier
  supplier    Supplier? @relation(fields: [supplierId], references: [id])
  
  categoryRef   ProductCategory? @relation(fields: [category], references: [key])
  orderItems    OrderItem[]
  priceHistory  PriceHistory[]
}
```

### Related Models

**Supplier**
```prisma
model Supplier {
  id          String    @id @default(cuid())
  name        String    @unique
  contactInfo String?
  isAvailable Boolean   @default(true)
  products    Product[]
}
```

**ProductCategory**
```prisma
model ProductCategory {
  id          String    @id @default(uuid())
  key         String    @unique      // Category key (e.g., "vegetables", "fruits")
  label       String
  description String?
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  products    Product[]
}
```

### Summary of Product Identifier Fields

| Field | Type | Description |
|-------|------|-------------|
| `supplierId` | String (UUID) | Foreign key linking to `Supplier` model |
| `category` | String | Category key linking to `ProductCategory` via `categoryRef` relation |
| `packingType` | String | Storage type with values: `"box"`, `"bag"`, `"fridge"`, `"freezer"` |

---

## Database Schema Overview

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
- **Supplier**: Supplier information
- **ProductCategory**: Product categories

### Key Relationships
- Users have many Orders, Invoices, Payments, Credits
- Orders have many OrderItems, one Invoice
- Invoices have many Payments, belong to User and Order
- Products have PriceHistory for tracking price changes
- Products link to Supplier and ProductCategory
