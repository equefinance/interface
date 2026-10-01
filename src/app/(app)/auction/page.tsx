'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatUnits } from 'viem';
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner';
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState';
import { Tabs } from '@/components/molecules/Tabs/Tabs';
import {
  LiveEpochPanel,
  type EpochPhase,
} from '@/components/organisms/LiveEpochPanel/LiveEpochPanel';
import { EpochHistory } from '@/components/vault/epoch-history';
import { useBids } from '@/hooks/use-bids';
import { useEpochHistory } from '@/hooks/use-epoch-history';
import { useOraclePrices } from '@/hooks/use-oracle-prices';
import { useVaults } from '@/hooks/use-vaults';
import { useChain } from '@/lib/chain-context';
import { ORACLE_DECIMALS, TOKEN_DECIMALS } from '@/lib/eque-contracts';
import { underlyingOf } from '@/lib/format';

function phaseOf(state: string): EpochPhase {
  if (state === 'Auction') return 'bidding';
  if (state === 'Settled') return 'settled';
  return 'settling';
}

function AuctionDetail({ symbol }: { symbol: string }) {
  const { epochs, isLoading: epochsLoading } = useEpochHistory(symbol, 12);
  const { prices } = useOraclePrices();

  const active = epochs.find((e) => e.state !== 'Settled') ?? null;
  const shown = active ?? epochs[0] ?? null;

  const { bids, isLoading: bidsLoading } = useBids(
    symbol,
    shown && phaseOf(shown.state) !== 'settled' ? shown.epochId : null,
  );

  const underlying = underlyingOf(symbol);
  const price = prices[underlying] ?? 0;

  const panelProps = useMemo(() => {
    if (!shown) return null;
    const phase = phaseOf(shown.state);
    const strike =
      shown.strikePrice === null
        ? 0
        : Number(formatUnits(BigInt(shown.strikePrice), ORACLE_DECIMALS));
    const sorted = [...bids]
      .map((b) => ({
        bidder: b.bidder,
        amount: Number(formatUnits(BigInt(b.amount), TOKEN_DECIMALS)),
      }))
      .sort((a, b) => b.amount - a.amount);
    const premium =
      shown.premiumCollected === null
        ? undefined
        : Number(formatUnits(BigInt(shown.premiumCollected), TOKEN_DECIMALS)) * price;
    const pastEpochs = epochs
      .filter((e) => e.state === 'Settled' && e.premiumCollected !== null)
      .slice(0, 8)
      .map((e) => ({
        epoch: Number(e.epochId),
        premium:
          Number(formatUnits(BigInt(e.premiumCollected as string), TOKEN_DECIMALS)) * price,
      }));
    return {
      epoch: Number(shown.epochId),
      phase,
      strikePrice: strike,
      spotPrice: price,
      epochEndsAt:
        phase === 'bidding' ? shown.auctionEndsAt * 1000 : shown.endsAt * 1000,
      tokenSymbol: underlying,
      bids: sorted,
      winningPremium: premium,
      pastEpochs,
    };
  }, [shown, bids, epochs, price, underlying]);

  return (
    <>
      {epochsLoading || bidsLoading ? (
        <LiveEpochPanel
          loading
          epoch={0}
          phase="bidding"
          strikePrice={0}
          spotPrice={0}
          epochEndsAt={Date.now()}
          bids={[]}
        />
      ) : !shown || !panelProps ? (
        <EmptyState
          title="No epochs yet"
          description="This vault hasn't started its first epoch — check back once the keeper kicks it off."
        />
      ) : (
        <LiveEpochPanel {...panelProps} />
      )}

      <EpochHistory symbol={symbol} />

      <p className="font-body mx-auto mt-8 max-w-[68ch] text-[12px] leading-relaxed text-eque-muted">
        Anyone can bid — on testnet the protocol&apos;s market-maker bot keeps every
        auction live. The winning premium is compounded straight back into the
        vault; depositors never touch the auction themselves.
      </p>
    </>
  );
}

function AuctionPageInner() {
  const { chain } = useChain();
  const { vaults, isLoading, error } = useVaults();
  const searchParams = useSearchParams();
  const requested = searchParams.get('symbol');

  const symbols = useMemo(() => vaults.map((v) => v.symbol), [vaults]);
  const [selected, setSelected] = useState<string | null>(null);

  const active =
    (selected && symbols.includes(selected) ? selected : null) ??
    (requested && symbols.includes(requested) ? requested : null) ??
    symbols[0] ??
    null;

  useEffect(() => {
    document.title = active ? `Eque - Auction ${active}` : 'Eque - Auction';
    return () => {
      document.title = 'Eque';
    };
  }, [active]);

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-eque-hero sm:text-4xl">
        Auction
      </h1>
      <p className="font-body mt-2 max-w-[68ch] text-[13px] leading-relaxed text-eque-muted">
        Watch each epoch&apos;s covered-call auction clear in real time — no bidding
        needed to earn.
      </p>

      {error ? (
        <div className="mt-8">
          <AlertBanner
            status="error"
            title="Couldn't reach the API"
            message="Is NEXT_PUBLIC_API_URL set and the backend running?"
          />
        </div>
      ) : isLoading || !active ? (
        <div className="mt-8 h-72 animate-pulse border border-eque-line bg-eque-surface" />
      ) : (
        <>
          <Tabs
            tabs={symbols.map((s) => ({ value: s, label: s }))}
            value={active ?? undefined}
            onValueChange={(v) => setSelected(v)}
            className="mt-8"
            aria-label="Vaults"
          />

          <div className="mt-4" key={`${chain}:${active}`}>
            <AuctionDetail symbol={active} />
          </div>
        </>
      )}
    </>
  );
}

export default function AuctionPage() {
  return (
    <Suspense>
      <AuctionPageInner />
    </Suspense>
  );
}
