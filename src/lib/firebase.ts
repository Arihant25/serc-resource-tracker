import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let messagingInstance: Messaging | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

if (typeof window !== 'undefined') {
    // Only initialize on client side
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }
}

// Async function to safely get messaging instance
export async function getMessagingInstance(): Promise<Messaging | null> {
    if (typeof window === 'undefined') {
        console.warn('Firebase messaging is only available in browser environment');
        return null;
    }

    // Return cached instance if available
    if (messagingInstance) {
        return messagingInstance;
    }

    // Return existing promise if initialization is in progress
    if (messagingPromise) {
        return messagingPromise;
    }

    // Initialize messaging
    messagingPromise = (async () => {
        try {
            const supported = await isSupported();
            if (!supported) {
                console.warn('Firebase messaging is not supported in this browser');
                return null;
            }

            const apps = getApps();
            if (apps.length === 0) {
                console.error('Firebase app not initialized');
                return null;
            }

            messagingInstance = getMessaging(apps[0]);
            console.log('Firebase messaging initialized successfully');
            return messagingInstance;
        } catch (error) {
            console.error('Error initializing Firebase messaging:', error);
            return null;
        }
    })();

    return messagingPromise;
}

// Keep backward compatibility with synchronous access (deprecated)
export const messaging = messagingInstance;
