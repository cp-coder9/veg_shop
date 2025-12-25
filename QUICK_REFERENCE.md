# Quick Reference Guide

Fast reference for common tasks in the Organic Vegetable Order Management System.

---

## Daily Tasks

### Check New Orders
```
Dashboard → Orders → Filter: Status = Pending
```

### Update Order Status
```
Orders → Click Order → Select Status → Auto-saves
```

### Record Payment
```
Payments → Record Payment → Select Customer → Select Invoice → Enter Amount → Save
```

### Generate Invoice
```
Orders → Find Delivered Order → Click "Generate Invoice"
```

---

## Weekly Tasks

### Generate Bulk Order (Friday)
```
Orders → Generate Bulk Order → Select Week → Copy WhatsApp/Email Format
```

### Send Product List (Monday)
```
Notifications → Send Product List → Select Customers → Choose Method → Send
```

### Generate Packing Lists
```
Packing Lists → Select Delivery Date → Generate PDF → Print
```

### Send Payment Reminders
```
Reports → Payments Tab → Identify Outstanding → Notifications → Send Payment Reminder
```

---

## Product Management

### Add Product
```
Products → Add Product → Fill Details:
- Name, Price, Category, Unit
- Description (optional)
- Available ✓, Seasonal ✓
→ Save
```

### Edit Product
```
Products → Find Product → Edit Icon → Update → Save
```

### Generate WhatsApp List
```
Products → Generate WhatsApp List → Copy → Send to Customers
```

---

## Order Processing

### View Order Details
```
Orders → Click Order → See Full Details
```

### Filter Orders
```
Orders → Use Filters:
- Delivery Date
- Status
- Customer
```

### Bulk Order Format
```
Tomatoes (kg): 45.5 (41.5 + 10% buffer)
  - Customer 1: 5 kg
  - Customer 2: 10 kg
```

---

## Invoice Management

### Generate Invoice
```
Orders → Delivered Order → Generate Invoice
→ Auto-applies credits
→ Generates PDF
→ Sends notification
```

### Download Invoice PDF
```
Invoices → Click Invoice → Download PDF
```

### Check Invoice Status
```
Invoices → Filter by Status:
- Unpaid
- Partial
- Paid
```

---

## Payment Recording

### Record Cash Payment
```
Payments → Record Payment
- Customer: Select
- Invoice: Select
- Amount: Enter
- Method: Cash
- Date: Today
→ Save
```

### Record Yoco Payment
```
Same as above, Method: Yoco
```

### Record EFT Payment
```
Same as above, Method: EFT
Add reference in Notes
```

### What Happens Automatically
- Invoice status updates
- Overpayment creates credit
- Customer notified

---

## Credit Management

### Record Short Delivery
```
Credits → Record Short Delivery
- Order: Select
- Products: Select items short
- Quantity Short: Enter
→ Auto-calculates credit
→ Adds to customer balance
→ Save
```

### View Customer Credits
```
Customers → Select Customer → Credits Tab
```

### Check Credit Balance
```
Customer Profile → Credit Balance (top)
```

---

## Notifications

### Send Product List
```
Notifications → Send Product List
→ Select All Customers
→ Choose WhatsApp/Email
→ Send
```

### Send Payment Reminder
```
Notifications → Send Payment Reminder
→ Select Customer
→ Shows outstanding invoices
→ Choose method
→ Send
```

### View Notification History
```
Notifications → History Tab
→ See status (Sent/Failed/Pending)
```

---

## Reports

### Sales Report
```
Reports → Sales Tab
→ Select Date Range
→ View revenue, orders, products
→ Export CSV
```

### Outstanding Payments
```
Reports → Payments Tab
→ See customers with outstanding balances
→ Last payment dates
```

### Product Popularity
```
Reports → Products Tab
→ Most ordered products
→ Revenue per product
```

### Customer Activity
```
Reports → Customers Tab
→ Order count per customer
→ Total spent
→ Last order date
```

---

## Customer Management

### View Customer Profile
```
Customers → Click Customer
→ See tabs: Info, Orders, Invoices, Payments, Credits
```

### Edit Customer Info
```
Customer Profile → Edit
→ Update name, contact, address
→ Save
```

### View Customer History
```
Customer Profile → Orders Tab
→ See all orders with dates and totals
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search | Ctrl/Cmd + K |
| New Order | Ctrl/Cmd + N |
| Save | Ctrl/Cmd + S |
| Close Modal | Esc |
| Navigate Back | Alt + ← |

---

## Common Filters

### Orders
- **Status**: Pending, Confirmed, Delivered, Cancelled
- **Delivery Date**: Select date
- **Customer**: Type to search

### Invoices
- **Status**: Unpaid, Partial, Paid
- **Customer**: Type to search
- **Date Range**: From/To dates

### Products
- **Category**: All, Vegetables, Fruits, Dairy, Bread, Pantry, Meat
- **Availability**: Available, Unavailable
- **Seasonal**: All, Seasonal Only

---

## Status Meanings

### Order Status
- **Pending**: Just placed, needs confirmation
- **Confirmed**: Confirmed, being prepared
- **Delivered**: Completed
- **Cancelled**: Cancelled

### Invoice Status
- **Unpaid**: No payments received
- **Partial**: Some payment received
- **Paid**: Fully paid

### Payment Methods
- **Cash**: Cash payment
- **Yoco**: Card payment via Yoco
- **EFT**: Electronic bank transfer

---

## Quick Calculations

### Bulk Order Buffer
```
Ordered Quantity × 1.10 = Total to Order
Example: 50 kg × 1.10 = 55 kg
```

### Credit from Short Delivery
```
Quantity Short × Product Price = Credit Amount
Example: 2 kg × R25.50 = R51.00 credit
```

### Invoice Total
```
Subtotal - Credits Applied = Total Due
Example: R200 - R50 = R150 due
```

---

## Troubleshooting Quick Fixes

### Customer Can't Login
1. Verify contact info correct
2. Check verification code sent
3. Resend code if expired

### Invoice Wrong Amount
1. Check order items
2. Verify credits applied
3. Regenerate if needed

### Payment Not Showing
1. Refresh page
2. Check payment history
3. Verify invoice selected

### Notification Not Sent
1. Check notification history
2. Verify customer contact info
3. Resend manually

---

## Emergency Contacts

### Technical Support
- **Email**: tech@organicveg.com
- **Phone**: +27123456789
- **Hours**: Mon-Fri, 8 AM - 5 PM

### System Issues
1. Check internet connection
2. Clear browser cache
3. Try different browser
4. Contact tech support

---

## Best Practices

### ✅ Do
- Update order status promptly
- Record payments same day
- Generate invoices after delivery
- Send weekly product lists
- Check reports regularly
- Keep customer info updated

### ❌ Don't
- Delete products in active orders
- Record payments on wrong invoice
- Forget to apply credits
- Skip order confirmations
- Ignore outstanding payments

---

## Data Entry Standards

### Phone Numbers
```
Format: +27123456789
Include country code
No spaces or dashes
```

### Prices
```
Format: 25.50
Two decimal places
No currency symbol
```

### Dates
```
Format: YYYY-MM-DD
Example: 2025-11-11
```

### Product Names
```
Format: Proper Case
Example: "Organic Tomatoes"
Not: "organic tomatoes" or "ORGANIC TOMATOES"
```

---

## Backup Reminders

### Daily
- System auto-backs up database
- Check backup logs

### Weekly
- Verify backups successful
- Test restore if needed

### Monthly
- Full system backup
- Archive old data

---

**Print this guide and keep it handy! 📋**

**Last Updated**: November 2025
