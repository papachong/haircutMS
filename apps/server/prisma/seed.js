"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.platformAdmin.upsert({
        where: { phone: '13800000000' },
        update: {},
        create: {
            name: '超级管理员',
            phone: '13800000000',
            password: hashedPassword,
            role: client_1.PlatformAdminRole.SUPER_ADMIN,
        },
    });
    const shop = await prisma.shop.upsert({
        where: { id: 'shop_test_001' },
        update: {},
        create: {
            id: 'shop_test_001',
            name: '测试理发店',
            address: '上海市测试路100号',
            phone: '021-12345678',
            status: client_1.ShopStatus.ACTIVE,
        },
    });
    const ownerPassword = await bcrypt.hash('owner123', 10);
    await prisma.staff.upsert({
        where: { shopId_phone: { shopId: shop.id, phone: '13900000001' } },
        update: {},
        create: {
            name: '店主',
            phone: '13900000001',
            password: ownerPassword,
            role: client_1.StaffRole.OWNER,
            shopId: shop.id,
        },
    });
    await prisma.memberLevel.upsert({
        where: { id: 'level_default_001' },
        update: {},
        create: {
            id: 'level_default_001',
            name: '普通会员',
            discount: 1.00,
            sortOrder: 0,
            shopId: shop.id,
        },
    });
    await prisma.rechargePlan.upsert({
        where: { id: 'plan_test_001' },
        update: {},
        create: {
            id: 'plan_test_001',
            name: '充1000送100',
            amount: 100000,
            giftAmount: 10000,
            type: client_1.RechargePlanType.GIFT,
            shopId: shop.id,
        },
    });
    await prisma.license.upsert({
        where: { id: 'license_test_001' },
        update: {},
        create: {
            id: 'license_test_001',
            shopId: shop.id,
            licenseKey: 'TEST-LICENSE-001',
            plan: client_1.LicensePlan.PRO,
            staffLimit: 10,
            membersLimit: 1000,
            modules: ['pos', 'member', 'service', 'analytics', 'staff'],
            features: { dataExport: true },
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            signature: 'test-signature',
        },
    });
    console.log('Seed data created successfully');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map