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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      await apiFetch('/platform/shops', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          businessHours: formData.businessHours || undefined,
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          ownerPassword: formData.ownerPassword,
        }),
      });
      router.push('/platform/shops');
    } catch (err: any) {
      setError(err.message || '创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-2 text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回
        </button>
        <h1 className="text-2xl font-bold text-gray-900">创建新店铺</h1>
        <p className="mt-1 text-sm text-gray-500">创建新店铺并自动生成店主账号</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <h2 className="mb-4 text-lg font-semibold text-gray-900">店铺信息</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                店铺名称 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="请输入店铺名称"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                联系电话
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="请输入联系电话"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                店铺地址
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    businessHours: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例如：09:00-21:00"
              />
            </div>
          </div>

          <h2 className="mt-8 mb-4 text-lg font-semibold text-gray-900">店主账号</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="ownerName"
                className="block text-sm font-medium text-gray-700"
              >
                店主姓名 <span className="text-red-500">*</span>
              </label>
              <input
                id="ownerName"
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) =>
                  setFormData({ ...formData, ownerName: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                onChange={(e) =>
                  setFormData({ ...formData, ownerPhone: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ownerPassword: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="请再次输入密码"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建店铺'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}