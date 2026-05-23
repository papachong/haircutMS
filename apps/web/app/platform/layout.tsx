'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface PlatformUser {
  type: 'platform';
  adminId: string;
  role: string;
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const authType = localStorage.getItem('authType');
    const token = localStorage.getItem('accessToken');

    if (pathname === '/platform/login') {
      setReady(true);
    } else if (!token || authType !== 'platform') {
      router.replace('/platform/login');
    } else {
      setReady(true);
    }
    setLoading(false);
  }, [router, pathname]);

  if (loading) return null;

  if (!ready) return null;

  const navItems = [
    { href: '/platform', label: '首页', icon: '📊' },
    { href: '/platform/overview', label: '数据总览', icon: '📈' },
    { href: '/platform/shops', label: '店铺管理', icon: '🏪' },
    { href: '/platform/licenses', label: 'License 管理', icon: '🔑' },
    { href: '/platform/admins', label: '管理员', icon: '👤' },
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
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-6">
          <span className="font-semibold text-lg truncate">HaircutMS 平台</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-slate-800 rounded"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
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

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="bg-white border-b border-slate-200 h-14 md:h-16 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-slate-100 rounded"
            >
              ☰
            </button>
            <h2 className="text-base md:text-lg font-semibold text-slate-900 truncate">
              {navItems.find((item) => item.href === pathname)?.label || '平台管理'}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-xs md:text-sm text-slate-600 truncate hidden sm:block">
              角色: {localStorage.getItem('role') || 'ADMIN'}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}