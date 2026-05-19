'use client';

export function useHaptic() {
  const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const lightTap = () => vibrate(10);
  const mediumTap = () => vibrate(25);
  const heavyTap = () => vibrate(50);
  const success = () => vibrate([10, 50, 20]);
  const error = () => vibrate([50, 30, 50, 30, 50]);

  return { vibrate, lightTap, mediumTap, heavyTap, success, error };
}
