import { RedisService, getRedisService } from './redis';

const CACHE_PREFIX = 'cache:';

export const CACHE_TTL = {
  JOBS: 60,
  JOB_DETAIL: 30,
  CATEGORIES: 300,
  SKILLS: 300,
  FREELANCER_LIST: 60,
  DASHBOARD_SUMMARY: 60,
  PUBLIC_PROFILE: 120,
} as const;

export class CacheService {
  constructor(private redis: RedisService | null) {}

  private get isAvailable(): boolean {
    return this.redis !== null && this.redis.isConnected;
  }

  private prefix(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable) return null;
    try {
      const raw = await this.redis!.get(this.prefix(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.isAvailable) return;
    try {
      await this.redis!.setEx(this.prefix(key), ttlSeconds, JSON.stringify(value));
    } catch {
      // silent fail
    }
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.isAvailable) return;
    try {
      const keys = await this.redis!.keys(`${CACHE_PREFIX}${pattern}`);
      if (keys.length > 0) {
        await this.redis!.del(keys);
      }
    } catch {
      // silent fail
    }
  }

  async invalidateAll(): Promise<void> {
    if (!this.isAvailable) return;
    try {
      const keys = await this.redis!.keys(`${CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis!.del(keys);
      }
    } catch {
      // silent fail
    }
  }

  async getOrFetch<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    if (!this.isAvailable) return fn();
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

let cacheInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService(getRedisService());
  }
  return cacheInstance;
}

export function resetCacheInstance(): void {
  cacheInstance = null;
}
