// spec: specs/p1-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { requireEnv } from '../utils/env';

test.describe('상품 목록', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(requireEnv('SAUCE_USERNAME'), requireEnv('SAUCE_PASSWORD'));
    await expect(page).toHaveURL(/\/inventory\.html$/);
  });

  test('[TC-LIST-012] 정렬을 Name (Z to A)로 선택하면 이름 내림차순 정렬', async ({ page }) => {
    // 1. beforeEach 로그인 후 /inventory.html
    await expect(page.getByTestId('inventory-item')).toHaveCount(6);

    // 2. product-sort-container 에서 'za' 선택
    await page.getByTestId('product-sort-container').selectOption('za');
    await expect(page.getByTestId('active-option')).toHaveText('Name (Z to A)');

    const names = await page.getByTestId('inventory-item-name').allInnerTexts();
    expect(names).toHaveLength(6);
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a, 'en')));
  });

  test('[TC-LIST-013] 정렬을 Price (low to high)로 선택하면 가격 오름차순 정렬', async ({ page }) => {
    // 1. beforeEach 로그인 후 /inventory.html
    await expect(page.getByTestId('inventory-item')).toHaveCount(6);

    // 2. product-sort-container 에서 'lohi' 선택
    await page.getByTestId('product-sort-container').selectOption('lohi');
    await expect(page.getByTestId('active-option')).toHaveText('Price (low to high)');

    const priceTexts = await page.getByTestId('inventory-item-price').allInnerTexts();
    const prices = priceTexts.map((text) => Number(text.replace('$', '')));
    expect(prices).toHaveLength(6);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i], `${i}번째 가격 ${prices[i]} <= ${prices[i + 1]}`).toBeLessThanOrEqual(prices[i + 1]);
    }
  });
});
