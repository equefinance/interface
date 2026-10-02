'use client';

import { formatUnits } from 'viem';
import { useNow } from '@/hooks/use-now';
import type { VaultSummary } from '@/hooks/use-vaults';
import { STRATEGY_PRICE_DECIMALS } from '@/lib/eque-contracts';
import { fmtCountdown, fmtTokens } from '@/lib/format';
import { cn } from '@/lib/utils';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="font-display text-[11px] tracking-[0.16em] text-eque-muted">{label}</dt>
      <dd className="font-display text-right text-[15px] tabular-nums text-eque-text">{children}</dd>
    </div>
  );
}

/** Live epoch status: countdown, strike, premium. Spectator-safe, no actions. */
export function EpochPanel({ vault }: { vault: VaultSummary }) {
  const now = useNow();
  const epoch = vault.activeEpoch;

  return (
    <div className="border border-eque-line bg-eque-surface p-5 sm:p-6">
      <div className="flex items-center justify-between">
        {epoch && (
          <span
            className={cn(
              'font-display inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium tracking-[0.1em]',
              'border-eque-teal/40 text-eque-teal',
            )}
          >
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse bg-eque-teal" />
            {epoch.state.toUpperCase()}
          </span>
        )}
      </div>

      {!epoch ? (
        <div className="py-6 text-center">
          <p className="font-display text-xl font-semibold text-eque-hero">Between epochs</p>
          <p className="font-body mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-eque-text-2">
            The last epoch settled. The keeper is opening the next auction — check back in a
            moment.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 text-center">
            <p className="font-display text-[11px] tracking-[0.18em] text-eque-muted">
              {epoch.state === 'Auction' ? 'AUCTION CLOSES IN' : 'EPOCH SETTLES IN'}
            </p>
            <p className="font-display mt-1 text-4xl font-bold tabular-nums text-eque-teal">
              {fmtCountdown((epoch.state === 'Auction' ? epoch.auctionEndsAt : epoch.endsAt) - now)}
            </p>
            <p className="font-display mt-1 text-[12px] tracking-[0.1em] text-eque-muted">
              EPOCH #{epoch.epochId}
            </p>
          </div>

          <dl className="mt-4 divide-y divide-eque-line border-t border-eque-line">
            <Row label="STRIKE PRICE">
              {epoch.strikePrice !== null ? (
                <>${Number(formatUnits(BigInt(epoch.strikePrice), STRATEGY_PRICE_DECIMALS)).toLocaleString('en-US', { maximumFractionDigits: 2 })}</>
              ) : (
                <span className="text-eque-muted">set at auction close</span>
              )}
            </Row>
            <Row label={epoch.state === 'Auction' ? 'TOP BID' : 'PREMIUM LOCKED'}>
              {epoch.winningBid !== null ? (
                <>{fmtTokens(epoch.winningBid)} <span className="text-[12px] text-eque-muted">{vault.symbol.replace(/^ev/i, '').toUpperCase()}</span></>
              ) : (
                <span className="text-eque-muted">no bids yet</span>
              )}
            </Row>
            {epoch.winningBidder !== null && (
              <Row label="TOP BIDDER">
                <span className="text-[13px]">
                  {epoch.winningBidder.slice(0, 6)}…{epoch.winningBidder.slice(-4)}
                </span>
              </Row>
            )}
          </dl>

          <p className="font-body mt-4 text-[12px] leading-relaxed text-eque-muted">
            {epoch.state === 'Auction'
              ? 'Market makers are bidding for the right to pay this epoch’s premium. Depositors don’t need to do anything.'
              : 'Premium is locked in. If the option expires out of the money, the full premium becomes vault yield.'}
          </p>
        </>
      )}
    </div>
  );
}
