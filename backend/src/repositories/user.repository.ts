import { BaseRepository } from '../lib/firestore-repo.js';

export interface User {
    id: string;
    phone?: string | null;
    email?: string | null;
    password?: string | null;
    name: string;
    address?: string | null;
    deliveryPreference: string;
    role: string;
    status: string;
    birthday?: Date | null;
    loyaltyPoints: number;
    createdAt: Date;
    updatedAt: Date;
}

export class UserRepository extends BaseRepository<User> {
    constructor() {
        super('users');
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.findOne('email', email);
    }

    async findByPhone(phone: string): Promise<User | null> {
        return this.findOne('phone', phone);
    }

    async findByEmailOrPhone(contact: string): Promise<User | null> {
        // Firestore doesn't support easy OR across different fields in a single findOne wrapper
        // We'll check both
        const byEmail = await this.findByEmail(contact);
        if (byEmail) return byEmail;
        return this.findByPhone(contact);
    }
}

export const userRepository = new UserRepository();
