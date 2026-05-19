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
  getExpiringLicenses,
  ExpiringLicense,
} from '@/lib/api/platform';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

function formatMoney(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

function formatStorage(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN');
}

function getStatusBadge(status: string) {
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
}

function GrowthBadge({ rate }: { rate: number }) {
  if (rate === 0) {
    return (
      <span className="text-xs text-slate-400 font-medium">持平</span>
    );
  }
  const isPositive = rate > 0;
  return (
    <span
      className={`inline-flex items-center text-xs font-medium ${
        isPositive ? 'text-green-600' : 'text-red-500'
      }`}
    >
      {isPositive ? '+' : ''}{rate.toFixed(1)}%
      <svg
        className={`w-3 h-3 ml-0.5 ${isPositive ? '' : 'rotate-180'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </span>
  );
}

function StatCard({
  title,
  value,
  icon,
  growthRate,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  growthRate?: number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</p>
          <div className="mt-1.5 flex items-center gap-2">
            {growthRate !== undefined && (
              <span className="text-xs text-slate-400">较上月</span>
            )}
            {growthRate !== undefined && <GrowthBadge rate={growthRate} />}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-3">{icon}</div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [shops, setShops] = useState<ShopUsage[]>([]);
  const [topShops, setTopShops] = useState<ShopRevenue[]>([]);
  const [newShopsTrend, setNewShopsTrend] = useState<NewShopsTrend[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [expiringLicenses, setExpiringLicenses] = useState<ExpiringLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [
          overviewResult,
          shopsResult,
          topShopsResult,
          newShopsResult,
          revenueResult,
          expiringResult,
        ] = await Promise.all([
          getPlatformOverview(),
          getShopUsageStats(),
          getTopShopsByRevenue(10),
          getNewShopsTrend(30),
          getRevenueTrend(30),
          getExpiringLicenses(15),
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
        if (expiringResult.code === 0) {
          setExpiringLicenses(expiringResult.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const newShopsChartData = newShopsTrend.map((item) => ({
    ...item,
    shortDate: formatShortDate(item.date),
  }));

  const revenueChartData = revenueTrend.map((item) => ({
    ...item,
    shortDate: formatShortDate(item.date),
    revenueYuan: item.revenue / 100,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">平台数据总览</h1>
          <p className="text-slate-500 mt-1 text-sm">查看全平台经营数据概览</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            加载中...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">平台数据总览</h1>
          <p className="text-slate-500 mt-1 text-sm">查看全平台经营数据概览</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">平台数据总览</h1>
        <p className="text-slate-500 mt-1 text-sm">查看全平台经营数据概览</p>
      </div>

      {/* Core Metrics with Growth */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总店铺数"
          value={overview?.totalShops ?? 0}
          icon={
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          }
          growthRate={overview?.shopGrowthRate}
          subtitle={`活跃 ${overview?.activeShops ?? 0} | 暂停 ${overview?.suspendedShops ?? 0}`}
        />
        <StatCard
          title="活跃店铺 (当月)"
          value={overview?.activeShopsThisMonth ?? 0}
          icon={
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          }
          growthRate={overview?.activeShopGrowthRate}
          subtitle="当月有订单的店铺数"
        />
        <StatCard
          title="总营收"
          value={formatMoney(overview?.totalRevenue ?? 0)}
          icon={
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          }
          growthRate={overview?.revenueGrowthRate}
          subtitle={`本月: ${formatMoney(overview?.revenueThisMonth ?? 0)}`}
        />
        <StatCard
          title="总会员数"
          value={overview?.totalMembers ?? 0}
          icon={
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          }
          growthRate={overview?.memberGrowthRate}
          subtitle={`本月订单: ${overview?.ordersThisMonth ?? 0}`}
        />
      </div>

      {/* Expiring Licenses Alert */}
      {expiringLicenses.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-sm font-semibold text-amber-800">
              License 到期预警 ({expiringLicenses.length} 家店铺即将到期)
            </h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {expiringLicenses.map((license) => (
              <div
                key={license.shopId}
                className="bg-white rounded-lg border border-amber-200 px-4 py-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{license.shopName}</p>
                  <p className="text-xs text-slate-500">
                    {license.licensePlan} 计划 · 到期: {formatDate(license.expiresAt)}
                  </p>
                </div>
                <span
                  className={`ml-3 flex-shrink-0 text-sm font-bold ${
                    license.daysUntilExpiry <= 3
                      ? 'text-red-600'
                      : license.daysUntilExpiry <= 7
                        ? 'text-amber-600'
                        : 'text-amber-500'
                  }`}
                >
                  {license.daysUntilExpiry}天
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts: New Shops Trend + Revenue Trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Shops Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">新增店铺趋势 (近30天)</h2>
          {newShopsTrend.length === 0 ? (
            <p className="text-slate-400 text-center py-12 text-sm">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={newShopsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  labelFormatter={(label) => `日期: ${label}`}
                  formatter={(value: number) => [`${value} 家`, '新增店铺']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">营收趋势 (近30天)</h2>
          {revenueTrend.length === 0 ? (
            <p className="text-slate-400 text-center py-12 text-sm">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  width={50}
                  tickFormatter={(v: number) => `¥${v}`}
                />
                <Tooltip
                  labelFormatter={(label) => `日期: ${label}`}
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '营收']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenueYuan"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Shop Revenue Ranking */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">店铺营收排行 (Top 10)</h2>
        {topShops.length === 0 ? (
          <p className="text-slate-400 text-center py-12 text-sm">暂无数据</p>
        ) : (
          <div className="space-y-2">
            {topShops.map((shop, index) => {
              const maxRevenue = topShops[0]?.totalRevenue || 1;
              const barWidth = (shop.totalRevenue / maxRevenue) * 100;
              return (
                <div
                  key={shop.shopId}
                  className="group relative p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          index === 0
                            ? 'bg-amber-400 text-white'
                            : index === 1
                              ? 'bg-slate-300 text-white'
                              : index === 2
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{shop.shopName}</p>
                        <p className="text-xs text-slate-400">
                          {shop.orderCount} 单 · {shop.memberCount} 会员
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 flex-shrink-0 ml-3">
                      {formatMoney(shop.totalRevenue)}
                    </p>
                  </div>
                  {shop.totalRevenue > 0 && (
                    <div className="absolute inset-y-0 left-0 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors" style={{ width: `${barWidth}%` }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shop Usage Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">各店铺使用量统计</h2>
          <div className="text-xs text-slate-400">共 {shops.length} 家店铺</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  店铺
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  员工数
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  会员数
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  订单量
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  营收
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  最后活跃
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shops.map((shop) => (
                <tr key={shop.shopId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{shop.shopName}</div>
                      <div className="text-xs text-slate-400">{shop.phone || '-'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(shop.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-700">
                    {shop.staffCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-700">
                    {shop.memberCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-700">
                    {shop.orderCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                    {formatMoney(shop.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                    {formatDate(shop.lastActiveAt)}
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    暂无店铺数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
