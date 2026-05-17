'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
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

  const tabs = [
    { href: '/m/pos', label: '收银', icon: '💰' },
    { href: '/m/members', label: '会员', icon: '👥' },
    { href: '/m/orders', label: '挂单', icon: '📋' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 overflow-auto pb-16">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 flex border-t bg-card md:hidden">
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center py-2 text-xs ${
              pathname === tab.href ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
