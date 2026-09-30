"use client"

import * as React from "react"
import { MonoNumber } from "@/components/atoms/Typography/Typography"
import { cn } from "cn"

export interface EpochCountdownTimerProps {
  /** Target time — a `Date` or epoch-ms timestamp. */
  target: Date | number
  /** Fires once when the countdown reaches zero. */
  onExpire?: () => void
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string
}

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * Ticks once a second against `Date.now()`. The initial state is
 * computed at render so SSR shows a real value; the digits carry
 * `suppressHydrationWarning` because the client clock can cross a
 * second boundary between server render and hydration.
 */
function useNow(intervalMs = 1000) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

/**
 * Eque epoch countdown timer molecule (2.13) — `DD:HH:MM:SS` tabular
 * digits with a pulsing status dot while live. `role="timer"` keeps
 * assistive tech quiet (implicit `aria-live="off"`); the expired
 * state freezes at `00:00:00:00` with a static tertiary dot and fires
 * `onExpire` exactly once.
 */
function EpochCountdownTimer({
  target,
  onExpire,
  className,
}: EpochCountdownTimerProps) {
  const targetMs = target instanceof Date ? target.getTime() : target
  const now = useNow()
  const remainingMs = Math.max(0, targetMs - now)
  const expired = remainingMs <= 0

  const totalSeconds = Math.floor(remainingMs / 1000)
  const text = [
    pad(Math.floor(totalSeconds / 86400)),
    pad(Math.floor((totalSeconds % 86400) / 3600)),
    pad(Math.floor((totalSeconds % 3600) / 60)),
    pad(totalSeconds % 60),
  ].join(":")

  const firedRef = React.useRef(false)
  React.useEffect(() => {
    if (expired && !firedRef.current) {
      firedRef.current = true
      onExpire?.()
    }
    if (!expired) firedRef.current = false
  }, [expired, onExpire])

  return (
    <span
      role="timer"
      aria-label={`Time remaining: ${text}`}
      data-slot="epoch-countdown"
      data-state={expired ? "expired" : "live"}
      className={cn(
        "inline-flex items-center gap-2",
        expired && "opacity-70",
        className
      )}
    >
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        {!expired && (
          <span className="absolute inline-flex h-full w-full animate-ping bg-primary opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2",
            expired ? "bg-text-tertiary" : "bg-primary"
          )}
        />
      </span>
      <MonoNumber suppressHydrationWarning className="text-sm">
        {text}
      </MonoNumber>
    </span>
  )
}

export { EpochCountdownTimer }
