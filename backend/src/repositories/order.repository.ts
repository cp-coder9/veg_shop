import { BaseRepository } from '../lib/firestore-repo.js';

export interface Order {
    id: string;
    customerId: string;
    deliveryDate: Date;
    deliveryMethod: 'delivery' | 'collection';
    deliveryAddress?: string | null;
    specialInstructions?: string | null;
    deliveryFees: number;
    status: string;
    coolerBagOption: boolean;
    packerId?: string | null;
    packerNotes?: string | null;
    packerSignature?: string | null;
    deliveryNotes?: string | null;
    coolerBagStatus?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class OrderRepository extends BaseRepository<Order> {
    constructor() {
        super('orders');
    }

    async findByCustomer(customerId: string): Promise<Order[]> {
        return this.list([{ field: 'customerId', operator: '==', value: customerId }]);
    }
}

export const orderRepository = new OrderRepository();
