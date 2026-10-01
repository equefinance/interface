'use client';

import useSWR from 'swr';
import { formatUnits } from 'viem';
import type { PerformanceDatum } from '@/components/organisms/PerformanceChart/PerformanceChart';
import { getApi } from '@/lib/api';
import { useChain } from '@/lib/chain-context';
import type { AppChainKey } from '@/lib/chains';
import { ORACLE_DECIMALS, TOKEN_DECIMALS } from '@/lib/eque-contracts';
import { underlyingOf } from '@/lib/format';

interface SnapshotRow {
  timestamp: number;
  totalAssets: string;
  sharePrice: string;
}

interface PriceRow {
  timestamp: number;
  price: string;
}

async function fetchPerformance(
  chain: AppChainKey,
  symbol: string,
): Promise<PerformanceDatum[]> {
  const api = getApi();
  const [snapRes, priceRes] = await Promise.all([
    api.api.v1.vaults[':symbol'].snapshots.$get({
      param: { symbol },
      query: { chain, range: 'all' },
    }),
    api.api.v1.prices[':symbol'].$get({
      param: { symbol: underlyingOf(symbol) },
      query: { chain, range: 'all' },
    }),
  ]);
  if (!snapRes.ok) throw new Error(`snapshots API returned ${snapRes.status}`);
  if (!priceRes.ok) throw new Error(`prices API returned ${priceRes.status}`);
  const snaps = ((await snapRes.json()) as unknown as { snapshots: SnapshotRow[] }).snapshots;
  const priceRows = ((await priceRes.json()) as unknown as { prices: PriceRow[] }).prices;

  const sorted = [...snaps].sort((a, b) => a.timestamp - b.timestamp);
  const priceAsc = [...priceRows].sort((a, b) => a.timestamp - b.timestamp);

  // Nearest oracle price at or before the snapshot time.
  const priceAt = (t: number): number => {
    let best: PriceRow | undefined;
    for (const p of priceAsc) {
      if (p.timestamp <= t) best = p;
      else break;
    }
    const row = best ?? priceAsc[priceAsc.length - 1];
    return row ? Number(formatUnits(BigInt(row.price), ORACLE_DECIMALS)) : 0;
  };

  // Rolling APY from share-price movement over the trailing ~24h.
  const apyAt = (i: number): number => {
    const cur = sorted[i];
    let prev: SnapshotRow | undefined;
    for (let j = i - 1; j >= 0; j--) {
      if (sorted[j].timestamp <= cur.timestamp - 86_400) {
        prev = sorted[j];
        break;
      }
    }
    if (!prev) return 0;
    const curSp = Number(cur.sharePrice);
    const prevSp = Number(prev.sharePrice);
    const dt = cur.timestamp - prev.timestamp;
    if (prevSp <= 0 || dt <= 0) return 0;
    return (curSp / prevSp - 1) * ((365 * 86_400) / dt) * 100;
  };

  return sorted.map((s, i) => {
    const price = priceAt(s.timestamp);
    return {
      timestamp: s.timestamp * 1000,
      tvl: Number(formatUnits(BigInt(s.totalAssets), TOKEN_DECIMALS)) * price,
      price,
      apy: apyAt(i),
    };
  });
}

/**
 * Vault performance history for PerformanceChart: TVL (snapshots × oracle
 * price), spot price, and rolling share-price APY. Refreshes every 30s.
 */
export function usePerformance(symbol: string | null) {
  const { chain } = useChain();
  const { data, error, isLoading } = useSWR(
    symbol ? ['performance', chain, symbol] : null,
    () => fetchPerformance(chain, symbol as string),
    { refreshInterval: 30_000, revalidateOnFocus: false },
  );
  return { data: data ?? [], isLoading, error };
}
