import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { requireEnv } from '../utils/env';

test.describe('Seed', () => {
  test('[TC-SEED-001] standard_user 로그인 후 상품 목록 페이지가 보인다', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(requireEnv('SAUCE_USERNAME'), requireEnv('SAUCE_PASSWORD'));

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.getByTestId('inventory-container')).toBeVisible();
  });
});
