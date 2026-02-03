import { BaseRepository } from '../lib/firestore-repo.js';

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    priceAtOrder: number;
}

export class OrderItemRepository extends BaseRepository<OrderItem> {
    constructor() {
        super('order_items');
    }

    async findByOrder(orderId: string): Promise<OrderItem[]> {
        return this.list([{ field: 'orderId', operator: '==', value: orderId }]);
    }
}

export const orderItemRepository = new OrderItemRepository();
