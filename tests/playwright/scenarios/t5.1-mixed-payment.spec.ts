/**
 * T5.1: 混合支付验证测试
 *
 * 测试流程：
 * 1. 余额 + 线下组合支付
 * 2. 余额 + 优惠券组合支付
 * 3. 次卡支付验证
 * 4. 多种支付方式组合
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { ApiHelper } from '../../helpers/api.helper';

test.describe('T5.1 混合支付验证', () => {
  let apiHelper: ApiHelper;
  let memberId: string;
  let serviceItemId: string;
  let staffId: string;
  let couponInstanceId: string;
  let passCardId: string;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();

    // Login
    await apiHelper.shopLogin('13800138001', 'password123');

    // Get member levels
    const memberLevels = await apiHelper.getMemberLevels();
    const memberLevelId = memberLevels.data[0]?.id;

    // Create test member
    const member = await apiHelper.createMember({
      name: '混合支付测试用户',
      phone: '13900002222',
      memberLevelId,
    });

    memberId = member.data.id;

    // Initial recharge
    await apiHelper.rechargeMember(memberId, {
      amount: 500,
      giftAmount: 0,
      payMethod: 'CASH',
    });

    // Get service item
    const services = await apiHelper.getServiceItems();
    if (services.data?.[0]) {
      serviceItemId = services.data[0].id;
    }

    // Get staff
    const staff = await apiHelper.getStaff();
    if (staff.data?.[0]) {
      staffId = staff.data[0].id;
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="tel"]', '13800138001');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    await apiHelper.shopLogin('13800138001', 'password123');
  });

  test('余额 + 线下组合支付', async ({ page }) => {
    // Recharge more for mixed payment
    await apiHelper.rechargeMember(memberId, {
      amount: 300,
      giftAmount: 0,
      payMethod: 'CASH',
    });

    const member = await apiHelper.getMemberById(memberId);
    const initialBalance = member.data.principalBalance;

    // Create order
    const order = await apiHelper.createOrder({
      memberId,
      items: [
        {
          serviceItemId,
          staffId,
          quantity: 2,
        },
      ],
    });

    const orderDetail = order.data;
    const balancePayment = Math.min(500, orderDetail.payableAmount);
    const offlinePayment = orderDetail.payableAmount - balancePayment;

    await page.goto(`/admin/orders/${orderDetail.id}`);
    await page.click('[data-testid="settle-button"]');
    await page.waitForSelector('[data-testid="settle-modal"]', { timeout: 5000 });

    // Add balance payment
    await page.fill('[data-testid="balance-amount-input"]', String(balancePayment));

    // Add offline payment
    await page.click('[data-testid="add-payment-button"]');
    await page.selectOption('[data-testid="payment-method-select"]', 'OFFLINE');
    await page.fill('[data-testid="payment-amount-input"]', String(offlinePayment));

    // Confirm settlement
    await page.click('[data-testid="confirm-settle-button"]');
    await expect(page.locator('text=结算成功')).toBeVisible({ timeout: 5000 });

    // Verify payment records
    const updatedOrder = await apiHelper.getOrders({ memberId, status: 'SETTLED' });
    const settledOrder = updatedOrder.data.items.find((o: any) => o.id === orderDetail.id);

    expect(settledOrder.status).toBe('SETTLED');
    expect(settledOrder.paidAmount).toBe(orderDetail.payableAmount);

    // Verify balance deduction
    const updatedMember = await apiHelper.getMemberById(memberId);
    expect(updatedMember.data.principalBalance).toBe(initialBalance - balancePayment);
  });

  test('余额 + 优惠券组合支付', async ({ page }) => {
    // Create coupon template
    const template = await apiHelper.createCouponTemplate({
      name: '测试优惠券',
      type: 'FIXED',
      threshold: 0,
      discount: 50,
      total: 10,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Issue coupon to member
    await apiHelper.issueCoupon(template.data.id, memberId);

    // Get available coupons
    const coupons = await apiHelper.getAvailableCoupons(memberId, 200);
    if (coupons.data?.[0]) {
      couponInstanceId = coupons.data[0].id;
    }

    // Create order
    const order = await apiHelper.createOrder({
      memberId,
      items: [
        {
          serviceItemId,
          staffId,
          quantity: 1,
        },
      ],
    });

    const orderDetail = order.data;

    await page.goto(`/admin/orders/${orderDetail.id}`);
    await page.click('[data-testid="settle-button"]');
    await page.waitForSelector('[data-testid="settle-modal"]', { timeout: 5000 });

    // Select coupon
    await page.click('[data-testid="use-coupon-button"]');
    await page.waitForSelector('[data-testid="coupon-selector-modal"]', { timeout: 5000 });
    await page.click(`[data-testid="coupon-${couponInstanceId}"]`);

    // Verify discount applied
    await expect(page.locator(`text=¥${50}`)).toBeVisible();

    // Settle with balance
    await page.fill('[data-testid="balance-amount-input"]', String(orderDetail.payableAmount - 50));
    await page.click('[data-testid="confirm-settle-button"]');
    await expect(page.locator('text=结算成功')).toBeVisible({ timeout: 5000 });

    // Verify coupon used
    const memberCoupons = await apiHelper.getAvailableCoupons(memberId, orderDetail.payableAmount);
    const usedCoupon = memberCoupons.data.find((c: any) => c.id === couponInstanceId);
    expect(usedCoupon?.status).toBe('USED');
  });

  test('次卡支付验证', async ({ page }) => {
    // Create pass card for member
    const passCard = await apiHelper.createPassCard({
      memberId,
      name: '测试次卡',
      totalTimes: 5,
      price: 500,
    });

    passCardId = passCard.data.id;

    // Create order
    const order = await apiHelper.createOrder({
      memberId,
      items: [
        {
          serviceItemId,
          staffId,
          quantity: 1,
        },
      ],
    });

    const orderDetail = order.data;

    await page.goto(`/admin/orders/${orderDetail.id}`);
    await page.click('[data-testid="settle-button"]');
    await page.waitForSelector('[data-testid="settle-modal"]', { timeout: 5000 });

    // Select pass card
    await page.click('[data-testid="use-pass-card-button"]');
    await page.waitForSelector('[data-testid="pass-card-selector-modal"]', { timeout: 5000 });
    await page.click(`[data-testid="pass-card-${passCardId}"]`);

    // Confirm settlement
    await page.click('[data-testid="confirm-settle-button"]');
    await expect(page.locator('text=结算成功')).toBeVisible({ timeout: 5000 });

    // Verify pass card usage
    const passCards = await apiHelper.getPassCards({ memberId });
    const updatedPassCard = passCards.data.items.find((c: any) => c.id === passCardId);
    expect(updatedPassCard.remainingTimes).toBe(4);
  });

  test('多种支付方式组合（余额 + 次卡 + 优惠券）', async ({ page }) => {
    // Recharge
    await apiHelper.rechargeMember(memberId, {
      amount: 200,
      giftAmount: 0,
      payMethod: 'CASH',
    });

    // Create pass card with 2 times
    const passCard = await apiHelper.createPassCard({
      memberId,
      name: '组合测试次卡',
      totalTimes: 2,
      price: 300,
    });

    // Create coupon
    const template = await apiHelper.createCouponTemplate({
      name: '组合测试优惠券',
      type: 'PERCENT',
      threshold: 100,
      discount: 10,
      total: 5,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await apiHelper.issueCoupon(template.data.id, memberId);
    const coupons = await apiHelper.getAvailableCoupons(memberId, 500);
    const couponId = coupons.data?.[0]?.id;

    // Create order with 2 items
    const order = await apiHelper.createOrder({
      memberId,
      items: [
        {
          serviceItemId,
          staffId,
          quantity: 2,
        },
      ],
    });

    const orderDetail = order.data;

    await page.goto(`/admin/orders/${orderDetail.id}`);
    await page.click('[data-testid="settle-button"]');
    await page.waitForSelector('[data-testid="settle-modal"]', { timeout: 5000 });

    // Apply coupon
    await page.click('[data-testid="use-coupon-button"]');
    await page.click(`[data-testid="coupon-${couponId}"]`);

    // Use pass card for first item
    await page.click('[data-testid="use-pass-card-button"]');
    await page.click(`[data-testid="pass-card-${passCard.data.id}"]`);

    // Pay remaining with balance
    await page.fill('[data-testid="balance-amount-input"]', '100');

    await page.click('[data-testid="confirm-settle-button"]');
    await expect(page.locator('text=结算成功')).toBeVisible({ timeout: 5000 });

    // Verify all payment methods recorded
    const updatedOrder = await apiHelper.getOrders({ memberId, status: 'SETTLED' });
    const settledOrder = updatedOrder.data.items.find((o: any) => o.id === orderDetail.id);

    expect(settledOrder.status).toBe('SETTLED');
    expect(settledOrder.paidAmount).toBeCloseTo(orderDetail.payableAmount, 10);
  });
});