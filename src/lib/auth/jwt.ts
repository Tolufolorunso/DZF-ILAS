import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@/models/User';

export interface ITokenPayload {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  [key: string]: unknown;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is missing in production environment. Refusing to start.'
      );
    }
    return 'dzf_ilas_academic_jwt_secret_key_change_in_production_2026';
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable must be at least 32 characters long in production.'
    );
  }
  return secret;
}

function getJwtKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

const DEFAULT_EXPIRATION = process.env.JWT_EXPIRES_IN || '2d';

/**
 * Sign an Edge-compatible JWT token with user claims
 * @param payload - User session data
 * @returns Signed JWT string
 */
export async function signToken(
  payload: ITokenPayload,
  expiresIn: string = DEFAULT_EXPIRATION
): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtKey());
}

/**
 * Verify and decode an Edge-compatible JWT token
 * @param token - JWT string to verify
 * @returns Decoded payload or null if invalid or expired
 */
export async function verifyToken(
  token: string
): Promise<ITokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey());
    if (!payload.userId || !payload.username) {
      return null;
    }

    return {
      userId: String(payload.userId),
      username: String(payload.username),
      name: String(payload.name || ''),
      role: (payload.role as UserRole) || 'librarian',
    };
  } catch {
    return null;
  }
}
