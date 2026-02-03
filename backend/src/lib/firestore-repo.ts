import { db } from '../config/firebase.js';
import {
    CollectionReference,
    DocumentData,
    Query,
    WhereFilterOp
} from 'firebase-admin/firestore';

export class BaseRepository<T extends { id?: string }> {
    protected collection: CollectionReference<DocumentData> | null;

    constructor(collectionName: string) {
        this.collection = db ? db.collection(collectionName) : null;
    }

    protected checkConnection(): void {
        if (!this.collection) {
            throw new Error('Firestore not initialized. Ensure USE_FIREBASE is true and credentials are provided.');
        }
    }

    async create(data: Omit<T, 'id'>): Promise<T> {
        this.checkConnection();
        const docRef = this.collection!.doc();
        const id = docRef.id;
        const item = { ...data, id } as T;
        await docRef.set(item);
        return item;
    }

    async findById(id: string): Promise<T | null> {
        this.checkConnection();
        const doc = await this.collection!.doc(id).get();
        return doc.exists ? (doc.data() as T) : null;
    }

    async findOne(field: string, value: string | number | boolean | Date): Promise<T | null> {
        this.checkConnection();
        const snapshot = await this.collection!.where(field, '==', value).limit(1).get();
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as T;
    }

    async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<T | null> {
        this.checkConnection();
        const docRef = this.collection!.doc(id);
        await docRef.update(data as unknown as DocumentData);
        const updated = await docRef.get();
        return updated.data() as T;
    }

    async delete(id: string): Promise<void> {
        this.checkConnection();
        await this.collection!.doc(id).delete();
    }

    async list(
        filters?: { field: string; operator: WhereFilterOp; value: string | number | boolean | Date | string[] | number[] }[],
        orderBy?: { field: string; direction: 'asc' | 'desc' },
        limitCount?: number
    ): Promise<T[]> {
        this.checkConnection();
        let query: Query = this.collection!;

        if (filters) {
            filters.forEach(f => {
                query = query.where(f.field, f.operator, f.value);
            });
        }

        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction);
        }

        if (limitCount) {
            query = query.limit(limitCount);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data() as T);
    }
}
