import admin from 'firebase-admin';
import { env } from './env.js';

if (env.USE_FIREBASE) {
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
        console.warn('⚠️ Firebase is enabled but credentials are missing. Falling back to default or mock.');
    } else {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: env.FIREBASE_PROJECT_ID,
                    clientEmail: env.FIREBASE_CLIENT_EMAIL,
                    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
            console.log('✅ Firebase Admin initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Admin:', error);
        }
    }
}

export const db = env.USE_FIREBASE ? admin.firestore() : null;
export default admin;
