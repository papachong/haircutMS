/**
 * Platform License Management Types
 */

import { LicensePlan } from '@prisma/client';

export interface CreateLicenseDto {
  shopId: string;
  plan: LicensePlan;
  durationMonths: number;
  staffLimit?: number;
  membersLimit?: number;
  modules?: string[];
  features?: Record<string, unknown>;
}

export interface UpdateLicenseDto {
  plan?: LicensePlan;
  durationMonths?: number;
  staffLimit?: number;
  membersLimit?: number;
  modules?: string[];
  features?: Record<string, unknown>;
}

export interface RenewLicenseDto {
  durationMonths: number;
  plan?: LicensePlan;
  staffLimit?: number;
  membersLimit?: number;
  modules?: string[];
  features?: Record<string, unknown>;
}

export interface LicenseListItem {
  id: string;
  shopId: string;
  shopName: string;
  licenseKey: string;
  plan: LicensePlan;
  staffLimit: number;
  membersLimit: number;
  modules: string[];
  expiresAt: Date;
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  issuedAt: Date;
  createdAt: Date;
}

export interface LicenseDetail extends LicenseListItem {
  shop: {
    id: string;
    name: string;
    phone: string | null;
    status: string;
  };
  signature: string;
  features: Record<string, unknown>;
  updatedAt: Date;
}

export interface ExpiringShopItem {
  id: string;
  name: string;
  phone: string | null;
  licensePlan: LicensePlan;
  expiresAt: Date;
  daysUntilExpiry: number;
}

export interface LicenseValidationResult {
  isValid: boolean;
  license: {
    id: string;
    shopId: string;
    plan: LicensePlan;
    staffLimit: number;
    membersLimit: number;
    modules: string[];
    expiresAt: Date;
  } | null;
  error?: string;
}

export interface LicenseIssuedResult {
  licenseKey: string;
  license: LicenseDetail;
}