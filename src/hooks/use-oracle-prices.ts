'use client';

import { getAddresses } from '@eque/sdk';
import { parseAbi, type Address } from 'viem';
import { useReadContracts } from 'wagmi';
import { useChain } from '@/lib/chain-context';
import { baseSepolia, robinhoodTestnet } from '@/lib/chains';
import { ORACLE_DECIMALS } from '@/lib/eque-contracts';

const feedAbi = parseAbi([
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
]);

/**
 * Spot USD price per underlying symbol, read straight from the onchain
 * price feeds (MockV3Aggregator, 8 decimals). Used to denominate TVL in
 * USD for display. Refreshes every 30s.
 *
 * Prices are keyed by canonical underlying symbol (META, TSLA, NVDA,
 * AAPL). The Base deployment suffixes its feed-map keys with 'c'
 * (METAc, TSLAc), so a trailing 'c' is stripped when the suffixed key
 * has no unsuffixed twin.
 */
export function useOraclePrices(): {
  prices: Record<string, number | undefined>;
  isLoading: boolean;
  isError: boolean;
} {
  const { chain } = useChain();
  const chainConfig = chain === 'base-sepolia' ? baseSepolia : robinhoodTestnet;
  const feeds = getAddresses(chain).feeds as Record<string, string>;
  const symbols = Object.keys(feeds);
  const canonical = (s: string) =>
    s.endsWith('c') && !symbols.includes(s.slice(0, -1)) ? s.slice(0, -1) : s;

  const { data, isLoading, isError } = useReadContracts({
    contracts: symbols.map(
      (s) =>
        ({
          address: feeds[s] as Address,
          abi: feedAbi,
          functionName: 'latestRoundData',
          args: [],
          // Pin reads to the browsed chain — without this wagmi falls back
          // to the connected (or first configured) chain, silently
          // mispricing every non-default chain's TVL as $0.
          chainId: chainConfig.id,
        }) as const,
    ),
    query: { refetchInterval: 30_000 },
  });

  const prices: Record<string, number | undefined> = {};
  symbols.forEach((s, i) => {
    const r = data?.[i];
    if (r && r.status === 'success') {
      const answer = (r.result as readonly [bigint, bigint, bigint, bigint, bigint])[1];
      const n = Number(answer) / 10 ** ORACLE_DECIMALS;
      if (Number.isFinite(n) && n > 0) prices[canonical(s)] = n;
    }
  });
  return { prices, isLoading, isError };
}
