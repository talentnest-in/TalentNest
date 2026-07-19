import { Queue, Worker, ConnectionOptions, Job } from 'bullmq';
import { getRedisService, RedisService } from './redis';
import { logWarn, logError, logInfo } from './logger';

function buildConnectionFromEnv(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      const isTls = parsed.protocol === 'rediss:';
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379'),
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
        username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
        tls: isTls ? {} : undefined,
      };
    } catch {
      logWarn('[Queue]', 'Failed to parse REDIS_URL, falling back to host/port config');
    }
  }
  if (!process.env.REDIS_HOST) {
    return {};
  }
  return {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  };
}

function isRedisConfigured(): boolean {
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
}

interface QueueDefinition {
  name: string;
  queue: Queue;
}

class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private connection: ConnectionOptions;
  private redisSvc: RedisService;

  constructor(connection?: ConnectionOptions) {
    this.redisSvc = getRedisService();
    this.connection = connection || buildConnectionFromEnv();
  }

  getConnection(): ConnectionOptions {
    const url = this.redisSvc.getUrl();
    if (url) {
      try {
        const parsed = new URL(url);
        const isTls = parsed.protocol === 'rediss:';
        return {
          host: parsed.hostname,
          port: parseInt(parsed.port || '6379'),
          password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
          username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
          tls: isTls ? {} : undefined,
        };
      } catch {
        // fall through
      }
    }
    return this.connection;
  }

  defineQueue(name: string, opts?: { defaultJobOptions?: any }): Queue | null {
    if (!isRedisConfigured()) {
      console.warn(`[Queue] Skipped queue "${name}" — no Redis configured`);
      return null;
    }
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }
    const queue = new Queue(name, {
      connection: this.getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400, count: 50 },
        ...opts?.defaultJobOptions,
      },
    });
    this.queues.set(name, queue);
    return queue;
  }

  defineWorker<T = any>(
    name: string,
    processor: (job: Job<T>) => Promise<void>,
    opts?: { concurrency?: number; limiter?: { max: number; duration: number } }
  ): Worker | null {
    if (!isRedisConfigured()) {
      logWarn('[Queue]', `Worker "${name}" skipped — no Redis configured (set REDIS_URL)`);
      return null;
    }
    if (this.workers.has(name)) {
      return this.workers.get(name)!;
    }
    const workerOptions: any = {
      connection: this.getConnection(),
      concurrency: opts?.concurrency || 5,
      lockDuration: 60000,
      stalledInterval: 30000,
      maxStalledCount: 3,
    };
    if (opts?.limiter) {
      workerOptions.limiter = opts.limiter;
    }
    const worker = new Worker<T>(
      name,
      async (job) => {
        try {
          await processor(job);
        } catch (err) {
          logError(`[Worker:${name}]`, err, { jobId: job.id });
          throw err;
        }
      },
      workerOptions
    );

    worker.on('completed', (job) => {
      logInfo(`[Worker:${name}]`, `Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      logError(`[Worker:${name}]`, err, { jobId: job?.id, context: 'failed_after_retries' });
    });

    worker.on('error', (err) => {
      const msg = err.message || String(err);
      if (!msg.includes('ECONNREFUSED')) {
        logError(`[Worker:${name}]`, err, { context: 'worker_error' });
      }
    });

    this.workers.set(name, worker);
    return worker;
  }

  async getQueue(name: string): Promise<Queue | undefined> {
    return this.queues.get(name);
  }

  async addJob(name: string, data: any, opts?: any): Promise<Job | undefined> {
    const queue = this.queues.get(name);
    if (!queue) {
      logWarn('[Queue]', `Queue "${name}" not defined`);
      return undefined;
    }
    try {
      return await queue.add(name, data, opts);
    } catch (err) {
      logError('[Queue]', err, { queue: name, context: 'add_job' });
      return undefined;
    }
  }

  async getQueueStatus(name: string): Promise<{ waiting: number; active: number; completed: number; failed: number; delayed: number }> {
    const queue = this.queues.get(name);
    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }

  async close(): Promise<void> {
    for (const [name, worker] of this.workers) {
      await worker.close();
      logInfo('[Queue]', `Worker "${name}" closed`);
    }
    for (const [name, queue] of this.queues) {
      await queue.close();
      logInfo('[Queue]', `Queue "${name}" closed`);
    }
  }
}

export const queueManager = new QueueManager();

// ── Queue Names ──────────────────────────────────────────────────────
export const QUEUES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  GAMIFICATION: 'gamification',
  LEADERBOARD: 'leaderboard',
  BADGE: 'badge',
  ANALYTICS: 'analytics',
  RECOMMENDATION: 'recommendation',
} as const;
