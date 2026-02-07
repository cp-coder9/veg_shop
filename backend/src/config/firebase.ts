import admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';
import { env } from './env.js';

let firestoreDb: Firestore | null = null;

if (env.USE_FIREBASE) {
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
        console.warn('⚠️ Firebase is enabled but credentials are missing. Falling back to default or mock.');
    } else {
        try {
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: env.FIREBASE_PROJECT_ID,
                        clientEmail: env.FIREBASE_CLIENT_EMAIL,
                        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    }),
                });
                console.log('✅ Firebase Admin initialized successfully');
            }
            firestoreDb = admin.firestore();
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Admin:', error);
        }
    }
}

export const db = firestoreDb;
export default admin;
