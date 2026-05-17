import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PlatformAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(phone: string, password: string) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { phone },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, admin.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(admin.id, admin.role);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      });

      if (payload.type !== 'platform') {
        throw new UnauthorizedException('Invalid token type');
      }

      const admin = await this.prisma.platformAdmin.findUnique({
        where: { id: payload.adminId },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Admin not found or inactive');
      }

      return this.generateTokens(admin.id, admin.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateAdmin(adminId: string) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id: adminId },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    return {
      id: admin.id,
      name: admin.name,
      phone: admin.phone,
      role: admin.role,
    };
  }

  private generateTokens(adminId: string, role: string) {
    const payload = {
      type: 'platform',
      adminId,
      role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    });

    return {
      accessToken,
      refreshToken,
      adminId,
      role,
    };
  }
}
