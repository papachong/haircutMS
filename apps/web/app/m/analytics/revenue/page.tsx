'use client';

import { useEffect, useState } from 'react';
import { getRevenueBreakdown, getServiceRanking, RevenueBreakdown, ServiceItemRanking } from '../../../../lib/api/analytics';
import { TimeRange } from '../../../../lib/api/dashboard';
import { PieChart } from '../../../../components/analytics/pie-chart';
import { TrendingUp, DollarSign, CreditCard, Wallet, Ticket, ArrowUp } from 'lucide-react';

interface RevenueCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function RevenueCard({ title, value, icon, color, subtitle }: RevenueCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-lg font-bold">
            {value.toLocaleString()}
            <span className="ml-1 text-xs font-normal text-muted-foreground">元</span>
          </p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
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

  useEffect(() => {
    loadData();
  }, [timeRange]);

  async function loadData() {
    setLoading(true);
    try {
      const [breakdownData, rankingData] = await Promise.all([
        getRevenueBreakdown(timeRange),
        getServiceRanking(timeRange),
      ]);
      setBreakdown(breakdownData);
      setRanking(rankingData);
    } catch (error) {
      console.error('Failed to load revenue analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const pieData = breakdown
    ? [
        { name: '线下支付', value: breakdown.composition.offline, color: '#3b82f6' },
        { name: '余额支付', value: breakdown.composition.balance, color: '#10b981' },
        { name: '次卡支付', value: breakdown.composition.passCard, color: '#f59e0b' },
        { name: '充值收入', value: breakdown.composition.recharge, color: '#8b5cf6' },
      ].filter((d) => d.value > 0)
    : [];

  const totalConsume = breakdown
    ? breakdown.composition.offline + breakdown.composition.balance + breakdown.composition.passCard
    : 0;

  return (
    <div className="space-y-4 p-4">
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
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <>
          {/* 收入对比 */}
          <div className="grid grid-cols-2 gap-3">
            <RevenueCard
              title="当期充值"
              value={breakdown?.rechargeIncome || 0}
              icon={<CreditCard className="h-5 w-5 text-white" />}
              color="bg-blue-500"
            />
            <RevenueCard
              title="当期消费"
              value={breakdown?.consumeIncome || 0}
              icon={<DollarSign className="h-5 w-5 text-white" />}
              color="bg-green-500"
              subtitle={`充值占比: ${breakdown && breakdown.consumeIncome > 0
                ? ((breakdown.rechargeIncome / breakdown.consumeIncome) * 100).toFixed(1)
                : '0'}%`}
            />
          </div>

          {/* 收入构成饼图 */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold mb-4">收入构成</h2>
            {pieData.length > 0 ? (
              <PieChart data={pieData} />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                暂无数据
              </div>
            )}
          </div>

          {/* 各支付方式详情 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">支付方式详情</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">线下支付</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {(breakdown?.composition.offline || 0).toLocaleString()} 元
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totalConsume > 0 ? ((breakdown!.composition.offline / totalConsume) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                    <Wallet className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-sm font-medium">余额支付</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {(breakdown?.composition.balance || 0).toLocaleString()} 元
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totalConsume > 0 ? ((breakdown!.composition.balance / totalConsume) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                    <Ticket className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium">次卡支付</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {(breakdown?.composition.passCard || 0).toLocaleString()} 元
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totalConsume > 0 ? ((breakdown!.composition.passCard / totalConsume) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 项目排行 */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <ArrowUp className="h-4 w-4" />
              项目 TOP 排行
            </h2>
            {ranking.length > 0 ? (
              <div className="space-y-3">
                {ranking.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
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