'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ShoppingCart, Wallet, AlertTriangle } from 'lucide-react';

export interface DashboardNotification {
  id: string;
  type: 'order-settled' | 'member-recharge' | 'large-order';
  title: string;
  message: string;
  amount?: number;
  timestamp: Date;
}

interface NotificationToastProps {
  notifications: DashboardNotification[];
  onDismiss: (id: string) => void;
}

const DISMISS_AFTER_MS = 3000;
const LARGE_ORDER_THRESHOLD = 5000;

const iconMap = {
  'order-settled': ShoppingCart,
  'member-recharge': Wallet,
  'large-order': AlertTriangle,
} as const;

const colorMap = {
  'order-settled': 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
  'member-recharge': 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  'large-order': 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30',
} as const;

const iconColorMap = {
  'order-settled': 'text-blue-500',
  'member-recharge': 'text-emerald-500',
  'large-order': 'text-amber-500',
} as const;

function SingleNotification({
  notification,
  onDismiss,
}: {
  notification: DashboardNotification;
  onDismiss: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 200);
  }, [notification.id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  const Icon = iconMap[notification.type];

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border-l-4 p-3 shadow-lg transition-all duration-200 ${
        colorMap[notification.type]
      } ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColorMap[notification.type]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{notification.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{notification.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function NotificationToast({ notifications, onDismiss }: NotificationToastProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <SingleNotification notification={notification} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

export { LARGE_ORDER_THRESHOLD };
