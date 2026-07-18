import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma', () => ({
  prisma: {
    notification: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../lib/queue', () => ({
  queueManager: { addJob: vi.fn() },
  QUEUES: { NOTIFICATION: 'notification' },
}));

import { prisma } from '../lib/prisma';
import * as notificationService from '../services/notification.service';

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      (prisma.notification.findMany as any).mockResolvedValue([
        { id: 'n1', userId: 'u1', type: 'SYSTEM', title: 'Test', message: 'Msg', isRead: false, createdAt: new Date() },
      ]);
      (prisma.notification.count as any).mockResolvedValue(1);

      const result = await notificationService.getNotifications('u1', { page: '1', limit: '20' });

      expect(result.notifications).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      (prisma.notification.findUnique as any).mockResolvedValue({ id: 'n1', userId: 'u1' });
      (prisma.notification.update as any).mockResolvedValue({ id: 'n1', isRead: true });

      const result = await notificationService.markAsRead('u1', 'n1');
      expect(result.isRead).toBe(true);
    });

    it('should throw for unauthorized user', async () => {
      (prisma.notification.findUnique as any).mockResolvedValue({ id: 'n1', userId: 'other-user' });

      await expect(notificationService.markAsRead('u1', 'n1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      (prisma.notification.findUnique as any).mockResolvedValue({ id: 'n1', userId: 'u1' });
      (prisma.notification.delete as any).mockResolvedValue({});

      const result = await notificationService.deleteNotification('u1', 'n1');
      expect(result.success).toBe(true);
    });
  });
});
