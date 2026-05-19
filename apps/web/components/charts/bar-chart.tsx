'use client';

import { useMemo } from 'react';
import { useChartTheme, getColorByIndex, type ChartTheme } from '@/lib/chart-theme';
import { getResponsiveDimensions } from '@/lib/chart-utils';

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: keyof ChartTheme['colors'];
  secondaryValue?: number;
}

export interface BarChartProps {
  data: BarChartDataPoint[];
  height?: number;
  showGrid?: boolean;
  showValues?: boolean;
  horizontal?: boolean;
  className?: string;
  barWidth?: number;
}

const DEFAULT_PADDING = { top: 20, right: 20, bottom: 60, left: 50 };

export function BarChart({
  data,
  height = 300,
  showGrid = true,
  showValues = true,
  horizontal = false,
  className = '',
  barWidth,
}: BarChartProps) {
  const theme = useChartTheme();
  const dimensions = getResponsiveDimensions();
  const chartWidth = dimensions.width;
  const chartHeight = height;

  const { bars, maxVal } = useMemo(() => {
    if (data.length === 0) {
      return { bars: [], maxVal: 0 };
    }

    const padding = DEFAULT_PADDING;
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const allValues = data.flatMap((d) => [d.value, d.secondaryValue ?? 0]);
    const maxVal = Math.max(...allValues) || 1;

    if (horizontal) {
      const barHeight = Math.min(40, (innerHeight / data.length) * 0.8);
      const gap = (innerHeight - barHeight * data.length) / (data.length + 1);

      const bars = data.map((d, i) => ({
        x: padding.left,
        y: padding.top + gap + i * (barHeight + gap),
        width: (d.value / maxVal) * innerWidth,
        height: barHeight,
        color: d.color ? theme.colors[d.color] : theme.colors.primary,
        label: d.label,
        value: d.value,
        secondaryValue: d.secondaryValue,
        index: i,
      }));

      return { bars, maxVal };
    }

    const calculatedBarWidth = barWidth ?? Math.min(60, (innerWidth / data.length) * 0.6);
    const gap = (innerWidth - calculatedBarWidth * data.length) / (data.length + 1);

    const bars = data.map((d, i) => ({
      x: padding.left + gap + i * (calculatedBarWidth + gap),
      y: padding.top + innerHeight - (d.value / maxVal) * innerHeight,
      width: calculatedBarWidth,
      height: (d.value / maxVal) * innerHeight,
      color: d.color ? theme.colors[d.color] : theme.colors.primary,
      label: d.label,
      value: d.value,
      secondaryValue: d.secondaryValue,
      index: i,
    }));

    return { bars, maxVal };
  }, [data, chartWidth, chartHeight, barWidth, horizontal, theme.colors]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <span className="text-sm text-muted-foreground">暂无数据</span>
      </div>
    );
  }

  const innerHeight = chartHeight - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom;
  const innerWidth = chartWidth - DEFAULT_PADDING.left - DEFAULT_PADDING.right;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className={`overflow-visible ${className}`}
    >
      {/* Grid lines */}
      {showGrid && (
        <>
          {/* Horizontal grid lines for vertical bars */}
          {!horizontal && [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = DEFAULT_PADDING.top + innerHeight * ratio;
            return (
              <line
                key={ratio}
                x1={DEFAULT_PADDING.left}
                y1={y}
                x2={DEFAULT_PADDING.left + innerWidth}
                y2={y}
                stroke={theme.grid}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            );
          })}
          {/* Vertical grid lines for horizontal bars */}
          {horizontal && [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const x = DEFAULT_PADDING.left + innerWidth * ratio;
            return (
              <line
                key={ratio}
                x1={x}
                y1={DEFAULT_PADDING.top}
                x2={x}
                y2={DEFAULT_PADDING.top + innerHeight}
                stroke={theme.grid}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            );
          })}
        </>
      )}

      {/* Y-axis labels (for vertical bars) */}
      {!horizontal && (
        <g className="text-xs">
          {[0, 0.5, 1].map((ratio) => {
            const value = maxVal * ratio;
            const y = DEFAULT_PADDING.top + innerHeight * (1 - ratio);
            return (
              <text
                key={ratio}
                x={DEFAULT_PADDING.left - 10}
                y={y + 4}
                textAnchor="end"
                fill={theme.text}
                className="fill-muted-foreground"
              >
                {value.toFixed(0)}
              </text>
            );
          })}
        </g>
      )}

      {/* X-axis labels (for horizontal bars) */}
      {horizontal && (
        <g className="text-xs">
          {[0, 0.5, 1].map((ratio) => {
            const value = maxVal * ratio;
            const x = DEFAULT_PADDING.left + innerWidth * ratio;
            return (
              <text
                key={ratio}
                x={x}
                y={DEFAULT_PADDING.top + innerHeight + 20}
                textAnchor="middle"
                fill={theme.text}
                className="fill-muted-foreground"
              >
                {value.toFixed(0)}
              </text>
            );
          })}
        </g>
      )}

      {/* Bars */}
      {bars.map((bar) => (
        <g key={bar.index}>
          {/* Secondary value bar (if present) */}
          {bar.secondaryValue !== undefined && !horizontal && (
            <rect
              x={bar.x}
              y={DEFAULT_PADDING.top + innerHeight - (bar.secondaryValue / maxVal) * innerHeight}
              width={bar.width}
              height={(bar.secondaryValue / maxVal) * innerHeight}
              fill={theme.colors.secondary}
              opacity={0.6}
              rx={4}
              className="transition-all"
            />
          )}

          {/* Main bar */}
          <rect
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            fill={bar.color}
            rx={4}
            className="transition-all hover:opacity-80"
          />

          {/* Value label */}
          {showValues && (
            <text
              x={horizontal ? bar.x + bar.width + 10 : bar.x + bar.width / 2}
              y={horizontal ? bar.y + bar.height / 2 + 4 : bar.y - 8}
              textAnchor={horizontal ? 'start' : 'middle'}
              fill={theme.text}
              fontSize={12}
              fontWeight="600"
              className="fill-muted-foreground"
            >
              {bar.value}
            </text>
          )}

          {/* Secondary value label (if present) */}
          {showValues && bar.secondaryValue !== undefined && !horizontal && (
            <text
              x={bar.x + bar.width / 2}
              y={DEFAULT_PADDING.top + innerHeight - (bar.secondaryValue / maxVal) * innerHeight - 8}
              textAnchor="middle"
              fill={theme.colors.secondary}
              fontSize={10}
              fontWeight="600"
            >
              {bar.secondaryValue}
            </text>
          )}

          {/* Axis label */}
          <text
            x={horizontal ? DEFAULT_PADDING.left - 10 : bar.x + bar.width / 2}
            y={horizontal ? bar.y + bar.height / 2 + 4 : DEFAULT_PADDING.top + innerHeight + 20}
            textAnchor={horizontal ? 'end' : 'middle'}
            fill={theme.text}
            fontSize={horizontal ? 12 : 11}
            className={`fill-muted-foreground ${horizontal ? 'max-w-[100px]' : ''}`}
          >
            {horizontal
              ? bar.label.slice(0, 15) + (bar.label.length > 15 ? '...' : '')
              : bar.label.slice(0, 6) + (bar.label.length > 6 ? '...' : '')}
          </text>
        </g>
      ))}
    </svg>
  );
}