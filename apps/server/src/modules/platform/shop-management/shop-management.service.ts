import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SHOP_TEMPLATES, ShopTemplateKey } from './shop-templates';

const SALT_ROUNDS = 10;

export interface CreateShopDto {
  name: string;
  address?: string;
  phone?: string;
  businessHours?: string;
  logo?: string;
  ownerName: string;
  ownerPhone: string;
  ownerPassword: string;
  template?: string;
}

export interface UpdateShopDto {
  name?: string;
  address?: string;
  phone?: string;
  businessHours?: string;
  logo?: string;
}

export interface ShopListFilters {
  status?: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  search?: string;
}

export interface ShopListItem {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  staffCount: number;
  memberCount: number;
  licenseStatus: 'FREE' | 'PAID' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopDetail extends ShopListItem {
  address: string | null;
  businessHours: string | null;
  logo: string | null;
  owner: {
    id: string;
    name: string;
    phone: string;
    isActive: boolean;
  };
  license: {
    plan: string;
    staffLimit: number;
    membersLimit: number;
    expiresAt: Date | null;
    isExpired: boolean;
  };
  lastActiveAt: Date | null;
}

@Injectable()
export class ShopManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all shops with filters and pagination
   */
  async findAll(filters: ShopListFilters = {}): Promise<{
    data: ShopListItem[];
    total: number;
    stats: {
      total: number;
      active: number;
      suspended: number;
      archived: number;
    };
  }> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { phone: { contains: filters.search } },
        { address: { contains: filters.search } },
      ];
    }

    // Get total stats
    const [total, active, suspended, archived] = await Promise.all([
      this.prisma.shop.count({ where: {} }),
      this.prisma.shop.count({ where: { status: 'ACTIVE' } }),
      this.prisma.shop.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.shop.count({ where: { status: 'ARCHIVED' } }),
    ]);

    // Get shops with counts
    const shops = await this.prisma.shop.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            staff: { where: { isActive: true } },
            members: { where: { isActive: true } },
          },
        },
        license: {
          select: {
            plan: true,
            expiresAt: true,
          },
        },
      },
    });

    const data: ShopListItem[] = shops.map((shop: any) => {
      const licenseStatus = this.getLicenseStatus(
        shop.license?.plan,
        shop.license?.expiresAt,
      );
      return {
        id: shop.id,
        name: shop.name,
        phone: shop.phone,
        status: shop.status,
        staffCount: shop._count.staff,
        memberCount: shop._count.members,
        licenseStatus,
        createdAt: shop.createdAt,
        updatedAt: shop.updatedAt,
      };
    });

    return {
      data,
      total,
      stats: { total, active, suspended, archived },
    };
  }

  /**
   * Get shop detail by ID
   */
  async findById(id: string): Promise<ShopDetail> {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        license: {
          select: {
            plan: true,
            staffLimit: true,
            membersLimit: true,
            expiresAt: true,
          },
        },
        staff: {
          where: { role: 'OWNER' },
          take: 1,
          select: {
            id: true,
            name: true,
            phone: true,
            isActive: true,
          },
        },
        members: {
          where: { isActive: true },
          orderBy: { lastVisitAt: 'desc' },
          take: 1,
          select: { lastVisitAt: true },
        },
        _count: {
          select: {
            staff: { where: { isActive: true } },
            members: { where: { isActive: true } },
            orders: true,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const licenseStatus = this.getLicenseStatus(
      shop.license?.plan,
      shop.license?.expiresAt,
    );

    const owner = shop.staff[0] || {
      id: '',
      name: '',
      phone: '',
      isActive: false,
    };

    return {
      id: shop.id,
      name: shop.name,
      phone: shop.phone,
      address: shop.address,
      businessHours: shop.businessHours,
      logo: shop.logo,
      status: shop.status,
      staffCount: shop._count.staff,
      memberCount: shop._count.members,
      licenseStatus,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
      lastActiveAt: shop.members[0]?.lastVisitAt || null,
      owner,
      license: {
        plan: shop.license?.plan || 'FREE',
        staffLimit: shop.license?.staffLimit || 2,
        membersLimit: shop.license?.membersLimit || 200,
        expiresAt: shop.license?.expiresAt || null,
        isExpired: shop.license?.expiresAt
          ? new Date(shop.license.expiresAt) < new Date()
          : false,
      },
    };
  }

  /**
   * Create a new shop with owner account
   */
  async create(data: CreateShopDto): Promise<ShopDetail> {
    // Check if owner phone already exists in any shop
    const existingOwner = await this.prisma.staff.findFirst({
      where: { phone: data.ownerPhone },
    });

    if (existingOwner) {
      throw new ConflictException('该手机号已被注册');
    }

    // Create shop and owner in transaction
    const shop = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create shop
      const newShop = await tx.shop.create({
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          businessHours: data.businessHours,
          logo: data.logo,
        },
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(
        data.ownerPassword,
        SALT_ROUNDS,
      );

      // Create owner staff account
      await tx.staff.create({
        data: {
          shopId: newShop.id,
          name: data.ownerName,
          phone: data.ownerPhone,
          password: hashedPassword,
          role: 'OWNER',
          isActive: true,
        },
      });

      // Apply template data if specified
      if (data.template && data.template in SHOP_TEMPLATES) {
        const template = SHOP_TEMPLATES[data.template as ShopTemplateKey];
        await this.applyTemplate(tx, newShop.id, template);
      }

      return newShop;
    });

    // Return the created shop detail
    return this.findById(shop.id);
  }

  /**
   * Update shop information
   */
  async update(id: string, data: UpdateShopDto): Promise<ShopDetail> {
    const existing = await this.prisma.shop.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Shop not found');
    }

    await this.prisma.shop.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.businessHours !== undefined && {
          businessHours: data.businessHours,
        }),
        ...(data.logo !== undefined && { logo: data.logo }),
      },
    });

    return this.findById(id);
  }

  /**
   * Suspend a shop - staff cannot login
   */
  async suspend(id: string): Promise<ShopDetail> {
    const existing = await this.prisma.shop.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Shop not found');
    }

    if (existing.status === 'SUSPENDED') {
      throw new ConflictException('Shop is already suspended');
    }

    if (existing.status === 'ARCHIVED') {
      throw new ForbiddenException('Cannot suspend an archived shop');
    }

    await this.prisma.shop.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    return this.findById(id);
  }

  /**
   * Activate a suspended shop
   */
  async activate(id: string): Promise<ShopDetail> {
    const existing = await this.prisma.shop.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Shop not found');
    }

    if (existing.status !== 'SUSPENDED') {
      throw new ConflictException('Shop is not suspended');
    }

    await this.prisma.shop.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    return this.findById(id);
  }

  /**
   * Archive a shop
   */
  async archive(id: string): Promise<ShopDetail> {
    const existing = await this.prisma.shop.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Shop not found');
    }

    if (existing.status === 'ARCHIVED') {
      throw new ConflictException('Shop is already archived');
    }

    await this.prisma.shop.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return this.findById(id);
  }

  /**
   * Apply template data to a newly created shop
   */
  private async applyTemplate(
    tx: Prisma.TransactionClient,
    shopId: string,
    template: import('./shop-templates').ShopTemplate,
  ) {
    // Member levels
    for (const level of template.memberLevels) {
      await tx.memberLevel.create({
        data: { shopId, name: level.name, discount: level.discount, sortOrder: level.sortOrder },
      });
    }

    // Service categories + items
    for (const category of template.serviceCategories) {
      const cat = await tx.serviceCategory.create({
        data: { shopId, name: category.name, sortOrder: category.sortOrder },
      });
      await tx.serviceItem.createMany({
        data: category.items.map((item) => ({
          categoryId: cat.id,
          name: item.name,
          price: item.price * 100,
          duration: item.duration,
          sortOrder: item.sortOrder,
        })),
      });
    }

    // Recharge plans
    for (const plan of template.rechargePlans) {
      await tx.rechargePlan.create({
        data: {
          shopId,
          name: plan.name,
          amount: plan.amount * 100,
          giftAmount: plan.giftAmount * 100,
          type: plan.type,
          sortOrder: plan.sortOrder,
        },
      });
    }
  }

  /**
   * Helper to determine license status
   */
  private getLicenseStatus(
    plan: string | null | undefined,
    expiresAt: Date | null | undefined,
  ): 'FREE' | 'PAID' | 'EXPIRED' {
    if (!plan || plan === 'FREE') {
      return 'FREE';
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return 'EXPIRED';
    }

    return 'PAID';
  }
}