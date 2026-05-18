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
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            {change >= 0 ? '+' : ''}
            {change}%
          </div>
        )}
      </div>
      <div className="mt-3 sm:mt-4">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
          <span className="ml-1 text-xs sm:text-sm font-normal text-muted-foreground">{unit}</span>
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">数据看板</h1>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium transition-colors whitespace-nowrap ${
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
        <div className="flex h-64 sm:h-96 items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
            <MetricCard
              title="营业额"
              value={metrics?.revenue || 0}
              change={metrics?.revenueGrowth}
              icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
              unit="元"
            />
            <MetricCard
              title="客流量"
              value={metrics?.visitorCount || 0}
              icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
              unit="人"
            />
            <MetricCard
              title="客单价"
              value={metrics?.averageTicket || 0}
              icon={<Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
              unit="元"
            />
            <MetricCard
              title="新增会员"
              value={metrics?.newMembers || 0}
              icon={<UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
              unit="人"
            />
          </div>

          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold">趋势分析</h2>
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
            <div className="min-h-[200px] sm:min-h-[300px]">
              <LineChart data={chartData} color={chartType === 'revenue' ? '#3b82f6' : '#10b981'} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}