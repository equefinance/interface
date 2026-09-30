"use client"

import * as React from "react"
import { cn } from "cn"

export interface EmptyStateProps {
  /** Headline (heading font). */
  title: string
  /** Supporting copy (body, secondary). */
  description?: React.ReactNode
  /** Optional call-to-action (usually a Button). */
  action?: React.ReactNode
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string
}

/**
 * Eque empty state molecule (2.14) — icon-less illustration built
 * from the pixel dot-grid motif (DESIGN.md §6.2) framed by corner
 * brackets, then a message and an optional CTA. Used wherever a
 * list, feed, or panel has nothing to show yet.
 */
function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex w-full flex-col items-center gap-4 px-6 py-12 text-center",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="relative size-24"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-primary) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
          backgroundPosition: "center",
          maskImage:
            "radial-gradient(circle at center, black 30%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 30%, transparent 72%)",
        }}
      >
        <span className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-primary-a32" />
        <span className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-primary-a32" />
        <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-primary-a32" />
        <span className="absolute right-0 bottom-0 h-4 w-4 border-b-2 border-r-2 border-primary-a32" />
      </div>
      <div className="flex max-w-sm flex-col gap-1.5">
        <p className="font-heading text-base font-medium text-text-primary">
          {title}
        </p>
        {description ? (
          <p className="font-body text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

export { EmptyState }
