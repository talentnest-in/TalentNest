import { api } from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: 'NEW_APPLICATION' | 'NEW_MESSAGE' | 'NEW_OFFER' | 'OFFER_ACCEPTED' | 'CONTRACT_CREATED' | 'SYSTEM';
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export const notificationService = {
  async getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
    const response = await api.get('/notifications', { params: { page, limit } });
    const data = response.data?.data ?? response.data;
    return {
      notifications: Array.isArray(data?.notifications) ? data.notifications : [],
      pagination: data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
      unreadCount: data?.unreadCount ?? 0,
    };
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data?.data ?? response.data;
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await api.patch('/notifications/read-all');
    return response.data?.data ?? response.data;
  },

  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data?.data ?? response.data;
  },
};
