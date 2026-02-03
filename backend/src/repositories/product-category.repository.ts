import { BaseRepository } from '../lib/firestore-repo.js';

export interface ProductCategory {
    id: string;
    key: string;
    label: string;
    description?: string | null;
    isActive: boolean;
    sortOrder: number;
}

export class ProductCategoryRepository extends BaseRepository<ProductCategory> {
    constructor() {
        super('product_categories');
    }

    async findByKey(key: string): Promise<ProductCategory | null> {
        return this.findOne('key', key);
    }

    async listActive(): Promise<ProductCategory[]> {
        return this.list([{ field: 'isActive', operator: '==', value: true }]);
    }
}

export const productCategoryRepository = new ProductCategoryRepository();
