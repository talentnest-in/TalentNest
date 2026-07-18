import { vi } from 'vitest';

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.COOKIE_SECRET = 'test-cookie-secret';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.NODE_ENV = 'test';

vi.mock('../lib/redis', () => ({
  getRedisService: vi.fn(() => ({
    isConnected: false,
    client: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    ping: vi.fn(),
  })),
  disconnectRedis: vi.fn(),
}));

vi.mock('../lib/queue', () => ({
  queueManager: {
    addJob: vi.fn(),
    close: vi.fn(),
    getQueueStatus: vi.fn(),
    defineQueue: vi.fn(),
    defineWorker: vi.fn(),
  },
  QUEUES: {
    EMAIL: 'email',
    NOTIFICATION: 'notification',
    GAMIFICATION: 'gamification',
    LEADERBOARD: 'leaderboard',
    BADGE: 'badge',
    ANALYTICS: 'analytics',
    RECOMMENDATION: 'recommendation',
  },
}));
