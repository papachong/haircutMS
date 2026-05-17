import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PlatformAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

    const payload = {
      type: 'platform',
      adminId: admin.id,
      role: admin.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
      },
    };
  }
}
