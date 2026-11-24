# Sauce Demo 요구사항



## REQ-LOGIN 로그인

- REQ-LOGIN-01 유효한 계정으로 로그인하면 상품 목록(/inventory.html)으로 이동한다

- REQ-LOGIN-02 아이디 또는 비밀번호가 틀리면 에러 메시지를 표시하고 이동하지 않는다

- REQ-LOGIN-03 잠긴 계정(locked_out_user)은 잠금 안내 메시지를 표시한다

- REQ-LOGIN-04 로그인하지 않고 내부 URL에 접근하면 로그인 화면으로 돌아간다



## REQ-LIST 상품 목록

- REQ-LIST-01 상품 6개가 노출돼야 한다

- REQ-LIST-02 기본 정렬은 Name (A to Z)이며, 상품 이름의 알파벳 순으로 노출돼야 한다

- REQ-LIST-03 한 상품당 상품 이미지, 상품 이름, 설명, 가격, [Add to cart] 버튼이 노출돼야 한다

- REQ-LIST-04 [Add to cart] 버튼 선택 시 해당 상품의 버튼이 [Remove]로 바뀌어야 한다

- REQ-LIST-05 우측 상단 드롭다운의 정렬 옵션은 Name (A to Z), Name (Z to A), Price (low to high), Price (high to low) 4가지이며, 선택한 기준에 따라 상품 순서가 바뀌어야 한다



## REQ-CART 장바구니

- REQ-CART-01 상품을 담으면 상단 장바구니 배지 숫자가 1 증가한다

- REQ-CART-02 장바구니에서 상품을 제거하면 목록과 배지에서 모두 빠진다

- REQ-CART-03 담은 상품은 페이지를 이동해도 유지된다



## REQ-CHECKOUT 결제

- REQ-CHECKOUT-01 장바구니에서 [Checkout] 선택 시 정보 입력 화면으로 이동하며, First Name, Last Name, Zip/Postal Code 입력 필드가 노출돼야 한다

- REQ-CHECKOUT-02 필수 정보를 비운 채 [Continue] 선택 시 비어 있는 항목의 에러 메시지를 표시하고 다음 단계로 이동하지 않는다 (예: "Error: First Name is required", 여러 개가 비면 위 항목부터 하나씩 표시)

- REQ-CHECKOUT-03 정보를 모두 입력하고 [Continue] 선택 시 주문 확인 화면으로 이동하며, 담은 상품 목록(수량, 이름, 가격)이 노출돼야 한다

- REQ-CHECKOUT-04 주문 확인 화면에 결제 수단, 배송 정보, 상품 합계(Item total), 세금(Tax), 총액(Total)이 노출되며, 총액 = 상품 합계 + 세금이어야 한다

- REQ-CHECKOUT-05 [Finish] 선택 시 주문 완료 화면("Thank you for your order!")이 노출되고, 장바구니가 비워지며 배지가 사라져야 한다

- REQ-CHECKOUT-06 완료 화면에서 [Back Home] 선택 시 상품 목록으로 돌아간다

- REQ-CHECKOUT-07 정보 입력 화면과 주문 확인 화면에서 [Cancel] 선택 시 이전 화면으로 돌아가며, 장바구니 내용은 유지된다



## 확인 필요

- Q-01 세금 계산 기준: 상품 합계의 몇 %인지 기획에 명시되어 있지 않음 (화면상 약 8%로 보이는지 확인), 소수점 처리 방식(반올림/버림)도 확인 필요

- Q-02 우편번호 형식 검증: 숫자가 아닌 값이나 공백만 입력해도 통과되는지, 의도된 동작인지 (공백만 입력은 D-08로 결정, 숫자가 아닌 값만 미정)

- Q-03 빈 장바구니 결제: 상품이 없어도 [Checkout]으로 진행해 주문 완료까지 가능한지, 막아야 하는지

- Q-04 수량 변경: 장바구니에서 수량을 바꿀 수 없는데 의도된 것인지 (같은 상품은 1개만 담김)

- Q-05 로그아웃 후 장바구니: 로그아웃했다가 다시 로그인하면 장바구니가 유지되는지, 비워지는지

- Q-06 결제 수단과 배송 방법: 고정값으로만 표시되고 선택할 수 없는데, 범위 밖 기능으로 봐도 되는지

- Q-07 상품 상세 페이지: 상품 이름이나 이미지를 누르면 상세 화면으로 가는데, 이번 테스트 범위에 넣을지 → 범위에 포함하기로 결정 (D-13, REQ-LIST-06)

- Q-08 정보 입력 화면 입력값 유지: [Cancel] 후 다시 [Checkout]으로 들어왔을 때 입력값이 유지돼야 하는지 (현재 동작: 세 필드 모두 비워짐)

- Q-09 존재하지 않는 상품 상세: /inventory-item.html?id=99처럼 없는 상품에 접근하면 "ITEM NOT FOUND"와 함께 가격 "$√-1", [Add to cart] 버튼이 노출되는데 의도된 것인지

- Q-10 주문 완료 화면의 [Generate PDF order] 버튼: 요구사항에 없는 기능. 범위 포함 여부 확인 필요

- Q-11 D-11 기대 동작 정의 필요: 주문 완료 후 뒤로가기 시 어떻게 동작해야 하는지(상품 목록 이동 / Finish 비활성 / 안내 표시 등). 정해지면 TC-CHECKOUT-018을 긍정 검증으로 바꾼다.



## 결정 사항 (2026-11-23)

요구사항 검토 중 모호했던 부분에 대한 결정. TC(tc/testcases.csv)는 이 결정을 기준으로 작성한다.

- D-01 [REQ-LOGIN-02, 03, 04] 로그인 화면의 에러 문구는 실제 서비스 문구를 기준으로 검증한다 (예: "Epic sadface: Username and password do not match any user in this service", "Epic sadface: Username is required", "Epic sadface: Password is required", "Epic sadface: Sorry, this user has been locked out.")

- D-02 [REQ-LOGIN-03] 잠긴 계정(locked_out_user)에 틀린 비밀번호를 입력하면 잠금 안내가 아닌 아이디/비밀번호 불일치 메시지를 표시한다

- D-03 [REQ-LOGIN-04] "내부 URL"에는 상품 목록, 장바구니, 결제 3단계, 상품 상세(/inventory-item.html)가 포함되며, 로그인 화면으로 돌아갈 때 "Epic sadface: You can only access '<경로>' when you are logged in." 메시지를 표시한다

- D-04 [REQ-LIST-02] 정렬을 바꾼 뒤 다른 화면에 다녀오면 정렬은 기본값 Name (A to Z)로 돌아간다

- D-05 [REQ-LIST-05] 가격 정렬에서 가격이 같은 상품끼리는 이름 오름차순(A to Z)으로 노출한다

- D-06 [REQ-CART-01] 상품 목록에서 [Remove] 선택 시 배지가 1 감소하고, 0개가 되면 배지가 사라진다. 상품 상세 화면에서 담기/빼기도 범위에 포함한다

- D-07 [REQ-CART-03] "페이지 이동"에는 새로고침, 새 탭, 브라우저 재시작이 포함되며, 이 경우에도 장바구니는 유지돼야 한다

- D-08 [REQ-CHECKOUT-02] First Name, Last Name, Zip/Postal Code에 공백만 입력한 경우 빈 값으로 처리한다

- D-09 [REQ-CHECKOUT-07] [Cancel] 선택 시 "이전 화면"은 바로 직전 페이지를 뜻한다 (정보 입력 화면 → 장바구니, 주문 확인 화면 → 정보 입력 화면)

- D-10 [REQ-CHECKOUT-04, REQ-LIST-03] 모든 금액(상품 가격, Item total, Tax, Total)은 소수점 둘째 자리까지 표시한다. 배송 정보(Shipping Information)는 고정 문구 "Free Pony Express Delivery!"가 표시되면 "노출"로 본다 (입력값은 표시되지 않는 것이 실제 동작, 2026-11-23 리뷰에서 실제 동작 기준으로 수정)

- D-11 [REQ-CHECKOUT-05] 주문 완료 후 뒤로가기 등으로 [Finish]를 다시 눌러도 주문이 중복되면 안 된다

- D-12 [전체] 테스트 계정은 standard_user, locked_out_user만 사용하고 다른 계정(problem_user 등)은 범위에서 제외한다

- D-13 [REQ-LIST-06 (신규)] 상품 상세 페이지를 테스트 범위에 포함한다



### 신규 요구사항

- REQ-LIST-06 상품 이름 또는 이미지를 선택하면 해당 상품의 상세 화면으로 이동하며, 목록과 같은 이름·설명·가격·이미지와 [Add to cart], [Back to products] 버튼이 노출된다. [Back to products] 선택 시 상품 목록으로 돌아간다

