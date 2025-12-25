# System Requirements & Outstanding Tasks

## Business Context
- **Clients**: 30-50 currently, target 50-80.
- **Volume**: 600-800 products/week.
- **Logistics**: Monday, Wednesday, Friday delivery/collection in Paarl.
- **Cycle**: Tuesday broadcast -> Friday cutoff -> Friday bulk buy -> Packing/Invoicing.

## Status Mapping & Outstanding Tasks

| Requirement | Implementation Status | Outstanding Task |
|-------------|-----------------------|------------------|
| **WhatsApp Weekly List** | Implemented (Poll & Schedule). | None. |
| **Friday Cutoff** | Implemented (Code logic). | None. |
| **Bulk Buy Collation** | Implemented (Service & Send). | None. |
| **Invoices & Packing Lists** | Implemented (PDF & Bulk). | None. |
| **Credit/Overpayment Logic** | Implemented (Automatic). | None (Verified in `InvoiceService`). |
| **Payment Reminders** | Implemented (Schedule). | None. |
| **Payment Gateways** | Implemented (Yoko API). | None. |
| **Short Delivery Credit** | Implemented (Automatic). | None. |
| **Delivery Logistics** | Implemented (Days valid).| None. |

## Next Steps
1. **Infrastructure**: Resolve mocked external services (WhatsApp/SendGrid).
2. **Fintech**: Implement real-time payment gateway integration.
3. **Automation**: Schedule periodic tasks (Tuesday lists, Friday reminders).
