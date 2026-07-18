import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma', () => ({
  prisma: {
    notification: { create: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    experienceLog: { create: vi.fn() },
    achievement: { findMany: vi.fn() },
    userAchievement: { create: vi.fn() },
    badge: { findUnique: vi.fn() },
    userBadge: { create: vi.fn() },
    leaderboard: { upsert: vi.fn(), updateMany: vi.fn(), findMany: vi.fn() },
    $executeRawUnsafe: vi.fn(),
    mission: { findMany: vi.fn() },
    missionProgress: { create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('../lib/queue', () => ({
  queueManager: { addJob: vi.fn(), defineQueue: vi.fn(), defineWorker: vi.fn() },
  QUEUES: {
    NOTIFICATION: 'notification', GAMIFICATION: 'gamification',
    LEADERBOARD: 'leaderboard', BADGE: 'badge',
  },
}));

vi.mock('../constants/gamification.constants', () => ({
  EXP_REWARDS: { TEST_ACTION: 50 },
  getLevelFromExp: vi.fn((exp: number) => Math.floor(exp / 100) + 1),
}));

import { notificationProcessor } from '../workers/notification.worker';
import { awardExpProcessor, checkAchievementsProcessor, updateStreakProcessor } from '../workers/gamification.worker';
import { badgeProcessor } from '../workers/badge.worker';
import { leaderboardProcessor } from '../workers/leaderboard.worker';
import { prisma } from '../lib/prisma';

describe('Queue Workers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Notification Worker', () => {
    it('should create a notification in database', async () => {
      (prisma.notification.create as any).mockResolvedValue({ id: 'n1' });

      const job = { data: { userId: 'u1', type: 'SYSTEM', title: 'Test', message: 'Hello' }, id: 'j1' } as any;
      await notificationProcessor(job);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId: 'u1', type: 'SYSTEM', title: 'Test', message: 'Hello', link: null },
      });
    });
  });

  describe('Gamification Worker', () => {
    it('should award EXP and update user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ exp: 0, level: 1, totalExpEarned: 0 });
      (prisma.experienceLog.create as any).mockResolvedValue({});
      (prisma.user.update as any).mockResolvedValue({});

      const job = { data: { userId: 'u1', action: 'TEST_ACTION', description: 'Test' } } as any;
      await awardExpProcessor(job);

      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.experienceLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ amount: 50 }) })
      );
    });
  });

  describe('Badge Worker', () => {
    it('should not create badge for missing or already earned badges', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u1', level: 1, exp: 0, contestWins: 0,
        userBadges: [{ badgeId: 'b1' }],
        userAchievements: [{ achievement: { key: 'EXISTING' } }],
        _count: { creatorCourses: 0 },
      });

      const job = { data: { userId: 'u1' } } as any;
      await badgeProcessor(job);

      expect(prisma.userBadge.create).not.toHaveBeenCalled();
    });
  });

  describe('Leaderboard Worker', () => {
    it('should upsert leaderboard entries', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u1', role: 'FREELANCER', exp: 100, contestWins: 0,
        _count: { creatorCourses: 0, studentEnrollments: 0 },
      });
      (prisma.leaderboard.upsert as any).mockResolvedValue({});
      (prisma.$executeRawUnsafe as any).mockResolvedValue([]);
      (prisma.leaderboard.findMany as any).mockResolvedValue([]);

      const job = { data: { userId: 'u1' } } as any;
      await leaderboardProcessor(job);

      expect(prisma.leaderboard.upsert).toHaveBeenCalled();
    });
  });
});
