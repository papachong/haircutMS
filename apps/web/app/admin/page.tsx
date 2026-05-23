'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardMetrics, type DashboardMetrics, type TimeRange } from '@/lib/api/dashboard';

const timeRangeLabels: Record<TimeRange, string> = {
  today: '今日',
  week: '本周',
  month: '本月',
  custom: '自定义',
};

const formatMoney = (amount: number): string => `¥${(amount / 100).toFixed(2)}`;

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>('today');

  useEffect(() => {
    async function load() {
      try {
        const data = await getDashboardMetrics(range);
        setMetrics(data);
      } catch {
        // show zeros on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [range]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">工作台</h1>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['today', 'week', 'month'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {timeRangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {/* Row 1: 营收 + 环比 */}
        <div className="grid gap-3 grid-cols-2">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">营收</p>
            <p className="text-2xl font-bold mt-1 tracking-tight text-blue-700">
              {loading ? <span className="inline-block w-16 h-7 bg-slate-100 rounded animate-pulse" /> : formatMoney(metrics?.revenue ?? 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">环比</p>
            <p className={`text-2xl font-bold mt-1 tracking-tight ${(metrics?.revenueGrowth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {loading ? (
                <span className="inline-block w-16 h-7 bg-slate-100 rounded animate-pulse" />
              ) : metrics?.revenueGrowth != null ? (
                <>{metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%</>
              ) : (
                <span className="text-slate-400">--</span>
              )}
            </p>
          </div>
        </div>

        {/* Row 2: 客流量 + 客单价 + 新会员 */}
        <div className="grid gap-3 grid-cols-3">  
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">客单价</p>
            <p className="text-2xl font-bold mt-1 tracking-tight text-purple-700">
              {loading ? <span className="inline-block w-10 h-7 bg-slate-100 rounded animate-pulse" /> : formatMoney(metrics?.averageTicket ?? 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">客流量</p>
            <p className="text-2xl font-bold mt-1 tracking-tight text-green-700">
              {loading ? <span className="inline-block w-10 h-7 bg-slate-100 rounded animate-pulse" /> : (metrics?.visitorCount ?? 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">新会员</p>
            <p className="text-2xl font-bold mt-1 tracking-tight text-amber-700">
              {loading ? <span className="inline-block w-10 h-7 bg-slate-100 rounded animate-pulse" /> : (metrics?.newMembers ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">快速操作</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/admin/pos"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">💰</span>
            <span className="text-sm font-medium text-slate-700">收银台</span>
          </Link>
          <Link
            href="/admin/members"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">👥</span>
            <span className="text-sm font-medium text-slate-700">会员管理</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">📋</span>
            <span className="text-sm font-medium text-slate-700">订单列表</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
