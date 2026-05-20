'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { Permission } from '@/lib/auth/permissions';

interface RoleGuardProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({ permission, fallback = null, children }: RoleGuardProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
