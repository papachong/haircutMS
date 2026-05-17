/**
 * License plan tiers with their default quotas.
 */
export enum LicensePlanType {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * All available license module identifiers.
 */
export enum LicenseModuleId {
  POS = 'pos',
  MEMBER = 'member',
  SERVICE = 'service',
  STAFF = 'staff',
  ORDER = 'order',
  REPORT = 'report',
  ANALYTICS = 'analytics',
  COUPON = 'coupon',
  MARKETING = 'marketing',
  INVENTORY = 'inventory',
}

/** Modules available on the FREE plan */
export const FREE_PLAN_MODULES: string[] = [
  LicenseModuleId.POS,
  LicenseModuleId.MEMBER,
  LicenseModuleId.SERVICE,
];

/** Default plan quotas */
export const PLAN_DEFAULTS: Record<
  LicensePlanType,
  { staffLimit: number; membersLimit: number; modules: string[] }
> = {
  [LicensePlanType.FREE]: {
    staffLimit: 2,
    membersLimit: 200,
    modules: FREE_PLAN_MODULES,
  },
  [LicensePlanType.PRO]: {
    staffLimit: 10,
    membersLimit: 1000,
    modules: Object.values(LicenseModuleId),
  },
  [LicensePlanType.ENTERPRISE]: {
    staffLimit: Infinity,
    membersLimit: Infinity,
    modules: Object.values(LicenseModuleId),
  },
};

/** Modules that remain accessible even when the license is expired */
export const EXPIRY_SAFE_MODULES: string[] = [LicenseModuleId.POS];

export interface LicenseInfo {
  id: string;
  shopId: string;
  plan: LicensePlanType;
  staffLimit: number;
  membersLimit: number;
  modules: string[];
  expiresAt: Date;
  isExpired: boolean;
}
