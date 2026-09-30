'use client';

import useSWR from 'swr';
import { getApi } from '@/lib/api';
import { useChain } from '@/lib/chain-context';
import type { AppChainKey } from '@/lib/chains';

async function fetchVaults(chain: AppChainKey) {
  const res = await getApi().api.v1.vaults.$get({ query: { chain } });
  if (!res.ok) throw new Error(`vaults API returned ${res.status}`);
  return res.json();
}

export type VaultsResponse = Awaited<ReturnType<typeof fetchVaults>>;
export type VaultSummary = VaultsResponse['vaults'][number];

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
