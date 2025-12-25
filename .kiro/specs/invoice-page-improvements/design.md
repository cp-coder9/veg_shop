# Design Document

## Overview

This design document outlines the technical approach for enhancing the invoicing pages in the organic vegetable order management system. The improvements focus on two main areas: enriching the customer invoice experience with detailed views, PDF downloads, and payment history; and streamlining the admin workflow with better data presentation, inline actions, and summary statistics.

The design maintains the existing architecture using React with TypeScript on the frontend, Express.js with Prisma on the backend, and leverages existing patterns for API communication, state management, and UI components.

## Architecture

### Frontend Architecture

The frontend improvements follow the existing component-based architecture:

```
frontend/src/
├── pages/
│   ├── ProfilePage.tsx (Enhanced)
│   └── admin/
│       ├── InvoicesManagement.tsx (Enhanced)
│       └── PaymentsManagement.tsx (Minor updates)
├── components/
│   ├── invoices/
│   │   ├── CustomerInvoiceDetailModal.tsx (New)
│   │   ├── AdminInvoiceDetailModal.tsx (Enhanced)
│   │   ├── InvoiceSummaryCards.tsx (New)
│   │   └── EmailInvoiceModal.tsx (New)
│   └── payments/
│       └── PaymentHistoryTable.tsx (New)
├── hooks/
│   ├── useCustomer.ts (Enhanced)
│   ├── useAdminInvoices.ts (Enhanced)
│   └── useInvoiceEmail.ts (New)
└── lib/
    └── utils.ts (Enhanced with date utilities)
```

### Backend Architecture

The backend enhancements extend existing services and routes:

```
backend/src/
├── routes/
│   ├── invoice.routes.ts (Enhanced)
│   ├── payment.routes.ts (Enhanced)
│   └── customer.routes.ts (Enhanced)
├── services/
│   ├── invoice.service.ts (Enhanced)
│   ├── payment.service.ts (Enhanced)
│   ├── customer.service.ts (Enhanced)
│   └── email.service.ts (Enhanced)
└── lib/
    └── email-templates.ts (Enhanced)
```

## Components and Interfaces

### 1. Customer Invoice Detail Modal

**Component:** `CustomerInvoiceDetailModal.tsx`

**Purpose:** Display comprehensive invoice information to customers in a modal dialog.

**Props Interface:**
```typescript
interface CustomerInvoiceDetailModalProps {
  invoiceId: string;
  onClose: () => void;
}
```

**Key Features:**
- Fetches full invoice details including order items
- Displays invoice metadata (ID, dates, status)
- Shows itemized order breakdown
- Displays payment summary with credit application
- Provides PDF download button
- Responsive design for mobile viewing

**State Management:**
- Uses `useInvoice(invoiceId)` hook for data fetching
- Uses `useDownloadInvoicePDF()` hook for PDF download
- Local loading and error states

### 2. Enhanced Admin Invoice Detail Modal

**Component:** `AdminInvoiceDetailModal.tsx` (Enhanced existing)

**Enhancements:**
- Add payment history section
- Display total paid and remaining balance
- Show customer name instead of ID
- Add "Email Invoice" button
- Add "Record Payment" button

**New Data Structure:**
```typescript
interface InvoiceWithPayments extends Invoice {
  order: OrderWithItems;
  customer: {
    id: string;
    name: string;
    email: string | null;
    address: string | null;
  };
  payments: Payment[];
}
```

### 3. Payment History Table Component

**Component:** `PaymentHistoryTable.tsx`

**Purpose:** Reusable component for displaying payment history.

**Props Interface:**
```typescript
interface PaymentHistoryTableProps {
  customerId?: string;
  invoiceId?: string;
  showInvoiceColumn?: boolean;
  showCustomerColumn?: boolean;
}
```

**Features:**
- Fetches payments based on customerId or invoiceId
- Displays date, amount, method, invoice reference, notes
- Formats currency and dates consistently
- Shows empty state when no payments exist
- Responsive table design

### 4. Invoice Summary Cards

**Component:** `InvoiceSummaryCards.tsx`

**Purpose:** Display key invoice statistics for administrators.

**Props Interface:**
```typescript
interface InvoiceSummaryCardsProps {
  invoices: Invoice[];
}
```

**Calculated Metrics:**
- Total outstanding invoices count
- Total outstanding amount
- Overdue invoices count
- Overdue amount
- Average invoice value
- Paid invoices this month

**Design:**
- Grid layout with 4-6 cards
- Color-coded (green for paid, red for overdue, yellow for outstanding)
- Large numbers with descriptive labels
- Icons for visual clarity

### 5. Email Invoice Modal

**Component:** `EmailInvoiceModal.tsx`

**Purpose:** Allow admins to send invoice PDFs via email.

**Props Interface:**
```typescript
interface EmailInvoiceModalProps {
  invoiceId: string;
  customerEmail: string;
  customerName: string;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Features:**
- Pre-fills customer email
- Allows custom message input
- Shows email preview
- Validates email address
- Displays sending progress
- Shows success/error feedback

## Data Models

### Enhanced Invoice Type

```typescript
interface InvoiceWithDetails extends Invoice {
  order: {
    id: string;
    deliveryDate: string;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      priceAtOrder: number | string;
      product: {
        name: string;
        unit: string;
      };
    }>;
  };
  customer: {
    id: string;
    name: string;
    email: string | null;
    address: string | null;
  };
  payments: Array<{
    id: string;
    amount: number | string;
    method: 'cash' | 'yoco' | 'eft';
    paymentDate: string;
    notes: string | null;
  }>;
}
```

### Payment Type

```typescript
interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number | string;
  method: 'cash' | 'yoco' | 'eft';
  paymentDate: string;
  notes: string | null;
  createdAt: string;
  invoice?: {
    id: string;
    total: number | string;
  };
}
```

### Invoice Summary Statistics

```typescript
interface InvoiceSummaryStats {
  totalOutstanding: number;
  totalOutstandingCount: number;
  totalOverdue: number;
  totalOverdueCount: number;
  totalPaid: number;
  totalPaidCount: number;
  averageInvoiceValue: number;
}
```

## API Endpoints

### Enhanced Endpoints

#### 1. Get Invoice with Full Details
```
GET /api/invoices/:id?includePayments=true
```

**Response:**
```typescript
{
  id: string;
  orderId: string;
  customerId: string;
  subtotal: number;
  creditApplied: number;
  total: number;
  status: 'unpaid' | 'partial' | 'paid';
  pdfUrl: string | null;
  createdAt: string;
  dueDate: string;
  order: { /* order details */ };
  customer: { /* customer details */ };
  payments: Payment[];
}
```

#### 2. Get Customer Invoices with Details
```
GET /api/invoices/customer/me?includeDetails=true
```

**Response:** Array of `InvoiceWithDetails`

#### 3. Get All Invoices with Customer Names (Admin)
```
GET /api/invoices?includeCustomer=true&status=unpaid&customerName=John
```

**Query Parameters:**
- `includeCustomer`: boolean - Include customer details
- `status`: string - Filter by status
- `startDate`: string - Filter by start date
- `endDate`: string - Filter by end date
- `customerName`: string - Filter by customer name (partial match)

**Response:** Array of invoices with customer names

#### 4. Get Customer Payments
```
GET /api/payments/customer/:customerId
```

**Response:** Array of `Payment`

#### 5. Get Invoice Payments
```
GET /api/payments/invoice/:invoiceId
```

**Response:** Array of `Payment`

#### 6. Send Invoice Email
```
POST /api/invoices/:id/email
```

**Request Body:**
```typescript
{
  customMessage?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### New Backend Service Methods

#### InvoiceService Enhancements

```typescript
class InvoiceService {
  // Existing methods...
  
  async getInvoiceWithPayments(id: string): Promise<InvoiceWithDetails | null>;
  
  async getCustomerInvoicesWithDetails(customerId: string): Promise<InvoiceWithDetails[]>;
  
  async getAllInvoicesWithCustomers(filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
    customerName?: string;
  }): Promise<InvoiceWithDetails[]>;
  
  async sendInvoiceEmail(invoiceId: string, customMessage?: string): Promise<void>;
  
  async calculateInvoiceStats(invoices: Invoice[]): Promise<InvoiceSummaryStats>;
}
```

#### PaymentService Enhancements

```typescript
class PaymentService {
  // Existing methods...
  
  async getCustomerPayments(customerId: string): Promise<Payment[]>;
  
  async getInvoicePayments(invoiceId: string): Promise<Payment[]>;
  
  async getPaymentHistory(customerId: string, limit?: number): Promise<Payment[]>;
}
```

## UI/UX Design Patterns

### 1. Overdue Invoice Indicator

**Visual Design:**
- Red badge with "OVERDUE" text
- Display days overdue (e.g., "OVERDUE (5 days)")
- Position: Next to status badge
- Sort overdue invoices to top of table

**Calculation Logic:**
```typescript
function isOverdue(invoice: Invoice): boolean {
  const today = new Date();
  const dueDate = new Date(invoice.dueDate);
  return dueDate < today && invoice.status !== 'paid';
}

function getDaysOverdue(invoice: Invoice): number {
  const today = new Date();
  const dueDate = new Date(invoice.dueDate);
  const diffTime = today.getTime() - dueDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

### 2. Customer Name Display

**Implementation:**
- Fetch customer data with invoices using `includeCustomer=true`
- Display full name in table cells
- Truncate names longer than 30 characters
- Show tooltip with full name on hover
- Cache customer data to avoid repeated fetches

### 3. Inline Payment Recording

**User Flow:**
1. Admin clicks "Record Payment" on invoice row
2. Payment modal opens with invoice pre-selected
3. Customer ID and invoice ID are pre-filled
4. Admin enters amount, method, date, notes
5. On submit, payment is recorded
6. Invoice table refreshes with updated status
7. Success message displays

### 4. PDF Download Experience

**Customer Flow:**
- Download icon/button in invoice table
- Download button in invoice detail modal
- Click triggers immediate download
- Loading indicator during download
- Error message if download fails

**Admin Flow:**
- Same as customer, plus
- Email invoice button
- Bulk download option (future enhancement)

## Error Handling

### Frontend Error Scenarios

1. **Invoice Not Found**
   - Display: "Invoice not found" message
   - Action: Close modal, return to list

2. **PDF Download Failed**
   - Display: "Failed to download PDF. Please try again."
   - Action: Allow retry

3. **Email Send Failed**
   - Display: "Failed to send email. Please check the email address and try again."
   - Action: Keep modal open for retry

4. **Payment Recording Failed**
   - Display: Specific error message from backend
   - Action: Keep form data, allow correction and retry

### Backend Error Handling

1. **Missing Customer Email**
   - Return 400 with message: "Customer email not available"
   - Suggest updating customer profile

2. **PDF Generation Failed**
   - Return 500 with message: "Failed to generate PDF"
   - Log error for debugging

3. **Email Service Unavailable**
   - Return 503 with message: "Email service temporarily unavailable"
   - Queue email for retry (future enhancement)

## Testing Strategy

### Unit Tests

**Frontend Components:**
- `CustomerInvoiceDetailModal`: Renders correctly, handles PDF download
- `PaymentHistoryTable`: Displays payments, handles empty state
- `InvoiceSummaryCards`: Calculates statistics correctly
- `EmailInvoiceModal`: Validates email, handles submission

**Backend Services:**
- `InvoiceService.getInvoiceWithPayments()`: Returns complete data
- `InvoiceService.sendInvoiceEmail()`: Sends email with PDF attachment
- `PaymentService.getCustomerPayments()`: Returns filtered payments
- `InvoiceService.calculateInvoiceStats()`: Calculates correct statistics

### Integration Tests

1. **Customer Invoice Flow:**
   - Customer views invoice list
   - Customer opens invoice detail modal
   - Customer downloads PDF
   - Customer views payment history

2. **Admin Invoice Management Flow:**
   - Admin filters invoices by customer name
   - Admin views invoice with payment history
   - Admin records payment inline
   - Admin sends invoice email

3. **Payment Recording Flow:**
   - Admin records payment
   - Invoice status updates
   - Payment appears in history
   - Customer credit balance updates (if overpayment)

### E2E Tests

1. Complete customer invoice viewing journey
2. Complete admin invoice management workflow
3. Payment recording and verification
4. Email invoice sending and delivery

## Performance Considerations

### Frontend Optimizations

1. **Lazy Loading:**
   - Load invoice details only when modal opens
   - Paginate payment history for customers with many payments

2. **Caching:**
   - Cache customer names with invoices
   - Use React Query cache for invoice details
   - Implement stale-while-revalidate pattern

3. **Debouncing:**
   - Debounce customer name filter input (300ms)
   - Debounce search queries

### Backend Optimizations

1. **Database Queries:**
   - Use Prisma `include` to fetch related data in single query
   - Add index on `invoice.customerId` and `invoice.dueDate`
   - Add index on `payment.customerId` and `payment.invoiceId`

2. **Caching:**
   - Cache customer data for invoice lists (5 minutes)
   - Cache invoice statistics (1 minute)

3. **Pagination:**
   - Implement cursor-based pagination for large invoice lists
   - Default page size: 50 invoices

## Security Considerations

1. **Authorization:**
   - Customers can only view their own invoices and payments
   - Admins can view all invoices and payments
   - Verify user permissions on all endpoints

2. **Data Validation:**
   - Validate email addresses before sending
   - Sanitize custom messages in emails
   - Validate date ranges in filters

3. **Rate Limiting:**
   - Limit email sending to 10 per minute per admin
   - Limit PDF downloads to 20 per minute per user

4. **Audit Logging:**
   - Log all invoice email sends
   - Log all payment recordings
   - Log all invoice PDF downloads

## Migration and Deployment

### Database Migrations

No schema changes required - all enhancements use existing tables.

### Deployment Steps

1. Deploy backend changes first
2. Run database migrations (if any)
3. Deploy frontend changes
4. Verify email service configuration
5. Test critical flows in production
6. Monitor error logs for 24 hours

### Rollback Plan

1. Revert frontend deployment
2. Revert backend deployment
3. Verify system functionality
4. Investigate and fix issues
5. Redeploy with fixes

## Future Enhancements

1. **Bulk Operations:**
   - Bulk invoice email sending
   - Bulk PDF download
   - Bulk payment recording

2. **Advanced Filtering:**
   - Filter by payment method
   - Filter by amount range
   - Filter by overdue duration

3. **Notifications:**
   - Automatic overdue reminders
   - Payment confirmation emails
   - Invoice generation notifications

4. **Analytics:**
   - Payment trends dashboard
   - Customer payment behavior analysis
   - Revenue forecasting

5. **Mobile App:**
   - Native mobile invoice viewing
   - Push notifications for invoices
   - Mobile payment recording
