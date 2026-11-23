import { type Locator, type Page } from '@playwright/test';
import { exactText } from '../utils/text';

/**
 * 로그인 후 화면의 공통 요소.
 * - 헤더: 장바구니 아이콘·배지
 * - 상품 행: 상품 목록, 장바구니, 주문 확인 화면이 같은 data-test(inventory-item 등)를 쓴다
 */
export class BasePage {
  readonly page: Page;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly quantities: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.quantities = page.getByTestId('item-quantity');
  }

  /** 상품 이름이 정확히 일치하는 상품 행 */
  itemByName(name: string): Locator {
    return this.items.filter({ has: this.page.getByTestId('inventory-item-name').filter({ hasText: exactText(name) }) });
  }

  nameIn(item: Locator): Locator {
    return item.getByTestId('inventory-item-name');
  }

  priceIn(item: Locator): Locator {
    return item.getByTestId('inventory-item-price');
  }

  async openCart() {
    await this.cartLink.click();
  }
}
