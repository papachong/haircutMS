import { ImportStrategy, ImportRowResult } from '../types';

export const serviceImportStrategy: ImportStrategy = {
  entityType: 'services',
  requiredColumns: ['服务名称', '分类名称', '价格(分)', '时长(分钟)'],

  async validate(
    row: Record<string, unknown>,
    rowNumber: number,
    _shopId: string,
    _prisma: any,
  ): Promise<ImportRowResult> {
    const name = String(row['服务名称'] ?? '').trim();
    if (!name) {
      return { row: rowNumber, success: false, error: '服务名称不能为空' };
    }
    if (name.length > 100) {
      return {
        row: rowNumber,
        success: false,
        error: '服务名称不能超过100个字符',
      };
    }

    const categoryName = String(row['分类名称'] ?? '').trim();
    if (!categoryName) {
      return { row: rowNumber, success: false, error: '分类名称不能为空' };
    }

    const priceRaw = row['价格(分)'];
    const price = Number(priceRaw);
    if (!Number.isInteger(price) || price < 0) {
      return {
        row: rowNumber,
        success: false,
        error: '价格必须为非负整数',
      };
    }

    const durationRaw = row['时长(分钟)'];
    const duration = Number(durationRaw);
    if (!Number.isInteger(duration) || duration <= 0) {
      return {
        row: rowNumber,
        success: false,
        error: '时长必须为正整数',
      };
    }

    return { row: rowNumber, success: true };
  },

  async persist(
    validRows: Record<string, unknown>[],
    shopId: string,
    _operatorId: string,
    prisma: any,
  ): Promise<number> {
    const categoryNameSet = new Set<string>();
    for (const row of validRows) {
      const categoryName = String(row['分类名称'] ?? '').trim();
      if (categoryName) {
        categoryNameSet.add(categoryName);
      }
    }

    const existingCategories = await prisma.serviceCategory.findMany({
      where: { shopId },
      select: { id: true, name: true },
    });
    const categoryMap = new Map<string, string>();
    for (const cat of existingCategories) {
      categoryMap.set(cat.name, cat.id);
    }

    for (const name of categoryNameSet) {
      if (!categoryMap.has(name)) {
        const maxSort = await prisma.serviceCategory.findFirst({
          where: { shopId },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true },
        });
        const category = await prisma.serviceCategory.create({
          data: {
            shopId,
            name,
            sortOrder: (maxSort?.sortOrder ?? 0) + 1,
          },
        });
        categoryMap.set(name, category.id);
      }
    }

    let created = 0;
    for (const row of validRows) {
      const name = String(row['服务名称'] ?? '').trim();
      const categoryName = String(row['分类名称'] ?? '').trim();
      const price = Number(row['价格(分)']);
      const duration = Number(row['时长(分钟)']);
      const sortOrder = Number(row['排序'] ?? 0);
      const categoryId = categoryMap.get(categoryName);

      if (!categoryId) continue;

      await prisma.serviceItem.create({
        data: {
          categoryId,
          name,
          price,
          duration,
          sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
        },
      });

      created++;
    }

    return created;
  },
};
