'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPlatformStats, PlatformStats } from '@/lib/api/platform-services';

export default function PlatformDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getPlatformStats();
        setStats(data);
      } catch {
        // silently ignore - will show zeros
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const formatMoney = (amount: number): string => {
    return `¥${(amount / 100).toFixed(2)}`;
  };

  const statCards = [
    {
      title: '总店铺数',
      value: stats?.totalShops ?? 0,
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      bg: 'bg-blue-50',
    },
    {
      title: '活跃店铺',
      value: stats?.activeShops ?? 0,
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-green-50',
    },
    {
      title: '总会员数',
      value: stats?.totalMembers ?? 0,
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bg: 'bg-purple-50',
    },
    {
      title: '总营收',
      value: formatMoney(stats?.totalRevenue ?? 0),
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">平台仪表盘</h1>
        <p className="text-slate-500 mt-1 text-sm">欢迎回到平台管理系统</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
                  {loading ? (
                    <span className="inline-block w-16 h-7 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* License Warnings */}
      {stats && (stats.expiringSoonCount > 0 || stats.expiredCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">License 预警</h3>
          <div className="flex gap-6">
            {stats.expiringSoonCount > 0 && (
              <p className="text-sm text-amber-700">
                <span className="font-bold">{stats.expiringSoonCount}</span> 家店铺 License 即将到期
              </p>
            )}
            {stats.expiredCount > 0 && (
              <p className="text-sm text-red-600">
                <span className="font-bold">{stats.expiredCount}</span> 家店铺 License 已过期
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">快速操作</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/platform/overview"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">平台数据总览</span>
          </Link>
          <Link
            href="/platform/shops"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">店铺管理</span>
          </Link>
          <Link
            href="/platform/licenses"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">License 管理</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
