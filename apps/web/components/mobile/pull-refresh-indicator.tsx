'use client';

import { RefreshCw } from 'lucide-react';

interface PullRefreshIndicatorProps {
  pulling: boolean;
  refreshing: boolean;
  pullDistance?: number;
}

export default function PullRefreshIndicator({
  pulling,
  refreshing,
  pullDistance = 0,
}: PullRefreshIndicatorProps) {
  const show = pulling || refreshing;
  const opacity = Math.min(pullDistance / 80, 1);

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{
        height: show ? '48px' : '0px',
        opacity: show ? (refreshing ? 1 : opacity) : 0,
      }}
      aria-hidden={!show}
    >
      <RefreshCw
        className={`h-5 w-5 text-blue-500 dark:text-blue-400 ${
          refreshing ? 'animate-spin' : ''
        }`}
      />
      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
        {refreshing ? '刷新中...' : '下拉刷新'}
      </span>
    </div>
  );
}
