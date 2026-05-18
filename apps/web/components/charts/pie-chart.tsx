'use client';

import { useMemo } from 'react';
import { useChartTheme, getColorByIndex, type ChartTheme } from '@/lib/chart-theme';
import { calculatePercentage, formatNumber } from '@/lib/chart-utils';

export interface PieChartDataPoint {
  label: string;
  value: number;
  color?: keyof ChartTheme['colors'];
}

export interface PieChartProps {
  data: PieChartDataPoint[];
  size?: number;
  donut?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  showPercentage?: boolean;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

export function PieChart({
  data,
  size = 200,
  donut = true,
  showLabels = true,
  showLegend = true,
  showPercentage = true,
  centerLabel,
  centerValue,
  className = '',
}: PieChartProps) {
  const theme = useChartTheme();

  const { slices, total, center } = useMemo(() => {
    if (data.length === 0) {
      return { slices: [], total: 0, center: size / 2 };
    }

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const center = size / 2;
    const radius = (size / 2) * 0.8;
    const holeRadius = donut ? radius * 0.5 : 0;

    let currentAngle = -90; // Start from top (12 o'clock)

    const slices = data.map((d, i) => {
      const percentage = calculatePercentage(d.value, total);
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      let pathData: string;
      if (donut) {
        // Donut chart path
        const innerX1 = center + holeRadius * Math.cos(startRad);
        const innerY1 = center + holeRadius * Math.sin(startRad);
        const innerX2 = center + holeRadius * Math.cos(endRad);
        const innerY2 = center + holeRadius * Math.sin(endRad);

        pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${innerX2} ${innerY2} A ${holeRadius} ${holeRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1} Z`;
      } else {
        // Pie chart path
        if (angle >= 360) {
          // Full circle
          pathData = `M ${center},${center - radius} A ${radius},${radius} 0 1,1 ${center},${center + radius} A ${radius},${radius} 0 1,1 ${center},${center - radius} Z`;
        } else {
          pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
        }
      }

      // Label position (for slices > 5%)
      const midAngle = (startAngle + endAngle) / 2;
      const labelRadius = donut ? radius * 0.7 : radius * 0.65;
      const labelX = center + labelRadius * Math.cos((midAngle * Math.PI) / 180);
      const labelY = center + labelRadius * Math.sin((midAngle * Math.PI) / 180);

      currentAngle = endAngle;

      return {
        pathData,
        color: d.color ? theme.colors[d.color] : getColorByIndex(theme, i),
        label: d.label,
        value: d.value,
        percentage: percentage.toFixed(1),
        showLabel: percentage > 5,
        labelX,
        labelY,
        index: i,
      };
    });

    return { slices, total, center };
  }, [data, size, donut, theme]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <span className="text-sm text-muted-foreground">暂无数据</span>
      </div>
    );
  }

  const holeRadius = donut ? (size / 2) * 0.5 : 0;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          <filter id="pie-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Slices */}
        {slices.map((slice) => (
          <g key={slice.index}>
            <path
              d={slice.pathData}
              fill={slice.color}
              stroke={theme.background}
              strokeWidth={2}
              filter="url(#pie-shadow)"
              className="transition-all duration-300 hover:opacity-80 hover:scale-[1.02]"
              style={{ transformOrigin: `${center}px ${center}px` }}
            />

            {/* Slice label */}
            {showLabels && slice.showLabel && (
              <text
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.background}
                fontSize={10}
                fontWeight="600"
                className="pointer-events-none"
              >
                {showPercentage ? `${slice.percentage}%` : slice.label}
              </text>
            )}
          </g>
        ))}

        {/* Center content for donut chart */}
        {donut && (centerLabel || centerValue) && (
          <g>
            {centerLabel && (
              <text
                x={center}
                y={center - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.text}
                fontSize={11}
                className="fill-muted-foreground"
              >
                {centerLabel}
              </text>
            )}
            {centerValue && (
              <text
                x={center}
                y={center + (centerLabel ? 14 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.colors.primary}
                fontSize={16}
                fontWeight="bold"
              >
                {centerValue}
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className={`mt-4 grid gap-x-6 gap-y-2 ${size < 180 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {slices.map((slice) => (
            <div key={slice.index} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: slice.color }}
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">{slice.label}</span>
                <span className="text-xs text-muted-foreground">
                  {showPercentage && `${slice.percentage}% · `}
                  {formatNumber(slice.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}