'use client';

import { useMemo } from 'react';
import { useChartTheme, getColorByIndex, type ChartTheme } from '@/lib/chart-theme';
import { getResponsiveDimensions, formatDateLabel } from '@/lib/chart-utils';

export interface LineChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface LineChartProps {
  data: LineChartDataPoint[];
  height?: number;
  showTooltip?: boolean;
  showGrid?: boolean;
  showArea?: boolean;
  smooth?: boolean;
  color?: keyof ChartTheme['colors'];
  timeUnit?: 'day' | 'week' | 'month' | 'year';
  className?: string;
}

const DEFAULT_PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

export function LineChart({
  data,
  height = 300,
  showTooltip = true,
  showGrid = true,
  showArea = true,
  smooth = true,
  color = 'primary',
  timeUnit = 'day',
  className = '',
}: LineChartProps) {
  const theme = useChartTheme();
  const dimensions = getResponsiveDimensions();
  const chartWidth = dimensions.width;
  const chartHeight = height;

  const { points, areaPath, linePath, xScale, yScale, minVal, maxVal } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], areaPath: '', linePath: '', xScale: () => 0, yScale: () => 0, minVal: 0, maxVal: 0 };
    }

    const padding = DEFAULT_PADDING;
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values) || 1;
    const valueRange = maxVal - minVal || 1;

    const xScale = (index: number) => {
      if (data.length <= 1) return padding.left + innerWidth / 2;
      return padding.left + (index / (data.length - 1)) * innerWidth;
    };

    const yScale = (value: number) => {
      return padding.top + innerHeight - ((value - minVal) / valueRange) * innerHeight;
    };

    const points = data.map((d, i) => ({
      x: xScale(i),
      y: yScale(d.value),
      data: d,
      index: i,
    }));

    // Generate smooth bezier path or straight line
    let linePath = '';
    if (smooth && points.length > 2) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y;
        const cp2x = prev.x + (curr.x - prev.x) * 0.5;
        const cp2y = curr.y;
        linePath += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
      }
    } else {
      linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`).join(' ');
    }

    // Area path for gradient fill
    const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0},${padding.top + innerHeight} L ${padding.left},${padding.top + innerHeight} Z`;

    return { points, areaPath, linePath, xScale, yScale, minVal, maxVal };
  }, [data, chartWidth, chartHeight]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <span className="text-sm text-muted-foreground">暂无数据</span>
      </div>
    );
  }

  const mainColor = theme.colors[color];
  const gradientId = `line-gradient-${color}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className={`overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={mainColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={mainColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {showGrid && (
        <>
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = DEFAULT_PADDING.top + (chartHeight - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom) * ratio;
            return (
              <line
                key={ratio}
                x1={DEFAULT_PADDING.left}
                y1={y}
                x2={DEFAULT_PADDING.left + chartWidth - DEFAULT_PADDING.left - DEFAULT_PADDING.right}
                y2={y}
                stroke={theme.grid}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            );
          })}
        </>
      )}

      {/* Y-axis labels */}
      <g className="text-xs">
        {[0, 0.5, 1].map((ratio) => {
          const value = minVal + (maxVal - minVal) * ratio;
          const y = DEFAULT_PADDING.top + (chartHeight - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom) * (1 - ratio);
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

      {/* Area fill */}
      {showArea && (
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      )}

      {/* Line */}
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke={mainColor}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p) => (
        <g key={p.index}>
          {/* Outer circle for hover effect */}
          <circle cx={p.x} cy={p.y} r={8} fill={mainColor} opacity="0" className="transition-opacity hover:opacity-0.2" />
          {/* Inner circle */}
          <circle cx={p.x} cy={p.y} r={4} fill={mainColor} stroke={theme.background} strokeWidth={2} />
        </g>
      ))}

      {/* Tooltips */}
      {showTooltip && points.map((p) => (
        <g key={`tooltip-${p.index}`} opacity="0" className="group-hover:opacity-100 transition-opacity">
          <rect
            x={p.x - 35}
            y={p.y - 35}
            width={70}
            height={28}
            rx={4}
            fill={theme.tooltip}
            className="filter drop-shadow-lg"
          />
          <text
            x={p.x}
            y={p.y - 16}
            textAnchor="middle"
            fill={theme.tooltipText}
            fontSize={12}
            fontWeight="bold"
          >
            {p.data.value}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      <g className="text-xs">
        {points.filter((_, i) => {
          // Show fewer labels on mobile
          const step = chartWidth < 700 ? Math.ceil(points.length / 4) : Math.ceil(points.length / 6);
          return i % step === 0;
        }).map((p) => {
          const label = p.data.label || formatDateLabel(p.data.date, timeUnit);
          return (
            <text
              key={p.index}
              x={p.x}
              y={DEFAULT_PADDING.top + chartHeight - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom + 20}
              textAnchor="middle"
              fill={theme.text}
              className="fill-muted-foreground"
            >
              {label}
            </text>
          );
        })}
      </g>
    </svg>
  );
}