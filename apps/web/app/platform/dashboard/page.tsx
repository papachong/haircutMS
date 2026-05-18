'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPlatformStats, getExpiringShops, type PlatformStats, type ExpiringShopItem } from '@/lib/api/platform-services';

export default function PlatformDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [expiringShops, setExpiringShops] = useState<ExpiringShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, expiringData] = await Promise.all([
        getPlatformStats(),
        getExpiringShops(),
      ]);
      setStats(statsData);
      setExpiringShops(expiringData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">平台仪表盘</h1>
        <p className="text-slate-600 mt-1">欢迎回到平台管理系统</p>
      </div>

      {/* Expiring Alert */}
      {stats && stats.expiringSoonCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-amber-800">License即将到期提醒</h3>
                <p className="text-amber-700 text-sm mt-1">
                  有 {stats.expiringSoonCount} 个店铺的License即将在15天内到期
                </p>
              </div>
            </div>
            <Link
              href="/platform/licenses"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
            >
              查看详情
            </Link>
          </div>
          {expiringShops.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {expiringShops.slice(0, 5).map(shop => (
                <span key={shop.id} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                  <span>{shop.name}</span>
                  <span className="text-amber-600">({shop.daysUntilExpiry}天后)</span>
                </span>
              ))}
              {expiringShops.length > 5 && (
                <span className="text-sm text-amber-700">
                  还有 {expiringShops.length - 5} 个...
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">总店铺数</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalShops || 0}</p>
            </div>
            <div className="text-3xl">🏪</div>
          </div>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="text-green-600">活跃: {stats?.activeShops || 0}</span>
            <span className="text-amber-600">暂停: {stats?.suspendedShops || 0}</span>
            <span className="text-slate-500">归档: {stats?.archivedShops || 0}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">活跃店铺</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.activeShops || 0}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            占比 {stats ? Math.round((stats.activeShops / stats.totalShops) * 100) : 0}%
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">总会员数</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalMembers || 0}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            活跃会员
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">总订单数</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalOrders || 0}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            累计订单
          </div>
        </div>
      </div>

      {/* License Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">License状态</h2>
            <Link href="/platform/licenses" className="text-sm text-blue-600 hover:text-blue-700">
              管理License →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-slate-700">即将到期 (15天内)</span>
              </div>
              <span className="font-semibold text-slate-900">{stats?.expiringSoonCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-slate-700">已过期</span>
              </div>
              <span className="font-semibold text-slate-900">{stats?.expiredCount || 0}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">快速操作</h2>
          <div className="grid gap-3">
            <Link
              href="/platform/shops"
              className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-xl">➕</span>
              <span className="font-medium text-slate-900">新增店铺</span>
            </Link>
            <Link
              href="/platform/licenses"
              className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-xl">📄</span>
              <span className="font-medium text-slate-900">分配License</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}