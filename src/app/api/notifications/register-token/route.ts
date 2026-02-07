import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// Register FCM token for current user
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        await connectDB();

        // Add token to user's fcmTokens array if not already present
        await User.findByIdAndUpdate(user._id, {
            $addToSet: { fcmTokens: token },
        });

        return NextResponse.json({ message: 'Token registered successfully' });
    } catch (error) {
        console.error('Register token error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Remove FCM token from current user
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        await connectDB();

        // Remove token from user's fcmTokens array
        await User.findByIdAndUpdate(user._id, {
            $pull: { fcmTokens: token },
        });

        return NextResponse.json({ message: 'Token removed successfully' });
    } catch (error) {
        console.error('Remove token error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
