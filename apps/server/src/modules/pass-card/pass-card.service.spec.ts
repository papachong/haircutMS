import { PassCardService, PassCardStatus } from './pass-card.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PassCardService', () => {
  let service: PassCardService;
  let prisma: any;

  const shopId = 'shop-1234';

  const mockMember = {
    id: 'member-1',
    shopId,
    name: '张三',
    cardNo: 'M12340001',
    phone: '13800138000',
    memberLevel: { id: 'level-1', name: '普通会员', discount: 0.95 },
  };

  const mockPassCard = {
    id: 'pc-1',
    memberId: 'member-1',
    name: '10次理发卡',
    totalTimes: 10,
    remainingTimes: 8,
    price: 30000,
    isActive: true,
    expiresAt: new Date('2099-12-31'),
    createdAt: new Date(),
    member: mockMember,
    usages: [],
  };

  const mockExpiredPassCard = {
    ...mockPassCard,
    id: 'pc-expired',
    expiresAt: new Date('2020-01-01'),
  };

  const mockInactivePassCard = {
    ...mockPassCard,
    id: 'pc-inactive',
    isActive: false,
  };

  const mockUsedUpPassCard = {
    ...mockPassCard,
    id: 'pc-usedup',
    remainingTimes: 0,
  };

  beforeEach(() => {
    prisma = {
      passCard: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      passCardUsage: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      member: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(prisma)),
    };

    service = new PassCardService(prisma);
  });

  describe('findAll', () => {
    it('should return paginated pass cards', async () => {
      prisma.passCard.findMany.mockResolvedValue([mockPassCard]);
      prisma.passCard.count.mockResolvedValue(1);

      const result = await service.findAll(shopId, {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe(PassCardStatus.ACTIVE);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by memberId', async () => {
      prisma.passCard.findMany.mockResolvedValue([mockPassCard]);
      prisma.passCard.count.mockResolvedValue(1);

      await service.findAll(shopId, { memberId: 'member-1' });

      expect(prisma.passCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ memberId: 'member-1' }),
        }),
      );
    });

    it('should filter by availableOnly', async () => {
      prisma.passCard.findMany.mockResolvedValue([]);
      prisma.passCard.count.mockResolvedValue(0);

      await service.findAll(shopId, { availableOnly: true });

      expect(prisma.passCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                isActive: true,
                remainingTimes: { gt: 0 },
              }),
            ]),
          }),
        }),
      );
    });

    it('should calculate EXPIRED status for expired cards', async () => {
      prisma.passCard.findMany.mockResolvedValue([mockExpiredPassCard]);
      prisma.passCard.count.mockResolvedValue(1);

      const result = await service.findAll(shopId, {});

      expect(result.items[0].status).toBe(PassCardStatus.EXPIRED);
    });

    it('should calculate INACTIVE status', async () => {
      prisma.passCard.findMany.mockResolvedValue([mockInactivePassCard]);
      prisma.passCard.count.mockResolvedValue(1);

      const result = await service.findAll(shopId, {});

      expect(result.items[0].status).toBe(PassCardStatus.INACTIVE);
    });

    it('should calculate USED_UP status', async () => {
      prisma.passCard.findMany.mockResolvedValue([mockUsedUpPassCard]);
      prisma.passCard.count.mockResolvedValue(1);

      const result = await service.findAll(shopId, {});

      expect(result.items[0].status).toBe(PassCardStatus.USED_UP);
    });

    it('should filter by keyword', async () => {
      prisma.passCard.findMany.mockResolvedValue([]);
      prisma.passCard.count.mockResolvedValue(0);

      await service.findAll(shopId, { keyword: '理发' });

      expect(prisma.passCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { name: expect.objectContaining({ contains: '理发' }) },
                ]),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return pass card with details', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockPassCard);

      const result = await service.findById('pc-1', shopId);

      expect(result.id).toBe('pc-1');
      expect(result.status).toBe(PassCardStatus.ACTIVE);
    });

    it('should throw NotFoundException when pass card not found', async () => {
      prisma.passCard.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a pass card for a valid member', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.passCard.create.mockResolvedValue(mockPassCard);

      const result = await service.create(shopId, {
        memberId: 'member-1',
        name: '10次理发卡',
        totalTimes: 10,
        price: 30000,
      });

      expect(result).toEqual(mockPassCard);
      expect(prisma.passCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            memberId: 'member-1',
            name: '10次理发卡',
            totalTimes: 10,
            remainingTimes: 10,
            price: 30000,
            isActive: true,
          }),
        }),
      );
    });

    it('should throw NotFoundException when member not found', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.create(shopId, {
          memberId: 'nonexistent',
          name: '10次理发卡',
          totalTimes: 10,
          price: 30000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set remainingTimes equal to totalTimes on creation', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.passCard.create.mockResolvedValue(mockPassCard);

      await service.create(shopId, {
        memberId: 'member-1',
        name: '5次理发卡',
        totalTimes: 5,
        price: 15000,
      });

      expect(prisma.passCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalTimes: 5,
            remainingTimes: 5,
          }),
        }),
      );
    });

    it('should respect isActive flag when provided as false', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.passCard.create.mockResolvedValue({ ...mockPassCard, isActive: false });

      await service.create(shopId, {
        memberId: 'member-1',
        name: '10次理发卡',
        totalTimes: 10,
        price: 30000,
        isActive: false,
      });

      expect(prisma.passCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it('should set expiresAt when provided', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.passCard.create.mockResolvedValue(mockPassCard);

      const futureDate = new Date('2099-12-31');

      await service.create(shopId, {
        memberId: 'member-1',
        name: '10次理发卡',
        totalTimes: 10,
        price: 30000,
        expiresAt: futureDate,
      });

      expect(prisma.passCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expiresAt: futureDate }),
        }),
      );
    });
  });

  describe('use', () => {
    it('should deduct one time and create usage record', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockPassCard);
      prisma.passCardUsage.findUnique.mockResolvedValue(null);
      prisma.passCard.update.mockResolvedValue({ ...mockPassCard, remainingTimes: 7 });
      prisma.passCardUsage.create.mockResolvedValue({
        id: 'usage-1',
        passCardId: 'pc-1',
        orderItemId: 'item-1',
      });

      const result = await service.use('pc-1', shopId, 'item-1');

      expect(result.passCard.remainingTimes).toBe(7);
      expect(prisma.passCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { remainingTimes: { decrement: 1 } },
        }),
      );
    });

    it('should throw NotFoundException when pass card not found', async () => {
      prisma.passCard.findFirst.mockResolvedValue(null);

      await expect(service.use('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when pass card is inactive', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockInactivePassCard);

      await expect(service.use('pc-inactive', shopId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when pass card is expired', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockExpiredPassCard);

      await expect(service.use('pc-expired', shopId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no remaining times', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockUsedUpPassCard);

      await expect(service.use('pc-usedup', shopId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when order item already linked', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockPassCard);
      prisma.passCardUsage.findUnique.mockResolvedValue({ id: 'existing-usage' });

      await expect(service.use('pc-1', shopId, 'item-1')).rejects.toThrow(BadRequestException);
    });

    it('should allow usage without orderItemId', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockPassCard);
      prisma.passCard.update.mockResolvedValue({ ...mockPassCard, remainingTimes: 7 });
      prisma.passCardUsage.create.mockResolvedValue({
        id: 'usage-1',
        passCardId: 'pc-1',
        orderItemId: null,
      });

      await service.use('pc-1', shopId);

      expect(prisma.passCardUsage.findUnique).not.toHaveBeenCalled();
      expect(prisma.passCard.update).toHaveBeenCalled();
    });
  });

  describe('refundUsage', () => {
    it('should restore one time and delete usage record', async () => {
      const mockUsage = { id: 'usage-1', passCardId: 'pc-1', orderItemId: 'item-1' };

      prisma.passCard.findFirst.mockResolvedValue(mockPassCard);
      prisma.passCardUsage.findUnique.mockResolvedValue(mockUsage);
      prisma.passCard.update.mockResolvedValue({ ...mockPassCard, remainingTimes: 9 });
      prisma.passCardUsage.delete.mockResolvedValue(mockUsage);

      const result = await service.refundUsage('pc-1', 'usage-1', shopId);

      expect(prisma.passCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { remainingTimes: { increment: 1 } },
        }),
      );
      expect(prisma.passCardUsage.delete).toHaveBeenCalledWith({
        where: { id: 'usage-1' },
      });
    });

    it('should throw NotFoundException when pass card not found', async () => {
      prisma.passCard.findFirst.mockResolvedValue(null);

      await expect(service.refundUsage('nonexistent', 'usage-1', shopId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when usage not found', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockPassCard);
      prisma.passCardUsage.findUnique.mockResolvedValue(null);

      await expect(service.refundUsage('pc-1', 'nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when usage belongs to different pass card', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockPassCard);
      prisma.passCardUsage.findUnique.mockResolvedValue({
        id: 'usage-1',
        passCardId: 'pc-other',
      });

      await expect(service.refundUsage('pc-1', 'usage-1', shopId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockPassCard);
      prisma.passCard.update.mockResolvedValue({ ...mockPassCard, isActive: false });

      const result = await service.deactivate('pc-1', shopId);

      expect(prisma.passCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        }),
      );
    });

    it('should throw NotFoundException when pass card not found', async () => {
      prisma.passCard.findFirst.mockResolvedValue(null);

      await expect(service.deactivate('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('activate', () => {
    it('should set isActive to true', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockInactivePassCard);
      prisma.passCard.update.mockResolvedValue({ ...mockPassCard, isActive: true });

      await service.activate('pc-inactive', shopId);

      expect(prisma.passCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: true },
        }),
      );
    });

    it('should throw NotFoundException when pass card not found', async () => {
      prisma.passCard.findFirst.mockResolvedValue(null);

      await expect(service.activate('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUsages', () => {
    it('should return paginated usage history', async () => {
      prisma.passCard.findFirst.mockResolvedValue(mockPassCard);
      prisma.passCardUsage.findMany.mockResolvedValue([]);
      prisma.passCardUsage.count.mockResolvedValue(0);

      const result = await service.getUsages('pc-1', shopId, 1, 20);

      expect(result.pagination).toEqual({ total: 0, page: 1, pageSize: 20, hasMore: false });
    });

    it('should throw NotFoundException when pass card not found', async () => {
      prisma.passCard.findFirst.mockResolvedValue(null);

      await expect(service.getUsages('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });
  });
});
