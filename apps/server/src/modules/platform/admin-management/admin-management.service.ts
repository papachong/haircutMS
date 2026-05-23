import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminManagementService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.platformAdmin.findMany({
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id },
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
    });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  async create(data: { name: string; phone: string; password: string; role: string }) {
    const existing = await this.prisma.platformAdmin.findUnique({ where: { phone: data.phone } });
    if (existing) throw new ConflictException('Phone number already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.platformAdmin.create({
      data: { name: data.name, phone: data.phone, password: hashedPassword, role: data.role as any },
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
    });
  }

  async update(id: string, data: { name?: string; phone?: string; role?: string }) {
    await this.findById(id);
    if (data.phone) {
      const existing = await this.prisma.platformAdmin.findFirst({
        where: { phone: data.phone, NOT: { id } },
      });
      if (existing) throw new ConflictException('Phone number already registered');
    }
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role !== undefined) updateData.role = data.role;
    return this.prisma.platformAdmin.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
    });
  }

  async resetPassword(id: string, newPassword: string) {
    await this.findById(id);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.platformAdmin.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return { success: true };
  }

  async toggleActive(id: string) {
    const admin = await this.findById(id);
    return this.prisma.platformAdmin.update({
      where: { id },
      data: { isActive: !admin.isActive },
      select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
    });
  }
}
