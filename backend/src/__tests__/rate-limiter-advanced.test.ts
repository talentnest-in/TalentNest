import { describe, it, expect } from 'vitest';
import { advancedRateLimiter, ROUTE_RATE_LIMITS } from '../lib/rate-limiter-advanced';

describe('AdvancedRateLimiter', () => {
  describe('route matching', () => {
    it('should match auth login routes', async () => {
      const result = await advancedRateLimiter.check('/api/v1/auth/login');
      expect(result.zone).toBe('auth:login');
    });

    it('should match auth register routes', async () => {
      const result = await advancedRateLimiter.check('/api/v1/auth/register');
      expect(result.zone).toBe('auth:register');
    });

    it('should match job application routes', async () => {
      const result = await advancedRateLimiter.check('/api/v1/jobs/some-id/apply');
      expect(result.zone).toBe('jobs:apply');
    });

    it('should match health endpoint', async () => {
      const result = await advancedRateLimiter.check('/health');
      expect(result.zone).toBe('public:health');
    });

    it('should match search routes', async () => {
      const result = await advancedRateLimiter.check('/api/v1/search?q=react');
      expect(result.zone).toBe('search:global');
    });

    it('should match chat message routes', async () => {
      const result = await advancedRateLimiter.check('/api/v1/chat/conv-1/messages');
      expect(result.zone).toBe('chat:send');
    });

    it('should match api:authenticated for unknown /api routes', async () => {
      const result = await advancedRateLimiter.check('/api/v1/some-unknown-route');
      expect(result.zone).toBe('api:authenticated');
    });
  });

  describe('rate limit config defaults', () => {
    it('should have login at 5 req/min', () => {
      expect(ROUTE_RATE_LIMITS['auth:login']!.maxRequests).toBe(5);
      expect(ROUTE_RATE_LIMITS['auth:login']!.windowMs).toBe(60_000);
    });

    it('should have register at 3 req/hour', () => {
      expect(ROUTE_RATE_LIMITS['auth:register']!.maxRequests).toBe(3);
      expect(ROUTE_RATE_LIMITS['auth:register']!.windowMs).toBe(3_600_000);
    });

    it('should have chat at 60 req/min', () => {
      expect(ROUTE_RATE_LIMITS['chat:send']!.maxRequests).toBe(60);
    });

    it('should have admin general at 300 req/min', () => {
      expect(ROUTE_RATE_LIMITS['admin:general']!.maxRequests).toBe(300);
    });
  });

  describe('allow/deny', () => {
    it('should allow requests under the limit', async () => {
      const result = await advancedRateLimiter.check('/health');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should have a defined zone for rate-limited routes', async () => {
      const result = await advancedRateLimiter.check('/api/v1/auth/login');
      expect(result.zone).toBe('auth:login');
      // resetMs is 0 when Redis is unavailable (test env) — allowed is still true
      expect(result.allowed).toBe(true);
    });
  });

  describe('getRouteConfig', () => {
    it('should return config for known routes', () => {
      const cfg = advancedRateLimiter.getRouteConfig('/api/v1/auth/login');
      expect(cfg).toBeDefined();
      expect(cfg!.maxRequests).toBe(5);
    });

    it('should return api:general config for unknown routes', () => {
      const cfg = advancedRateLimiter.getRouteConfig('/unknown');
      expect(cfg).toBeDefined();
      expect(cfg!.maxRequests).toBe(100);
    });
  });
});
