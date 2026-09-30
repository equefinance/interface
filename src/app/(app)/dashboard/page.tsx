'use client';

import { useRouter } from 'next/navigation';
import { formatUnits } from 'viem';
import { ConnectButtonEque } from '@/components/connect-button';
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner';
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState';
import { StatCard } from '@/components/molecules/StatCard/StatCard';
import { VaultCard, type VaultCardData } from '@/components/organisms/VaultCard/VaultCard';
import { useOraclePrices } from '@/hooks/use-oracle-prices';
import { usePortfolio } from '@/hooks/use-portfolio';
import { useVaults, type VaultSummary } from '@/hooks/use-vaults';
import { CHAIN_META } from '@/lib/chains';
import { useChain } from '@/lib/chain-context';
import { TOKEN_DECIMALS } from '@/lib/eque-contracts';
import { fmtApy, fmtTokens, underlyingOf } from '@/lib/format';
import { formatTvl } from '@/lib/utils';

function PortfolioSection() {
  const { positions, isLoading, isConnected } = usePortfolio();

  if (!isConnected) {
    return (
      <div className="mt-10">
        <EmptyState
          title="No wallet connected"
          description="Connect your wallet to see your eVault shares, accrued value, and live epoch exposure."
          action={<ConnectButtonEque />}
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

  return (
    <section className="mt-10" aria-label="Your positions">
      <p className="font-display text-[11px] tracking-[0.18em] text-eque-muted">┌─ your position ─┐</p>
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

function vaultCardData(
  vault: VaultSummary,
  chainLabel: string,
  tvlUsd: number | undefined,
): VaultCardData {
  const underlying = underlyingOf(vault.symbol);
  return {
    id: vault.vault,
    name: vault.symbol,
    depositToken: underlying,
    apyBase: (vault.apy ?? 0) * 100,
    apyReward: 0,
    apyBoost: 0,
    tvl: tvlUsd ?? 0,
    // No risk classification: the backend doesn't provide one, so the card
    // omits the indicator instead of inventing a label.
    status: 'active',
    chain: chainLabel,
    strategy: 'Covered-call premium',
    tags: [underlying, 'Testnet'],
    audited: false,
  };
}

export default function DashboardPage() {
  const { chain } = useChain();
  const router = useRouter();
  const { vaults, isLoading, error } = useVaults();
  const { prices, isLoading: pricesLoading, isError: pricesError } = useOraclePrices();

  const tvlUsdOf = (vault: VaultSummary): number | undefined => {
    if (vault.tvl === null) return undefined;
    const price = prices[underlyingOf(vault.symbol)];
    if (price === undefined) return undefined;
    return Number(formatUnits(BigInt(vault.tvl), TOKEN_DECIMALS)) * price;
  };

  const loading = isLoading || pricesLoading;
  const totalTvlUsd = vaults.reduce((sum, v) => sum + (tvlUsdOf(v) ?? 0), 0);
  const bestApy = vaults.reduce((best, v) => Math.max(best, v.apy ?? 0), 0);
  const liveEpochs = vaults.filter((v) => v.activeEpoch !== null).length;
  const bestApyId =
    bestApy > 0 ? (vaults.find((v) => (v.apy ?? 0) >= bestApy)?.vault ?? null) : null;

  const goVault = (symbol: string) => router.push(`/vault?symbol=${encodeURIComponent(symbol)}`);

  return (
    <>
      <p className="font-display text-[11px] tracking-[0.2em] text-eque-muted" aria-hidden="true">
        ┌─ dashboard ─┐
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-eque-hero sm:text-4xl">
          Dashboard
        </h1>
        <p className="font-display text-[12px] tracking-[0.14em] text-eque-muted">
          {CHAIN_META[chain].label.toUpperCase()}
        </p>
      </div>

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
            <StatCard label="VAULTS" value={loading ? '—' : String(vaults.length)} loading={loading} />
            <StatCard
              label="LIVE EPOCHS"
              value={loading ? '—' : String(liveEpochs)}
              loading={loading}
            />
          </div>

          {loading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-[280px] animate-pulse border border-eque-line bg-eque-surface" />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {vaults.map((vault) => (
                <VaultCard
                  key={vault.vault}
                  vault={vaultCardData(vault, CHAIN_META[chain].label, tvlUsdOf(vault))}
                  featured={vault.vault === bestApyId}
                  onSelect={() => goVault(vault.symbol)}
                  onDeposit={() => goVault(vault.symbol)}
                  depositLabel="Deposit"
                />
              ))}
            </div>
          )}

        </>
      )}

      {!error && <PortfolioSection />}
    </>
  );
}
