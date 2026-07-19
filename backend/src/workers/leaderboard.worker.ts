import { Job } from 'bullmq';
import { queueManager, QUEUES } from '../lib/queue';
import { prisma } from '../lib/prisma';
import { logError, logInfo } from '../lib/logger';

let io: any = null;
export const setSocketIOForLeaderboard = (socketIO: any): void => {
  io = socketIO;
};

interface UpdateLeaderboardData {
  userId: string;
}

export async function leaderboardProcessor(job: Job<UpdateLeaderboardData>): Promise<void> {
  const { userId } = job.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { creatorCourses: true, studentEnrollments: true } } },
    });
    if (!user) return;

    const periods = ['WEEKLY', 'MONTHLY', 'ALL_TIME'] as const;
    const categories = ['FREELANCER', 'CREATOR', 'COMMUNITY', 'LEARNER', 'CONTEST'] as const;

    const userCategories: string[] = [];
    if (user.role === 'FREELANCER') userCategories.push('FREELANCER');
    if (user._count.creatorCourses > 0) userCategories.push('CREATOR');
    if (user._count.studentEnrollments > 0) userCategories.push('LEARNER');
    userCategories.push('COMMUNITY');
    if (user.contestWins > 0) userCategories.push('CONTEST');

    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    const isMonday = dayOfWeek === 1;
    const isFirstOfMonth = dayOfMonth === 1;

    for (const period of periods) {
      if (period === 'WEEKLY' && isMonday) {
        await prisma.leaderboard.updateMany({
          where: { period: 'WEEKLY' },
          data: { exp: 0, rank: 0 },
        });
      }
      if (period === 'MONTHLY' && isFirstOfMonth) {
        await prisma.leaderboard.updateMany({
          where: { period: 'MONTHLY' },
          data: { exp: 0, rank: 0 },
        });
      }

      for (const category of categories) {
        if (!userCategories.includes(category)) continue;
        await prisma.leaderboard.upsert({
          where: { userId_period_category: { userId, period, category } },
          create: { userId, period, category, exp: user.exp, rank: 0 },
          update: { exp: user.exp },
        });
      }
    }

    // Batch rank recalculation
    for (const period of periods) {
      for (const category of categories) {
        if (!userCategories.includes(category)) continue;
        await prisma.$executeRawUnsafe(
          `UPDATE "Leaderboard" l SET "rank" = sub.new_rank FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY exp DESC) as new_rank
            FROM "Leaderboard" WHERE period = $1 AND category = $2
          ) sub WHERE l.id = sub.id AND l.period = $1 AND l.category = $2`,
          period, category
        );
      }
    }

    if (io) {
      const userLeaderboard = await prisma.leaderboard.findMany({ where: { userId } });
      for (const entry of userLeaderboard) {
        io.to(`user:${userId}`).emit('gamification:leaderboard_update', {
          rank: entry.rank, category: entry.category, period: entry.period,
        });
      }
    }
  } catch (error) {
    logError('[LeaderboardWorker]', error, { context: 'leaderboard_update', userId });
  }
}

export function registerLeaderboardWorker(): void {
  queueManager.defineQueue(QUEUES.LEADERBOARD);
  queueManager.defineWorker(QUEUES.LEADERBOARD, leaderboardProcessor, { concurrency: 2 });
  logInfo('[Queue]', 'Leaderboard worker registered');
}
