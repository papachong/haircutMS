'use client';

import { useEffect, useState } from 'react';
import {
  getMemberLevelDistribution,
  getMemberConsumptionTrends,
  getDormantMembersStats,
  TimeRange,
} from '@/lib/api/member-analytics';
import { PieChart } from '@/components/PieChart';
import { LineChart } from '@/components/LineChart';
import { AlertTriangle, Users, DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface LevelDistribution {
  levelId: string;
  levelName: string;
  count: number;
  percentage: number;
}

interface ConsumptionTrend {
  data: Array<{ date: string; recharge: number; consume: number }>;
  totalRecharge: number;
  totalConsume: number;
  granularity: string;
}

interface DormantStats {
  totalCount: number;
  dormantCount: number;
  dormantPercentage: number;
}

export default function AdminMemberAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.MONTH);
  const [levelDistribution, setLevelDistribution] = useState<LevelDistribution[]>([]);
  const [consumptionTrend, setConsumptionTrend] = useState<ConsumptionTrend | null>(null);
  const [dormantStats, setDormantStats] = useState<DormantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'recharge' | 'consume'>('recharge');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const [levels, trends, dormant] = await Promise.all([
        getMemberLevelDistribution(),
        getMemberConsumptionTrends(timeRange),
        getDormantMembersStats(90),
      ]);
      setLevelDistribution(levels);
      setConsumptionTrend(trends);
      setDormantStats(dormant);
    } catch (error) {
      console.error('Failed to load member analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const pieChartData = levelDistribution.map((level) => ({
    label: level.levelName,
    value: level.count,
  }));

  const chartData = consumptionTrend?.data?.map((d) => ({
    date: d.date,
    value: chartType === 'recharge' ? d.recharge : d.consume,
    label: new Date(d.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
  })) || [];

  const netBalance = (consumptionTrend?.totalRecharge || 0) - (consumptionTrend?.totalConsume || 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">会员分析</h1>
          <p className="text-sm text-muted-foreground mt-1">查看会员分布、消费趋势和沉睡会员情况</p>
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

      {dormantStats && dormantStats.dormantCount > 0 && (
        <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-lg">
                沉睡会员预警
              </h3>
              <p className="mt-2 text-amber-700 dark:text-amber-300">
                目前有 <span className="font-bold text-lg">{dormantStats.dormantCount}</span> 名会员
                （<span className="font-bold">{dormantStats.dormantPercentage}%</span>）90天未到店消费，
                建议通过优惠券或短信激活挽回。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">总会员数</span>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {dormantStats?.totalCount || 0}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <Users className="h-5 w-5 text-green-600" />
            <span className="text-xs text-muted-foreground">活跃会员</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-green-600">
            {dormantStats ? dormantStats.totalCount - dormantStats.dormantCount : 0}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span className="text-xs text-muted-foreground">总充值</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-blue-600">
            {((consumptionTrend?.totalRecharge || 0) / 100).toFixed(0)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">元</span>
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <span className="text-xs text-muted-foreground">总消费</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-purple-600">
            {((consumptionTrend?.totalConsume || 0) / 100).toFixed(0)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">元</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">等级分布</h2>
          <div className="flex justify-center">
            <PieChart data={pieChartData} size={250} />
          </div>
        </div>

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
          <div className="h-72">
            {chartData.length > 0 ? (
              <LineChart data={chartData} color={chartType === 'recharge' ? '#2563eb' : '#9333ea'} />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">数据详情</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-medium">日期</th>
                <th className="py-3 text-right font-medium text-blue-600">充值 (元)</th>
                <th className="py-3 text-right font-medium text-purple-600">消费 (元)</th>
                <th className="py-3 text-right font-medium">净增 (元)</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => {
                const recharge = consumptionTrend?.data?.[i]?.recharge || 0;
                const consume = consumptionTrend?.data?.[i]?.consume || 0;
                const net = recharge - consume;
                return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3">{d.label}</td>
                    <td className="py-3 text-right text-blue-600">{(recharge / 100).toFixed(2)}</td>
                    <td className="py-3 text-right text-purple-600">{(consume / 100).toFixed(2)}</td>
                    <td className={`py-3 text-right ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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