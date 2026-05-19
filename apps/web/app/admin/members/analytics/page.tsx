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
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  AlertTriangle,
  Users,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Moon,
} from 'lucide-react';

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

export default function AdminMemberAnalyticsPage() {
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
    date: d.date,
    recharge: d.recharge / 100,
    consume: d.consume / 100,
    label: d.date.slice(5),
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
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">会员分析</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看会员分布、消费趋势和沉睡会员情况
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="rounded-lg border bg-card px-4 py-2 text-sm font-medium"
        >
          <option value={TimeRange.WEEK}>本周</option>
          <option value={TimeRange.MONTH}>本月</option>
        </select>
      </div>

      {/* Dormant Alert */}
      {dormantDetail && dormantDetail.dormantCount > 0 && (
        <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-lg">
                沉睡会员预警
              </h3>
              <p className="mt-2 text-amber-700 dark:text-amber-300">
                目前有{' '}
                <span className="font-bold text-lg">{dormantDetail.dormantCount}</span>{' '}
                名会员（<span className="font-bold">{dormantDetail.dormantPercentage}%</span>）90天未到店消费，
                建议通过优惠券或短信激活挽回。
              </p>
              {dormantDetail.distribution.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {dormantDetail.distribution.map((item) => (
                    <div
                      key={item.range}
                      className="rounded-lg bg-white/50 dark:bg-black/20 px-3 py-2"
                    >
                      <p className="text-xs text-amber-600 dark:text-amber-400">{item.range}</p>
                      <p className="text-lg font-bold text-amber-900 dark:text-amber-200">
                        {item.count}
                        <span className="text-xs font-normal ml-1">({item.percentage}%)</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">总会员数</span>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {dormantDetail?.totalCount || 0}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <Activity className="h-5 w-5 text-green-600" />
            <span className="text-xs text-muted-foreground">活跃会员</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-green-600">{activeCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span className="text-xs text-muted-foreground">总充值</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-blue-600">
            {formatYuan(consumptionTrend?.totalRecharge || 0)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">元</span>
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <span className="text-xs text-muted-foreground">总消费</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-purple-600">
            {formatYuan(consumptionTrend?.totalConsume || 0)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">元</span>
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level Distribution Pie Chart */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">等级分布</h2>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              暂无数据
            </div>
          )}
        </div>

        {/* Consumption Trends Line Chart */}
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">充值消费趋势</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('recharge')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  chartType === 'recharge'
                    ? 'bg-blue-600 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <ArrowUpCircle className="h-4 w-4" />
                充值
              </button>
              <button
                onClick={() => setChartType('consume')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  chartType === 'consume'
                    ? 'bg-purple-600 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <ArrowDownCircle className="h-4 w-4" />
                消费
              </button>
            </div>
          </div>
          {consumptionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={consumptionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  formatter={((value: number) => [`${value.toFixed(2)} 元`]) as never}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey={chartType}
                  stroke={chartType === 'recharge' ? '#2563eb' : '#9333ea'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name={chartType === 'recharge' ? '充值' : '消费'}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* Daily Consumption Trends (Last 30 Days) */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">近 30 日消费趋势</h2>
          <span className="ml-auto text-sm text-muted-foreground">
            总消费 {formatYuan(dailyConsumption?.totalAmount || 0)} 元 / 共{' '}
            {dailyConsumption?.totalCount || 0} 笔
          </span>
        </div>
        {dailyChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
                interval={2}
              />
              <YAxis
                yAxisId="amount"
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <Tooltip
                formatter={((value: number, name: string) => {
                  if (name === '消费金额') return [`${value.toFixed(2)} 元`, name];
                  return [`${value} 笔`, name];
                }) as never}
              />
              <Bar
                yAxisId="amount"
                dataKey="amount"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="消费金额"
              />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="count"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="消费笔数"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        )}
      </div>

      {/* Dormant Member Detail Card */}
      {dormantDetail && dormantDetail.dormantCount > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <Moon className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold">沉睡会员活跃日期分布</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {dormantDetail.distribution.map((item) => (
              <div
                key={item.range}
                className="rounded-xl border p-4 text-center"
              >
                <p className="text-sm font-medium text-muted-foreground">
                  {item.range}
                </p>
                <p className="mt-2 text-2xl font-bold">{item.count}</p>
                <p className="text-xs text-muted-foreground">
                  {item.percentage}%
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
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

      {/* Detail Table */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">数据详情</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-medium">日期</th>
                <th className="py-3 text-right font-medium text-blue-600">
                  充值 (元)
                </th>
                <th className="py-3 text-right font-medium text-purple-600">
                  消费 (元)
                </th>
                <th className="py-3 text-right font-medium">净增 (元)</th>
              </tr>
            </thead>
            <tbody>
              {(consumptionTrend?.data || []).map((d, i) => {
                const recharge = d.recharge;
                const consume = d.consume;
                const net = recharge - consume;
                return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3">
                      {new Date(d.date).toLocaleDateString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 text-right text-blue-600">
                      {(recharge / 100).toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-purple-600">
                      {(consume / 100).toFixed(2)}
                    </td>
                    <td
                      className={`py-3 text-right ${
                        net >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {(net / 100).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
