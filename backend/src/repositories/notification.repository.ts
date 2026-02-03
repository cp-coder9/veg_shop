import { BaseRepository } from '../lib/firestore-repo.js';

export interface Notification {
    id: string;
    customerId: string;
    type: string;
    method: string;
    content: string;
    status: string;
    sentAt: Date | null;
    createdAt: Date;
}

export class NotificationRepository extends BaseRepository<Notification> {
    constructor() {
        super('notifications');
    }

    async findByCustomer(customerId: string): Promise<Notification[]> {
        return this.list([{ field: 'customerId', operator: '==', value: customerId }]);
    }

    async findPending(): Promise<Notification[]> {
        return this.list([{ field: 'status', operator: '==', value: 'pending' }]);
    }
}

export const notificationRepository = new NotificationRepository();
