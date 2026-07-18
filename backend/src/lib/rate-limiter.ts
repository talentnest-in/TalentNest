import { getRedisService } from './redis';

interface UserRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaults: Record<string, UserRateLimitConfig> = {
  general: { windowMs: 60_000, maxRequests: 100 },
  auth: { windowMs: 60_000, maxRequests: 10 },
  sensitive: { windowMs: 60_000, maxRequests: 5 },
};

export class UserRateLimiter {
  async check(userId: string, zone: keyof typeof defaults = 'general'): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
    const cfg = defaults[zone]!;
    const redis = getRedisService();

    if (!redis.isConnected || !redis.client) {
      return { allowed: true, remaining: cfg.maxRequests, resetMs: 0 };
    }

    const key = `ratelimit:user:${userId}:${zone}`;
    const now = Date.now();
    const windowStart = Math.floor(now / cfg.windowMs) * cfg.windowMs;
    const windowKey = `${key}:${windowStart}`;
    const ttl = Math.ceil((windowStart + cfg.windowMs - now) / 1000);

    try {
      const multi = redis.client.multi();
      multi.incr(windowKey);
      multi.ttl(windowKey);
      const results = await multi.exec();

      const incrResult = (results as Array<[Error | null, number]>)?.[0];
      const ttlResult = (results as Array<[Error | null, number]>)?.[1];
      const count = incrResult?.[1] ?? 0;
      let currentTtl = ttlResult?.[1] ?? ttl;

      if (count === 1) {
        await redis.client.expire(windowKey, Math.max(ttl, 1));
        currentTtl = ttl;
      }

      const allowed = count <= cfg.maxRequests;
      const remaining = Math.max(0, cfg.maxRequests - count);
      return { allowed, remaining, resetMs: currentTtl * 1000 };
    } catch {
      return { allowed: true, remaining: cfg.maxRequests, resetMs: 0 };
    }
  }
}

export const userRateLimiter = new UserRateLimiter();
