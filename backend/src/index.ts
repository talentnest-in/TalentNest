import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { ZodError } from 'zod';
import { prisma } from './lib/prisma';
import { disconnectRedis, getRedisService } from './lib/redis';
import { getCacheService } from './lib/cache';
import { warmCache } from './lib/cache-warmer';
import { initTracer, shutdownTracer } from './lib/tracer';
import { httpRequestDuration, httpRequestTotal, activeConnections, metricsHandler } from './lib/metrics';
import { logger, createRequestId } from './lib/logger';
import { userRateLimiter } from './lib/rate-limiter';
import { registerSecurityHeaders } from './lib/helmet-security';
import { initSentry, sentryRequestHandler, sentryErrorHandler as sentryErrHandler } from './lib/sentry';
import { startMetricCollection, stopMetricCollection, collectMetrics } from './lib/metrics-enhanced';
import csrfPlugin from './lib/csrf';
import versioningPlugin from './lib/versioning';
import { flagRoutes } from './lib/flags/routes';
import { advancedRateLimiter } from './lib/rate-limiter-advanced';
import { registerVersionedRoutes } from './lib/versioned-routes';
import { queueManager, QUEUES } from './lib/queue';
import { authRoutes } from './routes/auth.routes';
import { courseRoutes } from './routes/course.routes';
import { lessonRoutes } from './routes/lesson.routes';
import { enrollmentRoutes } from './routes/enrollment.routes';
import { certificateRoutes } from './routes/certificate.routes';
import { reviewRoutes } from './routes/review.routes';
import { creatorRoutes } from './routes/creator.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { contestRoutes } from './routes/contest.routes';

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
  logger: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        requestId: req.id,
        ip: req.ip,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
      err: (err: any) => ({
        type: err.name,
        message: err.message,
        stack: err.stack ?? '',
      }),
    },
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token'],
      censor: '***',
    },
  },
  bodyLimit: 100 * 1024 * 1024, // 100MB limit for video uploads
  trustProxy: true, // Trust nginx proxy headers for correct IP detection
  genReqId: () => createRequestId(),
  requestIdHeader: 'x-request-id',
});

// ── Initialize OpenTelemetry (non-blocking, graceful fallback) ────────
initTracer();

// ── Initialize Sentry (non-blocking) ────────────────────────────────
initSentry().catch(() => {});
server.addHook('onRequest', sentryRequestHandler);

// ── Security Headers (CSP, HSTS, etc.) ──────────────────────────────
server.register(registerSecurityHeaders);

// Register CORS
server.register(cors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow configured frontend URL
    const allowedOrigins = [
      process.env.FRONTEND_URL?.replace(/\/$/, ''),
      'http://localhost:5173',
      'https://talentnest-zrk2.onrender.com',
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

// ── Response compression ────────────────────────────────────────────
server.register(compress, { global: true, threshold: 1024 });

// ── Metrics instrumentation ─────────────────────────────────────────
server.addHook('onRequest', async (request) => {
  activeConnections.inc();
  (request as any).startTime = Date.now();
});

server.addHook('onResponse', async (request, reply) => {
  activeConnections.dec();
  const startTime = (request as any).startTime;
  if (startTime) {
    const duration = (Date.now() - startTime) / 1000;
    httpRequestDuration.observe(
      { method: request.method, route: request.routeOptions?.url || 'unknown', status_code: reply.statusCode },
      duration,
    );
    httpRequestTotal.inc(
      { method: request.method, route: request.routeOptions?.url || 'unknown', status_code: reply.statusCode },
    );
  }
});

// ── Per-user rate limiting middleware (authenticated routes) ──────────
server.addHook('preHandler', async (request, reply) => {
  const user = (request as any).user;
  if (!user?.id) return;

  let zone = 'general';
  if (request.url.includes('/auth/')) zone = 'auth';
  else if (request.url.includes('/password') || request.url.includes('/delete')) zone = 'sensitive';

  const result = await userRateLimiter.check(String(user.id), zone);
  if (!result.allowed) {
    reply.header('Retry-After', String(Math.ceil(result.resetMs / 1000)));
    return reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'User rate limit exceeded. Try again later.',
    });
  }
});

// ── Advanced route-specific rate limiting ──────────────────────────────
server.addHook('preHandler', async (request, reply) => {
  const userId = (request as any).user?.id as string | undefined;
  const result = await advancedRateLimiter.check(request.url, userId);
  if (!result.allowed) {
    reply.header('Retry-After', String(Math.ceil(result.resetMs / 1000)));
    reply.header('X-RateLimit-Limit', String(result.zone));
    reply.header('X-RateLimit-Remaining', String(result.remaining));
    return reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded for this endpoint. Try again later.',
    });
  }
});

// Connect Redis before registering Redis-dependent plugins (graceful fallback)
server.register(async function redisInit(instance) {
  const redisSvc = getRedisService();
  await redisSvc.connect();
  if (redisSvc.isConnected) {
    instance.log.info('Redis connected');

    // Initialize cache service
    getCacheService();

    // Warm cache asynchronously (non-blocking)
    warmCache().catch((err) => {
      instance.log.warn({ err: String(err) }, 'Cache warming failed');
    });
  } else {
    instance.log.warn('Redis unavailable — running without cache/Redis rate limiting');
  }

  // Register rate limit (Redis-backed if available)
  const rateLimitOpts: any = {
    max: 100,
    timeWindow: '1 minute',
    skipOnError: true,
  };
  if (redisSvc.isConnected && redisSvc.client) {
    // rateLimitOpts.redis = redisSvc.client; // @fastify/rate-limit expects ioredis but we are using node-redis v4. Disabling this to use in-memory store instead and avoid 'defineCommand is not a function' crash.
    instance.log.info('Rate limiting using Redis storage is disabled due to client mismatch. Using in-memory.');
  } else {
    instance.log.info('Rate limiting using in-memory storage (single instance only)');
  }
  instance.register(rateLimit, rateLimitOpts);
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

import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';

server.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for video uploads
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
  } catch (err) {
    // Fallback: try HttpOnly cookie
    const token = request.cookies.token;
    if (token) {
      try {
        const decoded = server.jwt.verify(token);
        request.user = decoded as any;
        return;
      } catch (cookieErr) {
        // Token in cookie is also invalid — fall through to 401
        console.error('Cookie token verification failed:', cookieErr);
      }
    }
    console.error('Authentication failed - No valid token found');
    console.error('Request cookies:', Object.keys(request.cookies));
    console.error('Request auth header:', request.headers.authorization);
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Authentication required' });
  }

  // Check if user is suspended
  const userId = (request.user as any)?.id;
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuspended: true },
      });
      if (user?.isSuspended) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Account suspended',
        });
      }
    } catch {
      // If DB check fails, allow the request to proceed
    }
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

  // Capture 5xx errors in Sentry
  if (error.statusCode >= 500 || !error.statusCode) {
    sentryErrHandler(error, request, reply);
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
import { adminRoutes } from './routes/admin.routes';
import { onboardingRoutes } from './routes/onboarding.routes';
import { savedJobRoutes } from './routes/saved-job.routes';
import { applicationRoutes } from './routes/application.routes';
import { clientApplicationRoutes } from './routes/client-application.routes';
import { offerRoutes } from './routes/offer.routes';
import { contractRoutes } from './routes/contract.routes';
import { chatRoutes } from './routes/chat.routes';
import { notificationRoutes } from './routes/notification.routes';
import { uploadRoutes } from './routes/upload.routes';
import { milestoneRoutes } from './routes/milestone.routes';
import { noteRoutes } from './routes/note.routes';
import { workspaceFileRoutes } from './routes/workspace-file.routes';
import { communityRoutes } from './routes/community.routes';
import { postRoutes } from './routes/post.routes';
import { searchRoutes } from './routes/search.routes';
import { gamificationRoutes } from './routes/gamification.routes';
import socketPlugin from './plugins/socket';
import { registerAllWorkers, closeAllWorkers } from './workers';

server.register(authRoutes, { prefix: '/api/v1/auth' });
server.register(freelancerRoutes, { prefix: '/api/v1/freelancers' });
server.register(portfolioRoutes, { prefix: '/api/v1/portfolio' });
server.register(clientRoutes, { prefix: '/api/v1/clients' });
server.register(clientJobRoutes, { prefix: '/api/v1/client/jobs' });
server.register(jobRoutes, { prefix: '/api/v1/jobs' });
server.register(onboardingRoutes, { prefix: '/api/v1/onboarding' });
server.register(adminRoutes, { prefix: '/api/v1/admin' });
server.register(savedJobRoutes, { prefix: '/api/v1' });
server.register(applicationRoutes, { prefix: '/api/v1' });
server.register(clientApplicationRoutes, { prefix: '/api/v1' });
server.register(offerRoutes, { prefix: '/api/v1/offers' });
server.register(contractRoutes, { prefix: '/api/v1/contracts' });
server.register(chatRoutes, { prefix: '/api/v1/chat' });
server.register(notificationRoutes, { prefix: '/api/v1' });
server.register(uploadRoutes, { prefix: '/api/v1' });
server.register(milestoneRoutes, { prefix: '/api/v1' });
server.register(noteRoutes, { prefix: '/api/v1' });
server.register(workspaceFileRoutes, { prefix: '/api/v1' });
server.register(courseRoutes, { prefix: '/api/v1' });
server.register(lessonRoutes, { prefix: '/api/v1' });
server.register(enrollmentRoutes, { prefix: '/api/v1' });
server.register(certificateRoutes, { prefix: '/api/v1' });
server.register(reviewRoutes, { prefix: '/api/v1' });
server.register(creatorRoutes, { prefix: '/api/v1' });
server.register(analyticsRoutes, { prefix: '/api/v1' });
server.register(communityRoutes, { prefix: '/api/v1/community' });
server.register(postRoutes, { prefix: '/api/v1/posts' });
server.register(contestRoutes, { prefix: '/api/v1/contests' });
server.register(searchRoutes, { prefix: '/api/v1/search' });
server.register(gamificationRoutes, { prefix: '/api/v1/gamification' });

// Register Socket.IO plugin
server.register(socketPlugin);

// Register CSRF protection (production only)
server.register(csrfPlugin);

// Register API versioning (adds deprecation headers, version detection)
server.register(versioningPlugin);

// Register feature flag routes (public + admin)
server.register(flagRoutes);

// Register API version info and v2 stub routes
server.register(registerVersionedRoutes);

const APP_START_TIME = Date.now();

// Health check route
server.get('/health', async (request, reply) => {
  const checks: Record<string, any> = {};

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
  }

  // Redis check (with ping for deeper check)
  const redisSvc = getRedisService();
  const redisPing = redisSvc?.isConnected ? await redisSvc.ping().catch(() => false) : false;
  checks.redis = redisPing ? 'connected' : (redisSvc?.isConnected ? 'degraded' : 'disconnected');

  // Socket.IO check
  try {
    const { getIO } = await import('./plugins/socket.js');
    const io = getIO();
    checks.socketio = io ? 'running' : 'not_ready';
    const sockets = io?.engine?.clientsCount || 0;
    checks.socket_connections = sockets;
  } catch {
    checks.socketio = 'not_initialized';
    checks.socket_connections = 0;
  }

  // BullMQ Queue statuses
  checks.queues = {};
  for (const key of Object.keys(QUEUES)) {
    const name = QUEUES[key as keyof typeof QUEUES];
    const status = await queueManager.getQueueStatus(name);
    checks.queues[name] = {
      waiting: status.waiting,
      active: status.active,
      failed: status.failed,
      delayed: status.delayed,
    };
  }

  // Memory & CPU
  const mem = process.memoryUsage();
  const uptimeSeconds = Math.floor((Date.now() - APP_START_TIME) / 1000);
  const cpus = require('os').cpus();
  const totalIdle = cpus.reduce((acc: number, cpu: any) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce((acc: number, cpu: any) => {
    return acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
  }, 0);
  const cpuPercent = Math.round((100 - (totalIdle / totalTick) * 100) * 100) / 100;

  // Build version info
  const pkg = require('../package.json');

  const allOk = checks.database === 'connected';
  if (!allOk) reply.status(503);

  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate');

  return {
    status: allOk ? 'ok' : 'error',
    version: pkg.version || '1.0.0',
    uptime: uptimeSeconds,
    application: 'TalentNest API',
    node_version: process.version,
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round((mem.external || 0) / 1024 / 1024) + 'MB',
    },
    cpu: {
      usage_percent: cpuPercent,
      cores: cpus.length,
    },
    ...checks,
    services: {
      database: checks.database,
      redis: checks.redis,
      socketio: checks.socketio,
      queues: checks.queues,
    },
    timestamp: new Date().toISOString(),
  };
});

// Metrics endpoint (Prometheus exposition format)
server.get('/metrics', async (request, reply) => {
  reply.header('Content-Type', 'text/plain; charset=utf-8');
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate');
  return await metricsHandler();
});

const start = async () => {
  // Register BullMQ workers after Redis is initialized
  registerAllWorkers();

  // Start enhanced metric collection
  startMetricCollection();
  await collectMetrics();

  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  server.log.info('Shutting down...');
  stopMetricCollection();
  await closeAllWorkers();
  await shutdownTracer();
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  server.log.info('Shutting down...');
  stopMetricCollection();
  await closeAllWorkers();
  await shutdownTracer();
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
});

start();
