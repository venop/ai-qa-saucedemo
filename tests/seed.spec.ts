import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수 ${name}가 .env에 설정되어 있지 않습니다.`);
  return value;
}

test.describe('Seed', () => {
  test('[TC-SEED-001] standard_user 로그인 후 상품 목록 페이지가 보인다', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(requireEnv('SAUCE_USERNAME'), requireEnv('SAUCE_PASSWORD'));

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.getByTestId('inventory-container')).toBeVisible();
  });
});
