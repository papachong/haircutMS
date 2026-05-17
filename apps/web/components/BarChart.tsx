interface BarData {
  label: string;
  value: number;
  revenue?: number;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  barColor?: string;
  showRevenue?: boolean;
}

export function BarChart({
  data,
  height = 200,
  barColor = '#3b82f6',
  showRevenue = false,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        暂无数据
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 20, right: 20, bottom: 60, left: 50 };
  const chartWidth = 1000;
  const innerHeight = height - padding.top - padding.bottom;
  const innerWidth = chartWidth - padding.left - padding.right;
  const barWidth = Math.min(60, (innerWidth / data.length) * 0.6);
  const gap = (innerWidth - barWidth * data.length) / (data.length + 1);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} className="overflow-visible">
      <line
        x1={padding.left}
        y1={padding.top + innerHeight}
        x2={padding.left + innerWidth}
        y2={padding.top + innerHeight}
        stroke="#e2e8f0"
        strokeWidth={1}
      />

      {data.map((d, i) => {
        const x = padding.left + gap + i * (barWidth + gap);
        const barHeight = (d.value / maxValue) * innerHeight;
        const y = padding.top + innerHeight - barHeight;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={barColor}
              rx={4}
              className="transition-all"
            />

            <text
              x={x + barWidth / 2}
              y={y - 8}
              textAnchor="middle"
              fill="#64748b"
              fontSize={12}
              fontWeight="600"
            >
              {d.value}
            </text>

            <text
              x={x + barWidth / 2}
              y={padding.top + innerHeight + 20}
              textAnchor="middle"
              fill="#64748b"
              fontSize={11}
            >
              {d.label.length > 6 ? d.label.slice(0, 6) + '...' : d.label}
            </text>

            {showRevenue && d.revenue !== undefined && (
              <text
                x={x + barWidth / 2}
                y={padding.top + innerHeight + 38}
                textAnchor="middle"
                fill="#64748b"
                fontSize={10}
              >
                {(d.revenue / 100).toFixed(0)}元
              </text>
            )}
          </g>
        );
      })}

      <g className="text-xs fill-muted-foreground">
        <text x={padding.left - 10} y={padding.top} textAnchor="end">
          {maxValue}
        </text>
        <text x={padding.left - 10} y={padding.top + innerHeight} textAnchor="end">
          0
        </text>
      </g>
    </svg>
  );
}