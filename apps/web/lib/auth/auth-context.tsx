'use client';

import { createContext, useContext } from 'react';
import type { StaffRole } from '@/lib/api/staff';
import type { Permission } from './permissions';

export interface AuthContextValue {
  role: StaffRole | null;
  staffId: string | null;
  shopId: string | null;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  role: null,
  staffId: null,
  shopId: null,
  isLoading: true,
  hasPermission: () => false,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
