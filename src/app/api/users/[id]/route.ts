import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin, hashPassword } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single user
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        await connectDB();

        const user = await User.findById(id).select('-password');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message === 'Unauthorized' || message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
        }
        console.error('Get user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        const body = await request.json();
        const { name, email, isAdmin, password } = body;

        await connectDB();

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email.toLowerCase();
        if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin;
        if (password) user.password = await hashPassword(password);

        await user.save();

        return NextResponse.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message === 'Unauthorized' || message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
        }
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await requireAdmin();
        const { id } = await params;
        await connectDB();

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message === 'Unauthorized' || message === 'Forbidden: Admin access required') {
            return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 403 });
        }
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
