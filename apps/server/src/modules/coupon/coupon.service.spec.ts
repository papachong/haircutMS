import { CouponService } from './coupon.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('CouponService', () => {
  let service: CouponService;
  let prisma: any;

  const shopId = 'shop-1234';

  const mockTemplate = {
    id: 'tpl-1',
    shopId,
    name: '满100减20',
    type: 'FIXED',
    threshold: 10000,
    discount: 2000,
    total: 100,
    issued: 10,
    startsAt: new Date('2026-01-01'),
    endsAt: new Date('2099-12-31'),
    isActive: true,
    createdAt: new Date(),
  };

  const mockMember = {
    id: 'member-1',
    shopId,
    name: '张三',
    cardNo: 'M12340001',
    isActive: true,
  };

  const mockCouponInstance = {
    id: 'coupon-1',
    templateId: 'tpl-1',
    memberId: 'member-1',
    status: 'AVAILABLE',
    expiresAt: new Date('2099-12-31'),
    createdAt: new Date(),
    template: mockTemplate,
  };

  beforeEach(() => {
    prisma = {
      couponTemplate: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      couponInstance: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      member: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(prisma)),
    };

    service = new CouponService(prisma);
  });

  describe('findTemplates', () => {
    it('should return paginated coupon templates', async () => {
      prisma.couponTemplate.findMany.mockResolvedValue([{
        ...mockTemplate,
        _count: { instances: 5 },
      }]);
      prisma.couponTemplate.count.mockResolvedValue(1);

      const result = await service.findTemplates(shopId, {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].availableCount).toBe(5);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by type', async () => {
      prisma.couponTemplate.findMany.mockResolvedValue([]);
      prisma.couponTemplate.count.mockResolvedValue(0);

      await service.findTemplates(shopId, { type: 'FIXED' });

      expect(prisma.couponTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'FIXED' }),
        }),
      );
    });

    it('should filter by isActive status', async () => {
      prisma.couponTemplate.findMany.mockResolvedValue([]);
      prisma.couponTemplate.count.mockResolvedValue(0);

      await service.findTemplates(shopId, { isActive: true });

      expect(prisma.couponTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('findTemplateById', () => {
    it('should return template with usage stats', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue({
        ...mockTemplate,
        _count: { instances: 10 },
      });
      prisma.couponInstance.count
        .mockResolvedValueOnce(5)  // availableCount
        .mockResolvedValueOnce(3); // usedCount

      const result = await service.findTemplateById('tpl-1', shopId);

      expect(result.availableCount).toBe(5);
      expect(result.usedCount).toBe(3);
    });

    it('should throw NotFoundException when template not found', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue(null);

      await expect(service.findTemplateById('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTemplate', () => {
    it('should create a FIXED coupon template', async () => {
      prisma.couponTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(shopId, {
        name: '满100减20',
        type: 'FIXED',
        threshold: 10000,
        discount: 2000,
        total: 100,
        startsAt: '2026-01-01',
        endsAt: '2099-12-31',
      });

      expect(result).toEqual(mockTemplate);
      expect(prisma.couponTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shopId,
            name: '满100减20',
            type: 'FIXED',
            threshold: 10000,
            discount: 2000,
            total: 100,
            issued: 0,
          }),
        }),
      );
    });

    it('should throw BadRequestException when endsAt <= startsAt', async () => {
      await expect(
        service.createTemplate(shopId, {
          name: 'Bad dates',
          type: 'FIXED',
          threshold: 100,
          discount: 10,
          total: 50,
          startsAt: '2026-06-01',
          endsAt: '2026-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when PERCENT discount out of range', async () => {
      await expect(
        service.createTemplate(shopId, {
          name: 'Bad percent',
          type: 'PERCENT',
          threshold: 100,
          discount: 150,
          total: 50,
          startsAt: '2026-01-01',
          endsAt: '2099-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when PERCENT discount is 0', async () => {
      await expect(
        service.createTemplate(shopId, {
          name: 'Zero percent',
          type: 'PERCENT',
          threshold: 100,
          discount: 0,
          total: 50,
          startsAt: '2026-01-01',
          endsAt: '2099-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when FIXED discount >= threshold with positive threshold', async () => {
      await expect(
        service.createTemplate(shopId, {
          name: 'Too much discount',
          type: 'FIXED',
          threshold: 10000,
          discount: 10000,
          total: 50,
          startsAt: '2026-01-01',
          endsAt: '2099-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create PERCENT coupon with valid discount range', async () => {
      prisma.couponTemplate.create.mockResolvedValue({
        ...mockTemplate,
        type: 'PERCENT',
        discount: 20,
      });

      const result = await service.createTemplate(shopId, {
        name: '8折优惠券',
        type: 'PERCENT',
        threshold: 10000,
        discount: 20,
        total: 100,
        startsAt: '2026-01-01',
        endsAt: '2099-12-31',
      });

      expect(result.type).toBe('PERCENT');
    });

    it('should default isActive to true', async () => {
      prisma.couponTemplate.create.mockResolvedValue(mockTemplate);

      await service.createTemplate(shopId, {
        name: 'Test',
        type: 'FIXED',
        threshold: 0,
        discount: 1000,
        total: 10,
        startsAt: '2026-01-01',
        endsAt: '2099-12-31',
      });

      expect(prisma.couponTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('updateTemplate', () => {
    it('should throw NotFoundException when template not found', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTemplate('nonexistent', shopId, { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update template fields', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue(mockTemplate);
      prisma.couponTemplate.update.mockResolvedValue({ ...mockTemplate, name: '新名称' });

      const result = await service.updateTemplate('tpl-1', shopId, { name: '新名称' });

      expect(result.name).toBe('新名称');
    });

    it('should validate PERCENT discount on update', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue(mockTemplate);

      await expect(
        service.updateTemplate('tpl-1', shopId, { type: 'PERCENT', discount: 150 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template with no issued coupons', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue(mockTemplate);
      prisma.couponInstance.count.mockResolvedValue(0);
      prisma.couponTemplate.delete.mockResolvedValue(mockTemplate);

      const result = await service.deleteTemplate('tpl-1', shopId);

      expect(result.success).toBe(true);
      expect(prisma.couponTemplate.delete).toHaveBeenCalledWith({ where: { id: 'tpl-1' } });
    });

    it('should throw NotFoundException when template not found', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue(null);

      await expect(service.deleteTemplate('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when template has issued coupons', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue(mockTemplate);
      prisma.couponInstance.count.mockResolvedValue(5);

      await expect(service.deleteTemplate('tpl-1', shopId)).rejects.toThrow(ConflictException);
    });
  });

  describe('issueCoupons', () => {
    it('should issue coupons to members', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue(mockTemplate);
      prisma.member.findMany.mockResolvedValue([mockMember]);
      prisma.couponTemplate.update.mockResolvedValue({ ...mockTemplate, issued: 11 });
      prisma.couponInstance.createMany.mockResolvedValue({ count: 1 });
      prisma.couponInstance.findMany.mockResolvedValue([{
        ...mockCouponInstance,
        member: { id: 'member-1', name: '张三', cardNo: 'M12340001' },
      }]);

      const result = await service.issueCoupons('tpl-1', shopId, ['member-1']);

      expect(result.issued).toBe(1);
      expect(prisma.couponInstance.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              templateId: 'tpl-1',
              memberId: 'member-1',
              status: 'AVAILABLE',
            }),
          ]),
        }),
      );
    });

    it('should throw NotFoundException when template not found', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.issueCoupons('nonexistent', shopId, ['member-1']),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when template is inactive', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue({ ...mockTemplate, isActive: false });

      await expect(
        service.issueCoupons('tpl-1', shopId, ['member-1']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when not enough coupons available', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue({ ...mockTemplate, total: 10, issued: 10 });

      await expect(
        service.issueCoupons('tpl-1', shopId, ['member-1']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when some members not found', async () => {
      prisma.couponTemplate.findFirst.mockResolvedValue(mockTemplate);
      prisma.member.findMany.mockResolvedValue([]); // no members found

      await expect(
        service.issueCoupons('tpl-1', shopId, ['member-1', 'member-2']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should issue batch coupons to multiple members', async () => {
      const member2 = { ...mockMember, id: 'member-2' };
      prisma.couponTemplate.findFirst.mockResolvedValue(mockTemplate);
      prisma.member.findMany.mockResolvedValue([mockMember, member2]);
      prisma.couponTemplate.update.mockResolvedValue({ ...mockTemplate, issued: 12 });
      prisma.couponInstance.createMany.mockResolvedValue({ count: 2 });
      prisma.couponInstance.findMany.mockResolvedValue([
        { ...mockCouponInstance, member: { id: 'member-1', name: '张三', cardNo: 'M12340001' } },
        { ...mockCouponInstance, id: 'coupon-2', memberId: 'member-2', member: { id: 'member-2', name: '李四', cardNo: 'M12340002' } },
      ]);

      const result = await service.issueCoupons('tpl-1', shopId, ['member-1', 'member-2']);

      expect(result.issued).toBe(2);
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate FIXED discount correctly', async () => {
      prisma.couponInstance.findFirst.mockResolvedValue(mockCouponInstance);

      const result = await service.calculateDiscount(
        { amount: 20000, couponInstanceId: 'coupon-1' },
        shopId,
      );

      expect(result.canUse).toBe(true);
      expect(result.discount).toBe(2000);
      expect(result.finalAmount).toBe(18000);
    });

    it('should calculate PERCENT discount correctly', async () => {
      prisma.couponInstance.findFirst.mockResolvedValue({
        ...mockCouponInstance,
        template: { ...mockTemplate, type: 'PERCENT', discount: 20 },
      });

      const result = await service.calculateDiscount(
        { amount: 10000, couponInstanceId: 'coupon-1' },
        shopId,
      );

      expect(result.canUse).toBe(true);
      expect(result.discount).toBe(2000); // Math.floor(10000 * 20 / 100)
      expect(result.finalAmount).toBe(8000);
    });

    it('should reject used coupon', async () => {
      prisma.couponInstance.findFirst.mockResolvedValue({
        ...mockCouponInstance,
        status: 'USED',
      });

      const result = await service.calculateDiscount(
        { amount: 20000, couponInstanceId: 'coupon-1' },
        shopId,
      );

      expect(result.canUse).toBe(false);
      expect(result.reason).toBe('Coupon has been used');
    });

    it('should reject expired coupon', async () => {
      prisma.couponInstance.findFirst.mockResolvedValue({
        ...mockCouponInstance,
        expiresAt: new Date('2020-01-01'),
      });

      const result = await service.calculateDiscount(
        { amount: 20000, couponInstanceId: 'coupon-1' },
        shopId,
      );

      expect(result.canUse).toBe(false);
      expect(result.reason).toBe('Coupon has expired');
    });

    it('should reject when amount below threshold', async () => {
      prisma.couponInstance.findFirst.mockResolvedValue(mockCouponInstance);

      const result = await service.calculateDiscount(
        { amount: 5000, couponInstanceId: 'coupon-1' },
        shopId,
      );

      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('Minimum spend');
    });

    it('should reject when template is inactive', async () => {
      prisma.couponInstance.findFirst.mockResolvedValue({
        ...mockCouponInstance,
        template: { ...mockTemplate, isActive: false },
      });

      const result = await service.calculateDiscount(
        { amount: 20000, couponInstanceId: 'coupon-1' },
        shopId,
      );

      expect(result.canUse).toBe(false);
      expect(result.reason).toBe('Coupon template is inactive');
    });

    it('should throw NotFoundException when coupon not found', async () => {
      prisma.couponInstance.findFirst.mockResolvedValue(null);

      await expect(
        service.calculateDiscount({ amount: 10000, couponInstanceId: 'nonexistent' }, shopId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should ensure finalAmount is never negative', async () => {
      prisma.couponInstance.findFirst.mockResolvedValue({
        ...mockCouponInstance,
        template: { ...mockTemplate, discount: 50000 }, // discount > amount
      });

      const result = await service.calculateDiscount(
        { amount: 20000, couponInstanceId: 'coupon-1' },
        shopId,
      );

      expect(result.finalAmount).toBe(0);
    });
  });

  describe('findMemberCoupons', () => {
    it('should throw NotFoundException when member not found', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.findMemberCoupons('nonexistent', shopId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return paginated member coupons', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.couponInstance.findMany.mockResolvedValue([mockCouponInstance]);
      prisma.couponInstance.count.mockResolvedValue(1);

      const result = await service.findMemberCoupons('member-1', shopId, {});

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should mark expired AVAILABLE coupons as EXPIRED', async () => {
      const expiredCoupon = {
        ...mockCouponInstance,
        status: 'AVAILABLE',
        expiresAt: new Date('2020-01-01'),
      };

      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.couponInstance.findMany.mockResolvedValue([expiredCoupon]);
      prisma.couponInstance.count.mockResolvedValue(1);

      const result = await service.findMemberCoupons('member-1', shopId, {});

      expect(result.items[0].status).toBe('EXPIRED');
    });

    it('should filter by status', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.couponInstance.findMany.mockResolvedValue([]);
      prisma.couponInstance.count.mockResolvedValue(0);

      await service.findMemberCoupons('member-1', shopId, { status: 'AVAILABLE' });

      expect(prisma.couponInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'AVAILABLE' }),
        }),
      );
    });
  });

  describe('getAvailableCoupons', () => {
    it('should return only usable coupons for given amount', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.couponInstance.findMany.mockResolvedValue([
        { ...mockCouponInstance, template: { ...mockTemplate, threshold: 5000, type: 'FIXED', discount: 1000, isActive: true } },
        { ...mockCouponInstance, id: 'coupon-2', template: { ...mockTemplate, threshold: 50000, type: 'FIXED', discount: 5000, isActive: true } },
      ]);

      const result = await service.getAvailableCoupons('member-1', shopId, 10000);

      // First coupon: threshold 5000 <= 10000, canUse=true
      expect(result[0].canUse).toBe(true);
      expect(result[0].discount).toBe(1000);
      // Second coupon: threshold 50000 > 10000, canUse=false
      expect(result[1].canUse).toBe(false);
    });

    it('should throw NotFoundException when member not found', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.getAvailableCoupons('nonexistent', shopId, 10000),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMemberSummary', () => {
    it('should return coupon summary with counts', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.couponInstance.count
        .mockResolvedValueOnce(3)  // available
        .mockResolvedValueOnce(5)  // used
        .mockResolvedValueOnce(2); // expired
      prisma.couponInstance.findMany.mockResolvedValue([]);

      const result = await service.getMemberSummary('member-1', shopId);

      expect(result.available).toBe(3);
      expect(result.used).toBe(5);
      expect(result.expired).toBe(2);
    });

    it('should throw NotFoundException when member not found', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.getMemberSummary('nonexistent', shopId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
