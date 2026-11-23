import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** 장바구니 화면 (/cart.html) */
export class CartPage extends BasePage {
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  removeButton(slug: string): Locator {
    return this.page.getByTestId(`remove-${slug}`);
  }

  async remove(slug: string) {
    await this.removeButton(slug).click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
