"use client";

import * as React from "react";
import { cn } from "cn";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import {
  AuctionBidRow,
  type AuctionBidRowProps,
} from "@/components/molecules/AuctionBidRow/AuctionBidRow";
import { EpochCountdownTimer } from "@/components/molecules/EpochCountdownTimer/EpochCountdownTimer";
import type { LiveState } from "@/components/molecules/LiveBadge/LiveBadge";
import { StatCard } from "@/components/molecules/StatCard/StatCard";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";

export type EpochPhase = "bidding" | "settling" | "settled";

export interface EpochBid {
  bidder: string;
  amount: number;
}

export interface PastEpoch {
  epoch: number;
  premium: number;
}

export interface LiveEpochPanelProps {
  /** Current epoch number. */
  epoch: number;
  /** Epoch lifecycle phase. */
  phase: EpochPhase;
  /** Strike price in USD. */
  strikePrice: number;
  /** Spot price in USD. */
  spotPrice: number;
  /** Countdown target — a `Date` or epoch-ms timestamp. */
  epochEndsAt: Date | number;
  /** Token symbol for bid amounts (e.g. `"mNVDA"`). */
  tokenSymbol?: string;
  /** Bids, highest first. */
  bids: EpochBid[];
  /** Winning premium in USD (shown once settled). */
  winningPremium?: number;
  /** Past epochs summary strip. */
  pastEpochs?: PastEpoch[];
  /** Pending state: skeleton blocks. */
  loading?: boolean;
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string;
}

const phaseMeta: Record<EpochPhase, { state: LiveState; label: string }> = {
  bidding: { state: "live", label: "LIVE" },
  settling: { state: "upcoming", label: "SETTLING" },
  settled: { state: "ended", label: "SETTLED" },
};

const usd = (v: number, digits = 2) =>
  v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/**
 * Eque live epoch panel (bonus organism — outside the numbered TASKS.md
 * plan): the spectator view of the options auction. Header with live
 * badge + epoch number + countdown, strike/spot/winning-premium stat
 * cards (with an OTM/ITM moneyness badge), the live bid feed built
 * from AuctionBidRow, and an optional past-epochs strip.
 */
function LiveEpochPanel({
  epoch,
  phase,
  strikePrice,
  spotPrice,
  epochEndsAt,
  tokenSymbol = "mNVDA",
  bids,
  winningPremium,
  pastEpochs,
  loading = false,
  className,
}: LiveEpochPanelProps) {
  const { state, label } = phaseMeta[phase];
  const isOtm = strikePrice > spotPrice;
  const leader = bids[0];

  return (
    <section
      data-slot="live-epoch-panel"
      aria-label={`Epoch ${epoch} auction`}
      className={cn("border border-border-subtle bg-surface p-6", className)}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1.5">
          <span
            data-slot="epoch-status"
            className={cn(
              "font-mono text-xs font-bold uppercase tracking-[0.18em]",
              state === "live" && "text-success",
              state === "upcoming" && "text-warning",
              state === "ended" && "text-text-tertiary"
            )}
          >
            {label}
          </span>
          <h3 className="font-heading text-lg font-semibold text-text-primary">
            Epoch {epoch}
          </h3>
          {!loading && phase !== "settled" ? (
            <EpochCountdownTimer
              target={epochEndsAt}
              className="[&>span:last-child]:text-xs"
            />
          ) : null}
        </div>
        <Badge variant="neutral" title="Call option moneyness">
          {isOtm ? "Call OTM" : "Call ITM"}
        </Badge>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4" aria-label="Loading epoch">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Strike price" value={usd(strikePrice)} />
            <StatCard label="Spot price" value={usd(spotPrice)} />
            <StatCard
              label={phase === "settled" ? "Winning premium" : "Highest bid"}
              value={
                phase === "settled" && winningPremium != null
                  ? usd(winningPremium)
                  : leader
                    ? `${leader.amount.toFixed(4)} ${tokenSymbol}`
                    : "—"
              }
            />
          </div>

          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-heading text-sm font-semibold text-text-primary">
              Live bids
            </h4>
            <span className="font-mono text-xs text-text-tertiary">
              {bids.length} {bids.length === 1 ? "bid" : "bids"}
            </span>
          </div>
          {bids.length === 0 ? (
            <EmptyState
              title="No bids yet"
              description="Market makers place bids here once the epoch opens."
            />
          ) : (
            <ol
              className="max-h-64 overflow-y-auto border border-border-subtle"
              aria-label="Bid feed"
            >
              {bids.map((bid, i) => {
                const rowProps: AuctionBidRowProps = {
                  bidder: bid.bidder,
                  amount: bid.amount,
                  symbol: tokenSymbol,
                  isLeader: i === 0,
                };
                return (
                  <li key={bid.bidder} className="border-b border-border-subtle last:border-b-0">
                    <AuctionBidRow {...rowProps} />
                  </li>
                );
              })}
            </ol>
          )}

          {pastEpochs && pastEpochs.length > 0 ? (
            <div className="mt-6">
              <h4 className="mb-2 font-heading text-sm font-semibold text-text-primary">
                Past epochs
              </h4>
              <div className="flex flex-wrap gap-2">
                {pastEpochs.map((p) => (
                  <Badge key={p.epoch} variant="neutral" className="font-mono">
                    E{p.epoch} · {usd(p.premium)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export { LiveEpochPanel };
