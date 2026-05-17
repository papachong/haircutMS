'use client';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  showLabels?: boolean;
}

export function PieChart({ data, size = 200, showLabels = true }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const center = size / 2;
  const radius = (size / 2) * 0.8;
  const holeRadius = radius * 0.5;

  let currentAngle = -90; // Start from top

  const slices = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${center} ${center} Z`;

    // Donut inner hole path
    const innerX1 = center + holeRadius * Math.cos((startAngle * Math.PI) / 180);
    const innerY1 = center + holeRadius * Math.sin((startAngle * Math.PI) / 180);
    const innerX2 = center + holeRadius * Math.cos((endAngle * Math.PI) / 180);
    const innerY2 = center + holeRadius * Math.sin((endAngle * Math.PI) / 180);

    const donutPath = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${innerX2} ${innerY2} A ${holeRadius} ${holeRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1} Z`;

    currentAngle = endAngle;

    // Label position
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius * 0.7;
    const labelX = center + labelRadius * Math.cos((midAngle * Math.PI) / 180);
    const labelY = center + labelRadius * Math.sin((midAngle * Math.PI) / 180);

    const percentage = ((item.value / total) * 100).toFixed(1);

    return {
      donutPath,
      color: item.color,
      name: item.name,
      value: item.value,
      percentage,
      showLabel: parseFloat(percentage) > 5, // Only show label if slice > 5%
      labelX,
      labelY,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
          </filter>
        </defs>
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={slice.donutPath}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              filter="url(#shadow)"
              className="transition-transform hover:scale-105"
            />
            {showLabels && slice.showLabel && (
              <text
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={10}
                fontWeight="bold"
                className="pointer-events-none"
              >
                {slice.percentage}%
              </text>
            )}
          </g>
        ))}
        {/* Center total */}
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" fill="currentColor">
          <tspan x={center} dy="-5" fontSize={12} fontWeight="bold" className="fill-foreground">
            {total.toLocaleString()}
          </tspan>
          <tspan x={center} dy="16" fontSize={10} className="fill-muted-foreground">
            元
          </tspan>
        </text>
      </svg>

      {/* Legend */}
      {showLabels && (
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}