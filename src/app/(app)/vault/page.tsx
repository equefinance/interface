'use client';

import { Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatUnits } from 'viem';
import { Breadcrumb } from '@/components/breadcrumb';
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner';
import { VaultListGrid } from '@/components/organisms/VaultListGrid/VaultListGrid';
import { type VaultCardData } from '@/components/organisms/VaultCard/VaultCard';
import { useOraclePrices } from '@/hooks/use-oracle-prices';
import { useAllVaults, type VaultSummaryWithChain } from '@/hooks/use-vaults';
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
    // Risk is derived from the strategy mix, not the backend (which provides
    // no classification): every vault runs the same 70% covered-call / 30%
    // lending split on a single stock — medium by construction. Verified
    // onchain 2026-10-02.
    risk: 'medium',
    status: 'active',
    chain: CHAIN_META[vault.chainKey].label,
    chainIconSrc: CHAIN_ICON_SRC[vault.chainKey],
    strategy: 'Covered-call premium',
    // Verified onchain 2026-10-02: every vault targets 70% epoch / 30% lending.
    strategies: ['lending', 'covered-call'],
    audited: false,
  };
}

function VaultPageInner() {
  const router = useRouter();
  const { vaults, isLoading, error } = useAllVaults();
  const { prices, isLoading: pricesLoading } = useOraclePrices();

  const tvlUsdOf = (vault: VaultSummaryWithChain): number | undefined => {
    if (vault.tvl === null) return undefined;
    const price = prices[underlyingOf(vault.symbol)];
    if (price === undefined) return undefined;
    return Number(formatUnits(BigInt(vault.tvl), TOKEN_DECIMALS)) * price;
  };

  const loading = isLoading || pricesLoading;

  const cards = useMemo(
    () => vaults.map((vault) => vaultCardData(vault, tvlUsdOf(vault))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vaults, prices],
  );

  const goDetail = (card: VaultCardData) => {
    const vault = vaults.find((v) => `${v.chainKey}:${v.vault}` === card.id);
    if (vault) router.push(`/vault/${vault.symbol}`);
  };

  return (
    <>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Vault' }]} />

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
          onSelect={goDetail}
          onDeposit={goDetail}
          pageSize={6}
          className="mt-8"
        />
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
