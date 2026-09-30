'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DepositPanel } from '@/components/vault/deposit-panel';
import { EpochHistory } from '@/components/vault/epoch-history';
import { EpochPanel } from '@/components/vault/epoch-panel';
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner';
import { Tabs } from '@/components/molecules/Tabs/Tabs';
import { useVaults } from '@/hooks/use-vaults';
import { CHAIN_META } from '@/lib/chains';
import { useChain } from '@/lib/chain-context';

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

  return (
    <>
      <p className="font-display text-[11px] tracking-[0.2em] text-eque-muted" aria-hidden="true">
        ┌─ vault ─┐
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-eque-hero sm:text-4xl">
          Vault
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

          <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
            <DepositPanel key={`${chain}:${vault.symbol}`} symbol={vault.symbol} />
            <EpochPanel vault={vault} />
          </div>

          <EpochHistory symbol={vault.symbol} />

          <p className="font-body mx-auto mt-8 max-w-[68ch] text-[12px] leading-relaxed text-eque-muted">
            eVaults are ERC-4626. Every epoch, the vault auctions a covered-call option on its
            holdings to market makers — the winning premium is compounded straight back into the
            vault. Deposit once; every epoch&apos;s auction works for you automatically.
          </p>
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
