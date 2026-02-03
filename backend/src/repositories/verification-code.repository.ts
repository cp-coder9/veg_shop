import { BaseRepository } from '../lib/firestore-repo.js';

export interface VerificationCode {
    id: string;
    contact: string;
    code: string;
    expiresAt: Date;
    createdAt: Date;
}

export class VerificationCodeRepository extends BaseRepository<VerificationCode> {
    constructor() {
        super('verification_codes');
    }

    async findValidCode(contact: string, code: string): Promise<VerificationCode | null> {
        this.checkConnection();
        const now = new Date();
        const snapshot = await this.collection!
            .where('contact', '==', contact)
            .where('code', '==', code)
            .where('expiresAt', '>', now)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as VerificationCode;
    }

    async deleteByContact(contact: string): Promise<void> {
        this.checkConnection();
        const snapshot = await this.collection!.where('contact', '==', contact).get();
        const batch = this.collection!.firestore.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
}

export const verificationCodeRepository = new VerificationCodeRepository();
