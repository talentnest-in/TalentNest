import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Loader2, Check, Users, DollarSign, MessageSquare, Trash2, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { notificationService, type Notification } from '@/services/notification.service';

export function Notifications() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationService.getNotifications(page, 20),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notificationsData?.unreadCount || 0;
  const pagination = notificationsData?.pagination;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_APPLICATION':
        return <Users className="w-5 h-5" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-5 h-5" />;
      case 'NEW_OFFER':
        return <DollarSign className="w-5 h-5" />;
      case 'OFFER_ACCEPTED':
        return <Check className="w-5 h-5" />;
      case 'CONTRACT_CREATED':
        return <FileText className="w-5 h-5" />;
      case 'SYSTEM':
        return <Bell className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_APPLICATION':
        return 'bg-primary/10 text-primary';
      case 'NEW_MESSAGE':
        return 'bg-accent/10 text-accent';
      case 'NEW_OFFER':
        return 'bg-success/10 text-success';
      case 'OFFER_ACCEPTED':
        return 'bg-success/10 text-success';
      case 'CONTRACT_CREATED':
        return 'bg-primary/10 text-primary';
      case 'SYSTEM':
        return 'bg-text-muted/10 text-text-muted';
      default:
        return 'bg-text-muted/10 text-text-muted';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-text">Notifications</h1>
            <p className="text-text-muted mt-1">Stay updated with your activity</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-sm text-accent hover:text-accent/80 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : !notificationsData || notificationsData.notifications.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-heading font-semibold text-text mb-2">No notifications</h3>
            <p className="text-text-muted">
              You're all caught up! We'll notify you when something important happens.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-surface border border-border rounded-2xl divide-y divide-border">
              {notificationsData.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 lg:p-6 transition-colors hover:bg-background ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          className={`font-semibold ${!notification.isRead ? 'text-text' : 'text-text-muted'}`}
                        >
                          {notification.title}
                        </h3>
                        <div className="flex gap-1 shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsReadMutation.mutate(notification.id);
                              }}
                              className="p-1 hover:bg-background rounded transition-colors text-text-muted"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotificationMutation.mutate(notification.id);
                            }}
                            className="p-1 hover:bg-background rounded transition-colors text-text-muted hover:text-error"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-text-muted mb-2">{notification.message}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-text-muted">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
