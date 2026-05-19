'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getRevenueBreakdown,
  getServiceRanking,
  type RevenueBreakdown,
  type ServiceItemRanking,
} from '../../../../lib/api/analytics';
import { TimeRange } from '../../../../lib/api/dashboard';
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
  DollarSign,
  CreditCard,
  Wallet,
  Ticket,
  TrendingUp,
} from 'lucide-react';

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

interface RevenueCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function RevenueCard({ title, value, icon, color, subtitle }: RevenueCardProps) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-0.5 text-base font-bold">
            {value.toLocaleString()}
            <span className="ml-1 text-xs font-normal text-muted-foreground">元</span>
          </p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default function RevenueAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.TODAY);
  const [breakdown, setBreakdown] = useState<RevenueBreakdown | null>(null);
  const [ranking, setRanking] = useState<ServiceItemRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'amount' | 'count'>('amount');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [breakdownData, rankingData] = await Promise.all([
        getRevenueBreakdown(timeRange),
        getServiceRanking(timeRange, undefined, undefined, 15),
      ]);
      setBreakdown(breakdownData);
      setRanking(rankingData);
    } catch (error) {
      console.error('Failed to load revenue analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const composition = breakdown?.composition;

  // Pie chart data: payment methods
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

  // Bar chart data
  const barData = [...ranking]
    .sort((a, b) => (sortBy === 'amount' ? b.amount - a.amount : b.count - a.count))
    .slice(0, 8)
    .map((item) => ({
      name: item.name.length > 4 ? item.name.slice(0, 4) + '..' : item.name,
      fullName: item.name,
      消费次数: item.count,
      收入金额: item.amount,
    }));

  const sortedRanking = [...ranking].sort((a, b) =>
    sortBy === 'amount' ? b.amount - a.amount : b.count - a.count,
  );

  return (
    <div className="space-y-4 p-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">收入分析</h1>
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
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Revenue summary */}
          <div className="grid grid-cols-2 gap-3">
            <RevenueCard
              title="当期充值"
              value={breakdown?.rechargeIncome || 0}
              icon={<CreditCard className="h-4 w-4 text-white" />}
              color="bg-purple-500"
            />
            <RevenueCard
              title="当期消费"
              value={breakdown?.consumeIncome || 0}
              icon={<DollarSign className="h-4 w-4 text-white" />}
              color="bg-blue-500"
              subtitle={
                breakdown && breakdown.consumeIncome > 0
                  ? `充值/消费: ${((breakdown.rechargeIncome / breakdown.consumeIncome) * 100).toFixed(0)}%`
                  : undefined
              }
            />
          </div>

          {/* Payment composition pie chart */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">支付方式占比</h2>
            {pieData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
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
                        fontSize: '12px',
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
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                暂无数据
              </div>
            )}
          </div>

          {/* Payment detail cards */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">支付方式详情</h2>
            <div className="space-y-2">
              {[
                {
                  key: 'offline',
                  label: '线下支付',
                  icon: <DollarSign className="h-4 w-4 text-blue-500" />,
                  bg: 'bg-blue-500/10',
                  value: breakdown?.composition.offline || 0,
                },
                {
                  key: 'balance',
                  label: '余额支付',
                  icon: <Wallet className="h-4 w-4 text-emerald-500" />,
                  bg: 'bg-emerald-500/10',
                  value: breakdown?.composition.balance || 0,
                },
                {
                  key: 'passCard',
                  label: '次卡支付',
                  icon: <Ticket className="h-4 w-4 text-amber-500" />,
                  bg: 'bg-amber-500/10',
                  value: breakdown?.composition.passCard || 0,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bg}`}>
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{item.value.toLocaleString()} 元</p>
                    <p className="text-xs text-muted-foreground">
                      {totalConsume > 0 ? ((item.value / totalConsume) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service ranking bar chart */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                项目 TOP 8
              </h2>
              <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                <button
                  onClick={() => setSortBy('amount')}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                    sortBy === 'amount'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  收入
                </button>
                <button
                  onClick={() => setSortBy('count')}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                    sortBy === 'count'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  次数
                </button>
              </div>
            </div>
            {barData.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 5, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === '收入金额') return `${Number(value).toLocaleString()} 元`;
                        return `${value} 次`;
                      }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                        fontSize: '12px',
                      }}
                      labelFormatter={(label) => {
                        const item = barData.find((d) => d.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Bar
                      dataKey={sortBy === 'amount' ? '收入金额' : '消费次数'}
                      fill={sortBy === 'amount' ? '#3b82f6' : '#10b981'}
                      radius={[0, 4, 4, 0]}
                      barSize={14}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                暂无数据
              </div>
            )}
          </div>

          {/* Full ranking list */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">项目排行明细</h2>
            {sortedRanking.length > 0 ? (
              <div className="space-y-2">
                {sortedRanking.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
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
                      <div>
                        <p className="text-sm font-medium leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.count} 次 · 均价 {item.averagePrice} 元
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold">{item.amount.toLocaleString()} 元</p>
                  </div>
                ))}
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
