import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

// ── Get User Notifications ───────────────────────────────────────────────
export const getNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { page = '1', limit = '20' } = request.query as any;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return reply.send({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      unreadCount,
    });
  } catch (error) {
    request.log.error(error, 'getNotifications failed');
    return reply.status(500).send({ error: 'Failed to fetch notifications' });
  }
};

// ── Mark Notification as Read ─────────────────────────────────────────────
export const markAsRead = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { id } = request.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return reply.status(404).send({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return reply.send(updated);
  } catch (error) {
    request.log.error(error, 'markAsRead failed');
    return reply.status(500).send({ error: 'Failed to mark notification as read' });
  }
};

// ── Mark All Notifications as Read ─────────────────────────────────────────
export const markAllAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error, 'markAllAsRead failed');
    return reply.status(500).send({ error: 'Failed to mark all notifications as read' });
  }
};

// ── Delete Notification ───────────────────────────────────────────────────
export const deleteNotification = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { id } = request.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return reply.status(404).send({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error, 'deleteNotification failed');
    return reply.status(500).send({ error: 'Failed to delete notification' });
  }
};

// ── Create Notification Helper ─────────────────────────────────────────────
export const createNotification = async (data: {
  userId: string;
  type: 'NEW_APPLICATION' | 'NEW_MESSAGE' | 'NEW_OFFER' | 'OFFER_ACCEPTED' | 'CONTRACT_CREATED' | 'SYSTEM';
  title: string;
  message: string;
  link?: string;
}) => {
  try {
    return await prisma.notification.create({
      data,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
