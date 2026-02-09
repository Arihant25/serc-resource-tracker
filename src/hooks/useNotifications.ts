'use client';

import { useEffect, useState } from 'react';
import { getMessagingInstance } from '@/lib/firebase';
import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { toast } from 'sonner';

export function useNotifications() {
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async (): Promise<boolean> => {
        try {
            console.log('Requesting notification permission...');

            // Get messaging instance (waits for initialization)
            const messaging = await getMessagingInstance();
            if (!messaging) {
                console.error('Firebase messaging not supported or failed to initialize');
                throw new Error('Push notifications are not supported in this browser');
            }

            console.log('Firebase messaging ready, requesting browser permission...');
            const permission = await Notification.requestPermission();
            setPermission(permission);
            console.log('Browser permission result:', permission);

            if (permission !== 'granted') {
                throw new Error('Notification permission denied');
            }

            console.log('Getting FCM token...');
            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (!token) {
                throw new Error('Failed to get FCM token');
            }

            console.log('FCM token retrieved:', token.substring(0, 20) + '...');
            setFcmToken(token);

            // Save token to backend with error checking
            console.log('Registering token with backend...');
            const response = await fetch('/api/notifications/register-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `Failed to register token (${response.status})`);
            }

            console.log('Token registered successfully with backend');
            return true;
        } catch (error) {
            console.error('Error enabling notifications:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to enable notifications';
            toast.error(errorMessage);
            return false;
        }
    };

    const removeToken = async (): Promise<void> => {
        if (fcmToken) {
            try {
                console.log('Removing FCM token from backend...');
                const response = await fetch('/api/notifications/register-token', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: fcmToken }),
                });

                if (!response.ok) {
                    console.error('Failed to remove token from backend');
                }

                setFcmToken(null);
                console.log('Token removed successfully');
            } catch (error) {
                console.error('Error removing FCM token:', error);
            }
        }
    };

    // Listen for foreground messages
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        // Initialize messaging and set up listener
        const setupMessaging = async () => {
            const messaging = await getMessagingInstance();
            if (!messaging) {
                console.warn('Cannot set up foreground message listener - messaging not available');
                return;
            }

            console.log('Setting up foreground message listener...');
            unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground message received:', payload);

                const title = payload.notification?.title || 'SERC Resource Tracker';
                const body = payload.notification?.body || 'You have a new notification';

                toast(title, {
                    description: body,
                    duration: 5000,
                });
            });
        };

        setupMessaging();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return {
        fcmToken,
        permission,
        requestPermission,
        removeToken,
    };
}
