'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingOrderCount } from '../lib/offline/db';

interface NetworkStatus {
  isOnline: boolean;
  pendingOrderCount: number;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingOrderCount, setPendingOrderCount] = useState<number>(0);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingOrderCount();
      setPendingOrderCount(count);
    } catch {
      // IndexedDB may not be available
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshPendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count
    refreshPendingCount();

    // Poll pending count periodically (every 5s)
    const interval = setInterval(refreshPendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshPendingCount]);

  return { isOnline, pendingOrderCount };
}
