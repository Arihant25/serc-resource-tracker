import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let app;

if (serviceAccountStr) {
    try {
        const serviceAccount = JSON.parse(serviceAccountStr);
        if (!getApps().length) {
            app = initializeApp({
                credential: cert(serviceAccount),
            });
        } else {
            app = getApps()[0];
        }
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

export const adminMessaging: Messaging | null = app ? getMessaging(app) : null;
