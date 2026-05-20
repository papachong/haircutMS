'use client';

import { usePathname } from 'next/navigation';
import {
  Home,
  Calculator,
  Users,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission, type Permission } from '@/lib/auth/permissions';

interface NavTab {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  matchPrefix?: boolean;
  permission: Permission;
}

const ALL_TABS: NavTab[] = [
  {
    href: '/m/dashboard',
    label: '首页',
    icon: <Home className="w-5 h-5" />,
    activeIcon: <Home className="w-5 h-5" strokeWidth={2.5} />,
    permission: 'dashboard:view',
  },
  {
    href: '/m/pos',
    label: '收银',
    icon: <Calculator className="w-5 h-5" />,
    activeIcon: <Calculator className="w-5 h-5" strokeWidth={2.5} />,
    matchPrefix: true,
    permission: 'pos:access',
  },
  {
    href: '/m/members',
    label: '会员',
    icon: <Users className="w-5 h-5" />,
    activeIcon: <Users className="w-5 h-5" strokeWidth={2.5} />,
    matchPrefix: true,
    permission: 'members:view',
  },
  {
    href: '/m/analytics',
    label: '分析',
    icon: <BarChart3 className="w-5 h-5" />,
    activeIcon: <BarChart3 className="w-5 h-5" strokeWidth={2.5} />,
    permission: 'dashboard:view',
  },
];

// Paths where bottom nav should be hidden
const HIDDEN_PATHS = ['/m/pos', '/m/pos-holds'];

interface BottomNavProps {
  forceHide?: boolean;
}

export function shouldHideBottomNav(pathname: string): boolean {
  return HIDDEN_PATHS.some((p) => pathname.startsWith(p));
}

export default function BottomNav({ forceHide }: BottomNavProps) {
  const pathname = usePathname();
  const { role } = useAuth();

  const tabs = role
    ? ALL_TABS.filter((tab) => hasPermission(role, tab.permission))
    : ALL_TABS;

  if (forceHide || shouldHideBottomNav(pathname)) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-700/80 md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = tab.matchPrefix
            ? pathname.startsWith(tab.href)
            : pathname === tab.href;

          return (
            <a
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-400'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`flex items-center justify-center w-10 h-6 rounded-full transition-all ${
                  isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                {isActive ? tab.activeIcon : tab.icon}
              </div>
              <span
                className={`text-[10px] font-semibold leading-none ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                {tab.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
