import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const EXPIRY_WARNING_DAYS = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * Get license status for a shop
   */
  private async getLicenseStatus(shopId: string) {
    const license = await this.prisma.license.findUnique({
      where: { shopId },
    });

    if (!license) {
      return {
        hasLicense: false,
        isExpired: false,
        isExpiringSoon: false,
        daysUntilExpiry: null,
        plan: 'FREE',
      };
    }

    const now = new Date();
    const expiresAt = new Date(license.expiresAt);
    const daysUntilExpiry = Math.floor(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      hasLicense: true,
      isExpired: daysUntilExpiry <= 0,
      isExpiringSoon: daysUntilExpiry > 0 && daysUntilExpiry <= EXPIRY_WARNING_DAYS,
      daysUntilExpiry,
      plan: license.plan,
    };
  }

  async getShopInfo(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        logo: true,
        businessHours: true,
      },
    });
    return shop;
  }

  async updateShopInfo(
    shopId: string,
    data: { name?: string; address?: string; phone?: string; businessHours?: string; logo?: string },
  ) {
    const shop = await this.prisma.shop.update({
      where: { id: shopId },
      data,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        logo: true,
        businessHours: true,
      },
    });
    return shop;
  }

  async login(phone: string, password: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { shopId_phone: { shopId: '', phone } },
      include: { shop: true },
    });

    if (!staff || !staff.isActive) {
      // Fallback: search across all shops by phone
      const allStaff = await this.prisma.staff.findMany({
        where: { phone, isActive: true },
        include: { shop: true },
      });
      if (allStaff.length === 0) throw new UnauthorizedException('Invalid credentials');

      const matched = allStaff.find((s) => bcrypt.compareSync(password, s.password));
      if (!matched) throw new UnauthorizedException('Invalid credentials');
      const licenseStatus = await this.getLicenseStatus(matched.shopId);
      return this.generateTokens(matched.id, matched.shopId, matched.role, licenseStatus);
    }

    if (!bcrypt.compareSync(password, staff.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (staff.shop.status !== 'ACTIVE') {
      throw new UnauthorizedException('Shop is suspended');
    }

    const licenseStatus = await this.getLicenseStatus(staff.shopId);
    return this.generateTokens(staff.id, staff.shopId, staff.role, licenseStatus);
  }

  async loginWithShopId(phone: string, password: string, shopId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { shopId_phone: { shopId, phone } },
      include: { shop: true },
    });

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!bcrypt.compareSync(password, staff.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (staff.shop.status !== 'ACTIVE') {
      throw new UnauthorizedException('Shop is suspended');
    }

    const licenseStatus = await this.getLicenseStatus(shopId);
    return this.generateTokens(staff.id, staff.shopId, staff.role, licenseStatus);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      });

      if (payload.type !== 'shop') throw new UnauthorizedException();

      const licenseStatus = await this.getLicenseStatus(payload.shopId);
      return this.generateTokens(payload.staffId, payload.shopId, payload.role, licenseStatus);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(
    staffId: string,
    shopId: string,
    role: string,
    licenseStatus?: {
      hasLicense: boolean;
      isExpired: boolean;
      isExpiringSoon: boolean;
      daysUntilExpiry: number | null;
      plan: string;
    },
  ) {
    const accessToken = this.jwt.sign({ staffId, shopId, role, type: 'shop' });
    const refreshToken = this.jwt.sign(
      { staffId, shopId, role, type: 'shop' },
      {
        secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
        expiresIn: '7d',
      },
    );

    // Log license warning if expired or expiring soon
    if (licenseStatus?.isExpired) {
      this.logger.warn(`Shop ${shopId} has expired license. Downgraded to FREE plan.`);
    } else if (licenseStatus?.isExpiringSoon) {
      this.logger.warn(
        `Shop ${shopId} license expires in ${licenseStatus.daysUntilExpiry} days.`,
      );
    }

    return {
      accessToken,
      refreshToken,
      staffId,
      shopId,
      role,
      license: licenseStatus,
    };
  }
}
