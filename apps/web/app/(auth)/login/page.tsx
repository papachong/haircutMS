'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'shop' | 'platform'>('shop');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = loginType === 'shop'
        ? '/api/v1/auth/login'
        : '/api/v1/platform/auth/login';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (data.code !== 0) {
        setError(data.message || 'Login failed');
        return;
      }

      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);

      if (loginType === 'shop') {
        localStorage.setItem('shopId', data.data.shopId);
        localStorage.setItem('role', data.data.role);
        router.push('/admin');
      } else {
        localStorage.setItem('adminId', data.data.adminId);
        localStorage.setItem('role', data.data.role);
        router.push('/platform');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">HaircutMS</h1>
          <p className="mt-1 text-sm text-gray-500">理发店管理系统</p>
        </div>

        {/* Login Type Tabs */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setLoginType('shop')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              loginType === 'shop'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            店铺登录
          </button>
          <button
            type="button"
            onClick={() => setLoginType('platform')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              loginType === 'platform'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            平台登录
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">手机号</label>
            <input
              id="phone" type="tel" value={phone}
              data-testid={`${loginType}-phone-input`}
              onChange={(e) => setPhone(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="请输入手机号" required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">密码</label>
            <input
              id="password" type="password" value={password}
              data-testid={`${loginType}-password-input`}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="请输入密码" required
            />
          </div>
          <button
            type="submit" disabled={loading}
            data-testid={`${loginType}-login-button`}
            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
