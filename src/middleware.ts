import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/api/auth/login'];

// Routes that require admin access
const adminRoutes = ['/admin', '/api/users', '/api/resources/create'];

interface JWTPayload {
    userId: string;
    email: string;
    isAdmin: boolean;
}

async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (publicRoutes.some((route) => pathname === route || pathname.startsWith('/api/auth'))) {
        return NextResponse.next();
    }

    // Allow static files and API health check
    if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname === '/api/health') {
        return NextResponse.next();
    }

    // Get auth token
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        // Redirect to login for page requests
        if (!pathname.startsWith('/api')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        // Return 401 for API requests
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token using jose (edge-compatible)
    const payload = await verifyTokenEdge(token);
    if (!payload) {
        // Clear invalid token and redirect
        const response = pathname.startsWith('/api')
            ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
            : NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_token');
        return response;
    }

    // Check admin routes
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
        if (!payload.isAdmin) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
            }
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
