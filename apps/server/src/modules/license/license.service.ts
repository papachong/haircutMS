import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  LicenseInfo,
  LicensePlanType,
  PLAN_DEFAULTS,
} from './license.types';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class LicenseService {
  private readonly logger = new Logger(LicenseService.name);
  private cache = new Map<string, { info: LicenseInfo; fetchedAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get license info for a shop. Returns default FREE plan if no license exists.
   * Results are cached for 5 minutes.
   */
  async getLicenseInfo(shopId: string): Promise<LicenseInfo> {
    const cached = this.cache.get(shopId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.info;
    }

    const info = await this.fetchLicense(shopId);
    this.cache.set(shopId, { info, fetchedAt: Date.now() });
    return info;
  }

  /**
   * Force-refresh the cached license for a shop (e.g. after update).
   */
  async refreshLicense(shopId: string): Promise<LicenseInfo> {
    const info = await this.fetchLicense(shopId);
    this.cache.set(shopId, { info, fetchedAt: Date.now() });
    return info;
  }

  /**
   * Check whether a specific module is accessible for the given shop.
   */
  async isModuleAllowed(shopId: string, module: string): Promise<boolean> {
    const license = await this.getLicenseInfo(shopId);
    return (license.modules as string[]).includes(module);
  }

  /**
   * Check whether the staff count is within the licensed limit.
   */
  async isStaffLimitOk(shopId: string): Promise<boolean> {
    const license = await this.getLicenseInfo(shopId);
    const count = await this.prisma.staff.count({
      where: { shopId, isActive: true },
    });
    return count < license.staffLimit;
  }

  /**
   * Check whether the member count is within the licensed limit.
   */
  async isMembersLimitOk(shopId: string): Promise<boolean> {
    const license = await this.getLicenseInfo(shopId);
    const count = await this.prisma.member.count({
      where: { shopId, isActive: true },
    });
    return count < license.membersLimit;
  }

  private async fetchLicense(shopId: string): Promise<LicenseInfo> {
    const license = await this.prisma.license.findUnique({
      where: { shopId },
    });

    if (!license) {
      this.logger.warn(`No license found for shop ${shopId}, falling back to FREE plan`);
      const defaults = PLAN_DEFAULTS[LicensePlanType.FREE];
      return {
        id: '',
        shopId,
        plan: LicensePlanType.FREE,
        staffLimit: defaults.staffLimit,
        membersLimit: defaults.membersLimit,
        modules: defaults.modules,
        expiresAt: new Date('2099-12-31'),
        isExpired: false,
      };
    }

    const isExpired = license.expiresAt < new Date();
    const plan = license.plan as LicensePlanType;
    const defaults = PLAN_DEFAULTS[plan] ?? PLAN_DEFAULTS[LicensePlanType.FREE];

    return {
      id: license.id,
      shopId: license.shopId,
      plan,
      staffLimit: license.staffLimit ?? defaults.staffLimit,
      membersLimit: license.membersLimit ?? defaults.membersLimit,
      modules: (license.modules as string[]) ?? defaults.modules,
      expiresAt: license.expiresAt,
      isExpired,
    };
  }
}
