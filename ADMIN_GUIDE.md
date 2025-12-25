# Admin User Guide

Complete guide for managing the Organic Vegetable Order Management System.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Product Management](#product-management)
3. [Order Processing](#order-processing)
4. [Invoice Management](#invoice-management)
5. [Payment Recording](#payment-recording)
6. [Credit Management](#credit-management)
7. [Packing Lists](#packing-lists)
8. [Notifications](#notifications)
9. [Reports](#reports)
10. [Customer Management](#customer-management)

---

## Getting Started

### Login

1. Navigate to the admin login page
2. Enter your admin email or phone number
3. Receive and enter the verification code
4. Access the admin dashboard

### Dashboard Overview

The dashboard shows:
- Total orders this week
- Pending orders requiring action
- Outstanding payments
- Recent activity

---

## Product Management

### View Products

1. Click "Products" in the sidebar
2. See all products with:
   - Name, price, category, unit
   - Availability status
   - Seasonal flag
3. Use filters to find products:
   - Filter by category
   - Filter by availability
   - Search by name

### Add New Product

1. Click "Add Product" button
2. Fill in product details:
   - **Name**: Product name (e.g., "Organic Tomatoes")
   - **Price**: Price per unit (e.g., 25.50)
   - **Category**: Select from dropdown
     - Vegetables
     - Fruits
     - Dairy & Eggs
     - Bread & Bakery
     - Pantry Items
     - Meat & Protein
   - **Unit**: kg, piece, bunch, pack, litre, dozen
   - **Description**: Optional product description
   - **Image URL**: Optional product image
   - **Available**: Check if currently available
   - **Seasonal**: Check if seasonal item
3. Click "Save"

### Edit Product

1. Find the product in the list
2. Click the edit icon
3. Update any fields
4. Click "Save"

**Note**: Price changes are automatically tracked in price history.

### Delete Product

1. Find the product in the list
2. Click the delete icon
3. Confirm deletion

**Warning**: Cannot delete products that are in existing orders.

### Generate WhatsApp Product List

1. Click "Generate WhatsApp List" button
2. Products are grouped by category
3. Copy the formatted text
4. Send to customers via WhatsApp or email

**Format**:
```
🌱 *Weekly Product List* 🌱

*🥕 Vegetables*
• Tomatoes - R25.50/kg
• Lettuce - R15.00/piece 🌟

*🍎 Fruits*
• Apples - R30.00/kg
...

🌟 = Seasonal item
Place your order by Friday!
```

---

## Order Processing

### View Orders

1. Click "Orders" in the sidebar
2. See all orders with:
   - Order number
   - Customer name
   - Delivery date
   - Status
   - Total amount
3. Filter orders by:
   - Delivery date
   - Status (Pending, Confirmed, Delivered)
   - Customer

### View Order Details

1. Click on any order
2. See complete details:
   - Customer information
   - Delivery method and address
   - Special instructions
   - Itemized products with quantities
   - Order total
   - Invoice status
   - Payment status

### Update Order Status

1. Open order details
2. Select new status from dropdown:
   - **Pending**: Just placed, not yet confirmed
   - **Confirmed**: Confirmed and being prepared
   - **Delivered**: Completed delivery
   - **Cancelled**: Order cancelled
3. Status updates automatically

### Generate Bulk Order

Use this to consolidate all orders for supplier ordering:

1. Click "Generate Bulk Order"
2. Select the week (delivery dates)
3. System aggregates all orders:
   - Sums quantities by product
   - Adds configurable buffer (e.g., 10% for waste)
   - Shows which customers ordered each item
4. Copy formatted output for:
   - **WhatsApp**: Send to supplier
   - **Email**: Email to supplier
   - **Print**: Print for reference

**Example Output**:
```
Bulk Order for Week of Nov 11-15, 2025

Tomatoes (kg): 45.5 (41.5 + 10% buffer)
  - John Doe: 5 kg
  - Jane Smith: 10 kg
  - ...

Lettuce (piece): 33 (30 + 10% buffer)
  - John Doe: 3 pieces
  - ...
```

---

## Invoice Management

### View Invoices

1. Click "Invoices" in the sidebar
2. See all invoices with:
   - Invoice number
   - Customer name
   - Date
   - Total amount
   - Status (Unpaid, Partial, Paid)
3. Filter by:
   - Customer
   - Status
   - Date range

### Generate Invoice

1. Go to Orders
2. Find delivered order without invoice
3. Click "Generate Invoice"
4. System automatically:
   - Creates invoice from order
   - Applies available customer credits
   - Generates PDF
   - Sends notification to customer

### View Invoice Details

1. Click on any invoice
2. See:
   - Itemized products
   - Subtotal
   - Credits applied
   - Final total
   - Payment history
   - Outstanding balance

### Download Invoice PDF

1. Open invoice details
2. Click "Download PDF"
3. PDF includes:
   - Company details
   - Customer details
   - Itemized products
   - Credits applied
   - Payment instructions

---

## Payment Recording

### Record Payment

1. Click "Payments" in the sidebar
2. Click "Record Payment"
3. Fill in payment details:
   - **Customer**: Select from dropdown
   - **Invoice**: Select unpaid/partial invoice
   - **Amount**: Payment amount received
   - **Method**: Cash, Yoco, or EFT
   - **Date**: Payment date
   - **Notes**: Optional notes
4. Click "Save"

### What Happens Automatically

- Invoice status updates:
  - **Paid**: If total payments ≥ invoice total
  - **Partial**: If some payment received
- **Overpayment**: Creates credit for customer
- **Notification**: Customer notified of payment received

### View Payment History

1. Click "Payments" in sidebar
2. See all payments with:
   - Date
   - Customer
   - Invoice
   - Amount
   - Method
3. Filter by customer or date range

### View Customer Payments

1. Go to Customers
2. Select a customer
3. Click "Payments" tab
4. See all payments for that customer

---

## Credit Management

### View Customer Credits

1. Go to Customers
2. Select a customer
3. See credit balance prominently displayed
4. Click "Credits" tab for history

### Record Short Delivery

When you can't fulfill part of an order:

1. Click "Credits" in sidebar
2. Click "Record Short Delivery"
3. Fill in details:
   - **Order**: Select the order
   - **Customer**: Auto-filled from order
   - **Products**: Select products that were short
   - **Quantity Short**: Enter quantity not delivered
4. System automatically:
   - Calculates credit amount based on product prices
   - Adds credit to customer balance
   - Records reason in credit history
5. Click "Save"

### Credit Application

Credits are automatically applied when generating invoices:
- System checks customer credit balance
- Applies credits up to invoice total
- Updates credit balance
- Shows credit applied on invoice

### View Credit History

1. Go to customer profile
2. Click "Credits" tab
3. See all credits:
   - Date
   - Amount
   - Reason (Overpayment, Short Delivery)
   - Type

---

## Packing Lists

### Generate Packing Lists

1. Click "Packing Lists" in sidebar
2. Select delivery date
3. See all orders for that date
4. Sort by:
   - **Route**: Delivery route order
   - **Customer Name**: Alphabetical

### Packing List Details

Each packing list shows:
- Customer name
- Delivery address
- Phone number
- Products with quantities
- Special instructions
- Order total

### Print Packing Lists

1. Select delivery date
2. Click "Generate PDF"
3. System creates batch PDF with all packing lists
4. Print for delivery drivers

**Tip**: Print one packing list per order for easy sorting during packing.

---

## Notifications

### Send Product List

Send weekly product list to customers:

1. Click "Notifications" in sidebar
2. Click "Send Product List"
3. Select customers (or select all)
4. Choose method:
   - WhatsApp
   - Email
   - Both
5. Click "Send"

### Send Payment Reminder

For customers with outstanding invoices:

1. Click "Notifications" in sidebar
2. Click "Send Payment Reminder"
3. Select customer
4. System shows outstanding invoices
5. Choose method (WhatsApp/Email)
6. Click "Send"

**Reminder includes**:
- List of unpaid invoices
- Total outstanding amount
- Payment instructions

### View Notification History

1. Click "Notifications" in sidebar
2. See all sent notifications:
   - Date/time
   - Customer
   - Type
   - Method
   - Status (Sent, Failed, Pending)

### Automatic Notifications

System automatically sends:
- **Order Confirmation**: When customer places order
- **Invoice Generated**: When you generate invoice
- **Payment Received**: When you record payment

---

## Reports

### Sales Report

1. Click "Reports" in sidebar
2. Select "Sales" tab
3. Choose date range
4. See:
   - Total revenue
   - Number of orders
   - Average order value
   - Revenue by product
   - Revenue by category
5. Export to CSV or print

### Payment Status Report

1. Select "Payments" tab
2. Choose date range
3. See:
   - Outstanding balances by customer
   - Total outstanding
   - Last payment date per customer
   - Payment method breakdown
4. Identify customers needing reminders

### Product Popularity Report

1. Select "Products" tab
2. Choose date range
3. See:
   - Most ordered products
   - Total quantity sold per product
   - Revenue per product
   - Order frequency
4. Use for inventory planning

### Customer Activity Report

1. Select "Customers" tab
2. Choose date range
3. See:
   - Order count per customer
   - Total spent per customer
   - Average order value
   - Last order date
   - Active vs inactive customers
4. Identify top customers

---

## Customer Management

### View All Customers

1. Click "Customers" in sidebar
2. See all customers with:
   - Name
   - Contact info
   - Credit balance
   - Total orders
   - Last order date
3. Search by name or contact

### View Customer Profile

1. Click on any customer
2. See tabs:
   - **Info**: Contact and delivery details
   - **Orders**: Order history
   - **Invoices**: Invoice history
   - **Payments**: Payment history
   - **Credits**: Credit history

### Edit Customer Information

1. Open customer profile
2. Click "Edit"
3. Update:
   - Name
   - Phone number
   - Email
   - Delivery address
   - Delivery preference
4. Click "Save"

### Customer Insights

Customer profile shows:
- Total orders placed
- Total amount spent
- Average order value
- Current credit balance
- Outstanding balance
- Last order date
- Preferred delivery method

---

## Best Practices

### Daily Tasks

- [ ] Check pending orders
- [ ] Update order statuses
- [ ] Record payments received
- [ ] Generate invoices for delivered orders
- [ ] Respond to customer inquiries

### Weekly Tasks

- [ ] Generate bulk order for supplier (Friday)
- [ ] Send product list to customers (Monday)
- [ ] Generate packing lists for upcoming deliveries
- [ ] Review payment status report
- [ ] Send payment reminders if needed

### Monthly Tasks

- [ ] Review sales reports
- [ ] Analyze product popularity
- [ ] Review customer activity
- [ ] Update product catalog
- [ ] Reconcile payments and credits

### Tips for Efficiency

1. **Batch Operations**: Generate all invoices for a delivery day at once
2. **Filters**: Use filters to quickly find specific orders/invoices
3. **Keyboard Shortcuts**: Learn common shortcuts for faster navigation
4. **Mobile Access**: Use mobile device for on-the-go updates
5. **Regular Backups**: Ensure database backups are running

---

## Troubleshooting

### Order Issues

**Problem**: Customer says they didn't receive order confirmation
- Check notification history
- Verify customer contact info is correct
- Resend notification manually

**Problem**: Need to modify order after placement
- Contact customer to confirm changes
- Update order items manually in database (contact tech support)

### Invoice Issues

**Problem**: Invoice shows wrong amount
- Check if credits were applied correctly
- Verify order items and prices
- Regenerate invoice if needed

**Problem**: Customer didn't receive invoice PDF
- Check email delivery status
- Download PDF and send manually
- Verify customer email is correct

### Payment Issues

**Problem**: Payment recorded on wrong invoice
- Contact tech support to reverse payment
- Record payment on correct invoice

**Problem**: Overpayment credit not showing
- Check credit history for customer
- Verify payment amount vs invoice total
- Credit should be created automatically

### System Issues

**Problem**: Can't login
- Verify admin credentials
- Check verification code delivery
- Contact tech support

**Problem**: Slow performance
- Clear browser cache
- Check internet connection
- Contact tech support if persists

---

## Security & Data

### Access Control

- Keep login credentials secure
- Don't share admin account
- Log out when finished
- Use strong verification codes

### Data Privacy

- Customer data is confidential
- Don't share customer information
- Follow data protection regulations
- Secure printed documents

### Audit Trail

All actions are logged:
- Product changes
- Order updates
- Payment recording
- Invoice generation
- User logins

View audit logs in system settings.

---

## Support

### Technical Support

- Email: tech@organicveg.com
- Phone: +27123456789
- Hours: Monday-Friday, 8 AM - 5 PM

### Training

- Request additional training sessions
- Access video tutorials (coming soon)
- Review this guide regularly

---

**Last Updated**: November 2025
**Version**: 1.0
