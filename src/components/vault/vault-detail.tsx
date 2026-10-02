'use client';

import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { DepositPanel } from '@/components/vault/deposit-panel';
import { EpochHistory } from '@/components/vault/epoch-history';
import { EpochPanel } from '@/components/vault/epoch-panel';
import { ApyBreakdownChart, type ApyBreakdownDatum } from '@/components/organisms/ApyBreakdownChart/ApyBreakdownChart';
import { PerformanceChart } from '@/components/organisms/PerformanceChart/PerformanceChart';
import { StrategyInfoPanel } from '@/components/organisms/StrategyInfoPanel/StrategyInfoPanel';
import { useEpochHistory } from '@/hooks/use-epoch-history';
import { useOraclePrices } from '@/hooks/use-oracle-prices';
import { usePerformance } from '@/hooks/use-performance';
import type { VaultSummary } from '@/hooks/use-vaults';
import { TOKEN_DECIMALS } from '@/lib/eque-contracts';
import { underlyingOf } from '@/lib/format';

/**
 * Per-epoch realized APY, annualized from the collected premium.
 * Only the base component is non-zero — there is no rewards/boost program,
 * so the chart shows exactly what the auctions paid, nothing invented.
 */
export function VaultApyBreakdown({ symbol, tvlUsd }: { symbol: string; tvlUsd: number }) {
  const { epochs, isLoading } = useEpochHistory(symbol, 12);
  const { prices } = useOraclePrices();
  const price = prices[underlyingOf(symbol)] ?? 0;

  const data: ApyBreakdownDatum[] = useMemo(() => {
    if (tvlUsd <= 0 || price <= 0) return [];
    return epochs
      .filter((e) => (e.premiumCollected ?? e.winningBid) !== null)
      .map((e) => {
        const premium = (e.premiumCollected ?? e.winningBid) as string;
        const duration = e.endsAt - e.startsAt;
        const premiumUsd = Number(formatUnits(BigInt(premium), TOKEN_DECIMALS)) * price;
        const base =
          duration > 0 ? (premiumUsd / tvlUsd) * ((365 * 86_400) / duration) * 100 : 0;
        return { label: `Epoch ${e.epochId}`, base, reward: 0, boost: 0 };
      })
      .reverse(); // oldest first
  }, [epochs, tvlUsd, price]);

  if (!isLoading && data.length === 0) return null;
  return <ApyBreakdownChart data={data} loading={isLoading} title="Realized APY per epoch" />;
}

/**
 * Full vault detail: deposit/withdraw, live epoch, charts, strategy info,
 * epoch history. Chain comes from context — the host page must point the
 * chain context at the vault's chain before rendering this.
 */
export function VaultDetail({ vault }: { vault: VaultSummary }) {
  const { prices } = useOraclePrices();
  const { data: perfData, isLoading: perfLoading } = usePerformance(vault.symbol);

  const tvlUsd =
    vault.tvl === null
      ? 0
      : Number(formatUnits(BigInt(vault.tvl), TOKEN_DECIMALS)) *
        (prices[underlyingOf(vault.symbol)] ?? 0);

  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <DepositPanel key={vault.symbol} symbol={vault.symbol} />
        <EpochPanel vault={vault} />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <PerformanceChart data={perfData} loading={perfLoading} title={`${vault.symbol} performance`} />
        <VaultApyBreakdown symbol={vault.symbol} tvlUsd={tvlUsd} />
      </div>

      <StrategyInfoPanel
        className="mt-8"
        strategyName="Covered-call premium + lending"
        description="Every epoch, the vault auctions a covered call on 70% of its holdings to market makers. The winning premium is added straight back into the vault — your shares capture it automatically, no claiming, no rolling. The other 30% sits in Morpho lending earning borrow interest."
        protocols={['Eque', 'Morpho']}
        compoundingSteps={[
          'Deposit and receive eVault shares (ERC-4626).',
          'Each epoch, the covered-call auction premium lands in the vault.',
          'Share price rises — your position compounds without you touching anything.',
        ]}
        riskFactors={[
          'Premium income varies per epoch — options can expire worthless.',
          'Testnet contracts are unaudited; do not deposit real funds.',
          'Epoch settlement depends on keepers and oracles staying live.',
        ]}
      />

      <EpochHistory symbol={vault.symbol} />

      <p className="font-body mx-auto mt-8 max-w-[68ch] text-[12px] leading-relaxed text-eque-muted">
        eVaults are ERC-4626. Every epoch, the vault auctions a covered-call option on its
        holdings to market makers — the winning premium is compounded straight back into the
        vault. Deposit once; every epoch&apos;s auction works for you automatically.
      </p>
    </>
  );
}
