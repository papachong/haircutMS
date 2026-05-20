'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission, type Permission } from '@/lib/auth/permissions';
import { RouteGuard } from '@/components/auth/route-guard';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission: Permission;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: '首页', icon: '📊', permission: 'dashboard:view' },
  { href: '/admin/pos', label: '收银', icon: '💰', permission: 'pos:access' },
  { href: '/admin/orders', label: '订单', icon: '📋', permission: 'orders:view' },
  { href: '/admin/members', label: '会员', icon: '👥', permission: 'members:view' },
  { href: '/admin/revenue-analytics', label: '收入分析', icon: '💵', permission: 'revenue:view' },
  { href: '/admin/members/analytics', label: '会员分析', icon: '📈', permission: 'members:analytics' },
  { href: '/admin/settings/services', label: '服务', icon: '✂️', permission: 'services:manage' },
  { href: '/admin/staff', label: '员工', icon: '👤', permission: 'staff:view' },
  { href: '/admin/staff-stats', label: '员工统计', icon: '📈', permission: 'staff-stats:view' },
  { href: '/admin/settings/recharge', label: '充值方案', icon: '💳', permission: 'settings:view' },
  { href: '/admin/settings', label: '设置', icon: '⚙️', permission: 'settings:view' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuth();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => role && hasPermission(role, item.permission),
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-card transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-semibold">HaircutMS</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-accent rounded"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex h-14 items-center justify-between border-b bg-card px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-accent rounded"
          >
            ☰
          </button>
          <span className="font-semibold">HaircutMS</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-auto">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </main>
    </div>
  );
}
