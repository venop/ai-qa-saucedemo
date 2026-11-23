/**
 * .env에서 읽은 환경변수를 가져온다. 값이 없으면 바로 에러를 내서
 * 계정 정보 누락을 테스트 실패 원인과 헷갈리지 않게 한다.
 * (.env 로드는 playwright.config.ts의 process.loadEnvFile에서 한다)
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수 ${name}가 .env에 설정되어 있지 않습니다.`);
  return value;
}
