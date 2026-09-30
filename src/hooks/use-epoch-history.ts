'use client';

import useSWR from 'swr';
import { getApi } from '@/lib/api';
import { useChain } from '@/lib/chain-context';
import type { AppChainKey } from '@/lib/chains';

async function fetchEpochHistory(chain: AppChainKey, symbol: string, limit: number) {
  const res = await getApi().api.v1.vaults[':symbol'].epochs.$get({
    param: { symbol },
    query: { chain, limit: String(limit) },
  });
  if (!res.ok) throw new Error(`epochs API returned ${res.status}`);
  // The vendored route casts through Record<string, unknown>, so re-type here.
  const json = (await res.json()) as unknown as {
    chain: string;
    symbol: string;
    epochs: EpochRow[];
  };
  return json;
}

export interface EpochRow {
  epochId: string;
  state: string;
  startsAt: number;
  auctionEndsAt: number;
  endsAt: number;
  strikePrice: string | null;
  winningBid: string | null;
  winningBidder: string | null;
  premiumCollected: string | null;
  settleTx: string | null;
}

/** Settled + live epochs for a vault, newest first. Refreshes every 10s. */
export function useEpochHistory(symbol: string | null, limit = 20) {
  const { chain } = useChain();
  const { data, error, isLoading } = useSWR(
    symbol ? ['epochs', chain, symbol, limit] : null,
    () => fetchEpochHistory(chain, symbol as string, limit),
    { refreshInterval: 10_000, revalidateOnFocus: false },
  );
  return { epochs: data?.epochs ?? [], isLoading, error };
}
