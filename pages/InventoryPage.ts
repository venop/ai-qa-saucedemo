import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/** 상품 목록 화면 (/inventory.html) */
export class InventoryPage extends BasePage {
  readonly sortSelect: Locator;
  readonly activeOption: Locator;

  constructor(page: Page) {
    super(page);
    this.sortSelect = page.getByTestId('product-sort-container');
    this.activeOption = page.getByTestId('active-option');
  }

  addToCartButton(slug: string): Locator {
    return this.page.getByTestId(`add-to-cart-${slug}`);
  }

  removeButton(slug: string): Locator {
    return this.page.getByTestId(`remove-${slug}`);
  }

  /** 상품 슬러그(예: sauce-labs-onesie) 순서대로 [Add to cart]를 누른다 */
  async addToCart(...slugs: string[]) {
    for (const slug of slugs) {
      await this.addToCartButton(slug).click();
    }
  }

  async sortBy(option: SortOption) {
    await this.sortSelect.selectOption(option);
  }
}
