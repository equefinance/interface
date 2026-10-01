"use client"

import * as React from "react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { MonoNumber } from "@/components/atoms/Typography/Typography"
import { formatPercentage } from "@/lib/utils"
import { cn } from "cn"

export type ChangeDirection = "up" | "down" | "flat"

export interface PercentageChangeIndicatorProps {
  /** Signed change in percent units (`2.34` → +2.34%). */
  value: number
  /** Fraction digits (default 2). */
  decimals?: number
  /** Prefix gains with `+` (default true). */
  showSign?: boolean
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string
}

const directionColor: Record<ChangeDirection, string> = {
  up: "text-success",
  down: "text-error",
  flat: "text-text-tertiary",
}

const directionIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const

/**
 * Eque percentage change indicator molecule (2.6) — direction glyph +
 * signed tabular percentage. Direction is derived from the value
 * rounded to `decimals` (so `0.001` reads flat `0.00%`, not a
 * phantom up-arrow); the arrow glyph and the `+`/`-` sign pair the
 * status color so direction is never color alone (§9). Glyph language
 * matches `StatCard`'s trend row (14px, square caps).
 */
function PercentageChangeIndicator({
  value,
  decimals = 2,
  showSign = true,
  className,
}: PercentageChangeIndicatorProps) {
  const rounded = Number(value.toFixed(decimals))
  const direction: ChangeDirection =
    rounded > 0 ? "up" : rounded < 0 ? "down" : "flat"
  const Icon = directionIcon[direction]
  const text = `${direction === "up" && showSign ? "+" : ""}${formatPercentage(value, decimals)}`

  return (
    <span
      data-slot="percentage-change"
      data-direction={direction}
      className={cn(
        "inline-flex items-center gap-1 font-heading text-xs font-medium",
        directionColor[direction],
        className
      )}
    >
      <Icon
        aria-hidden="true"
        size={14}
        strokeWidth={2}
        strokeLinecap="square"
        strokeLinejoin="miter"
        className="shrink-0"
      />
      <MonoNumber className="text-inherit">{text}</MonoNumber>
    </span>
  )
}

export { PercentageChangeIndicator }
