import { FastifyRequest, FastifyReply } from 'fastify';
import {
  getPlatformStats as svcGetPlatformStats, getAnalytics as svcGetAnalytics, getUsers as svcGetUsers,
  updateUserRole as svcUpdateUserRole, deleteUser as svcDeleteUser, suspendUser as svcSuspendUser,
  unsuspendUser as svcUnsuspendUser, getReportedPosts as svcGetReportedPosts,
  deleteReportedPost as svcDeleteReportedPost, dismissReport as svcDismissReport,
  getPendingCourses as svcGetPendingCourses, updateCourseStatus as svcUpdateCourseStatus,
  getAllContests as svcGetAllContests, deleteContest as svcDeleteContest, getPlatformSettings as svcGetPlatformSettings,
  updatePlatformSetting as svcUpdatePlatformSetting, deletePlatformSetting as svcDeletePlatformSetting,
  getDisputedContracts as svcGetDisputedContracts, getPayoutRequests as svcGetPayoutRequests,
  updatePayoutStatus as svcUpdatePayoutStatus, broadcastNotification as svcBroadcastNotification,
  getBadges as svcGetBadges, createBadge as svcCreateBadge, deleteBadge as svcDeleteBadge,
  getMissions as svcGetMissions, createMission as svcCreateMission, deleteMission as svcDeleteMission,
} from '../services/admin.service';
import { AppError } from '../lib/errors';

const adminController = {
  async getPlatformStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetPlatformStats();
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getPlatformStats failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async getAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetAnalytics();
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getAnalytics failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetUsers(request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getUsers failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async updateUserRole(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      const body = request.body as any;
      const result = await svcUpdateUserRole(userId, body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const adminUserId = (request as any).user.id;
      const { userId } = request.params as { userId: string };
      await svcDeleteUser(adminUserId, userId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async suspendUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const adminUserId = (request as any).user.id;
      const { userId } = request.params as { userId: string };
      const body = request.body as any;
      const result = await svcSuspendUser(adminUserId, userId, body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async unsuspendUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      const result = await svcUnsuspendUser(userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async getReportedPosts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetReportedPosts(request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getReportedPosts failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async deleteReportedPost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { postId } = request.params as { postId: string };
      await svcDeleteReportedPost(postId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async dismissReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { reportId } = request.params as { reportId: string };
      await svcDismissReport(reportId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async getPendingCourses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetPendingCourses(request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getPendingCourses failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async updateCourseStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { courseId } = request.params as { courseId: string };
      const { status } = request.body as { status: 'PUBLISHED' | 'REJECTED' };
      const result = await svcUpdateCourseStatus(courseId, status);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async getAllContests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetAllContests(request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getAllContests failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async deleteContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { contestId } = request.params as { contestId: string };
      await svcDeleteContest(contestId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async getPlatformSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetPlatformSettings();
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getPlatformSettings failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async updatePlatformSetting(request: FastifyRequest, reply: FastifyReply) {
    try {
      const adminUserId = (request as any).user.id;
      const result = await svcUpdatePlatformSetting(adminUserId, request.body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async deletePlatformSetting(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { key } = request.params as { key: string };
      await svcDeletePlatformSetting(key);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async getDisputedContracts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetDisputedContracts(request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getDisputedContracts failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async getPayoutRequests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetPayoutRequests(request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getPayoutRequests failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async updatePayoutStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { payoutId } = request.params as { payoutId: string };
      const { status } = request.body as { status: 'APPROVED' | 'REJECTED' };
      const result = await svcUpdatePayoutStatus(payoutId, status);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async broadcastNotification(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcBroadcastNotification(request.body as { title: string; message: string; targetRole?: 'FREELANCER' | 'CLIENT' | 'ALL' });
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async getBadges(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetBadges();
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getBadges failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async createBadge(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcCreateBadge(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async deleteBadge(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { badgeId } = request.params as { badgeId: string };
      await svcDeleteBadge(badgeId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async getMissions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetMissions();
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getMissions failed');
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async createMission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcCreateMission(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },

  async deleteMission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { missionId } = request.params as { missionId: string };
      await svcDeleteMission(missionId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ message: error.message });
      return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
    }
  },
};

export const {
  getPlatformStats, getAnalytics, getUsers, updateUserRole, deleteUser, suspendUser,
  unsuspendUser, getReportedPosts, deleteReportedPost, dismissReport, getPendingCourses,
  updateCourseStatus, getAllContests, deleteContest, getPlatformSettings, updatePlatformSetting,
  deletePlatformSetting, getDisputedContracts, getPayoutRequests, updatePayoutStatus,
  broadcastNotification, getBadges, createBadge, deleteBadge, getMissions, createMission, deleteMission,
} = adminController;
