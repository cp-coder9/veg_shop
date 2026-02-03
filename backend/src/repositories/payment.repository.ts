import { BaseRepository } from '../lib/firestore-repo.js';

export interface Payment {
    id: string;
    invoiceId: string;
    customerId: string;
    amount: number;
    method: string;
    paymentDate: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class PaymentRepository extends BaseRepository<Payment> {
    constructor() {
        super('payments');
    }

    async findByInvoice(invoiceId: string): Promise<Payment[]> {
        return this.list([{ field: 'invoiceId', operator: '==', value: invoiceId }]);
    }

    async findByCustomer(customerId: string): Promise<Payment[]> {
        return this.list([{ field: 'customerId', operator: '==', value: customerId }]);
    }
}

export const paymentRepository = new PaymentRepository();
