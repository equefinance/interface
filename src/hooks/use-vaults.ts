'use client';

import useSWR from 'swr';
import { getApi } from '@/lib/api';
import { useChain } from '@/lib/chain-context';
import type { AppChainKey } from '@/lib/chains';

const ALL_CHAINS: AppChainKey[] = ['robinhood-testnet', 'base-sepolia'];

async function fetchVaults(chain: AppChainKey) {
  const res = await getApi().api.v1.vaults.$get({ query: { chain } });
  if (!res.ok) throw new Error(`vaults API returned ${res.status}`);
  return res.json();
}

export type VaultsResponse = Awaited<ReturnType<typeof fetchVaults>>;
export type VaultSummary = VaultsResponse['vaults'][number];

/** A vault summary tagged with the chain it came from. */
export type VaultSummaryWithChain = VaultSummary & { chainKey: AppChainKey };

/**
 * Vault summaries (TVL, APY, active epoch) for the currently selected chain.
 * Refreshes every 15s — TVL/APY move slowly, epochs don't.
 */
export function useVaults() {
  const { chain } = useChain();
  const { data, error, isLoading, mutate } = useSWR(['vaults', chain], () => fetchVaults(chain), {
    refreshInterval: 15_000,
    revalidateOnFocus: false,
  });
  return { vaults: data?.vaults ?? [], isLoading, error, mutate };
}

/**
 * Vault summaries across every supported chain, each tagged with its
 * `chainKey`. One chain failing doesn't take down the other — a dead
 * chain contributes zero vaults instead of erroring the whole list.
 */
export function useAllVaults() {
  const { data, error, isLoading, mutate } = useSWR(
    ['vaults', 'all'],
    async (): Promise<VaultSummaryWithChain[]> => {
      const results = await Promise.allSettled(ALL_CHAINS.map(fetchVaults));
      return results.flatMap((result, i) =>
        result.status === 'fulfilled'
          ? result.value.vaults.map((v) => ({ ...v, chainKey: ALL_CHAINS[i] }))
          : [],
      );
    },
    {
      refreshInterval: 15_000,
      revalidateOnFocus: false,
    },
  );
  return { vaults: data ?? [], isLoading, error, mutate };
}
