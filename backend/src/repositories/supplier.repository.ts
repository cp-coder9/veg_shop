import { BaseRepository } from '../lib/firestore-repo.js';

export interface Supplier {
    id: string;
    name: string;
    contactInfo: string | null;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class SupplierRepository extends BaseRepository<Supplier> {
    constructor() {
        super('suppliers');
    }

    async findByName(name: string): Promise<Supplier | null> {
        return this.findOne('name', name);
    }
}

export const supplierRepository = new SupplierRepository();
