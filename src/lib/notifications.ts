import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { adminMessaging } from '@/lib/firebase-admin';

export interface SendNotificationOptions {
    userId?: string;
    userIds?: string[];
    notifyAllAdmins?: boolean;
    title: string;
    body: string;
    data?: Record<string, string>;
}

export interface SendNotificationResult {
    sent: number;
    total: number;
    failures: number;
}

export async function sendNotification(options: SendNotificationOptions): Promise<SendNotificationResult> {
    const { userId, userIds, notifyAllAdmins, title, body, data } = options;

    await connectDB();

    let targetUsers;

    if (notifyAllAdmins) {
        targetUsers = await User.find({ isAdmin: true, 'notificationPreferences.push': true });
    } else if (userIds && userIds.length > 0) {
        targetUsers = await User.find({
            _id: { $in: userIds },
            'notificationPreferences.push': true,
        });
    } else if (userId) {
        const targetUser = await User.findOne({
            _id: userId,
            'notificationPreferences.push': true,
        });
        targetUsers = targetUser ? [targetUser] : [];
    } else {
        throw new Error('Must specify userId, userIds, or notifyAllAdmins');
    }

    const tokens: string[] = [];
    targetUsers.forEach((user) => {
        if (user.fcmTokens && user.fcmTokens.length > 0) {
            tokens.push(...user.fcmTokens);
        }
    });

    if (tokens.length === 0) {
        return { sent: 0, total: 0, failures: 0 };
    }

    if (!adminMessaging) {
        console.error('Firebase Admin not initialized — push notifications disabled');
        return { sent: 0, total: tokens.length, failures: tokens.length };
    }

    const message = {
        notification: { title, body },
        data: data || {},
        tokens,
        webpush: {
            fcmOptions: { link: '/' },
            notification: {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
            },
        },
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp: { success: boolean }, idx: number) => {
            if (!resp.success) {
                failedTokens.push(tokens[idx]);
            }
        });

        if (failedTokens.length > 0) {
            await User.updateMany(
                { fcmTokens: { $in: failedTokens } },
                { $pull: { fcmTokens: { $in: failedTokens } } }
            );
        }
    }

    return {
        sent: response.successCount,
        total: tokens.length,
        failures: response.failureCount,
    };
}
