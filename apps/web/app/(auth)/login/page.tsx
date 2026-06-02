'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { setAuthData } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (data.code !== 0) {
        setError(data.message || '登录失败');
        return;
      }

      setAuthData({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        shopId: data.data.shopId,
        staffId: data.data.staffId,
        role: data.data.role,
      });
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      router.push(isMobile ? '/m/dashboard' : '/admin');
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">HaircutMS</h1>
          <p className="mt-1 text-sm text-gray-500">理发店管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">手机号</label>
            <input
              id="phone" type="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="请输入手机号" required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">密码</label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="请输入密码" required
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-gray-500">
            还没有店铺？<a href="/register" className="text-blue-600 hover:underline">免费注册</a>
          </p>
        </form>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400 space-y-1">
        <p>
          儒虎智能科技（北京）有限公司 |
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">京ICP备2025154066号-1</a> |
          <a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11011402055127" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">京公网安备11011402055127号</a>
        </p>
        <p>Copyright &copy; 2024-2025 Ruhoo AI. All Rights Reserved. 儒虎智能科技 版权所有</p>
      </footer>
    </div>
  );
}
