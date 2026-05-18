'use client';

import { useEffect, useState } from 'react';
import {
  getShopUsageStats,
  ShopUsage,
  getPlatformOverview,
  PlatformOverview,
  getTopShopsByRevenue,
  ShopRevenue,
  getNewShopsTrend,
  NewShopsTrend,
  getRevenueTrend,
  RevenueTrend,
} from '@/lib/api/platform';

export default function OverviewPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [shops, setShops] = useState<ShopUsage[]>([]);
  const [topShops, setTopShops] = useState<ShopRevenue[]>([]);
  const [newShopsTrend, setNewShopsTrend] = useState<NewShopsTrend[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [overviewResult, shopsResult, topShopsResult, newShopsResult, revenueResult] = await Promise.all([
          getPlatformOverview(),
          getShopUsageStats(),
          getTopShopsByRevenue(10),
          getNewShopsTrend(30),
          getRevenueTrend(30),
        ]);

        if (overviewResult.code === 0) {
          setOverview(overviewResult.data);
        }
        if (shopsResult.code === 0) {
          setShops(shopsResult.data);
        }
        if (topShopsResult.code === 0) {
          setTopShops(topShopsResult.data);
        }
        if (newShopsResult.code === 0) {
          setNewShopsTrend(newShopsResult.data);
        }
        if (revenueResult.code === 0) {
          setRevenueTrend(revenueResult.data);
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

  const formatStorage = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: '正常营业' },
      SUSPENDED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '暂停营业' },
      ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-800', label: '已归档' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <span>{status}</span>;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const StatCard = ({
    title,
    value,
    icon,
    trend,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: string;
    trend?: { value: number; label: string };
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-slate-500 mt-1">{trend.label}</p>
          )}
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-3xl ml-4">{icon}</div>
      </div>
    </div>
  );

  const selectedShopData = selectedShop ? shops.find((s) => s.shopId === selectedShop) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">平台数据总览</h1>
          <p className="text-slate-600 mt-1">查看全平台经营数据概览</p>
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
          <h1 className="text-2xl font-bold text-slate-900">平台数据总览</h1>
          <p className="text-slate-600 mt-1">查看全平台经营数据概览</p>
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
        <h1 className="text-2xl font-bold text-slate-900">平台数据总览</h1>
        <p className="text-slate-600 mt-1">查看全平台经营数据概览</p>
      </div>

      {/* Core Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总店铺数"
          value={overview?.totalShops || 0}
          icon="🏪"
          subtitle={`活跃: ${overview?.activeShops || 0} | 暂停: ${overview?.suspendedShops || 0}`}
        />
        <StatCard
          title="本月活跃店铺"
          value={overview?.activeShopsThisMonth || 0}
          icon="✅"
          subtitle="当月有订单的店铺"
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
          subtitle={`本月: ${formatMoney(overview?.revenueThisMonth || 0)}`}
        />
      </div>

      {/* Order Statistics */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">订单统计</h2>
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

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Shops Trend */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">新增店铺趋势 (30天)</h2>
          {newShopsTrend.length === 0 ? (
            <p className="text-slate-500 text-center py-8">暂无数据</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
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

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">营收趋势 (30天)</h2>
          {revenueTrend.length === 0 ? (
            <p className="text-slate-500 text-center py-8">暂无数据</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {revenueTrend.map((item, index) => {
                const maxRevenue = Math.max(...revenueTrend.map((t) => t.revenue), 100);
                const height = (item.revenue / maxRevenue) * 100;
                const isNewWeek = index % 7 === 0;
                return (
                  <div
                    key={item.date}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`${item.date}: ${formatMoney(item.revenue)}`}
                  >
                    <div
                      className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
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
      </div>

      {/* Shop Revenue Ranking */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">店铺营收排行 (Top 10)</h2>
        {topShops.length === 0 ? (
          <p className="text-slate-500 text-center py-8">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {topShops.map((shop, index) => (
              <div
                key={shop.shopId}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setSelectedShop(shop.shopId)}
              >
                <div className="flex items-center gap-4">
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
                    <p className="text-sm font-medium text-slate-900">{shop.shopName}</p>
                    <p className="text-xs text-slate-500">
                      {shop.orderCount} 单 · {shop.memberCount} 会员
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {formatMoney(shop.totalRevenue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shop Usage Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">店铺使用统计</h2>
          <div className="text-sm text-slate-500">共 {shops.length} 家店铺</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  店铺名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  员工数
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  会员数
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  订单量
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  存储用量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  最后活跃
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {shops.map((shop) => (
                <tr
                  key={shop.shopId}
                  className={`hover:bg-slate-50 cursor-pointer ${selectedShop === shop.shopId ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedShop(shop.shopId)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{shop.shopName}</div>
                      <div className="text-sm text-slate-500">{shop.phone || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(shop.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                    {shop.staffCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                    {shop.memberCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                    {shop.orderCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                    {formatStorage(shop.storageUsage)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(shop.lastActiveAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(shop.createdAt)}
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    暂无店铺数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shop Detail Modal */}
      {selectedShopData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedShop(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{selectedShopData.shopName}</h3>
              <button
                onClick={() => setSelectedShop(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">状态</span>
                <span>{getStatusBadge(selectedShopData.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">员工数</span>
                <span className="font-medium">{selectedShopData.staffCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">会员数</span>
                <span className="font-medium">{selectedShopData.memberCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">订单量</span>
                <span className="font-medium">{selectedShopData.orderCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">总营收</span>
                <span className="font-medium">{formatMoney(selectedShopData.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">存储用量</span>
                <span className="font-medium">{formatStorage(selectedShopData.storageUsage)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">最后活跃</span>
                <span className="font-medium">{formatDate(selectedShopData.lastActiveAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}