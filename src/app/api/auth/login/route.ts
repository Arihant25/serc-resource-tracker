import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        await connectDB();

        // Find user and include password for verification
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if this is first-time login (no password set)
        if (!user.password) {
            // Set the password for first-time login
            user.password = await hashPassword(password);
            await user.save();
        } else {
            // Verify password
            const isValid = await verifyPassword(password, user.password);
            if (!isValid) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }
        }

        // Generate token
        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            isAdmin: user.isAdmin,
        });

        // Return user info with cookie set
        const response = NextResponse.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });

        // Set cookie on response
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
