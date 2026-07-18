import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';

export async function registerSecurityHeaders(server: FastifyInstance): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const sentryDsn = process.env.SENTRY_DSN || '';
  const sentryHost = sentryDsn ? new URL(sentryDsn).hostname : '';

  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://accounts.google.com',
          'https://apis.google.com',
          'https://cdn.jsdelivr.net',
          ...(sentryHost ? [`https://${sentryHost}`] : []),
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://accounts.google.com',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://*.googleusercontent.com',
          'https://avatars.githubusercontent.com',
          ...(sentryHost ? [`https://${sentryHost}`] : []),
        ],
        connectSrc: [
          "'self'",
          frontendUrl,
          'https://api.cloudinary.com',
          'https://res.cloudinary.com',
          'https://accounts.google.com',
          'https://apis.google.com',
          'wss://*.render.com',
          ...(sentryHost ? [`https://${sentryHost}`] : []),
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'https://res.cloudinary.com', 'blob:'],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },

    // HSTS — only in production
    strictTransportSecurity: isProduction ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    } : false,

    frameguard: { action: 'sameorigin' },
    noSniff: true,
    xssFilter: true,
    ieNoOpen: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    dnsPrefetchControl: { allow: false },
  });

  server.log.info('Security headers configured with CSP and HSTS');
}
