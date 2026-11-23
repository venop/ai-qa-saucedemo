// spec: specs/p1-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('장바구니', () => {
  // 로그인은 fixtures의 loggedInPage가 한다 (/inventory.html 도착까지 확인)

  test('[TC-CART-001] 상품을 담으면 장바구니 배지에 1이 표시', async ({ inventoryPage }) => {
    const badge = inventoryPage.cartBadge;

    // 1) 상단 장바구니 배지 확인
    await expect(badge).toHaveCount(0);

    // 2) 상품 1개의 [Add to cart] 클릭
    await inventoryPage.addToCart('sauce-labs-onesie');
    await expect(badge).toHaveText('1');
    const removeButton = inventoryPage.removeButton('sauce-labs-onesie');
    await expect(removeButton).toBeVisible();
    await expect(removeButton).toHaveText('Remove');
  });

  test('[TC-CART-005] 장바구니에서 상품을 제거하면 목록과 배지가 갱신', async ({ page, inventoryPage, cartPage }) => {
    const badge = cartPage.cartBadge;
    const items = cartPage.items;

    // [사전조건] 상품 2개 담기
    await inventoryPage.addToCart('sauce-labs-onesie', 'sauce-labs-bike-light');
    await expect(badge).toHaveText('2');

    // 1) 장바구니 아이콘 클릭
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(items).toHaveCount(2);
    // 각 상품의 수량(QTY)이 1
    await expect(cartPage.quantities).toHaveText(['1', '1']);

    // 2) Sauce Labs Onesie의 [Remove] 클릭
    await cartPage.remove('sauce-labs-onesie');
    await expect(items).toHaveCount(1);
    await expect(cartPage.itemNames).toHaveText('Sauce Labs Bike Light');
    await expect(cartPage.itemNames.filter({ hasText: 'Sauce Labs Onesie' })).toHaveCount(0);
    await expect(badge).toHaveText('1');
  });
});
