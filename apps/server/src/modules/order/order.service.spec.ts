import { OrderService } from './order.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('OrderService', () => {
  let service: OrderService;
  let prisma: any;
  let auditService: any;

  const shopId = 'shop-1234';
  const operatorId = 'staff-001';
  const ip = '127.0.0.1';

  const mockMember = {
    id: 'member-1',
    shopId,
    name: '张三',
    cardNo: 'M12340001',
    phone: '13800138000',
    memberLevel: { id: 'level-1', name: '普通会员', discount: new Decimal(0.95) },
    principalBalance: 50000,
    giftBalance: 10000,
    totalConsume: 0,
    couponInstances: [],
    passCards: [],
  };

  const mockServiceItem = {
    id: 'svc-1',
    name: '男士理发',
    price: 5000,
    duration: 30,
    isActive: true,
  };

  const mockStaff = {
    id: 'staff-1',
    name: '理发师小王',
    shopId,
    isActive: true,
  };

  const mockOrder = {
    id: 'order-1',
    shopId,
    orderNo: 'O12320260520001',
    memberId: 'member-1',
    status: 'PENDING',
    originalAmount: 5000,
    discountAmount: 250,
    payableAmount: 4750,
    paidAmount: 0,
    settledAt: null,
    cancelledAt: null,
    member: { id: 'member-1', name: '张三', cardNo: 'M12340001' },
    items: [{ id: 'item-1', serviceItemId: 'svc-1', staffId: 'staff-1', serviceName: '男士理发', staffName: '理发师小王', finalPrice: 4750 }],
    payments: [],
  };

  const mockSettledOrder = {
    ...mockOrder,
    id: 'order-settled',
    status: 'SETTLED',
    paidAmount: 4750,
    settledAt: new Date(),
    payments: [{ id: 'pay-1', method: 'BALANCE', amount: 4750 }],
  };

  beforeEach(() => {
    prisma = {
      member: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      serviceItem: {
        findMany: jest.fn(),
      },
      staff: {
        findMany: jest.fn(),
      },
      order: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      orderItem: {
        createMany: jest.fn(),
      },
      payment: {
        createMany: jest.fn(),
      },
      passCard: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      passCardUsage: {
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      couponInstance: {
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };

    auditService = {
      log: jest.fn(),
    };

    service = new OrderService(prisma, auditService);
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.findAll(shopId, { page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should filter by status', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(shopId, { status: 'PENDING' as any });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(shopId, { startDate: '2026-05-01', endDate: '2026-05-20' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return order with full details', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await service.findById('order-1', shopId);

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createData = {
      memberId: 'member-1',
      items: [
        { serviceItemId: 'svc-1', staffId: 'staff-1', quantity: 1 },
      ],
    };

    it('should throw BadRequestException when no items provided', async () => {
      await expect(
        service.create(shopId, { memberId: 'member-1', items: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when member not found', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(service.create(shopId, createData)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when service items not found', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.serviceItem.findMany.mockResolvedValue([]);

      await expect(service.create(shopId, createData)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when staff not found', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.serviceItem.findMany.mockResolvedValue([mockServiceItem]);
      prisma.staff.findMany.mockResolvedValue([]);

      await expect(service.create(shopId, createData)).rejects.toThrow(NotFoundException);
    });

    it('should create order with member level discount applied', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.serviceItem.findMany.mockResolvedValue([mockServiceItem]);
      prisma.staff.findMany.mockResolvedValue([mockStaff]);
      prisma.order.findFirst.mockResolvedValue(null);
      prisma.order.create.mockResolvedValue(mockOrder);
      prisma.orderItem.createMany.mockResolvedValue({ count: 1 });

      const result = await service.create(shopId, createData);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shopId,
            originalAmount: 5000,
            discountAmount: 250, // 5000 - floor(5000 * 0.95) = 5000 - 4750 = 250
            payableAmount: 4750,
          }),
        }),
      );
    });

    it('should calculate discount correctly for multiple items', async () => {
      const createDataMulti = {
        memberId: 'member-1',
        items: [
          { serviceItemId: 'svc-1', staffId: 'staff-1', quantity: 2 },
        ],
      };

      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.serviceItem.findMany.mockResolvedValue([mockServiceItem]);
      prisma.staff.findMany.mockResolvedValue([mockStaff]);
      prisma.order.findFirst.mockResolvedValue(null);
      prisma.order.create.mockResolvedValue(mockOrder);
      prisma.orderItem.createMany.mockResolvedValue({ count: 1 });

      await service.create(shopId, createDataMulti);

      // unitPrice=5000, qty=2, subtotal=10000
      // discountRate=0.95, finalPrice=floor(10000*0.95)=9500
      // discount=500, payable=9500
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            originalAmount: 10000,
            discountAmount: 500,
            payableAmount: 9500,
          }),
        }),
      );
    });
  });

  describe('settle', () => {
    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.settle('nonexistent', shopId, { payments: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is not PENDING', async () => {
      prisma.order.findFirst.mockResolvedValue({ ...mockOrder, status: 'SETTLED' });

      await expect(
        service.settle('order-1', shopId, { payments: [{ method: 'OFFLINE' as any, amount: 4750 }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment amount does not match', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);

      await expect(
        service.settle('order-1', shopId, { payments: [{ method: 'OFFLINE' as any, amount: 1000 }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should settle with OFFLINE payment', async () => {
      prisma.order.findFirst
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockMember);
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: 'SETTLED', paidAmount: 4750 });

      const result = await service.settle('order-1', shopId, {
        payments: [{ method: 'OFFLINE' as any, amount: 4750 }],
      }, operatorId, ip);

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SETTLED',
            paidAmount: 4750,
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ORDER_SETTLE',
        }),
      );
    });

    it('should settle with BALANCE payment - gift balance first then principal', async () => {
      const orderToSettle = { ...mockOrder, payableAmount: 4000 };
      const memberWithBalance = {
        ...mockMember,
        principalBalance: 3000,
        giftBalance: 2000,
      };

      prisma.order.findFirst
        .mockResolvedValueOnce(orderToSettle)
        .mockResolvedValueOnce(memberWithBalance);
      prisma.member.findFirst.mockResolvedValue(memberWithBalance);
      prisma.member.update.mockResolvedValue({ ...memberWithBalance });
      prisma.order.update.mockResolvedValue({ ...orderToSettle, status: 'SETTLED' });

      await service.settle('order-1', shopId, {
        payments: [{ method: 'BALANCE' as any, amount: 4000 }],
      });

      // gift deduct = min(2000, 4000) = 2000
      // principal deduct = 4000 - 2000 = 2000
      expect(prisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            giftBalance: { decrement: 2000 },
            principalBalance: { decrement: 2000 },
            totalConsume: { increment: 4000 },
          }),
        }),
      );
    });

    it('should settle with BALANCE payment using principal only when no gift balance', async () => {
      const orderToSettle = { ...mockOrder, payableAmount: 3000 };
      const memberNoGift = {
        ...mockMember,
        principalBalance: 5000,
        giftBalance: 0,
      };

      prisma.order.findFirst
        .mockResolvedValueOnce(orderToSettle)
        .mockResolvedValueOnce(memberNoGift);
      prisma.member.findFirst.mockResolvedValue(memberNoGift);
      prisma.member.update.mockResolvedValue({ ...memberNoGift });
      prisma.order.update.mockResolvedValue({ ...orderToSettle, status: 'SETTLED' });

      await service.settle('order-1', shopId, {
        payments: [{ method: 'BALANCE' as any, amount: 3000 }],
      });

      // gift deduct = min(0, 3000) = 0
      // principal deduct = 3000 - 0 = 3000
      expect(prisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            giftBalance: { decrement: 0 },
            principalBalance: { decrement: 3000 },
            totalConsume: { increment: 3000 },
          }),
        }),
      );
    });

    it('should throw BadRequestException when balance is insufficient', async () => {
      const orderToSettle = { ...mockOrder, payableAmount: 6000 };
      const poorMember = {
        ...mockMember,
        principalBalance: 3000,
        giftBalance: 1000,
      };

      prisma.order.findFirst
        .mockResolvedValueOnce(orderToSettle)
        .mockResolvedValueOnce(poorMember);
      prisma.member.findFirst.mockResolvedValue(poorMember);

      await expect(
        service.settle('order-1', shopId, {
          payments: [{ method: 'BALANCE' as any, amount: 6000 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should settle with PASS_CARD payment and deduct remaining times', async () => {
      const passCard = {
        id: 'pc-1',
        remainingTimes: 5,
        expiresAt: new Date('2099-12-31'),
      };

      const memberWithPassCard = {
        ...mockMember,
        passCards: [passCard],
      };

      prisma.order.findFirst
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(memberWithPassCard);
      prisma.member.findFirst.mockResolvedValue(memberWithPassCard);
      prisma.passCard.findUnique.mockResolvedValue(passCard);
      prisma.passCardUsage.findMany.mockResolvedValue([]);
      prisma.passCard.update.mockResolvedValue({ ...passCard, remainingTimes: 4 });
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: 'SETTLED' });

      await service.settle('order-1', shopId, {
        payments: [{ method: 'PASS_CARD' as any, amount: 4750, passCardId: 'pc-1' }],
      });

      expect(prisma.passCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { remainingTimes: { decrement: 1 } },
        }),
      );
    });

    it('should throw NotFoundException when pass card not found on member', async () => {
      const memberNoPassCard = {
        ...mockMember,
        passCards: [],
      };

      prisma.order.findFirst
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(memberNoPassCard);
      prisma.member.findFirst.mockResolvedValue(memberNoPassCard);

      await expect(
        service.settle('order-1', shopId, {
          payments: [{ method: 'PASS_CARD' as any, amount: 4750, passCardId: 'nonexistent' }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when pass card is expired', async () => {
      const expiredCard = {
        id: 'pc-1',
        remainingTimes: 5,
        expiresAt: new Date('2020-01-01'),
      };

      const memberWithExpired = {
        ...mockMember,
        passCards: [expiredCard],
      };

      prisma.order.findFirst
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(memberWithExpired);
      prisma.member.findFirst.mockResolvedValue(memberWithExpired);

      await expect(
        service.settle('order-1', shopId, {
          payments: [{ method: 'PASS_CARD' as any, amount: 4750, passCardId: 'pc-1' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when pass card has no remaining times', async () => {
      const usedUpCard = {
        id: 'pc-1',
        remainingTimes: 0,
        expiresAt: new Date('2099-12-31'),
      };

      const memberWithUsedUp = {
        ...mockMember,
        passCards: [usedUpCard],
      };

      prisma.order.findFirst
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(memberWithUsedUp);
      prisma.member.findFirst.mockResolvedValue(memberWithUsedUp);

      await expect(
        service.settle('order-1', shopId, {
          payments: [{ method: 'PASS_CARD' as any, amount: 4750, passCardId: 'pc-1' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should settle with COUPON payment and mark coupon as USED', async () => {
      const coupon = {
        id: 'coupon-1',
        status: 'AVAILABLE',
        expiresAt: new Date('2099-12-31'),
      };

      const memberWithCoupon = {
        ...mockMember,
        couponInstances: [coupon],
      };

      prisma.order.findFirst
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(memberWithCoupon);
      prisma.member.findFirst.mockResolvedValue(memberWithCoupon);
      prisma.couponInstance.update.mockResolvedValue({ count: 1 });
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: 'SETTLED' });

      await service.settle('order-1', shopId, {
        payments: [{ method: 'COUPON' as any, amount: 4750, couponInstanceId: 'coupon-1' }],
      });

      expect(prisma.couponInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'USED', usedAt: expect.any(Date) },
        }),
      );
    });

    it('should throw BadRequestException when coupon is not AVAILABLE', async () => {
      const usedCoupon = {
        id: 'coupon-1',
        status: 'USED',
        expiresAt: new Date('2099-12-31'),
      };

      const memberWithUsedCoupon = {
        ...mockMember,
        couponInstances: [usedCoupon],
      };

      prisma.order.findFirst
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(memberWithUsedCoupon);
      prisma.member.findFirst.mockResolvedValue(memberWithUsedCoupon);

      await expect(
        service.settle('order-1', shopId, {
          payments: [{ method: 'COUPON' as any, amount: 4750, couponInstanceId: 'coupon-1' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.cancel('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is not SETTLED', async () => {
      prisma.order.findFirst.mockResolvedValue({ ...mockOrder, status: 'PENDING' });

      await expect(service.cancel('order-1', shopId)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when cancelling previous-day order', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);

      prisma.order.findFirst.mockResolvedValue({
        ...mockSettledOrder,
        settledAt: yesterday,
      });

      await expect(service.cancel('order-settled', shopId)).rejects.toThrow(ForbiddenException);
    });

    it('should cancel same-day settled order and restore balance', async () => {
      const settledToday = {
        ...mockSettledOrder,
        settledAt: new Date(),
        payments: [{ method: 'BALANCE', amount: 4750 }],
        items: [{ id: 'item-1' }],
      };

      prisma.order.findFirst.mockResolvedValue(settledToday);
      prisma.member.update.mockResolvedValue({ ...mockMember });
      prisma.order.update.mockResolvedValue({ ...settledToday, status: 'REFUNDED' });

      await service.cancel('order-settled', shopId, '不想要了', operatorId, ip);

      expect(prisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalConsume: { decrement: 4750 },
            principalBalance: { increment: 4750 },
          }),
        }),
      );
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REFUNDED',
            cancelReason: '不想要了',
            paidAmount: 0,
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ORDER_CANCEL' }),
      );
    });

    it('should restore pass card times on cancellation', async () => {
      const settledWithPassCard = {
        ...mockSettledOrder,
        settledAt: new Date(),
        payments: [{ method: 'PASS_CARD', amount: 4750, passCardId: 'pc-1' }],
        items: [{ id: 'item-1' }],
      };

      const mockUsage = { id: 'usage-1', passCardId: 'pc-1', orderItemId: 'item-1' };

      prisma.order.findFirst.mockResolvedValue(settledWithPassCard);
      prisma.passCardUsage.findMany.mockResolvedValue([mockUsage]);
      prisma.passCard.update.mockResolvedValue({ id: 'pc-1', remainingTimes: 6 });
      prisma.passCardUsage.delete.mockResolvedValue(mockUsage);
      prisma.order.update.mockResolvedValue({ ...settledWithPassCard, status: 'REFUNDED' });

      await service.cancel('order-settled', shopId);

      expect(prisma.passCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { remainingTimes: { increment: 1 } },
        }),
      );
      expect(prisma.passCardUsage.delete).toHaveBeenCalledWith({
        where: { id: 'usage-1' },
      });
    });

    it('should restore coupon on cancellation', async () => {
      const settledWithCoupon = {
        ...mockSettledOrder,
        settledAt: new Date(),
        payments: [{ method: 'COUPON', amount: 4750, detail: 'coupon-1' }],
        items: [{ id: 'item-1' }],
      };

      prisma.order.findFirst.mockResolvedValue(settledWithCoupon);
      prisma.couponInstance.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.update.mockResolvedValue({ ...settledWithCoupon, status: 'REFUNDED' });

      await service.cancel('order-settled', shopId);

      expect(prisma.couponInstance.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'AVAILABLE', usedAt: null },
        }),
      );
    });
  });

  describe('getStats', () => {
    it('should return today order statistics', async () => {
      prisma.order.count
        .mockResolvedValueOnce(5)    // todayOrders
        .mockResolvedValueOnce(2);   // pendingCount
      prisma.order.aggregate.mockResolvedValue({ _sum: { paidAmount: 50000 } });

      const result = await service.getStats(shopId);

      expect(result).toEqual({
        todayOrderCount: 5,
        todayRevenue: 50000,
        pendingCount: 2,
      });
    });
  });

  describe('update', () => {
    it('should throw BadRequestException when trying to cancel a settled order via update', async () => {
      prisma.order.findFirst.mockResolvedValue({ ...mockOrder, status: 'SETTLED' });

      await expect(
        service.update('order-1', shopId, { status: 'CANCELLED' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when modifying cancelled order', async () => {
      prisma.order.findFirst.mockResolvedValue({ ...mockOrder, status: 'CANCELLED' });

      await expect(
        service.update('order-1', shopId, { remark: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set settledAt when status changes to SETTLED', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: 'SETTLED' });

      await service.update('order-1', shopId, { status: 'SETTLED' as any });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SETTLED',
            settledAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should set cancelledAt when status changes to CANCELLED', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: 'CANCELLED' });

      await service.update('order-1', shopId, { status: 'CANCELLED' as any, cancelReason: '顾客要求' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED',
            cancelledAt: expect.any(Date),
            cancelReason: '顾客要求',
          }),
        }),
      );
    });
  });
});
