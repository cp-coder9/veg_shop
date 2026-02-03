import { BaseRepository } from '../lib/firestore-repo.js';

export interface Credit {
    id: string;
    customerId: string;
    amount: number;
    reason: string;
    type: string;
    createdAt: Date;
}

export class CreditRepository extends BaseRepository<Credit> {
    constructor() {
        super('credits');
    }

    async findByCustomer(customerId: string): Promise<Credit[]> {
        return this.list([{ field: 'customerId', operator: '==', value: customerId }]);
    }
}

export const creditRepository = new CreditRepository();
