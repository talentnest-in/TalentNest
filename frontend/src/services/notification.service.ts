import axios from 'axios';
import { BACKEND_URL } from '@/lib/constants';

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

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

export const notificationService = {
  async getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
    const response = await api.get('/api/v1/notifications', { params: { page, limit } });
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.patch(`/api/v1/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await api.patch('/api/v1/notifications/read-all');
    return response.data;
  },

  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/api/v1/notifications/${notificationId}`);
    return response.data;
  },
};
