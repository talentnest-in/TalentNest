import jwt from 'jsonwebtoken';
import { getRedisService } from './redis';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '900', 10); // 15 min
const REFRESH_EXPIRES_IN = parseInt(process.env.REFRESH_EXPIRES_IN || '604800', 10); // 7 days
const BLACKLIST_PREFIX = 'token:blacklisted:';

export function generateAccessToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(payload: { id: string }): string {
  const tokenId = randomBytes(16).toString('hex');
  return jwt.sign({ ...payload, tokenId }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token: string): { id: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { id: string; tokenId: string } | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as { id: string; tokenId: string };
  } catch {
    return null;
  }
}

export function rotateTokens(payload: { id: string; role: string }): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: payload.id }),
  };
}

export async function revokeToken(tokenId: string, ttlSeconds: number = 7 * 86400): Promise<void> {
  const redis = getRedisService();
  if (!redis.isConnected || !redis.client) return;
  try {
    await redis.client.setEx(`${BLACKLIST_PREFIX}${tokenId}`, ttlSeconds, 'revoked');
  } catch {
    // silent
  }
}

export async function isTokenRevoked(tokenId: string): Promise<boolean> {
  const redis = getRedisService();
  if (!redis.isConnected || !redis.client) return false;
  try {
    const result = await redis.client.get(`${BLACKLIST_PREFIX}${tokenId}`);
    return result === 'revoked';
  } catch {
    return false;
  }
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
};

export const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  path: '/api/v1/auth/refresh',
  maxAge: 7 * 24 * 60 * 60,
};
