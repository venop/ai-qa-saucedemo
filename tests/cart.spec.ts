// spec: specs/p1-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { requireEnv } from '../utils/env';

test.describe('장바구니', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(requireEnv('SAUCE_USERNAME'), requireEnv('SAUCE_PASSWORD'));
    await expect(page).toHaveURL(/\/inventory\.html$/);
  });

  test('[TC-CART-001] 상품을 담으면 장바구니 배지에 1이 표시', async ({ page }) => {
    const badge = page.getByTestId('shopping-cart-badge');

    // 1) 상단 장바구니 배지 확인
    await expect(badge).toHaveCount(0);

    // 2) 상품 1개의 [Add to cart] 클릭
    await page.getByTestId('add-to-cart-sauce-labs-onesie').click();
    await expect(badge).toHaveText('1');
    const removeButton = page.getByTestId('remove-sauce-labs-onesie');
    await expect(removeButton).toBeVisible();
    await expect(removeButton).toHaveText('Remove');
  });

  test('[TC-CART-005] 장바구니에서 상품을 제거하면 목록과 배지가 갱신', async ({ page }) => {
    const badge = page.getByTestId('shopping-cart-badge');
    const items = page.getByTestId('inventory-item');

    // [사전조건] 상품 2개 담기
    await page.getByTestId('add-to-cart-sauce-labs-onesie').click();
    await page.getByTestId('add-to-cart-sauce-labs-bike-light').click();
    await expect(badge).toHaveText('2');

    // 1) 장바구니 아이콘 클릭
    await page.getByTestId('shopping-cart-link').click();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(items).toHaveCount(2);
    // 각 상품의 수량(QTY)이 1
    await expect(page.getByTestId('item-quantity')).toHaveText(['1', '1']);

    // 2) Sauce Labs Onesie의 [Remove] 클릭
    await page.getByTestId('remove-sauce-labs-onesie').click();
    await expect(items).toHaveCount(1);
    await expect(page.getByTestId('inventory-item-name')).toHaveText('Sauce Labs Bike Light');
    await expect(page.getByTestId('inventory-item-name').filter({ hasText: 'Sauce Labs Onesie' })).toHaveCount(0);
    await expect(badge).toHaveText('1');
  });
});
