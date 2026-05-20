'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { canAccessRoute } from '@/lib/auth/permissions';

interface RouteGuardProps {
  children: ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { role, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!role) return;

    if (!canAccessRoute(role, pathname)) {
      router.replace('/admin');
    }
  }, [role, pathname, router, isLoading]);

  if (isLoading) return null;

  return <>{children}</>;
}
