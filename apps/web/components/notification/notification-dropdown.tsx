'use client';

import { useEffect, useState } from 'react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  NOTIFICATION_TYPE_LABELS,
  type Notification,
} from '@/lib/api/notification';

interface NotificationDropdownProps {
  onClose: () => void;
  onReadChange: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  LICENSE_EXPIRY: '🔑',
  PASS_CARD_EXPIRY: '🎫',
  MEMBER_BIRTHDAY: '🎂',
  ABNORMAL_ORDER: '⚠️',
  SYSTEM_ANNOUNCEMENT: '📢',
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export function NotificationDropdown({ onClose, onReadChange }: NotificationDropdownProps) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications({ pageSize: 10 }).then((res) => {
      setItems(res.items);
      setLoading(false);
    });
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    onReadChange();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onReadChange();
  };

  const hasUnread = items.some((n) => !n.isRead);

  return (
    <div className="absolute right-0 top-full mt-2 w-96 rounded-lg border bg-card shadow-lg z-50">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-medium text-sm">通知</span>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary hover:underline"
            >
              全部已读
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            加载中...
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            暂无通知
          </div>
        ) : (
          items.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => {
                if (!notification.isRead) {
                  handleMarkAsRead(notification.id);
                }
              }}
              className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors ${
                !notification.isRead ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-base mt-0.5">
                  {TYPE_ICONS[notification.type] || '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                    </span>
                    {!notification.isRead && (
                      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm font-medium mt-0.5 truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="border-t px-4 py-2">
        <a
          href="/admin/notifications"
          className="block text-center text-sm text-primary hover:underline"
        >
          查看全部通知
        </a>
      </div>
    </div>
  );
}
