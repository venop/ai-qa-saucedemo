# SauceDemo 자동화 1차 대상 테스트 계획 (P1, 12건)

## Application Overview

대상: https://www.saucedemo.com (테스트 전용 데모 사이트). 범위: tc/testcases.csv 중 '자동화 1차 대상=Y'인 12개 TC만 다룬다. 모든 절차는 실제 사이트에서 수행해 URL·문구·요소를 확인했다(2026-11-23).

### 공통 규칙
- 로케이터 우선순위: data-test > getByRole > getByText (CSS/XPath는 최후 수단). playwright.config.ts에 `testIdAttribute: 'data-test'`가 설정되어 있으므로 `page.getByTestId('...')`로 data-test를 찾는다.
- 고정 대기(waitForTimeout) 금지. expect의 자동 대기(auto-waiting assertion)를 사용한다.
- 계정 정보는 .env(`SAUCE_USERNAME`, `SAUCE_PASSWORD`)에서 읽고 코드에 직접 쓰지 않는다. locked_out_user처럼 계정명 자체가 테스트 데이터인 경우 계정명은 코드에 써도 되지만 비밀번호는 .env의 `SAUCE_PASSWORD`를 쓴다. 틀린 비밀번호(wrong_password)는 테스트 데이터로 직접 사용한다.
- 테스트 이름에 TC ID를 붙인다: `test('[TC-LOGIN-001] ...')`.
- 화면 값의 순서·합계는 고정값과 비교하지 않고, 화면에서 읽은 값으로 계산해 검증한다(상품 구성·가격이 바뀌어도 깨지지 않도록).
- 금액 비교는 '$' 뒤 숫자를 파싱해 센트 단위 정수(Math.round(값 * 100))로 바꿔 비교한다(부동소수 오차 방지).

### 시작 상태와 로그인 방법
- **로그인 TC 4개 (tests/login.spec.ts)**: 로그아웃 경로를 쓰지 않는다. 쿠키·스토리지가 없는 새 컨텍스트(Playwright 기본 테스트 컨텍스트)에서 `LoginPage.goto()`로 로그인 화면(/)에 바로 접속해 시작한다. 로그인 동작이 필요한 TC(001, 004, 011)는 pages/LoginPage.ts의 `goto()`, `login(username, password)`, `errorMessage`를 사용한다.
- **나머지 8개 TC (tests/list.spec.ts, cart.spec.ts, checkout.spec.ts)**: 로그인은 pages/LoginPage.ts를 재사용한다. 각 파일의 `test.beforeEach`에서 `new LoginPage(page)` → `goto()` → `login(SAUCE_USERNAME, SAUCE_PASSWORD)`를 수행하고 /inventory.html 도착을 확인한 뒤 시나리오를 시작한다. 로그인 절차를 테스트 안에 다시 작성하지 않는다.
- tests/seed.spec.ts는 탐색·코드 생성 도구가 페이지를 준비하는 데만 쓰며, 각 테스트 파일은 seed에 의존하지 않고 위 방법으로 스스로 시작 상태를 만든다.

### 파일 구성
| 파일 | TC |
|---|---|
| tests/login.spec.ts | TC-LOGIN-001, 004, 011, 013 |
| tests/list.spec.ts | TC-LIST-012, 013 |
| tests/cart.spec.ts | TC-CART-001, 005 |
| tests/checkout.spec.ts | TC-CHECKOUT-003, 009, 011, 017 |

### 공통 요소 (data-test)
- 로그인: username, password, login-button, error
- 상품 목록: inventory-item, inventory-item-name, inventory-item-price, product-sort-container(select, 값 az/za/lohi/hilo), active-option, add-to-cart-<상품슬러그>, remove-<상품슬러그>, shopping-cart-link, shopping-cart-badge(장바구니가 비어 있으면 요소 자체가 없음)
- 장바구니: inventory-item, item-quantity, checkout, continue-shopping
- 정보 입력: firstName, lastName, postalCode, continue
- 주문 확인: inventory-item, inventory-item-name, inventory-item-price, item-quantity, payment-info-label, payment-info-value, shipping-info-label, shipping-info-value, subtotal-label, tax-label, total-label, finish
- 완료: complete-header
- 상품 슬러그 예: sauce-labs-onesie, sauce-labs-bike-light, sauce-labs-backpack

## Test Scenarios

### 1. 로그인 — tests/login.spec.ts

**시작 상태:** 새 컨텍스트(쿠키·스토리지 없음)에서 로그인 화면(/)으로 바로 시작. 로그아웃 경로는 사용하지 않는다.

#### 1.1. [TC-LOGIN-001] 유효한 계정으로 로그인하면 상품 목록으로 이동

**File:** `tests/login.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-LOGIN-001 / REQ_ID: REQ-LOGIN-01 / 우선순위: P1 / 유형: 정상. 새 컨텍스트에서 LoginPage.goto()로 https://www.saucedemo.com/ 접속.
    - expect: 로그인 폼(username, password, login-button)이 보인다
  2. LoginPage.login(.env의 SAUCE_USERNAME(standard_user), .env의 SAUCE_PASSWORD) 실행
    - expect: URL이 https://www.saucedemo.com/inventory.html 로 바뀐다 (toHaveURL)
    - expect: 상품 목록이 노출된다: inventory-item 6개 (toHaveCount(6))
    - expect: error 요소가 표시되지 않는다

#### 1.2. [TC-LOGIN-004] 잘못된 비밀번호로 로그인하면 에러 메시지 표시

**File:** `tests/login.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-LOGIN-004 / REQ_ID: REQ-LOGIN-02 / 우선순위: P1 / 유형: 예외. 새 컨텍스트에서 LoginPage.goto()로 로그인 화면 접속.
    - expect: 로그인 화면이 보인다
  2. LoginPage.login(.env의 SAUCE_USERNAME, 'wrong_password') 실행
    - expect: LoginPage.errorMessage 텍스트가 "Epic sadface: Username and password do not match any user in this service" 이다 (실제 화면 확인 완료)
    - expect: URL은 https://www.saucedemo.com/ 로 유지된다 (toHaveURL)

#### 1.3. [TC-LOGIN-011] 잠긴 계정(locked_out_user)으로 로그인하면 잠금 안내 표시

**File:** `tests/login.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-LOGIN-011 / REQ_ID: REQ-LOGIN-03 / 우선순위: P1 / 유형: 정상. 새 컨텍스트에서 LoginPage.goto()로 로그인 화면 접속.
    - expect: 로그인 화면이 보인다
  2. LoginPage.login('locked_out_user', .env의 SAUCE_PASSWORD) 실행
    - expect: LoginPage.errorMessage 텍스트가 "Epic sadface: Sorry, this user has been locked out." 이다 (실제 화면 확인 완료)
    - expect: URL은 https://www.saucedemo.com/ 로 유지된다

#### 1.4. [TC-LOGIN-013] 비로그인 상태에서 /inventory.html 직접 접근 시 로그인 화면으로 차단

**File:** `tests/login.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-LOGIN-013 / REQ_ID: REQ-LOGIN-04 / 우선순위: P1 / 유형: 정상. 새 컨텍스트(세션 쿠키 없음)에서 시작한다. 로그인 화면을 거치지 않는다.
  2. page.goto('/inventory.html') 로 직접 접속
    - expect: URL이 https://www.saucedemo.com/ (로그인 화면)으로 바뀐다 (toHaveURL)
    - expect: inventory-item 이 0개다 (상품 목록 미노출, toHaveCount(0))
    - expect: error 텍스트가 "Epic sadface: You can only access '/inventory.html' when you are logged in." 이다 (실제 화면 확인 완료)

### 2. 상품 목록 — tests/list.spec.ts

**시작 상태:** beforeEach에서 pages/LoginPage.ts로 로그인(.env 계정) → /inventory.html, 장바구니 비어 있음.

#### 2.1. [TC-LIST-012] 정렬을 Name (Z to A)로 선택하면 이름 내림차순 정렬

**File:** `tests/list.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-LIST-012 / REQ_ID: REQ-LIST-05 / 우선순위: P1 / 유형: 정상. beforeEach 로그인 후 /inventory.html.
    - expect: inventory-item 6개
  2. product-sort-container 에서 selectOption('za') (옵션 라벨 Name (Z to A))
    - expect: active-option 텍스트가 "Name (Z to A)"
    - expect: inventory-item-name 6개의 텍스트를 화면 순서대로 읽어(allInnerTexts) 배열 names를 만든다
    - expect: names가 자신을 알파벳 내림차순으로 정렬한 배열(`[...names].sort((a, b) => b.localeCompare(a))`)과 같다. 상품 이름을 고정값으로 비교하지 않는다

#### 2.2. [TC-LIST-013] 정렬을 Price (low to high)로 선택하면 가격 오름차순 정렬

**File:** `tests/list.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-LIST-013 / REQ_ID: REQ-LIST-05 / 우선순위: P1 / 유형: 정상. beforeEach 로그인 후 /inventory.html.
    - expect: inventory-item 6개
  2. product-sort-container 에서 selectOption('lohi') (Price (low to high))
    - expect: active-option 텍스트가 "Price (low to high)"
    - expect: inventory-item-price 6개의 텍스트를 화면 순서대로 읽어 '$'를 제거하고 숫자 배열 prices로 만든다
    - expect: 모든 i에 대해 prices[i] <= prices[i + 1] 이다. 가격이 같은 상품이 있을 수 있으므로 엄격한 < 로 비교하지 않는다. 가격을 고정값으로 비교하지 않는다

### 3. 장바구니 — tests/cart.spec.ts

**시작 상태:** beforeEach에서 pages/LoginPage.ts로 로그인(.env 계정) → /inventory.html, 장바구니 비어 있음.

#### 3.1. [TC-CART-001] 상품을 담으면 장바구니 배지에 1이 표시

**File:** `tests/cart.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-CART-001 / REQ_ID: REQ-CART-01 / 우선순위: P1 / 유형: 정상. beforeEach 로그인 후 /inventory.html. 1) 상단 장바구니 배지 확인
    - expect: shopping-cart-badge 요소가 없다 (toHaveCount(0))
  2. 2) 상품 1개(예: Sauce Labs Onesie)의 [Add to cart] (add-to-cart-sauce-labs-onesie) 클릭
    - expect: shopping-cart-badge 텍스트가 "1"
    - expect: 해당 버튼이 remove-sauce-labs-onesie 로 바뀌고 텍스트 "Remove" (실제 확인)

#### 3.2. [TC-CART-005] 장바구니에서 상품을 제거하면 목록과 배지가 갱신

**File:** `tests/cart.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-CART-005 / REQ_ID: REQ-CART-02 / 우선순위: P1 / 유형: 정상. beforeEach 로그인 후 /inventory.html에서 add-to-cart-sauce-labs-onesie, add-to-cart-sauce-labs-bike-light 를 클릭해 2개를 담는다.
    - expect: 배지 "2"
  2. 1) 장바구니 아이콘(shopping-cart-link) 클릭
    - expect: URL https://www.saucedemo.com/cart.html
    - expect: inventory-item 2개
  3. 2) 상품 1개(Sauce Labs Onesie)의 [Remove] (remove-sauce-labs-onesie) 클릭
    - expect: 제거한 상품(Sauce Labs Onesie)이 장바구니 목록에서 사라지고 inventory-item 1개만 남는다 (남은 상품: Sauce Labs Bike Light)
    - expect: shopping-cart-badge 텍스트가 "1"

### 4. 결제 — tests/checkout.spec.ts

**시작 상태:** beforeEach에서 pages/LoginPage.ts로 로그인(.env 계정) → /inventory.html, 장바구니 비어 있음.

#### 4.1. [TC-CHECKOUT-003] 정보 입력에서 First Name을 비우면 에러 표시

**File:** `tests/checkout.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-CHECKOUT-003 / REQ_ID: REQ-CHECKOUT-02 / 우선순위: P1 / 유형: 예외. beforeEach 로그인 후 상품 1개 담기 > 장바구니 아이콘 > checkout 클릭.
    - expect: URL https://www.saucedemo.com/checkout-step-one.html
  2. 1) First Name(firstName)을 비워 둔다 2) Last Name(lastName)에 Kim 입력 3) Zip/Postal Code(postalCode)에 12345 입력
    - expect: lastName=Kim, postalCode=12345, firstName 비어 있음
  3. 4) [Continue](continue) 클릭
    - expect: error 텍스트가 "Error: First Name is required" (실제 확인)
    - expect: URL은 checkout-step-one.html 로 유지된다 (checkout-step-two.html 로 이동하지 않음)

#### 4.2. [TC-CHECKOUT-009] 정보 입력 후 주문 확인 화면에 담은 2개 상품이 같은 이름/가격/수량 1로 표시

**File:** `tests/checkout.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-CHECKOUT-009 / REQ_ID: REQ-CHECKOUT-03 / 우선순위: P1 / 유형: 정상. beforeEach 로그인 후 /inventory.html에서 상품 2개(예: Sauce Labs Onesie, Sauce Labs Bike Light)를 담고, 담기 전에 목록 화면에서 두 상품의 이름·가격(inventory-item-name/price)을 읽어 기록해 둔다.
    - expect: 배지 "2"
  2. 1) 장바구니 아이콘 클릭 후 [Checkout](checkout) 클릭
    - expect: URL checkout-step-one.html
  3. 2) First Name에 Junyoung, Last Name에 Kim, Zip/Postal Code에 12345 입력
    - expect: 입력됨
  4. 3) [Continue] 클릭
    - expect: URL https://www.saucedemo.com/checkout-step-two.html
    - expect: inventory-item 2개, 각 item-quantity 는 "1"
    - expect: 화면의 이름·가격이 1단계에서 기록한 목록 화면 값과 같다. 표시 순서는 담은 순서와 다를 수 있으므로 상품 이름 기준으로 짝지어 비교한다(가격을 고정값으로 쓰지 않는다)

#### 4.3. [TC-CHECKOUT-011] 주문 확인 화면 결제 요약의 Total이 Item total + Tax와 일치

**File:** `tests/checkout.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-CHECKOUT-011 / REQ_ID: REQ-CHECKOUT-04 / 우선순위: P1 / 유형: 정상. beforeEach 로그인 후 상품 2개 담기 > 장바구니 > Checkout > 정보 입력(Junyoung/Kim/12345) > Continue 로 checkout-step-two.html 에 위치.
    - expect: 주문 확인 화면
  2. 1) 결제 수단·배송 정보 노출 확인
    - expect: payment-info-label, payment-info-value 가 보이고(toBeVisible) value가 비어 있지 않다
    - expect: shipping-info-label, shipping-info-value 가 보이고 value가 비어 있지 않다
    - expect: 결제 수단·배송 정보의 문구 자체는 고정값으로 검증하지 않는다(노출 여부만 확인)
  3. 2) 금액 검증 (모두 화면 값으로 계산, 센트 단위 정수로 비교)
    - expect: 주문 확인 화면의 inventory-item-price 를 모두 읽어 센트로 바꿔 합한 값 = subtotal-label("Item total: $...")의 금액
    - expect: total-label("Total: $...")의 금액 = subtotal-label 금액 + tax-label("Tax: $...") 금액
    - expect: Tax 값 자체는 고정하거나 세율로 계산해 검증하지 않는다(세율·반올림은 확인 필요 항목 Q-01). Tax는 파싱 가능한 금액으로 표시되는지만 확인한다
    - expect: Item total, Tax, Total 금액을 고정값($17.98 등)과 비교하지 않는다

#### 4.4. [TC-CHECKOUT-017] Finish 후 주문 완료 화면이 보이고 장바구니가 비워짐

**File:** `tests/checkout.spec.ts`

**Steps:**
  1. [사전조건] TC_ID: TC-CHECKOUT-017 / REQ_ID: REQ-CHECKOUT-05 / 우선순위: P1 / 유형: 정상. beforeEach 로그인 후 상품 2개 담기 > 장바구니 > Checkout > 정보 입력 > Continue 로 checkout-step-two.html 에 위치.
    - expect: 배지 "2"
  2. 1) [Finish](finish) 클릭
    - expect: URL https://www.saucedemo.com/checkout-complete.html
    - expect: complete-header 텍스트 "Thank you for your order!" (실제 확인)
    - expect: shopping-cart-badge 요소가 없다 (toHaveCount(0))
  3. 2) 장바구니 아이콘(shopping-cart-link) 클릭
    - expect: URL https://www.saucedemo.com/cart.html
    - expect: inventory-item 이 0개 (상품 없음, toHaveCount(0))

## CSV와 실제 화면의 차이

참고: 아래의 상품 이름 순서·가격·금액은 2026-11-23 관측값 기록이며, 테스트 코드의 기대값으로 쓰지 않는다(시나리오의 검증 방식을 따른다).

기준: 각 TC의 기대결과는 CSV 문구를 그대로 유지했고, 아래는 실제 사이트(2026-11-23 확인)와 비교한 차이만 기록한다. 시나리오의 기대결과를 사이트에 맞춰 바꾸지 않았다.

- TC-LOGIN-001: 차이 없음. 실제 URL은 https://www.saucedemo.com/inventory.html 이고 상품 6개가 노출된다.
- TC-LOGIN-004: 차이 없음. 에러 문구는 "Epic sadface: Username and password do not match any user in this service" 로 일치하고, URL은 / 로 유지된다.
- TC-LOGIN-011: 차이 없음. 문구는 "Epic sadface: Sorry, this user has been locked out." 로 일치하고, URL은 / 로 유지된다.
- TC-LOGIN-013: 차이 없음. 문구는 "Epic sadface: You can only access '/inventory.html' when you are logged in." 로 일치하고, 로그인 화면(/)으로 이동하며 상품은 0개다.
- TC-LIST-012: 차이 없음. 드롭다운(active-option)에 "Name (Z to A)"가 표시되고, 이름 순서는 Test.allTheThings() T-Shirt (Red), Sauce Labs Onesie, Sauce Labs Fleece Jacket, Sauce Labs Bolt T-Shirt, Sauce Labs Bike Light, Sauce Labs Backpack 이다.
- TC-LIST-013: 문구상 차이는 없으나 유의점이 있다. 가격은 $7.99, $9.99, $15.99, $15.99, $29.99, $49.99 이고 $15.99 동가가 2개다. CSV의 "앞 ≤ 뒤"(이하) 기준은 맞지만 엄격한 "<"로 검증하면 실패하므로 <= 로 비교해야 한다.
- TC-CART-001: 차이 없음. 담기 전에는 배지 요소가 DOM에 아예 없고(접근성 이름 "Cart, empty"), 담은 후 "1"이 표시된다. 담은 버튼은 "Remove"로 바뀐다.
- TC-CART-005: 차이 없음. 제거 후 1개만 남고 배지는 "1"이다. 장바구니 URL은 /cart.html 이다.
- TC-CHECKOUT-003: 차이 없음. 문구는 "Error: First Name is required" 로 일치하고, URL은 /checkout-step-one.html 에 머문다.
- TC-CHECKOUT-009: 차이 없음. 주문 확인 URL은 /checkout-step-two.html 이다. 수량은 모두 1이고 이름·가격은 목록 화면과 같다. 다만 항목 표시 순서는 상품 목록의 순서와 다를 수 있어(예: 제거 후 다시 담으면 Bike Light가 먼저, Onesie가 나중) 이름 기준으로 매칭해야 한다.
- TC-CHECKOUT-011: 차이 없음. 실제 화면은 Payment Information: SauceCard #31337 / Shipping Information: Free Pony Express Delivery! / Item total: $17.98 / Tax: $1.44 / Total: $19.42 이며 17.98+1.44=19.42 로 일치한다. CSV의 "결제 수단·배송 정보"는 영어 라벨 "Payment Information"/"Shipping Information"에 대응한다.
- TC-CHECKOUT-017: 차이 없음. 완료 URL은 /checkout-complete.html, 문구는 "Thank you for your order!" 이다. 완료 후 배지가 사라지고, /cart.html 의 상품은 0개다.

기타 참고 사항(CSV와 직접 충돌은 아님): 사이트 메뉴에 "Dynamic Catalog" 항목이 있고, 에러 문구에 "Epic sadface:"/"Error:" 접두어가 붙는다(위 기대결과에 이미 반영됨). 시드 페이지의 장바구니 버튼 접근성 이름은 "Cart, empty"이다.
