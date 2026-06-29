import { FastifyInstance } from 'fastify';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller';

export async function notificationRoutes(fastify: FastifyInstance) {
  // Get user notifications with pagination
  fastify.get('/notifications', {
    preHandler: [fastify.authenticate],
    handler: getNotifications,
  });

  // Mark notification as read
  fastify.patch('/notifications/:id/read', {
    preHandler: [fastify.authenticate],
    handler: markAsRead,
  });

  // Mark all notifications as read
  fastify.patch('/notifications/read-all', {
    preHandler: [fastify.authenticate],
    handler: markAllAsRead,
  });

  // Delete notification
  fastify.delete('/notifications/:id', {
    preHandler: [fastify.authenticate],
    handler: deleteNotification,
  });
}
