/**
 * Platform License Management Service
 * Handles license distribution, RSA signing, expiry warnings, and renewals
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LicensePlan } from '@prisma/client';
import * as crypto from 'crypto';
import type {
  CreateLicenseDto,
  UpdateLicenseDto,
  RenewLicenseDto,
  LicenseListItem,
  LicenseDetail,
  ExpiringShopItem,
  LicenseIssuedResult,
  LicenseValidationResult,
} from './platform-license.types';
import {
  PLAN_DEFAULTS,
  LicensePlanType,
  FREE_PLAN_MODULES,
} from '../../license/license.types';

// Re-export DTO types for use in controller
export type { CreateLicenseDto, UpdateLicenseDto, RenewLicenseDto };

const EXPIRY_WARNING_DAYS = 15;

@Injectable()
export class PlatformLicenseService {
  private readonly logger = new Logger(PlatformLicenseService.name);

  // RSA key pair for license signing
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor(private readonly prisma: PrismaService) {
    // Generate or load RSA key pair for license signing
    // In production, these should be loaded from secure storage
    this.privateKey = process.env.LICENSE_PRIVATE_KEY || this.generatePrivateKey();
    this.publicKey = process.env.LICENSE_PUBLIC_KEY || this.getPublicKeyFromPrivate();

    if (!process.env.LICENSE_PRIVATE_KEY) {
      this.logger.warn('Using generated RSA keys. Set LICENSE_PRIVATE_KEY env var for production.');
    }
  }

  /**
   * Get all licenses with shop information
   */
  async findAll(): Promise<LicenseListItem[]> {
    const licenses = await this.prisma.license.findMany({
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { expiresAt: 'asc' },
    });

    const now = new Date();

    return licenses.map((license: any) => {
      const expiresAt = new Date(license.expiresAt);
      const daysUntilExpiry = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const isExpiringSoon = daysUntilExpiry <= EXPIRY_WARNING_DAYS && daysUntilExpiry > 0;
      const isExpired = daysUntilExpiry <= 0;

      let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
      if (isExpired) {
        status = 'EXPIRED';
      } else if (isExpiringSoon) {
        status = 'EXPIRING_SOON';
      }

      return {
        id: license.id,
        shopId: license.shopId,
        shopName: license.shop.name,
        licenseKey: license.licenseKey,
        plan: license.plan as LicensePlan,
        staffLimit: license.staffLimit,
        membersLimit: license.membersLimit,
        modules: license.modules as string[],
        expiresAt: license.expiresAt,
        daysUntilExpiry,
        isExpiringSoon,
        isExpired,
        status,
        issuedAt: license.issuedAt,
        createdAt: license.createdAt,
      };
    });
  }

  /**
   * Get license detail by ID
   */
  async findById(id: string): Promise<LicenseDetail> {
    const license = await this.prisma.license.findUnique({
      where: { id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    const now = new Date();
    const expiresAt = new Date(license.expiresAt);
    const daysUntilExpiry = Math.floor(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isExpiringSoon = daysUntilExpiry <= EXPIRY_WARNING_DAYS && daysUntilExpiry > 0;
    const isExpired = daysUntilExpiry <= 0;

    let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
    if (isExpired) {
      status = 'EXPIRED';
    } else if (isExpiringSoon) {
      status = 'EXPIRING_SOON';
    }

    // Fetch usage stats for this shop
    const [currentStaffCount, currentMembersCount] = await Promise.all([
      this.prisma.staff.count({ where: { shopId: license.shopId, isActive: true } }),
      this.prisma.member.count({ where: { shopId: license.shopId, isActive: true } }),
    ]);

    return {
      id: license.id,
      shopId: license.shopId,
      shopName: license.shop.name,
      licenseKey: license.licenseKey,
      plan: license.plan as LicensePlan,
      staffLimit: license.staffLimit,
      membersLimit: license.membersLimit,
      modules: license.modules as string[],
      expiresAt: license.expiresAt,
      daysUntilExpiry,
      isExpiringSoon,
      isExpired,
      status,
      issuedAt: license.issuedAt,
      createdAt: license.createdAt,
      shop: license.shop,
      signature: license.signature,
      features: license.features as Record<string, unknown>,
      updatedAt: license.updatedAt,
      usage: {
        currentStaffCount,
        currentMembersCount,
      },
    };
  }

  /**
   * Get license by shop ID
   */
  async findByShopId(shopId: string): Promise<LicenseDetail> {
    const license = await this.prisma.license.findUnique({
      where: { shopId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    if (!license) {
      throw new NotFoundException('License not found for this shop');
    }

    return this.findById(license.id);
  }

  /**
   * Create and issue a new license for a shop
   */
  async create(data: CreateLicenseDto): Promise<LicenseIssuedResult> {
    // Verify shop exists
    const shop = await this.prisma.shop.findUnique({
      where: { id: data.shopId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Check if license already exists for this shop
    const existing = await this.prisma.license.findUnique({
      where: { shopId: data.shopId },
    });

    if (existing) {
      throw new ConflictException('License already exists for this shop. Use update instead.');
    }

    // Get plan defaults
    const plan = data.plan;
    const defaults = PLAN_DEFAULTS[plan as LicensePlanType] || PLAN_DEFAULTS[LicensePlanType.FREE];

    // Generate license key
    const licenseKey = this.generateLicenseKey(shop.id, shop.name);

    // Calculate expiry date
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt);
    expiresAt.setMonth(expiresAt.getMonth() + data.durationMonths);

    // Create license payload for signing
    const payload = {
      shopId: data.shopId,
      shopName: shop.name,
      plan: data.plan,
      staffLimit: data.staffLimit ?? defaults.staffLimit,
      membersLimit: data.membersLimit ?? defaults.membersLimit,
      modules: data.modules ?? defaults.modules,
      features: data.features ?? {},
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Sign the payload with RSA
    const signature = this.signLicense(payload);

    // Create license in database
    const license = await this.prisma.license.create({
      data: {
        shopId: data.shopId,
        licenseKey,
        plan: data.plan,
        staffLimit: data.staffLimit ?? defaults.staffLimit,
        membersLimit: data.membersLimit ?? defaults.membersLimit,
        modules: data.modules ?? defaults.modules,
        features: data.features ?? {} as any,
        issuedAt,
        expiresAt,
        signature,
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(`Created license ${license.licenseKey} for shop ${shop.name}`);

    return {
      licenseKey: license.licenseKey,
      license: await this.findById(license.id),
    };
  }

  /**
   * Update an existing license
   */
  async update(licenseId: string, data: UpdateLicenseDto): Promise<LicenseDetail> {
    const existing = await this.prisma.license.findUnique({
      where: { id: licenseId },
      include: { shop: true },
    });

    if (!existing) {
      throw new NotFoundException('License not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.plan !== undefined) {
      updateData.plan = data.plan;
      const planDefaults = PLAN_DEFAULTS[data.plan as LicensePlanType] || PLAN_DEFAULTS[LicensePlanType.FREE];
      if (data.staffLimit === undefined) {
        updateData.staffLimit = planDefaults.staffLimit;
      }
      if (data.membersLimit === undefined) {
        updateData.membersLimit = planDefaults.membersLimit;
      }
      if (data.modules === undefined) {
        updateData.modules = planDefaults.modules;
      }
    }

    if (data.staffLimit !== undefined) {
      updateData.staffLimit = data.staffLimit;
    }
    if (data.membersLimit !== undefined) {
      updateData.membersLimit = data.membersLimit;
    }
    if (data.modules !== undefined) {
      updateData.modules = data.modules;
    }
    if (data.features !== undefined) {
      updateData.features = data.features;
    }

    // Re-sign the license if any data changed
    if (Object.keys(updateData).length > 0) {
      const payload = {
        shopId: existing.shopId,
        shopName: existing.shop.name,
        plan: data.plan ?? existing.plan,
        staffLimit: data.staffLimit ?? existing.staffLimit,
        membersLimit: data.membersLimit ?? existing.membersLimit,
        modules: data.modules ?? existing.modules,
        features: data.features ?? existing.features,
        issuedAt: existing.issuedAt.toISOString(),
        expiresAt: existing.expiresAt.toISOString(),
      };
      updateData.signature = this.signLicense(payload);
    }

    await this.prisma.license.update({
      where: { id: licenseId },
      data: updateData,
    });

    this.logger.log(`Updated license ${existing.licenseKey}`);

    return this.findById(licenseId);
  }

  /**
   * Renew a license with extended duration
   */
  async renew(licenseId: string, data: RenewLicenseDto): Promise<LicenseDetail> {
    const existing = await this.prisma.license.findUnique({
      where: { id: licenseId },
      include: { shop: true },
    });

    if (!existing) {
      throw new NotFoundException('License not found');
    }

    // Calculate new expiry date (extend from current expiry or current date if expired)
    const baseDate = new Date(existing.expiresAt) > new Date()
      ? new Date(existing.expiresAt)
      : new Date();
    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setMonth(newExpiresAt.getMonth() + data.durationMonths);

    // Get plan defaults if plan changed
    let staffLimit = existing.staffLimit;
    let membersLimit = existing.membersLimit;
    let modules = existing.modules as string[];
    let features = existing.features as Record<string, unknown>;
    let plan = existing.plan as LicensePlan;

    if (data.plan !== undefined && data.plan !== existing.plan) {
      plan = data.plan;
      const planDefaults = PLAN_DEFAULTS[data.plan as LicensePlanType] || PLAN_DEFAULTS[LicensePlanType.FREE];
      staffLimit = data.staffLimit ?? planDefaults.staffLimit;
      membersLimit = data.membersLimit ?? planDefaults.membersLimit;
      modules = data.modules ?? planDefaults.modules;
    }

    if (data.staffLimit !== undefined) {
      staffLimit = data.staffLimit;
    }
    if (data.membersLimit !== undefined) {
      membersLimit = data.membersLimit;
    }
    if (data.modules !== undefined) {
      modules = data.modules;
    }
    if (data.features !== undefined) {
      features = data.features;
    }

    // Create new signed payload
    const payload = {
      shopId: existing.shopId,
      shopName: existing.shop.name,
      plan,
      staffLimit,
      membersLimit,
      modules,
      features,
      issuedAt: existing.issuedAt.toISOString(),
      expiresAt: newExpiresAt.toISOString(),
    };
    const signature = this.signLicense(payload);

    // Update license
    await this.prisma.license.update({
      where: { id: licenseId },
      data: {
        plan,
        staffLimit,
        membersLimit,
        modules,
        features: features as any,
        expiresAt: newExpiresAt,
        signature,
      },
    });

    this.logger.log(`Renewed license ${existing.licenseKey} until ${newExpiresAt.toISOString()}`);

    return this.findById(licenseId);
  }

  /**
   * Get shops with expiring licenses
   */
  async getExpiringShops(): Promise<ExpiringShopItem[]> {
    const licenses = await this.findAll();
    const now = new Date();
    const warningDate = new Date(now);
    warningDate.setDate(warningDate.getDate() + EXPIRY_WARNING_DAYS);

    const expiring = licenses.filter(
      (license) =>
        license.status === 'EXPIRING_SOON' ||
        (license.status === 'EXPIRED' && new Date(license.expiresAt) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
    );

    return expiring.map((license) => ({
      id: license.id,
      name: license.shopName,
      phone: null, // Would need to query shop separately if needed
      licensePlan: license.plan,
      expiresAt: license.expiresAt,
      daysUntilExpiry: license.daysUntilExpiry,
    }));
  }

  /**
   * Validate a license key and signature
   */
  async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    const license = await this.prisma.license.findUnique({
      where: { licenseKey },
    });

    if (!license) {
      return {
        isValid: false,
        license: null,
        error: 'License key not found',
      };
    }

    // Check if expired
    const isExpired = new Date(license.expiresAt) < new Date();
    if (isExpired) {
      return {
        isValid: false,
        license: null,
        error: 'License has expired',
      };
    }

    // Verify signature
    const payload = {
      shopId: license.shopId,
      plan: license.plan,
      staffLimit: license.staffLimit,
      membersLimit: license.membersLimit,
      modules: license.modules,
      features: license.features,
      issuedAt: license.issuedAt.toISOString(),
      expiresAt: license.expiresAt.toISOString(),
    };

    const isValidSignature = this.verifyLicense(payload, license.signature);
    if (!isValidSignature) {
      this.logger.error(`Invalid signature for license ${licenseKey}`);
      return {
        isValid: false,
        license: null,
        error: 'License signature is invalid',
      };
    }

    return {
      isValid: true,
      license: {
        id: license.id,
        shopId: license.shopId,
        plan: license.plan as LicensePlan,
        staffLimit: license.staffLimit,
        membersLimit: license.membersLimit,
        modules: license.modules as string[],
        expiresAt: license.expiresAt,
      },
    };
  }

  /**
   * Generate a unique license key
   */
  private generateLicenseKey(shopId: string, shopName: string): string {
    const timestamp = Date.now().toString(36);
    const shopHash = crypto
      .createHash('md5')
      .update(`${shopId}-${shopName}`)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `HC-${timestamp}-${shopHash}-${random}`;
  }

  /**
   * Sign license payload with RSA private key
   */
  private signLicense(payload: Record<string, unknown>): string {
    const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
    const sign = crypto.createSign('SHA256');
    sign.update(payloadString);
    sign.end();
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * Verify license signature with RSA public key
   */
  private verifyLicense(payload: Record<string, unknown>, signature: string): boolean {
    try {
      const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
      const verify = crypto.createVerify('SHA256');
      verify.update(payloadString);
      verify.end();
      return verify.verify(this.publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error('License verification failed', error);
      return false;
    }
  }

  /**
   * Generate RSA private key (for development only)
   */
  private generatePrivateKey(): string {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    return privateKey;
  }

  /**
   * Derive public key from private key
   */
  private getPublicKeyFromPrivate(): string {
    const keyObject = crypto.createPrivateKey(this.privateKey);
    return crypto.createPublicKey(keyObject).export({ type: 'spki', format: 'pem' }) as string;
  }
}