'use client';

import { formatUnits } from 'viem';
import { useEpochHistory } from '@/hooks/use-epoch-history';
import { STRATEGY_PRICE_DECIMALS } from '@/lib/eque-contracts';
import { fmtTokens } from '@/lib/format';

const fmtDate = (unixSec: number): string =>
  new Date(unixSec * 1000).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Past epochs: strike, premium collected, timing. Newest first. */
export function EpochHistory({ symbol }: { symbol: string }) {
  const { epochs, isLoading, error } = useEpochHistory(symbol, 12);

  return (
    <section aria-label="Epoch history" className="mt-8">
      <div className="overflow-x-auto border border-eque-line bg-eque-surface">
        {isLoading ? (
          <p className="font-display p-6 text-[13px] tracking-[0.08em] text-eque-muted">
            Loading epochs…
          </p>
        ) : error ? (
          <p className="font-body p-6 text-sm text-[#FF6B6B]">
            Couldn&apos;t load epoch history.
          </p>
        ) : epochs.length === 0 ? (
          <p className="font-body p-6 text-sm text-eque-text-2">
            No settled epochs yet — history appears after the first epoch closes.
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="font-display border-b border-eque-line text-[11px] tracking-[0.14em] text-eque-muted">
                <th className="px-4 py-3 font-medium">EPOCH</th>
                <th className="px-4 py-3 font-medium">STATE</th>
                <th className="px-4 py-3 text-right font-medium">STRIKE</th>
                <th className="px-4 py-3 text-right font-medium">PREMIUM</th>
                <th className="px-4 py-3 text-right font-medium">STARTED</th>
                <th className="px-4 py-3 text-right font-medium">ENDED</th>
              </tr>
            </thead>
            <tbody>
              {epochs.map((e) => {
                const premium = e.premiumCollected ?? e.winningBid;
                return (
                  <tr key={e.epochId} className="border-b border-eque-line last:border-0">
                    <td className="font-display px-4 py-3 font-semibold text-eque-hero">
                      #{e.epochId}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          e.state === 'Settled'
                            ? 'text-eque-muted'
                            : 'font-display text-[12px] text-eque-teal'
                        }
                      >
                        {e.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-eque-text">
                      {e.strikePrice !== null
                        ? `$${Number(formatUnits(BigInt(e.strikePrice), STRATEGY_PRICE_DECIMALS)).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-eque-text">
                      {premium !== null ? fmtTokens(premium) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-eque-muted">
                      {fmtDate(e.startsAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-eque-muted">
                      {fmtDate(e.endsAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
