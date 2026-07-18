import { getRedisService } from './redis';

interface RouteRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  burstSize?: number;
}

const routeDefaults: Record<string, RouteRateLimitConfig> = {
  // Auth endpoints
  'auth:login': { windowMs: 60_000, maxRequests: 5, burstSize: 3 },
  'auth:register': { windowMs: 3600_000, maxRequests: 3, burstSize: 1 },
  'auth:forgot-password': { windowMs: 60_000, maxRequests: 3, burstSize: 1 },
  'auth:reset-password': { windowMs: 60_000, maxRequests: 3, burstSize: 1 },
  'auth:refresh': { windowMs: 60_000, maxRequests: 10 },
  'auth:oauth': { windowMs: 60_000, maxRequests: 20 },

  // Job endpoints
  'jobs:apply': { windowMs: 60_000, maxRequests: 10, burstSize: 5 },
  'jobs:create': { windowMs: 60_000, maxRequests: 20 },
  'jobs:search': { windowMs: 60_000, maxRequests: 60 },

  // Chat endpoints
  'chat:send': { windowMs: 60_000, maxRequests: 60, burstSize: 10 },
  'chat:create-conversation': { windowMs: 60_000, maxRequests: 30 },

  // Search
  'search:global': { windowMs: 60_000, maxRequests: 30 },

  // Public APIs
  'public:health': { windowMs: 60_000, maxRequests: 300 },
  'public:metrics': { windowMs: 60_000, maxRequests: 60 },
  'public:jobs': { windowMs: 60_000, maxRequests: 120 },

  // Authenticated APIs
  'api:general': { windowMs: 60_000, maxRequests: 100 },
  'api:authenticated': { windowMs: 60_000, maxRequests: 200 },

  // Admin APIs
  'admin:general': { windowMs: 60_000, maxRequests: 300 },
  'admin:sensitive': { windowMs: 60_000, maxRequests: 50 },
};

const ROUTE_PATTERNS: Array<{ pattern: RegExp; zone: string }> = [
  { pattern: /\/api\/v[12]\/auth\/login/, zone: 'auth:login' },
  { pattern: /\/api\/v[12]\/auth\/register/, zone: 'auth:register' },
  { pattern: /\/api\/v[12]\/auth\/forgot-password/, zone: 'auth:forgot-password' },
  { pattern: /\/api\/v[12]\/auth\/reset-password/, zone: 'auth:reset-password' },
  { pattern: /\/api\/v[12]\/auth\/refresh/, zone: 'auth:refresh' },
  { pattern: /\/api\/v[12]\/auth\/google/, zone: 'auth:oauth' },
  { pattern: /\/api\/v[12]\/auth\/github/, zone: 'auth:oauth' },
  { pattern: /\/api\/v[12]\/jobs\/[^/]+\/apply/, zone: 'jobs:apply' },
  { pattern: /\/api\/v[12]\/client\/jobs/, zone: 'jobs:create' },
  { pattern: /\/api\/v[12]\/jobs/, zone: 'jobs:search' },
  { pattern: /\/api\/v[12]\/chat\/.*\/messages/, zone: 'chat:send' },
  { pattern: /\/api\/v[12]\/chat/, zone: 'chat:create-conversation' },
  { pattern: /\/api\/v[12]\/search/, zone: 'search:global' },
  { pattern: /^\/health$/, zone: 'public:health' },
  { pattern: /^\/metrics$/, zone: 'public:metrics' },
  { pattern: /\/api\/v[12]\/admin\/(?!sensitive)/, zone: 'admin:general' },
  { pattern: /\/api\/v[12]\/admin\/(settings|users)/, zone: 'admin:sensitive' },
  { pattern: /\/api\/v[12]/, zone: 'api:authenticated' },
];

export class AdvancedRateLimiter {
  async check(requestPath: string, userId?: string): Promise<{ allowed: boolean; remaining: number; resetMs: number; zone: string }> {
    const zone = this.matchRoute(requestPath);
    const cfg = routeDefaults[zone];
    if (!cfg) {
      return { allowed: true, remaining: 999, resetMs: 0, zone: 'unknown' };
    }

    const key = userId
      ? `ratelimit:route:${zone}:${userId}`
      : `ratelimit:ip:${zone}:${this.ipFromRequest(requestPath)}`;

    const redis = getRedisService();
    if (!redis.isConnected || !redis.client) {
      return { allowed: true, remaining: cfg.maxRequests, resetMs: 0, zone };
    }

    const now = Date.now();
    const windowStart = Math.floor(now / cfg.windowMs) * cfg.windowMs;
    const windowKey = `${key}:${windowStart}`;
    const ttl = Math.ceil((windowStart + cfg.windowMs - now) / 1000);

    try {
      const multi = redis.client.multi();
      multi.incr(windowKey);
      multi.ttl(windowKey);
      const results = (await multi.exec()) as unknown as number[];

      const count = results?.[0] ?? 0;
      let currentTtl = results?.[1] ?? ttl;

      if (count === 1) {
        await redis.client.expire(windowKey, Math.max(ttl, 1));
        currentTtl = ttl;
      }

      const burstLimit = cfg.burstSize || cfg.maxRequests;
      const allowed = count <= burstLimit;
      const remaining = Math.max(0, burstLimit - count);
      return { allowed, remaining, resetMs: currentTtl * 1000, zone };
    } catch {
      return { allowed: true, remaining: cfg.maxRequests, resetMs: 0, zone };
    }
  }

  private matchRoute(path: string): string {
    for (const { pattern, zone } of ROUTE_PATTERNS) {
      if (pattern.test(path)) return zone;
    }
    return 'api:general';
  }

  private ipFromRequest(_path: string): string {
    return 'global';
  }

  getRouteConfig(path: string): RouteRateLimitConfig | undefined {
    const zone = this.matchRoute(path);
    return routeDefaults[zone];
  }
}

export const advancedRateLimiter = new AdvancedRateLimiter();

export { routeDefaults as ROUTE_RATE_LIMITS };
