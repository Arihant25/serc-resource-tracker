import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

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

        if (!userId && !userIds?.length && !notifyAllAdmins) {
            return NextResponse.json({ error: 'Must specify userId, userIds, or notifyAllAdmins' }, { status: 400 });
        }

        const result = await sendNotification({ userId, userIds, notifyAllAdmins, title, body: messageBody, data });

        return NextResponse.json({
            message: result.sent > 0 ? 'Notifications sent' : 'No tokens to send to',
            ...result,
        });
    } catch (error) {
        console.error('Send notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
