import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '../../../../../../node_modules/.prisma/client';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string, query: { keyword?: string; page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.MemberWhereInput = { shopId, isActive: true };

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { phone: { contains: query.keyword } },
        { cardNo: { contains: query.keyword } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          memberLevel: { select: { id: true, name: true, discount: true } },
        },
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      items,
      pagination: { total, page, pageSize, hasMore: page * pageSize < total },
    };
  }

  async findById(id: string, shopId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, shopId },
      include: {
        memberLevel: true,
        tagRelations: { include: { tag: { include: { group: true } } } },
        rechargeRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async create(shopId: string, data: {
    name: string;
    phone: string;
    gender?: string;
    birthday?: string;
    memberLevelId?: string;
    remark?: string;
  }) {
    const existing = await this.prisma.member.findFirst({
      where: { shopId, phone: data.phone, isActive: true },
    });

    if (existing) {
      throw new ConflictException('该手机号已有会员');
    }

    let memberLevelId = data.memberLevelId;
    if (!memberLevelId) {
      const defaultLevel = await this.prisma.memberLevel.findFirst({
        where: { shopId },
        orderBy: { sortOrder: 'asc' },
      });
      memberLevelId = defaultLevel?.id;
    }

    const cardNo = await this.generateCardNo(shopId);

    return this.prisma.member.create({
      data: {
        shopId,
        cardNo,
        name: data.name,
        phone: data.phone,
        gender: data.gender as any,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
        memberLevelId: memberLevelId!,
        remark: data.remark,
      },
      include: { memberLevel: true },
    });
  }

  async update(id: string, shopId: string, data: {
    name?: string;
    phone?: string;
    gender?: string;
    birthday?: string;
    memberLevelId?: string;
    remark?: string;
  }) {
    const existing = await this.prisma.member.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException('Member not found');
    }

    if (data.phone && data.phone !== existing.phone) {
      const phoneExists = await this.prisma.member.findFirst({
        where: { shopId, phone: data.phone, isActive: true, id: { not: id } },
      });
      if (phoneExists) {
        throw new ConflictException('该手机号已有会员');
      }
    }

    return this.prisma.member.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.gender !== undefined && { gender: data.gender as any }),
        ...(data.birthday !== undefined && { birthday: data.birthday ? new Date(data.birthday) : null }),
        ...(data.memberLevelId !== undefined && { memberLevelId: data.memberLevelId }),
        ...(data.remark !== undefined && { remark: data.remark }),
      },
      include: { memberLevel: true },
    });
  }

  private async generateCardNo(shopId: string): Promise<string> {
    const count = await this.prisma.member.count({ where: { shopId } });
    const seq = String(count + 1).padStart(4, '0');
    const prefix = shopId.slice(-4).toUpperCase();
    return `M${prefix}${seq}`;
  }
}
