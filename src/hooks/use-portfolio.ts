'use client';

import useSWR from 'swr';
import { useAccount } from 'wagmi';
import { getApi } from '@/lib/api';
import { useChain } from '@/lib/chain-context';
import type { AppChainKey } from '@/lib/chains';

async function fetchPortfolio(address: string, chain: AppChainKey) {
  const res = await getApi().api.v1.portfolio[':address'].$get({
    param: { address },
    query: { chain },
  });
  if (!res.ok) throw new Error(`portfolio API returned ${res.status}`);
  return res.json();
}

export type PortfolioResponse = Awaited<ReturnType<typeof fetchPortfolio>>;
export type PortfolioPosition = PortfolioResponse['portfolios'][number]['positions'][number];

/**
 * Connected wallet's positions on the currently selected chain.
 * Only fetches when a wallet is connected. Refreshes every 15s.
 */
export function usePortfolio() {
  const { chain } = useChain();
  const { address, isConnected } = useAccount();
  const { data, error, isLoading } = useSWR(
    isConnected && address ? ['portfolio', chain, address] : null,
    () => fetchPortfolio(address as string, chain),
    { refreshInterval: 15_000, revalidateOnFocus: false },
  );
  const portfolio = data?.portfolios.find((p) => p.chain === chain);
  return {
    positions: portfolio?.positions ?? [],
    isLoading: isConnected && isLoading,
    error,
    isConnected,
  };
}
