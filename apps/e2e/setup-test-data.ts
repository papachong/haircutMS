/**
 * Test Data Seeder
 * Sets up initial test data for E2E tests
 */

import { PrismaClient } from '@haircut-ms/server/.prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Setting up test data...');

  // Clean existing test data
  console.log('Cleaning existing data...');
  await prisma.payment.deleteMany({});
  await prisma.passCardUsage.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.couponInstance.deleteMany({});
  await prisma.couponTemplate.deleteMany({});
  await prisma.passCard.deleteMany({});
  await prisma.rechargeRecord.deleteMany({});
  await prisma.memberTagRelation.deleteMany({});
  await prisma.memberTag.deleteMany({});
  await prisma.memberTagGroup.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.serviceItem.deleteMany({});
  await prisma.serviceCategory.deleteMany({});
  await prisma.rechargePlan.deleteMany({});
  await prisma.memberLevel.deleteMany({});
  await prisma.license.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.shop.deleteMany({});
  await prisma.platformAdmin.deleteMany({});

  // Create Platform Admin
  console.log('Creating platform admin...');
  const platformAdmin = await prisma.platformAdmin.create({
    data: {
      name: '测试管理员',
      phone: '18800008888',
      password: await hashPassword('admin123'),
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`Platform Admin: ${platformAdmin.phone} / admin123`);

  // Create Shop
  console.log('Creating test shop...');
  const shop = await prisma.shop.create({
    data: {
      name: '测试理发店',
      phone: '021-12345678',
      address: '上海市浦东新区测试路1号',
      businessHours: '09:00-21:00',
    },
  });

  // Create License
  console.log('Creating license...');
  const license = await prisma.license.create({
    data: {
      shopId: shop.id,
      licenseKey: 'TEST-LICENSE-001',
      plan: 'PRO',
      staffLimit: 10,
      membersLimit: 200,
      modules: ['member', 'order', 'recharge', 'pass-card', 'coupon', 'staff-stats'],
      features: {},
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      signature: 'test-signature',
    },
  });

  // Create Member Level
  console.log('Creating member levels...');
  const memberLevel = await prisma.memberLevel.create({
    data: {
      shopId: shop.id,
      name: '普通会员',
      discount: 1.00,
      sortOrder: 0,
    },
  });

  const vipLevel = await prisma.memberLevel.create({
    data: {
      shopId: shop.id,
      name: 'VIP会员',
      discount: 0.90,
      sortOrder: 1,
    },
  });

  // Create Staff
  console.log('Creating staff...');
  const staffManager = await prisma.staff.create({
    data: {
      shopId: shop.id,
      name: '店长',
      phone: '13800138001',
      password: await hashPassword('password123'),
      role: 'MANAGER',
    },
  });

  const staffStylist = await prisma.staff.create({
    data: {
      shopId: shop.id,
      name: '发型师张三',
      phone: '13800138002',
      password: await hashPassword('password123'),
      role: 'STYLIST',
    },
  });

  const staffReceptionist = await prisma.staff.create({
    data: {
      shopId: shop.id,
      name: '前台小李',
      phone: '13800138003',
      password: await hashPassword('password123'),
      role: 'RECEPTIONIST',
    },
  });

  console.log('Test Staff:');
  console.log(`  店长: ${staffManager.phone} / password123`);
  console.log(`  发型师: ${staffStylist.phone} / password123`);
  console.log(`  前台: ${staffReceptionist.phone} / password123`);

  // Create Service Categories
  console.log('Creating service categories...');
  const categoryHair = await prisma.serviceCategory.create({
    data: {
      shopId: shop.id,
      name: '理发',
      sortOrder: 1,
    },
  });

  const categoryPerm = await prisma.serviceCategory.create({
    data: {
      shopId: shop.id,
      name: '烫染',
      sortOrder: 2,
    },
  });

  const categoryCare = await prisma.serviceCategory.create({
    data: {
      shopId: shop.id,
      name: '护理',
      sortOrder: 3,
    },
  });

  // Create Service Items
  console.log('Creating service items...');
  const serviceItems = [
    {
      categoryId: categoryHair.id,
      name: '男士洗剪吹',
      price: 68,
      duration: 30,
    },
    {
      categoryId: categoryHair.id,
      name: '女士洗剪吹',
      price: 88,
      duration: 45,
    },
    {
      categoryId: categoryPerm.id,
      name: '潮流染发',
      price: 588,
      duration: 180,
    },
    {
      categoryId: categoryPerm.id,
      name: '纹理烫',
      price: 788,
      duration: 240,
    },
    {
      categoryId: categoryCare.id,
      name: '头皮护理',
      price: 198,
      duration: 60,
    },
    {
      categoryId: categoryCare.id,
      name: '深层修复',
      price: 298,
      duration: 90,
    },
  ];

  for (const item of serviceItems) {
    await prisma.serviceItem.create({
      data: {
        categoryId: item.categoryId,
        name: item.name,
        price: item.price,
        duration: item.duration,
        sortOrder: 0,
      },
    });
    console.log(`  - ${item.name}: ¥${item.price} (${item.duration}分钟)`);
  }

  // Create Recharge Plans
  console.log('Creating recharge plans...');
  const rechargePlans = [
    { name: '100元档', amount: 100, giftAmount: 0, type: 'DIRECT' },
    { name: '500元档', amount: 500, giftAmount: 50, type: 'GIFT' },
    { name: '1000元档', amount: 1000, giftAmount: 150, type: 'GIFT' },
    { name: '2000元档', amount: 2000, giftAmount: 400, type: 'GIFT' },
  ];

  for (const plan of rechargePlans) {
    await prisma.rechargePlan.create({
      data: {
        shopId: shop.id,
        name: plan.name,
        amount: plan.amount,
        giftAmount: plan.giftAmount,
        type: plan.type as any,
        sortOrder: 0,
      },
    });
    console.log(`  - ${plan.name}: 充${plan.amount}送${plan.giftAmount}`);
  }

  // Create Test Members
  console.log('Creating test members...');
  const testMembers = [
    {
      cardNo: 'M001',
      name: '测试会员1',
      phone: '13900000001',
      gender: 'MALE',
      level: memberLevel.id,
    },
    {
      cardNo: 'M002',
      name: '测试会员2',
      phone: '13900000002',
      gender: 'FEMALE',
      level: vipLevel.id,
    },
    {
      cardNo: 'M003',
      name: '测试会员3',
      phone: '13900000003',
      gender: 'MALE',
      level: memberLevel.id,
    },
  ];

  for (const member of testMembers) {
    await prisma.member.create({
      data: {
        shopId: shop.id,
        cardNo: member.cardNo,
        name: member.name,
        phone: member.phone,
        gender: member.gender as any,
        memberLevelId: member.level,
        principalBalance: 0,
        giftBalance: 0,
      },
    });
    console.log(`  - ${member.name} (${member.cardNo}): ${member.phone}`);
  }

  console.log('\nTest data setup completed!');
  console.log('\n=== Test Accounts ===');
  console.log(`Platform Admin: ${platformAdmin.phone} / admin123`);
  console.log(`Shop Manager: ${staffManager.phone} / password123`);
  console.log(`Shop Stylist: ${staffStylist.phone} / password123`);
}

main()
  .catch((e) => {
    console.error('Error setting up test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });