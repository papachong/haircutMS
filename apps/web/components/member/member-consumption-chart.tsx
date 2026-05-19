'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { ConsumptionChartData } from '../../../lib/api/member-profile';

const BAR_COLORS = [
  '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1',
  '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#28255e',
];

interface ConsumptionChartProps {
  data: ConsumptionChartData;
}

export default function ConsumptionChart({ data }: ConsumptionChartProps) {
  const monthlyData = useMemo(() => {
    return data.monthlySpending.map((item) => ({
      ...item,
      amountYuan: item.amount / 100,
      label: item.month.slice(5), // "MM"
    }));
  }, [data.monthlySpending]);

  const dayOfWeekData = useMemo(() => {
    return data.visitFrequencyByDay.map((item) => ({
      ...item,
      label: item.dayLabel,
    }));
  }, [data.visitFrequencyByDay]);

  return (
    <div className="space-y-6">
      {/* Monthly Spending Trend */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">月度消费趋势</div>
          <div className="text-xs text-muted-foreground">
            会员均消 ¥{data.avgMemberSpending > 0 ? (data.avgMemberSpending / 100).toFixed(0) : '-'}
            {' / '}
            该会员均消 ¥{data.memberSpending > 0 ? (data.memberSpending / 100).toFixed(0) : '-'}
          </div>
        </div>
        {monthlyData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => `¥${v}`}
                />
                <Tooltip
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '消费金额']}
                  labelFormatter={(label: string) => `月份: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="amountYuan"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            暂无消费数据
          </div>
        )}
      </div>

      {/* Visit Frequency by Day of Week */}
      <div className="bg-card border rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-4">到店频率（按星期）</div>
        {dayOfWeekData.some((d) => d.count > 0) ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [value, '到店次数']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dayOfWeekData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            暂无到店数据
          </div>
        )}
      </div>
    </div>
  );
}
