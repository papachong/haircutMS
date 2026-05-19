import { StaffService } from './staff.service';
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('StaffService', () => {
  let service: StaffService;
  let prisma: any;
  let licenseService: any;

  const shopId = 'shop-1234';

  const mockStaff = {
    id: 'staff-1',
    shopId,
    name: '理发师小王',
    phone: '13800138001',
    role: 'STYLIST',
    avatar: null,
    isActive: true,
    password: 'hashed_old_password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOwner = {
    ...mockStaff,
    id: 'owner-1',
    role: 'OWNER',
    name: '店主',
  };

  beforeEach(() => {
    prisma = {
      staff: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    licenseService = {
      isStaffLimitOk: jest.fn().mockResolvedValue(true),
    };

    service = new StaffService(prisma, licenseService);

    // Clear bcrypt mock between tests
    (bcrypt.hash as jest.Mock).mockClear();
  });

  describe('findAll', () => {
    it('should return all staff for a shop', async () => {
      prisma.staff.findMany.mockResolvedValue([mockStaff]);

      const result = await service.findAll(shopId);

      expect(result).toEqual([mockStaff]);
      expect(prisma.staff.findMany).toHaveBeenCalledWith({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
        select: expect.objectContaining({
          id: true,
          name: true,
          phone: true,
          role: true,
        }),
      });
    });

    it('should not include passwords in results', async () => {
      prisma.staff.findMany.mockResolvedValue([mockStaff]);

      await service.findAll(shopId);

      expect(prisma.staff.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.not.objectContaining({ password: true }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return staff by id', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaff);

      const result = await service.findById('staff-1', shopId);

      expect(result).toEqual(mockStaff);
      expect(prisma.staff.findFirst).toHaveBeenCalledWith({
        where: { id: 'staff-1', shopId },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when staff not found', async () => {
      prisma.staff.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createData = {
      name: '新员工',
      phone: '13900139001',
      password: 'password123',
      role: 'RECEPTIONIST',
    };

    it('should create a new staff member', async () => {
      prisma.staff.findFirst.mockResolvedValue(null);
      prisma.staff.create.mockResolvedValue({
        id: 'staff-new',
        ...createData,
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.create(shopId, createData);

      expect(prisma.staff.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shopId,
            name: '新员工',
            phone: '13900139001',
            password: 'hashed_password',
            role: 'RECEPTIONIST',
          }),
        }),
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw ConflictException when phone already exists', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaff);

      await expect(service.create(shopId, createData)).rejects.toThrow(ConflictException);
      expect(prisma.staff.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when license staff limit reached', async () => {
      prisma.staff.findFirst.mockResolvedValue(null);
      licenseService.isStaffLimitOk.mockResolvedValue(false);

      await expect(service.create(shopId, createData)).rejects.toThrow(ForbiddenException);
      expect(prisma.staff.create).not.toHaveBeenCalled();
    });

    it('should default role to STYLIST when not provided', async () => {
      prisma.staff.findFirst.mockResolvedValue(null);
      prisma.staff.create.mockResolvedValue({
        id: 'staff-new',
        name: '新员工',
        role: 'STYLIST',
        isActive: true,
        createdAt: new Date(),
      });

      await service.create(shopId, {
        name: '新员工',
        phone: '13900139001',
        password: 'password123',
      });

      expect(prisma.staff.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'STYLIST',
          }),
        }),
      );
    });

    it('should hash the password with bcrypt', async () => {
      prisma.staff.findFirst.mockResolvedValue(null);
      prisma.staff.create.mockResolvedValue({ id: 'staff-new' });

      await service.create(shopId, createData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('update', () => {
    it('should update staff fields', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaff);
      prisma.staff.update.mockResolvedValue({ ...mockStaff, name: '新名字' });

      const result = await service.update('staff-1', shopId, { name: '新名字' });

      expect(prisma.staff.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'staff-1' },
          data: expect.objectContaining({ name: '新名字' }),
        }),
      );
    });

    it('should throw NotFoundException when staff not found', async () => {
      prisma.staff.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', shopId, { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should check phone conflict when phone is being changed', async () => {
      prisma.staff.findFirst
        .mockResolvedValueOnce(mockStaff)                    // existing staff
        .mockResolvedValueOnce({ id: 'other', phone: '13900139001' }); // phone taken

      await expect(
        service.update('staff-1', shopId, { phone: '13900139001' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to the same phone number', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaff);
      prisma.staff.update.mockResolvedValue(mockStaff);

      await service.update('staff-1', shopId, { phone: '13800138001' });

      // Only one findFirst call for the existing staff
      expect(prisma.staff.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.staff.update).toHaveBeenCalled();
    });

    it('should not update fields that are undefined', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaff);
      prisma.staff.update.mockResolvedValue(mockStaff);

      await service.update('staff-1', shopId, { name: '新名字' });

      expect(prisma.staff.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ phone: expect.anything() }),
        }),
      );
    });
  });

  describe('toggle', () => {
    it('should deactivate an active staff member', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaff);
      prisma.staff.update.mockResolvedValue({ ...mockStaff, isActive: false });

      const result = await service.toggle('staff-1', shopId);

      expect(prisma.staff.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        }),
      );
    });

    it('should activate an inactive staff member', async () => {
      prisma.staff.findFirst.mockResolvedValue({ ...mockStaff, isActive: false });
      prisma.staff.update.mockResolvedValue({ ...mockStaff, isActive: true });

      const result = await service.toggle('staff-1', shopId);

      expect(prisma.staff.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: true },
        }),
      );
    });

    it('should throw NotFoundException when staff not found', async () => {
      prisma.staff.findFirst.mockResolvedValue(null);

      await expect(service.toggle('nonexistent', shopId)).rejects.toThrow(NotFoundException);
    });

    it('should prevent deactivating the last active owner', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockOwner);
      prisma.staff.count.mockResolvedValue(1); // only 1 active owner

      await expect(service.toggle('owner-1', shopId)).rejects.toThrow(BadRequestException);
      expect(prisma.staff.update).not.toHaveBeenCalled();
    });

    it('should allow deactivating owner when there are other active owners', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockOwner);
      prisma.staff.count.mockResolvedValue(2); // 2 active owners
      prisma.staff.update.mockResolvedValue({ ...mockOwner, isActive: false });

      const result = await service.toggle('owner-1', shopId);

      expect(prisma.staff.update).toHaveBeenCalled();
    });

    it('should allow deactivating non-owner staff without restriction', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaff); // STYLIST, not OWNER
      prisma.staff.update.mockResolvedValue({ ...mockStaff, isActive: false });

      const result = await service.toggle('staff-1', shopId);

      expect(prisma.staff.count).not.toHaveBeenCalled();
      expect(prisma.staff.update).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password for existing staff', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaff);
      prisma.staff.update.mockResolvedValue({ ...mockStaff, password: 'hashed_password' });

      const result = await service.resetPassword('staff-1', shopId, 'newpassword');

      expect(result.message).toBe('密码重置成功');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(prisma.staff.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { password: 'hashed_password' },
        }),
      );
    });

    it('should throw NotFoundException when staff not found', async () => {
      prisma.staff.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword('nonexistent', shopId, 'newpassword'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
