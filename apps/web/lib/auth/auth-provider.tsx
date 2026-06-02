'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { StaffRole } from '@/lib/api/staff';
import { hasPermission as checkPermission, type Permission } from './permissions';
import { AuthContext, type AuthData } from './auth-context';

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

  const setAuthData = useCallback((data: AuthData) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('authType', 'shop');
    localStorage.setItem('shopId', data.shopId);
    localStorage.setItem('staffId', data.staffId);
    localStorage.setItem('role', data.role);

    setRole(data.role);
    setStaffId(data.staffId);
    setShopId(data.shopId);
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authType');
    localStorage.removeItem('shopId');
    localStorage.removeItem('staffId');
    localStorage.removeItem('role');

    setRole(null);
    setStaffId(null);
    setShopId(null);
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
        setAuthData,
        clearAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
