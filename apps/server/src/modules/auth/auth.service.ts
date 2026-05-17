import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

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
      return this.generateTokens(matched.id, matched.shopId, matched.role);
    }

    if (!bcrypt.compareSync(password, staff.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (staff.shop.status !== 'ACTIVE') {
      throw new UnauthorizedException('Shop is suspended');
    }

    return this.generateTokens(staff.id, staff.shopId, staff.role);
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

    return this.generateTokens(staff.id, staff.shopId, staff.role);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      });

      if (payload.type !== 'shop') throw new UnauthorizedException();

      return this.generateTokens(payload.staffId, payload.shopId, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(staffId: string, shopId: string, role: string) {
    const accessToken = this.jwt.sign({ staffId, shopId, role, type: 'shop' });
    const refreshToken = this.jwt.sign(
      { staffId, shopId, role, type: 'shop' },
      {
        secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
      staffId,
      shopId,
      role,
    };
  }
}
