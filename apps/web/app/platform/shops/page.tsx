'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api/client';

interface ShopListItem {
  id: string;
  name: string;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  staffCount: number;
  memberCount: number;
  licenseStatus: 'FREE' | 'PAID' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

interface ShopListResponse {
  data: ShopListItem[];
  total: number;
  stats: {
    total: number;
    active: number;
    suspended: number;
    archived: number;
  };
}

export default function ShopListPage() {
  const [shops, setShops] = useState<ShopListItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchShops = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiFetch<ShopListResponse>(
        `/platform/shops?${params.toString()}`,
      );
      setShops(res.data);
      setStats(res.stats);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [statusFilter, searchQuery]);

  const statusLabels = {
    ACTIVE: '正常',
    SUSPENDED: '已暂停',
    ARCHIVED: '已归档',
  };

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    SUSPENDED: 'bg-yellow-100 text-yellow-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };

  const licenseLabels = {
    FREE: '免费版',
    PAID: '付费版',
    EXPIRED: '已过期',
  };

  const licenseColors = {
    FREE: 'bg-gray-100 text-gray-600',
    PAID: 'bg-blue-100 text-blue-800',
    EXPIRED: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">店铺管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理所有租户店铺</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm font-medium text-gray-500">总店铺数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats.total}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm font-medium text-gray-500">正常营业</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {stats.active}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm font-medium text-gray-500">已暂停</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600">
            {stats.suspended}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm font-medium text-gray-500">已归档</div>
          <div className="mt-2 text-3xl font-bold text-gray-600">
            {stats.archived}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 rounded-lg border bg-white p-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索店铺名称/电话/地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="ACTIVE">正常</option>
          <option value="SUSPENDED">已暂停</option>
          <option value="ARCHIVED">已归档</option>
        </select>
        <a
          href="/platform/shops/create"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <span>+</span> 创建店铺
        </a>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                店铺名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                联系电话
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                License
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                员工数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                会员数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                创建时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : shops.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  暂无店铺数据
                </td>
              </tr>
            ) : (
              shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {shop.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {shop.phone || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[shop.status]}`}
                    >
                      {statusLabels[shop.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${licenseColors[shop.licenseStatus]}`}
                    >
                      {licenseLabels[shop.licenseStatus]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {shop.staffCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {shop.memberCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(shop.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <a
                        href={`/platform/shops/${shop.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        查看
                      </a>
                      {shop.status === 'ACTIVE' ? (
                        <>
                          <button
                            onClick={async () => {
                              if (!confirm('确定要暂停该店铺吗？')) return;
                              try {
                                await apiFetch(`/platform/shops/${shop.id}/suspend`, {
                                  method: 'PATCH',
                                });
                                fetchShops();
                              } catch (error) {
                                alert('操作失败');
                              }
                            }}
                            className="text-sm text-yellow-600 hover:text-yellow-800"
                          >
                            暂停
                          </button>
                        </>
                      ) : shop.status === 'SUSPENDED' ? (
                        <button
                          onClick={async () => {
                            if (!confirm('确定要激活该店铺吗？')) return;
                            try {
                              await apiFetch(`/platform/shops/${shop.id}/activate`, {
                                method: 'PATCH',
                              });
                              fetchShops();
                            } catch (error) {
                              alert('操作失败');
                            }
                          }}
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          激活
                        </button>
                      ) : null}
                      {shop.status !== 'ARCHIVED' && (
                        <button
                          onClick={async () => {
                            if (!confirm('确定要归档该店铺吗？归档后不可恢复。')) return;
                            try {
                              await apiFetch(`/platform/shops/${shop.id}/archive`, {
                                method: 'PATCH',
                              });
                              fetchShops();
                            } catch (error) {
                              alert('操作失败');
                            }
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          归档
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}