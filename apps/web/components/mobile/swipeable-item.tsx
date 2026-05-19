'use client';

import { useRef, useState, useCallback } from 'react';

interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    label: string;
    color: string;
    icon?: React.ReactNode;
  };
  rightAction?: {
    label: string;
    color: string;
    icon?: React.ReactNode;
  };
  threshold?: number;
}

export default function SwipeableItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 80,
}: SwipeableItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    directionLocked.current = null;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      // Lock direction on first significant movement
      if (!directionLocked.current) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          directionLocked.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        }
        return;
      }

      if (directionLocked.current === 'vertical') {
        return;
      }

      // Only allow swipe in directions with actions
      let clampedDx = dx;
      if (dx > 0 && !rightAction) {
        clampedDx = 0;
      }
      if (dx < 0 && !leftAction) {
        clampedDx = 0;
      }

      // Dampen beyond threshold
      const maxOffset = 120;
      clampedDx = Math.max(-maxOffset, Math.min(maxOffset, clampedDx));

      setOffsetX(clampedDx);
    },
    [leftAction, rightAction]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    if (offsetX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (offsetX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setOffsetX(0);
    setIsDragging(false);
    directionLocked.current = null;
  }, [offsetX, threshold, onSwipeLeft, onSwipeRight, isDragging]);

  const hasLeft = !!leftAction;
  const hasRight = !!rightAction;

  return (
    <div className="relative overflow-hidden rounded-2xl" ref={containerRef}>
      {/* Right action background (revealed on swipe left) */}
      {hasLeft && leftAction && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 gap-3"
          style={{ width: '100%' }}
        >
          <div
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: leftAction.color }}
          >
            {leftAction.icon}
            {leftAction.label}
          </div>
        </div>
      )}

      {/* Left action background (revealed on swipe right) */}
      {hasRight && rightAction && (
        <div
          className="absolute inset-y-0 left-0 flex items-center pl-4 gap-3"
          style={{ width: '100%' }}
        >
          <div
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: rightAction.color }}
          >
            {rightAction.icon}
            {rightAction.label}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 bg-white dark:bg-slate-800 transition-transform"
        style={{
          transform: isDragging ? `translateX(${offsetX}px)` : 'translateX(0)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
