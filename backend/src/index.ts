import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { ZodError } from 'zod';
import { authRoutes } from './routes/auth.routes';

// ── Startup Environment Validation ───────────────────────────────────────────
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET', 'COOKIE_SECRET'];
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: any;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      role: string;
    };
  }
}

const server = Fastify({
  logger: true,
});

// Register Security Middlewares
server.register(cors, {
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

server.register(helmet);

// Register general rate limit for API endpoints
server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  skipOnError: true,
});

// Register JWT & Cookie for Auth
server.register(jwt, {
  secret: process.env.JWT_SECRET as string,
  sign: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
});

server.register(cookie, {
  secret: process.env.COOKIE_SECRET as string,
  hook: 'onRequest',
});

import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';

server.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

server.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/public/', // e.g. https://talentnest-zrk2.onrender.com/public/uploads/xxx.png
});

import oauthPlugin from '@fastify/oauth2';

// Resolve base URL: use BACKEND_URL in production, fall back to localhost for dev
const BACKEND_URL =
  process.env.BACKEND_URL ||
  `http://localhost:${process.env.PORT || 3001}`;

// Register Google OAuth2
server.register(oauthPlugin, {
  name: 'googleOAuth2',
  scope: ['profile', 'email'],
  credentials: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID || '',
      secret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    auth: oauthPlugin.GOOGLE_CONFIGURATION,
  },
  startRedirectPath: '/api/v1/auth/google',
  callbackUri: `${BACKEND_URL}/api/v1/auth/google/callback`,
});

// Register GitHub OAuth2
server.register(oauthPlugin, {
  name: 'githubOAuth2',
  scope: ['user:email', 'read:user'],
  credentials: {
    client: {
      id: process.env.GITHUB_CLIENT_ID || '',
      secret: process.env.GITHUB_CLIENT_SECRET || '',
    },
    auth: oauthPlugin.GITHUB_CONFIGURATION,
  },
  startRedirectPath: '/api/v1/auth/github',
  callbackUri: `${BACKEND_URL}/api/v1/auth/github/callback`,
});

server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Try Authorization: Bearer header first
    await request.jwtVerify();
  } catch {
    // Fallback: try HttpOnly cookie
    const token = request.cookies.token;
    if (token) {
      try {
        const decoded = server.jwt.verify(token);
        request.user = decoded as any;
        return;
      } catch {
        // Token in cookie is also invalid — fall through to 401
      }
    }
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Authentication required' });
  }
});

// Global Error Handler
server.setErrorHandler((error: any, request, reply) => {
  if (error instanceof ZodError) {
    reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      issues: error.issues,
    });
    return;
  }

  if (error.statusCode === 429) {
    reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
    });
    return;
  }

  server.log.error(error);
  
  reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
  });
});

// Routes
import { freelancerRoutes } from './routes/freelancer.routes';
import { portfolioRoutes } from './routes/portfolio.routes';
import { clientRoutes } from './routes/client.routes';
import { clientJobRoutes } from './routes/client-job.routes';
import { jobRoutes } from './routes/job.routes';
import { onboardingRoutes } from './routes/onboarding.routes';
import { savedJobRoutes } from './routes/saved-job.routes';
import { applicationRoutes } from './routes/application.routes';
import { clientApplicationRoutes } from './routes/client-application.routes';
import { offerRoutes } from './routes/offer.routes';
import { contractRoutes } from './routes/contract.routes';

server.register(authRoutes, { prefix: '/api/v1/auth' });
server.register(freelancerRoutes, { prefix: '/api/v1/freelancers' });
server.register(portfolioRoutes, { prefix: '/api/v1/portfolio' });
server.register(clientRoutes, { prefix: '/api/v1/clients' });
server.register(clientJobRoutes, { prefix: '/api/v1/client/jobs' });
server.register(jobRoutes, { prefix: '/api/v1/jobs' });
server.register(onboardingRoutes, { prefix: '/api/v1/onboarding' });
server.register(savedJobRoutes, { prefix: '/api/v1' });
server.register(applicationRoutes, { prefix: '/api/v1' });
server.register(clientApplicationRoutes, { prefix: '/api/v1' });
server.register(offerRoutes, { prefix: '/api/v1/offers' });
server.register(contractRoutes, { prefix: '/api/v1/contracts' });

// Health check route
server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
