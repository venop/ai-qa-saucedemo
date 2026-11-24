# 프로젝트 규칙
- 대상: https://www.saucedemo.com (운영 서비스 아님, 테스트 전용)
- 테스트 코드는 TypeScript, Page Object 패턴(pages/)을 사용한다
- 로케이터 우선순위: data-test 속성 > getByRole > getByText. CSS/XPath는 최후 수단
- 테스트 이름에 TC ID를 붙인다: test('[TC-LOGIN-001] ...')
- waitForTimeout 같은 고정 대기 금지, expect의 자동 대기를 쓴다
- 계정 정보는 .env에서 읽고 코드에 직접 쓰지 않는다
- 테스트가 실패하면 우선 제품 버그인지 테스트 문제인지 판단해 보고한다. 판단 없이 assertion을 고치지 않는다
- 모든 답변은 한국어로 한다
