import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../lib/errors';
import { queueManager, QUEUES } from '../lib/queue';

export async function getNotifications(
  userId: string,
  query: { page?: string; limit?: string }
) {
  const page = parseInt(query.page || '1');
  const limit = parseInt(query.limit || '20');
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  if (notification.userId !== userId) {
    throw new ForbiddenError('Unauthorized');
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return updated;
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { success: true };
}

export async function deleteNotification(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  if (notification.userId !== userId) {
    throw new ForbiddenError('Unauthorized');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return { success: true };
}

export const createNotification = async (data: {
  userId: string;
  type: 'NEW_APPLICATION' | 'NEW_MESSAGE' | 'NEW_OFFER' | 'OFFER_ACCEPTED' | 'CONTRACT_CREATED' | 'SYSTEM';
  title: string;
  message: string;
  link?: string;
}) => {
  try {
    await queueManager.addJob(QUEUES.NOTIFICATION, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    return { id: 'queued' };
  } catch (error) {
    console.error('Failed to queue notification:', error);
    // Fallback: create directly
    try {
      return await prisma.notification.create({ data });
    } catch {
      return null;
    }
  }
};
