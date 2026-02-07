import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { push } = body;

        await connectDB();

        await User.findByIdAndUpdate(user._id, {
            'notificationPreferences.push': push,
        });

        return NextResponse.json({ message: 'Preferences updated' });
    } catch (error) {
        console.error('Update preferences error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
