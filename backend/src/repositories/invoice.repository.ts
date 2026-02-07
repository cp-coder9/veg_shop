import { BaseRepository } from '../lib/firestore-repo.js';
import type { Decimal } from '@prisma/client/runtime/library';

export interface Invoice {
    id: string;
    orderId: string;
    customerId: string;
    subtotal: number | Decimal;
    creditApplied: number | Decimal;
    total: number | Decimal;
    status: string;
    dueDate: Date;
    pdfUrl?: string | null;
    createdAt: Date;
    updatedAt?: Date;
}

export class InvoiceRepository extends BaseRepository<Invoice> {
    constructor() {
        super('invoices');
    }

    async findByOrder(orderId: string): Promise<Invoice | null> {
        return this.findOne('orderId', orderId);
    }

    async findByCustomer(customerId: string): Promise<Invoice[]> {
        return this.list([{ field: 'customerId', operator: '==', value: customerId }]);
    }
}

export const invoiceRepository = new InvoiceRepository();
