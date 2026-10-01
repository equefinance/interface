'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatUnits } from 'viem';
import { DepositPanel } from '@/components/vault/deposit-panel';
import { EpochHistory } from '@/components/vault/epoch-history';
import { EpochPanel } from '@/components/vault/epoch-panel';
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner';
import { Tabs } from '@/components/molecules/Tabs/Tabs';
import { ApyBreakdownChart, type ApyBreakdownDatum } from '@/components/organisms/ApyBreakdownChart/ApyBreakdownChart';
import { PerformanceChart } from '@/components/organisms/PerformanceChart/PerformanceChart';
import { StrategyInfoPanel } from '@/components/organisms/StrategyInfoPanel/StrategyInfoPanel';
import { useEpochHistory } from '@/hooks/use-epoch-history';
import { useOraclePrices } from '@/hooks/use-oracle-prices';
import { usePerformance } from '@/hooks/use-performance';
import { useVaults, type VaultSummary } from '@/hooks/use-vaults';
import { useChain } from '@/lib/chain-context';
import { TOKEN_DECIMALS } from '@/lib/eque-contracts';
import { underlyingOf } from '@/lib/format';

/**
 * Per-epoch realized APY, annualized from the collected premium.
 * Only the base component is non-zero — there is no rewards/boost program,
 * so the chart shows exactly what the auctions paid, nothing invented.
 */
function VaultApyBreakdown({ symbol, tvlUsd }: { symbol: string; tvlUsd: number }) {
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

function VaultDetail({ vault }: { vault: VaultSummary }) {
  const { prices } = useOraclePrices();
  const { data: perfData, isLoading: perfLoading } = usePerformance(vault.symbol);

  const tvlUsd =
    vault.tvl === null
      ? 0
      : Number(formatUnits(BigInt(vault.tvl), TOKEN_DECIMALS)) *
        (prices[underlyingOf(vault.symbol)] ?? 0);

  return (
    <>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <DepositPanel key={vault.symbol} symbol={vault.symbol} />
        <EpochPanel vault={vault} />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <PerformanceChart data={perfData} loading={perfLoading} title={`${vault.symbol} performance`} />
        <VaultApyBreakdown symbol={vault.symbol} tvlUsd={tvlUsd} />
      </div>

      <StrategyInfoPanel
        className="mt-8"
        strategyName="Covered-call premium"
        description="Every epoch, the vault auctions a covered call on its holdings to market makers. The winning premium is added straight back into the vault — your shares capture it automatically, no claiming, no rolling."
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

function VaultPageInner() {
  const { chain } = useChain();
  const { vaults, isLoading, error } = useVaults();
  const searchParams = useSearchParams();
  const requested = searchParams.get('symbol');

  const symbols = useMemo(() => vaults.map((v) => v.symbol), [vaults]);
  const [selected, setSelected] = useState<string | null>(null);

  // Follow ?symbol= when it names a real vault; otherwise the first vault.
  // Derived during render (no effect): a user-picked tab sticks while it
  // still names a real vault, and resets when the chain changes the list.
  const active =
    (selected && symbols.includes(selected) ? selected : null) ??
    (requested && symbols.includes(requested) ? requested : null) ??
    symbols[0] ??
    null;

  const vault = vaults.find((v) => v.symbol === active) ?? null;

  useEffect(() => {
    document.title = active ? `Eque - ${active}` : 'Eque';
    return () => {
      document.title = 'Eque';
    };
  }, [active]);

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-eque-hero sm:text-4xl">
        Vault
      </h1>

      {error ? (
        <div className="mt-8">
          <AlertBanner
            status="error"
            title="Couldn't reach the API"
            message="Is NEXT_PUBLIC_API_URL set and the backend running?"
          />
        </div>
      ) : isLoading || !vault ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-72 animate-pulse border border-eque-line bg-eque-surface" />
          ))}
        </div>
      ) : (
        <>
          <Tabs
            tabs={symbols.map((s) => ({ value: s, label: s }))}
            value={active ?? undefined}
            onValueChange={(v) => setSelected(v)}
            className="mt-8"
            aria-label="Vaults"
          />

          <VaultDetail key={`${chain}:${vault.symbol}`} vault={vault} />
        </>
      )}
    </>
  );
}

export default function VaultPage() {
  return (
    <Suspense>
      <VaultPageInner />
    </Suspense>
  );
}
