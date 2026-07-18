import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { queueManager, QUEUES } from './queue';
import { FastifyRequest, FastifyReply } from 'fastify';

const isConfigured = !!process.env.SENTRY_DSN;

export async function initSentry(): Promise<void> {
  if (!isConfigured) {
    console.log('[Sentry] Disabled — no SENTRY_DSN set');
    return;
  }

  const integrations: any[] = [
    nodeProfilingIntegration(),
    Sentry.httpIntegration(),
  ];

  try {
    const { prisma } = await import('./prisma.js');
    integrations.push(Sentry.prismaIntegration({ prismaClient: prisma } as any));
  } catch {
    console.warn('[Sentry] Prisma integration not available');
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `talentnest-backend@${process.env.npm_package_version || '1.0.0'}`,
    integrations,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
    maxBreadcrumbs: 50,
    debug: process.env.SENTRY_DEBUG === 'true',
    beforeSend(event) {
      if (event.request?.url?.includes('/health') || event.request?.url?.includes('/metrics')) {
        return null;
      }
      return event;
    },
  });

  console.log('[Sentry] Initialized');
}

export function captureQueueError(queueName: string, jobId: string | undefined, error: Error): void {
  if (!isConfigured) return;
  Sentry.captureException(error, {
    tags: { queue: queueName, jobId: jobId || 'unknown' },
    level: 'error',
  });
}

export function captureAuthEvent(event: string, userId: string, details?: Record<string, unknown>): void {
  if (!isConfigured) return;
  Sentry.captureEvent({
    message: `Auth: ${event}`,
    level: 'info',
    tags: { auth_event: event, userId },
    extra: details || {},
  });
}

export function sentryRequestHandler(request: FastifyRequest, _reply: FastifyReply, done: () => void): void {
  if (!isConfigured) { done(); return; }
  Sentry.setExtra('requestId', request.id);
  Sentry.setExtra('method', request.method);
  Sentry.setExtra('url', request.url);
  Sentry.setTag('request_id', String(request.id));
  done();
}

export function sentryErrorHandler(error: any, _request: FastifyRequest, _reply: FastifyReply): void {
  if (!isConfigured) return;
  if (error?.statusCode && error.statusCode < 500) return;
  Sentry.captureException(error);
}

export async function reportQueueMetrics(): Promise<void> {
  if (!isConfigured) return;
  try {
    for (const name of Object.values(QUEUES)) {
      const status = await queueManager.getQueueStatus(name);
      Sentry.metrics.gauge(`queue.${name}.waiting`, status.waiting);
      Sentry.metrics.gauge(`queue.${name}.active`, status.active);
      Sentry.metrics.gauge(`queue.${name}.failed`, status.failed);
    }
  } catch {
    // silent
  }
}

export default Sentry;
