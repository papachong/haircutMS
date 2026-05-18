import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

enum OrderStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

enum PaymentMethod {
  BALANCE = 'BALANCE',
  PASS_CARD = 'PASS_CARD',
  OFFLINE = 'OFFLINE',
  COUPON = 'COUPON',
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

interface SettleOrderData {
  payments: Array<{
    method: PaymentMethod;
    amount: number;
    detail?: string;
    passCardId?: string;
    couponInstanceId?: string;
  }>;
}

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string, query: {
    memberId?: string;
    status?: OrderStatus;
    keyword?: string;
    startDate?: string;
    endDate?: string;
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

    if (query.keyword) {
      where.OR = [
        { orderNo: { contains: query.keyword, mode: 'insensitive' } },
        { member: { name: { contains: query.keyword, mode: 'insensitive' } } },
      ];
    }

    const dateFilter: Record<string, unknown> = {};
    if (query.startDate) {
      dateFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = dateFilter;
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

  async settle(id: string, shopId: string, data: SettleOrderData) {
    const order = await this.prisma.order.findFirst({
      where: { id, shopId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be settled');
    }

    const totalPaymentAmount = data.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaymentAmount !== order.payableAmount) {
      throw new BadRequestException(`Payment amount ${totalPaymentAmount} does not match payable amount ${order.payableAmount}`);
    }

    const member = await this.prisma.member.findFirst({
      where: { id: order.memberId },
      include: {
        couponInstances: true,
        passCards: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const { items } = order;
    let remainingAmount = order.payableAmount;

    // 余额支付：先扣赠送余额，再扣本金
    const balancePayment = data.payments.find(p => p.method === PaymentMethod.BALANCE);
    if (balancePayment) {
      const totalBalance = member.principalBalance + member.giftBalance;
      if (totalBalance < balancePayment.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      let giftDeduct = Math.min(member.giftBalance, balancePayment.amount);
      let principalDeduct = balancePayment.amount - giftDeduct;

      remainingAmount -= balancePayment.amount;
    }

    // 次卡核销
    const passCardPayments = data.payments.filter(p => p.method === PaymentMethod.PASS_CARD);
    for (const payment of passCardPayments) {
      const passCard = member.passCards.find(pc => pc.id === payment.passCardId);
      if (!passCard) {
        throw new NotFoundException('Pass card not found');
      }

      if (passCard.expiresAt && new Date() > passCard.expiresAt) {
        throw new BadRequestException('Pass card has expired');
      }

      if (passCard.remainingTimes <= 0) {
        throw new BadRequestException('Pass card has no remaining times');
      }

      remainingAmount -= payment.amount;
    }

    // 优惠券抵扣
    const couponPayments = data.payments.filter(p => p.method === PaymentMethod.COUPON);
    for (const payment of couponPayments) {
      const coupon = member.couponInstances.find(c => c.id === payment.couponInstanceId);
      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      if (coupon.status !== 'AVAILABLE') {
        throw new BadRequestException('Coupon is not available');
      }

      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        throw new BadRequestException('Coupon has expired');
      }

      remainingAmount -= payment.amount;
    }

    // 执行结算事务
    const result = await this.prisma.$transaction(async (tx) => {
      // 处理余额支付
      if (balancePayment) {
        let giftDeduct = Math.min(member.giftBalance, balancePayment.amount);
        let principalDeduct = balancePayment.amount - giftDeduct;

        await tx.member.update({
          where: { id: member.id },
          data: {
            giftBalance: { decrement: giftDeduct },
            principalBalance: { decrement: principalDeduct },
            totalConsume: { increment: balancePayment.amount },
          },
        });
      }

      // 处理次卡核销
      for (const payment of passCardPayments) {
        const passCard = await tx.passCard.findUnique({
          where: { id: payment.passCardId },
        });

        if (passCard) {
          await tx.passCard.update({
            where: { id: passCard.id },
            data: { remainingTimes: { decrement: 1 } },
          });

          // 找到对应的订单项并关联
          const orderItem = items.find(item => item.finalPrice === payment.amount);
          if (orderItem) {
            await tx.passCardUsage.create({
              data: {
                passCardId: passCard.id,
                orderItemId: orderItem.id,
              },
            });
          }
        }
      }

      // 处理优惠券
      for (const payment of couponPayments) {
        await tx.couponInstance.update({
          where: { id: payment.couponInstanceId },
          data: {
            status: 'USED',
            usedAt: new Date(),
          },
        });
      }

      // 更新订单状态
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.SETTLED,
          settledAt: new Date(),
          paidAmount: totalPaymentAmount,
        },
      });

      // 创建支付记录
      await tx.payment.createMany({
        data: data.payments.map(p => ({
          orderId: id,
          method: p.method,
          amount: p.amount,
          detail: p.detail,
        })),
      });

      // 更新会员访问记录
      await tx.member.update({
        where: { id: member.id },
        data: {
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
        },
      });

      return updatedOrder;
    });

    return result;
  }

  async cancel(id: string, shopId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, shopId },
      include: {
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.SETTLED) {
      throw new BadRequestException('Only settled orders can be cancelled');
    }

    // 检查是否为当日订单
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (order.settledAt && order.settledAt < today) {
      throw new ForbiddenException('Cannot cancel orders from previous days');
    }

    // 恢复会员余额
    const balancePayment = order.payments.find(p => p.method === PaymentMethod.BALANCE);
    if (balancePayment) {
      await this.prisma.member.update({
        where: { id: order.memberId },
        data: {
          totalConsume: { decrement: balancePayment.amount },
          principalBalance: { increment: balancePayment.amount },
        },
      });
    }

    // 恢复次卡
    const passCardPayments = order.payments.filter(p => p.method === PaymentMethod.PASS_CARD);
    for (const payment of passCardPayments) {
      const usage = await this.prisma.passCardUsage.findUnique({
        where: { orderItemId: payment.orderId },
      });
      if (usage) {
        await this.prisma.passCard.update({
          where: { id: usage.passCardId },
          data: { remainingTimes: { increment: 1 } },
        });
        await this.prisma.passCardUsage.delete({
          where: { id: usage.id },
        });
      }
    }

    // 恢复优惠券
    const couponPayments = order.payments.filter(p => p.method === PaymentMethod.COUPON && p.detail);
    for (const payment of couponPayments) {
      await this.prisma.couponInstance.updateMany({
        where: { id: payment.detail! },
        data: {
          status: 'AVAILABLE',
          usedAt: null,
        },
      });
    }

    const cancelledOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.REFUNDED,
        cancelledAt: new Date(),
        cancelReason: reason,
        paidAmount: 0,
      },
    });

    return cancelledOrder;
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
  }

  async exportOrders(shopId: string, query: {
    memberId?: string;
    status?: OrderStatus;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Record<string, unknown> = { shopId };

    if (query.memberId) {
      where.memberId = query.memberId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.keyword) {
      where.OR = [
        { orderNo: { contains: query.keyword, mode: 'insensitive' } },
        { member: { name: { contains: query.keyword, mode: 'insensitive' } } },
      ];
    }

    const dateFilter: Record<string, unknown> = {};
    if (query.startDate) {
      dateFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = dateFilter;
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cardNo: true,
            phone: true,
            memberLevel: {
              select: {
                name: true,
              },
            },
          },
        },
        items: {
          include: {
            serviceItem: {
              select: {
                name: true,
              },
            },
            staff: {
              select: {
                name: true,
              },
            },
          },
        },
        payments: {
          select: {
            method: true,
            amount: true,
          },
        },
      },
    });

    return orders.map((order) => ({
      orderNo: order.orderNo,
      memberName: order.member.name,
      memberCardNo: order.member.cardNo,
      memberPhone: order.member.phone,
      memberLevel: order.member.memberLevel?.name || '',
      status: order.status,
      originalAmount: Number(order.originalAmount) / 100,
      discountAmount: Number(order.discountAmount) / 100,
      payableAmount: Number(order.payableAmount) / 100,
      paidAmount: Number(order.paidAmount) / 100,
      services: order.items.map((item) =>
        `${item.serviceItem.name} (${item.staffName}) x${item.quantity}`,
      ).join('; '),
      paymentMethods: order.payments.map((p) => `${p.method}: ¥${Number(p.amount) / 100}`).join(', '),
      remark: order.remark || '',
      createdAt: order.createdAt.toISOString(),
      settledAt: order.settledAt?.toISOString() || '',
      cancelledAt: order.cancelledAt?.toISOString() || '',
    }));
  }
}
