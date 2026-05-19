'use client';

import { ConnectionStatus } from '@/hooks/use-dashboard-socket';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
}

const statusConfig: Record<ConnectionStatus, { label: string; color: string; icon: typeof Wifi }> = {
  connected: {
    label: '实时',
    color: 'bg-green-500',
    icon: Wifi,
  },
  connecting: {
    label: '连接中',
    color: 'bg-amber-500',
    icon: Loader2,
  },
  disconnected: {
    label: '离线',
    color: 'bg-gray-400',
    icon: WifiOff,
  },
};

export function ConnectionStatusIndicator({ status }: ConnectionStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs">
      <span className={`relative flex h-2 w-2`}>
        {status === 'connecting' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        )}
        {status === 'connected' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`} />
      </span>
      <Icon className={`h-3 w-3 ${status === 'connecting' ? 'animate-spin' : ''}`} />
      <span className="font-medium text-muted-foreground">{config.label}</span>
    </div>
  );
}
