'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { platformApiFetch } from '@/lib/api/platform-services';

interface ShopOwner {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
}

interface ShopLicense {
  plan: string;
  staffLimit: number;
  membersLimit: number;
  expiresAt: string | null;
  isExpired: boolean;
}

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
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
  owner: ShopOwner;
  license: ShopLicense;
}

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.id as string;

  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShop();
  }, [shopId]);

  async function loadShop() {
    try {
      setLoading(true);
      const res = await platformApiFetch<ShopDetail>(`/shops/${shopId}`);
      if (res.code === 0) {
        setShop(res.data);
      } else {
        setError(res.message || '加载失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  const statusConfig = {
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: '正常营业' },
    SUSPENDED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '已暂停' },
    ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-800', label: '已归档' },
  };

  const licenseConfig = {
    FREE: { bg: 'bg-gray-100', text: 'text-gray-600', label: '免费版' },
    PAID: { bg: 'bg-blue-100', text: 'text-blue-800', label: '付费版' },
    EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', label: '已过期' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; 返回列表
        </button>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error || '店铺不存在'}</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[shop.status] || statusConfig.ACTIVE;
  const license = licenseConfig[shop.licenseStatus] || licenseConfig.FREE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; 返回列表
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
        <div className="flex gap-2">
          {shop.status === 'ACTIVE' && (
            <button className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100">
              暂停店铺
            </button>
          )}
          {shop.status === 'SUSPENDED' && (
            <button className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
              恢复店铺
            </button>
          )}
          {shop.status !== 'ARCHIVED' && (
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100">
              归档
            </button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">基本信息</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">店铺名称</dt>
              <dd className="text-sm font-medium text-gray-900">{shop.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">联系电话</dt>
              <dd className="text-sm text-gray-900">{shop.phone || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">地址</dt>
              <dd className="text-sm text-gray-900">{shop.address || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">营业时间</dt>
              <dd className="text-sm text-gray-900">{shop.businessHours || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">创建时间</dt>
              <dd className="text-sm text-gray-900">
                {new Date(shop.createdAt).toLocaleDateString('zh-CN')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">最后活跃</dt>
              <dd className="text-sm text-gray-900">
                {shop.lastActiveAt
                  ? new Date(shop.lastActiveAt).toLocaleDateString('zh-CN')
                  : '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Owner Info */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">店主信息</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">姓名</dt>
              <dd className="text-sm font-medium text-gray-900">{shop.owner.name || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">手机号</dt>
              <dd className="text-sm text-gray-900">{shop.owner.phone || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">账号状态</dt>
              <dd>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${shop.owner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {shop.owner.isActive ? '正常' : '已禁用'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">员工数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{shop.staffCount}</p>
          <p className="text-xs text-gray-400 mt-1">上限 {shop.license.staffLimit}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">会员数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{shop.memberCount}</p>
          <p className="text-xs text-gray-400 mt-1">上限 {shop.license.membersLimit}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">License</p>
          <p className="mt-1">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${license.bg} ${license.text}`}>
              {license.label}
            </span>
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">到期时间</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {shop.license.expiresAt
              ? new Date(shop.license.expiresAt).toLocaleDateString('zh-CN')
              : '-'}
          </p>
          {shop.license.isExpired && (
            <p className="text-xs text-red-500 mt-1">已过期</p>
          )}
        </div>
      </div>

      {/* License Link */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">授权管理</h2>
            <p className="text-sm text-gray-500 mt-1">
              当前方案: {shop.license.plan} · 员工上限 {shop.license.staffLimit} · 会员上限 {shop.license.membersLimit}
            </p>
          </div>
          <Link
            href={`/platform/licenses/${shop.id}`}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            管理授权
          </Link>
        </div>
      </div>
    </div>
  );
}
