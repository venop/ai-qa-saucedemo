// spec: specs/p1-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { type Page } from '@playwright/test';
import { type InventoryPage } from '../pages/InventoryPage';
import { type CartPage } from '../pages/CartPage';
import { type CheckoutPage } from '../pages/CheckoutPage';
import { toCents } from '../utils/text';

const PRODUCTS = [
  { slug: 'sauce-labs-onesie', name: 'Sauce Labs Onesie' },
  { slug: 'sauce-labs-bike-light', name: 'Sauce Labs Bike Light' },
];

type Pages = { page: Page; inventoryPage: InventoryPage; cartPage: CartPage; checkoutPage: CheckoutPage };

// ---- 결제 흐름 (동작은 Page Object, 단계별 확인은 여기서) ----

async function addToCart({ inventoryPage }: Pages, slugs: string[]) {
  await inventoryPage.addToCart(...slugs);
  await expect(inventoryPage.cartBadge).toHaveText(String(slugs.length));
}

async function goToCheckoutInfo({ page, inventoryPage, cartPage }: Pages) {
  await inventoryPage.openCart();
  await expect(page).toHaveURL(/\/cart\.html$/);
  await cartPage.checkout();
  await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
}

async function fillInfoAndContinue({ page, checkoutPage }: Pages, first: string, last: string, zip: string) {
  await checkoutPage.fillInfo(first, last, zip);
  await checkoutPage.continue();
  await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
}

async function reachStepTwo(pages: Pages) {
  await addToCart(pages, PRODUCTS.map((p) => p.slug));
  await goToCheckoutInfo(pages);
  await fillInfoAndContinue(pages, 'Junyoung', 'Kim', '12345');
}

test.describe('결제', () => {
  // 로그인은 fixtures의 loggedInPage가 한다 (/inventory.html 도착까지 확인)

  test('[TC-CHECKOUT-003] 정보 입력에서 First Name을 비우면 에러 표시', async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    const pages = { page, inventoryPage, cartPage, checkoutPage };
    // 사전조건: 상품 1개 담기 > 장바구니 아이콘 > checkout 클릭
    await addToCart(pages, [PRODUCTS[0].slug]);
    await goToCheckoutInfo(pages);

    // 1) First Name을 비워 두고 2) Last Name Kim 3) Zip 12345 입력
    await checkoutPage.fillInfo('', 'Kim', '12345');
    await expect(checkoutPage.firstName).toHaveValue('');
    await expect(checkoutPage.lastName).toHaveValue('Kim');
    await expect(checkoutPage.postalCode).toHaveValue('12345');

    // 4) Continue 클릭
    await checkoutPage.continue();
    await expect(checkoutPage.error).toHaveText('Error: First Name is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  });

  test('[TC-CHECKOUT-009] 정보 입력 후 주문 확인 화면에 담은 2개 상품이 같은 이름/가격/수량 1로 표시', async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    const pages = { page, inventoryPage, cartPage, checkoutPage };
    // 사전조건: 담기 전에 목록 화면에서 이름·가격 기록
    const listPrices = new Map<string, string>();
    for (const product of PRODUCTS) {
      const card = inventoryPage.itemByName(product.name);
      await expect(card).toHaveCount(1);
      const name = (await inventoryPage.nameIn(card).innerText()).trim();
      const price = (await inventoryPage.priceIn(card).innerText()).trim();
      listPrices.set(name, price);
    }
    expect(listPrices.size).toBe(PRODUCTS.length);
    await addToCart(pages, PRODUCTS.map((p) => p.slug));

    // 1) 장바구니 아이콘 클릭 후 Checkout 클릭
    await goToCheckoutInfo(pages);

    // 2) 정보 입력 3) Continue 클릭
    await fillInfoAndContinue(pages, 'Junyoung', 'Kim', '12345');

    const items = checkoutPage.items;
    await expect(items).toHaveCount(2);
    await expect(checkoutPage.quantities).toHaveText(['1', '1']);
    for (const [name, price] of listPrices) {
      const row = checkoutPage.itemByName(name);
      await expect(row).toHaveCount(1);
      await expect(checkoutPage.priceIn(row)).toHaveText(price);
    }
  });

  test('[TC-CHECKOUT-011] 주문 확인 화면 결제 요약의 Total이 Item total + Tax와 일치', async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    // 사전조건: 상품 2개 담기 > 장바구니 > Checkout > 정보 입력 > Continue
    await reachStepTwo({ page, inventoryPage, cartPage, checkoutPage });
    await expect(checkoutPage.items).toHaveCount(2);

    // 1) 결제 수단·배송 정보 노출 확인
    await expect(checkoutPage.paymentInfoLabel).toBeVisible();
    await expect(checkoutPage.paymentInfoValue).toBeVisible();
    await expect(checkoutPage.paymentInfoValue).toHaveText(/\S/);
    await expect(checkoutPage.shippingInfoLabel).toBeVisible();
    await expect(checkoutPage.shippingInfoValue).toBeVisible();
    await expect(checkoutPage.shippingInfoValue).toHaveText(/\S/);

    // 2) 금액 검증 (센트 단위)
    await expect(checkoutPage.subtotalLabel).toBeVisible();
    await expect(checkoutPage.taxLabel).toBeVisible();
    await expect(checkoutPage.totalLabel).toBeVisible();

    const itemPrices = await checkoutPage.itemPrices.allInnerTexts();
    expect(itemPrices).toHaveLength(2);
    const itemsSum = itemPrices.reduce((sum, t) => sum + toCents(t), 0);
    const subtotal = toCents(await checkoutPage.subtotalLabel.innerText());
    const tax = toCents(await checkoutPage.taxLabel.innerText());
    const total = toCents(await checkoutPage.totalLabel.innerText());

    expect(subtotal).toBe(itemsSum);
    expect(total).toBe(subtotal + tax);
  });

  test('[TC-CHECKOUT-017] Finish 후 주문 완료 화면이 보이고 장바구니가 비워짐', async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    // 사전조건: 상품 2개 담기 > 장바구니 > Checkout > 정보 입력 > Continue
    await reachStepTwo({ page, inventoryPage, cartPage, checkoutPage });

    // 1) Finish 클릭
    await checkoutPage.finish();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkoutPage.cartBadge).toHaveCount(0);

    // 2) 장바구니 아이콘 클릭
    await checkoutPage.openCart();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(cartPage.items).toHaveCount(0);
  });

  test('[TC-CHECKOUT-025] Zip/Postal Code에 공백만 입력하면 빈 값으로 처리되어 에러 표시', { annotation: { type: 'bug', description: 'BUG-003 D-08: 공백만 입력해도 검증 통과 (Zip/Postal Code)' } }, async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    // 알려진 결함(BUG-003)으로 실패가 예상된다. 결함이 고쳐져 통과하면 test.fail 때문에 실패로 보고되므로 이 줄을 지운다
    test.fail();
    const pages = { page, inventoryPage, cartPage, checkoutPage };
    // 사전조건: 상품 1개 담고 정보 입력 화면에 있음
    await addToCart(pages, [PRODUCTS[0].slug]);
    await goToCheckoutInfo(pages);

    // 1) First Name Junyoung, Last Name Kim 2) Zip/Postal Code에 공백 3칸만 입력
    await checkoutPage.fillInfo('Junyoung', 'Kim', '   ');
    await expect(checkoutPage.postalCode).toHaveValue('   ');

    // 3) Continue 클릭 → 기대결과: 공백만 입력한 값은 빈 값으로 처리되어 에러 표시, 정보 입력 화면에 머무름
    await checkoutPage.continue();
    await expect(checkoutPage.error).toHaveText('Error: Postal Code is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  });

  test('[TC-CHECKOUT-018] 주문 완료 후 뒤로가기로 돌아간 주문 확인 화면에서 Finish를 다시 눌러도 주문 완료 화면이 다시 표시되지 않음', { annotation: { type: 'bug', description: 'BUG-001 D-11: 완료 후 뒤로가기로 빈 주문을 다시 완료할 수 있음' } }, async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    // 알려진 결함(BUG-001)으로 실패가 예상된다. 결함이 고쳐져 통과하면 test.fail 때문에 실패로 보고되므로 이 줄을 지운다
    test.fail();
    // 사전조건: 상품 2개를 주문해 주문 완료 화면에 있음
    await reachStepTwo({ page, inventoryPage, cartPage, checkoutPage });
    await checkoutPage.finish();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);

    // 1) 브라우저 뒤로가기 → 주문 확인 화면이 보이면
    await page.goBack();
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);

    // 2) [Finish] 다시 선택 → 주문 완료 화면이 다시 표시되지 않음 (D-11)
    // 부정 검증은 즉시 통과할 수 있으므로, 클릭 후 화면 전환이 끝났다고 보는 근거는
    // saucedemo의 [Finish]가 클라이언트 라우팅으로 클릭 처리 중에 바로 이동한다는 점이다
    // TODO(BUG-001): 부정 검증이라 결함이 고쳐져서 통과할 때 화면 전환 전에 확인한 게 아닌지 재확인 필요.
    //   D-11 기대 동작이 정해지면(Q-11) 긍정 검증으로 바꾼다
    await checkoutPage.finish();
    await expect(page).not.toHaveURL(/\/checkout-complete\.html$/);
    await expect(checkoutPage.completeHeader).toHaveCount(0);
  });

  test('[TC-CHECKOUT-033] 빈 주문 확인 화면에서도 Item total, Tax, Total이 소수점 둘째 자리까지 표시됨', { annotation: { type: 'bug', description: 'BUG-001 D-10 부수 증상: 빈 주문 확인 화면의 Item total이 $0으로 표시됨' } }, async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    // 알려진 결함(BUG-001)으로 실패가 예상된다. 결함이 고쳐져 통과하면 test.fail 때문에 실패로 보고되므로 이 줄을 지운다
    test.fail();
    // 사전조건: 상품 2개를 주문해 주문 완료 화면에 있음
    await reachStepTwo({ page, inventoryPage, cartPage, checkoutPage });
    await checkoutPage.finish();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);

    // 1) 브라우저 뒤로가기
    await page.goBack();
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(checkoutPage.items).toHaveCount(0);

    // 2) Item total, Tax, Total 확인 (D-10). 세 값을 모두 보고하도록 soft로 검증한다
    await expect.soft(checkoutPage.subtotalLabel).toHaveText('Item total: $0.00');
    await expect.soft(checkoutPage.taxLabel).toHaveText('Tax: $0.00');
    await expect.soft(checkoutPage.totalLabel).toHaveText('Total: $0.00');
  });

  test('[TC-CHECKOUT-022] 주문 확인 화면에서 Cancel 시 정보 입력 화면으로 돌아가고 장바구니가 유지됨', { annotation: { type: 'bug', description: 'BUG-002 D-09: 주문 확인 화면 Cancel 시 상품 목록으로 이동' } }, async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    // 알려진 결함(BUG-002)으로 실패가 예상된다. 결함이 고쳐져 통과하면 test.fail 때문에 실패로 보고되므로 이 줄을 지운다
    test.fail();
    // 사전조건: 상품 2개 담고 주문 확인 화면에 있음
    await reachStepTwo({ page, inventoryPage, cartPage, checkoutPage });

    // 1) Cancel 선택 → 바로 직전 페이지인 정보 입력 화면, 배지 "2" 유지
    await checkoutPage.cancel();
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(checkoutPage.cartBadge).toHaveText('2');

    // 2) 장바구니 아이콘 선택 → 2개 상품 유지
    await checkoutPage.openCart();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(cartPage.items).toHaveCount(2);
    for (const product of PRODUCTS) {
      await expect(cartPage.itemByName(product.name)).toHaveCount(1);
    }
  });

  test('[TC-CHECKOUT-029] First Name에 공백만 입력하면 빈 값으로 처리되어 에러 표시', { annotation: { type: 'bug', description: 'BUG-003 D-08: 공백만 입력해도 검증 통과 (First Name)' } }, async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    // 알려진 결함(BUG-003)으로 실패가 예상된다. 결함이 고쳐져 통과하면 test.fail 때문에 실패로 보고되므로 이 줄을 지운다
    test.fail();
    const pages = { page, inventoryPage, cartPage, checkoutPage };
    // 사전조건: 상품 1개 담고 정보 입력 화면에 있음
    await addToCart(pages, [PRODUCTS[0].slug]);
    await goToCheckoutInfo(pages);

    // 1) First Name 공백 3칸 2) Last Name Kim, Zip 12345 입력
    await checkoutPage.fillInfo('   ', 'Kim', '12345');
    await expect(checkoutPage.firstName).toHaveValue('   ');

    // 3) Continue 선택
    await checkoutPage.continue();
    await expect(checkoutPage.error).toHaveText('Error: First Name is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  });

  test('[TC-CHECKOUT-030] Last Name에 공백만 입력하면 빈 값으로 처리되어 에러 표시', { annotation: { type: 'bug', description: 'BUG-003 D-08: 공백만 입력해도 검증 통과 (Last Name)' } }, async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    // 알려진 결함(BUG-003)으로 실패가 예상된다. 결함이 고쳐져 통과하면 test.fail 때문에 실패로 보고되므로 이 줄을 지운다
    test.fail();
    const pages = { page, inventoryPage, cartPage, checkoutPage };
    // 사전조건: 상품 1개 담고 정보 입력 화면에 있음
    await addToCart(pages, [PRODUCTS[0].slug]);
    await goToCheckoutInfo(pages);

    // 1) First Name Junyoung 2) Last Name 공백 3칸 3) Zip 12345 입력
    await checkoutPage.fillInfo('Junyoung', '   ', '12345');
    await expect(checkoutPage.lastName).toHaveValue('   ');

    // 4) Continue 선택
    await checkoutPage.continue();
    await expect(checkoutPage.error).toHaveText('Error: Last Name is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  });
});
