"use client"

import * as React from "react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { Divider } from "@/components/atoms/Divider/Divider"
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton"
import { Heading } from "@/components/atoms/Typography/Typography"
import { cn } from "cn"

export type StatCardTrendDirection = "up" | "down" | "flat"

export interface StatCardTrend {
  /** Trend direction: drives the glyph and the status color (never color alone). */
  direction: StatCardTrendDirection
  /** Trend caption, e.g. "+12.4% vs last week". */
  text: string
}

const trendVariants = cva(
  "flex items-center gap-2 font-heading text-xs font-medium",
  {
    variants: {
      direction: {
        up: "text-success",
        down: "text-error",
        flat: "text-text-tertiary",
      } satisfies Record<StatCardTrendDirection, string>,
    },
  }
)

export type StatCardTrendVariantProps = VariantProps<typeof trendVariants>

const trendIcon: Record<
  StatCardTrendDirection,
  typeof ArrowUpRight
> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card label (Mono 12px tertiary, §7.3 card structure). */
  label: string
  /** Big mono figure — a formatted string or a `MonoNumber` node. */
  value: React.ReactNode
  /** Optional trend row below a hairline divider. */
  trend?: StatCardTrend
  /** Pending state: keeps the label and shows a card skeleton block. */
  loading?: boolean
}

/**
 * Eque stat card molecule (2.1) — label + big mono value + optional
 * trend row on a primary-stroked frame (§7.3 structure with a
 * per-user-revision 1px `primary` border in place of the default
 * hairline — noted as a DESIGN.md §5.4 deviation in PROGRESS.md). The value
 * is a tabular `h3` so figures align; the trend pairs a square-cap
 * glyph with status-colored Mono text (status is never color alone,
 * §9). Non-interactive display card — no hover/press treatment.
 * `loading` swaps the value for the Skeleton card block.
 */
const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, trend, loading = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="stat-card"
        className={cn(
          "flex flex-col gap-3 rounded-none border border-primary bg-surface p-5 md:p-6",
          className
        )}
        {...props}
      >
        <div className="flex flex-col gap-2">
          <span
            data-slot="stat-card-label"
            className="font-heading text-xs font-medium text-text-tertiary"
          >
            {label}
          </span>
          {loading ? (
            <Skeleton variant="card" label={`Loading ${label}`} />
          ) : (
            <Heading
              level="h3"
              data-slot="stat-card-value"
              className="tabular-nums"
            >
              {value}
            </Heading>
          )}
        </div>
        {trend && !loading ? (
          <>
            <Divider />
            <p
              data-slot="stat-card-trend"
              data-direction={trend.direction}
              className={cn(trendVariants({ direction: trend.direction }))}
            >
              {React.createElement(trendIcon[trend.direction], {
                size: 14,
                strokeWidth: 2,
                strokeLinecap: "square",
                strokeLinejoin: "miter",
                "aria-hidden": true,
              })}
              <span>{trend.text}</span>
            </p>
          </>
        ) : null}
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard, trendVariants }
