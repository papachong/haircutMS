'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePullRefreshOptions {
  threshold?: number;
  maxPull?: number;
}

interface UsePullRefreshReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pulling: boolean;
  refreshing: boolean;
  pullDistance: number;
}

export function usePullRefresh(
  onRefresh: () => Promise<void>,
  options: UsePullRefreshOptions = {}
): UsePullRefreshReturn {
  const { threshold = 80, maxPull = 150 } = options;
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (containerRef.current?.scrollTop === 0 && startY.current) {
        const diff = e.touches[0].clientY - startY.current;
        if (diff > 0) {
          const clamped = Math.min(diff, maxPull);
          setPullDistance(clamped);
          setPulling(clamped >= threshold);
        }
      }
    },
    [threshold, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pulling && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPulling(false);
      }
    } else {
      setPulling(false);
    }
    setPullDistance(0);
    startY.current = 0;
  }, [pulling, refreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, pulling, refreshing, pullDistance };
}
