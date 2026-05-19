'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/api/client';

export default function CreateShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    businessHours: '',
    ownerName: '',
    ownerPhone: '',
    ownerPassword: '',
    confirmPassword: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('请输入店铺名称');
      return;
    }

    if (!formData.ownerName.trim()) {
      setError('请输入店主姓名');
      return;
    }

    if (!formData.ownerPhone.trim()) {
      setError('请输入店主手机号');
      return;
    }

    if (formData.ownerPassword !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.ownerPassword.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ code: number; data: unknown; message: string }>(
        '/platform/shops',
        {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name.trim(),
            address: formData.address.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            businessHours: formData.businessHours.trim() || undefined,
            ownerName: formData.ownerName.trim(),
            ownerPhone: formData.ownerPhone.trim(),
            ownerPassword: formData.ownerPassword,
          }),
        },
      );
      if (res.code === 0) {
        router.push('/platform/shops');
      } else {
        setError(res.message || '创建失败，请稍后重试');
      }
    } catch {
      setError('创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push('/platform/shops')}
          className="mb-2 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; 返回店铺列表
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">创建新店铺</h1>
        <p className="mt-1 text-sm text-gray-500">
          创建新店铺并自动生成店主账号和初始 License
        </p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
          )}

          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                1
              </span>
              <span className="font-medium text-gray-900">填写店铺信息</span>
            </div>
            <span className="text-gray-300">&rarr;</span>
            <div className="flex items-center gap-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                2
              </span>
              <span className="font-medium text-gray-900">创建店主账号</span>
            </div>
            <span className="text-gray-300">&rarr;</span>
            <div className="flex items-center gap-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-white">
                3
              </span>
              <span>自动创建 License</span>
            </div>
          </div>

          <h2 className="mb-4 text-lg font-semibold text-gray-900">店铺信息</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                店铺名称 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
                placeholder="请输入店铺名称"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                联系电话
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={inputClass}
                placeholder="请输入联系电话"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                店铺地址
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={inputClass}
                placeholder="请输入店铺地址"
              />
            </div>

            <div>
              <label
                htmlFor="businessHours"
                className="block text-sm font-medium text-gray-700"
              >
                营业时间
              </label>
              <input
                id="businessHours"
                type="text"
                value={formData.businessHours}
                onChange={(e) => updateField('businessHours', e.target.value)}
                className={inputClass}
                placeholder="例如：09:00-21:00"
              />
            </div>
          </div>

          <h2 className="mt-8 mb-4 text-lg font-semibold text-gray-900">店主账号</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                店主姓名 <span className="text-red-500">*</span>
              </label>
              <input
                id="ownerName"
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => updateField('ownerName', e.target.value)}
                className={inputClass}
                placeholder="请输入店主姓名"
              />
            </div>

            <div>
              <label
                htmlFor="ownerPhone"
                className="block text-sm font-medium text-gray-700"
              >
                店主手机号 <span className="text-red-500">*</span>
              </label>
              <input
                id="ownerPhone"
                type="tel"
                required
                value={formData.ownerPhone}
                onChange={(e) => updateField('ownerPhone', e.target.value)}
                className={inputClass}
                placeholder="请输入店主手机号（登录账号）"
              />
            </div>

            <div>
              <label
                htmlFor="ownerPassword"
                className="block text-sm font-medium text-gray-700"
              >
                初始密码 <span className="text-red-500">*</span>
              </label>
              <input
                id="ownerPassword"
                type="password"
                required
                minLength={6}
                value={formData.ownerPassword}
                onChange={(e) => updateField('ownerPassword', e.target.value)}
                className={inputClass}
                placeholder="请输入初始密码（至少6位）"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                确认密码 <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                className={inputClass}
                placeholder="请再次输入密码"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/platform/shops')}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建店铺'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
