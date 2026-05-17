'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getPlatformOverview,
  getTopShopsByRevenue,
  getNewShopsTrend,
  PlatformOverview,
  ShopRevenue,
  NewShopsTrend,
} from '@/lib/api/platform';
import { ShopUsageTable } from '../components/shop-usage-table';

export default function PlatformDashboard() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [topShops, setTopShops] = useState<ShopRevenue[]>([]);
  const [newShopsTrend, setNewShopsTrend] = useState<NewShopsTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [overviewResult, topShopsResult, trendResult] = await Promise.all([
          getPlatformOverview(),
          getTopShopsByRevenue(5),
          getNewShopsTrend(30),
        ]);

        if (overviewResult.code === 0) {
          setOverview(overviewResult.data);
        }
        if (topShopsResult.code === 0) {
          setTopShops(topShopsResult.data);
        }
        if (trendResult.code === 0) {
          setNewShopsTrend(trendResult.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const formatMoney = (amount: number): string => {
    return `¥${(amount / 100).toFixed(2)}`;
  };

  const StatCard = ({
    title,
    value,
    icon,
    trend,
  }: {
    title: string;
    value: string | number;
    icon: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-slate-500 mt-1">{trend}</p>
          )}
        </div>
        <div className="text-3xl ml-4">{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">平台仪表盘</h1>
          <p className="text-slate-600 mt-1">欢迎回到平台管理系统</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">平台仪表盘</h1>
          <p className="text-slate-600 mt-1">欢迎回到平台管理系统</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">平台仪表盘</h1>
        <p className="text-slate-600 mt-1">欢迎回到平台管理系统</p>
      </div>

      {/* Core Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总店铺数"
          value={overview?.totalShops || 0}
          icon="🏪"
          trend={`活跃: ${overview?.activeShops || 0}`}
        />
        <StatCard
          title="本月活跃店铺"
          value={overview?.activeShopsThisMonth || 0}
          icon="✅"
        />
        <StatCard
          title="总会员数"
          value={overview?.totalMembers || 0}
          icon="👥"
        />
        <StatCard
          title="总营收"
          value={formatMoney(overview?.totalRevenue || 0)}
          icon="💰"
          trend={`本月: ${formatMoney(overview?.revenueThisMonth || 0)}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Shop Revenue Ranking */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">店铺营收排行</h2>
            <Link
              href="/platform/shops"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部
            </Link>
          </div>
          <div className="space-y-4">
            {topShops.length === 0 ? (
              <p className="text-slate-500 text-center py-8">暂无数据</p>
            ) : (
              topShops.map((shop, index) => (
                <div
                  key={shop.shopId}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? 'bg-yellow-400 text-white'
                          : index === 1
                            ? 'bg-slate-400 text-white'
                            : index === 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {shop.shopName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {shop.orderCount} 单 · {shop.memberCount} 会员
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatMoney(shop.totalRevenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shop Statistics */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">店铺状态统计</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-700">正常营业</span>
              </div>
              <span className="text-lg font-semibold text-slate-900">
                {overview?.activeShops || 0}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: overview
                    ? `${(overview.activeShops / overview.totalShops) * 100}%`
                    : '0%',
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-slate-700">暂停营业</span>
              </div>
              <span className="text-lg font-semibold text-slate-900">
                {overview?.suspendedShops || 0}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{
                  width: overview
                    ? `${(overview.suspendedShops / overview.totalShops) * 100}%`
                    : '0%',
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                <span className="text-slate-700">已归档</span>
              </div>
              <span className="text-lg font-semibold text-slate-900">
                {overview?.archivedShops || 0}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-slate-400 h-2 rounded-full"
                style={{
                  width: overview
                    ? `${(overview.archivedShops / overview.totalShops) * 100}%`
                    : '0%',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">快速操作</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/platform/shops"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">➕</span>
            <span className="font-medium text-slate-900">新增店铺</span>
          </Link>
          <Link
            href="/platform/shops"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <span className="font-medium text-slate-900">店铺管理</span>
          </Link>
          <Link
            href="/platform/shops"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">📈</span>
            <span className="font-medium text-slate-900">数据分析</span>
          </Link>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">新增店铺趋势 (30天)</h2>
        {newShopsTrend.length === 0 ? (
          <p className="text-slate-500 text-center py-8">暂无数据</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {newShopsTrend.map((item, index) => {
              const maxCount = Math.max(...newShopsTrend.map((t) => t.count), 1);
              const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              const isNewWeek = index % 7 === 0;
              return (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${item.date}: ${item.count} 家`}
                >
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  {isNewWeek && (
                    <span className="text-xs text-slate-400">
                      {new Date(item.date).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Statistics */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">订单统计</h2>
          <div className="flex gap-2">
            <span className="text-sm text-slate-600">
              总: {overview?.totalOrders || 0}
            </span>
            <span className="text-sm text-slate-600">
              本月: {overview?.ordersThisMonth || 0}
            </span>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-600 mb-2">总订单数</p>
            <p className="text-3xl font-bold text-slate-900">
              {overview?.totalOrders || 0}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-600 mb-2">本月订单数</p>
            <p className="text-3xl font-bold text-slate-900">
              {overview?.ordersThisMonth || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Shop Usage Preview */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">店铺使用统计</h2>
          <Link
            href="/platform/overview"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            查看详情
          </Link>
        </div>
        <div className="max-h-96 overflow-hidden">
          <ShopUsageTable />
        </div>
      </div>
    </div>
  );
}