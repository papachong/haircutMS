'use client';

import { useNetworkStatus } from '../../hooks/use-network-status';

export default function OfflineBanner() {
  const { isOnline, pendingOrderCount } = useNetworkStatus();

  if (isOnline && pendingOrderCount === 0) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium">
        当前处于离线模式，订单将在恢复网络后自动提交
      </div>
    );
  }

  if (pendingOrderCount > 0) {
    return (
      <div className="bg-blue-500 text-white text-center py-2 px-4 text-sm font-medium">
        正在同步 {pendingOrderCount} 个待提交订单...
      </div>
    );
  }

  return null;
}
