interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

export function LineChart({
  data,
  color = '#3b82f6',
  height = 200,
  showTooltip = true,
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 1000;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values);

  const xScale = (index: number) =>
    padding.left + (index / (data.length - 1)) * innerWidth;
  const yScale = (value: number) =>
    padding.top + innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight;

  const points = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`).join(' ');

  const gradientId = `gradient-${color.replace('#', '')}`;

  const areaPath = `
    ${data.map((d, i) => (i === 0 ? 'M' : 'L') + `${xScale(i)},${yScale(d.value)}`).join(' ')}
    L ${xScale(data.length - 1)},${padding.top + innerHeight}
    L ${padding.left},${padding.top + innerHeight}
    Z
  `;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
        stroke="none"
      />

      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.map((d, i) => {
        const x = xScale(i);
        const y = yScale(d.value);

        return (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill={color} />
            {showTooltip && (
              <g>
                <rect
                  x={x - 30}
                  y={y - 35}
                  width={60}
                  height={25}
                  rx={4}
                  fill="#1e293b"
                  opacity="0.9"
                />
                <text
                  x={x}
                  y={y - 18}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={12}
                  fontWeight="bold"
                >
                  {d.value}
                </text>
              </g>
            )}
          </g>
        );
      })}

      <g className="text-xs fill-muted-foreground">
        <text x={padding.left / 2} y={padding.top} textAnchor="middle">
          {maxValue}
        </text>
        <text x={padding.left / 2} y={padding.top + innerHeight} textAnchor="middle">
          {minValue}
        </text>
      </g>

      <g className="text-xs fill-muted-foreground">
        {data.map((d, i) => {
          const x = xScale(i);
          const label = d.label || d.date.slice(5);
          return (
            <text
              key={i}
              x={x}
              y={padding.top + innerHeight + 20}
              textAnchor="middle"
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