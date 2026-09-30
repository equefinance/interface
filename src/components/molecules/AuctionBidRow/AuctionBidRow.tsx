"use client"

import * as React from "react"
import { Trophy } from "lucide-react"
import { WalletAddressChip } from "@/components/molecules/WalletAddressChip/WalletAddressChip"
import { MonoNumber } from "@/components/atoms/Typography/Typography"
import { formatNumber } from "@/lib/utils"
import { cn } from "cn"

export interface AuctionBidRowProps {
  /** Bidder address (`0x…`). */
  bidder: string
  /** Bid amount in token units. */
  amount: number
  /** Token symbol shown after the amount (e.g. `"mNVDA"`). */
  symbol?: string
  /** Fraction digits (default 4 — premiums are small). */
  decimals?: number
  /** Leading row: primary tint + trophy glyph. */
  isLeader?: boolean
  /** Extra classes merged onto the row (tailwind-merge wins). */
  className?: string
}

/**
 * Eque auction bid row molecule (bonus — outside the numbered TASKS.md plan) — dense tabular row for the
 * live bid feed: bidder chip left, tabular amount right. The leader
 * gets a primary tint and a trophy glyph plus a screen-reader
 * "Leading bid" marker (never color alone, §9).
 */
function AuctionBidRow({
  bidder,
  amount,
  symbol,
  decimals = 4,
  isLeader = false,
  className,
}: AuctionBidRowProps) {
  return (
    <div
      data-slot="auction-bid-row"
      data-leader={isLeader}
      className={cn(
        "flex items-center gap-3 px-3 py-2",
        isLeader && "bg-primary-a16",
        className
      )}
    >
      {isLeader ? (
        <>
          <Trophy
            aria-hidden="true"
            className="size-4 shrink-0 text-primary"
          />
          <span className="sr-only">Leading bid</span>
        </>
      ) : null}
      <WalletAddressChip address={bidder} className="min-w-0" />
      <MonoNumber className="ml-auto shrink-0 text-sm">
        {formatNumber(amount, decimals)}
        {symbol ? <span className="text-text-tertiary"> {symbol}</span> : null}
      </MonoNumber>
    </div>
  )
}

export { AuctionBidRow }
