import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { IUser } from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { adminMessaging } from '@/lib/firebase-admin';

interface NotificationPayload {
    userId?: string;
    userIds?: string[];
    notifyAllAdmins?: boolean;
    title: string;
    body: string;
    data?: Record<string, string>;
}

// Send push notifications via Firebase Cloud Messaging (v1 API)
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: NotificationPayload = await request.json();
        const { userId, userIds, notifyAllAdmins, title, body: messageBody, data } = body;

        if (!title || !messageBody) {
            return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
        }

        await connectDB();

        let targetUsers: IUser[] = [];

        // Determine which users to notify
        if (notifyAllAdmins) {
            targetUsers = await User.find({ isAdmin: true, 'notificationPreferences.push': true });
        } else if (userIds && userIds.length > 0) {
            targetUsers = await User.find({
                _id: { $in: userIds },
                'notificationPreferences.push': true
            });
        } else if (userId) {
            const targetUser = await User.findOne({
                _id: userId,
                'notificationPreferences.push': true
            });
            if (targetUser) {
                targetUsers = [targetUser];
            }
        } else {
            return NextResponse.json({ error: 'Must specify userId, userIds, or notifyAllAdmins' }, { status: 400 });
        }

        // Collect all FCM tokens from target users
        const tokens: string[] = [];
        targetUsers.forEach((user) => {
            if (user.fcmTokens && user.fcmTokens.length > 0) {
                tokens.push(...user.fcmTokens);
            }
        });

        if (tokens.length === 0) {
            return NextResponse.json({ message: 'No tokens to send to', sent: 0 });
        }

        if (!adminMessaging) {
            console.error('Firebase Admin not initialized');
            return NextResponse.json({ error: 'Notification service not configured' }, { status: 500 });
        }

        // Send notifications using Firebase Admin SDK (v1 API)
        // We use sendEachForMulticast to send to multiple tokens
        const message = {
            notification: {
                title,
                body: messageBody,
            },
            data: data || {},
            tokens: tokens, // v1 API uses 'tokens' array for multicast
            webpush: {
                fcmOptions: {
                    link: '/',
                },
                notification: {
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                }
            }
        };

        const response = await adminMessaging.sendEachForMulticast(message);

        // Handle invalid tokens (cleanup)
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp: { success: boolean }, idx: number) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                    // You might want to remove these tokens from the DB here
                }
            });
            console.log('Failed tokens:', failedTokens);

            // Optional: Remove invalid tokens from DB
            if (failedTokens.length > 0) {
                await User.updateMany(
                    { fcmTokens: { $in: failedTokens } },
                    { $pull: { fcmTokens: { $in: failedTokens } } }
                );
            }
        }

        return NextResponse.json({
            message: 'Notifications sent',
            sent: response.successCount,
            total: tokens.length,
            failures: response.failureCount
        });
    } catch (error) {
        console.error('Send notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
