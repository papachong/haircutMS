"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPlatformAdmin = seedPlatformAdmin;
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function seedPlatformAdmin() {
    const existing = await prisma.platformAdmin.findFirst();
    if (existing) {
        console.log('Platform admin already exists, skipping seed');
        return;
    }
    const hashedPassword = await bcrypt.hash('admin123456', 10);
    const admin = await prisma.platformAdmin.create({
        data: {
            name: '超级管理员',
            phone: '13800000000',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true,
        },
    });
    console.log('Created platform admin:', {
        id: admin.id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
    });
    console.log('Default password: admin123456');
}
//# sourceMappingURL=platform-admin.seed.js.map