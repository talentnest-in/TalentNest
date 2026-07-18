import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureFlagManager } from '../lib/flags/index';

describe('FeatureFlagManager', () => {
  let manager: FeatureFlagManager;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    manager = new FeatureFlagManager();
  });

  describe('built-in flags', () => {
    it('should have all expected built-in flags', () => {
      const flags = manager.getAllFlags();
      const keys = flags.map(f => f.key);
      expect(keys).toContain('v2-api');
      expect(keys).toContain('new-dashboard');
      expect(keys).toContain('ai-recommendations');
      expect(keys).toContain('gamification-v2');
      expect(keys).toContain('chat-file-sharing');
      expect(keys).toContain('contract-milestones');
      expect(keys).toContain('canary-deployment');
    });

    it('should have gamification-v2 enabled by default', () => {
      const flag = manager.getFlag('gamification-v2');
      expect(flag?.status).toBe('enabled');
    });
  });

  describe('isEnabled', () => {
    it('should return true for enabled flags targeted to all', async () => {
      const result = await manager.isEnabled('gamification-v2');
      expect(result).toBe(true);
    });

    it('should return true for chat-file-sharing (enabled, target all)', async () => {
      const result = await manager.isEnabled('chat-file-sharing');
      expect(result).toBe(true);
    });

    it('should return false for unknown flags', async () => {
      const result = await manager.isEnabled('non-existent-flag');
      expect(result).toBe(false);
    });

    it('should return false for disabled flags', async () => {
      const result = await manager.isEnabled('new-dashboard');
      expect(result).toBe(false);
    });
  });

  describe('setFlag', () => {
    it('should allow enabling a disabled flag', async () => {
      await manager.setFlag('new-dashboard', 'enabled', { target: 'all' });
      const result = await manager.isEnabled('new-dashboard');
      expect(result).toBe(true);
    });

    it('should allow disabling an enabled flag', async () => {
      await manager.setFlag('gamification-v2', 'disabled');
      const result = await manager.isEnabled('gamification-v2');
      expect(result).toBe(false);
    });
  });

  describe('percentage-based flags', () => {
    it('should return true when percentage is 100', async () => {
      await manager.setFlag('test-pct', 'gradual', { target: 'percentage', percentage: 100 });
      const result = await manager.isEnabled('test-pct', 'any-user');
      expect(result).toBe(true);
    });

    it('should return false when percentage is 0', async () => {
      await manager.setFlag('test-pct', 'gradual', { target: 'percentage', percentage: 0 });
      const result = await manager.isEnabled('test-pct', 'any-user');
      expect(result).toBe(false);
    });
  });

  describe('environment-targeted flags', () => {
    it('should match when environment is in list', async () => {
      process.env.NODE_ENV = 'staging';
      const mgr = new FeatureFlagManager();
      await mgr.setFlag('env-test', 'gradual', { target: 'environment', environments: ['staging'] });
      const result = await mgr.isEnabled('env-test');
      expect(result).toBe(true);
    });

    it('should not match when environment is not in list', async () => {
      process.env.NODE_ENV = 'production';
      const mgr = new FeatureFlagManager();
      await mgr.setFlag('env-test', 'gradual', { target: 'environment', environments: ['staging'] });
      const result = await mgr.isEnabled('env-test');
      expect(result).toBe(false);
    });
  });
});
