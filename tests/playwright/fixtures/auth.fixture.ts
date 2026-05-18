import { test as base } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';

type AuthFixture = {
  authHelper: AuthHelper;
};

export const test = base.extend<AuthFixture>({
  authHelper: async ({ page }, use) => {
    const authHelper = new AuthHelper(page);
    await use(authHelper);
  },
});

export { expect } from '@playwright/test';