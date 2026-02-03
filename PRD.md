# Product Requirements Document (PRD) - Organic Vegetable Order Management System

## 1. Product Overview
The **Organic Vegetable Order Management System** is a clearer, digital solution for managing orders, inventory, and deliveries for an organic vegetable shop. It replaces manual processes (spreadsheets, WhatsApp messages) with a centralized web application that serves both customers and administrators.

### 1.1 Goals
- **Efficiency**: Automate order collation, invoicing, and packing list generation.
- **Accuracy**: Eliminate errors in pricing, addition, and stock availability.
- **Convenience**: Provide customers with an easy mobile-friendly way to order.
- **Scalability**: Support growth from 30 to 80+ active customers.

## 2. User Roles

### 2.1 Customer
- **Primary Goal**: Conveniently browse produce, place weekly orders, and track payments/credits.
- **Key Interactions**:
    - Browsing the weekly product catalog.
    - Placing orders before the Friday cutoff.
    - Viewing invoices and payment history.
    - Receiving notifications (WhatsApp/Email).

### 2.2 Administrator (Shop Owner)
- **Primary Goal**: Manage the end-to-end weekly sales cycle efficiently.
- **Key Interactions**:
    - Maintaining the product catalog (seasonality, pricing).
    - Processing orders and consolidating them for bulk buying.
    - Generating invoices and packing lists.
    - Recording payments and managing customer credits.

## 3. Support & Service Lifecycle
The business operates on a weekly cycle:
1.  **Tuesday**: Admin updates catalog & broadcasts "Weekly List" to customers.
2.  **Fri (12pm)**: Order Cutoff for customers.
3.  **Friday PM**: Admin generates "Bulk Order" for suppliers.
4.  **Mon/Wed/Fri**: Deliveries & Collections occur. Invoices are generated post-delivery.

## 4. Functional Requirements

### 4.1 Customer Features
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| **C-01** | **Authentication** | Passwordless login via Phone/Email + OTP (One Time Pin). | P0 |
| **C-02** | **Product Catalog** | Browse products by category (Veg, Fruit, Dairy, etc.). View prices, units (kg/bunch), and "Seasonal" indicators. | P0 |
| **C-03** | **Shopping Cart** | Add/Remove items, adjust quantities. | P0 |
| **C-04** | **Checkout** | extensive delivery options (Collection vs Delivery), date selection (Mon/Wed/Fri), special instructions. | P0 |
| **C-05** | **Profile Dashboard** | View current Credit Balance, Order History, and Personal Details. | P1 |
| **C-06** | **Invoices** | View and download PDF invoices. | P1 |

### 4.2 Admin Features
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| **A-01** | **Product Management** | CRUD operations for products. Toggle availability/seasonality. Price history tracking. | P0 |
| **A-02** | **Order Management** | View, Edit, and Status tracking (Pending -> Confirmed -> Delivered). | P0 |
| **A-03** | **Bulk Consolidation** | Generate "Shopping List" for suppliers (Code logic sums all orders + configurable buffer). | P0 |
| **A-04** | **Invoicing Engine** | Auto-generate invoices from delivered orders. Auto-apply existing customer credits. PDF generation. | P0 |
| **A-05** | **Payment Recording** | Record payments (Cash/EFT/Yoco). Auto-calculate "Overpayment" to create Customer Credit. | P0 |
| **A-06** | **Packing Lists** | Generate route-optimized packing lists (PDF) for drivers. | P1 |
| **A-07** | **Reports** | Sales reports, Product popularity, Payment status/Outstanding debt reports. | P2 |
| **A-08** | **Notifications** | Trigger WhatsApp/Email alerts for: Product Lists, Invoices, Payment Reminders. | P1 |

## 5. Technical Architecture

### 5.1 Frontend
- **Framework**: React 18 (TypeScript).
- **Styling**: Tailwind CSS (Mobile-first design).
- **State Management**: React Query (Server state), Zustand (Client state).

### 5.2 Backend Systems
*Note: The system currently contains two backend implementations.*

#### Node.js Backend (Reference/Complete)
- **Framework**: Express.js + TypeScript.
- **Database**: PostgreSQL + Prisma ORM.
- **Auth**: JWT + OTP service.
- **Status**: Feature complete, deployed structure.

#### PHP Backend (In Development/Migration)
- **Framework**: Custom lightweight PHP 8.1+ REST API.
- **Core Components**: Router, Controller-Service-Repository pattern.
- **Database**: SQL interaction (PDO/Database Abstraction).
- **Status**: Active development (files currently open).

### 5.3 External Services
- **Notifications**: WhatsApp Business API (or mock), SendGrid (Email).
- **Storage**: Local filesystem or S3 (for generated PDFs).

## 6. Non-Functional Requirements
- **Performance**: Catalog load < 1s.
- **Reliability**: Zero data loss on orders.
- **Security**: Secure session handling (JWT). No plain-text passwords (OTP used). Input sanitization.
- **Mobile Responsiveness**: Critical for customer ordering experience.

## 7. Outstanding/Next Steps
1.  **Infrastructure**: Finalize external service connections (WhatsApp/SendGrid).
2.  **Fintech**: Real-time payment gateway integration (Yoco).
3.  **Automation**: Scheduled tasks for automated reminders.
