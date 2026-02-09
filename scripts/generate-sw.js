const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

let envContent = '';
// Read .env first, then override with .env.local
if (fs.existsSync(envPath)) {
    envContent += fs.readFileSync(envPath, 'utf8') + '\n';
}
if (fs.existsSync(envLocalPath)) {
    envContent += fs.readFileSync(envLocalPath, 'utf8') + '\n';
}

const envVars = {};
envContent.split('\n').forEach(line => {
    // Simple env parser
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        // Remove quotes if present
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.replace(/^"|"$/g, '');
        }
        if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
            value = value.replace(/^'|'$/g, '');
        }
        // Only set if not already set (respect order if needed, but here later parses overwrite earlier for simple append logic, which is correct for .env.local overriding .env if appended last, but we appended .env.local last so it overrides properly)
        envVars[match[1]] = value;
    }
});

const swContent = `// Firebase Messaging Service Worker (Generated)
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "${envVars.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}",
    authDomain: "${envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}",
    projectId: "${envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}",
    storageBucket: "${envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}",
    messagingSenderId: "${envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}",
    appId: "${envVars.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}",
    measurementId: "${envVars.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''}"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notification = payload && payload.notification ? payload.notification : {};
    const notificationTitle = notification.title || 'SERC Resource Tracker';
    const notificationOptions = {
        body: notification.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.');

    event.notification.close();

    // Open the app
    event.waitUntil(
        clients.openWindow('/')
    );
});
`;

fs.writeFileSync(path.resolve(process.cwd(), 'public/firebase-messaging-sw.js'), swContent);
console.log('Generated public/firebase-messaging-sw.js');
