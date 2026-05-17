import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

enum OrderStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

interface CreateOrderItemData {
  serviceItemId: string;
  staffId: string;
  serviceName: string;
  staffName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discountRate: Decimal;
  finalPrice: number;
}

interface CreateOrderData {
  memberId: string;
  items: Array<{
    serviceItemId: string;
    staffId: string;
    quantity: number;
  }>;
  remark?: string;
  status?: OrderStatus;
}

interface UpdateOrderData {
  status?: OrderStatus;
  remark?: string;
  cancelReason?: string;
}

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string, query: {
    memberId?: string;
    status?: OrderStatus;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Record<string, unknown> = { shopId };

    if (query.memberId) {
      where.memberId = query.memberId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              cardNo: true,
              phone: true,
              memberLevel: {
                select: {
                  id: true,
                  name: true,
                  discount: true,
                },
              },
            },
          },
          items: {
            include: {
              serviceItem: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  duration: true,
                },
              },
              staff: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              method: true,
              amount: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      pagination: { total, page, pageSize, hasMore: page * pageSize < total },
    };
  }

  async findById(id: string, shopId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, shopId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cardNo: true,
            phone: true,
            avatar: true,
            memberLevel: {
              select: {
                id: true,
                name: true,
                discount: true,
              },
            },
          },
        },
        items: {
          include: {
            serviceItem: {
              select: {
                id: true,
                name: true,
                price: true,
                duration: true,
                image: true,
              },
            },
            staff: {
              select: {
                id: true,
                name: true,
                role: true,
                avatar: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            method: true,
            amount: true,
            detail: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async create(shopId: string, data: CreateOrderData) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    const member = await this.prisma.member.findFirst({
      where: { id: data.memberId, shopId },
      include: { memberLevel: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const serviceItems = await this.prisma.serviceItem.findMany({
      where: {
        id: { in: data.items.map((i) => i.serviceItemId) },
        category: { shopId },
        isActive: true,
      },
    });

    if (serviceItems.length !== data.items.length) {
      throw new NotFoundException('One or more service items not found');
    }

    const staffList = await this.prisma.staff.findMany({
      where: {
        id: { in: data.items.map((i) => i.staffId) },
        shopId,
        isActive: true,
      },
    });

    if (staffList.length !== data.items.length) {
      throw new NotFoundException('One or more staff not found');
    }

    const staffMap = new Map(staffList.map((s) => [s.id, s]));
    const serviceMap = new Map(serviceItems.map((s) => [s.id, s]));

    const orderItems: CreateOrderItemData[] = [];
    let originalAmount = 0;
    let discountAmount = 0;

    for (const item of data.items) {
      const serviceItem = serviceMap.get(item.serviceItemId)!;
      const staff = staffMap.get(item.staffId)!;

      const unitPrice = serviceItem.price;
      const quantity = item.quantity;
      const subtotal = unitPrice * quantity;
      originalAmount += subtotal;

      const discountRate = member.memberLevel.discount;
      const finalPrice = Math.floor(subtotal * Number(discountRate));
      const itemDiscount = subtotal - finalPrice;
      discountAmount += itemDiscount;

      orderItems.push({
        serviceItemId: item.serviceItemId,
        staffId: item.staffId,
        serviceName: serviceItem.name,
        staffName: staff.name,
        unitPrice,
        quantity,
        subtotal,
        discountRate,
        finalPrice,
      });
    }

    const orderNo = await this.generateOrderNo(shopId);
    const payableAmount = originalAmount - discountAmount;

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          shopId,
          orderNo,
          memberId: data.memberId,
          status: data.status ?? OrderStatus.PENDING,
          originalAmount,
          discountAmount,
          payableAmount,
          remark: data.remark,
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              cardNo: true,
              memberLevel: {
                select: {
                  id: true,
                  name: true,
                  discount: true,
                },
              },
            },
          },
        },
      });

      await tx.orderItem.createMany({
        data: orderItems.map((item) => ({
          orderId: createdOrder.id,
          ...item,
        })),
      });

      return createdOrder;
    });

    return order;
  }

  async update(id: string, shopId: string, data: UpdateOrderData) {
    const existing = await this.prisma.order.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    if (existing.status === OrderStatus.SETTLED && data.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel settled order');
    }

    if (existing.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot modify cancelled order');
    }

    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) {
      updateData.status = data.status;

      if (data.status === OrderStatus.SETTLED) {
        updateData.settledAt = new Date();
      } else if (data.status === OrderStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
      }
    }

    if (data.remark !== undefined) {
      updateData.remark = data.remark;
    }

    if (data.cancelReason !== undefined) {
      updateData.cancelReason = data.cancelReason;
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  async getPendingOrders(shopId: string) {
    return this.prisma.order.findMany({
      where: {
        shopId,
        status: OrderStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cardNo: true,
            memberLevel: {
              select: {
                id: true,
                name: true,
                discount: true,
              },
            },
          },
        },
        items: {
          include: {
            serviceItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
            staff: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  private async generateOrderNo(shopId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const prefix = shopId.slice(-3).toUpperCase();
    const seqPrefix = `O${prefix}${dateStr}`;

    const lastOrder = await this.prisma.order.findFirst({
      where: {
        orderNo: { startsWith: seqPrefix },
      },
      orderBy: { orderNo: 'desc' },
      select: { orderNo: true },
    });

    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNo.slice(-4), 10);
      seq = lastSeq + 1;
    }

    return `${seqPrefix}${String(seq).padStart(4, '0')}`;
  }
}