import { ImportStrategy, ImportRowResult } from '../types';

const GENDER_MAP: Record<string, string> = {
  '男': 'MALE',
  '女': 'FEMALE',
  '其他': 'OTHER',
};

const PHONE_REGEX = /^1\d{10}$/;

export const memberImportStrategy: ImportStrategy = {
  entityType: 'members',
  requiredColumns: ['姓名', '手机号'],

  async validate(
    row: Record<string, unknown>,
    rowNumber: number,
    shopId: string,
    prisma: any,
  ): Promise<ImportRowResult> {
    const name = String(row['姓名'] ?? '').trim();
    const phone = String(row['手机号'] ?? '').trim();

    if (!name) {
      return { row: rowNumber, success: false, error: '姓名不能为空' };
    }
    if (name.length > 50) {
      return { row: rowNumber, success: false, error: '姓名不能超过50个字符' };
    }

    if (!phone) {
      return { row: rowNumber, success: false, error: '手机号不能为空' };
    }
    if (!PHONE_REGEX.test(phone)) {
      return { row: rowNumber, success: false, error: '手机号格式不正确' };
    }

    const existing = await prisma.member.findFirst({
      where: { shopId, phone, isActive: true },
    });
    if (existing) {
      return { row: rowNumber, success: false, error: '该手机号已有会员' };
    }

    const genderRaw = String(row['性别'] ?? '').trim();
    if (genderRaw && !GENDER_MAP[genderRaw]) {
      return {
        row: rowNumber,
        success: false,
        error: '性别值无效，应为：男/女/其他',
      };
    }

    const birthdayRaw = String(row['生日'] ?? '').trim();
    if (birthdayRaw) {
      const parsed = new Date(birthdayRaw);
      if (isNaN(parsed.getTime())) {
        return { row: rowNumber, success: false, error: '生日格式无效' };
      }
    }

    const levelName = String(row['会员等级'] ?? '').trim();
    if (levelName) {
      const level = await prisma.memberLevel.findFirst({
        where: { shopId, name: levelName },
      });
      if (!level) {
        return {
          row: rowNumber,
          success: false,
          error: `会员等级"${levelName}"不存在`,
        };
      }
    }

    return { row: rowNumber, success: true };
  },

  async persist(
    validRows: Record<string, unknown>[],
    shopId: string,
    _operatorId: string,
    prisma: any,
  ): Promise<number> {
    let created = 0;

    for (const row of validRows) {
      const name = String(row['姓名'] ?? '').trim();
      const phone = String(row['手机号'] ?? '').trim();
      const genderRaw = String(row['性别'] ?? '').trim();
      const birthdayRaw = String(row['生日'] ?? '').trim();
      const levelName = String(row['会员等级'] ?? '').trim();
      const remark = String(row['备注'] ?? '').trim();

      let memberLevelId: string | undefined;
      if (levelName) {
        const level = await prisma.memberLevel.findFirst({
          where: { shopId, name: levelName },
        });
        memberLevelId = level?.id;
      }
      if (!memberLevelId) {
        const defaultLevel = await prisma.memberLevel.findFirst({
          where: { shopId },
          orderBy: { sortOrder: 'asc' },
        });
        memberLevelId = defaultLevel?.id;
      }

      const count = await prisma.member.count({ where: { shopId } });
      const seq = String(count + 1).padStart(4, '0');
      const prefix = shopId.slice(-4).toUpperCase();
      const cardNo = `M${prefix}${seq}`;

      await prisma.member.create({
        data: {
          shopId,
          cardNo,
          name,
          phone,
          gender: (genderRaw ? GENDER_MAP[genderRaw] : undefined) as any,
          birthday: birthdayRaw ? new Date(birthdayRaw) : undefined,
          memberLevelId,
          remark: remark || undefined,
        },
      });

      created++;
    }

    return created;
  },
};
