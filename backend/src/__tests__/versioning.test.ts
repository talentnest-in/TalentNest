import { describe, it, expect } from 'vitest';
import { gte, versionedHandler } from '../lib/versioning';
import type { ApiVersion } from '../lib/versioning';

describe('API Versioning Utilities', () => {
  describe('gte (version comparison)', () => {
    it('should return false when v1 < v2', () => {
      expect(gte('v1', 'v2')).toBe(false);
    });

    it('should return true when v2 >= v2', () => {
      expect(gte('v2', 'v2')).toBe(true);
    });

    it('should return true when v2 >= v1', () => {
      expect(gte('v2', 'v1')).toBe(true);
    });

    it('should return true when v1 >= v1', () => {
      expect(gte('v1', 'v1')).toBe(true);
    });
  });

  describe('versionedHandler', () => {
    it('should call v1 handler when no v2 is provided', async () => {
      const handler = versionedHandler({
        v1: async () => ({ version: 'v1' }),
      });
      const mockRequest = { apiVersion: 'v1' as ApiVersion } as any;
      const mockReply = { status: () => ({ send: () => {} }) } as any;
      const result = await handler(mockRequest, mockReply);
      expect(result).toEqual({ version: 'v1' });
    });

    it('should call v2 handler when apiVersion is v2', async () => {
      const handler = versionedHandler({
        v1: async () => ({ version: 'v1' }),
        v2: async () => ({ version: 'v2' }),
      });
      const mockRequest = { apiVersion: 'v2' as ApiVersion } as any;
      const mockReply = { status: () => ({ send: () => {} }) } as any;
      const result = await handler(mockRequest, mockReply);
      expect(result).toEqual({ version: 'v2' });
    });

    it('should fall back to v1 when v2 handler is missing', async () => {
      const handler = versionedHandler({
        v1: async () => ({ version: 'v1' }),
      });
      const mockRequest = { apiVersion: 'v2' as ApiVersion } as any;
      const mockReply = { status: () => ({ send: () => {} }) } as any;
      const result = await handler(mockRequest, mockReply);
      expect(result).toEqual({ version: 'v1' });
    });

    it('should return 404 when no handler exists', async () => {
      let sentStatus = 0;
      let sentBody: any = {};
      const handler = versionedHandler({});
      const mockRequest = { apiVersion: 'v1' as ApiVersion } as any;
      const mockReply = {
        status: (code: number) => {
          sentStatus = code;
          return { send: (body: any) => { sentBody = body; } };
        },
      } as any;
      await handler(mockRequest, mockReply);
      expect(sentStatus).toBe(404);
      expect(sentBody).toHaveProperty('error', 'Not Found');
    });
  });
});
