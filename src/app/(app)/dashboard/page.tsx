'use client';

import { ConnectButtonEque } from '@/components/connect-button';
import { VaultCard } from '@/components/vault-card';
import { usePortfolio } from '@/hooks/use-portfolio';
import { useVaults } from '@/hooks/use-vaults';
import { CHAIN_META } from '@/lib/chains';
import { useChain } from '@/lib/chain-context';
import { fmtApy, fmtTokens } from '@/lib/format';

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-eque-line bg-eque-surface p-4 sm:p-5">
      <p className="font-display text-[11px] tracking-[0.18em] text-eque-muted">{label}</p>
      <p
        className={`font-display mt-2 text-2xl font-semibold tabular-nums sm:text-[28px] ${
          accent ? 'text-eque-teal' : 'text-eque-hero'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PortfolioSection() {
  const { positions, isLoading, isConnected } = usePortfolio();

  if (!isConnected) {
    return (
      <div className="mt-10 border border-dashed border-eque-border p-6 text-center sm:p-8">
        <p className="font-display text-[11px] tracking-[0.18em] text-eque-muted">
          ┌─ your position ─┐
        </p>
        <p className="font-body mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-eque-text-2">
          Connect your wallet to see your eVault shares, accrued value, and live epoch exposure.
        </p>
        <div className="mt-5 flex justify-center">
          <ConnectButtonEque />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-10 border border-eque-line bg-eque-surface p-6">
        <p className="font-display text-[13px] tracking-[0.08em] text-eque-muted">
          Loading positions…
        </p>
      </div>
    );
  }

  const active = positions.filter((p) => BigInt(p.shares) > 0n);
  if (active.length === 0) {
    return (
      <div className="mt-10 border border-eque-line bg-eque-surface p-6 sm:p-8">
        <p className="font-display text-[11px] tracking-[0.18em] text-eque-muted">
          ┌─ your position ─┐
        </p>
        <p className="font-body mt-3 text-sm leading-relaxed text-eque-text-2">
          No shares yet. Deposit into a vault to start earning options premium every epoch.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-10" aria-label="Your positions">
      <p className="font-display text-[11px] tracking-[0.18em] text-eque-muted">
        ┌─ your position ─┐
      </p>
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
  const { chain } = useChain();
  const { vaults, isLoading, error } = useVaults();

  const totalTvl = vaults.reduce((sum, v) => sum + (v.tvl === null ? 0n : BigInt(v.tvl)), 0n);
  const bestApy = vaults.reduce((best, v) => Math.max(best, v.apy ?? 0), 0);
  const liveEpochs = vaults.filter((v) => v.activeEpoch !== null).length;

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
        <div className="mt-8 border border-[#FF6B6B]/40 bg-eque-surface p-6">
          <p className="font-display text-sm text-[#FF6B6B]">
            Couldn&apos;t reach the API. Is <span className="tabular-nums">NEXT_PUBLIC_API_URL</span> set?
          </p>
        </div>
      ) : isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[92px] animate-pulse border border-eque-line bg-eque-surface" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="TOTAL TVL" value={fmtTokens(totalTvl.toString())} />
            <Stat label="BEST APY" value={fmtApy(bestApy)} accent />
            <Stat label="VAULTS" value={String(vaults.length)} />
            <Stat label="LIVE EPOCHS" value={String(liveEpochs)} />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {vaults.map((vault) => (
              <VaultCard key={vault.vault} vault={vault} />
            ))}
          </div>

          <PortfolioSection />
        </>
      )}
    </>
  );
}
