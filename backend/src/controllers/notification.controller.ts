import { FastifyRequest, FastifyReply } from 'fastify';
import { getNotifications as svcGetNotifications, markAsRead as svcMarkAsRead, markAllAsRead as svcMarkAllAsRead, deleteNotification as svcDeleteNotification, createNotification as svcCreateNotification } from '../services/notification.service';
import { AppError } from '../lib/errors';

export const getNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcGetNotifications(request.user.id, request.query as any);
    return reply.send(result);
  } catch (error) {
    request.log.error(error, 'getNotifications failed');
    return reply.status(500).send({ error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcMarkAsRead(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'markAsRead failed');
    return reply.status(500).send({ error: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await svcMarkAllAsRead(request.user.id);
    return reply.send(result);
  } catch (error) {
    request.log.error(error, 'markAllAsRead failed');
    return reply.status(500).send({ error: 'Failed to mark all notifications as read' });
  }
};

export const deleteNotification = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const result = await svcDeleteNotification(request.user.id, request.params.id);
    return reply.send(result);
  } catch (error) {
    if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
    request.log.error(error, 'deleteNotification failed');
    return reply.status(500).send({ error: 'Failed to delete notification' });
  }
};

export { svcCreateNotification as createNotification };
