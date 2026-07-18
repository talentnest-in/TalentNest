import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockRedis = {
  isConnected: true,
  client: { get: vi.fn(), setEx: vi.fn(), del: vi.fn(), keys: vi.fn() },
  get: vi.fn(),
  setEx: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
};

vi.mock('../lib/redis', () => ({
  getRedisService: vi.fn(() => mockRedis),
}));

import { getCacheService, resetCacheInstance } from '../lib/cache';

describe('CacheService', () => {
  let cache: ReturnType<typeof getCacheService>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetCacheInstance();
    cache = getCacheService();
  });

  it('should get cached value', async () => {
    mockRedis.get.mockResolvedValue('"cached-value"');
    const result = await cache.get('test-key');
    expect(result).toBe('cached-value');
  });

  it('should set cache with TTL prefixed by cache:', async () => {
    await cache.set('test-key', 'value', 60);
    expect(mockRedis.setEx).toHaveBeenCalledWith('cache:test-key', 60, '"value"');
  });

  it('should invalidate cache by pattern', async () => {
    mockRedis.keys.mockResolvedValue(['cache:test-key']);
    await cache.invalidate('test-key');
    expect(mockRedis.keys).toHaveBeenCalledWith('cache:test-key');
    expect(mockRedis.del).toHaveBeenCalledWith(['cache:test-key']);
  });

  it('should get or fetch using callback', async () => {
    mockRedis.get.mockResolvedValue(null);
    const fetcher = vi.fn().mockResolvedValue('computed');
    const result = await cache.getOrFetch('compute-key', 60, fetcher);
    expect(result).toBe('computed');
    expect(fetcher).toHaveBeenCalled();
    expect(mockRedis.setEx).toHaveBeenCalledWith('cache:compute-key', 60, '"computed"');
  });
});
