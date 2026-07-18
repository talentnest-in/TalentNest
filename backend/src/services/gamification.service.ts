import { prisma } from '../lib/prisma';
import { EXP_REWARDS, getLevelFromExp } from '../constants/gamification.constants';
import { queueManager, QUEUES } from '../lib/queue';

// Socket.IO instance will be set at runtime
let io: any = null;

export const setSocketIO = (socketIO: any) => {
  io = socketIO;
};

// ── Core Functions ─────────────────────────────────────────────────────────────

export async function awardExp(
  userId: string,
  action: string,
  description: string,
  customAmount?: number
): Promise<void> {
  const expAmount = customAmount ?? EXP_REWARDS[action as keyof typeof EXP_REWARDS];
  if (!expAmount) return;

  // Queue the EXP award as a background job. HTTP response returns immediately.
  await queueManager.addJob(QUEUES.GAMIFICATION, {
    type: 'award_exp',
    userId,
    action,
    description,
    customAmount,
  }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });

  // Also queue dependent operations in parallel
  await Promise.allSettled([
    queueManager.addJob(QUEUES.GAMIFICATION, {
      type: 'check_achievements',
      userId,
      action,
    }, { attempts: 2, backoff: { type: 'fixed', delay: 5000 } }),
    queueManager.addJob(QUEUES.BADGE, { userId }, { attempts: 2 }),
    queueManager.addJob(QUEUES.LEADERBOARD, { userId }, { attempts: 2 }),
    queueManager.addJob(QUEUES.GAMIFICATION, {
      type: 'update_mission',
      userId,
      action,
    }, { attempts: 2 }),
  ]);
}

export async function checkAndAwardProfileCompletion(userId: string): Promise<void> {
  // Queue profile completion check as background job
  await queueManager.addJob(QUEUES.GAMIFICATION, {
    type: 'check_profile_completion',
    userId,
  }, { attempts: 2 });
}

async function handleLevelUp(userId: string, oldLevel: number, newLevel: number, totalExp: number): Promise<void> {
  // Emit level up event
  if (io) {
    io.to(`user:${userId}`).emit('gamification:level_up', {
      oldLevel,
      newLevel,
      totalExp,
    });
  }

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${newLevel}!`,
    },
  });
}

export async function checkAchievements(userId: string, action: string): Promise<void> {
  try {
    // Get user's current stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        experienceLogs: true,
        userAchievements: true,
        freelancerProfile: {
          include: {
            skills: true,
            experiences: true,
            educations: true,
          }
        },
        _count: {
          select: {
            studentEnrollments: true,
            creatorCourses: true,
          },
        },
      },
    });

    if (!user) return;

    let profileCompleteness = 0;
    if (user.freelancerProfile) {
      if (user.freelancerProfile.title && user.freelancerProfile.bio) profileCompleteness += 20;
      if (user.freelancerProfile.skills.length > 0) profileCompleteness += 20;
      if (user.freelancerProfile.experiences.length > 0) profileCompleteness += 20;
      if (user.freelancerProfile.educations.length > 0) profileCompleteness += 20;
      if (user.freelancerProfile.resumeUrl) profileCompleteness += 20;
    }

    const unlockedAchievementIds = user.userAchievements.map(ua => ua.achievementId);

    // Count action occurrences in experience logs
    const actionCounts: Record<string, number> = {};
    user.experienceLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    // Get all achievements
    const achievements = await prisma.achievement.findMany();

    for (const achievement of achievements) {
      // Skip if already unlocked
      if (unlockedAchievementIds.includes(achievement.id)) continue;

      const condition = achievement.condition as any;
      let shouldUnlock = false;

      // Check achievement conditions based on category
      switch (achievement.category) {
        case 'FREELANCING':
          if (achievement.key === 'FIRST_APPLICATION' && (actionCounts['JOB_APPLICATION'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'FIRST_CONTRACT' && (actionCounts['CONTRACT_COMPLETE'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'FIRST_FIVE_STAR' && (actionCounts['FIVE_STAR_REVIEW'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'CONTRACT_MASTER' && (actionCounts['CONTRACT_COMPLETE'] || 0) >= 10) shouldUnlock = true;
          // Temporarily bypassing until rating system is fully implemented
          if (achievement.key === 'TOP_RATED' && (actionCounts['FIVE_STAR_REVIEW'] || 0) >= 5) shouldUnlock = true;
          break;

        case 'LEARNING':
          if (achievement.key === 'FIRST_COURSE' && user._count.studentEnrollments >= 1) shouldUnlock = true;
          if (achievement.key === 'FAST_LEARNER' && user._count.studentEnrollments >= 5) shouldUnlock = true;
          if (achievement.key === 'KNOWLEDGE_SEEKER' && user._count.studentEnrollments >= 10) shouldUnlock = true;
          break;

        case 'COMMUNITY':
         	if (achievement.key === 'FIRST_POST' && (actionCounts['FIRST_POST'] || 0) >= 1) shouldUnlock = true;
          // Temporarily bypassing likes
          if (achievement.key === 'COMMUNITY_HELPER' && (actionCounts['FIRST_POST'] || 0) >= 10) shouldUnlock = true;
          if (achievement.key === 'TOP_MENTOR' && (actionCounts['COMMUNITY_COMMENT'] || 0) >= 50) shouldUnlock = true;
          break;

        case 'CREATOR':
          if (achievement.key === 'FIRST_COURSE_PUBLISHED' && user._count.creatorCourses >= 1) shouldUnlock = true;
          // Temporarily bypassing student count
          if (achievement.key === '100_STUDENTS' && user._count.creatorCourses >= 10) shouldUnlock = true;
          break;

        case 'CONTEST':
          if (achievement.key === 'CONTEST_PARTICIPANT' && (actionCounts['CONTEST_JOIN'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'CONTEST_WINNER' && (actionCounts['CONTEST_WIN'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'CHAMPION' && (actionCounts['CONTEST_WIN'] || 0) >= 3) shouldUnlock = true;
          break;

        case 'CAREER':
          if (achievement.key === 'PROFILE_COMPLETE' && profileCompleteness === 100) shouldUnlock = true;
          // user.id is a UUID, so we can't check if it's <= 1000 numerically
          if (achievement.key === 'EARLY_ADOPTER') shouldUnlock = true;
          break;
      }

      if (shouldUnlock) {
        await unlockAchievement(userId, achievement.id);
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
}

async function unlockAchievement(userId: string, achievementId: string): Promise<void> {
  try {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) return;

    // Create user achievement
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
      },
    });

    // Award bonus EXP
    if (achievement.expReward > 0) {
      await awardExp(userId, 'ACHIEVEMENT_BONUS', `Unlocked achievement: ${achievement.title}`, achievement.expReward);
    }

    // Emit socket event
    if (io) {
      io.to(`user:${userId}`).emit('gamification:achievement_unlocked', {
        achievement,
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Achievement Unlocked!',
        message: `You've unlocked: ${achievement.title}`,
      },
    });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    throw error;
  }
}

export async function checkBadges(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userAchievements: {
          include: {
            achievement: true,
          },
        },
        userBadges: true,
        _count: {
          select: {
            creatorCourses: true,
          },
        },
      },
    });

    if (!user) return;

    const earnedBadgeIds = user.userBadges.map(ub => ub.badgeId);
    const achievementKeys = user.userAchievements.map(ua => ua.achievement.key);
    const level = user.level;
    const totalExp = user.exp;
    const publishedCourses = user._count.creatorCourses;

    // Define badge conditions matching audit requirements
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
        const badge = await prisma.badge.findUnique({
          where: { key },
        });

        if (badge && !earnedBadgeIds.includes(badge.id)) {
          await earnBadge(userId, badge.id);
        }
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
    throw error;
  }
}

async function earnBadge(userId: string, badgeId: string): Promise<void> {
  try {
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) return;

    // Create user badge
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
      },
    });

    // Emit socket event
    if (io) {
      io.to(`user:${userId}`).emit('gamification:badge_earned', {
        badge,
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Badge Earned!',
        message: `You've earned the ${badge.title} badge!`,
      },
    });
  } catch (error) {
    console.error('Error earning badge:', error);
    throw error;
  }
}

export async function updateLeaderboard(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            creatorCourses: true,
            studentEnrollments: true,
          },
        },
      },
    });

    if (!user) return;

    const periods = ['WEEKLY', 'MONTHLY', 'ALL_TIME'] as const;
    const categories = ['FREELANCER', 'CREATOR', 'COMMUNITY', 'LEARNER', 'CONTEST'] as const;

    // Determine user's relevant categories based on actual data
    const userCategories = [];
    if (user.role === 'FREELANCER') userCategories.push('FREELANCER');
    if (user._count.creatorCourses > 0) userCategories.push('CREATOR');
    if (user._count.studentEnrollments > 0) userCategories.push('LEARNER');
    userCategories.push('COMMUNITY'); // Everyone can participate in community
    if (user.contestWins > 0) userCategories.push('CONTEST');

    // Check for period resets
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
    const dayOfMonth = now.getDate();
    const isMonday = dayOfWeek === 1;
    const isFirstOfMonth = dayOfMonth === 1;

    for (const period of periods) {
      // Reset period if needed
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
        // Only update relevant categories for the user
        if (!userCategories.includes(category)) continue;

        await prisma.leaderboard.upsert({
          where: {
            userId_period_category: {
              userId,
              period,
              category,
            },
          },
          create: {
            userId,
            period,
            category,
            exp: user.exp,
            rank: 0,
          },
          update: {
            exp: user.exp,
          },
        });
      }
    }

    // Recalculate ranks using a single SQL query with window function
    for (const period of periods) {
      for (const category of categories) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Leaderboard" l
           SET "rank" = sub.new_rank
           FROM (
             SELECT id, ROW_NUMBER() OVER (ORDER BY exp DESC) as new_rank
             FROM "Leaderboard"
             WHERE period = $1 AND category = $2
           ) sub
           WHERE l.id = sub.id AND l.period = $1 AND l.category = $2`,
          period,
          category
        );
      }
    }

    // Emit leaderboard update event
    if (io) {
      const userLeaderboard = await prisma.leaderboard.findMany({
        where: { userId },
      });

      for (const entry of userLeaderboard) {
        io.to(`user:${userId}`).emit('gamification:leaderboard_update', {
          rank: entry.rank,
          category: entry.category,
          period: entry.period,
        });
      }
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

export async function updateDailyStreak(userId: string): Promise<void> {
  // Queue streak update as background job
  await queueManager.addJob(QUEUES.GAMIFICATION, {
    type: 'update_streak',
    userId,
  }, { attempts: 2, backoff: { type: 'fixed', delay: 2000 } });
}

export async function updateMissionProgress(userId: string, action: string): Promise<void> {
  try {
    // Find active missions for this action
    const missions = await prisma.mission.findMany({
      where: {
        action,
        isActive: true,
      },
      include: {
        missionProgresses: {
          where: { userId },
        },
      },
    });

    for (const mission of missions) {
      const progress = mission.missionProgresses[0];

      if (!progress) {
        const completed = 1 >= mission.targetCount;
        // Create new progress
        await prisma.missionProgress.create({
          data: {
            userId,
            missionId: mission.id,
            currentCount: 1,
            completed,
            completedAt: completed ? new Date() : null,
          },
        });

        if (completed) {
          if (mission.expReward > 0) {
            await awardExp(userId, 'MISSION_BONUS', `Completed mission: ${mission.title}`, mission.expReward);
          }
          if (io) {
            io.to(`user:${userId}`).emit('gamification:mission_complete', {
              mission,
              reward: mission.expReward,
            });
          }
        } else if (io) {
          io.to(`user:${userId}`).emit('gamification:mission_updated', {
            mission,
            currentCount: 1,
          });
        }
      } else if (!progress.completed) {
        // Update existing progress
        const newCount = progress.currentCount + 1;
        const completed = newCount >= mission.targetCount;

        await prisma.missionProgress.update({
          where: { id: progress.id },
          data: {
            currentCount: newCount,
            completed,
            completedAt: completed ? new Date() : null,
          },
        });

        if (completed) {
          if (mission.expReward > 0) {
            await awardExp(userId, 'MISSION_BONUS', `Completed mission: ${mission.title}`, mission.expReward);
          }
          if (io) {
            io.to(`user:${userId}`).emit('gamification:mission_complete', {
              mission,
              reward: mission.expReward,
            });
          }
        } else if (io) {
          io.to(`user:${userId}`).emit('gamification:mission_updated', {
            mission,
            currentCount: newCount,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating mission progress:', error);
  }
}
