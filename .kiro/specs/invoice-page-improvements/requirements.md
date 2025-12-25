# Requirements Document

## Introduction

This specification defines improvements to the invoicing pages for both customers and administrators in the organic vegetable order management system. The current implementation provides basic invoice viewing and management capabilities, but lacks several features that would enhance user experience, improve workflow efficiency, and provide better financial transparency. This spec focuses on enhancing the customer invoice experience with detailed views and PDF downloads, while streamlining the admin workflow by consolidating invoice and payment management with better data presentation.

## Glossary

- **Invoice_System**: The complete invoicing module including customer and admin interfaces for viewing, managing, and processing invoices
- **Customer_Portal**: The customer-facing interface where customers view their invoices and payment history
- **Admin_Dashboard**: The administrator interface for managing all invoices, payments, and customer accounts
- **PDF_Generator**: The backend service that creates downloadable PDF invoices using PDFKit
- **Credit_Balance**: The amount of money a customer has available from overpayments or short deliveries
- **Outstanding_Invoice**: An invoice with status 'unpaid' or 'partial'
- **Invoice_Detail_Modal**: A popup window displaying comprehensive invoice information
- **Payment_History**: A chronological record of all payments made by a customer
- **Customer_Name_Resolution**: The process of displaying customer names instead of customer IDs in tables

## Requirements

### Requirement 1

**User Story:** As a customer, I want to view detailed information about my invoices including all order items and payment breakdowns, so that I can understand exactly what I'm being charged for.

#### Acceptance Criteria

1. WHEN a customer clicks on an invoice in their invoice history table, THE Customer_Portal SHALL display an Invoice_Detail_Modal containing the complete invoice information
2. THE Invoice_Detail_Modal SHALL display the invoice ID, creation date, due date, and current status
3. THE Invoice_Detail_Modal SHALL display a table of all order items with product names, quantities, units, prices, and subtotals
4. THE Invoice_Detail_Modal SHALL display a payment summary section showing subtotal, credit applied, and total amount
5. THE Invoice_Detail_Modal SHALL provide a close button to dismiss the modal

### Requirement 2

**User Story:** As a customer, I want to download PDF copies of my invoices, so that I can keep records for my own accounting purposes.

#### Acceptance Criteria

1. WHEN a customer views their invoice history, THE Customer_Portal SHALL display a download button for each invoice that has a PDF available
2. WHEN a customer clicks the download button in the invoice table, THE Customer_Portal SHALL initiate a PDF download for that invoice
3. WHEN a customer views an invoice in the Invoice_Detail_Modal, THE Customer_Portal SHALL display a download PDF button
4. WHEN a customer clicks the download PDF button in the modal, THE Customer_Portal SHALL download the invoice PDF with filename format "invoice-{invoiceId}.pdf"
5. IF the PDF download fails, THEN THE Customer_Portal SHALL display an error message to the customer

### Requirement 3

**User Story:** As a customer, I want to see my complete payment history alongside my invoices, so that I can track all my financial transactions in one place.

#### Acceptance Criteria

1. THE Customer_Portal SHALL display a Payment History section below the invoice history table
2. THE Payment History section SHALL display a table with columns for date, amount, payment method, invoice reference, and notes
3. THE Payment History table SHALL display payments in reverse chronological order with most recent first
4. WHEN no payment history exists, THE Customer_Portal SHALL display a message "No payment history available"
5. THE Payment History table SHALL format amounts with currency symbol "R" and two decimal places

### Requirement 4

**User Story:** As an administrator, I want to see customer names instead of customer IDs in the invoice tables, so that I can quickly identify which customer each invoice belongs to without looking up IDs.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display customer names in the invoice management table instead of customer IDs
2. THE Admin_Dashboard SHALL display customer names in the outstanding invoices table instead of customer IDs
3. THE Admin_Dashboard SHALL display customer names in the payment history table instead of customer IDs
4. WHEN a customer name is longer than 30 characters, THE Admin_Dashboard SHALL truncate the name and append "..." to indicate truncation
5. THE Admin_Dashboard SHALL load customer information efficiently to avoid performance degradation

### Requirement 5

**User Story:** As an administrator, I want to record payments directly from the invoice table, so that I can quickly process payments without navigating to a separate page.

#### Acceptance Criteria

1. WHEN an administrator views an outstanding invoice in the table, THE Admin_Dashboard SHALL display a "Record Payment" button in the actions column
2. WHEN an administrator clicks the "Record Payment" button, THE Admin_Dashboard SHALL open the payment recording modal with the invoice and customer pre-selected
3. THE payment recording modal SHALL display the selected invoice details including total amount and current status
4. WHEN a payment is successfully recorded, THE Admin_Dashboard SHALL refresh the invoice table to reflect the updated status
5. THE Admin_Dashboard SHALL display a success message after recording a payment

### Requirement 6

**User Story:** As an administrator, I want to see payment history directly in the invoice detail modal, so that I can understand the payment status of an invoice without switching views.

#### Acceptance Criteria

1. WHEN an administrator opens an Invoice_Detail_Modal, THE Admin_Dashboard SHALL display a Payments section if any payments exist for that invoice
2. THE Payments section SHALL display a table with columns for payment date, amount, method, and notes
3. THE Payments section SHALL calculate and display the total amount paid
4. THE Payments section SHALL calculate and display the remaining balance if the invoice is not fully paid
5. WHEN no payments exist for an invoice, THE Admin_Dashboard SHALL display a message "No payments recorded for this invoice"

### Requirement 7

**User Story:** As an administrator, I want to filter invoices by customer name, so that I can quickly find all invoices for a specific customer.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a customer filter input field in the filters section
2. THE customer filter input field SHALL support text search by customer name
3. WHEN an administrator enters text in the customer filter, THE Admin_Dashboard SHALL filter the invoice table to show only invoices for customers whose names contain the search text
4. THE customer filter SHALL be case-insensitive
5. THE customer filter SHALL work in combination with existing status and date filters

### Requirement 8

**User Story:** As an administrator, I want to send invoice PDFs via email directly from the invoice management page, so that I can quickly notify customers about their invoices.

#### Acceptance Criteria

1. WHEN an administrator views an invoice in the table, THE Admin_Dashboard SHALL display an "Email Invoice" button in the actions column
2. WHEN an administrator clicks the "Email Invoice" button, THE Admin_Dashboard SHALL open an email confirmation dialog
3. THE email confirmation dialog SHALL display the customer email address and allow the administrator to add a custom message
4. WHEN an administrator confirms the email, THE Invoice_System SHALL send the invoice PDF to the customer email address
5. THE Admin_Dashboard SHALL display a success message after the email is sent successfully

### Requirement 9

**User Story:** As a customer, I want to see which invoices are overdue, so that I can prioritize my payments.

#### Acceptance Criteria

1. WHEN an invoice due date is in the past and the status is not "paid", THE Customer_Portal SHALL display an "OVERDUE" badge on that invoice
2. THE overdue badge SHALL be displayed in red color to indicate urgency
3. THE Customer_Portal SHALL sort overdue invoices to the top of the invoice history table
4. THE Customer_Portal SHALL display the number of days overdue in the badge text
5. THE Customer_Portal SHALL calculate overdue status based on the current date compared to the due date

### Requirement 10

**User Story:** As an administrator, I want to see summary statistics for invoices, so that I can quickly understand the financial status of the business.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a summary card showing the total number of outstanding invoices
2. THE Admin_Dashboard SHALL display a summary card showing the total value of outstanding invoices
3. THE Admin_Dashboard SHALL display a summary card showing the total number of overdue invoices
4. THE Admin_Dashboard SHALL display a summary card showing the total value of overdue invoices
5. THE summary cards SHALL update automatically when filters are applied to the invoice table
