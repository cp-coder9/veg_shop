# Tasks Document

## Overview

This document outlines the implementation tasks for enhancing the invoicing pages in the organic vegetable order management system. Tasks are organized by component area and prioritized to enable incremental delivery of value.

## Task Categories

- **Backend**: API endpoints, services, and database queries
- **Frontend - Customer**: Customer-facing invoice improvements
- **Frontend - Admin**: Admin dashboard invoice management improvements
- **Testing**: Unit, integration, and E2E tests
- **Documentation**: User guides and technical documentation

## Priority Levels

- **P0**: Critical - Must have for MVP
- **P1**: High - Important for good UX
- **P2**: Medium - Nice to have
- **P3**: Low - Future enhancement

---

## Backend Tasks

### Task 1: Enhance Invoice Service with Payment Details
**Priority:** P0  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Description:**
Enhance the `InvoiceService` to include payment details when fetching invoices.

**Acceptance Criteria:**
- [x] Add `getInvoiceWithPayments(id)` method to InvoiceService
- [x] Include payments array in invoice response
- [x] Include customer details (name, email, address) in invoice response
- [x] Add query parameter support for `includePayments` and `includeCustomer`
- [x] Update existing `getInvoice()` method to support optional includes
- [ ] Write unit tests for new methods

**Files to Modify:**
- `backend/src/services/invoice.service.ts`
- `backend/src/tests/invoice.service.test.ts`


### Task 2: Add Customer Name Filtering to Invoice Queries
**Priority:** P0  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 1

**Description:**
Add support for filtering invoices by customer name in the invoice query endpoints.

**Acceptance Criteria:**
- [x] Add `customerName` query parameter to GET /api/invoices endpoint
- [x] Implement case-insensitive partial name matching
- [x] Ensure filtering works with existing status and date filters
- [x] Optimize query performance with proper indexing
- [ ] Write unit tests for name filtering

**Files to Modify:**
- `backend/src/routes/invoice.routes.ts`
- `backend/src/services/invoice.service.ts`
- `backend/src/tests/invoice.service.test.ts`

### Task 3: Create Payment History Endpoints
**Priority:** P0  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Description:**
Create new endpoints for fetching payment history by customer and by invoice.

**Acceptance Criteria:**
- [x] Add GET /api/payments/customer/:customerId endpoint
- [x] Add GET /api/payments/invoice/:invoiceId endpoint
- [x] Add GET /api/payments/customer/me endpoint for authenticated customers
- [x] Implement proper authorization checks
- [x] Return payments sorted by date (newest first)
- [ ] Write unit tests for all endpoints

**Files to Create:**
- `backend/src/routes/payment.routes.ts` (enhance existing)

**Files to Modify:**
- `backend/src/services/payment.service.ts`
- `backend/src/tests/payment.service.test.ts`

### Task 4: Implement Invoice Email Service
**Priority:** P1  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1

**Description:**
Create service and endpoint for sending invoice PDFs via email.

**Acceptance Criteria:**
- [ ] Add POST /api/invoices/:id/email endpoint
- [ ] Create email template for invoice delivery
- [ ] Attach PDF to email
- [ ] Support custom message from admin
- [ ] Validate customer has email address
- [ ] Log email sends in audit log
- [ ] Handle email service errors gracefully
- [ ] Write unit tests for email service

**Files to Create:**
- `backend/src/lib/email-templates.ts` (enhance existing)

**Files to Modify:**
- `backend/src/routes/invoice.routes.ts`
- `backend/src/services/invoice.service.ts`
- `backend/src/services/email.service.ts`
- `backend/src/tests/invoice.service.test.ts`

### Task 5: Add Invoice Statistics Calculation
**Priority:** P1  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 1

**Description:**
Add method to calculate invoice summary statistics for admin dashboard.

**Acceptance Criteria:**
- [x] Add `calculateInvoiceStats()` method to InvoiceService
- [x] Calculate total outstanding amount and count
- [x] Calculate total overdue amount and count
- [x] Calculate total paid amount and count
- [x] Calculate average invoice value
- [x] Return statistics in structured format
- [ ] Write unit tests for calculations

**Files to Modify:**
- `backend/src/services/invoice.service.ts`
- `backend/src/tests/invoice.service.test.ts`

---

## Frontend - Customer Tasks

### Task 6: Create Customer Invoice Detail Modal
**Priority:** P0  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1

**Description:**
Create a modal component for displaying detailed invoice information to customers.

**Acceptance Criteria:**
- [x] Create CustomerInvoiceDetailModal component
- [x] Display invoice metadata (ID, dates, status)
- [x] Display order items table with products, quantities, prices
- [x] Display payment summary with subtotal, credit, total
- [x] Add close button
- [x] Make responsive for mobile devices
- [x] Add loading and error states
- [ ] Write component tests

**Files to Create:**
- `frontend/src/components/invoices/CustomerInvoiceDetailModal.tsx` ✅
- `frontend/src/components/invoices/CustomerInvoiceDetailModal.test.tsx`

### Task 7: Add PDF Download to Customer Invoice View
**Priority:** P0  
**Estimated Time:** 2 hours  
**Dependencies:** Task 6

**Description:**
Add PDF download functionality to customer invoice views.

**Acceptance Criteria:**
- [x] Add download button to invoice table rows
- [x] Add download button to invoice detail modal
- [x] Implement PDF download using custom hook
- [x] Show loading indicator during download
- [x] Display error message on download failure
- [x] Format filename as "invoice-{id}.pdf"
- [ ] Write component tests

**Files Created:**
- `frontend/src/hooks/useInvoicePDF.ts` ✅

**Files to Modify:**
- `frontend/src/pages/ProfilePage.tsx` ✅
- `frontend/src/components/invoices/CustomerInvoiceDetailModal.tsx` ✅
- `frontend/src/pages/ProfilePage.test.tsx`

### Task 8: Create Payment History Component for Customers
**Priority:** P1  
**Estimated Time:** 2.5 hours  
**Dependencies:** Task 3

**Description:**
Create a reusable payment history table component and integrate it into the customer profile page.

**Acceptance Criteria:**
- [ ] Create PaymentHistoryTable component
- [ ] Display columns: date, amount, method, invoice, notes
- [ ] Format currency and dates consistently
- [ ] Show empty state when no payments exist
- [ ] Make responsive for mobile devices
- [ ] Add to ProfilePage below invoice history
- [ ] Write component tests

**Files to Create:**
- `frontend/src/components/payments/PaymentHistoryTable.tsx`
- `frontend/src/components/payments/PaymentHistoryTable.test.tsx`

**Files to Modify:**
- `frontend/src/pages/ProfilePage.tsx`
- `frontend/src/hooks/useCustomer.ts`

### Task 9: Add Overdue Invoice Indicators
**Priority:** P1  
**Estimated Time:** 1.5 hours  
**Dependencies:** None

**Description:**
Add visual indicators for overdue invoices in the customer invoice list.

**Acceptance Criteria:**
- [ ] Create utility function to check if invoice is overdue
- [ ] Create utility function to calculate days overdue
- [ ] Add red "OVERDUE" badge to overdue invoices
- [ ] Display days overdue in badge
- [ ] Sort overdue invoices to top of table
- [ ] Write utility function tests

**Files to Modify:**
- `frontend/src/pages/ProfilePage.tsx`
- `frontend/src/lib/utils.ts`
- `frontend/src/lib/utils.test.ts`

---

## Frontend - Admin Tasks

### Task 10: Display Customer Names in Invoice Tables
**Priority:** P0  
**Estimated Time:** 2 hours  
**Dependencies:** Task 2

**Description:**
Replace customer IDs with customer names in all admin invoice tables.

**Acceptance Criteria:**
- [ ] Update InvoicesManagement to display customer names
- [ ] Update PaymentsManagement to display customer names
- [ ] Truncate long names (>30 chars) with ellipsis
- [ ] Add tooltip showing full name on hover
- [ ] Ensure data loads efficiently
- [ ] Update component tests

**Files to Modify:**
- `frontend/src/pages/admin/InvoicesManagement.tsx`
- `frontend/src/pages/admin/PaymentsManagement.tsx`
- `frontend/src/hooks/useAdminInvoices.ts`

### Task 11: Add Customer Name Filter to Invoice Management
**Priority:** P0  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 2, Task 10

**Description:**
Add customer name search filter to the admin invoice management page.

**Acceptance Criteria:**
- [ ] Add customer name input field to filters section
- [ ] Implement debounced search (300ms)
- [ ] Filter invoices by partial name match
- [ ] Make case-insensitive
- [ ] Work with existing filters
- [ ] Write component tests

**Files to Modify:**
- `frontend/src/pages/admin/InvoicesManagement.tsx`
- `frontend/src/hooks/useAdminInvoices.ts`

### Task 12: Enhance Admin Invoice Detail Modal
**Priority:** P0  
**Estimated Time:** 2.5 hours  
**Dependencies:** Task 1, Task 3

**Description:**
Enhance the existing admin invoice detail modal with payment history and additional actions.

**Acceptance Criteria:**
- [ ] Add payments section to modal
- [ ] Display payment history table
- [ ] Show total paid and remaining balance
- [ ] Display customer name instead of ID
- [ ] Add "Record Payment" button
- [ ] Add "Email Invoice" button
- [ ] Write component tests

**Files to Modify:**
- `frontend/src/pages/admin/InvoicesManagement.tsx`
- `frontend/src/components/invoices/AdminInvoiceDetailModal.tsx` (if extracted)

### Task 13: Add Inline Payment Recording
**Priority:** P1  
**Estimated Time:** 2 hours  
**Dependencies:** Task 12

**Description:**
Enable payment recording directly from invoice table rows.

**Acceptance Criteria:**
- [ ] Add "Record Payment" button to invoice table actions
- [ ] Pre-fill invoice and customer in payment modal
- [ ] Refresh invoice table after payment recorded
- [ ] Display success message
- [ ] Handle errors gracefully
- [ ] Write component tests

**Files to Modify:**
- `frontend/src/pages/admin/InvoicesManagement.tsx`
- `frontend/src/pages/admin/PaymentsManagement.tsx`

### Task 14: Create Invoice Summary Cards
**Priority:** P1  
**Estimated Time:** 3 hours  
**Dependencies:** Task 5

**Description:**
Create summary statistics cards for the admin invoice management page.

**Acceptance Criteria:**
- [ ] Create InvoiceSummaryCards component
- [ ] Display total outstanding invoices and amount
- [ ] Display total overdue invoices and amount
- [ ] Display total paid invoices and amount
- [ ] Display average invoice value
- [ ] Update cards when filters change
- [ ] Use color coding (green/red/yellow)
- [ ] Add icons for visual clarity
- [ ] Make responsive
- [ ] Write component tests

**Files to Create:**
- `frontend/src/components/invoices/InvoiceSummaryCards.tsx`
- `frontend/src/components/invoices/InvoiceSummaryCards.test.tsx`

**Files to Modify:**
- `frontend/src/pages/admin/InvoicesManagement.tsx`

### Task 15: Create Email Invoice Modal
**Priority:** P1  
**Estimated Time:** 2.5 hours  
**Dependencies:** Task 4

**Description:**
Create modal for sending invoice PDFs via email.

**Acceptance Criteria:**
- [ ] Create EmailInvoiceModal component
- [ ] Display customer email (pre-filled)
- [ ] Allow custom message input
- [ ] Show email preview
- [ ] Validate email address
- [ ] Display sending progress
- [ ] Show success/error feedback
- [ ] Write component tests

**Files to Create:**
- `frontend/src/components/invoices/EmailInvoiceModal.tsx`
- `frontend/src/components/invoices/EmailInvoiceModal.test.tsx`
- `frontend/src/hooks/useInvoiceEmail.ts`

**Files to Modify:**
- `frontend/src/pages/admin/InvoicesManagement.tsx`

### Task 16: Add Email Invoice Action to Table
**Priority:** P1  
**Estimated Time:** 1 hour  
**Dependencies:** Task 15

**Description:**
Add email invoice button to admin invoice table actions.

**Acceptance Criteria:**
- [ ] Add "Email" button to invoice table actions
- [ ] Open EmailInvoiceModal on click
- [ ] Pass invoice and customer data to modal
- [ ] Refresh table after email sent
- [ ] Display success message
- [ ] Write component tests

**Files to Modify:**
- `frontend/src/pages/admin/InvoicesManagement.tsx`

---

## Testing Tasks

### Task 17: Backend Integration Tests
**Priority:** P0  
**Estimated Time:** 3 hours  
**Dependencies:** Tasks 1-5

**Description:**
Write integration tests for enhanced invoice and payment endpoints.

**Acceptance Criteria:**
- [ ] Test invoice fetching with payments and customer details
- [ ] Test customer name filtering
- [ ] Test payment history endpoints
- [ ] Test invoice email sending
- [ ] Test invoice statistics calculation
- [ ] Test authorization for all endpoints
- [ ] Achieve >90% code coverage

**Files to Create:**
- `backend/src/tests/integration/invoice.integration.test.ts`
- `backend/src/tests/integration/payment.integration.test.ts`

### Task 18: Frontend Component Tests
**Priority:** P0  
**Estimated Time:** 4 hours  
**Dependencies:** Tasks 6-16

**Description:**
Write comprehensive tests for all new and modified components.

**Acceptance Criteria:**
- [ ] Test CustomerInvoiceDetailModal rendering and interactions
- [ ] Test PaymentHistoryTable with various data states
- [ ] Test InvoiceSummaryCards calculations
- [ ] Test EmailInvoiceModal form validation and submission
- [ ] Test overdue invoice indicators
- [ ] Test customer name display and filtering
- [ ] Achieve >85% component coverage

**Files to Create/Modify:**
- Various test files alongside components

### Task 19: E2E Tests for Customer Invoice Flow
**Priority:** P1  
**Estimated Time:** 2 hours  
**Dependencies:** Tasks 6-9

**Description:**
Create end-to-end tests for customer invoice viewing and interaction.

**Acceptance Criteria:**
- [ ] Test viewing invoice list
- [ ] Test opening invoice detail modal
- [ ] Test downloading invoice PDF
- [ ] Test viewing payment history
- [ ] Test overdue invoice display
- [ ] Test mobile responsive behavior

**Files to Create:**
- `frontend/src/tests/e2e/customer-invoices.e2e.test.ts`

### Task 20: E2E Tests for Admin Invoice Management
**Priority:** P1  
**Estimated Time:** 2.5 hours  
**Dependencies:** Tasks 10-16

**Description:**
Create end-to-end tests for admin invoice management workflow.

**Acceptance Criteria:**
- [ ] Test filtering invoices by customer name
- [ ] Test viewing invoice with payment history
- [ ] Test recording payment inline
- [ ] Test sending invoice email
- [ ] Test summary statistics display
- [ ] Test error handling scenarios

**Files to Create:**
- `frontend/src/tests/e2e/admin-invoices.e2e.test.ts`

---

## Documentation Tasks

### Task 21: Update API Documentation
**Priority:** P2  
**Estimated Time:** 1.5 hours  
**Dependencies:** Tasks 1-5

**Description:**
Document all new and modified API endpoints.

**Acceptance Criteria:**
- [ ] Document enhanced invoice endpoints
- [ ] Document payment history endpoints
- [ ] Document invoice email endpoint
- [ ] Include request/response examples
- [ ] Document query parameters
- [ ] Document error responses

**Files to Create/Modify:**
- `backend/docs/api/invoices.md`
- `backend/docs/api/payments.md`

### Task 22: Create User Guide for Customers
**Priority:** P2  
**Estimated Time:** 1 hour  
**Dependencies:** Tasks 6-9

**Description:**
Create user guide for customer invoice features.

**Acceptance Criteria:**
- [ ] Document how to view invoice details
- [ ] Document how to download invoice PDFs
- [ ] Document how to view payment history
- [ ] Explain overdue invoice indicators
- [ ] Include screenshots
- [ ] Write in clear, simple language

**Files to Create:**
- `docs/user-guides/customer-invoices.md`

### Task 23: Create User Guide for Admins
**Priority:** P2  
**Estimated Time:** 1.5 hours  
**Dependencies:** Tasks 10-16

**Description:**
Create user guide for admin invoice management features.

**Acceptance Criteria:**
- [ ] Document how to filter invoices by customer
- [ ] Document how to view invoice details with payments
- [ ] Document how to record payments inline
- [ ] Document how to email invoices
- [ ] Explain summary statistics
- [ ] Include screenshots
- [ ] Write clear instructions

**Files to Create:**
- `docs/user-guides/admin-invoice-management.md`

---

## Implementation Order

### Phase 1: Core Backend (Week 1)
1. Task 1: Enhance Invoice Service with Payment Details
2. Task 2: Add Customer Name Filtering
3. Task 3: Create Payment History Endpoints
4. Task 17: Backend Integration Tests

### Phase 2: Customer Features (Week 2)
5. Task 6: Create Customer Invoice Detail Modal
6. Task 7: Add PDF Download to Customer View
7. Task 8: Create Payment History Component
8. Task 9: Add Overdue Invoice Indicators
9. Task 19: E2E Tests for Customer Flow

### Phase 3: Admin Features Part 1 (Week 3)
10. Task 10: Display Customer Names in Tables
11. Task 11: Add Customer Name Filter
12. Task 12: Enhance Admin Invoice Detail Modal
13. Task 13: Add Inline Payment Recording

### Phase 4: Admin Features Part 2 (Week 4)
14. Task 4: Implement Invoice Email Service
15. Task 5: Add Invoice Statistics Calculation
16. Task 14: Create Invoice Summary Cards
17. Task 15: Create Email Invoice Modal
18. Task 16: Add Email Invoice Action
19. Task 20: E2E Tests for Admin Flow

### Phase 5: Testing & Documentation (Week 5)
20. Task 18: Frontend Component Tests
21. Task 21: Update API Documentation
22. Task 22: Create Customer User Guide
23. Task 23: Create Admin User Guide

---

## Success Metrics

### Technical Metrics
- [ ] All tests passing (>90% backend coverage, >85% frontend coverage)
- [ ] No critical bugs in production
- [ ] API response times <500ms for invoice queries
- [ ] PDF generation <2 seconds
- [ ] Email delivery success rate >95%

### User Experience Metrics
- [ ] Customer invoice view time reduced by 30%
- [ ] Admin payment recording time reduced by 40%
- [ ] Invoice email delivery time reduced by 50%
- [ ] User satisfaction score >4.5/5

### Business Metrics
- [ ] Reduction in customer invoice inquiries by 25%
- [ ] Faster payment processing by 35%
- [ ] Improved cash flow visibility
- [ ] Reduced manual email sending time by 60%

---

## Risk Assessment

### High Risk
- **Email Service Integration**: May require additional configuration or third-party service setup
  - Mitigation: Test thoroughly in staging, have fallback manual process

### Medium Risk
- **Performance with Large Data Sets**: Invoice queries with customer names may be slow
  - Mitigation: Add database indexes, implement pagination, cache customer data

- **PDF Generation Load**: Multiple simultaneous PDF downloads could impact server
  - Mitigation: Implement rate limiting, consider async PDF generation

### Low Risk
- **UI Complexity**: Modal components may become complex
  - Mitigation: Break into smaller sub-components, maintain clear separation of concerns

---

## Notes

- All tasks should follow existing code style and patterns
- Use TypeScript strict mode for all new code
- Ensure mobile responsiveness for all UI components
- Follow accessibility guidelines (WCAG 2.1 AA)
- Add proper error handling and logging
- Update relevant documentation as you go
- Commit frequently with clear messages
- Create pull requests for each phase
