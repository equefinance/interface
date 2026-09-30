'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DepositPanel } from '@/components/vault/deposit-panel';
import { EpochHistory } from '@/components/vault/epoch-history';
import { EpochPanel } from '@/components/vault/epoch-panel';
import { useVaults } from '@/hooks/use-vaults';
import { CHAIN_META } from '@/lib/chains';
import { useChain } from '@/lib/chain-context';
import { cn } from '@/lib/utils';

function VaultPageInner() {
  const { chain } = useChain();
  const { vaults, isLoading, error } = useVaults();
  const searchParams = useSearchParams();
  const requested = searchParams.get('symbol');

  const symbols = useMemo(() => vaults.map((v) => v.symbol), [vaults]);
  const [active, setActive] = useState<string | null>(null);

  // Follow ?symbol= when it names a real vault; otherwise first vault.
  // Resets when the chain (and therefore the vault list) changes.
  useEffect(() => {
    if (symbols.length === 0) {
      setActive(null);
      return;
    }
    setActive(requested && symbols.includes(requested) ? requested : symbols[0]);
  }, [symbols, requested, chain]);

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
        <div className="mt-8 border border-[#FF6B6B]/40 bg-eque-surface p-6">
          <p className="font-display text-sm text-[#FF6B6B]">
            Couldn&apos;t reach the API. Is <span className="tabular-nums">NEXT_PUBLIC_API_URL</span> set?
          </p>
        </div>
      ) : isLoading || !vault ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-72 animate-pulse border border-eque-line bg-eque-surface" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 inline-flex border border-eque-line bg-eque-surface" role="tablist" aria-label="Vaults">
            {symbols.map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={s === active}
                type="button"
                onClick={() => setActive(s)}
                className={cn(
                  'font-display px-5 py-2.5 text-[13px] font-semibold tracking-[0.08em] transition-colors duration-150',
                  s === active ? 'bg-eque-teal text-eque-ink' : 'text-eque-muted hover:text-eque-text',
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
            <DepositPanel symbol={vault.symbol} />
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
