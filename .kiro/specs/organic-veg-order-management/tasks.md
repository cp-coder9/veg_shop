you # Implementation Plan

- [x] 1. Initialize project structure and dependencies
  - Create monorepo structure with separate frontend and backend directories
  - Initialize Node.js/TypeScript projects for both frontend and backend
  - Install core dependencies: React, Express, Prisma, PostgreSQL driver, JWT libraries
  - Set up TypeScript configurations with strict mode
  - Configure ESLint and Prettier for code quality
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Set up database schema and Prisma ORM
  - Define Prisma schema with all entities: User, Product (with category and unit fields), Order (with deliveryAddress and specialInstructions), OrderItem, Invoice, Payment, Credit, PriceHistory, Notification
  - Configure PostgreSQL connection in Prisma
  - Create initial migration for database schema
  - Generate Prisma Client for type-safe database access
  - Create seed script with initial product catalog (vegetables, fruits, dairy, bread, pantry, meat categories)
  - _Requirements: 1.1, 1.2, 1.7, 2.1, 3.1, 3.4, 11.1_

- [x] 3. Implement authentication service and middleware
  - [x] 3.1 Create verification code generation and storage logic
    - Write function to generate 6-digit verification codes
    - Implement code storage with expiration (10 minutes)
    - Create database table or cache for verification codes
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Implement verification code sending via WhatsApp and Email
    - Integrate WhatsApp Business API for sending messages
    - Integrate email service (SendGrid or similar) for sending emails
    - Create notification templates for verification codes
    - _Requirements: 2.2_

  - [x] 3.3 Build JWT token generation and validation
    - Implement JWT token generation with access and refresh tokens
    - Create token validation middleware for protected routes
    - Implement token refresh endpoint
    - _Requirements: 2.3, 2.4_

  - [x] 3.4 Create authentication API endpoints
    - POST /api/auth/send-code endpoint
    - POST /api/auth/verify-code endpoint
    - POST /api/auth/refresh endpoint
    - POST /api/auth/logout endpoint
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.5 Write authentication service tests
    - Test verification code generation and expiration
    - Test JWT token generation and validation
    - Test authentication endpoints
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Build product management service
  - [x] 4.1 Create product repository with CRUD operations
    - Implement createProduct, updateProduct, deleteProduct methods with category and unit support
    - Implement getProduct, getProducts with filtering by category, availability, and seasonal status
    - Implement getAvailableProducts for customer view grouped by category
    - _Requirements: 1.1, 1.2, 1.6, 1.7_

  - [x] 4.2 Implement product pricing history tracking
    - Create logic to save price changes to PriceHistory table
    - Implement getPricingHistory method
    - _Requirements: 1.4_

  - [x] 4.3 Build WhatsApp product list generator
    - Create formatter to generate WhatsApp-friendly product list grouped by category
    - Include product names, prices, units, and seasonal flags
    - Format categories: Vegetables, Fruits, Dairy & Eggs, Bread & Bakery, Pantry Items, Meat & Protein
    - _Requirements: 1.2, 1.4_

  - [x] 4.4 Create product API endpoints
    - GET /api/products (with filters for category, availability, seasonal)
    - GET /api/products/:id
    - POST /api/products (admin only, with category and unit validation)
    - PUT /api/products/:id (admin only)
    - DELETE /api/products/:id (admin only)
    - GET /api/products/list/whatsapp (admin only, grouped by category)
    - _Requirements: 1.1, 1.2, 1.4, 1.6, 1.7_

  - [x] 4.5 Write product service tests
    - Test CRUD operations
    - Test pricing history tracking
    - Test WhatsApp list generation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Implement order management service
  - [x] 5.1 Create order repository with core operations
    - Implement createOrder with order items, delivery address, and special instructions
    - Implement getOrder, getCustomerOrders, getOrdersByDeliveryDate
    - Implement updateOrderStatus method
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.3_

  - [x] 5.2 Build order validation logic
    - Validate product availability before order creation
    - Validate delivery date (must be Mon/Wed/Fri or collection)
    - Validate order submission deadline (Friday cutoff)
    - _Requirements: 3.4, 3.5_

  - [x] 5.3 Implement bulk order consolidation
    - Create aggregation logic to sum quantities by product
    - Add configurable buffer percentage for waste
    - Track which customer orders contribute to each bulk item
    - Generate formatted output for WhatsApp and email
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.4 Create order API endpoints
    - POST /api/orders (customer creates order)
    - GET /api/orders/:id
    - GET /api/orders/customer/:customerId
    - GET /api/orders/delivery/:date (admin only)
    - POST /api/orders/bulk (admin only)
    - PATCH /api/orders/:id/status (admin only)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3_

  - [x] 5.5 Write order service tests
    - Test order creation with validation
    - Test bulk order consolidation logic
    - Test order retrieval and filtering
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Build invoice generation service
  - [x] 6.1 Create invoice repository and generation logic
    - Implement generateInvoice from order
    - Calculate subtotal from order items
    - Implement getInvoice, getCustomerInvoices methods
    - _Requirements: 6.1_

  - [x] 6.2 Implement automatic credit application
    - Query customer credit balance
    - Apply credits to invoice total
    - Update invoice with creditApplied and final total
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 6.3 Build PDF invoice generator
    - Integrate PDF generation library (PDFKit or Puppeteer)
    - Create invoice template with itemized products, credits, and totals
    - Generate print-optimized and email-ready format
    - Store PDF in file storage and save URL to database
    - _Requirements: 6.5_

  - [x] 6.4 Create invoice API endpoints
    - POST /api/invoices/generate/:orderId (admin only)
    - GET /api/invoices/:id
    - GET /api/invoices/:id/pdf
    - GET /api/invoices/customer/:customerId
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.5 Write invoice service tests
    - Test invoice generation from order
    - Test credit application logic
    - Test PDF generation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Implement payment and credit management service
  - [x] 7.1 Create payment repository
    - Implement recordPayment method
    - Implement getPayment, getCustomerPayments methods
    - Associate payments with invoices and update invoice status
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 7.2 Build credit balance management
    - Implement getCreditBalance method
    - Create credit when payment exceeds invoice amount
    - Implement applyCredit method for invoice generation
    - _Requirements: 8.3, 6.2, 6.3_

  - [x] 7.3 Implement short delivery credit tracking
    - Create recordShortDelivery method
    - Calculate credit amount based on product pricing
    - Add credit to customer's credit balance
    - Maintain history of short delivery incidents
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.4 Create payment and credit API endpoints
    - POST /api/payments (admin only)
    - GET /api/payments/:id
    - GET /api/payments/customer/:customerId
    - GET /api/credits/customer/:customerId
    - POST /api/credits/short-delivery (admin only)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.5 Write payment service tests
    - Test payment recording and invoice status updates
    - Test credit balance calculations
    - Test short delivery credit creation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Build packing list service
  - [x] 8.1 Create packing list generation logic
    - Generate packing list from order with customer details
    - Group packing lists by delivery date
    - Implement sorting by route or customer name
    - _Requirements: 5.1, 5.2, 5.5_

  - [x] 8.2 Build PDF packing list generator
    - Create print-optimized packing list template
    - Include customer name, address, products, and quantities
    - Support batch PDF generation for multiple packing lists
    - _Requirements: 5.3, 5.4_

  - [x] 8.3 Create packing list API endpoints
    - GET /api/packing-lists/order/:orderId (admin only)
    - GET /api/packing-lists/date/:date (admin only)
    - POST /api/packing-lists/pdf (admin only)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.4 Write packing list service tests
    - Test packing list generation
    - Test grouping and sorting logic
    - Test PDF generation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Implement notification service
  - [x] 9.1 Create notification repository and queue
    - Implement notification storage in database
    - Create notification queue for async processing
    - Track notification status (pending, sent, failed)
    - _Requirements: 9.5_

  - [x] 9.2 Build WhatsApp integration
    - Integrate WhatsApp Business API
    - Implement sendWhatsApp method
    - Handle API errors and retries
    - _Requirements: 9.3_

  - [x] 9.3 Build email integration
    - Integrate email service (SendGrid or similar)
    - Implement sendEmail method
    - Create email templates for different notification types
    - _Requirements: 9.4_

  - [x] 9.4 Implement payment reminder logic
    - Identify invoices with outstanding balances past due date
    - Generate payment reminder messages
    - Send reminders via WhatsApp and email based on customer preferences
    - Log reminder date and method
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.5 Create order confirmation notifications
    - Send order confirmation to customer after order submission
    - Include order details and delivery date
    - _Requirements: 3.6_

  - [x] 9.6 Create notification API endpoints
    - POST /api/notifications/whatsapp (admin only)
    - POST /api/notifications/email (admin only)
    - POST /api/notifications/payment-reminder/:customerId (admin only)
    - POST /api/notifications/product-list (admin only)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 1.3_

  - [x] 9.7 Write notification service tests
    - Test notification queue and status tracking
    - Test payment reminder identification logic
    - Mock external API calls for WhatsApp and email
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Build reporting service
  - [x] 10.1 Implement sales report generation
    - Query orders and calculate total revenue
    - Aggregate products sold with quantities and revenue
    - Support date range filtering
    - _Requirements: 12.1_

  - [x] 10.2 Implement payment status report
    - Calculate outstanding balances by customer
    - Include last payment date for each customer
    - _Requirements: 12.2_

  - [x] 10.3 Implement product popularity report
    - Aggregate order items by product
    - Calculate order count, total quantity, and revenue per product
    - Sort by popularity metrics
    - _Requirements: 12.3_

  - [x] 10.4 Implement customer activity report
    - Calculate order count and total spent per customer
    - Calculate average order value
    - Include last order date
    - _Requirements: 12.4_

  - [x] 10.5 Create reporting API endpoints
    - GET /api/reports/sales (admin only)
    - GET /api/reports/payments (admin only)
    - GET /api/reports/products (admin only)
    - GET /api/reports/customers (admin only)
    - All endpoints support date range query parameters
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 10.6 Write reporting service tests
    - Test sales report calculations
    - Test payment status aggregation
    - Test product popularity calculations
    - Test customer activity calculations
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 11. Build customer management service
  - [x] 11.1 Create customer service and repository
    - Implement createCustomer, updateCustomer methods
    - Implement getCustomer, getCustomers methods
    - Store contact info, delivery address, and preferences
    - _Requirements: 11.1, 11.2_

  - [x] 11.2 Implement customer API endpoints
    - GET /api/customers/:id
    - GET /api/customers (admin only)
    - PUT /api/customers/:id
    - POST /api/customers (for registration)
    - Include order history, credit balance, and payment history in profile
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 11.3 Write customer service tests
    - Test customer CRUD operations
    - Test customer profile data aggregation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12. Build customer-facing React frontend
  - [x] 12.1 Set up React project structure and routing
    - Configure React Router with customer routes (login, products, cart, orders, profile)
    - Create layout components (header with navigation, footer)
    - Set up protected route wrapper for authenticated pages
    - Create basic page components (placeholders)
    - _Requirements: 2.1, 3.1_

  - [x] 12.2 Implement authentication UI
    - Create login page with phone/email input form
    - Create verification code input page with code entry
    - Implement JWT token storage in localStorage
    - Create auth context/store for managing authentication state
    - Implement automatic token refresh logic
    - Add logout functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 12.3 Build product catalog view
    - Create product list page with grid layout
    - Group products by category with section headers
    - Display product cards with image, name, price, unit, and seasonal badge
    - Implement "Add to Cart" button on each product
    - Make responsive for mobile devices (single column on mobile)
    - _Requirements: 3.1, 1.2, 1.6, 1.7_

  - [x] 12.4 Create shopping cart and order placement
    - Build cart state management (Zustand store)
    - Create cart page showing selected products with quantity controls
    - Display cart total and item count
    - Create checkout form with delivery date selector (Mon/Wed/Fri or collection)
    - Add delivery address input field
    - Add special instructions textarea
    - Implement order submission with validation
    - Show order confirmation page with order summary
    - Clear cart after successful order
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 12.5 Build customer profile and order history
    - Create profile page showing customer name, contact, and address
    - Add edit profile functionality
    - Display order history list with dates, status, and totals
    - Show order details when clicking on an order
    - Display current credit balance prominently
    - Show invoice status for each order
    - _Requirements: 2.5, 11.3, 11.4_

  - [x] 12.6 Write frontend component tests
    - Test authentication flow
    - Test product catalog rendering
    - Test cart functionality
    - Test order placement flow
    - Test profile and order history display
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 13. Build admin dashboard React frontend
  - [x] 13.1 Create admin layout and navigation
    - Build admin dashboard layout with sidebar navigation
    - Create navigation menu items (Dashboard, Products, Orders, Invoices, Payments, Customers, Reports)
    - Implement admin role check in protected routes
    - Create admin home/dashboard page with key metrics
    - _Requirements: All admin requirements_

  - [x] 13.2 Build product management UI
    - Create product list page with table view
    - Add category filter dropdown and availability filter
    - Build product create/edit modal with form (name, price, category, unit, description, image URL, availability, seasonal)
    - Implement delete product with confirmation
    - Add "Generate WhatsApp List" button that displays formatted product list
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_

  - [x] 13.3 Create order management UI
    - Build order list page with filters (delivery date, status, customer)
    - Create order detail modal showing customer info, items, and totals
    - Implement order status update dropdown
    - Add "Generate Bulk Order" button with week selector
    - Display bulk order summary in modal with WhatsApp/Email format options
    - _Requirements: 4.1, 4.2, 4.3, 10.3, 10.4, 10.5_

  - [x] 13.4 Build invoice management UI
    - Create invoice list page with filters (customer, status, date range)
    - Build invoice detail modal showing itemized products, credits, and totals
    - Add "Generate Invoice" button on orders without invoices
    - Implement PDF download button
    - Display credit application breakdown
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 13.5 Create payment recording UI
    - Build payment form modal with invoice selector
    - Add payment method radio buttons (Cash, Yoco, EFT)
    - Include amount input and notes textarea
    - Display payment history table per customer
    - Show real-time invoice status updates after payment
    - Highlight overpayment and credit creation
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 13.6 Build short delivery management UI
    - Create short delivery form modal with order selector
    - Add product multi-select with quantity short inputs
    - Auto-calculate credit amount based on product prices
    - Show confirmation of credit added to customer balance
    - Display short delivery history table
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 13.7 Create packing list UI
    - Build packing list page with delivery date selector
    - Display packing lists grouped by delivery date
    - Add sort options (route, customer name)
    - Implement "Generate PDF" button for batch printing
    - Show individual packing list preview
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 13.8 Build notification management UI
    - Create notifications page with action buttons
    - Add "Send Product List" button with customer multi-select
    - Build "Send Payment Reminder" interface with customer selector
    - Display notification history table with status (pending, sent, failed)
    - Show notification content preview
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 1.3_

  - [x] 13.9 Create reporting dashboard
    - Build reports page with tab navigation (Sales, Payments, Products, Customers)
    - Implement date range picker for all reports
    - Create sales report with revenue chart and product breakdown table
    - Build payment status report with outstanding balances table
    - Create product popularity report with bar chart and table
    - Build customer activity report with metrics cards and table
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 13.10 Build customer management UI
    - Create customer list page with search and filters
    - Build customer detail page with tabs (Info, Orders, Invoices, Payments, Credits)
    - Display customer credit balance prominently
    - Implement customer info edit form
    - Show order history timeline
    - Display payment history with running balance
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 13.11 Write admin dashboard component tests
    - Test product management flows
    - Test order and invoice management
    - Test payment recording
    - Test reporting views
    - _Requirements: All admin requirements_

- [x] 14. Implement API integration layer
  - [x] 14.1 Create API client with authentication
    - Build axios instance with base URL configuration
    - Implement request interceptor to attach JWT token to headers
    - Implement response interceptor for automatic token refresh on 401
    - Create global error handler for API errors
    - Export typed API methods for all endpoints
    - _Requirements: 2.3, 2.4_

  - [x] 14.2 Set up React Query and create data hooks
    - Configure React Query provider with default options
    - Create hooks for authentication (useLogin, useVerifyCode, useLogout)
    - Create hooks for products (useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct)
    - Create hooks for orders (useOrders, useOrder, useCreateOrder, useUpdateOrderStatus, useBulkOrder)
    - Create hooks for invoices (useInvoices, useInvoice, useGenerateInvoice)
    - Create hooks for payments (usePayments, useCreatePayment, useCustomerCredits)
    - Create hooks for customers (useCustomers, useCustomer, useUpdateCustomer)
    - Create hooks for reports (useSalesReport, usePaymentReport, useProductReport, useCustomerReport)
    - Create hooks for notifications (useSendWhatsApp, useSendEmail, useSendPaymentReminder)
    - Create hooks for packing lists (usePackingLists, useGeneratePackingListPDF)
    - Configure appropriate cache times and refetch strategies
    - _Requirements: All requirements involving data fetching_

  - [x] 14.3 Write API integration tests
    - Test API client authentication flow
    - Test React Query hooks with mock API
    - Test error handling and retry logic
    - _Requirements: 2.3, 2.4_

- [x] 15. Set up deployment infrastructure
  - [x] 15.1 Create Docker configuration
    - Write Dockerfile for backend with multi-stage build
    - Write Dockerfile for frontend with nginx
    - Create docker-compose.yml for local development with PostgreSQL
    - Create docker-compose.prod.yml for production deployment
    - Configure environment variable passing
    - _Requirements: All requirements depend on deployment_

  - [x] 15.2 Create database seed script
    - Create seed script with initial product catalog (vegetables, fruits, dairy, bread, pantry, meat)
    - Add sample admin user
    - Add sample customer users for testing
    - Document how to run seed script
    - _Requirements: All requirements depend on database_

  - [x] 15.3 Set up environment configuration
    - Update .env.example files with all required variables
    - Document DATABASE_URL, JWT_SECRET, PORT, WHATSAPP_API_KEY, EMAIL_API_KEY
    - Create separate .env.development and .env.production templates
    - Add environment validation on startup
    - _Requirements: All requirements depend on configuration_

  - [x] 15.4 Create deployment documentation
    - Document local development setup steps
    - Document production deployment process
    - Document database migration and backup procedures
    - Document environment variable configuration
    - _Requirements: All requirements depend on deployment_

- [x] 16. Implement security and performance features
  - [x] 16.1 Add rate limiting middleware
    - Install express-rate-limit package
    - Implement rate limiting for verification code sending (3 per hour per contact)
    - Implement general API rate limiting (100 per minute per user)
    - Implement login attempt rate limiting (5 per hour per contact)
    - Add rate limit headers to responses
    - Apply rate limiting to auth routes and sensitive endpoints
    - _Requirements: 2.1, 2.2_

  - [x] 16.2 Add input validation middleware
    - Create Zod validation schemas for all API endpoints (auth, products, orders, invoices, payments, customers)
    - Implement validation middleware that uses schemas
    - Return structured validation error messages with field-level details
    - Add validation for authentication endpoints (phone/email format, code format)
    - Add validation for product endpoints (price, category, unit)
    - Add validation for order endpoints (delivery date, items array)
    - Add validation for payment endpoints (amount, method, invoice ID)
    - _Requirements: All requirements involving user input_

  - [x] 16.3 Implement database indexing
    - Add index on orders.customerId for faster customer order queries
    - Add index on orders.deliveryDate for delivery date filtering
    - Add index on orders.status for status-based queries
    - Add composite index on invoices (customerId, status) for payment reports
    - Add index on payments.customerId for payment history queries
    - Add index on verificationCodes.contact for auth lookups
    - Run migration to apply indexes
    - Test query performance improvements with EXPLAIN ANALYZE
    - _Requirements: All requirements involving database queries_

  - [x] 16.4 Add audit logging
    - Create audit log table in database with fields (userId, action, resource, details, timestamp)
    - Log all admin actions (product changes, payment recording, invoice generation)
    - Log authentication attempts (success and failure)
    - Log payment transactions
    - Include user ID, action type, timestamp, and details
    - Create API endpoint to view audit logs (admin only)
    - _Requirements: 1.1, 8.1, 8.2, 2.1_

  - [x] 16.5 Write security tests
    - Test rate limiting enforcement for verification codes
    - Test rate limiting enforcement for login attempts
    - Test input validation rejection for invalid data
    - Test authorization checks (customer vs admin access)
    - Test JWT token expiration and refresh flow
    - Test SQL injection prevention via Prisma
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 17. Final integration and testing
  - [~] 17.1 Perform end-to-end testing
    - [x] Create comprehensive E2E test scenarios document (E2E_TEST_SCENARIOS.md)
    - [x] Define test environment setup requirements
    - [x] Document 20+ test cases across 6 major workflows
    - [ ] Execute customer order flow tests (login, browse, add to cart, checkout)
    - [ ] Execute admin order processing flow tests (view orders, generate invoice, record payment)
    - [ ] Execute payment and credit management flow tests (overpayment, credit application, short delivery)
    - [ ] Execute notification sending tests (product list, payment reminder, order confirmation)
    - [ ] Execute bulk order and packing list tests
    - [ ] Execute reporting tests
    - _Requirements: All requirements_
    - _Status: Test scenarios documented, ready for execution_

  - [~] 17.2 Test mobile responsiveness
    - [x] Create mobile responsiveness test guide (MOBILE_RESPONSIVENESS_TEST.md)
    - [x] Define test devices and screen sizes (320px - 1024px)
    - [x] Document 9 major UI components for testing
    - [x] Create common mobile issues checklist
    - [ ] Test customer app on iOS devices (iPhone 12/13/14, iPad)
    - [ ] Test customer app on Android devices (Samsung, Pixel)
    - [ ] Test all breakpoints and touch targets
    - [ ] Test with slow network (3G throttling)
    - [ ] Fix any responsive design issues found
    - [ ] Ensure touch-friendly UI elements (min 44x44px)
    - _Requirements: 2.1, 3.1_
    - _Status: Test plan documented, ready for execution_

  - [~] 17.3 Test external integrations
    - [x] Create external integrations test guide (EXTERNAL_INTEGRATIONS_TEST.md)
    - [x] Implement WhatsApp API integration with dev mode
    - [x] Implement email service integration with dev mode
    - [x] Implement PDF generation for invoices and packing lists
    - [x] Test PDF generation in unit tests
    - [ ] Set up WhatsApp Business API test account
    - [ ] Set up email service test account (SendGrid or similar)
    - [ ] Test WhatsApp API with real test messages
    - [ ] Test email service with real test emails
    - [ ] Verify PDF generation quality and formatting
    - [ ] Verify PDF downloads work correctly in browsers
    - _Requirements: 9.3, 9.4, 6.5, 5.4_
    - _Status: Mock implementations working, ready for real API testing_

  - [ ] 17.4 Perform load testing
    - [ ] Set up load testing tools (JMeter, k6, or Artillery)
    - [ ] Create load test scenarios for customer orders
    - [ ] Test system with 80 concurrent customers placing orders
    - [ ] Test bulk order generation with 800 product orders
    - [ ] Monitor database query performance with EXPLAIN ANALYZE
    - [ ] Identify and fix performance bottlenecks
    - [ ] Document performance metrics and optimizations
    - _Requirements: 11.5, 4.1_
    - _Status: Not started, can be done post-launch_

  - [x] 17.5 Create user documentation
    - [x] Create README.md with project overview
    - [x] Create QUICK_START.md with setup instructions
    - [x] Create DEPLOYMENT.md with deployment guide
    - [x] Create ENVIRONMENT.md with configuration details
    - [x] Create test scenario documentation
    - [x] Create TESTING_STATUS.md with comprehensive test status
    - [x] Write customer user guide (CUSTOMER_GUIDE.md - login, orders, profile)
    - [x] Write admin user guide (ADMIN_GUIDE.md - complete system management)
    - [x] Include troubleshooting steps in both guides
    - [x] Document common tasks and best practices
    - [ ] Add screenshots to user guides (optional enhancement)
    - _Requirements: All requirements_
    - _Status: Complete - comprehensive guides created for customers and admins_

  - [x] 17.6 Fix remaining test failures
    - [x] Fix 4 backend test assertions (Decimal type comparisons in payment/product tests)
    - [x] Fix 4 frontend test mocks (add useDevLogin to auth hooks mock)
    - [x] Re-run all tests to confirm 100% passing
    - [x] Update test documentation with results
    - _Status: All tests passing - Backend: 132/132, Frontend: 87/87_
