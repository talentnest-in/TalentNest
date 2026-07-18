import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';

const SALT_LENGTH = 16;
const TOKEN_LENGTH = 32;

function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

export default fp(async function csrfPlugin(server: FastifyInstance) {
  if (process.env.NODE_ENV !== 'production') {
    server.log.info('CSRF protection disabled in development');
    return;
  }

  // In-memory store for CSRF tokens (per session)
  const csrfTokens = new Map<string, { token: string; expiresAt: number }>();
  const TOKEN_TTL = 3600_000; // 1 hour

  // Clean expired tokens periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of csrfTokens) {
      if (value.expiresAt < now) csrfTokens.delete(key);
    }
  }, 600_000);

  // Add CSRF token endpoint
  server.get('/api/v1/csrf-token', async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = (request as any).user?.id || request.ip;
    const token = generateCsrfToken();
    csrfTokens.set(sessionId, { token, expiresAt: Date.now() + TOKEN_TTL });
    reply.setCookie('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    return { token };
  });

  // CSRF validation middleware for mutation requests
  server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return;

    const skipPaths = [
      '/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh',
      '/api/v1/auth/forgot-password', '/api/v1/auth/reset-password',
      '/api/v1/auth/google', '/api/v1/auth/google/callback',
      '/api/v1/auth/github', '/api/v1/auth/github/callback',
      '/health', '/metrics', '/api/v1/csrf-token',
    ];

    if (skipPaths.some(p => request.url.startsWith(p))) return;

    const cookieToken = request.cookies['csrf-token'];
    const headerToken = request.headers['x-csrf-token'] as string;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Invalid or missing CSRF token',
      });
    }

    const sessionId = (request as any).user?.id || request.ip;
    const stored = csrfTokens.get(sessionId);
    if (!stored || stored.token !== cookieToken || stored.expiresAt < Date.now()) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'CSRF token expired or invalid',
      });
    }
  });

  server.log.info('CSRF protection enabled');
});
