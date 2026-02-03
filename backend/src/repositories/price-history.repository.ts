import { BaseRepository } from '../lib/firestore-repo.js';

export interface PriceHistory {
    id: string;
    productId: string;
    price: number;
    effectiveDate: Date;
}

export class PriceHistoryRepository extends BaseRepository<PriceHistory> {
    constructor() {
        super('price_history');
    }

    async findByProduct(productId: string): Promise<PriceHistory[]> {
        return this.list([{ field: 'productId', operator: '==', value: productId }]);
    }
}

export const priceHistoryRepository = new PriceHistoryRepository();
