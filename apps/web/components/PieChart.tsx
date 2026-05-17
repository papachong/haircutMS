interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export function PieChart({
  data,
  size = 200,
  showLegend = true,
  showPercentage = true,
}: PieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 10;

  let currentAngle = -90;
  const paths = data.map((d, i) => {
    const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
    const percentage = total > 0 ? (d.value / total) * 100 : 0;
    const angle = (percentage / 100) * 360;

    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathData =
      angle >= 360
        ? `M ${centerX},${centerY - radius}
           A ${radius},${radius} 0 1,1 ${centerX},${centerY + radius}
           A ${radius},${radius} 0 1,1 ${centerX},${centerY - radius}
           Z`
        : `M ${centerX},${centerY}
           L ${x1},${y1}
           A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2}
           Z`;

    currentAngle = endAngle;

    return {
      pathData,
      color,
      percentage,
      label: d.label,
      value: d.value,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((p, i) => (
          <path key={i} d={p.pathData} fill={p.color} stroke="#fff" strokeWidth={2} />
        ))}
      </svg>

      {showLegend && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {paths.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-xs text-muted-foreground">
                {p.label}
                {showPercentage && ` (${p.percentage.toFixed(1)}%)`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}