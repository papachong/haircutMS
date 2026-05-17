'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PlatformUser {
  type: 'platform';
  adminId: string;
  role: string;
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.type !== 'platform') {
        router.replace('/admin');
        return;
      }
    } catch {
      router.replace('/login');
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) return null;

  const navItems = [
    { href: '/platform', label: '首页', icon: '📊' },
    { href: '/platform/shops', label: '店铺管理', icon: '🏪' },
    { href: '/platform/licenses', label: 'License 管理', icon: '🔑' },
    { href: '/platform/admins', label: '管理员', icon: '👤' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden md:flex w-64 flex-col border-r bg-white">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-xl font-bold text-gray-900">HaircutMS 平台</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}