/**
 * Chart utility functions for data formatting and processing
 */

export type TimeUnit = 'day' | 'week' | 'month' | 'year';

export interface FormattedValue {
  value: string;
  unit: string;
  raw: number;
}

/**
 * Format currency value for display
 */
export function formatCurrency(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  return value.toFixed(0);
}

/**
 * Format number with appropriate suffix
 */
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format date label based on time unit
 */
export function formatDateLabel(date: string, unit: TimeUnit): string {
  const d = new Date(date);

  switch (unit) {
    case 'day':
      return `${d.getMonth() + 1}/${d.getDate()}`;
    case 'week':
      return `${d.getMonth() + 1}/${d.getDate()}`;
    case 'month':
      return `${d.getMonth() + 1}月`;
    case 'year':
      return `${d.getFullYear()}年`;
    default:
      return `${d.getMonth() + 1}/${d.getDate()}`;
  }
}

/**
 * Calculate percentage of value relative to total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Calculate growth rate between two values
 */
export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get growth direction and formatted value
 */
export function formatGrowth(current: number, previous: number): {
  value: string;
  isPositive: boolean;
  isNeutral: boolean;
} {
  const growth = calculateGrowth(current, previous);

  if (Math.abs(growth) < 0.1) {
    return { value: '0%', isPositive: false, isNeutral: true };
  }

  const isPositive = growth > 0;
  return {
    value: `${Math.abs(growth).toFixed(1)}%`,
    isPositive,
    isNeutral: false,
  };
}

/**
 * Aggregate data by time period
 */
export function aggregateByPeriod<T extends { date: string; value: number }>(
  data: T[],
  period: TimeUnit
): T[] {
  const grouped = new Map<string, { value: number; items: T[] }>();

  data.forEach((item) => {
    const date = new Date(item.date);
    let key: string;

    switch (period) {
      case 'day':
        key = item.date.slice(0, 10);
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = `${date.getFullYear()}`;
        break;
      default:
        key = item.date.slice(0, 10);
    }

    if (!grouped.has(key)) {
      grouped.set(key, { value: 0, items: [] });
    }
    grouped.get(key)!.value += item.value;
    grouped.get(key)!.items.push(item);
  });

  return Array.from(grouped.entries()).map(([key, { value }]) => ({
    date: key,
    value,
  })) as T[];
}

/**
 * Fill missing dates in data array with zero values
 */
export function fillMissingDates<T extends { date: string; value: number }>(
  data: T[],
  startDate: string,
  endDate: string,
  unit: TimeUnit
): T[] {
  const filled: T[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const dateMap = new Map(data.map((item) => [item.date, item]));

  const current = new Date(start);

  while (current <= end) {
    const dateKey = current.toISOString().slice(0, 10);
    const existing = dateMap.get(dateKey);

    filled.push(
      existing || ({ date: dateKey, value: 0 } as T)
    );

    // Increment based on unit
    switch (unit) {
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'year':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return filled;
}

/**
 * Get responsive dimensions based on screen size
 */
export function getResponsiveDimensions() {
  if (typeof window === 'undefined') {
    return { width: 1000, height: 300 };
  }

  const width = window.innerWidth;

  if (width < 640) {
    return { width: 600, height: 200 };
  }
  if (width < 768) {
    return { width: 700, height: 250 };
  }
  if (width < 1024) {
    return { width: 900, height: 280 };
  }

  return { width: 1000, height: 300 };
}

/**
 * Generate smooth bezier curve points for line chart
 */
export function generateSmoothPath(
  points: Array<{ x: number; y: number }>
): string {
  if (points.length < 2) return '';

  const first = points[0];
  let path = `M ${first.x} ${first.y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    if (i === 1) {
      path += ` L ${prev.x} ${prev.y}`;
    }

    // Cubic bezier curve
    const cp1x = prev.x + (curr.x - prev.x) * 0.5;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) * 0.5;
    const cp2y = curr.y;

    path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
  }

  return path;
}