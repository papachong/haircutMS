'use client';

import { useEffect, useState } from 'react';
import {
  getMemberLevelDistribution,
  getMemberConsumptionTrends,
  getDormantMembersDetail,
  getDailyConsumptionTrends,
  TimeRange,
  MemberLevelDistribution,
  MemberConsumptionTrends,
  DormantMembersDetail,
  DailyConsumptionResponse,
} from '@/lib/api/member-analytics';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { AlertTriangle, Activity, Moon } from 'lucide-react';

const PIE_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

const formatYuan = (value: number) => (value / 100).toFixed(0);

export default function MemberAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.MONTH);
  const [levelDistribution, setLevelDistribution] = useState<MemberLevelDistribution[]>([]);
  const [consumptionTrend, setConsumptionTrend] = useState<MemberConsumptionTrends | null>(null);
  const [dormantDetail, setDormantDetail] = useState<DormantMembersDetail | null>(null);
  const [dailyConsumption, setDailyConsumption] = useState<DailyConsumptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'recharge' | 'consume'>('recharge');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const [levels, trends, dormant, daily] = await Promise.all([
        getMemberLevelDistribution(),
        getMemberConsumptionTrends(timeRange),
        getDormantMembersDetail(90),
        getDailyConsumptionTrends(30),
      ]);
      setLevelDistribution(levels);
      setConsumptionTrend(trends);
      setDormantDetail(dormant);
      setDailyConsumption(daily);
    } catch (error) {
      console.error('Failed to load member analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const pieChartData = levelDistribution.map((level) => ({
    name: level.levelName,
    value: level.count,
  }));

  const consumptionChartData = consumptionTrend?.data?.map((d) => ({
    date: d.date.slice(5),
    recharge: d.recharge / 100,
    consume: d.consume / 100,
  })) || [];

  const dailyChartData = dailyConsumption?.data?.map((d) => ({
    date: d.date.slice(5),
    amount: d.amount / 100,
    count: d.count,
  })) || [];

  const activeCount = dormantDetail
    ? dormantDetail.totalCount - dormantDetail.dormantCount
    : 0;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">会员分析</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="rounded-lg border bg-card px-3 py-2 text-sm font-medium"
        >
          <option value={TimeRange.WEEK}>本周</option>
          <option value={TimeRange.MONTH}>本月</option>
        </select>
      </div>

      {/* Dormant Alert */}
      {dormantDetail && dormantDetail.dormantCount > 0 && (
        <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                沉睡会员预警
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                目前有 <span className="font-bold">{dormantDetail.dormantCount}</span> 名会员
                （{dormantDetail.dormantPercentage}%）90天未到店消费，建议激活挽回。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">总会员数</p>
          <p className="mt-2 text-2xl font-bold">
            {dormantDetail?.totalCount || 0}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">活跃会员</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">总充值</p>
          <p className="mt-2 text-xl font-bold text-blue-600">
            {formatYuan(consumptionTrend?.totalRecharge || 0)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">元</span>
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">总消费</p>
          <p className="mt-2 text-xl font-bold text-purple-600">
            {formatYuan(consumptionTrend?.totalConsume || 0)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">元</span>
          </p>
        </div>
      </div>

      {/* Level Distribution Pie Chart */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold">等级分布</h2>
        {pieChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={75}
                dataKey="value"
                label={((entry: { name: string; percent: number }) =>
                  `${entry.name} ${(entry.percent * 100).toFixed(0)}%`
                ) as never}
              >
                {pieChartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={((value: number) => [`${value} 人`, '会员数']) as never}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            暂无数据
          </div>
        )}
      </div>

      {/* Consumption Trends */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">充值消费趋势</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('recharge')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                chartType === 'recharge'
                  ? 'bg-blue-600 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              充值
            </button>
            <button
              onClick={() => setChartType('consume')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                chartType === 'consume'
                  ? 'bg-purple-600 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              消费
            </button>
          </div>
        </div>
        {consumptionChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={consumptionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <Tooltip
                formatter={((value: number) => [`${value.toFixed(2)} 元`]) as never}
              />
              <Line
                type="monotone"
                dataKey={chartType}
                stroke={chartType === 'recharge' ? '#2563eb' : '#9333ea'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name={chartType === 'recharge' ? '充值' : '消费'}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            暂无数据
          </div>
        )}
      </div>

      {/* Daily Consumption (Last 30 Days) */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold">近 30 日消费趋势</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          总消费 {formatYuan(dailyConsumption?.totalAmount || 0)} 元 / 共{' '}
          {dailyConsumption?.totalCount || 0} 笔
        </p>
        {dailyChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9 }}
                stroke="#9ca3af"
                interval={4}
              />
              <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <Tooltip
                formatter={((value: number, name: string) => {
                  if (name === '消费金额') return [`${value.toFixed(2)} 元`, name];
                  return [`${value} 笔`, name];
                }) as never}
              />
              <Bar
                dataKey="amount"
                fill="#3b82f6"
                radius={[3, 3, 0, 0]}
                name="消费金额"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            暂无数据
          </div>
        )}
      </div>

      {/* Dormant Distribution */}
      {dormantDetail && dormantDetail.dormantCount > 0 && dormantDetail.distribution.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Moon className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold">沉睡会员分布</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {dormantDetail.distribution.map((item) => (
              <div key={item.range} className="rounded-lg border p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  {item.range}
                </p>
                <p className="mt-1 text-lg font-bold">{item.count}</p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
