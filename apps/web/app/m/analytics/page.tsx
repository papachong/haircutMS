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
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

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
}

interface DormantStats {
  totalCount: number;
  dormantCount: number;
  dormantPercentage: number;
}

export default function MemberAnalyticsPage() {
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

  return (
    <div className="space-y-4 p-4">
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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <>
          {dormantStats && dormantStats.dormantCount > 0 && (
            <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                    沉睡会员预警
                  </h3>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    目前有 <span className="font-bold">{dormantStats.dormantCount}</span> 名会员
                    （{dormantStats.dormantPercentage}%）90天未到店消费，建议激活挽回。
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">总会员数</p>
              <p className="mt-2 text-2xl font-bold">
                {dormantStats?.totalCount || 0}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">活跃会员</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {dormantStats ? dormantStats.totalCount - dormantStats.dormantCount : 0}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">总充值</p>
              <p className="mt-2 text-xl font-bold text-blue-600">
                {(consumptionTrend?.totalRecharge || 0) / 100}
                <span className="ml-1 text-xs font-normal text-muted-foreground">元</span>
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">总消费</p>
              <p className="mt-2 text-xl font-bold text-purple-600">
                {(consumptionTrend?.totalConsume || 0) / 100}
                <span className="ml-1 text-xs font-normal text-muted-foreground">元</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold">等级分布</h2>
            <div className="flex justify-center">
              <PieChart data={pieChartData} size={180} />
            </div>
          </div>

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
            <div className="h-48">
              {chartData.length > 0 ? (
                <LineChart data={chartData} color={chartType === 'recharge' ? '#2563eb' : '#9333ea'} />
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