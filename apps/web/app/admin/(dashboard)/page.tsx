'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getDashboardMetrics, getDashboardTrends, TimeRange } from '@/lib/api/dashboard';
import { getRevenueBreakdown, getServiceRanking } from '@/lib/api/analytics';
import { LineChart } from '@/components/LineChart';
import { BarChart } from '@/components/BarChart';
import { useDashboardSocket } from '@/hooks/use-dashboard-socket';
import {
  NotificationToast,
  LARGE_ORDER_THRESHOLD,
} from '@/components/dashboard/notification-toast';
import type { DashboardNotification } from '@/components/dashboard/notification-toast';
import { ConnectionStatusIndicator } from '@/components/dashboard/connection-status';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Receipt,
  UserPlus,
  Calendar,
  CreditCard,
  Wallet,
  Trophy,
  ChevronDown,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  unit?: string;
  color?: string;
  isAnimating?: boolean;
}

function MetricCard({ title, value, change, icon, unit = '', color = 'bg-primary/10', isAnimating = false }: MetricCardProps) {
  return (
    <div className={`rounded-xl border bg-card p-4 sm:p-6 transition-all duration-300 ${
      isAnimating ? 'ring-2 ring-primary/40 shadow-lg scale-[1.02]' : 'hover:shadow-md'
    }`}>
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs sm:text-sm font-medium ${
              change >= 0
                ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400'
                : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
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
        <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
          <span className="ml-1 text-xs sm:text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
      </div>
    </div>
  );
}

interface ServiceRankingItem {
  id: string;
  name: string;
  count: number;
  amount: number;
  averagePrice: number;
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.TODAY);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, number | string | undefined> | null>(null);
  const [trends, setTrends] = useState<{ data: Array<{ date: string; revenue: number; visitors: number }> } | null>(null);
  const [ranking, setRanking] = useState<ServiceRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'revenue' | 'visitors'>('revenue');
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [animatingMetrics, setAnimatingMetrics] = useState(false);
  const animatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params: { timeRange: TimeRange; startDate?: string; endDate?: string } = { timeRange };
      if (timeRange === TimeRange.CUSTOM && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const [metricsData, trendsData, rankingData] = await Promise.all([
        getDashboardMetrics(params.timeRange, params.startDate, params.endDate),
        getDashboardTrends(params.timeRange, params.startDate, params.endDate),
        getServiceRanking(params.timeRange, params.startDate, params.endDate, 5),
      ]);
      setMetrics(metricsData as unknown as Record<string, number | string | undefined>);
      setTrends(trendsData);
      setRanking(rankingData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, customStart, customEnd]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const addNotification = useCallback((notification: Omit<DashboardNotification, 'id' | 'timestamp'>) => {
    const fullNotification: DashboardNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    };
    setNotifications((prev) => [...prev.slice(-4), fullNotification]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const triggerMetricsAnimation = useCallback(() => {
    setAnimatingMetrics(true);
    if (animatingTimerRef.current) {
      clearTimeout(animatingTimerRef.current);
    }
    animatingTimerRef.current = setTimeout(() => setAnimatingMetrics(false), 1500);
  }, []);

  const handleMetricsUpdate = useCallback(() => {
    loadDashboard();
    triggerMetricsAnimation();
  }, [loadDashboard, triggerMetricsAnimation]);

  const handleNewOrder = useCallback(
    (data: { orderId: string; orderNo: string; timestamp: string }) => {
      addNotification({
        type: 'order-settled',
        title: '新订单结算',
        message: `订单 ${data.orderNo} 已完成结算`,
      });
    },
    [addNotification],
  );

  const handleMemberRecharge = useCallback(
    (data: { memberId: string; memberName: string; amount: number; timestamp: string }) => {
      addNotification({
        type: 'member-recharge',
        title: '会员充值',
        message: `${data.memberName} 充值 ¥${data.amount.toLocaleString()}`,
        amount: data.amount,
      });

      if (data.amount >= LARGE_ORDER_THRESHOLD) {
        addNotification({
          type: 'large-order',
          title: '大额充值提醒',
          message: `${data.memberName} 充值 ¥${(data.amount / 100).toLocaleString()}`,
          amount: data.amount,
        });
      }
    },
    [addNotification],
  );

  const { connectionStatus, reconnect } = useDashboardSocket({
    onMetricsUpdate: handleMetricsUpdate,
    onNewOrder: handleNewOrder,
    onMemberRecharge: handleMemberRecharge,
    enabled: true,
  });

  // Fallback: poll every 30 seconds when disconnected
  useEffect(() => {
    if (connectionStatus !== 'disconnected') return;

    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [connectionStatus, loadDashboard]);

  const timeRangeOptions = [
    { value: TimeRange.TODAY as const, label: '今日' },
    { value: TimeRange.WEEK as const, label: '本周' },
    { value: TimeRange.MONTH as const, label: '本月' },
  ];

  const chartData =
    trends?.data?.map((d) => ({
      date: d.date,
      value: chartType === 'revenue' ? d.revenue : d.visitors,
      label: new Date(d.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    })) || [];

  const rankingBarData = ranking.map((item) => ({
    label: item.name,
    value: item.count,
    revenue: item.amount,
  }));

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
  const displayRevenue = revenueValue >= 10000
    ? `${(revenueValue / 10000).toFixed(1)}`
    : revenueValue;
  const revenueUnit = revenueValue >= 10000 ? '万元' : '元';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Notification toasts */}
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />

      {/* Header with time range selector and connection status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">数据看板</h1>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">实时查看门店经营数据</p>
          </div>
          <ConnectionStatusIndicator status={connectionStatus} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimeRangeSelect(option.value)}
                className={`rounded-md px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  timeRange === option.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                timeRange === TimeRange.CUSTOM
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              自定义
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom date range picker */}
      {showCustom && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground">开始日期</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground">结束日期</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            应用
          </button>
        </div>
      )}

      {loading && !metrics ? (
        <div className="flex h-64 sm:h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 4 Core metric cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="营业额"
              value={displayRevenue}
              change={metrics?.revenueGrowth as number | undefined}
              icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />}
              unit={revenueUnit}
              color="bg-blue-500/10"
              isAnimating={animatingMetrics}
            />
            <MetricCard
              title="客流量"
              value={(metrics?.visitorCount as number) || 0}
              icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />}
              unit="人"
              color="bg-emerald-500/10"
              isAnimating={animatingMetrics}
            />
            <MetricCard
              title="客单价"
              value={(metrics?.averageTicket as number) || 0}
              icon={<Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />}
              unit="元"
              color="bg-amber-500/10"
              isAnimating={animatingMetrics}
            />
            <MetricCard
              title="新增会员"
              value={(metrics?.newMembers as number) || 0}
              icon={<UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />}
              unit="人"
              color="bg-purple-500/10"
              isAnimating={animatingMetrics}
            />
          </div>

          {/* Trend chart */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold">趋势分析</h2>
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setChartType('revenue')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    chartType === 'revenue'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  营业额
                </button>
                <button
                  onClick={() => setChartType('visitors')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    chartType === 'visitors'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
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

          {/* Service ranking */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-semibold">热门服务 TOP 5</h2>
            </div>
            {rankingBarData.length > 0 ? (
              <div className="h-64">
                <BarChart data={rankingBarData} showRevenue />
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                暂无数据
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
