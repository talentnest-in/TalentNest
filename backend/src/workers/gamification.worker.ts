import { Job } from 'bullmq';
import { queueManager, QUEUES } from '../lib/queue';
import { prisma } from '../lib/prisma';
import { EXP_REWARDS, getLevelFromExp } from '../constants/gamification.constants';

let io: any = null;
export const setSocketIOForGamification = (socketIO: any): void => {
  io = socketIO;
};

interface AwardExpData {
  userId: string;
  action: string;
  description: string;
  customAmount?: number;
}

interface CheckAchievementsData {
  userId: string;
  action: string;
}

interface UpdateStreakData {
  userId: string;
}

interface UpdateMissionData {
  userId: string;
  action: string;
}

export async function awardExpProcessor(job: Job<AwardExpData>): Promise<void> {
  const { userId, action, description, customAmount } = job.data;
  const expAmount = customAmount ?? EXP_REWARDS[action as keyof typeof EXP_REWARDS];
  if (!expAmount) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { exp: true, level: true, totalExpEarned: true },
    });
    if (!user) return;

    const oldLevel = user.level;
    const newExp = user.exp + expAmount;
    const newTotalExp = user.totalExpEarned + expAmount;
    const newLevel = getLevelFromExp(newExp);

    await prisma.experienceLog.create({
      data: { userId, amount: expAmount, action, description },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { exp: newExp, level: newLevel, totalExpEarned: newTotalExp },
    });

    if (io) {
      io.to(`user:${userId}`).emit('gamification:exp_gained', {
        amount: expAmount, total: newExp, action,
      });
    }

    if (newLevel > oldLevel) {
      if (io) {
        io.to(`user:${userId}`).emit('gamification:level_up', {
          oldLevel, newLevel, totalExp: newExp,
        });
      }
      await queueManager.addJob(QUEUES.NOTIFICATION, {
        userId, type: 'SYSTEM', title: 'Level Up!',
        message: `Congratulations! You've reached level ${newLevel}!`,
      });
    }
  } catch (error) {
    console.error('[GamificationWorker] awardExp failed:', error);
    throw error;
  }
}

export async function checkAchievementsProcessor(job: Job<CheckAchievementsData>): Promise<void> {
  const { userId, action } = job.data;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        experienceLogs: true,
        userAchievements: true,
        freelancerProfile: { include: { skills: true, experiences: true, educations: true } },
        _count: { select: { studentEnrollments: true, creatorCourses: true } },
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
    const actionCounts: Record<string, number> = {};
    user.experienceLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    const achievements = await prisma.achievement.findMany();

    for (const achievement of achievements) {
      if (unlockedAchievementIds.includes(achievement.id)) continue;
      let shouldUnlock = false;

      switch (achievement.category) {
        case 'FREELANCING':
          if (achievement.key === 'FIRST_APPLICATION' && (actionCounts['JOB_APPLICATION'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'FIRST_CONTRACT' && (actionCounts['CONTRACT_COMPLETE'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'FIRST_FIVE_STAR' && (actionCounts['FIVE_STAR_REVIEW'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'CONTRACT_MASTER' && (actionCounts['CONTRACT_COMPLETE'] || 0) >= 10) shouldUnlock = true;
          if (achievement.key === 'TOP_RATED' && (actionCounts['FIVE_STAR_REVIEW'] || 0) >= 5) shouldUnlock = true;
          break;
        case 'LEARNING':
          if (achievement.key === 'FIRST_COURSE' && user._count.studentEnrollments >= 1) shouldUnlock = true;
          if (achievement.key === 'FAST_LEARNER' && user._count.studentEnrollments >= 5) shouldUnlock = true;
          if (achievement.key === 'KNOWLEDGE_SEEKER' && user._count.studentEnrollments >= 10) shouldUnlock = true;
          break;
        case 'COMMUNITY':
          if (achievement.key === 'FIRST_POST' && (actionCounts['FIRST_POST'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'COMMUNITY_HELPER' && (actionCounts['FIRST_POST'] || 0) >= 10) shouldUnlock = true;
          if (achievement.key === 'TOP_MENTOR' && (actionCounts['COMMUNITY_COMMENT'] || 0) >= 50) shouldUnlock = true;
          break;
        case 'CREATOR':
          if (achievement.key === 'FIRST_COURSE_PUBLISHED' && user._count.creatorCourses >= 1) shouldUnlock = true;
          if (achievement.key === '100_STUDENTS' && user._count.creatorCourses >= 10) shouldUnlock = true;
          break;
        case 'CONTEST':
          if (achievement.key === 'CONTEST_PARTICIPANT' && (actionCounts['CONTEST_JOIN'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'CONTEST_WINNER' && (actionCounts['CONTEST_WIN'] || 0) >= 1) shouldUnlock = true;
          if (achievement.key === 'CHAMPION' && (actionCounts['CONTEST_WIN'] || 0) >= 3) shouldUnlock = true;
          break;
        case 'CAREER':
          if (achievement.key === 'PROFILE_COMPLETE' && profileCompleteness === 100) shouldUnlock = true;
          if (achievement.key === 'EARLY_ADOPTER') shouldUnlock = true;
          break;
      }

      if (shouldUnlock) {
        await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });

        if (achievement.expReward > 0) {
          await queueManager.addJob(QUEUES.GAMIFICATION, {
            type: 'award_exp',
            userId,
            action: 'ACHIEVEMENT_BONUS',
            description: `Unlocked achievement: ${achievement.title}`,
            customAmount: achievement.expReward,
          });
        }

        if (io) {
          io.to(`user:${userId}`).emit('gamification:achievement_unlocked', { achievement });
        }

        await queueManager.addJob(QUEUES.NOTIFICATION, {
          userId, type: 'SYSTEM', title: 'Achievement Unlocked!',
          message: `You've unlocked: ${achievement.title}`,
        });
      }
    }
  } catch (error) {
    console.error('[GamificationWorker] checkAchievements failed:', error);
  }
}

export async function updateStreakProcessor(job: Job<UpdateStreakData>): Promise<void> {
  const { userId } = job.data;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginDate: true, currentStreak: true, longestStreak: true },
    });
    if (!user) return;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    lastLogin?.setHours(0, 0, 0, 0);
    const dayDiff = lastLogin ? Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : 1;

    if (dayDiff === 0) return;

    let newStreak = user.currentStreak;
    let shouldAwardExp = false;

    if (dayDiff === 1) {
      newStreak += 1;
      shouldAwardExp = true;
    } else {
      newStreak = 1;
      shouldAwardExp = true;
    }

    const newLongestStreak = Math.max(newStreak, user.longestStreak);

    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginDate: new Date(), currentStreak: newStreak, longestStreak: newLongestStreak },
    });

    if (shouldAwardExp) {
      await queueManager.addJob(QUEUES.GAMIFICATION, {
        type: 'award_exp',
        userId,
        action: 'DAILY_LOGIN',
        description: 'Daily login streak bonus',
      });
    }
  } catch (error) {
    console.error('[GamificationWorker] updateStreak failed:', error);
  }
}

export async function updateMissionProcessor(job: Job<UpdateMissionData>): Promise<void> {
  const { userId, action } = job.data;
  try {
    const missions = await prisma.mission.findMany({
      where: { action, isActive: true },
      include: { missionProgresses: { where: { userId } } },
    });

    for (const mission of missions) {
      const progress = mission.missionProgresses[0];
      if (!progress) {
        const completed = 1 >= mission.targetCount;
        await prisma.missionProgress.create({
          data: {
            userId, missionId: mission.id, currentCount: 1,
            completed, completedAt: completed ? new Date() : null,
          },
        });
        if (completed) {
          if (mission.expReward > 0) {
            await queueManager.addJob(QUEUES.GAMIFICATION, {
              type: 'award_exp',
              userId, action: 'MISSION_BONUS',
              description: `Completed mission: ${mission.title}`,
              customAmount: mission.expReward,
            });
          }
          if (io) io.to(`user:${userId}`).emit('gamification:mission_complete', { mission, reward: mission.expReward });
        } else if (io) {
          io.to(`user:${userId}`).emit('gamification:mission_updated', { mission, currentCount: 1 });
        }
      } else if (!progress.completed) {
        const newCount = progress.currentCount + 1;
        const completed = newCount >= mission.targetCount;
        await prisma.missionProgress.update({
          where: { id: progress.id },
          data: { currentCount: newCount, completed, completedAt: completed ? new Date() : null },
        });
        if (completed) {
          if (mission.expReward > 0) {
            await queueManager.addJob(QUEUES.GAMIFICATION, {
              type: 'award_exp',
              userId, action: 'MISSION_BONUS',
              description: `Completed mission: ${mission.title}`,
              customAmount: mission.expReward,
            });
          }
          if (io) io.to(`user:${userId}`).emit('gamification:mission_complete', { mission, reward: mission.expReward });
        } else if (io) {
          io.to(`user:${userId}`).emit('gamification:mission_updated', { mission, currentCount: newCount });
        }
      }
    }
  } catch (error) {
    console.error('[GamificationWorker] updateMission failed:', error);
  }
}

export async function gamificationRouter(job: Job): Promise<void> {
  const { type } = job.data;
  switch (type) {
    case 'award_exp':
      await awardExpProcessor(job);
      break;
    case 'check_achievements':
      await checkAchievementsProcessor(job);
      break;
    case 'update_streak':
      await updateStreakProcessor(job);
      break;
    case 'update_mission':
      await updateMissionProcessor(job);
      break;
    case 'check_profile_completion': {
      const { userId: pid } = job.data;
      const user = await prisma.user.findUnique({
        where: { id: pid },
        include: {
          freelancerProfile: { include: { skills: true, experiences: true, educations: true } },
          experienceLogs: { where: { action: 'PROFILE_COMPLETE' } },
        },
      });
      if (user?.freelancerProfile && user.experienceLogs.length === 0) {
        let score = 0;
        const p = user.freelancerProfile;
        if (p.title && p.bio) score += 20;
        if (p.skills.length > 0) score += 20;
        if (p.experiences.length > 0) score += 20;
        if (p.educations.length > 0) score += 20;
        if (p.resumeUrl) score += 20;
        if (score === 100) {
          await queueManager.addJob(QUEUES.GAMIFICATION, {
            type: 'award_exp', userId: pid, action: 'PROFILE_COMPLETE', description: 'Profile 100% complete',
          });
        }
      }
      break;
    }
    default:
      console.warn(`[GamificationWorker] Unknown type: ${type}`);
  }
}

export function registerGamificationWorker(): void {
  queueManager.defineQueue(QUEUES.GAMIFICATION);
  queueManager.defineWorker(QUEUES.GAMIFICATION, gamificationRouter, { concurrency: 5 });
  console.log('[Queue] Gamification worker registered');
}
