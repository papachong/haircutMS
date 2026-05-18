import { test as base } from '@playwright/test';
import { DatabaseHelper } from '../helpers/database.helper';

type DatabaseFixture = {
  dbHelper: DatabaseHelper;
};

export const test = base.extend<DatabaseFixture>({
  dbHelper: async ({}, use) => {
    const dbHelper = new DatabaseHelper();
    await dbHelper.connect();
    await use(dbHelper);
    await dbHelper.disconnect();
  },
});

export { expect } from '@playwright/test';