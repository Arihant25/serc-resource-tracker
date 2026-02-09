import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that require admin access
const adminRoutes = ['/admin'];
const adminApiRoutes = ['/api/users', '/api/resources/create'];

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

function clearTokenCookie(response: NextResponse): NextResponse {
    response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });
    return response;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow static files, Next.js internals, and public assets
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/icons') ||
        pathname.startsWith('/manifest') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get('auth_token')?.value;
    const payload = token ? await verifyTokenEdge(token) : null;
    const hasInvalidToken = !!token && !payload;

    // --- Public routes (no auth required) ---

    // Home page: always accessible
    if (pathname === '/') {
        return NextResponse.next();
    }

    // Login page: redirect to dashboard if already authenticated
    if (pathname === '/login') {
        if (payload) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        // If token was invalid, clear it while showing login
        if (hasInvalidToken) {
            return clearTokenCookie(NextResponse.next());
        }
        return NextResponse.next();
    }

    // All /api/auth/* routes are public (login, logout, me, change-password)
    if (pathname.startsWith('/api/auth')) {
        // If token is invalid, clear it on the response
        if (hasInvalidToken) {
            return clearTokenCookie(NextResponse.next());
        }
        return NextResponse.next();
    }

    // Health check
    if (pathname === '/api/health') {
        return NextResponse.next();
    }

    // --- Protected routes (auth required) ---

    if (!payload) {
        if (hasInvalidToken) {
            // Token exists but is invalid — clear it
            if (pathname.startsWith('/api')) {
                return clearTokenCookie(
                    NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
                );
            }
            return clearTokenCookie(
                NextResponse.redirect(new URL('/login', request.url))
            );
        }
        // No token at all
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // --- Admin routes ---

    if (adminRoutes.some((route) => pathname.startsWith(route))) {
        if (!payload.isAdmin) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    if (adminApiRoutes.some((route) => pathname.startsWith(route))) {
        if (!payload.isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
    }

    // Authenticated user, allow through
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
