import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                isAdmin: user.isAdmin,
                notificationPreferences: user.notificationPreferences,
            },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
