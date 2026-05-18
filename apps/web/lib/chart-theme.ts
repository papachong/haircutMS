'use client';

import { useTheme } from 'next-themes';

export interface ChartTheme {
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    quinary: string;
    senary: string;
    septenary: string;
    octonary: string;
  };
  background: string;
  text: string;
  grid: string;
  tooltip: string;
  tooltipText: string;
}

export const LIGHT_THEME: ChartTheme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#ef4444',
    quinary: '#8b5cf6',
    senary: '#ec4899',
    septenary: '#06b6d4',
    octonary: '#84cc16',
  },
  background: '#ffffff',
  text: '#64748b',
  grid: '#e2e8f0',
  tooltip: '#1e293b',
  tooltipText: '#ffffff',
};

export const DARK_THEME: ChartTheme = {
  colors: {
    primary: '#60a5fa',
    secondary: '#34d399',
    tertiary: '#fbbf24',
    quaternary: '#f87171',
    quinary: '#a78bfa',
    senary: '#f472b6',
    septenary: '#22d3ee',
    octonary: '#a3e635',
  },
  background: '#0f172a',
  text: '#94a3b8',
  grid: '#1e293b',
  tooltip: '#1e293b',
  tooltipText: '#ffffff',
};

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? DARK_THEME : LIGHT_THEME;
}

export function getColorByIndex(theme: ChartTheme, index: number): string {
  const colors = Object.values(theme.colors);
  return colors[index % colors.length];
}