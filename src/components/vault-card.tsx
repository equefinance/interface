'use client';

import Link from 'next/link';
import { useNow } from '@/hooks/use-now';
import type { VaultSummary } from '@/hooks/use-vaults';
import { fmtApy, fmtCountdown, fmtSharePrice, fmtTokens, underlyingOf } from '@/lib/format';
import { cn } from '@/lib/utils';

function EpochLine({ vault }: { vault: VaultSummary }) {
  const now = useNow();
  const epoch = vault.activeEpoch;
  if (!epoch) {
    return <span className="text-eque-muted">No active epoch — next auction soon</span>;
  }
  const target = epoch.state === 'Auction' ? epoch.auctionEndsAt : epoch.endsAt;
  const label = epoch.state === 'Auction' ? 'Auction ends' : 'Epoch ends';
  return (
    <span>
      <span className="text-eque-teal">Epoch #{epoch.epochId}</span>
      <span className="text-eque-muted"> · {label} </span>
      <span className="font-display tabular-nums text-eque-text">
        {fmtCountdown(target - now)}
      </span>
    </span>
  );
}

/**
 * Vault summary card, shared by the dashboard grid and the vault page tabs.
 * All numbers come from the backend API (bigint arrives as string).
 */
export function VaultCard({ vault }: { vault: VaultSummary }) {
  const underlying = underlyingOf(vault.symbol);
  const hasLiveEpoch = vault.activeEpoch !== null;

  return (
    <article className="group relative border border-eque-line bg-eque-surface p-5 transition-colors duration-150 hover:border-eque-border sm:p-6">
      {/* corner brackets */}
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-eque-teal/70" />
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-eque-teal/70" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[11px] tracking-[0.18em] text-eque-muted">
            {underlying} VAULT
          </p>
          <h3 className="font-display mt-1 text-xl font-bold tracking-[-0.01em] text-eque-hero">
            {vault.symbol}
          </h3>
        </div>
        <span
          className={cn(
            'font-display inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium tracking-[0.1em]',
            hasLiveEpoch
              ? 'border-eque-teal/40 text-eque-teal'
              : 'border-eque-border text-eque-muted',
          )}
        >
          <span
            aria-hidden
            className={cn('h-1.5 w-1.5', hasLiveEpoch ? 'animate-pulse bg-eque-teal' : 'bg-eque-muted')}
          />
          {hasLiveEpoch ? vault.activeEpoch!.state.toUpperCase() : 'IDLE'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.14em] text-eque-muted">TVL</p>
          <p className="font-display mt-1 text-2xl font-semibold tabular-nums text-eque-text">
            {fmtTokens(vault.tvl)}{' '}
            <span className="text-sm font-medium text-eque-muted">{underlying}</span>
          </p>
        </div>
        <div>
          <p className="font-display text-[11px] tracking-[0.14em] text-eque-muted">APY</p>
          <p className="font-display mt-1 text-2xl font-semibold tabular-nums text-eque-teal">
            {fmtApy(vault.apy)}
          </p>
        </div>
      </div>

      <dl className="font-body mt-5 space-y-1.5 border-t border-eque-line pt-4 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-eque-muted">Share price</dt>
          <dd className="tabular-nums text-eque-text">{fmtSharePrice(vault.sharePrice)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-eque-muted">Live epoch</dt>
          <dd className="font-display text-[12px]">
            <EpochLine vault={vault} />
          </dd>
        </div>
      </dl>

      <Link
        href={`/vault?symbol=${encodeURIComponent(vault.symbol)}`}
        className="font-display mt-5 inline-flex h-10 w-full items-center justify-center border border-eque-border text-[13px] font-medium tracking-[0.06em] text-eque-text transition-colors duration-150 hover:border-eque-teal/60 hover:text-eque-teal"
      >
        Open vault <span aria-hidden className="ml-2">→</span>
      </Link>
    </article>
  );
}
