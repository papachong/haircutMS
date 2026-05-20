'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BottomNav, { shouldHideBottomNav } from '../../components/mobile/bottom-nav';
import OfflineBanner from '../../components/mobile/offline-banner';
import { registerSyncListener } from '../../lib/offline/sync';

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

  // Register offline sync listener
  useEffect(() => {
    const cleanup = registerSyncListener();
    return cleanup;
  }, []);

  if (!ready) return null;

  const hideNav = shouldHideBottomNav(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      {/* Status bar spacer for safe area */}
      <div
        className="h-0 bg-white dark:bg-slate-800"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
      />
      <OfflineBanner />
      <main className={`flex-1 overflow-auto ${hideNav ? '' : 'pb-16'}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
