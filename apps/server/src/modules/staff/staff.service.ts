import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LicenseService } from '../license/license.service';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private licenseService: LicenseService,
  ) {}

  async findAll(shopId: string) {
    return this.prisma.staff.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findById(id: string, shopId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, shopId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }

  async create(shopId: string, data: {
    name: string;
    phone: string;
    password: string;
    role?: string;
    avatar?: string;
  }) {
    const existing = await this.prisma.staff.findFirst({
      where: { shopId, phone: data.phone },
    });

    if (existing) {
      throw new ConflictException('该手机号已有员工');
    }

    const licenseOk = await this.licenseService.isStaffLimitOk(shopId);
    if (!licenseOk) {
      throw new ForbiddenException('员工数已达 License 上限，请升级版本');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    return this.prisma.staff.create({
      data: {
        shopId,
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        role: (data.role as any) ?? 'STYLIST',
        avatar: data.avatar,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, shopId: string, data: {
    name?: string;
    phone?: string;
    role?: string;
    avatar?: string;
  }) {
    const existing = await this.prisma.staff.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException('Staff not found');
    }

    // If phone is being changed, check for duplicates
    if (data.phone && data.phone !== existing.phone) {
      const phoneTaken = await this.prisma.staff.findFirst({
        where: { shopId, phone: data.phone },
      });
      if (phoneTaken) {
        throw new ConflictException('该手机号已被其他员工使用');
      }
    }

    return this.prisma.staff.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.role !== undefined && { role: data.role as any }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async toggle(id: string, shopId: string) {
    const existing = await this.prisma.staff.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException('Staff not found');
    }

    // Prevent deactivating the last active owner
    if (existing.isActive && existing.role === 'OWNER') {
      const activeOwnerCount = await this.prisma.staff.count({
        where: { shopId, role: 'OWNER' as any, isActive: true },
      });
      if (activeOwnerCount <= 1) {
        throw new BadRequestException('不能停用唯一的店长账号');
      }
    }

    return this.prisma.staff.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
  }

  async resetPassword(id: string, shopId: string, newPassword: string) {
    const existing = await this.prisma.staff.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException('Staff not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.staff.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { id, message: '密码重置成功' };
  }
}
