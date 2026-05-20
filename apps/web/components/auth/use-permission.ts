'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { canAccessRoute } from '@/lib/auth/permissions';
import type { Permission } from '@/lib/auth/permissions';

export function usePermission() {
  const { role, hasPermission } = useAuth();

  return {
    role,
    hasPermission,
    canAccess: (route: string) => canAccessRoute(role, route),
  };
}
