import { FastifyInstance } from 'fastify';
import {
  getPlatformStats,
  getAnalytics,
  getUsers,
  updateUserRole,
  deleteUser,
  getReportedPosts,
  deleteReportedPost,
  dismissReport,
  getPendingCourses,
  updateCourseStatus,
  getAllContests,
  deleteContest,
  suspendUser,
  unsuspendUser,
  getPlatformSettings,
  updatePlatformSetting,
  deletePlatformSetting,
  getDisputedContracts,
  getPayoutRequests,
  updatePayoutStatus,
  broadcastNotification,
  getBadges,
  createBadge,
  deleteBadge,
  getMissions,
  createMission,
  deleteMission,
} from '../controllers/admin.controller';

const verifyAdmin = async (request: any, reply: any) => {
  if (request.user.role !== 'ADMIN') {
    return reply.status(403).send({ statusCode: 403, message: 'Forbidden: Admin access required' });
  }
};

export async function adminRoutes(server: FastifyInstance) {
  server.addHook('preValidation', server.authenticate);
  server.addHook('preHandler', verifyAdmin);

  // Stats & Analytics
  server.get('/stats', getPlatformStats);
  server.get('/analytics', getAnalytics);

  // User Management
  server.get('/users', getUsers);
  server.patch('/users/:userId/role', updateUserRole);
  server.delete('/users/:userId', deleteUser);
  server.post('/users/:userId/suspend', suspendUser);
  server.post('/users/:userId/unsuspend', unsuspendUser);

  // Community Moderation
  server.get('/reports/posts', getReportedPosts);
  server.delete('/reports/posts/:reportId/delete-post', deleteReportedPost);
  server.post('/reports/posts/:reportId/dismiss', dismissReport);

  // Academy Moderation
  server.get('/courses/pending', getPendingCourses);
  server.patch('/courses/:courseId/status', updateCourseStatus);

  // Contest Management
  server.get('/contests', getAllContests);
  server.delete('/contests/:contestId', deleteContest);

  // Platform Settings
  server.get('/settings', getPlatformSettings);
  server.post('/settings', updatePlatformSetting);
  server.delete('/settings/:key', deletePlatformSetting);

  // Financial & Dispute Management
  server.get('/finance/disputes', getDisputedContracts);
  server.get('/finance/payouts', getPayoutRequests);
  server.post('/finance/payouts/:payoutId/approve', updatePayoutStatus);

  // Communication
  server.post('/communication/broadcast', broadcastNotification);

  // Gamification Management
  server.get('/gamification/badges', getBadges);
  server.post('/gamification/badges', createBadge);
  server.delete('/gamification/badges/:badgeId', deleteBadge);
  server.get('/gamification/missions', getMissions);
  server.post('/gamification/missions', createMission);
  server.delete('/gamification/missions/:missionId', deleteMission);
}
