/**
 * T5.1: 多租户隔离验证测试
 *
 * 测试流程：
 * 1. 创建两个独立店铺
 * 2. 店铺A创建会员、订单
 * 3. 店铺B无法访问店铺A的数据
 * 4. 店铺B创建自己的数据
 * 5. 验证两个店铺数据完全隔离
 */

import { test, expect } from 'playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { DatabaseHelper } from '../../helpers/database.helper';

test.describe('T5.1 多租户隔离验证', () => {
  let dbHelper: DatabaseHelper;
  let apiHelperA: ApiHelper;
  let apiHelperB: ApiHelper;

  let shopA: any;
  let shopB: any;

  let staffA: any;
  let staffB: any;

  let memberA: any;
  let memberB: any;

  let orderA: any;

  test.beforeAll(async () => {
    dbHelper = new DatabaseHelper();
    await dbHelper.connect();

    // Clean up test data
    await dbHelper.clearDatabase();

    // Create platform admin
    await dbHelper.createPlatformAdmin({
      name: '测试管理员',
      phone: '18800008888',
      password: 'admin123',
    });

    // Create two shops
    shopA = await dbHelper.createShop({
      name: '测试店铺A',
      phone: '021-12345678',
      address: '上海市浦东新区A路1号',
    });

    shopB = await dbHelper.createShop({
      name: '测试店铺B',
      phone: '021-87654321',
      address: '上海市黄浦区B路2号',
    });

    // Create licenses
    await dbHelper.createLicense(shopA.id, {
      plan: 'PRO',
      staffLimit: 10,
      modules: ['member', 'order', 'recharge', 'pass-card', 'coupon'],
    });

    await dbHelper.createLicense(shopB.id, {
      plan: 'PRO',
      staffLimit: 10,
      modules: ['member', 'order', 'recharge', 'pass-card', 'coupon'],
    });

    // Create default member levels
    const memberLevelA = await dbHelper.createDefaultMemberLevel(shopA.id);
    const memberLevelB = await dbHelper.createDefaultMemberLevel(shopB.id);

    // Create staff for each shop
    staffA = await dbHelper.createStaff(shopA.id, {
      name: '店员A',
      phone: '13800138001',
      password: 'password123',
      role: 'MANAGER',
    });

    staffB = await dbHelper.createStaff(shopB.id, {
      name: '店员B',
      phone: '13800138002',
      password: 'password123',
      role: 'MANAGER',
    });

    // Create members for each shop
    memberA = await dbHelper.createMember(shopA.id, memberLevelA.id, {
      name: '会员A',
      phone: '1390000AAAA',
      cardNo: 'CARD-A-001',
    });

    memberB = await dbHelper.createMember(shopB.id, memberLevelB.id, {
      name: '会员B',
      phone: '1390000BBBB',
      cardNo: 'CARD-B-001',
    });
  });

  test.beforeEach(async () => {
    apiHelperA = new ApiHelper();
    apiHelperB = new ApiHelper();

    await apiHelperA.shopLogin('13800138001', 'password123');
    await apiHelperB.shopLogin('13800138002', 'password123');
  });

  test.afterAll(async () => {
    await dbHelper.disconnect();
  });

  test('店铺A创建的数据店铺B无法访问', async () => {
    // Shop A creates an order
    const serviceCatA = await apiHelperA.createServiceCategory(shopA.id, '理发');
    const serviceItemA = await apiHelperA.createServiceItem(serviceCatA.id, {
      name: '基础理发',
      price: 100,
      duration: 30,
    });

    orderA = await apiHelperA.createOrder({
      memberId: memberA.id,
      items: [
        {
          serviceItemId: serviceItemA.id,
          staffId: staffA.id,
          quantity: 1,
        },
      ],
    });

    expect(orderA.code).toBe(0);
    expect(orderA.data.shopId).toBe(shopA.id);

    // Shop B tries to access Shop A's member
    const memberAccess = await apiHelperB.getMemberById(memberA.id);

    // Should fail with not found or unauthorized
    expect(memberAccess.code).not.toBe(0);

    // Shop B tries to get Shop A's orders
    const ordersB = await apiHelperB.getOrders();

    // Should not contain Shop A's order
    expect(ordersB.data.items).not.toContainEqual(
      expect.objectContaining({ id: orderA.data.id }),
    );

    // Shop B searches for Shop A's member
    const searchResult = await apiHelperB.searchMembers('会员A');

    expect(searchResult.data).not.toContainEqual(
      expect.objectContaining({ id: memberA.id }),
    );
  });

  test('店铺B创建独立数据，与店铺A完全隔离', async () => {
    // Shop B creates its own data
    const serviceCatB = await apiHelperB.createServiceCategory(shopB.id, '护理');
    const serviceItemB = await apiHelperB.createServiceItem(serviceCatB.id, {
      name: '深度护理',
      price: 200,
      duration: 60,
    });

    const orderB = await apiHelperB.createOrder({
      memberId: memberB.id,
      items: [
        {
          serviceItemId: serviceItemB.id,
          staffId: staffB.id,
          quantity: 1,
        },
      ],
    });

    expect(orderB.code).toBe(0);
    expect(orderB.data.shopId).toBe(shopB.id);

    // Shop A tries to access Shop B's order
    const ordersA = await apiHelperA.getOrders();

    // Should not contain Shop B's order
    expect(ordersA.data.items).not.toContainEqual(
      expect.objectContaining({ id: orderB.data.id }),
    );

    // Shop A searches for Shop B's member
    const searchResult = await apiHelperA.searchMembers('会员B');

    expect(searchResult.data).not.toContainEqual(
      expect.objectContaining({ id: memberB.id }),
    );
  });

  test('两个店铺数据完全隔离验证', async () => {
    // Get all orders for each shop
    const ordersA = await apiHelperA.getOrders();
    const ordersB = await apiHelperB.getOrders();

    // Each shop only sees its own orders
    ordersA.data.items.forEach((order: any) => {
      expect(order.shopId).toBe(shopA.id);
    });

    ordersB.data.items.forEach((order: any) => {
      expect(order.shopId).toBe(shopB.id);
    });

    // Verify database level isolation
    const shopACounts = await dbHelper.getShopDataCounts(shopA.id);
    const shopBCounts = await dbHelper.getShopDataCounts(shopB.id);

    // Each shop has at least one member
    expect(shopACounts.members).toBeGreaterThanOrEqual(1);
    expect(shopBCounts.members).toBeGreaterThanOrEqual(1);

    // Staff count should be 1 each
    expect(shopACounts.staff).toBe(1);
    expect(shopBCounts.staff).toBe(1);

    // Verify no cross-shop data
    const shopAMembers = await apiHelperA.getMemberLevels();
    const shopBMembers = await apiHelperB.getMemberLevels();

    expect(shopAMembers.data).toHaveLength(1);
    expect(shopBMembers.data).toHaveLength(1);

    expect(shopAMembers.data[0]).not.toEqual(shopBMembers.data[0]);
  });

  test('同手机号不同店铺可以存在', async () => {
    // Same phone number for different shops should work
    const memberLevelsA = await apiHelperA.getMemberLevels();
    const memberLevelsB = await apiHelperB.getMemberLevels();

    const samePhoneMemberA = await apiHelperA.createMember({
      name: '同名手机会员A',
      phone: '13999999999',
      memberLevelId: memberLevelsA.data[0].id,
    });

    const samePhoneMemberB = await apiHelperB.createMember({
      name: '同名手机会员B',
      phone: '13999999999',
      memberLevelId: memberLevelsB.data[0].id,
    });

    expect(samePhoneMemberA.code).toBe(0);
    expect(samePhoneMemberB.code).toBe(0);

    expect(samePhoneMemberA.data.id).not.toBe(samePhoneMemberB.data.id);
    expect(samePhoneMemberA.data.shopId).toBe(shopA.id);
    expect(samePhoneMemberB.data.shopId).toBe(shopB.id);
  });

  test('API级别的租户隔离验证', async ({ request }) => {
    // Shop A creates recharge plan
    const planA = await apiHelperA.createRechargePlan({
      name: '店铺A充值方案',
      amount: 500,
      giftAmount: 50,
      type: 'GIFT',
    });

    expect(planA.code).toBe(0);

    // Shop B gets recharge plans
    const plansB = await apiHelperB.request('GET', '/recharge-plans?activeOnly=true');

    // Should not contain Shop A's plan
    expect(plansB.data).not.toContainEqual(
      expect.objectContaining({ id: planA.data.id }),
    );

    // Shop A gets its own plans
    const plansA = await apiHelperA.request('GET', '/recharge-plans?activeOnly=true');

    // Should contain the plan
    expect(plansA.data).toContainEqual(
      expect.objectContaining({ id: planA.data.id }),
    );
  });
});