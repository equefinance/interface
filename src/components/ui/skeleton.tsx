"use client"

import * as React from "react"
import { cn } from "cn"

/**
 * Eque skeleton primitive (TASKS.md 1.11).
 *
 * shadcn's default is `animate-pulse rounded-md bg-muted` — all three
 * are wrong here: radius must be sharp (`rounded-none`, DESIGN.md
 * §6.1), and bare `bg-muted` resolves to shadcn's oklch near-black
 * instead of an Eque token. The pulse block is `surface-high`
 * (`#1A222D`, the empty-block color shared with the progress track)
 * so placeholders sit one tonal layer above `surface` panels.
 * `animate-pulse` is Tailwind's default 2s loop; it freezes under the
 * global `prefers-reduced-motion` reset in `app/globals.css`.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-none bg-surface-high", className)}
      {...props}
    />
  )
}

export { Skeleton }
