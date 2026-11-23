import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** 결제 화면: 정보 입력(/checkout-step-one.html), 주문 확인(/checkout-step-two.html), 완료(/checkout-complete.html) */
export class CheckoutPage extends BasePage {
  // 정보 입력
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly error: Locator;
  // 주문 확인
  readonly paymentInfoLabel: Locator;
  readonly paymentInfoValue: Locator;
  readonly shippingInfoLabel: Locator;
  readonly shippingInfoValue: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  // 완료
  readonly completeHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.error = page.getByTestId('error');
    this.paymentInfoLabel = page.getByTestId('payment-info-label');
    this.paymentInfoValue = page.getByTestId('payment-info-value');
    this.shippingInfoLabel = page.getByTestId('shipping-info-label');
    this.shippingInfoValue = page.getByTestId('shipping-info-value');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
    this.completeHeader = page.getByTestId('complete-header');
  }

  /**
   * First Name / Last Name / Zip을 입력한다. 빈 문자열은 비워 둔다는 뜻이다.
   * 정보 입력 화면 진입 직후 입력한 첫 값이 지워지는 경우가 있어(webkit, 병렬 실행 시 재현),
   * 세 값이 모두 반영될 때까지 다시 입력한다. 고정 대기 대신 toPass로 재시도한다.
   * (입력 동작을 안정화하기 위한 확인이며, 테스트의 검증은 테스트 파일에서 한다)
   */
  async fillInfo(first: string, last: string, zip: string) {
    const fields = [
      [this.firstName, first],
      [this.lastName, last],
      [this.postalCode, zip],
    ] as const;
    await expect(async () => {
      for (const [input, value] of fields) await input.fill(value);
      for (const [input, value] of fields) await expect(input).toHaveValue(value, { timeout: 1_000 });
    }).toPass({ timeout: 10_000 });
  }

  async continue() {
    await this.continueButton.click();
  }

  async finish() {
    await this.finishButton.click();
  }
}
