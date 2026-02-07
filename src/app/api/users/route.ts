import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/lib/auth';

// GET all users (admin only)
export async function GET() {
    try {
        await requireAdmin();
        await connectDB();

        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        return NextResponse.json({ users });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message === 'Unauthorized' || message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
        }
        console.error('Get users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST create user (admin only)
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json();
        const { name, email, isAdmin } = body;

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        // Create user (password will be set on first login)
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            isAdmin: isAdmin || false,
        });

        return NextResponse.json(
            {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message === 'Unauthorized' || message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
        }
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
