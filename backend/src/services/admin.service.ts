import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError, ValidationError } from '../lib/errors';

const updateUserRoleSchema = z.object({
  role: z.enum(['FREELANCER', 'CLIENT', 'ADMIN']),
});

const suspendUserSchema = z.object({
  reason: z.string().min(5),
});

const updateSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  description: z.string().optional(),
});

const badgeSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'LEGEND']),
  category: z.string().min(1),
});

const missionSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  action: z.string().min(1),
  targetCount: z.number().int().positive(),
  expReward: z.number().int().positive(),
  isActive: z.boolean().optional().default(true),
});

export async function getPlatformStats() {
  const [totalUsers, activeContracts, revenueAggregation, totalCourses, totalContests, pendingCourses] = await Promise.all([
    prisma.user.count(),
    prisma.contract.count({ where: { status: 'ACTIVE' } }),
    prisma.contract.aggregate({ where: { status: 'COMPLETED' }, _sum: { agreedBudget: true } }),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    prisma.contest.count(),
    prisma.course.count({ where: { status: 'PENDING_REVIEW' } }),
  ]);

  return {
    totalUsers,
    activeContracts,
    totalRevenue: revenueAggregation._sum.agreedBudget || 0,
    totalCourses,
    totalContests,
    pendingCourses,
  };
}

export async function getAnalytics() {
  const days = 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [users, contracts] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.contract.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, agreedBudget: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const buckets: Record<string, { date: string; users: number; contracts: number; revenue: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { date: key, users: 0, contracts: 0, revenue: 0 };
  }

  users.forEach(u => {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (buckets[key]) buckets[key].users++;
  });

  contracts.forEach(c => {
    const key = c.createdAt.toISOString().slice(0, 10);
    if (buckets[key]) {
      buckets[key].contracts++;
      buckets[key].revenue += Number(c.agreedBudget) || 0;
    }
  });

  return Object.values(buckets);
}

export async function getUsers(query: { page?: string; limit?: string; role?: string; search?: string }) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(50, parseInt(query.limit || '20'));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query.role) where.role = query.role;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, exp: true, level: true,
        createdAt: true, onboardingCompleted: true, provider: true,
        isSuspended: true, suspensionReason: true,
        _count: { select: { freelancerContracts: true, clientContracts: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function updateUserRole(userId: string, body: unknown) {
  const { role } = updateUserRoleSchema.parse(body);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
}

export async function deleteUser(adminUserId: string, targetUserId: string) {
  if (adminUserId === targetUserId) {
    throw new BadRequestError('Cannot delete your own account');
  }
  await prisma.user.delete({ where: { id: targetUserId } });
  return { message: 'User deleted successfully' };
}

export async function suspendUser(adminUserId: string, targetUserId: string, body: unknown) {
  const { reason } = suspendUserSchema.parse(body);
  if (adminUserId === targetUserId) {
    throw new BadRequestError('Cannot suspend your own account');
  }
  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { isSuspended: true, suspensionReason: reason },
    select: { id: true, isSuspended: true, suspensionReason: true },
  });
  return user;
}

export async function unsuspendUser(targetUserId: string) {
  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { isSuspended: false, suspensionReason: null },
    select: { id: true, isSuspended: true },
  });
  return user;
}

export async function getReportedPosts(query: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(50, parseInt(query.limit || '20'));
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    prisma.postReport.findMany({
      include: {
        post: { include: { author: { select: { id: true, name: true, avatar: true } } } },
        reporter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.postReport.count(),
  ]);
  return { reports, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function deleteReportedPost(reportId: string) {
  const report = await prisma.postReport.findUnique({ where: { id: reportId } });
  if (!report) throw new NotFoundError('Report');
  await prisma.post.delete({ where: { id: report.postId } });
  return { message: 'Post deleted successfully' };
}

export async function dismissReport(reportId: string) {
  await prisma.postReport.delete({ where: { id: reportId } });
  return { message: 'Report dismissed' };
}

export async function getPendingCourses(query: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(50, parseInt(query.limit || '20'));
  const skip = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.course.count({ where: { status: 'PENDING_REVIEW' } }),
  ]);
  return { courses, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function updateCourseStatus(courseId: string, status: 'PUBLISHED' | 'REJECTED') {
  const course = await prisma.course.update({
    where: { id: courseId },
    data: { status },
  });
  return course;
}

export async function getAllContests(query: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(50, parseInt(query.limit || '20'));
  const skip = (page - 1) * limit;

  const [contests, total] = await Promise.all([
    prisma.contest.findMany({
      include: {
        client: { select: { id: true, name: true, avatar: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contest.count(),
  ]);
  return { contests, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function deleteContest(contestId: string) {
  await prisma.contest.delete({ where: { id: contestId } });
  return { message: 'Contest deleted' };
}

export async function getPlatformSettings() {
  const settings = await prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
  return settings;
}

export async function updatePlatformSetting(adminId: string, body: unknown) {
  const { key, value, type, description } = updateSettingSchema.parse(body);

  const settingData = {
    value,
    ...(type && { type }),
    ...(description !== undefined && { description }),
    updatedBy: adminId,
  };

  const setting = await prisma.platformSetting.upsert({
    where: { key },
    update: settingData,
    create: { key, ...settingData },
  });

  return setting;
}

export async function deletePlatformSetting(key: string) {
  await prisma.platformSetting.delete({ where: { key } });
  return { message: 'Setting deleted' };
}

export async function getDisputedContracts(query: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(50, parseInt(query.limit || '20'));
  const skip = (page - 1) * limit;

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where: { status: 'DISPUTED' },
      include: {
        client: { select: { id: true, name: true, email: true } },
        freelancer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contract.count({ where: { status: 'DISPUTED' } }),
  ]);
  return { contracts, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getPayoutRequests(query: { page?: string; limit?: string; status?: string }) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(50, parseInt(query.limit || '20'));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query.status) where.status = query.status;

  const [payouts, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payoutRequest.count({ where }),
  ]);
  return { payouts, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function updatePayoutStatus(payoutId: string, status: 'APPROVED' | 'REJECTED') {
  const payout = await prisma.payoutRequest.update({
    where: { id: payoutId },
    data: { status },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return payout;
}

export async function broadcastNotification(body: { title: string; message: string; targetRole?: 'ALL' | 'FREELANCER' | 'CLIENT' }) {
  const { title, message, targetRole = 'ALL' } = body;

  let userFilter = {};
  if (targetRole !== 'ALL') {
    userFilter = { role: targetRole };
  }

  const users = await prisma.user.findMany({ where: userFilter, select: { id: true } });

  await prisma.notification.createMany({
    data: users.map(u => ({
      userId: u.id,
      type: 'SYSTEM',
      title,
      message,
      isRead: false,
    })),
  });

  return { message: `Broadcast sent to ${users.length} users.` };
}

export async function getBadges() {
  const badges = await prisma.badge.findMany({ orderBy: [{ tier: 'asc' }, { title: 'asc' }] });
  return badges;
}

export async function createBadge(body: unknown) {
  const data = badgeSchema.parse(body);
  const badge = await prisma.badge.create({ data });
  return badge;
}

export async function deleteBadge(badgeId: string) {
  await prisma.badge.delete({ where: { id: badgeId } });
  return { message: 'Badge deleted' };
}

export async function getMissions() {
  const missions = await prisma.mission.findMany({ orderBy: [{ type: 'asc' }, { title: 'asc' }] });
  return missions;
}

export async function createMission(body: unknown) {
  const data = missionSchema.parse(body);
  const mission = await prisma.mission.create({ data });
  return mission;
}

export async function deleteMission(missionId: string) {
  await prisma.mission.delete({ where: { id: missionId } });
  return { message: 'Mission deleted' };
}
