"use client"

import * as React from "react"
import { cn } from "cn"

export type LiveState = "live" | "upcoming" | "ended"

export interface LiveBadgeProps {
  /** live: pulsing teal dot; upcoming: static info dot; ended: static dim dot. */
  state?: LiveState
  /** Label override (defaults: LIVE / UPCOMING / ENDED). */
  label?: string
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string
}

const stateConfig: Record<LiveState, { dot: string; text: string; label: string }> = {
  live: {
    dot: "bg-primary",
    text: "text-primary",
    label: "Live",
  },
  upcoming: {
    dot: "bg-info",
    text: "text-info",
    label: "Upcoming",
  },
  ended: {
    dot: "bg-text-tertiary",
    text: "text-text-tertiary",
    label: "Ended",
  },
}

/**
 * Eque live badge (bonus molecule) — status dot + uppercase mono
 * label for time-sensitive surfaces like the epoch auction page.
 * The live dot pulses (collapses to static under
 * `prefers-reduced-motion`); other states are static dots so the
 * state is never motion alone.
 */
function LiveBadge({ state = "live", label, className }: LiveBadgeProps) {
  const { dot, text, label: defaultLabel } = stateConfig[state]
  return (
    <span
      data-slot="live-badge"
      data-state={state}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 font-heading text-[11px] font-medium tracking-badge whitespace-nowrap uppercase",
        text,
        className
      )}
    >
      <span className="relative flex size-2">
        {state === "live" ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute inline-flex h-full w-full animate-ping opacity-60",
              dot
            )}
          />
        ) : null}
        <span aria-hidden="true" className={cn("relative inline-flex size-2", dot)} />
      </span>
      {label ?? defaultLabel}
      <span className="sr-only">
        {state === "live" ? " (happening now)" : ""}
      </span>
    </span>
  )
}

export { LiveBadge }
