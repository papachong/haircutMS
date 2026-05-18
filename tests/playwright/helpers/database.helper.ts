/**
 * Database Helper for E2E Tests
 * Provides direct database access for test setup/teardown
 */

import { PrismaClient } from '@haircut-ms/server/.prisma/client';

export class DatabaseHelper {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/haircut_ms_test',
        },
      },
    });
  }

  async connect() {
    await this.prisma.$connect();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  async clearDatabase() {
    // Clear in reverse order due to foreign key constraints
    await this.prisma.payment.deleteMany({});
    await this.prisma.passCardUsage.deleteMany({});
    await this.prisma.orderItem.deleteMany({});
    await this.prisma.order.deleteMany({});
    await this.prisma.couponInstance.deleteMany({});
    await this.prisma.couponTemplate.deleteMany({});
    await this.prisma.passCard.deleteMany({});
    await this.prisma.rechargeRecord.deleteMany({});
    await this.prisma.memberTagRelation.deleteMany({});
    await this.prisma.memberTag.deleteMany({});
    await this.prisma.memberTagGroup.deleteMany({});
    await this.prisma.member.deleteMany({});
    await this.prisma.serviceItem.deleteMany({});
    await this.prisma.serviceCategory.deleteMany({});
    await this.prisma.rechargePlan.deleteMany({});
    await this.prisma.memberLevel.deleteMany({});
    await this.prisma.license.deleteMany({});
    await this.prisma.staff.deleteMany({});
    await this.prisma.shop.deleteMany({});
    await this.prisma.platformAdmin.deleteMany({});
  }

  // Shop Operations
  async createShop(data: { name: string; phone?: string; address?: string }) {
    return this.prisma.shop.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
      },
    });
  }

  async getShopById(id: string) {
    return this.prisma.shop.findUnique({ where: { id } });
  }

  async getAllShops() {
    return this.prisma.shop.findMany();
  }

  async deleteShop(id: string) {
    await this.prisma.shop.delete({ where: { id } });
  }

  // Platform Admin Operations
  async createPlatformAdmin(data: { name: string; phone: string; password: string }) {
    return this.prisma.platformAdmin.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: data.password,
      },
    });
  }

  async getPlatformAdminByPhone(phone: string) {
    return this.prisma.platformAdmin.findUnique({ where: { phone } });
  }

  // Staff Operations
  async createStaff(shopId: string, data: { name: string; phone: string; password: string; role?: string }) {
    return this.prisma.staff.create({
      data: {
        shopId,
        name: data.name,
        phone: data.phone,
        password: data.password,
        role: (data.role as any) || 'STYLIST',
      },
    });
  }

  async getStaffCount(shopId: string) {
    return this.prisma.staff.count({ where: { shopId } });
  }

  // Member Operations
  async createMember(shopId: string, memberLevelId: string, data: { name: string; phone: string; cardNo: string }) {
    return this.prisma.member.create({
      data: {
        shopId,
        memberLevelId,
        ...data,
      },
    });
  }

  async getMemberById(id: string) {
    return this.prisma.member.findUnique({ where: { id } });
  }

  async getMemberBalance(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      select: { principalBalance: true, giftBalance: true },
    });
    return member;
  }

  // Member Level Operations
  async createDefaultMemberLevel(shopId: string) {
    return this.prisma.memberLevel.create({
      data: {
        shopId,
        name: '普通会员',
        discount: 1.00,
        sortOrder: 0,
      },
    });
  }

  // Service Category & Item Operations
  async createServiceCategory(shopId: string, name: string) {
    return this.prisma.serviceCategory.create({
      data: { shopId, name },
    });
  }

  async createServiceItem(categoryId: string, data: { name: string; price: number; duration: number }) {
    return this.prisma.serviceItem.create({
      data: {
        categoryId,
        name: data.name,
        price: data.price,
        duration: data.duration,
      },
    });
  }

  // Recharge Plan Operations
  async createRechargePlan(shopId: string, data: { name: string; amount: number; giftAmount: number; type: string }) {
    return this.prisma.rechargePlan.create({
      data: {
        shopId,
        name: data.name,
        amount: data.amount,
        giftAmount: data.giftAmount,
        type: data.type as any,
      },
    });
  }

  // Order Operations
  async getOrderByOrderNo(orderNo: string) {
    return this.prisma.order.findUnique({ where: { orderNo } });
  }

  async getOrdersByMemberId(memberId: string) {
    return this.prisma.order.findMany({ where: { memberId } });
  }

  // License Operations
  async createLicense(shopId: string, data: { plan: string; staffLimit: number; modules: string[] }) {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return this.prisma.license.create({
      data: {
        shopId,
        licenseKey: `TEST-${shopId.substring(0, 8).toUpperCase()}`,
        plan: data.plan as any,
        staffLimit: data.staffLimit,
        membersLimit: 200,
        modules: data.modules,
        features: {},
        issuedAt: new Date(),
        expiresAt,
        signature: 'test-signature',
      },
    });
  }

  // Get all data for a shop (for multi-tenant isolation tests)
  async getShopDataCounts(shopId: string) {
    const [members, staff, orders, rechargePlans, serviceItems] = await Promise.all([
      this.prisma.member.count({ where: { shopId } }),
      this.prisma.staff.count({ where: { shopId } }),
      this.prisma.order.count({ where: { shopId } }),
      this.prisma.rechargePlan.count({ where: { shopId } }),
      this.prisma.serviceItem.count({ where: { categoryId: { in: [await this.prisma.serviceCategory.findFirst({ where: { shopId }, select: { id: true } }).then(c => c?.id || '')] } } }),
    ]);

    return { members, staff, orders, rechargePlans, serviceItems };
  }
}