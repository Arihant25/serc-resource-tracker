'use client';

import { useEffect, useState } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
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
        if (!messaging) {
            console.error('Firebase messaging not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission === 'granted') {
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                });

                if (token) {
                    setFcmToken(token);

                    // Save token to backend
                    await fetch('/api/notifications/register-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token }),
                    });

                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error getting FCM token:', error);
            toast.error('Failed to enable notifications');
            return false;
        }
    };

    const removeToken = async (): Promise<void> => {
        if (fcmToken) {
            try {
                await fetch('/api/notifications/register-token', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: fcmToken }),
                });
                setFcmToken(null);
            } catch (error) {
                console.error('Error removing FCM token:', error);
            }
        }
    };

    // Listen for foreground messages
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);

            const title = payload.notification?.title || 'SERC Resource Tracker';
            const body = payload.notification?.body || 'You have a new notification';

            toast(title, {
                description: body,
                duration: 5000,
            });
        });

        return () => unsubscribe();
    }, []);

    return {
        fcmToken,
        permission,
        requestPermission,
        removeToken,
    };
}
