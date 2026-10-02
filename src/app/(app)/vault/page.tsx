'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatUnits } from 'viem';
import { Breadcrumb } from '@/components/breadcrumb';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DepositPanel } from '@/components/vault/deposit-panel';
import { EpochHistory } from '@/components/vault/epoch-history';
import { EpochPanel } from '@/components/vault/epoch-panel';
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner';
import { ApyBreakdownChart, type ApyBreakdownDatum } from '@/components/organisms/ApyBreakdownChart/ApyBreakdownChart';
import { PerformanceChart } from '@/components/organisms/PerformanceChart/PerformanceChart';
import { StrategyInfoPanel } from '@/components/organisms/StrategyInfoPanel/StrategyInfoPanel';
import { VaultListGrid } from '@/components/organisms/VaultListGrid/VaultListGrid';
import { type VaultCardData } from '@/components/organisms/VaultCard/VaultCard';
import { useEpochHistory } from '@/hooks/use-epoch-history';
import { useOraclePrices } from '@/hooks/use-oracle-prices';
import { usePerformance } from '@/hooks/use-performance';
import { useAllVaults, type VaultSummary, type VaultSummaryWithChain } from '@/hooks/use-vaults';
import { useChain } from '@/lib/chain-context';
import { CHAIN_META, type AppChainKey } from '@/lib/chains';
import { TOKEN_DECIMALS } from '@/lib/eque-contracts';
import { underlyingOf } from '@/lib/format';

/** Token artwork shipped in `public/assets/tokens/`. */
const TOKEN_ICON_SRC: Record<string, string> = {
  NVDA: '/assets/tokens/nvda.webp',
  AAPL: '/assets/tokens/aapl.webp',
  TSLA: '/assets/tokens/tsla.webp',
  META: '/assets/tokens/meta.webp',
};

const CHAIN_ICON_SRC: Record<AppChainKey, string> = {
  'robinhood-testnet': '/assets/robinhood-logo.png',
  'base-sepolia': '/assets/base-logo.png',
};

function vaultCardData(
  vault: VaultSummaryWithChain,
  tvlUsd: number | undefined,
): VaultCardData {
  const underlying = underlyingOf(vault.symbol);
  return {
    id: `${vault.chainKey}:${vault.vault}`,
    name: vault.symbol,
    depositToken: underlying,
    iconSrc: TOKEN_ICON_SRC[underlying],
    apyBase: (vault.apy ?? 0) * 100,
    apyReward: 0,
    apyBoost: 0,
    tvl: tvlUsd ?? 0,
    // No risk classification: the backend doesn't provide one, so the card
    // omits the indicator instead of inventing a label.
    status: 'active',
    chain: CHAIN_META[vault.chainKey].label,
    chainIconSrc: CHAIN_ICON_SRC[vault.chainKey],
    strategy: 'Covered-call premium',
    // Verified onchain 2026-10-02: every vault targets 70% epoch / 30% lending.
    strategies: ['lending', 'covered-call'],
    tags: [underlying, 'Testnet'],
    audited: false,
  };
}

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

function VaultPageInner() {
  const { chain, setChain } = useChain();
  const { vaults, isLoading, error } = useAllVaults();
  const { prices, isLoading: pricesLoading } = useOraclePrices();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<VaultSummaryWithChain | null>(null);
  const savedChain = useRef<AppChainKey | null>(null);

  const tvlUsdOf = (vault: VaultSummaryWithChain): number | undefined => {
    if (vault.tvl === null) return undefined;
    const price = prices[underlyingOf(vault.symbol)];
    if (price === undefined) return undefined;
    return Number(formatUnits(BigInt(vault.tvl), TOKEN_DECIMALS)) * price;
  };

  const loading = isLoading || pricesLoading;

  // The modal's detail hooks read the chain from context — point the context
  // at the vault's chain while it's open, restore on close.
  const openVault = (vault: VaultSummaryWithChain) => {
    savedChain.current = chain;
    if (vault.chainKey !== chain) setChain(vault.chainKey);
    setSelected(vault);
  };

  const closeVault = () => {
    setSelected(null);
    if (savedChain.current && savedChain.current !== chain) {
      setChain(savedChain.current);
    }
    savedChain.current = null;
  };

  // Deep-link: ?symbol=evNVDA&chain=robinhood-testnet opens the modal.
  const requestedSymbol = searchParams.get('symbol');
  const requestedChain = searchParams.get('chain');
  useEffect(() => {
    if (requestedSymbol && !selected && vaults.length > 0) {
      const match =
        vaults.find(
          (v) =>
            v.symbol === requestedSymbol &&
            (requestedChain === 'robinhood-testnet' || requestedChain === 'base-sepolia'
              ? v.chainKey === requestedChain
              : true),
        ) ?? null;
      if (match) openVault(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedSymbol, requestedChain, vaults.length]);

  useEffect(() => {
    document.title = selected ? `Eque - ${selected.symbol}` : 'Eque';
    return () => {
      document.title = 'Eque';
    };
  }, [selected]);

  const cards = useMemo(
    () => vaults.map((vault) => vaultCardData(vault, tvlUsdOf(vault))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vaults, prices],
  );

  const openByCard = (card: VaultCardData) => {
    const vault = vaults.find((v) => `${v.chainKey}:${v.vault}` === card.id);
    if (vault) openVault(vault);
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          selected
            ? { label: 'Vault', onClick: closeVault }
            : { label: 'Vault' },
          ...(selected ? [{ label: selected.symbol }] : []),
        ]}
      />

      {error ? (
        <div className="mt-8">
          <AlertBanner
            status="error"
            title="Couldn't reach the API"
            message="Is NEXT_PUBLIC_API_URL set and the backend running?"
          />
        </div>
      ) : (
        <VaultListGrid
          vaults={cards}
          loading={loading}
          onSelect={openByCard}
          onDeposit={openByCard}
          pageSize={6}
          className="mt-8"
        />
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) closeVault();
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl lg:max-w-5xl">
          {selected && (
            <>
              <DialogTitle className="font-display text-xl font-bold tracking-[-0.01em] text-eque-hero">
                {selected.symbol}
                <span className="ml-3 align-middle font-body text-[12px] font-normal tracking-normal text-eque-muted">
                  {CHAIN_META[selected.chainKey].label}
                </span>
              </DialogTitle>
              {chain === selected.chainKey ? (
                <VaultDetail
                  key={`${selected.chainKey}:${selected.symbol}`}
                  vault={selected}
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2" aria-label="Loading vault detail">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="h-72 animate-pulse border border-eque-line bg-eque-surface"
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
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
