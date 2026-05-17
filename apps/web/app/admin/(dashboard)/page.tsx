'use client';

import { useEffect, useState } from 'react';
import { getDashboardMetrics, getDashboardTrends, TimeRange } from '@/lib/api/dashboard';
import { LineChart } from '@/components/LineChart';
import { TrendingUp, TrendingDown, Users, DollarSign, Receipt, UserPlus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  unit?: string;
}

function MetricCard({ title, value, change, icon, unit = '' }: MetricCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {change >= 0 ? '+' : ''}
            {change}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
          <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
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

  const timeRangeOptions = [
    { value: TimeRange.TODAY as const, label: '今日' },
    { value: TimeRange.WEEK as const, label: '本周' },
    { value: TimeRange.MONTH as const, label: '本月' },
  ];

  const chartData = trends?.data?.map((d: any) => ({
    date: d.date,
    value: chartType === 'revenue' ? d.revenue : d.visitors,
    label: new Date(d.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
  })) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">数据看板</h1>
        <div className="flex gap-2">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="营业额"
              value={metrics?.revenue || 0}
              change={metrics?.revenueGrowth}
              icon={<DollarSign className="h-6 w-6 text-primary" />}
              unit="元"
            />
            <MetricCard
              title="客流量"
              value={metrics?.visitorCount || 0}
              icon={<Users className="h-6 w-6 text-primary" />}
              unit="人"
            />
            <MetricCard
              title="客单价"
              value={metrics?.averageTicket || 0}
              icon={<Receipt className="h-6 w-6 text-primary" />}
              unit="元"
            />
            <MetricCard
              title="新增会员"
              value={metrics?.newMembers || 0}
              icon={<UserPlus className="h-6 w-6 text-primary" />}
              unit="人"
            />
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">趋势分析</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('revenue')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    chartType === 'revenue'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  营业额
                </button>
                <button
                  onClick={() => setChartType('visitors')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    chartType === 'visitors'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  客流量
                </button>
              </div>
            </div>
            <LineChart data={chartData} color={chartType === 'revenue' ? '#3b82f6' : '#10b981'} />
          </div>
        </>
      )}
    </div>
  );
}