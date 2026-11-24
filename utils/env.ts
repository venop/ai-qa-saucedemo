/**
 * 환경변수를 가져온다. 값이 없으면 바로 에러를 내서
 * 계정 정보 누락을 테스트 실패 원인과 헷갈리지 않게 한다.
 * - 로컬: playwright.config.ts의 process.loadEnvFile이 .env를 읽어 넣는다
 * - CI(GitHub Actions): 워크플로가 GitHub Secrets 값을 환경변수로 넘긴다
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경변수 ${name}가 설정되어 있지 않습니다. 로컬은 .env, CI는 GitHub Secrets를 확인하세요.`);
  }
  return value;
}
