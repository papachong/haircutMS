export type ShopTemplateKey = 'SMALL_SHOP' | 'LARGE_SHOP';

interface TemplateMemberLevel {
  name: string;
  discount: number;
  sortOrder: number;
}

interface TemplateServiceItem {
  name: string;
  price: number; // yuan
  duration: number; // minutes
  sortOrder: number;
}

interface TemplateServiceCategory {
  name: string;
  sortOrder: number;
  items: TemplateServiceItem[];
}

interface TemplateRechargePlan {
  name: string;
  amount: number; // yuan
  giftAmount: number; // yuan
  type: 'DIRECT' | 'GIFT' | 'PERCENTAGE' | 'TIMED';
  sortOrder: number;
}

export interface ShopTemplate {
  key: ShopTemplateKey;
  name: string;
  description: string;
  memberLevels: TemplateMemberLevel[];
  serviceCategories: TemplateServiceCategory[];
  rechargePlans: TemplateRechargePlan[];
}

export const SHOP_TEMPLATES: Record<ShopTemplateKey, ShopTemplate> = {
  SMALL_SHOP: {
    key: 'SMALL_SHOP',
    name: '精简小店',
    description: '适合社区理发店，2-5人小店，基础洗剪吹烫染护理',
    memberLevels: [
      { name: '普通会员', discount: 1.0, sortOrder: 0 },
      { name: '银卡会员', discount: 0.95, sortOrder: 1 },
      { name: '金卡会员', discount: 0.9, sortOrder: 2 },
    ],
    serviceCategories: [
      {
        name: '洗剪吹',
        sortOrder: 0,
        items: [
          { name: '男士洗剪吹', price: 30, duration: 30, sortOrder: 0 },
          { name: '女士洗剪吹', price: 50, duration: 45, sortOrder: 1 },
          { name: '儿童剪发', price: 20, duration: 20, sortOrder: 2 },
        ],
      },
      {
        name: '烫发',
        sortOrder: 1,
        items: [
          { name: '男士烫发', price: 80, duration: 60, sortOrder: 0 },
          { name: '女士冷烫', price: 120, duration: 90, sortOrder: 1 },
          { name: '女士热烫', price: 180, duration: 120, sortOrder: 2 },
        ],
      },
      {
        name: '染发',
        sortOrder: 2,
        items: [
          { name: '单色染发', price: 80, duration: 60, sortOrder: 0 },
          { name: '挑染', price: 120, duration: 90, sortOrder: 1 },
        ],
      },
      {
        name: '护理',
        sortOrder: 3,
        items: [
          { name: '基础护理', price: 50, duration: 30, sortOrder: 0 },
          { name: '深度护理', price: 100, duration: 45, sortOrder: 1 },
        ],
      },
    ],
    rechargePlans: [
      { name: '充300送20', amount: 300, giftAmount: 20, type: 'GIFT', sortOrder: 0 },
      { name: '充500送50', amount: 500, giftAmount: 50, type: 'GIFT', sortOrder: 1 },
      { name: '充1000送120', amount: 1000, giftAmount: 120, type: 'GIFT', sortOrder: 2 },
    ],
  },

  LARGE_SHOP: {
    key: 'LARGE_SHOP',
    name: '豪华大店',
    description: '适合高端美发沙龙，多层级定价，丰富服务项目',
    memberLevels: [
      { name: '普通会员', discount: 1.0, sortOrder: 0 },
      { name: '银卡会员', discount: 0.95, sortOrder: 1 },
      { name: '金卡会员', discount: 0.88, sortOrder: 2 },
      { name: '铂金会员', discount: 0.8, sortOrder: 3 },
      { name: '钻石会员', discount: 0.75, sortOrder: 4 },
    ],
    serviceCategories: [
      {
        name: '精剪',
        sortOrder: 0,
        items: [
          { name: '总监剪发', price: 128, duration: 45, sortOrder: 0 },
          { name: '首席剪发', price: 88, duration: 40, sortOrder: 1 },
          { name: '设计师剪发', price: 58, duration: 35, sortOrder: 2 },
          { name: '儿童剪发', price: 38, duration: 25, sortOrder: 3 },
        ],
      },
      {
        name: '烫发',
        sortOrder: 1,
        items: [
          { name: '数码烫', price: 268, duration: 120, sortOrder: 0 },
          { name: '冷烫', price: 198, duration: 100, sortOrder: 1 },
          { name: '热能烫', price: 328, duration: 130, sortOrder: 2 },
          { name: '定位烫', price: 158, duration: 90, sortOrder: 3 },
        ],
      },
      {
        name: '染发',
        sortOrder: 2,
        items: [
          { name: '进口单色染', price: 198, duration: 80, sortOrder: 0 },
          { name: '国产单色染', price: 128, duration: 70, sortOrder: 1 },
          { name: '挑染/片染', price: 168, duration: 90, sortOrder: 2 },
          { name: '渐变染', price: 258, duration: 100, sortOrder: 3 },
        ],
      },
      {
        name: '护理',
        sortOrder: 3,
        items: [
          { name: '基础护理', price: 88, duration: 30, sortOrder: 0 },
          { name: '深层修复', price: 158, duration: 45, sortOrder: 1 },
          { name: '头皮SPA', price: 128, duration: 40, sortOrder: 2 },
          { name: '角蛋白护理', price: 238, duration: 60, sortOrder: 3 },
        ],
      },
      {
        name: '造型',
        sortOrder: 4,
        items: [
          { name: '吹风造型', price: 58, duration: 30, sortOrder: 0 },
          { name: '派对造型', price: 128, duration: 60, sortOrder: 1 },
          { name: '新娘造型', price: 388, duration: 120, sortOrder: 2 },
        ],
      },
      {
        name: '洗护',
        sortOrder: 5,
        items: [
          { name: '精洗', price: 38, duration: 20, sortOrder: 0 },
          { name: '头皮深层清洁', price: 68, duration: 30, sortOrder: 1 },
        ],
      },
    ],
    rechargePlans: [
      { name: '充500送30', amount: 500, giftAmount: 30, type: 'GIFT', sortOrder: 0 },
      { name: '充1000送80', amount: 1000, giftAmount: 80, type: 'GIFT', sortOrder: 1 },
      { name: '充2000送200', amount: 2000, giftAmount: 200, type: 'GIFT', sortOrder: 2 },
      { name: '充5000送600', amount: 5000, giftAmount: 600, type: 'GIFT', sortOrder: 3 },
      { name: '充10000送1500', amount: 10000, giftAmount: 1500, type: 'GIFT', sortOrder: 4 },
    ],
  },
};

export function getTemplatePreview(template: ShopTemplate) {
  return {
    key: template.key,
    name: template.name,
    description: template.description,
    memberLevelCount: template.memberLevels.length,
    memberLevelNames: template.memberLevels.map((l) => l.name),
    serviceCategoryCount: template.serviceCategories.length,
    serviceItemCount: template.serviceCategories.reduce(
      (sum, cat) => sum + cat.items.length,
      0,
    ),
    serviceCategories: template.serviceCategories.map((cat) => ({
      name: cat.name,
      itemCount: cat.items.length,
      priceRange: {
        min: Math.min(...cat.items.map((i) => i.price)),
        max: Math.max(...cat.items.map((i) => i.price)),
      },
    })),
    rechargePlanCount: template.rechargePlans.length,
    rechargePlans: template.rechargePlans.map((p) => p.name),
  };
}
