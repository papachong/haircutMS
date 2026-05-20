import type { StaffRole } from '@/lib/api/staff';

export type Permission =
  | 'dashboard:view'
  | 'pos:access'
  | 'orders:view'
  | 'orders:manage'
  | 'members:view'
  | 'members:create'
  | 'members:edit'
  | 'members:export'
  | 'members:analytics'
  | 'staff:view'
  | 'staff:manage'
  | 'staff-stats:view'
  | 'services:manage'
  | 'settings:view'
  | 'settings:manage'
  | 'revenue:view'
  | 'audit:view';

const ALL_PERMISSIONS: Permission[] = [
  'dashboard:view',
  'pos:access',
  'orders:view',
  'orders:manage',
  'members:view',
  'members:create',
  'members:edit',
  'members:export',
  'members:analytics',
  'staff:view',
  'staff:manage',
  'staff-stats:view',
  'services:manage',
  'settings:view',
  'settings:manage',
  'revenue:view',
  'audit:view',
];

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  OWNER: [...ALL_PERMISSIONS],
  MANAGER: [
    'dashboard:view',
    'pos:access',
    'orders:view',
    'orders:manage',
    'members:view',
    'members:create',
    'members:edit',
    'members:export',
    'members:analytics',
    'staff:view',
    'staff-stats:view',
    'services:manage',
    'settings:view',
    'revenue:view',
    'audit:view',
  ],
  RECEPTIONIST: [
    'dashboard:view',
    'pos:access',
    'members:view',
    'members:create',
    'orders:view',
    'staff-stats:view',
  ],
  STYLIST: [
    'dashboard:view',
    'pos:access',
    'orders:view',
    'staff-stats:view',
    'members:view',
  ],
  TECHNICIAN: [
    'dashboard:view',
    'pos:access',
    'orders:view',
    'staff-stats:view',
    'members:view',
  ],
};

export function hasPermission(role: StaffRole | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

interface RoutePermission {
  prefix: string;
  permission: Permission;
  exact?: boolean;
}

const ROUTE_PERMISSIONS: RoutePermission[] = [
  { prefix: '/admin', permission: 'dashboard:view', exact: true },
  { prefix: '/admin/pos', permission: 'pos:access' },
  { prefix: '/admin/orders', permission: 'orders:view' },
  { prefix: '/admin/members/analytics', permission: 'members:analytics' },
  { prefix: '/admin/members', permission: 'members:view' },
  { prefix: '/admin/revenue-analytics', permission: 'revenue:view' },
  { prefix: '/admin/staff-stats', permission: 'staff-stats:view' },
  { prefix: '/admin/staff', permission: 'staff:view' },
  { prefix: '/admin/settings', permission: 'settings:view' },
];

export function canAccessRoute(role: StaffRole | null, route: string): boolean {
  if (!role) return false;

  // Sort by longest prefix first to match most specific route
  const sorted = [...ROUTE_PERMISSIONS].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );

  for (const { prefix, permission, exact } of sorted) {
    const matches = exact ? route === prefix : route.startsWith(prefix);
    if (matches) {
      return hasPermission(role, permission);
    }
  }

  return true;
}

export function getAllowedRoutes(role: StaffRole): string[] {
  return ROUTE_PERMISSIONS
    .filter((rp) => hasPermission(role, rp.permission))
    .map((rp) => rp.prefix);
}
