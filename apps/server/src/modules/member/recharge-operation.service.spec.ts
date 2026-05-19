import { RechargeOperationService } from './recharge-operation.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PayMethod } from './dto/recharge.dto';

describe('RechargeOperationService', () => {
  let service: RechargeOperationService;
  let prisma: any;
  let auditService: any;
  let rechargePlanService: any;

  const shopId = 'shop-1234';
  const memberId = 'member-1';
  const operatorId = 'staff-001';
  const ip = '127.0.0.1';

  const mockMember = {
    id: memberId,
    shopId,
    cardNo: 'M12340001',
    name: '张三',
    phone: '13800138000',
    principalBalance: 10000,
    giftBalance: 2000,
    totalRecharge: 10000,
    isActive: true,
  };

  const mockPlan = {
    id: 'plan-1',
    shopId,
    name: '充500送50',
    amount: 50000,
    giftAmount: 5000,
    isActive: true,
    type: 'DIRECT',
  };

  const mockRechargeRecord = {
    id: 'record-1',
    memberId,
    operatorId,
    planId: 'plan-1',
    amount: 50000,
    giftAmount: 5000,
    payMethod: 'CASH',
    createdAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      member: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      rechargePlan: {
        findFirst: jest.fn(),
      },
      rechargeRecord: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(prisma)),
    };

    auditService = {
      log: jest.fn(),
    };

    rechargePlanService = {
      findAll: jest.fn(),
    };

    service = new RechargeOperationService(prisma, auditService, rechargePlanService);
  });

  describe('recharge', () => {
    it('should throw BadRequestException when no planId and no amount provided', async () => {
      await expect(
        service.recharge(memberId, shopId, operatorId, ip, {
          payMethod: PayMethod.CASH,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should recharge with a plan', async () => {
      prisma.rechargePlan.findFirst.mockResolvedValue(mockPlan);
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.rechargeRecord.create.mockResolvedValue(mockRechargeRecord);
      prisma.member.update.mockResolvedValue({
        ...mockMember,
        principalBalance: 60000,
        giftBalance: 7000,
      });
      prisma.member.findUnique.mockResolvedValue({
        ...mockMember,
        principalBalance: 60000,
        giftBalance: 7000,
      });

      const result = await service.recharge(memberId, shopId, operatorId, ip, {
        planId: 'plan-1',
        payMethod: PayMethod.CASH,
      });

      expect(result.rechargeRecord.amount).toBe(50000);
      expect(result.rechargeRecord.giftAmount).toBe(5000);
      expect(prisma.rechargeRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            memberId,
            operatorId,
            planId: 'plan-1',
            amount: 50000,
            giftAmount: 5000,
          }),
        }),
      );
      // Verify balance increments
      expect(prisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            principalBalance: { increment: 50000 },
            giftBalance: { increment: 5000 },
            totalRecharge: { increment: 50000 },
          },
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RECHARGE',
          detail: expect.objectContaining({
            amount: 50000,
            giftAmount: 5000,
          }),
        }),
      );
    });

    it('should throw NotFoundException when plan not found or inactive', async () => {
      prisma.rechargePlan.findFirst.mockResolvedValue(null);

      await expect(
        service.recharge(memberId, shopId, operatorId, ip, {
          planId: 'nonexistent',
          payMethod: PayMethod.CASH,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when amount does not match plan', async () => {
      prisma.rechargePlan.findFirst.mockResolvedValue(mockPlan);

      await expect(
        service.recharge(memberId, shopId, operatorId, ip, {
          planId: 'plan-1',
          amount: 10000,
          payMethod: PayMethod.CASH,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when member not found', async () => {
      prisma.rechargePlan.findFirst.mockResolvedValue(mockPlan);
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.recharge(memberId, shopId, operatorId, ip, {
          planId: 'plan-1',
          payMethod: PayMethod.CASH,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should recharge with direct amount (no plan)', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.rechargeRecord.create.mockResolvedValue({
        ...mockRechargeRecord,
        planId: null,
        amount: 30000,
        giftAmount: 0,
      });
      prisma.member.update.mockResolvedValue({
        ...mockMember,
        principalBalance: 40000,
      });
      prisma.member.findUnique.mockResolvedValue({
        ...mockMember,
        principalBalance: 40000,
      });

      const result = await service.recharge(memberId, shopId, operatorId, ip, {
        amount: 30000,
        payMethod: PayMethod.WECHAT,
      });

      expect(result.rechargeRecord.amount).toBe(30000);
      expect(result.rechargeRecord.giftAmount).toBe(0);
    });

    it('should recharge with direct amount and custom giftAmount', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.rechargeRecord.create.mockResolvedValue({
        ...mockRechargeRecord,
        planId: null,
        amount: 30000,
        giftAmount: 3000,
      });
      prisma.member.update.mockResolvedValue({
        ...mockMember,
        principalBalance: 40000,
        giftBalance: 5000,
      });
      prisma.member.findUnique.mockResolvedValue({
        ...mockMember,
        principalBalance: 40000,
        giftBalance: 5000,
      });

      const result = await service.recharge(memberId, shopId, operatorId, ip, {
        amount: 30000,
        giftAmount: 3000,
        payMethod: PayMethod.ALIPAY,
      });

      expect(result.rechargeRecord.giftAmount).toBe(3000);
      expect(prisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            principalBalance: { increment: 30000 },
            giftBalance: { increment: 3000 },
            totalRecharge: { increment: 30000 },
          },
        }),
      );
    });

    it('should allow amount matching plan amount', async () => {
      prisma.rechargePlan.findFirst.mockResolvedValue(mockPlan);
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.rechargeRecord.create.mockResolvedValue(mockRechargeRecord);
      prisma.member.update.mockResolvedValue(mockMember);
      prisma.member.findUnique.mockResolvedValue(mockMember);

      // Should not throw - amount matches plan amount
      const result = await service.recharge(memberId, shopId, operatorId, ip, {
        planId: 'plan-1',
        amount: 50000,
        payMethod: PayMethod.CASH,
      });

      expect(result.rechargeRecord.amount).toBe(50000);
    });
  });

  describe('getRechargeHistory', () => {
    it('should throw NotFoundException when member not found', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.getRechargeHistory('nonexistent', shopId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return paginated recharge history', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.rechargeRecord.findMany.mockResolvedValue([mockRechargeRecord]);
      prisma.rechargeRecord.count.mockResolvedValue(1);

      const result = await service.getRechargeHistory(memberId, shopId, {
        page: 1,
        pageSize: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      });
    });

    it('should use default pagination values', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.rechargeRecord.findMany.mockResolvedValue([]);
      prisma.rechargeRecord.count.mockResolvedValue(0);

      await service.getRechargeHistory(memberId, shopId, {});

      expect(prisma.rechargeRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should calculate hasMore correctly', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.rechargeRecord.findMany.mockResolvedValue([]);
      prisma.rechargeRecord.count.mockResolvedValue(25);

      const result = await service.getRechargeHistory(memberId, shopId, { page: 1, pageSize: 20 });

      expect(result.pagination.hasMore).toBe(true);
    });

    it('should include operator and plan details', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.rechargeRecord.findMany.mockResolvedValue([mockRechargeRecord]);
      prisma.rechargeRecord.count.mockResolvedValue(1);

      await service.getRechargeHistory(memberId, shopId, {});

      expect(prisma.rechargeRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            operator: expect.any(Object),
            plan: expect.any(Object),
          }),
        }),
      );
    });
  });
});
