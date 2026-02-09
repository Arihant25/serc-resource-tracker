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
        const { profilePicture } = body;

        if (!profilePicture || typeof profilePicture !== 'string') {
            return NextResponse.json(
                { error: 'Profile picture URL is required' },
                { status: 400 }
            );
        }

        // Basic URL validation
        try {
            new URL(profilePicture);
        } catch {
            return NextResponse.json(
                { error: 'Invalid profile picture URL' },
                { status: 400 }
            );
        }

        await connectDB();

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { profilePicture },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                profilePicture: updatedUser.profilePicture,
                isAdmin: updatedUser.isAdmin,
                notificationPreferences: updatedUser.notificationPreferences,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
