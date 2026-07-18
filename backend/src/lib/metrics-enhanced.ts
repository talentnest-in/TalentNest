import promClient from 'prom-client';
import { queueManager, QUEUES } from './queue';
import { getRedisService } from './redis';
import { prisma } from './prisma';

// ── Queue Gauges ──────────────────────────────────────────────────────
export const queueWaitingGauge = new promClient.Gauge({
  name: 'talentnest_queue_waiting',
  help: 'Number of waiting jobs per queue',
  labelNames: ['queue'],
});

export const queueActiveGauge = new promClient.Gauge({
  name: 'talentnest_queue_active',
  help: 'Number of active jobs per queue',
  labelNames: ['queue'],
});

export const queueFailedGauge = new promClient.Gauge({
  name: 'talentnest_queue_failed',
  help: 'Number of failed jobs per queue',
  labelNames: ['queue'],
});

export const queueCompletedTotal = new promClient.Counter({
  name: 'talentnest_queue_completed_total',
  help: 'Total completed jobs per queue',
  labelNames: ['queue'],
});

export const queueFailedTotal = new promClient.Counter({
  name: 'talentnest_queue_failed_total',
  help: 'Total failed jobs per queue',
  labelNames: ['queue'],
});

// ── Socket.IO Gauges ──────────────────────────────────────────────────
export const socketConnections = new promClient.Gauge({
  name: 'talentnest_socket_connections',
  help: 'Number of active Socket.IO connections',
});

export const socketRooms = new promClient.Gauge({
  name: 'talentnest_socket_rooms',
  help: 'Number of active Socket.IO rooms',
});

export const socketEventsTotal = new promClient.Counter({
  name: 'talentnest_socket_events_total',
  help: 'Total Socket.IO events processed',
  labelNames: ['event'],
});

// ── Database Gauges ───────────────────────────────────────────────────
export const databaseConnected = new promClient.Gauge({
  name: 'talentnest_database_connected',
  help: 'Database connection status (1 = connected, 0 = disconnected)',
});

export const databasePoolSize = new promClient.Gauge({
  name: 'talentnest_database_pool_size',
  help: 'Database connection pool size',
});

export const databasePoolActive = new promClient.Gauge({
  name: 'talentnest_database_pool_active',
  help: 'Database active connections in pool',
});

// ── Auth Counters ─────────────────────────────────────────────────────
export const authLoginsTotal = new promClient.Counter({
  name: 'talentnest_auth_logins_total',
  help: 'Total successful login attempts',
});

export const authRegistrationsTotal = new promClient.Counter({
  name: 'talentnest_auth_registrations_total',
  help: 'Total new user registrations',
});

export const authFailuresTotal = new promClient.Counter({
  name: 'talentnest_auth_failures_total',
  help: 'Total authentication failures',
  labelNames: ['reason'],
});

// ── Business Metrics ──────────────────────────────────────────────────
export const activeUsers = new promClient.Gauge({
  name: 'talentnest_active_users',
  help: 'Number of active users (online via Socket.IO)',
});

export const jobsPostedTotal = new promClient.Counter({
  name: 'talentnest_jobs_posted_total',
  help: 'Total jobs posted',
});

export const applicationsTotal = new promClient.Counter({
  name: 'talentnest_applications_total',
  help: 'Total job applications submitted',
});

// ── CPU/Memory Gauges ─────────────────────────────────────────────────
export const cpuUsage = new promClient.Gauge({
  name: 'talentnest_cpu_usage_percent',
  help: 'CPU usage percentage',
});

export const memoryUsageBytes = new promClient.Gauge({
  name: 'talentnest_memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
});

// ── Metric Collection ─────────────────────────────────────────────────
const METRIC_COLLECTION_INTERVAL = 15000;

let collectionTimer: ReturnType<typeof setInterval> | null = null;

export function startMetricCollection(): void {
  if (collectionTimer) return;

  collectionTimer = setInterval(async () => {
    await collectMetrics();
  }, METRIC_COLLECTION_INTERVAL);
}

export async function collectMetrics(): Promise<void> {
  try {
    // Collect queue metrics
    for (const key of Object.keys(QUEUES)) {
      const name = QUEUES[key as keyof typeof QUEUES];
      const status = await queueManager.getQueueStatus(name);
      queueWaitingGauge.set({ queue: name }, status.waiting);
      queueActiveGauge.set({ queue: name }, status.active);
      queueFailedGauge.set({ queue: name }, status.failed);
    }

    // Database metrics
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseConnected.set(1);
    } catch {
      databaseConnected.set(0);
    }

    // CPU and memory
    const mem = process.memoryUsage();
    memoryUsageBytes.set({ type: 'rss' }, mem.rss);
    memoryUsageBytes.set({ type: 'heapTotal' }, mem.heapTotal);
    memoryUsageBytes.set({ type: 'heapUsed' }, mem.heapUsed);
    memoryUsageBytes.set({ type: 'external' }, mem.external || 0);

    // CPU usage via /proc/self/stat
    try {
      const uptime = process.uptime();
      const cpus = require('os').cpus();
      const totalIdle = cpus.reduce((acc: number, cpu: any) => acc + cpu.times.idle, 0);
      const totalTick = cpus.reduce((acc: number, cpu: any) => {
        return acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
      }, 0);
      const cpuPercent = 100 - (totalIdle / totalTick) * 100;
      cpuUsage.set(Math.round(cpuPercent * 100) / 100);
    } catch {
      // ignore
    }
  } catch {
    // silent collection failure
  }
}

export function stopMetricCollection(): void {
  if (collectionTimer) {
    clearInterval(collectionTimer);
    collectionTimer = null;
  }
}
