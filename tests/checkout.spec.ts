// spec: specs/p1-plan.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { requireEnv } from '../utils/env';

const PRODUCTS = [
  { slug: 'sauce-labs-onesie', name: 'Sauce Labs Onesie' },
  { slug: 'sauce-labs-bike-light', name: 'Sauce Labs Bike Light' },
];

// 상품 이름이 정확히 일치하는 텍스트 (hasText 문자열은 부분 일치라 정규식으로 고정)
function exactText(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

function toCents(text: string): number {
  const match = text.match(/\$(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`금액을 파싱할 수 없습니다: "${text}"`);
  }
  return Math.round(Number(match[1]) * 100);
}

async function addToCart(page: Page, slugs: string[]) {
  for (const slug of slugs) {
    await page.getByTestId(`add-to-cart-${slug}`).click();
  }
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText(String(slugs.length));
}

async function goToCheckoutInfo(page: Page) {
  await page.getByTestId('shopping-cart-link').click();
  await expect(page).toHaveURL(/\/cart\.html$/);
  await page.getByTestId('checkout').click();
  await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
}

// 정보 입력 화면 진입 직후 입력한 첫 값이 지워지는 경우가 있어(webkit, 병렬 실행 시 재현),
// 세 값이 모두 반영될 때까지 다시 입력한다. 고정 대기 대신 toPass로 재시도한다.
async function fillInfo(page: Page, first: string, last: string, zip: string) {
  const fields = [
    [page.getByTestId('firstName'), first],
    [page.getByTestId('lastName'), last],
    [page.getByTestId('postalCode'), zip],
  ] as const;
  await expect(async () => {
    for (const [input, value] of fields) await input.fill(value);
    for (const [input, value] of fields) await expect(input).toHaveValue(value, { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
}

async function fillInfoAndContinue(page: Page, first: string, last: string, zip: string) {
  await fillInfo(page, first, last, zip);
  await page.getByTestId('continue').click();
  await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
}

async function reachStepTwo(page: Page) {
  await addToCart(page, PRODUCTS.map((p) => p.slug));
  await goToCheckoutInfo(page);
  await fillInfoAndContinue(page, 'Junyoung', 'Kim', '12345');
}

test.describe('결제', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(requireEnv('SAUCE_USERNAME'), requireEnv('SAUCE_PASSWORD'));
    await expect(page).toHaveURL(/\/inventory\.html$/);
  });

  test('[TC-CHECKOUT-003] 정보 입력에서 First Name을 비우면 에러 표시', async ({ page }) => {
    // 사전조건: 상품 1개 담기 > 장바구니 아이콘 > checkout 클릭
    await addToCart(page, [PRODUCTS[0].slug]);
    await goToCheckoutInfo(page);

    // 1) First Name을 비워 두고 2) Last Name Kim 3) Zip 12345 입력
    await fillInfo(page, '', 'Kim', '12345');
    await expect(page.getByTestId('firstName')).toHaveValue('');
    await expect(page.getByTestId('lastName')).toHaveValue('Kim');
    await expect(page.getByTestId('postalCode')).toHaveValue('12345');

    // 4) Continue 클릭
    await page.getByTestId('continue').click();
    await expect(page.getByTestId('error')).toHaveText('Error: First Name is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  });

  test('[TC-CHECKOUT-009] 정보 입력 후 주문 확인 화면에 담은 2개 상품이 같은 이름/가격/수량 1로 표시', async ({ page }) => {
    // 사전조건: 담기 전에 목록 화면에서 이름·가격 기록
    const listPrices = new Map<string, string>();
    for (const product of PRODUCTS) {
      const card = page
        .getByTestId('inventory-item')
        .filter({ has: page.getByTestId('inventory-item-name').filter({ hasText: exactText(product.name) }) });
      await expect(card).toHaveCount(1);
      const name = (await card.getByTestId('inventory-item-name').innerText()).trim();
      const price = (await card.getByTestId('inventory-item-price').innerText()).trim();
      listPrices.set(name, price);
    }
    expect(listPrices.size).toBe(PRODUCTS.length);
    await addToCart(page, PRODUCTS.map((p) => p.slug));

    // 1) 장바구니 아이콘 클릭 후 Checkout 클릭
    await goToCheckoutInfo(page);

    // 2) 정보 입력 3) Continue 클릭
    await fillInfoAndContinue(page, 'Junyoung', 'Kim', '12345');

    const items = page.getByTestId('inventory-item');
    await expect(items).toHaveCount(2);
    await expect(page.getByTestId('item-quantity')).toHaveText(['1', '1']);
    for (const [name, price] of listPrices) {
      const row = items.filter({ has: page.getByTestId('inventory-item-name').filter({ hasText: exactText(name) }) });
      await expect(row).toHaveCount(1);
      await expect(row.getByTestId('inventory-item-price')).toHaveText(price);
    }
  });

  test('[TC-CHECKOUT-011] 주문 확인 화면 결제 요약의 Total이 Item total + Tax와 일치', async ({ page }) => {
    // 사전조건: 상품 2개 담기 > 장바구니 > Checkout > 정보 입력 > Continue
    await reachStepTwo(page);
    await expect(page.getByTestId('inventory-item')).toHaveCount(2);

    // 1) 결제 수단·배송 정보 노출 확인
    await expect(page.getByTestId('payment-info-label')).toBeVisible();
    await expect(page.getByTestId('payment-info-value')).toBeVisible();
    await expect(page.getByTestId('payment-info-value')).toHaveText(/\S/);
    await expect(page.getByTestId('shipping-info-label')).toBeVisible();
    await expect(page.getByTestId('shipping-info-value')).toBeVisible();
    await expect(page.getByTestId('shipping-info-value')).toHaveText(/\S/);

    // 2) 금액 검증 (센트 단위)
    await expect(page.getByTestId('subtotal-label')).toBeVisible();
    await expect(page.getByTestId('tax-label')).toBeVisible();
    await expect(page.getByTestId('total-label')).toBeVisible();

    const itemPrices = await page.getByTestId('inventory-item-price').allInnerTexts();
    expect(itemPrices).toHaveLength(2);
    const itemsSum = itemPrices.reduce((sum, t) => sum + toCents(t), 0);
    const subtotal = toCents(await page.getByTestId('subtotal-label').innerText());
    const tax = toCents(await page.getByTestId('tax-label').innerText());
    const total = toCents(await page.getByTestId('total-label').innerText());

    expect(subtotal).toBe(itemsSum);
    expect(total).toBe(subtotal + tax);
  });

  test('[TC-CHECKOUT-017] Finish 후 주문 완료 화면이 보이고 장바구니가 비워짐', async ({ page }) => {
    // 사전조건: 상품 2개 담기 > 장바구니 > Checkout > 정보 입력 > Continue
    await reachStepTwo(page);

    // 1) Finish 클릭
    await page.getByTestId('finish').click();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
    await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);

    // 2) 장바구니 아이콘 클릭
    await page.getByTestId('shopping-cart-link').click();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.getByTestId('inventory-item')).toHaveCount(0);
  });
});
