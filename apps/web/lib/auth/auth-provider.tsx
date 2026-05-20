'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { StaffRole } from '@/lib/api/staff';
import { hasPermission as checkPermission, type Permission } from './permissions';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setRole(localStorage.getItem('role') as StaffRole | null);
    setStaffId(localStorage.getItem('staffId'));
    setShopId(localStorage.getItem('shopId'));
    setIsLoading(false);
  }, []);

  const hasPermissionFn = (permission: Permission): boolean => {
    return checkPermission(role, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        staffId,
        shopId,
        isLoading,
        hasPermission: hasPermissionFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
