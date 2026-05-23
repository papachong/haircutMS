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

  const cards = [
    { label: '营收', value: formatMoney(metrics?.revenue ?? 0), bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: '客流量', value: metrics?.visitorCount ?? 0, bg: 'bg-green-50', text: 'text-green-700' },
    { label: '客单价', value: formatMoney(metrics?.averageTicket ?? 0), bg: 'bg-purple-50', text: 'text-purple-700' },
    { label: '新会员', value: metrics?.newMembers ?? 0, bg: 'bg-amber-50', text: 'text-amber-700' },
  ];

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1.5 tracking-tight ${card.text}`}>
              {loading ? <span className="inline-block w-16 h-7 bg-slate-100 rounded animate-pulse" /> : card.value}
            </p>
          </div>
        ))}
      </div>

      {metrics?.revenueGrowth != null && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">营收环比</p>
          <p className={`text-xl font-bold mt-1 ${metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%
          </p>
        </div>
      )}

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
