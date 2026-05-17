'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  const navItems = [
    { href: '/admin', label: '首页', icon: '📊' },
    { href: '/admin/pos', label: '收银', icon: '💰' },
    { href: '/admin/orders', label: '订单', icon: '📋' },
    { href: '/admin/members', label: '会员', icon: '👥' },
    { href: '/admin/services', label: '服务', icon: '✂️' },
    { href: '/admin/staff', label: '员工', icon: '👤' },
    { href: '/admin/staff-stats', label: '员工统计', icon: '📈' },
    { href: '/admin/settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-56 flex-col border-r bg-card">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold">HaircutMS</span>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
