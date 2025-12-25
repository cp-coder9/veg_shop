# End-to-End Test Scenarios

## Overview
This document outlines comprehensive end-to-end test scenarios for the Organic Vegetable Order Management System. These tests validate complete user workflows from start to finish.

## Test Environment Setup

### Prerequisites
- Backend server running on http://localhost:3000
- Frontend server running on http://localhost:5173
- PostgreSQL database seeded with test data
- Test admin user: admin@test.com
- Test customer users: customer1@test.com, customer2@test.com

### Test Data Requirements
- At least 10 products across different categories
- At least 2 customer accounts
- 1 admin account
- Clean database state before each test suite

---

## 17.1 Complete Customer Order Flow

### Test Case 1.1: Customer Registration and Login
**Objective:** Verify new customer can register and login successfully

**Steps:**
1. Navigate to login page
2. Enter phone number or email
3. Click "Send Verification Code"
4. Verify code is sent (check logs/mock)
5. Enter 6-digit verification code
6. Click "Verify"
7. Verify redirect to products page
8. Verify JWT token stored in localStorage
9. Verify user profile created in database

**Expected Results:**
- ✓ Verification code sent successfully
- ✓ User authenticated and redirected
- ✓ Token stored and valid
- ✓ User can access protected routes

**Status:** ⏳ Pending

---

### Test Case 1.2: Browse Products by Category
**Objective:** Verify customer can view and filter products

**Steps:**
1. Login as customer
2. Navigate to products page
3. Verify products displayed grouped by category
4. Verify each product shows: name, price, unit, image
5. Verify seasonal products have badge
6. Verify unavailable products are hidden
7. Test category filtering
8. Test search functionality (if implemented)

**Expected Results:**
- ✓ All available products displayed
- ✓ Products grouped correctly by category
- ✓ Product information accurate
- ✓ Seasonal badges visible
- ✓ Unavailable products not shown

**Status:** ⏳ Pending

---

### Test Case 1.3: Add Products to Cart
**Objective:** Verify customer can add products to cart with quantities

**Steps:**
1. Login as customer
2. Navigate to products page
3. Click "Add to Cart" on multiple products
4. Adjust quantities using +/- buttons
5. Verify cart icon shows item count
6. Navigate to cart page
7. Verify all added products appear
8. Verify quantities match selections
9. Verify prices calculated correctly
10. Verify cart total is accurate

**Expected Results:**
- ✓ Products added to cart successfully
- ✓ Quantities adjustable
- ✓ Cart count updates in real-time
- ✓ Cart persists across page navigation
- ✓ Calculations accurate

**Status:** ⏳ Pending

---

### Test Case 1.4: Complete Checkout Process
**Objective:** Verify customer can complete order placement

**Steps:**
1. Login as customer with items in cart
2. Navigate to cart page
3. Click "Proceed to Checkout"
4. Select delivery date (Monday/Wednesday/Friday)
5. Enter delivery address
6. Add special instructions
7. Review order summary
8. Click "Place Order"
9. Verify order confirmation displayed
10. Verify order appears in order history
11. Verify cart is cleared
12. Verify order stored in database with correct status

**Expected Results:**
- ✓ Delivery date selector shows only valid days
- ✓ Form validation works correctly
- ✓ Order submitted successfully
- ✓ Confirmation message displayed
- ✓ Order appears in history
- ✓ Cart cleared after order
- ✓ Database record created correctly

**Status:** ⏳ Pending

---

### Test Case 1.5: View Order History
**Objective:** Verify customer can view their order history

**Steps:**
1. Login as customer with previous orders
2. Navigate to orders page
3. Verify all orders displayed
4. Verify order information: date, status, total
5. Click on an order to view details
6. Verify order items displayed correctly
7. Verify delivery information shown
8. Verify invoice status visible

**Expected Results:**
- ✓ All customer orders displayed
- ✓ Order information accurate
- ✓ Order details accessible
- ✓ Status updates reflected
- ✓ Invoice links work (if generated)

**Status:** ⏳ Pending

---

## 17.2 Complete Admin Order Processing Flow

### Test Case 2.1: Admin Login
**Objective:** Verify admin can login and access admin dashboard

**Steps:**
1. Navigate to login page
2. Enter admin credentials
3. Complete verification
4. Verify redirect to admin dashboard
5. Verify admin navigation menu visible
6. Verify admin-only features accessible

**Expected Results:**
- ✓ Admin authenticated successfully
- ✓ Admin dashboard accessible
- ✓ Admin navigation displayed
- ✓ Customer routes not accessible

**Status:** ⏳ Pending

---

### Test Case 2.2: View and Filter Orders
**Objective:** Verify admin can view and filter customer orders

**Steps:**
1. Login as admin
2. Navigate to orders page
3. Verify all orders displayed in table
4. Filter by delivery date
5. Filter by order status
6. Filter by customer
7. Click on order to view details
8. Verify order items, customer info, totals displayed

**Expected Results:**
- ✓ All orders visible to admin
- ✓ Filters work correctly
- ✓ Order details complete
- ✓ Customer information displayed

**Status:** ⏳ Pending

---

### Test Case 2.3: Update Order Status
**Objective:** Verify admin can update order status

**Steps:**
1. Login as admin
2. Navigate to orders page
3. Select an order with "pending" status
4. Change status to "confirmed"
5. Verify status updated in UI
6. Verify status updated in database
7. Change status to "packed"
8. Change status to "delivered"
9. Verify status history tracked

**Expected Results:**
- ✓ Status dropdown functional
- ✓ Status updates immediately
- ✓ Database reflects changes
- ✓ Status transitions valid

**Status:** ⏳ Pending

---

### Test Case 2.4: Generate Invoice
**Objective:** Verify admin can generate invoice from order

**Steps:**
1. Login as admin
2. Navigate to orders page
3. Select order without invoice
4. Click "Generate Invoice"
5. Verify invoice created
6. Verify invoice appears in invoices list
7. Verify invoice totals calculated correctly
8. Verify credit balance applied (if customer has credits)
9. Download invoice PDF
10. Verify PDF format and content

**Expected Results:**
- ✓ Invoice generated successfully
- ✓ Calculations accurate
- ✓ Credits applied automatically
- ✓ PDF generated correctly
- ✓ Invoice linked to order

**Status:** ⏳ Pending

---

### Test Case 2.5: Record Payment
**Objective:** Verify admin can record payment against invoice

**Steps:**
1. Login as admin
2. Navigate to invoices or payments page
3. Select unpaid invoice
4. Click "Record Payment"
5. Enter payment amount
6. Select payment method (Cash/Yoco/EFT)
7. Add payment notes
8. Submit payment
9. Verify invoice status updated
10. Verify payment appears in payment history
11. Test overpayment scenario (amount > invoice total)
12. Verify credit created for overpayment

**Expected Results:**
- ✓ Payment recorded successfully
- ✓ Invoice status updated (partial/paid)
- ✓ Payment method stored
- ✓ Overpayment creates credit
- ✓ Credit balance updated

**Status:** ⏳ Pending

---

## 17.3 Payment and Credit Management Flow

### Test Case 3.1: Overpayment Credit Creation
**Objective:** Verify overpayment automatically creates credit

**Steps:**
1. Login as admin
2. Create invoice for R100
3. Record payment of R150
4. Verify invoice marked as "paid"
5. Verify R50 credit created
6. Navigate to customer profile
7. Verify credit balance shows R50
8. Verify credit appears in credit history

**Expected Results:**
- ✓ Overpayment detected
- ✓ Credit created automatically
- ✓ Credit amount correct (R50)
- ✓ Credit visible in customer profile
- ✓ Credit type marked as "overpayment"

**Status:** ⏳ Pending

---

### Test Case 3.2: Credit Application to New Invoice
**Objective:** Verify existing credits applied to new invoices

**Steps:**
1. Ensure customer has R50 credit balance
2. Create new order for R100
3. Generate invoice
4. Verify credit automatically applied
5. Verify invoice subtotal: R100
6. Verify credit applied: R50
7. Verify invoice total: R50
8. Verify customer credit balance now R0

**Expected Results:**
- ✓ Credit applied automatically
- ✓ Invoice calculations correct
- ✓ Credit balance reduced
- ✓ Invoice shows credit breakdown

**Status:** ⏳ Pending

---

### Test Case 3.3: Short Delivery Credit
**Objective:** Verify short delivery creates credit correctly

**Steps:**
1. Login as admin
2. Navigate to short delivery form
3. Select completed order
4. Select product that was short
5. Enter quantity short (e.g., 2kg)
6. Submit short delivery
7. Verify credit calculated based on product price
8. Verify credit added to customer balance
9. Verify short delivery appears in history
10. Verify credit type marked as "short_delivery"

**Expected Results:**
- ✓ Short delivery recorded
- ✓ Credit calculated correctly
- ✓ Credit added to balance
- ✓ History maintained
- ✓ Reason documented

**Status:** ⏳ Pending

---

### Test Case 3.4: Multiple Credits Accumulation
**Objective:** Verify multiple credits accumulate correctly

**Steps:**
1. Customer starts with R0 credit
2. Record overpayment creating R30 credit
3. Record short delivery creating R20 credit
4. Verify total credit balance: R50
5. Create invoice for R100
6. Verify R50 credit applied
7. Verify remaining invoice total: R50
8. Verify credit balance now R0

**Expected Results:**
- ✓ Credits accumulate correctly
- ✓ All credit types tracked
- ✓ Application uses oldest credits first
- ✓ Balance calculations accurate

**Status:** ⏳ Pending

---

## 17.4 Notification Sending

### Test Case 4.1: Send Product List via WhatsApp
**Objective:** Verify product list can be sent to customers

**Steps:**
1. Login as admin
2. Navigate to notifications page
3. Click "Send Product List"
4. Select customers (or all)
5. Preview WhatsApp message format
6. Verify products grouped by category
7. Verify prices and units included
8. Send notification
9. Verify notification status tracked
10. Check WhatsApp API logs (or mock)

**Expected Results:**
- ✓ Product list formatted correctly
- ✓ Categories grouped properly
- ✓ Message sent successfully
- ✓ Notification logged
- ✓ Status tracked (sent/failed)

**Status:** ⏳ Pending

---

### Test Case 4.2: Send Payment Reminder
**Objective:** Verify payment reminders sent correctly

**Steps:**
1. Login as admin
2. Create unpaid invoice past due date
3. Navigate to notifications page
4. Click "Send Payment Reminder"
5. Select customer with outstanding balance
6. Preview reminder message
7. Verify invoice details included
8. Verify amount due shown
9. Send reminder
10. Verify notification logged

**Expected Results:**
- ✓ Reminder identifies overdue invoices
- ✓ Message includes invoice details
- ✓ Amount due accurate
- ✓ Sent via preferred method
- ✓ Notification tracked

**Status:** ⏳ Pending

---

### Test Case 4.3: Order Confirmation Notification
**Objective:** Verify order confirmation sent automatically

**Steps:**
1. Login as customer
2. Place new order
3. Complete checkout
4. Verify order confirmation displayed
5. Check notification logs
6. Verify confirmation sent to customer
7. Verify order details included
8. Verify delivery date shown

**Expected Results:**
- ✓ Confirmation sent automatically
- ✓ Order details accurate
- ✓ Delivery information included
- ✓ Sent via customer's preferred method

**Status:** ⏳ Pending

---

## 17.5 Bulk Order and Packing Lists

### Test Case 5.1: Generate Bulk Order
**Objective:** Verify bulk order consolidation works correctly

**Steps:**
1. Create multiple customer orders with overlapping products
2. Login as admin
3. Navigate to orders page
4. Click "Generate Bulk Order"
5. Select week date range
6. Verify products aggregated correctly
7. Verify quantities summed
8. Verify buffer percentage applied
9. Verify contributing orders tracked
10. Export for WhatsApp/Email
11. Verify format suitable for supplier

**Expected Results:**
- ✓ All orders included in date range
- ✓ Products aggregated correctly
- ✓ Quantities accurate
- ✓ Buffer applied
- ✓ Format suitable for suppliers

**Status:** ⏳ Pending

---

### Test Case 5.2: Generate Packing Lists
**Objective:** Verify packing lists generated correctly

**Steps:**
1. Create orders for specific delivery date
2. Login as admin
3. Navigate to packing lists page
4. Select delivery date
5. Verify all orders for that date shown
6. Sort by customer name
7. Sort by route (if implemented)
8. Generate PDF for all packing lists
9. Download and verify PDF
10. Verify each packing list includes:
    - Customer name
    - Delivery address
    - Product list with quantities
    - Special instructions

**Expected Results:**
- ✓ Packing lists generated for date
- ✓ All orders included
- ✓ Sorting works correctly
- ✓ PDF format print-ready
- ✓ All information complete

**Status:** ⏳ Pending

---

## 17.6 Reporting

### Test Case 6.1: Sales Report
**Objective:** Verify sales report generates correctly

**Steps:**
1. Login as admin
2. Navigate to reports page
3. Select "Sales Report"
4. Set date range (e.g., last 7 days)
5. Generate report
6. Verify total revenue calculated
7. Verify total orders counted
8. Verify products sold breakdown
9. Verify quantities and revenue per product
10. Export report (if implemented)

**Expected Results:**
- ✓ Report generates successfully
- ✓ Calculations accurate
- ✓ Date range filtering works
- ✓ Product breakdown detailed
- ✓ Visual charts display (if implemented)

**Status:** ⏳ Pending

---

### Test Case 6.2: Payment Status Report
**Objective:** Verify payment status report accurate

**Steps:**
1. Login as admin
2. Navigate to reports page
3. Select "Payment Status Report"
4. Generate report
5. Verify total outstanding balance
6. Verify customer breakdown
7. Verify last payment dates shown
8. Identify customers with overdue payments
9. Verify calculations match invoice data

**Expected Results:**
- ✓ Outstanding balances accurate
- ✓ All customers included
- ✓ Payment dates correct
- ✓ Overdue invoices highlighted

**Status:** ⏳ Pending

---

## Test Execution Summary

### Completion Checklist
- [ ] All test cases executed
- [ ] All critical bugs fixed
- [ ] Performance acceptable
- [ ] Mobile responsiveness verified
- [ ] External integrations tested
- [ ] Documentation complete

### Test Results Template
```
Test Case: [ID]
Status: [Pass/Fail/Blocked]
Executed By: [Name]
Date: [Date]
Notes: [Any issues or observations]
```

### Known Issues Log
Document any issues found during testing:
1. Issue description
2. Severity (Critical/High/Medium/Low)
3. Steps to reproduce
4. Expected vs actual behavior
5. Status (Open/In Progress/Fixed)

---

## Next Steps After Testing

1. Fix all critical and high-severity bugs
2. Retest failed scenarios
3. Perform regression testing
4. Update user documentation based on findings
5. Prepare for production deployment
