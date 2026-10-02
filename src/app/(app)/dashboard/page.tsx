'use client';

import { formatUnits } from 'viem';
import { WalletMenu } from '@/components/wallet-menu';
import { Breadcrumb } from '@/components/breadcrumb';
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner';
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState';
import { StatCard } from '@/components/molecules/StatCard/StatCard';
import { PortfolioSummaryCard } from '@/components/organisms/PortfolioSummaryCard/PortfolioSummaryCard';
import { useOraclePrices } from '@/hooks/use-oracle-prices';
import { usePortfolio } from '@/hooks/use-portfolio';
import { useAllVaults, useVaults, type VaultSummaryWithChain } from '@/hooks/use-vaults';
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

export default function DashboardPage() {
  const { vaults, isLoading, error } = useAllVaults();
  const { prices, isLoading: pricesLoading, isError: pricesError } = useOraclePrices();

  const tvlUsdOf = (vault: VaultSummaryWithChain): number | undefined => {
    if (vault.tvl === null) return undefined;
    const price = prices[underlyingOf(vault.symbol)];
    if (price === undefined) return undefined;
    return Number(formatUnits(BigInt(vault.tvl), TOKEN_DECIMALS)) * price;
  };

  const loading = isLoading || pricesLoading;
  const totalTvlUsd = vaults.reduce((sum, v) => sum + (tvlUsdOf(v) ?? 0), 0);
  const bestApy = vaults.reduce((best, v) => Math.max(best, v.apy ?? 0), 0);
  const liveEpochs = vaults.filter((v) => v.activeEpoch !== null).length;

  return (
    <>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />

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
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="TOTAL TVL" value={loading ? '—' : formatTvl(totalTvlUsd)} loading={loading} />
          <StatCard label="BEST APY" value={loading ? '—' : fmtApy(bestApy)} loading={loading} />
          <StatCard label="VAULTS" value={loading ? '—' : String(vaults.length)} loading={loading} />
          <StatCard
            label="LIVE EPOCHS"
            value={loading ? '—' : String(liveEpochs)}
            loading={loading}
          />
        </div>
      )}

      {!error && <PortfolioSection />}
    </>
  );
}
