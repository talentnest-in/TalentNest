import { FastifyInstance } from 'fastify';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { googleCallback, githubCallback } from '../controllers/oauth.controller';

export async function authRoutes(server: FastifyInstance) {
  // ── Credentials-based auth ──
  server.post('/register', register);
  server.post('/login', login);
  server.post('/logout', logout);
  server.get('/me', { preValidation: [server.authenticate] }, getMe);
  server.post('/forgot-password', forgotPassword);
  server.post('/reset-password', resetPassword);

  // ── Google OAuth ──
  // The `/google` route is automatically registered by @fastify/oauth2's startRedirectPath
  server.get('/google/callback', googleCallback);

  // ── GitHub OAuth ──
  // The `/github` route is automatically registered by @fastify/oauth2's startRedirectPath
  server.get('/github/callback', githubCallback);
}
