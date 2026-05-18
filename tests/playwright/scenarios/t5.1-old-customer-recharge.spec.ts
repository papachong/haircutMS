/**
 * T5.1: 老客户充值全流程测试
 *
 * 测试流程：
 * 1. 查询会员信息
 * 2. 执行充值操作
 * 3. 验证余额变动
 * 4. 查看充值记录
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { ApiHelper } from '../../helpers/api.helper';

test.describe('T5.1 老客户充值全流程', () => {
  let apiHelper: ApiHelper;
  let existingMemberId: string;
  let existingMemberCardNo: string;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();

    // Login and create a test member if not exists
    await apiHelper.shopLogin('13800138001', 'password123');

    // Try to find existing test member
    const searchResult = await apiHelper.searchMembers('充值测试用户');
    if (searchResult.data && searchResult.data.length > 0) {
      existingMemberId = searchResult.data[0].id;
      existingMemberCardNo = searchResult.data[0].cardNo;
    } else {
      // Create new member
      const memberLevels = await apiHelper.getMemberLevels();
      const memberLevelId = memberLevels.data[0]?.id;

      const newMember = await apiHelper.createMember({
        name: '充值测试用户',
        phone: '13900001111',
        memberLevelId,
      });

      existingMemberId = newMember.data.id;
      existingMemberCardNo = newMember.data.cardNo;
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

  test('完整的老客户充值流程', async ({ page }) => {
    // Record initial balance
    const initialMember = await apiHelper.getMemberById(existingMemberId);
    const initialPrincipal = initialMember.data.principalBalance;
    const initialGift = initialMember.data.giftBalance;

    const rechargeAmount = 500;
    const giftAmount = 50;

    // ==================== Step 1: 查询会员信息 ====================
    await test.step('查询会员信息', async () => {
      await page.goto('/admin/members');

      // Search member by card number
      await page.fill('[data-testid="member-search-input"]', existingMemberCardNo);
      await page.press('[data-testid="member-search-input"]', 'Enter');
      await page.waitForTimeout(500);

      // Verify member appears in list
      await expect(page.locator(`text=${existingMemberCardNo}`)).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=充值测试用户')).toBeVisible();

      // Click to view member detail
      await page.click(`[data-testid="member-row-${existingMemberId}"]`);

      // Verify member detail page loads
      await expect(page.locator('[data-testid="member-detail-page"]')).toBeVisible({ timeout: 5000 });

      // Verify current balance display
      const principalBalance = await page.locator('[data-testid="principal-balance"]').textContent();
      expect(principalBalance).toContain(initialPrincipal.toString());
    });

    // ==================== Step 2: 执行充值操作 ====================
    await test.step('执行充值操作', async () => {
      // Click recharge button
      await page.click('[data-testid="recharge-button"]');
      await page.waitForSelector('[data-testid="recharge-modal"]', { timeout: 5000 });

      // Select recharge plan if available, otherwise manual
      const plans = await apiHelper.createRechargePlan({
        name: '测试充值方案',
        amount: rechargeAmount,
        giftAmount: giftAmount,
        type: 'GIFT',
      });

      await page.waitForTimeout(500);
      await page.selectOption('[data-testid="recharge-plan-select"]', plans.data.id);

      // Fill payment method
      await page.selectOption('[data-testid="recharge-method-select"]', 'WECHAT');
      await page.fill('[data-testid="recharge-remark-input"]', '老客户充值测试');

      // Confirm recharge
      await page.click('[data-testid="recharge-confirm-button"]');

      // Wait for success message
      await expect(page.locator('text=充值成功')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("确定")');
    });

    // ==================== Step 3: 验证余额变动 ====================
    await test.step('验证余额变动', async () => {
      // Reload member detail page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Get new balance from UI
      const newPrincipalBalance = await page.locator('[data-testid="principal-balance"]').textContent();
      const newGiftBalance = await page.locator('[data-testid="gift-balance"]').textContent();

      // Get new balance from API
      const updatedMember = await apiHelper.getMemberById(existingMemberId);

      // Verify balance increased correctly
      expect(updatedMember.data.principalBalance).toBe(initialPrincipal + rechargeAmount);
      expect(updatedMember.data.giftBalance).toBe(initialGift + giftAmount);
      expect(updatedMember.data.totalRecharge).toBe(initialMember.data.totalRecharge + rechargeAmount + giftAmount);

      // Verify UI reflects API data
      expect(newPrincipalBalance).toContain(updatedMember.data.principalBalance.toString());
      expect(newGiftBalance).toContain(updatedMember.data.giftBalance.toString());
    });

    // ==================== Step 4: 查看充值记录 ====================
    await test.step('查看充值记录', async () => {
      // Click recharge history tab
      await page.click('[data-testid="recharge-history-tab"]');
      await page.waitForTimeout(500);

      // Verify recharge record appears
      await expect(page.locator(`text=¥${rechargeAmount}`)).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`text=¥${giftAmount}`)).toBeVisible();

      // Verify payment method
      await expect(page.locator('text=微信支付')).toBeVisible();

      // Verify remark
      await expect(page.locator('text=老客户充值测试')).toBeVisible();

      // Click to view detail
      await page.click('[data-testid^="recharge-record-"]:first-child');

      // Verify recharge detail modal
      await expect(page.locator('[data-testid="recharge-detail-modal"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=充值金额')).toBeVisible();
      await expect(page.locator('text=赠送金额')).toBeVisible();
    });
  });

  test('充值后余额支付订单验证', async ({ page }) => {
    const rechargeAmount = 1000;
    const giftAmount = 100;

    // Perform recharge first
    await apiHelper.createRechargePlan({
      name: '测试充值方案2',
      amount: rechargeAmount,
      giftAmount: giftAmount,
      type: 'GIFT',
    });

    const rechargeResult = await apiHelper.rechargeMember(existingMemberId, {
      amount: rechargeAmount,
      giftAmount: giftAmount,
      payMethod: 'ALIPAY',
    });

    expect(rechargeResult.code).toBe(0);

    // Create and settle an order to verify balance deduction
    const services = await apiHelper.getServiceItems();
    const staff = await apiHelper.getStaff();

    if (services.data?.[0] && staff.data?.[0]) {
      const order = await apiHelper.createOrder({
        memberId: existingMemberId,
        items: [
          {
            serviceItemId: services.data[0].id,
            staffId: staff.data[0].id,
            quantity: 1,
          },
        ],
      });

      const orderDetail = order.data;
      await apiHelper.settleOrder(orderDetail.id, [
        {
          method: 'BALANCE',
          amount: orderDetail.payableAmount,
        },
      ]);

      // Verify balance decreased (gift balance used first)
      const finalMember = await apiHelper.getMemberById(existingMemberId);
      const consumedAmount = rechargeAmount + giftAmount - finalMember.data.principalBalance - finalMember.data.giftBalance;
      expect(consumedAmount).toBe(orderDetail.payableAmount);
    }
  });
});