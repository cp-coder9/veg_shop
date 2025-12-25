# Requirements Document

## Introduction

This system manages the end-to-end operations for an organic vegetable business, including product catalog management, customer ordering via Google Forms, order consolidation for bulk purchasing, invoice generation with credit management, packing list creation, and payment tracking across multiple payment methods (Cash, Yoco, EFT). The system supports 30-80 clients placing 600-800 product orders weekly, with deliveries on Monday, Wednesday, and Friday.

## Glossary

- **Order_Management_System**: The software system that manages customer orders, inventory, invoicing, and payments for the organic vegetable business
- **Product_Catalog**: The list of available organic vegetables and products with pricing information
- **Bulk_Order**: Consolidated order sent to suppliers based on aggregated customer orders
- **Packing_List**: Document listing products to be packed for each customer delivery
- **Invoice**: Financial document detailing products ordered, prices, credits, and payment due
- **Credit_Balance**: Amount owed to customer from previous overpayments or short deliveries
- **Payment_Method**: The mechanism used for payment (Cash, Yoco, or EFT)
- **Delivery_Schedule**: The days when products are delivered (Monday, Wednesday, Friday) or collected
- **WhatsApp_Integration**: System capability to send messages via WhatsApp
- **Order_Interface**: The in-app interface where customers place orders directly

## Requirements

### Requirement 1: Product Catalog Management

**User Story:** As a business owner, I want to manage my product catalog with pricing and categories, so that I can send accurate product lists to customers and track inventory.

#### Acceptance Criteria

1. THE Order_Management_System SHALL provide an interface to add, edit, and remove products with name, price, category, unit of measure, and availability status
2. THE Order_Management_System SHALL support product categories including Vegetables, Fruits, Dairy & Eggs, Bread & Bakery, Pantry Items, and Meat & Protein
3. THE Order_Management_System SHALL support seasonal product flagging to distinguish regular from seasonal items
4. THE Order_Management_System SHALL generate a formatted product list suitable for WhatsApp distribution every Tuesday, grouped by category
5. THE Order_Management_System SHALL maintain product pricing history for reporting purposes
6. WHEN a product is marked as unavailable, THE Order_Management_System SHALL exclude it from the customer-facing product list
7. THE Order_Management_System SHALL support product attributes including unit of measure (kg, g, L, ml, dozen, loaf, pack)

### Requirement 2: Customer Authentication and Access

**User Story:** As a customer, I want to log into the app securely, so that I can place orders and view my order history.

#### Acceptance Criteria

1. THE Order_Management_System SHALL provide a customer login interface with phone number or email authentication
2. THE Order_Management_System SHALL send verification codes via WhatsApp or email for authentication
3. WHEN a customer successfully authenticates, THE Order_Management_System SHALL create or retrieve their customer profile
4. THE Order_Management_System SHALL maintain customer sessions securely for a configurable duration
5. THE Order_Management_System SHALL allow customers to view their order history, credit balance, and payment status after authentication

### Requirement 3: Customer Order Placement

**User Story:** As a customer, I want to place orders directly in the app by selecting products and quantities, so that I can order conveniently without using external forms.

#### Acceptance Criteria

1. THE Order_Management_System SHALL provide a customer-facing interface displaying available products grouped by category with names, prices, units, and images
2. THE Order_Management_System SHALL allow customers to select products and specify quantities for their order using quantity selectors
3. THE Order_Management_System SHALL allow customers to select their preferred delivery date (Monday, Wednesday, Friday) or collection option
4. THE Order_Management_System SHALL allow customers to provide delivery address and special instructions for their order
5. WHEN a customer submits an order, THE Order_Management_System SHALL validate product availability and quantities
6. THE Order_Management_System SHALL accept customer orders until Friday for the following week's deliveries
7. THE Order_Management_System SHALL provide order confirmation to customers upon successful submission with order summary

### Requirement 4: Bulk Order Consolidation

**User Story:** As a business owner, I want to automatically consolidate all customer orders into bulk supplier orders, so that I can purchase inventory efficiently.

#### Acceptance Criteria

1. THE Order_Management_System SHALL aggregate all customer orders by product to calculate total quantities needed
2. THE Order_Management_System SHALL generate a bulk order summary by Friday for supplier submission
3. THE Order_Management_System SHALL format bulk orders for WhatsApp and email distribution to suppliers
4. THE Order_Management_System SHALL track which customer orders contribute to each bulk order item
5. WHEN bulk order quantities are calculated, THE Order_Management_System SHALL include a configurable buffer percentage for waste or additional demand

### Requirement 5: Packing List Generation

**User Story:** As a business owner, I want to generate printable packing lists for each customer, so that I can efficiently pack and deliver orders.

#### Acceptance Criteria

1. THE Order_Management_System SHALL generate individual packing lists for each customer order
2. THE Order_Management_System SHALL group packing lists by delivery date (Monday, Wednesday, Friday) or collection
3. THE Order_Management_System SHALL include customer name, delivery address, product names, and quantities on each packing list
4. THE Order_Management_System SHALL provide a print-optimized format for packing lists
5. WHEN packing lists are generated, THE Order_Management_System SHALL sort them by delivery route or customer name

### Requirement 6: Invoice Generation with Credit Management

**User Story:** As a business owner, I want to automatically generate invoices that account for credits and overpayments, so that billing is accurate and transparent.

#### Acceptance Criteria

1. THE Order_Management_System SHALL generate an invoice for each customer order with itemized products and prices
2. THE Order_Management_System SHALL automatically deduct existing credit balances from invoice totals
3. WHEN a customer has overpaid previously, THE Order_Management_System SHALL apply the credit to the current invoice
4. THE Order_Management_System SHALL track and display remaining credit balance after invoice generation
5. THE Order_Management_System SHALL provide a print-optimized and email-ready invoice format

### Requirement 7: Short Delivery Credit Management

**User Story:** As a business owner, I want to record short deliveries and automatically credit customers, so that I can maintain trust and accurate account balances.

#### Acceptance Criteria

1. THE Order_Management_System SHALL provide an interface to record short delivery incidents with product and quantity details
2. WHEN a short delivery is recorded, THE Order_Management_System SHALL calculate the credit amount based on product pricing
3. THE Order_Management_System SHALL automatically add short delivery credits to the customer's credit balance
4. THE Order_Management_System SHALL include short delivery credits in the next invoice calculation
5. THE Order_Management_System SHALL maintain a history of all short delivery incidents per customer

### Requirement 8: Payment Processing and Tracking

**User Story:** As a business owner, I want to record payments across multiple methods and track payment status, so that I know which customers have paid.

#### Acceptance Criteria

1. THE Order_Management_System SHALL support recording payments via Cash, Yoco, and EFT methods
2. THE Order_Management_System SHALL associate payments with specific invoices and customers
3. WHEN a payment exceeds the invoice amount, THE Order_Management_System SHALL create a credit balance for the customer
4. THE Order_Management_System SHALL display payment status (Paid, Partial, Unpaid) for each invoice
5. THE Order_Management_System SHALL generate payment reports showing outstanding balances by customer

### Requirement 9: Payment Reminder Notifications

**User Story:** As a business owner, I want to send automated payment reminders via WhatsApp and email, so that I can reduce late payments.

#### Acceptance Criteria

1. THE Order_Management_System SHALL identify invoices with outstanding balances past a configurable due date
2. THE Order_Management_System SHALL generate payment reminder messages with invoice details and amount due
3. THE Order_Management_System SHALL send payment reminders via WhatsApp to customers with WhatsApp contact information
4. THE Order_Management_System SHALL send payment reminders via email to customers with email addresses
5. WHEN a payment reminder is sent, THE Order_Management_System SHALL log the reminder date and method for tracking purposes

### Requirement 10: Delivery Schedule Management

**User Story:** As a business owner, I want to assign orders to specific delivery dates or collection, so that I can organize my delivery logistics.

#### Acceptance Criteria

1. THE Order_Management_System SHALL support three delivery days: Monday, Wednesday, and Friday
2. THE Order_Management_System SHALL support customer collection as an alternative to delivery
3. THE Order_Management_System SHALL allow assignment of orders to specific delivery dates during order processing
4. THE Order_Management_System SHALL display orders grouped by delivery date for logistics planning
5. WHEN generating packing lists, THE Order_Management_System SHALL filter by selected delivery date

### Requirement 11: Customer Management

**User Story:** As a business owner, I want to manage customer information and preferences, so that I can communicate effectively and track customer history.

#### Acceptance Criteria

1. THE Order_Management_System SHALL store customer contact information including name, phone, email, and delivery address
2. THE Order_Management_System SHALL track customer delivery preferences (delivery vs collection)
3. THE Order_Management_System SHALL maintain customer order history with dates and totals
4. THE Order_Management_System SHALL display customer credit balance and payment history
5. THE Order_Management_System SHALL support a customer base of 30 to 80 active customers

### Requirement 12: Reporting and Analytics

**User Story:** As a business owner, I want to view reports on sales, payments, and inventory, so that I can make informed business decisions.

#### Acceptance Criteria

1. THE Order_Management_System SHALL generate weekly sales reports showing total revenue and products sold
2. THE Order_Management_System SHALL generate payment status reports showing outstanding balances by customer
3. THE Order_Management_System SHALL generate product popularity reports showing most and least ordered items
4. THE Order_Management_System SHALL generate customer activity reports showing order frequency and average order value
5. THE Order_Management_System SHALL support date range filtering for all reports
