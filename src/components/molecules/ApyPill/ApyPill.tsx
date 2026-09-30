"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { Badge } from "@/components/atoms/Badge/Badge"
import { Tooltip } from "@/components/atoms/Tooltip/Tooltip"
import { MonoNumber } from "@/components/atoms/Typography/Typography"
import { formatPercentage } from "@/lib/utils"
import { cn } from "cn"

/**
 * Boost (percent units) at or above which the pill earns the sparkle
 * glyph. Sits above the highest mock boost (4.4) so only genuinely
 * boosted vaults — like the 8.2 example — light up.
 */
export const BOOST_SPARKLE_THRESHOLD = 5

export interface ApyPillProps {
  /** Base APY component, in percent units. */
  apyBase: number
  /** Reward APY component, in percent units. */
  apyReward: number
  /** Boost APY component, in percent units. */
  apyBoost: number
  /** Tooltip placement. */
  side?: "top" | "right" | "bottom" | "left"
  /** Extra classes merged onto the badge (tailwind-merge wins). */
  className?: string
}

/**
 * Eque APY pill molecule (2.2) — total APY (base + reward + boost) in
 * a brand badge; hover or keyboard focus opens the Tooltip breakdown
 * (Base / Reward / Boost rows in tabular Mono, reusing the 1.8
 * ApyBreakdown language). A negative total flips the badge to the
 * `error` variant (status tint + red total) so loss reads instantly —
 * color pairs with the minus sign, never alone (§9). A high boost
 * (`apyBoost >= BOOST_SPARKLE_THRESHOLD`) adds a `Sparkles` glyph
 * inside the pill — decorative (`aria-hidden`, the boost value is in
 * the breakdown) in the badge's own text color. The badge
 * trigger carries `tabIndex={0}` so keyboard users can open the
 * breakdown — Base UI clones handlers/ref/className (including the
 * focus-visible ring) onto the rendered element, but only a natively
 * focusable element receives focus. No ref is forwarded: the atom
 * renders no DOM of its own.
 */
function ApyPill({
  apyBase,
  apyReward,
  apyBoost,
  side = "top",
  className,
}: ApyPillProps) {
  const total = apyBase + apyReward + apyBoost
  const negative = total < 0
  const boosted = apyBoost >= BOOST_SPARKLE_THRESHOLD
  return (
    <Tooltip
      side={side}
      content={
        <span
          data-slot="apy-pill-breakdown"
          className="flex flex-col gap-1"
        >
          <MonoNumber>Base {formatPercentage(apyBase)}</MonoNumber>
          <MonoNumber>Reward {formatPercentage(apyReward)}</MonoNumber>
          <MonoNumber>Boost {formatPercentage(apyBoost)}</MonoNumber>
        </span>
      }
    >
      <Badge
        variant={negative ? "error" : "brand"}
        tabIndex={0}
        data-slot="apy-pill"
        data-negative={negative || undefined}
        className={cn(className)}
      >
        {/* Total keeps the badge's own text color: brand teal by
            default, error red when negative (tailwind-merge beats
            MonoNumber's `text-text-primary` either way). */}
        <MonoNumber className={negative ? "text-error" : "text-primary"}>
          {formatPercentage(total)} APY
        </MonoNumber>
        {boosted ? (
          <Sparkles
            data-slot="apy-pill-sparkle"
            aria-hidden="true"
            className="size-3 shrink-0"
            strokeWidth={2}
          />
        ) : null}
      </Badge>
    </Tooltip>
  )
}

export { ApyPill }
