import { apiFetch } from './client';

export interface Notification {
  id: string;
  shopId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  createdAt: string;
}

export type NotificationType =
  | 'LICENSE_EXPIRY'
  | 'PASS_CARD_EXPIRY'
  | 'MEMBER_BIRTHDAY'
  | 'ABNORMAL_ORDER'
  | 'SYSTEM_ANNOUNCEMENT';

export interface NotificationPagination {
  items: Notification[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  LICENSE_EXPIRY: '许可证到期',
  PASS_CARD_EXPIRY: '次卡到期',
  MEMBER_BIRTHDAY: '会员生日',
  ABNORMAL_ORDER: '异常订单',
  SYSTEM_ANNOUNCEMENT: '系统公告',
};

export async function getNotifications(filters?: NotificationFilters): Promise<NotificationPagination> {
  const params = new URLSearchParams();

  if (filters?.type) {
    params.append('type', filters.type);
  }
  if (filters?.isRead !== undefined) {
    params.append('isRead', filters.isRead.toString());
  }
  if (filters?.page) {
    params.append('page', filters.page.toString());
  }
  if (filters?.pageSize) {
    params.append('pageSize', filters.pageSize.toString());
  }

  const queryString = params.toString();
  const res = await apiFetch<{ code: number; data: NotificationPagination }>(
    `/notifications${queryString ? `?${queryString}` : ''}`,
  );
  return res.data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const res = await apiFetch<{ code: number; data: { count: number } }>(
    '/notifications/unread-count',
  );
  return res.data;
}

export async function markAsRead(id: string): Promise<Notification> {
  const res = await apiFetch<{ code: number; data: Notification }>(
    `/notifications/${id}/read`,
    { method: 'PATCH' },
  );
  return res.data;
}

export async function markAllAsRead(): Promise<void> {
  await apiFetch<{ code: number; data: null }>('/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function deleteNotification(id: string): Promise<void> {
  await apiFetch<{ code: number; data: null }>(`/notifications/${id}`, {
    method: 'DELETE',
  });
}
