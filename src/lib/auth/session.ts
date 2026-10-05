import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, ITokenPayload } from './jwt';
import { hasRole } from './rbac';
import type { UserRole } from '@/models/User';

export const AUTH_COOKIE_NAME = 'ils_token';

/**
 * Extract raw JWT token string from either:
 * 1. Authorization: Bearer <token> header (Android mobile / API clients)
 * 2. ils_token HTTP-only cookie (Next.js web browser sessions)
 */
export function extractTokenFromRequest(
  request?: Request | NextRequest
): string | null {
  if (request) {
    // 1. Check Authorization header
    const authHeader =
      request.headers.get('authorization') ||
      request.headers.get('Authorization');

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[1]) {
        return parts[1].trim();
      }
    }

    // 2. Check NextRequest cookies map if present
    if ('cookies' in request && typeof request.cookies.get === 'function') {
      const cookieVal = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (cookieVal) {
        return cookieVal;
      }
    }

    // 3. Fallback: Parse raw Cookie header string
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));

      if (match) {
        return match.substring(AUTH_COOKIE_NAME.length + 1).trim();
      }
    }
  }

  return null;
}

/**
 * Get authenticated session user from request or Next.js server cookie context
 */
export async function getSessionUser(
  request?: Request | NextRequest
): Promise<ITokenPayload | null> {
  let token = extractTokenFromRequest(request);

  // If not found on request, attempt reading from Next.js server cookies() (Server Components)
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
    } catch {
      // In contexts without cookies() (e.g. background tasks or middleware), ignore
    }
  }

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Authentication guard for Route Handlers.
 * Returns either { user } or an unauthorized NextResponse (HTTP 401 or 403).
 */
export async function requireAuth(
  request: Request | NextRequest,
  allowedRoles?: UserRole[]
): Promise<
  | { user: ITokenPayload; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const user = await getSessionUser(request);

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please log in or provide a valid Bearer token.',
        },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(user.role, allowedRoles)) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
          },
          { status: 403 }
        ),
      };
    }
  }

  return {
    user,
    errorResponse: null,
  };
}
