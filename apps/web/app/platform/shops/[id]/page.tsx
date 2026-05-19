'use client';

import { useEffect, useState, useCallback } from 'react';
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
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
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
    expiresAt: string | null;
    isExpired: boolean;
  };
}

interface EditFormData {
  name: string;
  phone: string;
  address: string;
  businessHours: string;
}

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    phone: '',
    address: '',
    businessHours: '',
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchShop = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ code: number; data: ShopDetail; message: string }>(
        \`/platform/shops/\${params.id}\`,
      );
      if (res.code === 0) {
        const detail = res.data;
        setShop(detail);
        setEditForm({
          name: detail.name,
          phone: detail.phone || '',
          address: detail.address || '',
          businessHours: detail.businessHours || '',
        });
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true);
    setEditError('');
    try {
      const res = await apiFetch<{ code: number; data: ShopDetail; message: string }>(
        \`/platform/shops/\${shop.id}\`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: editForm.name || undefined,
            phone: editForm.phone || undefined,
            address: editForm.address || undefined,
            businessHours: editForm.businessHours || undefined,
          }),
        },
      );
      if (res.code === 0) {
        setShop(res.data);
        setEditing(false);
      } else {
        setEditError(res.message || '保存失败');
      }
    } catch {
      setEditError('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!shop) return;
    if (!confirm('确定要暂停该店铺吗？暂停后该店所有员工将无法登录。')) return;
    try {
      const res = await apiFetch<{ code: number; data: ShopDetail; message: string }>(
        \`/platform/shops/\${shop.id}/suspend\`,
        { method: 'PATCH' },
      );
      if (res.code === 0) {
        setShop(res.data);
      }
    } catch {
      alert('操作失败');
    }
  };

  const handleActivate = async () => {
    if (!shop) return;
    if (!confirm('确定要激活该店铺吗？')) return;
    try {
      const res = await apiFetch<{ code: number; data: ShopDetail; message: string }>(
        \`/platform/shops/\${shop.id}/activate\`,
        { method: 'PATCH' },
      );
      if (res.code === 0) {
        setShop(res.data);
      }
    } catch {
      alert('操作失败');
    }
  };

  const handleArchive = async () => {
    if (!shop) return;
    if (!confirm('确定要归档该店铺吗？归档后不可恢复。')) return;
    try {
      const res = await apiFetch<{ code: number; data: ShopDetail; message: string }>(
        \`/platform/shops/\${shop.id}/archive\`,
        { method: 'PATCH' },
      );
      if (res.code === 0) {
        setShop(res.data);
      }
    } catch {
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
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-gray-500">店铺不存在</div>
        <button
          onClick={() => router.push('/platform/shops')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          返回店铺列表
        </button>
      </div>
    );
  }

  const statusLabels = {
    ACTIVE: '正常营业',
    SUSPENDED: '已暂停',
    ARCHIVED: '已归档',
  };

  const statusColors = {
    ACTIVE: 'bg-green-50 border-green-200 text-green-800',
    SUSPENDED: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    ARCHIVED: 'bg-gray-50 border-gray-200 text-gray-800',
  };

  const licenseLabels: Record<string, string> = {
    FREE: '免费版',
    PRO: '专业版',
    ENTERPRISE: '企业版',
    PAID: '付费版',
  };

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/platform/shops')}
            className="mb-2 text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; 返回店铺列表
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{shop.name}</h1>
          <p className="mt-1 text-sm text-gray-500">ID: {shop.id}</p>
        </div>
        <div className="flex gap-3 shrink-0">
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
      <div className={\`mb-6 rounded-lg border p-4 \${statusColors[shop.status]}\`}>
        <div>
          <span className="font-semibold">{statusLabels[shop.status]}</span>
          {shop.status === 'SUSPENDED' && (
            <p className="mt-1 text-sm opacity-80">
              该店铺已被暂停，所有员工无法登录系统。点击「激活店铺」可恢复正常。
            </p>
          )}
          {shop.status === 'ARCHIVED' && (
            <p className="mt-1 text-sm opacity-80">
              该店铺已被归档，所有数据保留但无法操作。归档操作不可恢复。
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info - Editable */}
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                编辑
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditError('');
                    setEditForm({
                      name: shop.name,
                      phone: shop.phone || '',
                      address: shop.address || '',
                      businessHours: shop.businessHours || '',
                    });
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            )}
          </div>

          {editError && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {editError}
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  店铺名称
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  店铺地址
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  营业时间
                </label>
                <input
                  type="text"
                  value={editForm.businessHours}
                  onChange={(e) =>
                    setEditForm({ ...editForm, businessHours: e.target.value })
                  }
                  className={inputClass}
                  placeholder="例如：09:00-21:00"
                />
              </div>
            </div>
          ) : (
            <dl className="space-y-4">
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
            </dl>
          )}
        </div>

        {/* Statistics */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">运营数据</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{shop.staffCount}</div>
              <div className="text-sm text-blue-600 mt-1">员工数</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{shop.memberCount}</div>
              <div className="text-sm text-green-600 mt-1">会员数</div>
            </div>
          </div>
          <dl className="mt-4 space-y-3">
            {shop.lastActiveAt && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">最近活跃</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(shop.lastActiveAt).toLocaleString('zh-CN')}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">店铺状态</dt>
              <dd>
                <span
                  className={\`inline-flex rounded-full px-2.5 py-1 text-xs font-medium \${
                    shop.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : shop.status === 'SUSPENDED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }\`}
                >
                  {statusLabels[shop.status]}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* License Info */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">License 信息</h2>
          <div className="mb-4">
            <span
              className={\`inline-flex rounded-full px-3 py-1 text-sm font-medium \${
                shop.license.isExpired
                  ? 'bg-red-100 text-red-800'
                  : shop.licenseStatus === 'FREE'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-100 text-blue-800'
              }\`}
            >
              {licenseLabels[shop.license.plan] || shop.license.plan}
              {shop.license.isExpired ? ' (已过期)' : ''}
            </span>
          </div>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">当前版本</dt>
              <dd className="text-sm font-medium text-gray-900">
                {licenseLabels[shop.license.plan] || shop.license.plan}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">员工上限</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.license.staffLimit} 人
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">会员上限</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shop.license.membersLimit} 人
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
                  className={\`inline-flex rounded-full px-2 py-1 text-xs font-medium \${
                    shop.license.isExpired
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }\`}
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
              <dd className="text-sm font-medium text-gray-900">{shop.owner.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">手机号</dt>
              <dd className="text-sm font-medium text-gray-900">{shop.owner.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">账号状态</dt>
              <dd>
                <span
                  className={\`inline-flex rounded-full px-2 py-1 text-xs font-medium \${
                    shop.owner.isActive && shop.status !== 'SUSPENDED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }\`}
                >
                  {shop.status === 'SUSPENDED'
                    ? '无法登录（店铺已暂停）'
                    : shop.owner.isActive
                      ? '正常'
                      : '已停用'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
