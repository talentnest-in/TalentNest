import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { getExpProgress } from '../constants/gamification.constants';

export const gamificationController = {
  // Get user gamification stats
  async getUserStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          exp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
          totalExpEarned: true,
          lastLoginDate: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const progress = getExpProgress(user.exp, user.level);

      return reply.send({
        exp: user.exp,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalExpEarned: user.totalExpEarned,
        lastLoginDate: user.lastLoginDate,
        progressToNextLevel: progress,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch user stats');
      return reply.status(500).send({ error: 'Failed to fetch user stats' });
    }
  },

  // Get user achievements
  async getUserAchievements(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true,
        },
        orderBy: { unlockedAt: 'desc' },
      });

      return reply.send(userAchievements);
    } catch (error) {
      request.log.error(error, 'Failed to fetch user achievements');
      return reply.status(500).send({ error: 'Failed to fetch user achievements' });
    }
  },

  // Get all available achievements
  async getAllAchievements(request: FastifyRequest, reply: FastifyReply) {
    try {
      const achievements = await prisma.achievement.findMany({
        orderBy: { category: 'asc' },
      });

      return reply.send(achievements);
    } catch (error) {
      request.log.error(error, 'Failed to fetch achievements');
      return reply.status(500).send({ error: 'Failed to fetch achievements' });
    }
  },

  // Get user badges
  async getUserBadges(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const userBadges = await prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: true,
        },
        orderBy: { earnedAt: 'desc' },
      });

      return reply.send(userBadges);
    } catch (error) {
      request.log.error(error, 'Failed to fetch user badges');
      return reply.status(500).send({ error: 'Failed to fetch user badges' });
    }
  },

  // Get all available badges
  async getAllBadges(request: FastifyRequest, reply: FastifyReply) {
    try {
      const badges = await prisma.badge.findMany({
        orderBy: { tier: 'asc' },
      });

      return reply.send(badges);
    } catch (error) {
      request.log.error(error, 'Failed to fetch badges');
      return reply.status(500).send({ error: 'Failed to fetch badges' });
    }
  },

  // Get user missions
  async getUserMissions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const missionProgress = await prisma.missionProgress.findMany({
        where: { userId },
        include: {
          mission: true,
        },
        orderBy: { completedAt: 'desc' },
      });

      return reply.send(missionProgress);
    } catch (error) {
      request.log.error(error, 'Failed to fetch user missions');
      return reply.status(500).send({ error: 'Failed to fetch user missions' });
    }
  },

  // Get available missions
  async getAvailableMissions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const missions = await prisma.mission.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send(missions);
    } catch (error) {
      request.log.error(error, 'Failed to fetch missions');
      return reply.status(500).send({ error: 'Failed to fetch missions' });
    }
  },

  // Get leaderboard
  async getLeaderboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { period = 'ALL_TIME', category = 'COMMUNITY' } = request.query as any;

      const leaderboard = await prisma.leaderboard.findMany({
        where: {
          period: period.toUpperCase(),
          category: category.toUpperCase(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { rank: 'asc' },
        take: 100,
      });

      return reply.send(leaderboard);
    } catch (error) {
      request.log.error(error, 'Failed to fetch leaderboard');
      return reply.status(500).send({ error: 'Failed to fetch leaderboard' });
    }
  },

  // Get user experience history
  async getExpHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { page = '1', limit = '20' } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [logs, total] = await Promise.all([
        prisma.experienceLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.experienceLog.count({ where: { userId } }),
      ]);

      return reply.send({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch exp history');
      return reply.status(500).send({ error: 'Failed to fetch exp history' });
    }
  },

  // Admin: Create achievement
  async createAchievement(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const body = request.body as any;

      // Check if user is admin
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const achievement = await prisma.achievement.create({
        data: {
          key: body.key,
          title: body.title,
          description: body.description,
          category: body.category,
          icon: body.icon,
          condition: body.condition,
          expReward: body.expReward || 0,
        },
      });

      return reply.status(201).send(achievement);
    } catch (error) {
      request.log.error(error, 'Failed to create achievement');
      return reply.status(500).send({ error: 'Failed to create achievement' });
    }
  },

  // Admin: Create badge
  async createBadge(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const body = request.body as any;

      // Check if user is admin
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const badge = await prisma.badge.create({
        data: {
          key: body.key,
          title: body.title,
          description: body.description,
          tier: body.tier,
          icon: body.icon,
          category: body.category || 'GENERAL',
        },
      });

      return reply.status(201).send(badge);
    } catch (error) {
      request.log.error(error, 'Failed to create badge');
      return reply.status(500).send({ error: 'Failed to create badge' });
    }
  },

  // Admin: Create mission
  async createMission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const body = request.body as any;

      // Check if user is admin
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const mission = await prisma.mission.create({
        data: {
          key: body.key,
          title: body.title,
          description: body.description,
          type: body.type,
          action: body.action,
          targetCount: body.targetCount,
          expReward: body.expReward,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          isActive: body.isActive ?? true,
        },
      });

      return reply.status(201).send(mission);
    } catch (error) {
      request.log.error(error, 'Failed to create mission');
      return reply.status(500).send({ error: 'Failed to create mission' });
    }
  },

  // Admin: Update achievement
  async updateAchievement(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const body = request.body as any;

      // Check if user is admin
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const achievement = await prisma.achievement.update({
        where: { id },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.description && { description: body.description }),
          ...(body.category && { category: body.category }),
          ...(body.icon && { icon: body.icon }),
          ...(body.condition && { condition: body.condition }),
          ...(body.expReward !== undefined && { expReward: body.expReward }),
        },
      });

      return reply.send(achievement);
    } catch (error) {
      request.log.error(error, 'Failed to update achievement');
      return reply.status(500).send({ error: 'Failed to update achievement' });
    }
  },

  // Admin: Delete achievement
  async deleteAchievement(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };

      // Check if user is admin
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      await prisma.achievement.delete({
        where: { id },
      });

      return reply.status(204).send();
    } catch (error) {
      request.log.error(error, 'Failed to delete achievement');
      return reply.status(500).send({ error: 'Failed to delete achievement' });
    }
  },
};
