import { FastifyInstance } from 'fastify';
import { gamificationController } from '../controllers/gamification.controller';

export async function gamificationRoutes(fastify: FastifyInstance) {
  // User stats
  fastify.get('/stats', {
    onRequest: [fastify.authenticate],
  }, gamificationController.getUserStats);

  // Achievements
  fastify.get('/achievements', {
    onRequest: [fastify.authenticate],
  }, gamificationController.getUserAchievements);

  fastify.get('/achievements/all', {
    onRequest: [fastify.authenticate],
  }, gamificationController.getAllAchievements);

  // Badges
  fastify.get('/badges', {
    onRequest: [fastify.authenticate],
  }, gamificationController.getUserBadges);

  fastify.get('/badges/all', {
    onRequest: [fastify.authenticate],
  }, gamificationController.getAllBadges);

  // Missions
  fastify.get('/missions', {
    onRequest: [fastify.authenticate],
  }, gamificationController.getUserMissions);

  fastify.get('/missions/available', {
    onRequest: [fastify.authenticate],
  }, gamificationController.getAvailableMissions);

  // Leaderboard
  fastify.get('/leaderboard', {
    onRequest: [fastify.authenticate],
  }, gamificationController.getLeaderboard);

  // Experience history
  fastify.get('/exp-history', {
    onRequest: [fastify.authenticate],
  }, gamificationController.getExpHistory);

  // Admin routes
  fastify.post('/achievements', {
    onRequest: [fastify.authenticate],
  }, gamificationController.createAchievement);

  fastify.post('/badges', {
    onRequest: [fastify.authenticate],
  }, gamificationController.createBadge);

  fastify.post('/missions', {
    onRequest: [fastify.authenticate],
  }, gamificationController.createMission);

  fastify.put('/achievements/:id', {
    onRequest: [fastify.authenticate],
  }, gamificationController.updateAchievement);

  fastify.delete('/achievements/:id', {
    onRequest: [fastify.authenticate],
  }, gamificationController.deleteAchievement);
}
