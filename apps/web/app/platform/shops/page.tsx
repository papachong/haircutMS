'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api/client';

interface ShopListItem {
  id: string;
  name: string;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  staffCount: number;
  memberCount: number;
  licenseStatus: 'FREE' | 'PAID' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res = await apiFetch<{ code: number; data: ShopListResponse; message: string }>(
        `/platform/shops?${params.toString()}`,
      );
      if (res.code === 0) {
        setShops(res.data.data);
        setStats(res.data.stats);
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleSuspend = async (shopId: string) => {
    if (!confirm('确定要暂停该店铺吗？暂停后该店所有员工将无法登录。')) return;
    try {
      const res = await apiFetch<{ code: number; message: string }>(
        `/platform/shops/${shopId}/suspend`,
        { method: 'PATCH' },
      );
      if (res.code === 0) {
        fetchShops();
      } else {
        alert(res.message || '操作失败');
      }
    } catch {
      alert('操作失败');
    }
  };

  const handleActivate = async (shopId: string) => {
    if (!confirm('确定要激活该店铺吗？')) return;
    try {
      const res = await apiFetch<{ code: number; message: string }>(
        `/platform/shops/${shopId}/activate`,
        { method: 'PATCH' },
      );
      if (res.code === 0) {
        fetchShops();
      } else {
        alert(res.message || '操作失败');
      }
    } catch {
      alert('操作失败');
    }
  };

  const handleArchive = async (shopId: string) => {
    if (!confirm('确定要归档该店铺吗？归档后不可恢复。')) return;
    try {
      const res = await apiFetch<{ code: number; message: string }>(
        `/platform/shops/${shopId}/archive`,
        { method: 'PATCH' },
      );
      if (res.code === 0) {
        fetchShops();
      } else {
        alert(res.message || '操作失败');
      }
    } catch {
      alert('操作失败');
    }
  };

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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">店铺管理</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">管理所有租户店铺</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-4 sm:mb-6 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">总店铺数</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
            {stats.total}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">正常营业</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-green-600">
            {stats.active}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">已暂停</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-yellow-600">
            {stats.suspended}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">已归档</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-gray-600">
            {stats.archived}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 rounded-lg border bg-white p-3 sm:p-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索店铺名称/电话/地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 sm:px-4 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 sm:px-4 py-2 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="ACTIVE">正常</option>
          <option value="SUSPENDED">已暂停</option>
          <option value="ARCHIVED">已归档</option>
        </select>
        <Link
          href="/platform/shops/create"
          className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <span>+</span> 创建店铺
        </Link>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                店铺名称
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                联系电话
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                状态
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                License
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                员工数
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                会员数
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                创建时间
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 sm:px-6 py-12 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : shops.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 sm:px-6 py-12 text-center text-gray-500">
                  暂无店铺数据
                </td>
              </tr>
            ) : (
              shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                    {shop.phone || '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[shop.status]}`}
                    >
                      {statusLabels[shop.status]}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${licenseColors[shop.licenseStatus]}`}
                    >
                      {licenseLabels[shop.licenseStatus]}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                    {shop.staffCount}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                    {shop.memberCount}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                    {new Date(shop.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/platform/shops/${shop.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        查看
                      </Link>
                      {shop.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleSuspend(shop.id)}
                          className="text-sm text-yellow-600 hover:text-yellow-800"
                        >
                          暂停
                        </button>
                      )}
                      {shop.status === 'SUSPENDED' && (
                        <button
                          onClick={() => handleActivate(shop.id)}
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          激活
                        </button>
                      )}
                      {shop.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(shop.id)}
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : shops.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无店铺数据</div>
        ) : (
          shops.map((shop) => (
            <div key={shop.id} className="border rounded-lg bg-white p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{shop.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{shop.phone || '-'}</div>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[shop.status]} shrink-0 ml-2`}
                >
                  {statusLabels[shop.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500">License</div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium mt-1 ${licenseColors[shop.licenseStatus]}`}
                  >
                    {licenseLabels[shop.licenseStatus]}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">员工数</div>
                  <div className="font-medium">{shop.staffCount}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">会员数</div>
                  <div className="font-medium">{shop.memberCount}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">创建时间</div>
                  <div className="font-medium text-sm">
                    {new Date(shop.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Link
                  href={`/platform/shops/${shop.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  查看详情
                </Link>
                <div className="flex gap-2">
                  {shop.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleSuspend(shop.id)}
                      className="text-sm text-yellow-600 hover:text-yellow-800"
                    >
                      暂停
                    </button>
                  )}
                  {shop.status === 'SUSPENDED' && (
                    <button
                      onClick={() => handleActivate(shop.id)}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      激活
                    </button>
                  )}
                  {shop.status !== 'ARCHIVED' && (
                    <button
                      onClick={() => handleArchive(shop.id)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      归档
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
