'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/api/client';

interface ShopDetail {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  businessHours: string | null;
  logo: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  staffCount: number;
  memberCount: number;
  licenseStatus: 'FREE' | 'PAID' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date | null;
  owner: {
    id: string;
    name: string;
    phone: string;
    isActive: boolean;
  };
  license: {
    plan: string;
    staffLimit: number;
    membersLimit: number;
    expiresAt: Date | null;
    isExpired: boolean;
  };
}

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<ShopDetail>(`/platform/shops/${params.id}`);
        setShop(res);
      } catch (error) {
        console.error('Failed to fetch shop:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [params.id]);

  const handleSuspend = async () => {
    if (!shop) return;
    if (!confirm('确定要暂停该店铺吗？')) return;
    try {
      await apiFetch(`/platform/shops/${shop.id}/suspend`, {
        method: 'PATCH',
      });
      window.location.reload();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleActivate = async () => {
    if (!shop) return;
    if (!confirm('确定要激活该店铺吗？')) return;
    try {
      await apiFetch(`/platform/shops/${shop.id}/activate`, {
        method: 'PATCH',
      });
      window.location.reload();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleArchive = async () => {
    if (!shop) return;
    if (!confirm('确定要归档该店铺吗？归档后不可恢复。')) return;
    try {
      await apiFetch(`/platform/shops/${shop.id}/archive`, {
        method: 'PATCH',
      });
      window.location.reload();
    } catch (error) {
      alert('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">店铺不存在</div>
      </div>
    );
  }

  const statusLabels = {
    ACTIVE: '正常营业',
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
    PRO: '专业版',
    ENTERPRISE: '企业版',
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
        </div>
        <div className="flex gap-3">
          {shop.status === 'ACTIVE' && (
            <button
              onClick={handleSuspend}
              className="rounded-md border border-yellow-600 px-4 py-2 text-sm font-medium text-yellow-600 transition-colors hover:bg-yellow-50"
            >
              暂停店铺
            </button>
          )}
          {shop.status === 'SUSPENDED' && (
            <button
              onClick={handleActivate}
              className="rounded-md border border-green-600 px-4 py-2 text-sm font-medium text-green-600 transition-colors hover:bg-green-50"
            >
              激活店铺
            </button>
          )}
          {shop.status !== 'ARCHIVED' && (
            <button
              onClick={handleArchive}
              className="rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              归档店铺
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 rounded-lg border p-4 ${statusColors[shop.status]}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{statusLabels[shop.status]}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">基本信息</h2>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">店铺ID</dt>
              <dd className="text-sm font-medium text-gray-900">{shop.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">店铺名称</dt>
              <dd className="text-sm font-medium text-gray-900">{shop.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">联系电话</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.phone || '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">地址</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.address || '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">营业时间</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.businessHours || '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">创建时间</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(shop.createdAt).toLocaleString('zh-CN')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">最近更新</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(shop.updatedAt).toLocaleString('zh-CN')}
              </dd>
            </div>
            {shop.lastActiveAt && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">最近活跃</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(shop.lastActiveAt).toLocaleString('zh-CN')}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Statistics */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">统计数据</h2>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">员工数量</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.staffCount} 人
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">会员数量</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.memberCount} 人
              </dd>
            </div>
          </dl>
        </div>

        {/* License Info */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">License 信息</h2>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">当前版本</dt>
              <dd className="text-sm font-medium text-gray-900">
                {licenseLabels[shop.license.plan as keyof typeof licenseLabels] ||
                  shop.license.plan}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">员工上限</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.license.staffLimit === Infinity ? '无限制' : shop.license.staffLimit}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">会员上限</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.license.membersLimit === Infinity ? '无限制' : shop.license.membersLimit}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">到期时间</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.license.expiresAt
                  ? new Date(shop.license.expiresAt).toLocaleDateString('zh-CN')
                  : '永久'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">License 状态</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    shop.license.isExpired
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {shop.license.isExpired ? '已过期' : '正常'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Owner Info */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">店主信息</h2>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">姓名</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.owner.name}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">手机号</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.owner.phone}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">状态</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    shop.owner.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {shop.owner.isActive ? '正常' : '已停用'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}