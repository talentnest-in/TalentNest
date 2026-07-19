import { registerEmailWorker } from './email.worker';
import { registerNotificationWorker } from './notification.worker';
import { registerGamificationWorker } from './gamification.worker';
import { registerLeaderboardWorker } from './leaderboard.worker';
import { registerBadgeWorker } from './badge.worker';
import { registerAnalyticsWorker } from './analytics.worker';
import { registerRecommendationWorker } from './recommendation.worker';
import { queueManager } from '../lib/queue';
import { logWarn, logInfo } from '../lib/logger';

function isRedisConfigured(): boolean {
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
}

export function registerAllWorkers(): void {
  if (!isRedisConfigured()) {
    logWarn('[Queue]', 'Redis not configured — skipping all worker registration');
    return;
  }

  registerEmailWorker();
  registerNotificationWorker();
  registerGamificationWorker();
  registerLeaderboardWorker();
  registerBadgeWorker();
  registerAnalyticsWorker();
  registerRecommendationWorker();
  logInfo('[Queue]', 'All workers registered');
}

export async function closeAllWorkers(): Promise<void> {
  await queueManager.close();
  logInfo('[Queue]', 'All workers and queues closed');
}
