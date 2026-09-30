/**
 * Token descriptor shared by eque-ui registry components (TokenAmountInput,
 * DepositWithdrawPanel). Mirrors the kit's `Token` interface; the list here
 * carries Eque's real underlying assets instead of the kit's storybook mocks.
 */
export interface Token {
  symbol: string;
  name: string;
  decimals: number;
}

export const equeTokens: Token[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', decimals: 18 },
  { symbol: 'AAPL', name: 'Apple Inc.', decimals: 18 },
  { symbol: 'META', name: 'Meta Platforms', decimals: 18 },
  { symbol: 'TSLA', name: 'Tesla Inc.', decimals: 18 },
];

export function tokenOf(symbol: string): Token {
  const found = equeTokens.find((t) => t.symbol === symbol.toUpperCase());
  return found ?? { symbol, name: symbol, decimals: 18 };
}
