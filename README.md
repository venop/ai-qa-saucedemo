# ai-qa-saucedemo

[![Playwright Tests](https://github.com/venop/ai-qa-saucedemo/actions/workflows/playwright.yml/badge.svg)](https://github.com/venop/ai-qa-saucedemo/actions/workflows/playwright.yml)

## 1. 개요

- 테스트 전용 데모 쇼핑몰 [Sauce Demo](https://www.saucedemo.com)를 대상으로 QA 전 과정을 수행한 프로젝트입니다.
- Claude Code와 Playwright Test Agents(planner / generator / healer)를 썼고, 단계마다 QA가 결과를 검토해 승인하거나 고쳤습니다.
- 진행 순서는 **요구사항 → TC → 자동화 → 실행 → 버그 리포트 → CI**입니다.

## 2. 파이프라인 흐름

| 단계 | 하는 일 | 산출물 |
|---|---|---|
| 요구사항 | 기능 요구사항 정리, 모호한 점을 확인 필요(Q)로 남기고 결정 사항(D)으로 확정 | [docs/requirements.md](docs/requirements.md) |
| TC | 요구사항별 테스트 케이스 작성, 현재 동작과 다른 점은 비고에 기록 | [tc/testcases.csv](tc/testcases.csv) |
| 테스트 플랜 | 자동화할 TC의 시나리오·검증 방식 설계 (Planner) | [specs/p1-plan.md](specs/p1-plan.md) |
| 자동화 | TypeScript + Page Object로 테스트 구현 (Generator) | [tests/](tests/), [pages/](pages/) |
| 실행 | Chromium / Firefox / WebKit 3종 실행, 실패 원인 분석 (Healer) | HTML 리포트, `test-results/results.json` |
| 버그 리포트 | 제품 결함으로 판단한 실패만 리포트로 작성, 결함 아닌 현상은 관찰 사항으로 분리 | [reports/bugs/](reports/bugs/) |
| CI | push / PR마다 타입 검사 + 3종 브라우저 테스트, 리포트를 결과물로 보관 | [.github/workflows/](.github/workflows/) |

## 3. 수치

저장소 파일에서 직접 센 값입니다 (2026-11-24 기준).

| 항목 | 수 | 근거 |
|---|---|---|
| 요구사항(REQ) | 20 | 로그인 4, 상품 목록 6, 장바구니 3, 결제 7 ([requirements.md](docs/requirements.md)) |
| 결정 사항(D) | 13 | D-01 ~ D-13 |
| 확인 필요(Q) | 11 | Q-01 ~ Q-11 (일부는 결정 사항으로 해소) |
| TC | 89 | 로그인 17, 상품 목록 21, 장바구니 18, 결제 33 / P1 29, P2 46, P3 14 |
| 자동화 대상 TC | 80 | CSV의 "자동화 대상" = Y |
| 자동화한 TC | 18 | 로그인 4, 목록 2, 장바구니 2, 결제 10 (환경 확인용 seed 테스트 1건 별도) |
| 테스트 실행 수 | 57 | 테스트 19건 × 브라우저 3종 → 통과 39, 예상된 실패 18 (알려진 결함 6건 × 3종) |
| 발견한 결함 | 3 | Major 2, Minor 1 (아래 표) |
| 관찰 사항 | 1 | OBS-001 ([observations.md](reports/bugs/observations.md)) |

| 결함 | 내용 | 심각도 | 관련 TC |
|---|---|---|---|
| [BUG-001](reports/bugs/BUG-001.md) | 주문 완료 후 뒤로가기로 빈 주문($0)을 다시 완료할 수 있음 | Major | TC-CHECKOUT-018, 033 |
| [BUG-002](reports/bugs/BUG-002.md) | 주문 확인 화면 [Cancel] 시 정보 입력 화면이 아닌 상품 목록으로 이동 | Minor | TC-CHECKOUT-022 |
| [BUG-003](reports/bugs/BUG-003.md) | 입력 필드(First Name, Last Name, Zip)에 공백만 입력해도 검증 통과 | Major | TC-CHECKOUT-025, 029, 030 |

결함 때문에 실패하는 테스트는 `test.fail()`과 버그 번호 annotation으로 표시해 두었습니다. 그래서 CI는 통과 상태를 유지하고, 결함이 고쳐져 테스트가 통과하면 바로 드러납니다.

## 4. QA 검토 관문

AI가 만든 결과물은 아래 4곳에서 QA가 확인한 뒤에만 다음 단계로 넘어갑니다.

| 관문 | 시점 | 확인하는 것 |
|---|---|---|
| 1. 플랜 승인 | Planner가 테스트 플랜을 만든 뒤 | 기대결과가 TC와 같은지, 고정값 대신 화면 값으로 검증하는지, 미정 사항(Q)을 단정하지 않는지 |
| 2. 코드 리뷰 | Generator가 테스트 코드를 만든 뒤 | 프로젝트 규칙(로케이터 우선순위, 고정 대기 금지, 계정 정보 .env 분리), 플랜의 검증이 빠짐없이 코드에 들어갔는지 |
| 3. Healer diff 확인 | Healer가 실패 테스트를 고친 뒤 | 기대값을 실제 동작에 맞춰 바꿔 결함을 가리지 않았는지, 바뀐 줄이 원인과 맞는지 (`git diff`로 확인) |
| 4. 버그 등록 전 수동 재현 | 버그 리포트를 등록하기 전 | 자동화 결과만으로 등록하지 않고 브라우저에서 직접 재현 (BUG-001, BUG-003은 Chrome에서 재현) |

## 5. AI가 틀렸고 QA가 바로잡은 사례

| 단계 | AI 결과 | QA 수정 |
|---|---|---|
| TC 리뷰 | 주문 확인 화면의 배송 정보에 입력한 이름·우편번호가 나온다고 추정 | 실제로는 고정 문구 "Free Pony Express Delivery!"만 표시됨. 실제 동작 기준으로 D-10과 TC-CHECKOUT-028을 수정 |
| TC 리뷰 | TC-CHECKOUT-018에 화면에서 확인할 수 없는 기대결과를 씀 | 화면에서 관찰할 수 있는 결과로 바꿈. 이후 D-11(완료 화면 재표시)과 D-10(금액 표시)으로 나눠 TC-CHECKOUT-018, 033으로 분리 |
| 플랜 | 상품명·가격·금액을 고정값과 비교 | 화면에서 읽은 값으로 정렬·합계를 계산해 검증 (상품 구성이 바뀌어도 깨지지 않게) |
| 플랜 | 세율이 정해지지 않았는데(Q-01) Tax 값을 고정값으로 검증 | Tax 값은 단정하지 않고 `Total = Item total + Tax` 계산 검증으로 변경 |
| 코드 | 사이트 주소를 코드에 직접 써서 검증 | 주소 전체 대신 경로만 검증(예: `toHaveURL(/\/inventory\.html$/)`). `playwright.config.ts`의 `baseURL`만 바꾸면 다른 환경에서도 동작함 |
| 코드 | 로케일을 지정하지 않고 문자열 정렬 | `localeCompare(a, 'en')`으로 로케일을 고정해 실행 환경에 따라 결과가 달라지지 않게 함 |
| 코드 | 플랜에 있던 수량 검증(각 상품 수량 "1")이 코드에서 빠짐 | 코드에 추가 (TC-CART-005) |
| 버그 리포트 | BUG-001 초안이 금액 표시 형식(`Item total: $0`)에만 집중 | 수동 재현에서 "뒤로가기 후 빈 주문을 다시 완료할 수 있다"는 핵심 결함을 발견. TC를 018(D-11 재완료)과 033(D-10 금액 형식)으로 나눔. 018은 "완료 화면이 다시 나오지 않는다"를 확인하는 부정 검증이라 한계가 있어, 기대 동작 정의를 요청함(Q-11) |

## 6. AI가 잘한 것

- **기대값을 실제 동작에 맞추지 않음:** 플랜 작성 중 사이트를 확인하면서 TC와 다른 점은 따로 기록만 했습니다. 시나리오의 기대결과는 바꾸지 않았습니다([p1-plan.md](specs/p1-plan.md)의 "CSV와 실제 화면의 차이").
- **원칙을 알려주자 스스로 적용:** "고정값 대신 화면 값으로 검증한다"는 원칙을 알려주자, 지적하지 않은 TC-CHECKOUT-009의 고정 가격까지 스스로 찾아 고쳤습니다. 지금은 목록 화면에서 읽은 가격과 비교합니다.
- **헛통과 함정을 막음:** 정렬 검증은 "화면 값 == 화면 값을 정렬한 값"으로 비교합니다. 이렇게 하면 상품을 하나도 못 읽었을 때 빈 배열끼리 비교해 통과해 버립니다. 그래서 `toHaveLength(6)`을 먼저 확인하도록 했습니다(TC-LIST-012, 013).
- **리팩터링 동등성 확인:** Page Object와 fixture로 리팩터링할 때 전후 테스트의 검증 항목(matcher, 기대값, 순서)을 스크립트로 비교했습니다. 검증 내용이 바뀌지 않은 것을 확인한 뒤 반영했습니다.
- **실패 원인 판단에 근거를 붙임:** 공백 입력 TC 3건이 실패했을 때 바로 결함으로 단정하지 않았습니다. 먼저 `toHaveValue('   ')`로 입력이 실제로 들어갔는지 확인해 테스트 문제를 배제했고, 그다음 D-08과 CSV 비고를 인용해 결함으로 분류했습니다.
- **세 브라우저 결과를 교차 확인:** `results.json`을 읽어 실패 5개 TC가 세 브라우저 모두에서 같은 assertion에서 실패하는 것을 확인했습니다. 그래서 브라우저 특이 현상이 아니라 제품 동작이라고 판단했습니다.
- **flaky를 결함과 구분:** webkit에서만 가끔 입력값이 사라지는 현상을 결함으로 올리지 않고 관찰 사항(OBS-001)으로 분리했습니다. 고정 대기 없이 재시도하면서, 재시도할 때마다 그 횟수를 리포트에 기록했습니다(8번 참고).
- **위험한 변경 전에 멈춤:** 새 TC의 ID가 기존 TC-CHECKOUT-031과 겹치는 것을 먼저 발견해 QA에게 결정을 요청했습니다.
- **push 전 점검:** 커밋 기록에서 비밀번호 평문을 찾아 QA에게 처리 방법을 물었습니다. CI 설정을 push하기 전에는 `.env`가 없는 CI 조건을 로컬에서 재현해 확인했습니다. 저장소 복사본에서 환경변수만으로 전체 57건을 실행했고, Secrets가 빠졌을 때 나오는 에러 문구도 확인했습니다.

## 7. Healer 실습 결과

Healer(playwright-test-healer)에게 "테스트 코드 문제면 고치고, 제품 동작이 요구사항과 다르면 고치지 말고 근거와 함께 보고"하라고 맡겨 두 경우를 확인했습니다.

| 실습 | 상황 | Healer 판단 | 근거 | 결과 |
|---|---|---|---|---|
| 1. 테스트 코드 문제 | Page Object의 Checkout 버튼 로케이터를 일부러 `checkout-btn`으로 바꿔 결제 TC 4건이 타임아웃으로 실패 | 테스트 코드 문제 | 실패 시점 스냅샷에 Checkout 버튼이 보임, 플랜의 data-test 목록은 `checkout` | 로케이터를 `checkout`으로 수정해 chromium 13건 모두 통과. QA가 `git diff`로 확인했더니 커밋된 원래 코드와 같아짐(바꾼 부분만 되돌림) |
| 2. 제품 결함 | TC-CHECKOUT-025 (Zip에 공백만 입력) 실패 | 제품 동작 문제 | 입력값은 정상 반영, [Continue] 후 에러 없이 주문 확인 화면으로 이동, 요구사항 D-08과 불일치 | 아무것도 고치지 않음. QA가 `git diff`가 비어 있는 것을 확인 |

두 경우 모두 Healer의 보고만 믿지 않고 `git diff`로 실제 변경을 확인했습니다(4번 관문 3).

## 8. flaky 대응

자세한 기록은 [OBS-001](reports/bugs/observations.md)에 있습니다.

- **현상:** 정보 입력 화면에 들어간 직후 값을 입력하면 먼저 입력한 값이 가끔 지워집니다. webkit에서 병렬 실행할 때만 나타났고, 처음에는 16회 중 2회 실패했습니다.
- **판단:** 제품 결함이 아니라 테스트 쪽 타이밍 문제로 봤습니다. 단독 실행하면 5회 모두 통과했고, chromium과 firefox에서는 나오지 않았으며, 사람이 입력하는 속도로는 재현되지 않았습니다.
- **처리:**
  - `CheckoutPage.fillInfo()`에서 입력값이 반영됐는지 확인하고, 다르면 다시 입력합니다. 재시도는 고정 대기 없이 `expect(...).toPass()`로 합니다.
  - 테스트의 검증 내용은 바꾸지 않았습니다.
  - 다시 입력할 때마다 annotation `입력값 재입력 발생`을 남겨 HTML 리포트에서 빈도를 볼 수 있게 했습니다.
- **처리 후:** webkit 병렬 96회 실행에서 모두 통과했고, 그중 7회(약 7%)는 한 번 다시 입력한 뒤 통과했습니다.

## 9. 실행 방법

```bash
# 1) 의존성과 브라우저 설치
npm ci
npx playwright install --with-deps

# 2) 계정 정보 설정: .env.example을 복사해 값을 채운다
#    (Sauce Demo 로그인 화면에 공개된 테스트 계정)
cp .env.example .env

# 3) 타입 검사
npm run typecheck

# 4) 테스트 실행
npx playwright test                          # 3종 브라우저 전체
npx playwright test --project=chromium       # 브라우저 하나만
npx playwright test -g "TC-CHECKOUT-025"     # TC ID로 골라 실행

# 5) 결과 보기
npx playwright show-report                   # HTML 리포트
```

- 실행할 때마다 터미널 출력(list), HTML 리포트(`playwright-report/`), JSON 결과(`test-results/results.json`)가 함께 만들어집니다.
- 실패한 테스트는 스크린샷과 trace를 `test-results/`에 남깁니다.
- **CI:** [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)이 push와 PR마다 타입 검사와 3종 브라우저 테스트를 실행합니다.
  - 계정 정보는 GitHub Secrets의 `SAUCE_USERNAME`, `SAUCE_PASSWORD`에서 받습니다.
  - 테스트가 실패해도 `playwright-report`와 `test-results`를 Actions 결과물로 30일 보관합니다.

## 10. 한계와 다음 단계

**한계**
- **자동화 범위:** 자동화 대상 80개 TC 중 18개만 자동화했습니다. 남은 62개는 P1 15개, P2 43개, P3 4개입니다.
- **미정 사항:** 확인 필요 11건 중 Q-07만 결정 사항(D-13)으로 끝났습니다. Q-02는 일부만 결정됐습니다(공백 입력은 D-08, 숫자가 아닌 값은 미정). 세율(Q-01), 빈 장바구니 결제(Q-03), 완료 후 뒤로가기의 기대 동작(Q-11) 등은 아직 기획 확인이 필요합니다.
- **TC-CHECKOUT-018의 부정 검증:** "완료 화면이 다시 나오지 않는다"는 검증은 화면 전환 전에 확인하면 결함이 있어도 통과할 수 있습니다. 지금은 결함이 실제로 잡히는 것까지 확인했지만, 결함이 고쳐진 뒤 통과하면 다시 확인해야 합니다.
- **원인은 추정:**
  - BUG-003(공백 입력 통과)과 OBS-001(입력값 사라짐)의 원인은 화면 동작만 보고 추정했습니다. 제품 코드는 분석하지 않았습니다.
  - OBS-001은 실제 Safari에서 사람이 입력할 때 재현되는지 확인하지 않았습니다.
- **범위 제외:**
  - 계정은 standard_user와 locked_out_user만 썼습니다(D-12).
  - 모바일 화면 크기와 브랜드 브라우저(Chrome, Edge)는 실행하지 않았습니다.

**다음 단계**
1. Q-11이 정해지면 TC-CHECKOUT-018을 긍정 검증(예: 상품 목록으로 이동, [Finish] 비활성)으로 바꿉니다.
2. 남은 자동화 대상 TC를 P1 15개부터 자동화합니다.
3. 결함이 고쳐지면 `test.fail()` 때문에 해당 테스트가 실패로 표시되어 바로 알 수 있습니다. 그때 수정을 확인하고 `test.fail()`을 지웁니다.
4. CI의 `입력값 재입력 발생` annotation 빈도를 계속 보면서 OBS-001이 제품 결함인지 다시 판단합니다.
