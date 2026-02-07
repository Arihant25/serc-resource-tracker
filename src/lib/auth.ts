import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import connectDB from './mongodb';
import User, { IUser } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth_token';

if (!JWT_SECRET) {
    throw new Error('Please define the JWT_SECRET environment variable');
}

export interface JWTPayload {
    userId: string;
    email: string;
    isAdmin: boolean;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

// Compare password with hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

// Set auth cookie
export async function setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

// Clear auth cookie
export async function clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

// Get current user from request
export async function getCurrentUser(request?: NextRequest): Promise<IUser | null> {
    try {
        let token: string | undefined;

        if (request) {
            token = request.cookies.get(COOKIE_NAME)?.value;
        } else {
            const cookieStore = await cookies();
            token = cookieStore.get(COOKIE_NAME)?.value;
        }

        if (!token) {
            return null;
        }

        const payload = verifyToken(token);
        if (!payload) {
            return null;
        }

        await connectDB();
        const user = await User.findById(payload.userId);
        return user;
    } catch {
        return null;
    }
}

// Check if user is admin
export async function requireAdmin(request?: NextRequest): Promise<IUser> {
    const user = await getCurrentUser(request);
    if (!user) {
        throw new Error('Unauthorized');
    }
    if (!user.isAdmin) {
        throw new Error('Forbidden: Admin access required');
    }
    return user;
}
