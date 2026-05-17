'use client';

import { useEffect, useState } from 'react';
import { getDashboardMetrics, getDashboardTrends, TimeRange } from '@/lib/api/dashboard';
import { TrendingUp, TrendingDown, Users, DollarSign, Receipt, UserPlus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  unit?: string;
}

function MobileMetricCard({ title, value, change, icon, unit = '' }: MetricCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change >= 0 ? '+' : ''}
            {change}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
          <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function MobileDashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.TODAY);
  const [metrics, setMetrics] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'revenue' | 'visitors'>('revenue');

  useEffect(() => {
    loadDashboard();
  }, [timeRange]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [metricsData, trendsData] = await Promise.all([
        getDashboardMetrics(timeRange),
        getDashboardTrends(timeRange),
      ]);
      setMetrics(metricsData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const chartData = trends?.data?.map((d: any) => ({
    date: d.date,
    value: chartType === 'revenue' ? d.revenue : d.visitors,
    label: new Date(d.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
  })) || [];

  const maxValue = Math.max(...chartData.map((d: any) => d.value), 1);
  const minValue = 0;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">数据看板</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="rounded-lg border bg-card px-3 py-2 text-sm font-medium"
        >
          <option value={TimeRange.TODAY}>今日</option>
          <option value={TimeRange.WEEK}>本周</option>
          <option value={TimeRange.MONTH}>本月</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <MobileMetricCard
              title="营业额"
              value={metrics?.revenue || 0}
              change={metrics?.revenueGrowth}
              icon={<DollarSign className="h-5 w-5 text-primary" />}
              unit="元"
            />
            <MobileMetricCard
              title="客流量"
              value={metrics?.visitorCount || 0}
              icon={<Users className="h-5 w-5 text-primary" />}
              unit="人"
            />
            <MobileMetricCard
              title="客单价"
              value={metrics?.averageTicket || 0}
              icon={<Receipt className="h-5 w-5 text-primary" />}
              unit="元"
            />
            <MobileMetricCard
              title="新增会员"
              value={metrics?.newMembers || 0}
              icon={<UserPlus className="h-5 w-5 text-primary" />}
              unit="人"
            />
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">趋势分析</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('revenue')}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    chartType === 'revenue'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  营业额
                </button>
                <button
                  onClick={() => setChartType('visitors')}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    chartType === 'visitors'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  客流量
                </button>
              </div>
            </div>

            <div className="h-48 relative">
              {chartData.length > 0 ? (
                <svg width="100%" height="100%" viewBox="0 0 300 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mobileGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={chartType === 'revenue' ? '#3b82f6' : '#10b981'} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={chartType === 'revenue' ? '#3b82f6' : '#10b981'} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <path
                    d={`
                      M 0,${150 - ((chartData[0].value - minValue) / (maxValue - minValue)) * 140}
                      ${chartData.map((d: any, i: number) =>
                        i === 0
                          ? ''
                          : ` L ${i * (280 / (chartData.length - 1))},${150 - ((d.value - minValue) / (maxValue - minValue)) * 140}`
                      ).join('')}
                      L 280,150 L 0,150 Z
                    `}
                    fill="url(#mobileGradient)"
                    stroke="none"
                  />

                  <polyline
                    points={chartData.map((d: any, i: number) =>
                      `${i * (280 / (chartData.length - 1))},${150 - ((d.value - minValue) / (maxValue - minValue)) * 140}`
                    ).join(' ')}
                    fill="none"
                    stroke={chartType === 'revenue' ? '#3b82f6' : '#10b981'}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {chartData.map((d: any, i: number) => {
                    const x = i * (280 / (chartData.length - 1));
                    const y = 150 - ((d.value - minValue) / (maxValue - minValue)) * 140;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r={3} fill={chartType === 'revenue' ? '#3b82f6' : '#10b981'} />
                        {i === chartData.length - 1 && (
                          <rect x={x - 20} y={y - 25} width={40} height={18} rx={3} fill="#1e293b" opacity="0.9" />
                          <text x={x} y={y - 12} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold">
                            {d.value}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}