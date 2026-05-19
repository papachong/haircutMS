import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LicenseService } from '../license/license.service';
import { AuditService, AuditActions } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private licenseService: LicenseService,
    private auditService: AuditService,
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
  }, operatorId?: string, ip?: string) {
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

    const staff = await this.prisma.staff.create({
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

    await this.auditService.log({
      shopId,
      staffId: operatorId,
      action: AuditActions.STAFF_CREATE,
      targetType: 'Staff',
      targetId: staff.id,
      detail: {
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
      },
      ip,
    });

    return staff;
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

  async toggle(id: string, shopId: string, operatorId?: string, ip?: string) {
    const existing = await this.prisma.staff.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException('Staff not found');
    }

    const updated = await this.prisma.staff.update({
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

    await this.auditService.log({
      shopId,
      staffId: operatorId,
      action: updated.isActive ? AuditActions.STAFF_ACTIVATE : AuditActions.STAFF_DEACTIVATE,
      targetType: 'Staff',
      targetId: id,
      detail: {
        name: updated.name,
        phone: updated.phone,
        role: updated.role,
        isActive: updated.isActive,
      },
      ip,
    });

    return updated;
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

    return { id, message: 'Password reset successfully' };
  }
}
