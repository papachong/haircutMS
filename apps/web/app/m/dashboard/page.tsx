'use client';

import { useEffect, useState, useCallback } from 'react';
import { getDashboardMetrics, getDashboardTrends, TimeRange } from '@/lib/api/dashboard';
import { LineChart } from '@/components/LineChart';
import {
  DollarSign,
  Users,
  Receipt,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { usePullRefresh } from '@/hooks/use-pull-refresh';
import PullRefreshIndicator from '@/components/mobile/pull-refresh-indicator';

interface MetricItemProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  unit?: string;
  accentColor: string;
}

function MetricItem({ title, value, change, icon, unit = '', accentColor }: MetricItemProps) {
  return (
    <div className="rounded-xl border bg-card p-3 active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between mb-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentColor}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              change >= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change >= 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-0.5 text-lg font-bold tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

export default function MobileDashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.TODAY);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, number | string | undefined> | null>(null);
  const [trends, setTrends] = useState<{ data: Array<{ date: string; revenue: number; visitors: number }> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'revenue' | 'visitors'>('revenue');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params: { timeRange: TimeRange; startDate?: string; endDate?: string } = { timeRange };
      if (timeRange === TimeRange.CUSTOM && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const [metricsData, trendsData] = await Promise.all([
        getDashboardMetrics(params.timeRange, params.startDate, params.endDate),
        getDashboardTrends(params.timeRange, params.startDate, params.endDate),
      ]);
      setMetrics(metricsData as unknown as Record<string, number | string | undefined>);
      setTrends(trendsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, customStart, customEnd]);

  // Pull-to-refresh
  const { containerRef, pulling, refreshing, pullDistance } = usePullRefresh(
    async () => {
      await loadDashboard();
    }
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const timeRangeOptions = [
    { value: TimeRange.TODAY as const, label: '今日' },
    { value: TimeRange.WEEK as const, label: '本周' },
    { value: TimeRange.MONTH as const, label: '本月' },
  ];

  const chartData =
    trends?.data?.map((d) => ({
      date: d.date,
      value: chartType === 'revenue' ? d.revenue : d.visitors,
      label: new Date(d.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
    })) || [];

  const handleTimeRangeSelect = (value: TimeRange) => {
    setTimeRange(value);
    if (value !== TimeRange.CUSTOM) {
      setShowCustom(false);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      setTimeRange(TimeRange.CUSTOM);
      setShowCustom(false);
    }
  };

  const revenueValue = (metrics?.revenue as number) || 0;

  return (
    <div
      ref={containerRef}
      className="min-h-screen overflow-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull-to-refresh indicator */}
      <PullRefreshIndicator
        pulling={pulling}
        refreshing={refreshing}
        pullDistance={pullDistance}
      />

      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">数据看板</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDashboard()}
              className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeRangeSelect(option.value)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                    timeRange === option.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustom(!showCustom)}
                className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                  timeRange === TimeRange.CUSTOM
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Custom date range picker */}
        {showCustom && (
          <div className="flex items-end gap-2 rounded-xl border bg-card p-3">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-muted-foreground">开始</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="mt-0.5 w-full rounded border bg-background px-2 py-2 text-xs min-h-[36px]"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-muted-foreground">结束</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="mt-0.5 w-full rounded border bg-background px-2 py-2 text-xs min-h-[36px]"
              />
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
              className="rounded bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50 min-h-[36px]"
            >
              确定
            </button>
          </div>
        )}

        {loading && !metrics ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 4 compact metric cards in 2x2 grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetricItem
                title="营业额"
                value={revenueValue}
                change={metrics?.revenueGrowth as number | undefined}
                icon={<DollarSign className="h-4 w-4 text-blue-500" />}
                unit="元"
                accentColor="bg-blue-500/10"
              />
              <MetricItem
                title="客流量"
                value={(metrics?.visitorCount as number) || 0}
                icon={<Users className="h-4 w-4 text-emerald-500" />}
                unit="人"
                accentColor="bg-emerald-500/10"
              />
              <MetricItem
                title="客单价"
                value={(metrics?.averageTicket as number) || 0}
                icon={<Receipt className="h-4 w-4 text-amber-500" />}
                unit="元"
                accentColor="bg-amber-500/10"
              />
              <MetricItem
                title="新增会员"
                value={(metrics?.newMembers as number) || 0}
                icon={<UserPlus className="h-4 w-4 text-purple-500" />}
                unit="人"
                accentColor="bg-purple-500/10"
              />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href="/m/pos"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 active:scale-[0.97] transition-transform min-h-[72px] justify-center"
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-xs font-bold">收银</span>
              </a>
              <a
                href="/m/members"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/20 active:scale-[0.97] transition-transform min-h-[72px] justify-center"
              >
                <Users className="h-5 w-5" />
                <span className="text-xs font-bold">会员</span>
              </a>
              <a
                href="/m/orders"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 active:scale-[0.97] transition-transform min-h-[72px] justify-center"
              >
                <Receipt className="h-5 w-5" />
                <span className="text-xs font-bold">订单</span>
              </a>
            </div>

            {/* Trend chart */}
            <div className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">近7日趋势</h2>
                <div className="flex gap-1 rounded-md bg-muted p-0.5">
                  <button
                    onClick={() => setChartType('revenue')}
                    className={`rounded px-2 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                      chartType === 'revenue'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    营业额
                  </button>
                  <button
                    onClick={() => setChartType('visitors')}
                    className={`rounded px-2 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                      chartType === 'visitors'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    客流
                  </button>
                </div>
              </div>
              <div className="h-44">
                {chartData.length > 0 ? (
                  <LineChart data={chartData} height={176} color={chartType === 'revenue' ? '#3b82f6' : '#10b981'} />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    暂无数据
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
