'use client';

import { useEffect, useState, useCallback } from 'react';
import { TimeRange } from '@/lib/api/dashboard';
import {
  getRevenueBreakdown,
  getServiceRanking,
  type RevenueBreakdown,
  type ServiceItemRanking,
} from '@/lib/api/analytics';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Calendar,
  ChevronDown,
  DollarSign,
  CreditCard,
  Wallet,
  Ticket,
  Trophy,
  ArrowUpDown,
  TrendingUp,
  Download,
} from 'lucide-react';
import { exportRevenueReport } from '@/lib/api/export';

const PAYMENT_COLORS: Record<string, string> = {
  offline: '#3b82f6',
  balance: '#10b981',
  passCard: '#f59e0b',
  recharge: '#8b5cf6',
};

const PAYMENT_LABELS: Record<string, string> = {
  offline: '线下支付',
  balance: '余额支付',
  passCard: '次卡支付',
  recharge: '充值收入',
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function MetricCard({ title, value, icon, color, subtitle }: MetricCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-xl font-bold tracking-tight">
            {value.toLocaleString()}
            <span className="ml-1 text-xs font-normal text-muted-foreground">元</span>
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

type SortField = 'count' | 'amount';
type SortOrder = 'asc' | 'desc';

export default function RevenueAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.TODAY);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [breakdown, setBreakdown] = useState<RevenueBreakdown | null>(null);
  const [ranking, setRanking] = useState<ServiceItemRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { timeRange: TimeRange; startDate?: string; endDate?: string } = { timeRange };
      if (timeRange === TimeRange.CUSTOM && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const [breakdownData, rankingData] = await Promise.all([
        getRevenueBreakdown(params.timeRange, params.startDate, params.endDate),
        getServiceRanking(params.timeRange, params.startDate, params.endDate, 20),
      ]);
      setBreakdown(breakdownData);
      setRanking(rankingData);
    } catch (error) {
      console.error('Failed to load revenue analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const timeRangeOptions = [
    { value: TimeRange.TODAY as const, label: '今日' },
    { value: TimeRange.WEEK as const, label: '本周' },
    { value: TimeRange.MONTH as const, label: '本月' },
  ];

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Pie chart data: payment method composition
  const composition = breakdown?.composition;
  const pieData = composition
    ? [
        { name: PAYMENT_LABELS.offline, value: composition.offline, key: 'offline' },
        { name: PAYMENT_LABELS.balance, value: composition.balance, key: 'balance' },
        { name: PAYMENT_LABELS.passCard, value: composition.passCard, key: 'passCard' },
      ].filter((d) => d.value > 0)
    : [];

  const totalConsume = breakdown
    ? breakdown.composition.offline + breakdown.composition.balance + breakdown.composition.passCard
    : 0;

  // Bar chart data for service ranking
  const barData = ranking
    .slice()
    .sort((a, b) => {
      const diff = sortField === 'count' ? a.count - b.count : a.amount - b.amount;
      return sortOrder === 'asc' ? diff : -diff;
    })
    .slice(0, 10)
    .map((item) => ({
      name: item.name.length > 6 ? item.name.slice(0, 6) + '...' : item.name,
      fullName: item.name,
      消费次数: item.count,
      收入金额: item.amount,
    }));

  // Sorted ranking for table
  const sortedRanking = [...ranking].sort((a, b) => {
    const diff = sortField === 'count' ? a.count - b.count : a.amount - b.amount;
    return sortOrder === 'asc' ? diff : -diff;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    const isActive = sortField === field;
    return (
      <ArrowUpDown
        className={`h-3.5 w-3.5 inline-block ml-1 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`}
      />
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const effectiveStart = timeRange === TimeRange.CUSTOM ? customStart : undefined;
      const effectiveEnd = timeRange === TimeRange.CUSTOM ? customEnd : undefined;
      await exportRevenueReport('xlsx', effectiveStart, effectiveEnd);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`导出失败: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">收入分析</h1>
          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
            收入构成与项目排行分析
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-md hover:bg-accent transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? '导出中...' : '导出报表'}</span>
          </button>
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

      {loading ? (
        <div className="flex h-64 sm:h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="当期充值收入"
              value={breakdown?.rechargeIncome || 0}
              icon={<CreditCard className="h-5 w-5 text-white" />}
              color="bg-purple-500"
            />
            <MetricCard
              title="当期消费收入"
              value={breakdown?.consumeIncome || 0}
              icon={<DollarSign className="h-5 w-5 text-white" />}
              color="bg-blue-500"
              subtitle={
                breakdown && breakdown.consumeIncome > 0
                  ? `充值/消费比: ${((breakdown.rechargeIncome / breakdown.consumeIncome) * 100).toFixed(1)}%`
                  : undefined
              }
            />
            <MetricCard
              title="线下支付"
              value={breakdown?.composition.offline || 0}
              icon={<Wallet className="h-5 w-5 text-white" />}
              color="bg-blue-500/80"
              subtitle={
                totalConsume > 0
                  ? `占比: ${(((breakdown?.composition.offline || 0) / totalConsume) * 100).toFixed(1)}%`
                  : undefined
              }
            />
            <MetricCard
              title="余额支付"
              value={breakdown?.composition.balance || 0}
              icon={<Ticket className="h-5 w-5 text-white" />}
              color="bg-emerald-500"
              subtitle={
                totalConsume > 0
                  ? `占比: ${(((breakdown?.composition.balance || 0) / totalConsume) * 100).toFixed(1)}%`
                  : undefined
              }
            />
          </div>

          {/* Charts row: Pie + Bar */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Payment composition pie chart */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold">支付方式占比</h2>
                <span className="text-xs text-muted-foreground">
                  消费总计 {totalConsume.toLocaleString()} 元
                </span>
              </div>
              {pieData.length > 0 ? (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name ?? ''} ${((percent ?? 0) * 100).toFixed(1)}%`
                        }
                        labelLine={true}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={PAYMENT_COLORS[entry.key]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${Number(value).toLocaleString()} 元`}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          backgroundColor: 'hsl(var(--card))',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-xs text-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>

            {/* Service ranking bar chart */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <h2 className="text-base sm:text-lg font-semibold">项目 TOP 10</h2>
                </div>
                <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                  <button
                    onClick={() => {
                      setSortField('amount');
                      setSortOrder('desc');
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      sortField === 'amount'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    按收入
                  </button>
                  <button
                    onClick={() => {
                      setSortField('count');
                      setSortOrder('desc');
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      sortField === 'count'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    按次数
                  </button>
                </div>
              </div>
              {barData.length > 0 ? (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={70}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === '收入金额') return `${Number(value).toLocaleString()} 元`;
                          return `${value} 次`;
                        }}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          backgroundColor: 'hsl(var(--card))',
                        }}
                        labelFormatter={(label) => {
                          const item = barData.find((d) => d.name === label);
                          return item?.fullName || label;
                        }}
                      />
                      <Bar
                        dataKey={sortField === 'amount' ? '收入金额' : '消费次数'}
                        fill={sortField === 'amount' ? '#3b82f6' : '#10b981'}
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </div>

          {/* Full ranking table */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">项目排行明细</h2>
            </div>
            {sortedRanking.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 font-medium text-muted-foreground w-12">排名</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">项目名称</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">
                        <button
                          onClick={() => handleSort('count')}
                          className="inline-flex items-center hover:text-foreground transition-colors"
                        >
                          消费次数
                          <SortIcon field="count" />
                        </button>
                      </th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">
                        <button
                          onClick={() => handleSort('amount')}
                          className="inline-flex items-center hover:text-foreground transition-colors"
                        >
                          收入金额
                          <SortIcon field="amount" />
                        </button>
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">均价</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRanking.map((item, index) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              index === 0
                                ? 'bg-yellow-500 text-yellow-950'
                                : index === 1
                                  ? 'bg-gray-400 text-gray-950'
                                  : index === 2
                                    ? 'bg-amber-600 text-amber-950'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-medium">{item.name}</td>
                        <td className="py-3 pr-4 text-right">{item.count} 次</td>
                        <td className="py-3 pr-4 text-right font-medium">
                          {item.amount.toLocaleString()} 元
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {item.averagePrice} 元
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
