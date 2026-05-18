/**
 * Chart Components Library
 *
 * A collection of responsive, theme-aware chart components for the dashboard.
 * All charts automatically adapt to the current theme (light/dark) and screen size.
 *
 * @example
 * ```tsx
 * import { LineChart, BarChart, PieChart } from '@/components/charts';
 *
 * const data = [
 *   { date: '2024-01-01', value: 100 },
 *   { date: '2024-01-02', value: 150 },
 * ];
 *
 * <LineChart data={data} />
 * ```
 */

export { LineChart } from './line-chart';
export type { LineChartDataPoint, LineChartProps } from './line-chart';

export { BarChart } from './bar-chart';
export type { BarChartDataPoint, BarChartProps } from './bar-chart';

export { PieChart } from './pie-chart';
export type { PieChartDataPoint, PieChartProps } from './pie-chart';

export { ThemeProvider, type ThemeProviderProps } from './theme-provider';