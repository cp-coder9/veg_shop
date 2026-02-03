import { BaseRepository } from '../lib/firestore-repo.js';

export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    unit: string;
    description?: string | null;
    imageUrl?: string | null;
    isAvailable: boolean;
    isSeasonal: boolean;
    supplierId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class ProductRepository extends BaseRepository<Product> {
    constructor() {
        super('products');
    }

    async listAvailable(): Promise<Product[]> {
        return this.list([{ field: 'isAvailable', operator: '==', value: true }]);
    }
}

export const productRepository = new ProductRepository();
