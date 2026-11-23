import { test as base, expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { requireEnv } from '../utils/env';

type Fixtures = {
  /** .env 계정(SAUCE_USERNAME / SAUCE_PASSWORD)으로 로그인해 /inventory.html에 도착한 page */
  loggedInPage: Page;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

/**
 * 로그인된 상태로 시작하는 test.
 * Page Object fixture는 loggedInPage에 의존하므로, 테스트에서 하나라도 받으면 로그인부터 한다.
 * 로그인 화면 자체를 검증하는 tests/login.spec.ts는 이 fixture를 쓰지 않는다.
 */
export const test = base.extend<Fixtures>({
  loggedInPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(requireEnv('SAUCE_USERNAME'), requireEnv('SAUCE_PASSWORD'));
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await use(page);
  },
  inventoryPage: async ({ loggedInPage }, use) => {
    await use(new InventoryPage(loggedInPage));
  },
  cartPage: async ({ loggedInPage }, use) => {
    await use(new CartPage(loggedInPage));
  },
  checkoutPage: async ({ loggedInPage }, use) => {
    await use(new CheckoutPage(loggedInPage));
  },
});

export { expect };
