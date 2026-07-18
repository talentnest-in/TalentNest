import promClient from 'prom-client';
import { getRedisService } from './redis';
import { prisma } from './prisma';

// Default metrics (CPU, memory, event loop, GC)
promClient.collectDefaultMetrics({ prefix: 'talentnest_' });

// ── HTTP request duration histogram ──────────────────────────────────
export const httpRequestDuration = new promClient.Histogram({
  name: 'talentnest_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
});

// ── HTTP request counter ─────────────────────────────────────────────
export const httpRequestTotal = new promClient.Counter({
  name: 'talentnest_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// ─── Database query duration histogram ────────────────────────────────
export const dbQueryDuration = new promClient.Histogram({
  name: 'talentnest_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['model', 'operation'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2],
});

// ── Redis operation counter ───────────────────────────────────────────
export const redisOperationsTotal = new promClient.Counter({
  name: 'talentnest_redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status'],
});

// ── Cache hit/miss counter ────────────────────────────────────────────
export const cacheHitTotal = new promClient.Counter({
  name: 'talentnest_cache_hits_total',
  help: 'Cache hit/miss counter',
  labelNames: ['type'],
});

// ── Active connections gauge ──────────────────────────────────────────
export const activeConnections = new promClient.Gauge({
  name: 'talentnest_active_connections',
  help: 'Number of active connections',
});

// ── Application info gauge (build info) ───────────────────────────────
export const appInfo = new promClient.Gauge({
  name: 'talentnest_app_info',
  help: 'Application build info',
  labelNames: ['version', 'node_version', 'environment'],
});

const pkg = require('../../package.json');
appInfo.set({ version: pkg.version, node_version: process.version, environment: process.env.NODE_ENV || 'development' }, 1);

// ── Metrics endpoint handler ──────────────────────────────────────────
export async function metricsHandler(): Promise<string> {
  // Update Redis-specific gauges before exposing
  try {
    const redisSvc = getRedisService();
    const redisOk = redisSvc?.isConnected ? 1 : 0;
    new promClient.Gauge({ name: 'talentnest_redis_connected', help: 'Redis connection status' }).set(redisOk);
  } catch {
    // ignore
  }

  return await promClient.register.metrics();
}

// ── Usage helpers ─────────────────────────────────────────────────────
export function observeDbQuery(model: string, operation: string, durationMs: number): void {
  dbQueryDuration.observe({ model, operation }, durationMs / 1000);
}

export function incrementRedisOp(operation: string, status: 'success' | 'error'): void {
  redisOperationsTotal.inc({ operation, status });
}

export function recordCacheHit(hit: boolean): void {
  cacheHitTotal.inc({ type: hit ? 'hit' : 'miss' });
}
