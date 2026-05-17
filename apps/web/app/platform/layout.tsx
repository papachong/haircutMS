'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authType = localStorage.getItem('authType');
    const token = localStorage.getItem('accessToken');

    if (!token || authType !== 'platform') {
      router.replace('/platform/login');
    } else {
      setReady(true);
    }
    setLoading(false);
  }, [router]);

  if (loading) return null;

  if (!ready) return null;

  const navItems = [
    { href: '/platform/dashboard', label: '仪表盘', icon: '📊' },
    { href: '/platform/shops', label: '店铺管理', icon: '🏪' },
    { href: '/platform/admins', label: '管理员', icon: '👤' },
    { href: '/platform/settings', label: '系统设置', icon: '⚙️' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authType');
    localStorage.removeItem('adminId');
    localStorage.removeItem('role');
    router.push('/platform/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white">
        <div className="flex h-16 items-center border-b border-slate-700 px-6">
          <span className="font-semibold text-lg">HaircutMS 平台</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span className="text-lg">🚪</span>
            退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {navItems.find((item) => item.href === pathname)?.label || '平台管理'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              角色: {localStorage.getItem('role') || 'ADMIN'}
            </span>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}