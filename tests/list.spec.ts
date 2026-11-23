// spec: specs/p1-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('상품 목록', () => {
  // 로그인은 fixtures의 loggedInPage가 한다 (/inventory.html 도착까지 확인)

  test('[TC-LIST-012] 정렬을 Name (Z to A)로 선택하면 이름 내림차순 정렬', async ({ inventoryPage }) => {
    // 1. 로그인 후 /inventory.html
    await expect(inventoryPage.items).toHaveCount(6);

    // 2. product-sort-container 에서 'za' 선택
    await inventoryPage.sortBy('za');
    await expect(inventoryPage.activeOption).toHaveText('Name (Z to A)');

    const names = await inventoryPage.itemNames.allInnerTexts();
    expect(names).toHaveLength(6);
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a, 'en')));
  });

  test('[TC-LIST-013] 정렬을 Price (low to high)로 선택하면 가격 오름차순 정렬', async ({ inventoryPage }) => {
    // 1. 로그인 후 /inventory.html
    await expect(inventoryPage.items).toHaveCount(6);

    // 2. product-sort-container 에서 'lohi' 선택
    await inventoryPage.sortBy('lohi');
    await expect(inventoryPage.activeOption).toHaveText('Price (low to high)');

    const priceTexts = await inventoryPage.itemPrices.allInnerTexts();
    const prices = priceTexts.map((text) => Number(text.replace('$', '')));
    expect(prices).toHaveLength(6);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i], `${i}번째 가격 ${prices[i]} <= ${prices[i + 1]}`).toBeLessThanOrEqual(prices[i + 1]);
    }
  });
});
