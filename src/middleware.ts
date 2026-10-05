import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { extractTokenFromRequest, AUTH_COOKIE_NAME } from '@/lib/auth/session';

// Public routes that never require authentication
const PUBLIC_PATHS = [
  '/auth/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/seed',
  '/api/health',
  '/competitions/reading/result',
  '/api/competitions/results',
  '/certificates/verify',
  '/api/certificates/verify',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public routes without authentication
  const isPublic = PUBLIC_PATHS.some(
    (publicPath) =>
      pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );

  const rawToken = extractTokenFromRequest(request);
  const user = rawToken ? await verifyToken(rawToken) : null;

  // 2. If already logged in and visiting /auth/login, redirect to /dashboard
  if (pathname === '/auth/login' && user) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. Allow public paths to proceed
  if (isPublic) {
    return NextResponse.next();
  }

  // 4. Handle root path '/' (Allow root homepage for all visitors and staff)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // 5. Protected route checks:
  if (!user) {
    // If API route, respond with JSON 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please provide a valid session or Bearer token.',
        },
        { status: 401 }
      );
    }

    // If web page route, redirect to login page with return url
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set(
      'redirect',
      pathname + (request.nextUrl.search || '')
    );

    // If there is an expired/invalid cookie, clear it on redirect
    const response = NextResponse.redirect(loginUrl);
    if (request.cookies.has(AUTH_COOKIE_NAME)) {
      response.cookies.delete(AUTH_COOKIE_NAME);
    }
    return response;
  }

  // 6. User is authenticated - inject header claims for downstream route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.userId);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-name', user.name);
  requestHeaders.set('x-user-username', user.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image/asset extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
