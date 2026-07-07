import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { googleCallback, githubCallback } from '../controllers/oauth.controller';

export async function authRoutes(server: FastifyInstance) {
  // ── Rate limiting for auth endpoints ──
  const authRateLimitOptions = {
    max: 5,
    timeWindow: '1 minute',
    skipOnError: true,
  };

  const passwordResetRateLimitOptions = {
    max: 3,
    timeWindow: '1 minute',
    skipOnError: true,
  };

  const oauthRateLimitOptions = {
    max: 20,
    timeWindow: '1 minute',
    skipOnError: true,
  };

  // ── Credentials-based auth ──
  server.post('/register', { config: { rateLimit: authRateLimitOptions } }, register);
  server.post('/login', { config: { rateLimit: authRateLimitOptions } }, login);
  server.post('/logout', logout);
  server.post('/refresh', refresh);
  server.get('/me', { preValidation: [server.authenticate] }, getMe);
  server.post('/forgot-password', { config: { rateLimit: passwordResetRateLimitOptions } }, forgotPassword);
  server.post('/reset-password', { config: { rateLimit: passwordResetRateLimitOptions } }, resetPassword);

  // ── Google OAuth ──
  // The `/google` route is automatically registered by @fastify/oauth2's startRedirectPath
  server.get('/google/callback', { config: { rateLimit: oauthRateLimitOptions } }, googleCallback);

  // ── GitHub OAuth ──
  // The `/github` route is automatically registered by @fastify/oauth2's startRedirectPath
  server.get('/github/callback', { config: { rateLimit: oauthRateLimitOptions } }, githubCallback);
}
