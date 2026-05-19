import { MemberService } from './member.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('MemberService', () => {
  let service: MemberService;
  let prisma: any;
  let auditService: any;

  const shopId = 'shop-1234';
  const operatorId = 'staff-001';
  const ip = '127.0.0.1';

  const mockMemberLevel = {
    id: 'level-1',
    name: '普通会员',
    discount: 0.95,
  };

  const mockMember = {
    id: 'member-1',
    shopId,
    cardNo: 'M12340001',
    name: '张三',
    phone: '13800138000',
    gender: 'MALE',
    memberLevelId: 'level-1',
    memberLevel: mockMemberLevel,
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      member: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      memberLevel: {
        findFirst: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn(),
    };

    service = new MemberService(prisma, auditService);
  });

  describe('findAll', () => {
    it('should return paginated members for a shop', async () => {
      const members = [mockMember];
      prisma.member.findMany.mockResolvedValue(members);
      prisma.member.count.mockResolvedValue(1);

      const result = await service.findAll(shopId, { page: 1, pageSize: 20 });

      expect(result.items).toEqual(members);
      expect(result.pagination).toEqual({ total: 1, page: 1, pageSize: 20, hasMore: false });
      expect(prisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopId, isActive: true },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should filter members by keyword (name, phone, cardNo)', async () => {
      prisma.member.findMany.mockResolvedValue([mockMember]);
      prisma.member.count.mockResolvedValue(1);

      await service.findAll(shopId, { keyword: '张三' });

      expect(prisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            shopId,
            isActive: true,
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: '张三' }) }),
              expect.objectContaining({ phone: expect.objectContaining({ contains: '张三' }) }),
              expect.objectContaining({ cardNo: expect.objectContaining({ contains: '张三' }) }),
            ]),
          }),
        }),
      );
    });

    it('should use default pagination values', async () => {
      prisma.member.findMany.mockResolvedValue([]);
      prisma.member.count.mockResolvedValue(0);

      await service.findAll(shopId, {});

      expect(prisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should calculate hasMore correctly', async () => {
      prisma.member.findMany.mockResolvedValue([]);
      prisma.member.count.mockResolvedValue(25);

      const result = await service.findAll(shopId, { page: 1, pageSize: 20 });

      expect(result.pagination.hasMore).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return member with full details', async () => {
      const fullMember = { ...mockMember, tagRelations: [], rechargeRecords: [], orders: [], passCards: [] };
      prisma.member.findFirst.mockResolvedValue(fullMember);

      const result = await service.findById('member-1', shopId);

      expect(result).toEqual(fullMember);
      expect(prisma.member.findFirst).toHaveBeenCalledWith({
        where: { id: 'member-1', shopId },
        include: expect.objectContaining({
          memberLevel: true,
          tagRelations: expect.any(Object),
          rechargeRecords: expect.any(Object),
          orders: expect.any(Object),
          passCards: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException when member not found', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchByKeyword', () => {
    it('should return empty array when keyword is shorter than 2 characters', async () => {
      const result = await service.searchByKeyword(shopId, '张');

      expect(result).toEqual([]);
      expect(prisma.member.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array for empty keyword', async () => {
      const result = await service.searchByKeyword(shopId, '');

      expect(result).toEqual([]);
    });

    it('should search by keyword and return matching members', async () => {
      prisma.member.findMany.mockResolvedValue([mockMember]);

      const result = await service.searchByKeyword(shopId, '张三');

      expect(result).toEqual([mockMember]);
      expect(prisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            shopId,
            isActive: true,
            OR: expect.any(Array),
          }),
          take: 10,
        }),
      );
    });
  });

  describe('create', () => {
    const createData = {
      name: '李四',
      phone: '13900139000',
      gender: 'FEMALE',
    };

    it('should create a member with auto-generated card number', async () => {
      prisma.member.findFirst.mockResolvedValue(null); // no existing phone
      prisma.memberLevel.findFirst.mockResolvedValue(mockMemberLevel);
      prisma.member.count.mockResolvedValue(5);
      prisma.member.create.mockResolvedValue({
        ...mockMember,
        name: '李四',
        phone: '13900139000',
        cardNo: 'M12340006',
      });

      const result = await service.create(shopId, createData, operatorId, ip);

      expect(result.name).toBe('李四');
      expect(result.cardNo).toBe('M12340006');
      expect(prisma.member.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shopId,
            name: '李四',
            phone: '13900139000',
            cardNo: 'M12340006',
            memberLevelId: 'level-1',
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          shopId,
          action: 'MEMBER_CREATE',
          targetId: expect.any(String),
        }),
      );
    });

    it('should throw ConflictException when phone already exists', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);

      await expect(service.create(shopId, createData)).rejects.toThrow(ConflictException);
      expect(prisma.member.create).not.toHaveBeenCalled();
    });

    it('should use provided memberLevelId when given', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.member.count.mockResolvedValue(0);

      const dataWithLevel = { ...createData, memberLevelId: 'level-vip' };
      prisma.member.create.mockResolvedValue({
        ...mockMember,
        memberLevelId: 'level-vip',
      });

      await service.create(shopId, dataWithLevel);

      expect(prisma.member.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            memberLevelId: 'level-vip',
          }),
        }),
      );
      expect(prisma.memberLevel.findFirst).not.toHaveBeenCalled();
    });

    it('should fall back to default level when no memberLevelId provided', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.memberLevel.findFirst.mockResolvedValue(mockMemberLevel);
      prisma.member.count.mockResolvedValue(0);
      prisma.member.create.mockResolvedValue(mockMember);

      await service.create(shopId, createData);

      expect(prisma.memberLevel.findFirst).toHaveBeenCalledWith({
        where: { shopId },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should handle birthday conversion to Date', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.memberLevel.findFirst.mockResolvedValue(mockMemberLevel);
      prisma.member.count.mockResolvedValue(0);
      prisma.member.create.mockResolvedValue(mockMember);

      await service.create(shopId, { ...createData, birthday: '2000-01-15' });

      expect(prisma.member.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            birthday: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update member fields', async () => {
      const existing = { ...mockMember, memberLevelId: 'level-1' };
      prisma.member.findFirst.mockResolvedValue(existing);
      prisma.member.update.mockResolvedValue({ ...mockMember, name: '张三丰' });

      const result = await service.update('member-1', shopId, { name: '张三丰' });

      expect(result.name).toBe('张三丰');
      expect(prisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'member-1' },
          data: expect.objectContaining({ name: '张三丰' }),
        }),
      );
    });

    it('should throw NotFoundException when member not found', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', shopId, { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new phone conflicts', async () => {
      prisma.member.findFirst
        .mockResolvedValueOnce({ ...mockMember, phone: '13800138000' }) // existing member
        .mockResolvedValueOnce({ id: 'other', phone: '13900139000' }); // phone conflict

      await expect(
        service.update('member-1', shopId, { phone: '13900139000' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to the same phone number', async () => {
      prisma.member.findFirst.mockResolvedValue({ ...mockMember, phone: '13800138000' });
      prisma.member.update.mockResolvedValue(mockMember);

      await service.update('member-1', shopId, { phone: '13800138000' });

      // Should not check for phone conflict since phone is the same
      expect(prisma.member.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.member.update).toHaveBeenCalled();
    });

    it('should log audit when member level changes', async () => {
      const existing = { ...mockMember, memberLevelId: 'level-1', memberLevel: { name: '普通会员' } };
      prisma.member.findFirst.mockResolvedValue(existing);
      prisma.member.update.mockResolvedValue({
        ...mockMember,
        memberLevelId: 'level-vip',
        memberLevel: { name: 'VIP会员' },
      });

      await service.update('member-1', shopId, { memberLevelId: 'level-vip' }, operatorId, ip);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEMBER_LEVEL_CHANGE',
          detail: expect.objectContaining({
            fromLevel: '普通会员',
            toLevel: 'VIP会员',
          }),
        }),
      );
    });

    it('should not log audit when member level stays the same', async () => {
      prisma.member.findFirst.mockResolvedValue({ ...mockMember, memberLevelId: 'level-1', memberLevel: { name: '普通会员' } });
      prisma.member.update.mockResolvedValue({
        ...mockMember,
        memberLevelId: 'level-1',
        memberLevel: { name: '普通会员' },
      });

      await service.update('member-1', shopId, { name: '新名字' });

      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MEMBER_LEVEL_CHANGE' }),
      );
    });
  });

  describe('generateCardNo (private method tested through create)', () => {
    it('should generate card number with shop prefix and zero-padded sequence', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.memberLevel.findFirst.mockResolvedValue(mockMemberLevel);
      prisma.member.count.mockResolvedValue(0);
      prisma.member.create.mockImplementation((args: any) => Promise.resolve({
        ...mockMember,
        cardNo: args.data.cardNo,
      }));

      await service.create(shopId, { name: 'Test', phone: '13800001111' });

      // shopId 'shop-1234', last 4 chars: '1234', count + 1 = 1, padded to '0001'
      expect(prisma.member.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cardNo: 'M12340001' }),
        }),
      );
    });

    it('should increment sequence number based on existing count', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.memberLevel.findFirst.mockResolvedValue(mockMemberLevel);
      prisma.member.count.mockResolvedValue(99);
      prisma.member.create.mockImplementation((args: any) => Promise.resolve({
        ...mockMember,
        cardNo: args.data.cardNo,
      }));

      await service.create(shopId, { name: 'Test', phone: '13800001111' });

      expect(prisma.member.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cardNo: 'M12340100' }),
        }),
      );
    });
  });
});
