import { BaseRepository } from '../lib/firestore-repo.js';

export interface Invoice {
    id: string;
    orderId: string;
    customerId: string;
    subtotal: number;
    creditApplied: number;
    total: number;
    status: string;
    dueDate: Date;
    pdfUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class InvoiceRepository extends BaseRepository<Invoice> {
    constructor() {
        super('invoices');
    }

    async findByOrder(orderId: string): Promise<Invoice | null> {
        return this.findOne('orderId', orderId);
    }
}

export const invoiceRepository = new InvoiceRepository();
