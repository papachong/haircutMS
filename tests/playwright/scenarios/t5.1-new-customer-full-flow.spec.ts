/**
 * T5.1: 新客户到店全流程测试
 *
 * 测试流程：
 * 1. 新客户注册/创建会员
 * 2. 会员充值
 * 3. 创建订单（添加服务项目）
 * 4. 结算订单（使用余额支付）
 * 5. 查看订单记录
 * 6. 验证余额变动
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { ApiHelper } from '../../helpers/api.helper';

test.describe('T5.1 新客户到店全流程', () => {
  let apiHelper: ApiHelper;
  let memberId: string;
  let memberCardNo: string;
  let serviceItemId: string;
  let staffId: string;
  let orderNo: string;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
  });

  test.beforeEach(async ({ page }) => {
    // Login as shop admin
    await page.goto('/login');
    await page.fill('input[type="tel"]', '13800138001');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Setup API auth
    await apiHelper.shopLogin('13800138001', 'password123');
  });

  test('完整的新客户到店流程', async ({ page }) => {
    const testTimestamp = Date.now();

    // ==================== Step 1: 创建新会员 ====================
    await test.step('创建新会员', async () => {
      await page.goto('/admin/members');

      await page.click('[data-testid="create-member-button"]');
      await page.waitForSelector('[data-testid="member-create-modal"]', { timeout: 5000 });

      await page.fill('[data-testid="member-name-input"]', `测试客户${testTimestamp}`);
      await page.fill('[data-testid="member-phone-input"]', `13900${testTimestamp.toString().slice(-6)}`);
      await page.fill('[data-testid="member-card-no-input"]', `CARD${testTimestamp}`);

      await page.click('[data-testid="member-save-button"]');

      await expect(page.locator('text=会员创建成功')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("确定")');

      // Store member info
      memberCardNo = `CARD${testTimestamp}`;
      const memberSearch = await apiHelper.searchMembers(`测试客户${testTimestamp}`);
      if (memberSearch.data && memberSearch.data.length > 0) {
        memberId = memberSearch.data[0].id;
      }
    });

    // ==================== Step 2: 会员充值 ====================
    await test.step('会员充值', async () => {
      // Verify initial balance
      const member = await apiHelper.getMemberById(memberId);
      expect(member.data.principalBalance).toBe(0);
      expect(member.data.giftBalance).toBe(0);

      // Navigate to member detail
      await page.goto(`/admin/members/${memberId}`);

      // Click recharge button
      await page.click('[data-testid="recharge-button"]');
      await page.waitForSelector('[data-testid="recharge-modal"]', { timeout: 5000 });

      // Fill recharge form
      await page.fill('[data-testid="recharge-amount-input"]', '1000');
      await page.fill('[data-testid="recharge-gift-amount-input"]', '200');
      await page.selectOption('[data-testid="recharge-method-select"]', 'CASH');
      await page.fill('[data-testid="recharge-remark-input"]', '新客户首充');

      await page.click('[data-testid="recharge-confirm-button"]');

      await expect(page.locator('text=充值成功')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("确定")');

      // Verify balance updated
      const updatedMember = await apiHelper.getMemberById(memberId);
      expect(updatedMember.data.principalBalance).toBe(1000);
      expect(updatedMember.data.giftBalance).toBe(200);
      expect(updatedMember.data.totalRecharge).toBe(1200);
    });

    // ==================== Step 3: 创建订单 ====================
    await test.step('创建订单', async () => {
      await page.goto('/admin/pos');

      // Search and select member
      await page.fill('[data-testid="member-search-input"]', memberCardNo);
      await page.waitForTimeout(500);
      await page.click(`text=${memberCardNo}`);

      // Get available service items
      const services = await apiHelper.getServiceItems();
      if (services.data && services.data.length > 0) {
        serviceItemId = services.data[0].id;
      }

      // Get available staff
      const staff = await apiHelper.getStaff();
      if (staff.data && staff.data.length > 0) {
        staffId = staff.data[0].id;
      }

      // Add service item to order
      await page.click('[data-testid="add-service-button"]');
      await page.waitForSelector('[data-testid="service-selector-modal"]', { timeout: 5000 });

      // Select first service
      await page.click('[data-testid^="service-item-"]:first-child');

      // Select staff
      await page.click('[data-testid="staff-select"]');
      await page.click(`[data-testid="staff-option-${staffId}"]`);

      // Set quantity
      await page.fill('[data-testid="quantity-input"]', '1');

      await page.click('[data-testid="add-to-order-button"]');

      // Create order
      await page.click('[data-testid="create-order-button"]');
      await page.waitForTimeout(1000);

      // Get order number from URL or page
      const orderCreatedText = await page.locator('text=订单创建成功').textContent();
      expect(orderCreatedText).toBeTruthy();

      // Store order info
      const orders = await apiHelper.getOrders({ memberId, status: 'PENDING' });
      if (orders.data.items && orders.data.items.length > 0) {
        orderNo = orders.data.items[0].orderNo;
      }
    });

    // ==================== Step 4: 结算订单 ====================
    await test.step('结算订单（余额支付）', async () => {
      await page.goto(`/admin/orders/${orderNo}`);

      // Click settle button
      await page.click('[data-testid="settle-button"]');
      await page.waitForSelector('[data-testid="settle-modal"]', { timeout: 5000 });

      // Use balance payment
      const orderDetail = await apiHelper.getOrders({ memberId });
      const payableAmount = orderDetail.data.items.find((o: any) => o.orderNo === orderNo)?.payableAmount || 0;

      await page.fill('[data-testid="balance-amount-input"]', String(payableAmount));
      await page.click('[data-testid="confirm-settle-button"]');

      await expect(page.locator('text=结算成功')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("确定")');

      // Verify order status
      const settledOrder = await apiHelper.getOrders({ memberId, status: 'SETTLED' });
      const order = settledOrder.data.items.find((o: any) => o.orderNo === orderNo);
      expect(order).toBeTruthy();
      expect(order.status).toBe('SETTLED');
      expect(order.paidAmount).toBe(payableAmount);
    });

    // ==================== Step 5: 查看订单记录 ====================
    await test.step('查看订单记录', async () => {
      await page.goto(`/admin/members/${memberId}`);

      // Click orders tab
      await page.click('[data-testid="member-orders-tab"]');
      await page.waitForTimeout(500);

      // Verify order appears in list
      await expect(page.locator(`text=${orderNo}`)).toBeVisible({ timeout: 5000 });

      // Verify order status badge
      await expect(page.locator('[data-testid="order-status-SETTLED"]')).toBeVisible();
    });

    // ==================== Step 6: 验证余额变动 ====================
    await test.step('验证余额变动', async () => {
      await page.goto(`/admin/members/${memberId}`);

      // Get balance from UI
      const principalBalanceText = await page.locator('[data-testid="principal-balance"]').textContent();
      const giftBalanceText = await page.locator('[data-testid="gift-balance"]').textContent();

      // Get balance from API
      const member = await apiHelper.getMemberById(memberId);
      const expectedPrincipal = 1000 - member.data.totalConsume;

      // Verify balance decreased correctly
      expect(principalBalanceText).toContain(expectedPrincipal.toString());
      expect(giftBalanceText).toContain('200');

      // Verify consume count increased
      expect(member.data.visitCount).toBeGreaterThan(0);
    });
  });
});