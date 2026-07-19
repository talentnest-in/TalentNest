import { Job } from 'bullmq';
import { queueManager, QUEUES } from '../lib/queue';
import { prisma } from '../lib/prisma';
import { logError, logInfo } from '../lib/logger';

let io: any = null;
export const setSocketIOForBadge = (socketIO: any): void => {
  io = socketIO;
};

interface CheckBadgesData {
  userId: string;
}

export async function badgeProcessor(job: Job<CheckBadgesData>): Promise<void> {
  const { userId } = job.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userAchievements: { include: { achievement: true } },
        userBadges: true,
        _count: { select: { creatorCourses: true } },
      },
    });
    if (!user) return;

    const earnedBadgeIds = user.userBadges.map(ub => ub.badgeId);
    const achievementKeys = user.userAchievements.map(ua => ua.achievement.key);
    const level = user.level;
    const publishedCourses = user._count.creatorCourses;

    const badgeConditions = [
      { key: 'RISING_TALENT', condition: level >= 5 },
      { key: 'TOP_RATED', condition: achievementKeys.includes('FIVE_STAR_REVIEW') },
      { key: 'CONTEST_WINNER', condition: achievementKeys.includes('CONTEST_WINNER') },
      { key: 'COMMUNITY_LEADER', condition: achievementKeys.includes('COMMUNITY_HELPER') },
      { key: 'CERTIFIED_CREATOR', condition: publishedCourses >= 1 },
      { key: 'ELITE_PROFESSIONAL', condition: level >= 20 },
      { key: 'TALENTNEST_LEGEND', condition: level >= 50 },
    ];

    for (const { key, condition } of badgeConditions) {
      if (condition) {
        const badge = await prisma.badge.findUnique({ where: { key } });
        if (badge && !earnedBadgeIds.includes(badge.id)) {
          await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });

          if (io) {
            io.to(`user:${userId}`).emit('gamification:badge_earned', { badge });
          }

          await queueManager.addJob(QUEUES.NOTIFICATION, {
            userId, type: 'SYSTEM', title: 'Badge Earned!',
            message: `You've earned the ${badge.title} badge!`,
          });
        }
      }
    }
  } catch (error) {
    logError('[BadgeWorker]', error, { context: 'badge_check', userId });
  }
}

export function registerBadgeWorker(): void {
  queueManager.defineQueue(QUEUES.BADGE);
  queueManager.defineWorker(QUEUES.BADGE, badgeProcessor, { concurrency: 3 });
  logInfo('[Queue]', 'Badge worker registered');
}
