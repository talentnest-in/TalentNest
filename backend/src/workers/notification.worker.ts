import { Job } from 'bullmq';
import { queueManager, QUEUES } from '../lib/queue';
import { prisma } from '../lib/prisma';
import { logError, logInfo } from '../lib/logger';

interface NotificationJobData {
  userId: string;
  type: 'NEW_APPLICATION' | 'NEW_MESSAGE' | 'NEW_OFFER' | 'OFFER_ACCEPTED' | 'CONTRACT_CREATED' | 'SYSTEM';
  title: string;
  message: string;
  link?: string;
}

export async function notificationProcessor(job: Job<NotificationJobData>): Promise<void> {
  const { userId, type, title, message, link } = job.data;

  try {
    await prisma.notification.create({
      data: { userId, type, title, message, link: link ?? null },
    });

    let io: any = null;
    try {
      const mod = await import('../plugins/socket.js');
      io = mod.getIO();
    } catch {}
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', {
        id: job.id,
        type,
        title,
        message,
        link,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    logError('[NotificationWorker]', error, { context: 'create_notification' });
    throw error;
  }
}

export function registerNotificationWorker(): void {
  queueManager.defineQueue(QUEUES.NOTIFICATION);
  queueManager.defineWorker(QUEUES.NOTIFICATION, notificationProcessor, { concurrency: 10 });
  logInfo('[Queue]', 'Notification worker registered');
}
