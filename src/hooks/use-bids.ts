'use client';

import useSWR from 'swr';
import { getApi } from '@/lib/api';
import { useChain } from '@/lib/chain-context';
import type { AppChainKey } from '@/lib/chains';

export interface BidRow {
  epochId: string;
  bidder: string;
  amount: string;
  timestamp: number;
}

async function fetchBids(chain: AppChainKey, symbol: string, epoch: string | null) {
  const res = await getApi().api.v1.vaults[':symbol'].bids.$get({
    param: { symbol },
    query: { chain, limit: '50', ...(epoch ? { epoch } : {}) },
  });
  if (!res.ok) throw new Error(`bids API returned ${res.status}`);
  const json = (await res.json()) as unknown as { bids: BidRow[] };
  return json.bids;
}

/** Live bid feed for a vault epoch. Refreshes every 5s during the auction. */
export function useBids(symbol: string | null, epoch: string | null) {
  const { chain } = useChain();
  const { data, error, isLoading } = useSWR(
    symbol ? ['bids', chain, symbol, epoch] : null,
    () => fetchBids(chain, symbol as string, epoch),
    { refreshInterval: 5_000, revalidateOnFocus: false },
  );
  return { bids: data ?? [], isLoading, error };
}
