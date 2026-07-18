import { getRedisService } from '../redis';

export type FlagTarget = 'all' | 'percentage' | 'user' | 'environment';
export type FlagStatus = 'enabled' | 'disabled' | 'gradual';

export interface FeatureFlag {
  key: string;
  status: FlagStatus;
  target?: FlagTarget;
  percentage?: number | undefined; // 0-100 for gradual rollout
  userIds?: string[] | undefined;   // specific user IDs for canary
  environments?: string[] | undefined;
  description?: string | undefined;
}

const FLAG_PREFIX = 'feature:flag:';

const builtInFlags: Record<string, Omit<FeatureFlag, 'key'>> = {
  'v2-api': {
    status: 'disabled',
    target: 'environment',
    environments: ['development', 'staging'],
    description: 'Enable v2 API endpoints',
  },
  'new-dashboard': {
    status: 'disabled',
    target: 'percentage',
    percentage: 0,
    description: 'Rollout new dashboard UI',
  },
  'ai-recommendations': {
    status: 'disabled',
    target: 'percentage',
    percentage: 10,
    description: 'Enable AI-powered job recommendations',
  },
  'gamification-v2': {
    status: 'enabled',
    target: 'all',
    description: 'Enable gamification features',
  },
  'chat-file-sharing': {
    status: 'enabled',
    target: 'all',
    description: 'Enable file sharing in chat',
  },
  'contract-milestones': {
    status: 'enabled',
    target: 'all',
    description: 'Enable milestone-based contracts',
  },
  'canary-deployment': {
    status: 'disabled',
    target: 'user',
    userIds: [],
    description: 'Canary deployment target users',
  },
};

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private environment: string;
  private redisAvailable: boolean = false;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.loadBuiltInFlags();
    this.checkRedis();
  }

  private loadBuiltInFlags() {
    for (const [key, config] of Object.entries(builtInFlags)) {
      this.flags.set(key, { key, ...config });
    }
  }

  private checkRedis() {
    const redis = getRedisService();
    this.redisAvailable = redis.isConnected;
  }

  async isEnabled(key: string, userId?: string): Promise<boolean> {
    const flag = this.flags.get(key);
    if (!flag) return false;

    // Check Redis override first
    if (this.redisAvailable) {
      try {
        const redis = getRedisService();
        const override = await redis.client!.get(`${FLAG_PREFIX}${key}`);
        if (override === 'enabled') return true;
        if (override === 'disabled') return false;
      } catch {
        // fall through to local config
      }
    }

    // Check environment flag
    const envVar = process.env[`FEATURE_${key.toUpperCase().replace(/-/g, '_')}`];
    if (envVar === 'true') return true;
    if (envVar === 'false') return false;

    // Evaluate based on target
    switch (flag.status) {
      case 'enabled':
        return true;
      case 'disabled':
        return false;
      case 'gradual':
        return this.evaluateGradual(flag, userId);
      default:
        return false;
    }
  }

  private evaluateGradual(flag: FeatureFlag, userId?: string): boolean {
    switch (flag.target) {
      case 'all':
        return flag.status === 'enabled';

      case 'percentage':
        if (!flag.percentage || flag.percentage <= 0) return false;
        if (flag.percentage >= 100) return true;
        if (!userId) return false;
        const hash = this.hashCode(userId) % 100;
        return hash < flag.percentage;

      case 'user':
        return !!userId && (flag.userIds?.includes(userId) ?? false);

      case 'environment':
        return flag.environments?.includes(this.environment) ?? false;

      default:
        return false;
    }
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  async setFlag(key: string, status: FlagStatus, options?: Partial<FeatureFlag>): Promise<void> {
    const existing = this.flags.get(key);
    this.flags.set(key, {
      key,
      status,
      target: options?.target || existing?.target || 'all',
      percentage: options?.percentage ?? existing?.percentage,
      userIds: options?.userIds ?? existing?.userIds,
      environments: options?.environments ?? existing?.environments,
      description: options?.description || existing?.description || '',
    });

    if (this.redisAvailable) {
      try {
        const redis = getRedisService();
        await redis.client!.setEx(`${FLAG_PREFIX}${key}`, 86400, status);
      } catch {
        // silent
      }
    }
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }
}

export const featureFlags = new FeatureFlagManager();
