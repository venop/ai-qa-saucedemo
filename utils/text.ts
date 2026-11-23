/** 문자열과 정확히 일치하는 정규식 (Playwright hasText에 문자열을 주면 부분 일치라서 사용) */
export function exactText(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

/** "$12.34", "Item total: $12.34" 같은 텍스트의 금액을 센트 단위 정수로 바꾼다 (부동소수 오차 방지) */
export function toCents(text: string): number {
  const match = text.match(/\$(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`금액을 파싱할 수 없습니다: "${text}"`);
  }
  return Math.round(Number(match[1]) * 100);
}
