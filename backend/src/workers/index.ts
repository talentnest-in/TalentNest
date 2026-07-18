import { registerEmailWorker } from './email.worker';
import { registerNotificationWorker } from './notification.worker';
import { registerGamificationWorker } from './gamification.worker';
import { registerLeaderboardWorker } from './leaderboard.worker';
import { registerBadgeWorker } from './badge.worker';
import { registerAnalyticsWorker } from './analytics.worker';
import { registerRecommendationWorker } from './recommendation.worker';
import { queueManager } from '../lib/queue';

export function registerAllWorkers(): void {
  registerEmailWorker();
  registerNotificationWorker();
  registerGamificationWorker();
  registerLeaderboardWorker();
  registerBadgeWorker();
  registerAnalyticsWorker();
  registerRecommendationWorker();
  console.log('[Queue] All workers registered');
}

export async function closeAllWorkers(): Promise<void> {
  await queueManager.close();
  console.log('[Queue] All workers and queues closed');
}
