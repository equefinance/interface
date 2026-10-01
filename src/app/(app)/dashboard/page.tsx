'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatUnits } from 'viem';
import { WalletMenu } from '@/components/wallet-menu';
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner';
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState';
import { StatCard } from '@/components/molecules/StatCard/StatCard';
import { Tabs } from '@/components/molecules/Tabs/Tabs';
import { PortfolioSummaryCard } from '@/components/organisms/PortfolioSummaryCard/PortfolioSummaryCard';
import { VaultListGrid } from '@/components/organisms/VaultListGrid/VaultListGrid';
import { type VaultCardData } from '@/components/organisms/VaultCard/VaultCard';
import { useOraclePrices } from '@/hooks/use-oracle-prices';
import { usePortfolio } from '@/hooks/use-portfolio';
import { useAllVaults, useVaults, type VaultSummaryWithChain } from '@/hooks/use-vaults';
import { CHAIN_META, type AppChainKey } from '@/lib/chains';
import { TOKEN_DECIMALS } from '@/lib/eque-contracts';
import { fmtApy, fmtTokens, underlyingOf } from '@/lib/format';
import { formatTvl } from '@/lib/utils';

function PortfolioSection() {
  const { positions, isLoading, isConnected } = usePortfolio();
  const { vaults } = useVaults();
  const { prices } = useOraclePrices();

  if (!isConnected) {
    return (
      <div className="mt-10">
        <EmptyState
          title="No wallet connected"
          description="Connect your wallet to see your eVault shares, accrued value, and live epoch exposure."
          action={<WalletMenu />}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-10 border border-eque-line bg-eque-surface p-6">
        <p className="font-display text-[13px] tracking-[0.08em] text-eque-muted">Loading positions…</p>
      </div>
    );
  }

  const active = positions.filter((p) => BigInt(p.shares) > 0n);
  if (active.length === 0) {
    return (
      <div className="mt-10">
        <EmptyState
          title="No shares yet"
          description="Deposit into a vault to start earning options premium every epoch."
        />
      </div>
    );
  }

  const usdOf = (symbol: string, amount: string): number => {
    const price = prices[underlyingOf(symbol)];
    if (price === undefined) return 0;
    return Number(formatUnits(BigInt(amount), TOKEN_DECIMALS)) * price;
  };
  const apyOf = (symbol: string): number =>
    vaults.find((v) => v.symbol === symbol)?.apy ?? 0;

  // Principal ≈ shares (1 share ≈ 1 underlying at deposit); earned is the
  // share-price appreciation on top — both read straight from the chain.
  const totalDeposited = active.reduce((s, p) => s + usdOf(p.symbol, p.shares), 0);
  const totalEarned = active.reduce((s, p) => {
    const assets = BigInt(p.assets);
    const shares = BigInt(p.shares);
    const gain = assets > shares ? assets - shares : 0n;
    return s + usdOf(p.symbol, gain.toString());
  }, 0);
  const dailyYield = active.reduce(
    (s, p) => s + (usdOf(p.symbol, p.assets) * apyOf(p.symbol)) / 100 / 365,
    0,
  );

  return (
    <section className="mt-10" aria-label="Your positions">
      <PortfolioSummaryCard
        totalDeposited={totalDeposited}
        totalEarned={totalEarned}
        dailyYield={dailyYield}
        monthlyYield={dailyYield * 30}
      />
      <div className="mt-4 overflow-x-auto border border-eque-line">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="font-display border-b border-eque-line text-[11px] tracking-[0.14em] text-eque-muted">
              <th className="px-4 py-3 font-medium">VAULT</th>
              <th className="px-4 py-3 text-right font-medium">SHARES</th>
              <th className="px-4 py-3 text-right font-medium">VALUE</th>
              <th className="px-4 py-3 text-right font-medium">EPOCH</th>
            </tr>
          </thead>
          <tbody>
            {active.map((p) => (
              <tr key={p.vault} className="border-b border-eque-line last:border-0">
                <td className="font-display px-4 py-3 font-semibold text-eque-hero">{p.symbol}</td>
                <td className="px-4 py-3 text-right tabular-nums text-eque-text">
                  {fmtTokens(p.shares)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-eque-text">
                  {fmtTokens(p.assets)}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.activeEpoch ? (
                    <span className="font-display text-[12px] text-eque-teal">
                      #{p.activeEpoch.epochId} · {p.activeEpoch.state}
                    </span>
                  ) : (
                    <span className="text-eque-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

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
    tags: [underlying, 'Testnet'],
    audited: false,
  };
}

type ChainFilter = 'all' | AppChainKey;

function ChainTabLabel({ chainKey }: { chainKey: AppChainKey }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Image
        src={CHAIN_ICON_SRC[chainKey]}
        alt=""
        width={16}
        height={16}
        className="size-4 shrink-0"
        aria-hidden="true"
      />
      {CHAIN_META[chainKey].label}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { vaults, isLoading, error } = useAllVaults();
  const { prices, isLoading: pricesLoading, isError: pricesError } = useOraclePrices();
  const [chainFilter, setChainFilter] = useState<ChainFilter>('all');

  const tvlUsdOf = (vault: VaultSummaryWithChain): number | undefined => {
    if (vault.tvl === null) return undefined;
    const price = prices[underlyingOf(vault.symbol)];
    if (price === undefined) return undefined;
    return Number(formatUnits(BigInt(vault.tvl), TOKEN_DECIMALS)) * price;
  };

  const visible =
    chainFilter === 'all' ? vaults : vaults.filter((v) => v.chainKey === chainFilter);

  const loading = isLoading || pricesLoading;
  const totalTvlUsd = visible.reduce((sum, v) => sum + (tvlUsdOf(v) ?? 0), 0);
  const bestApy = visible.reduce((best, v) => Math.max(best, v.apy ?? 0), 0);
  const liveEpochs = visible.filter((v) => v.activeEpoch !== null).length;
  const goVault = (vault: VaultSummaryWithChain) =>
    router.push(
      `/vault?symbol=${encodeURIComponent(vault.symbol)}&chain=${vault.chainKey}`,
    );

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-eque-hero sm:text-4xl">
        Dashboard
      </h1>

      {error ? (
        <div className="mt-8">
          <AlertBanner
            status="error"
            title="Couldn't reach the API"
            message="Is NEXT_PUBLIC_API_URL set and the backend running?"
          />
        </div>
      ) : pricesError && !loading ? (
        <div className="mt-8">
          <AlertBanner
            status="warning"
            title="Couldn't load token prices"
            message="The RPC isn't responding — TVL figures are hidden until it does."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="TOTAL TVL" value={loading ? '—' : formatTvl(totalTvlUsd)} loading={loading} />
            <StatCard label="BEST APY" value={loading ? '—' : fmtApy(bestApy)} loading={loading} />
            <StatCard label="VAULTS" value={loading ? '—' : String(visible.length)} loading={loading} />
            <StatCard
              label="LIVE EPOCHS"
              value={loading ? '—' : String(liveEpochs)}
              loading={loading}
            />
          </div>

          <Tabs
            tabs={[
              { value: 'all', label: 'All vaults' },
              { value: 'robinhood-testnet', label: <ChainTabLabel chainKey="robinhood-testnet" /> },
              { value: 'base-sepolia', label: <ChainTabLabel chainKey="base-sepolia" /> },
            ]}
            value={chainFilter}
            onValueChange={(v) => setChainFilter(v as ChainFilter)}
            className="mt-8"
          />

          <VaultListGrid
            vaults={visible.map((vault) => vaultCardData(vault, tvlUsdOf(vault)))}
            loading={loading}
            onSelect={(v) => {
              const vault = visible.find((x) => `${x.chainKey}:${x.vault}` === v.id);
              if (vault) goVault(vault);
            }}
            onDeposit={(v) => {
              const vault = visible.find((x) => `${x.chainKey}:${x.vault}` === v.id);
              if (vault) goVault(vault);
            }}
            pageSize={6}
            className="mt-8"
          />
        </>
      )}

      {!error && <PortfolioSection />}
    </>
  );
}
