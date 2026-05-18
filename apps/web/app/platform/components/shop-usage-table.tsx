'use client';

import { useEffect, useState } from 'react';
import { getShopUsageStats, ShopUsage } from '@/lib/api/platform';

export function ShopUsageTable() {
  const [shops, setShops] = useState<ShopUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await getShopUsageStats();
        if (result.code === 0) {
          setShops(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const formatStorage = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatMoney = (amount: number): string => {
    return `¥${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: '正常' },
      SUSPENDED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '暂停' },
      ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-800', label: '归档' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <span>{status}</span>;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
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
              订单数
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              总营收
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              存储用量
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              最后活跃
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {shops.map((shop) => (
            <tr key={shop.shopId} className="hover:bg-slate-50">
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
                {formatMoney(shop.totalRevenue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-900">
                {formatStorage(shop.storageUsage)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {formatDate(shop.lastActiveAt)}
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
  );
}