/**
 * Authentication Helper for E2E Tests
 */

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login to platform admin
   */
  async loginPlatformAdmin(phone: string, password: string) {
    await this.page.goto('/platform/login');
    await this.page.waitForLoadState('networkidle');

    await this.page.fill('[data-testid="platform-phone-input"]', phone);
    await this.page.fill('[data-testid="platform-password-input"]', password);
    await this.page.click('[data-testid="platform-login-button"]');

    await this.page.waitForURL('/platform/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Login to shop admin
   */
  async loginShop(phone: string, password: string) {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    await this.page.fill('[data-testid="shop-phone-input"]', phone);
    await this.page.fill('[data-testid="shop-password-input"]', password);
    await this.page.click('[data-testid="shop-login-button"]');

    await this.page.waitForURL('/admin/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get stored auth tokens
   */
  async getAuthToken(): Promise<string | null> {
    return await this.page.evaluate(() => localStorage.getItem('accessToken'));
  }

  /**
   * Set auth tokens (for testing authenticated states)
   */
  async setAuthToken(token: string, refreshToken?: string) {
    await this.page.evaluate((t, rt) => {
      localStorage.setItem('accessToken', t);
      if (rt) localStorage.setItem('refreshToken', rt);
    }, token, refreshToken);
  }

  /**
   * Clear auth tokens
   */
  async clearAuthTokens() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Logout
   */
  async logout() {
    await this.clearAuthTokens();
    await this.page.goto('/login');
  }
}