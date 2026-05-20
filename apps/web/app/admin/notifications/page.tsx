'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  NOTIFICATION_TYPE_LABELS,
  type Notification,
  type NotificationType,
} from '@/lib/api/notification';

const TYPE_ICONS: Record<string, string> = {
  LICENSE_EXPIRY: '🔑',
  PASS_CARD_EXPIRY: '🎫',
  MEMBER_BIRTHDAY: '🎂',
  ABNORMAL_ORDER: '⚠️',
  SYSTEM_ANNOUNCEMENT: '📢',
};

const TYPE_FILTERS: { label: string; value?: NotificationType }[] = [
  { label: '全部' },
  { label: '未读', value: undefined },
  { label: '许可证到期', value: 'LICENSE_EXPIRY' },
  { label: '次卡到期', value: 'PASS_CARD_EXPIRY' },
  { label: '会员生日', value: 'MEMBER_BIRTHDAY' },
  { label: '异常订单', value: 'ABNORMAL_ORDER' },
  { label: '系统公告', value: 'SYSTEM_ANNOUNCEMENT' },
];

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const pageSize = 20;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const filter = TYPE_FILTERS[activeFilter];
      const isUnreadFilter = activeFilter === 1;

      const res = await getNotifications({
        type: isUnreadFilter ? undefined : filter.value,
        isRead: isUnreadFilter ? false : undefined,
        page,
        pageSize,
      });
      setItems(res.items);
      setTotal(res.pagination.total);
      setHasMore(res.pagination.hasMore);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setTotal((prev) => prev - 0);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    setTotal((prev) => prev - 1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">通知中心</h1>
        <button
          type="button"
          onClick={handleMarkAllAsRead}
          className="text-sm text-primary hover:underline"
        >
          全部标记已读
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((filter, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              setActiveFilter(index);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              activeFilter === index
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-muted-foreground hover:bg-accent/80'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无通知</div>
      ) : (
        <div className="space-y-2">
          {items.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                !notification.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'
              }`}
            >
              <span className="text-xl mt-0.5">
                {TYPE_ICONS[notification.type] || '📌'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                    {NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                  </span>
                  {!notification.isRead && (
                    <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="font-medium mt-1">{notification.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.content}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  {formatTime(notification.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-xs text-primary hover:underline px-2 py-1"
                  >
                    标记已读
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(notification.id)}
                  className="text-xs text-destructive hover:underline px-2 py-1"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm rounded border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 页（共 {total} 条）
          </span>
          <button
            type="button"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm rounded border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
