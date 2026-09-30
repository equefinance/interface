"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge as BadgePrimitive } from "@/components/ui/badge"
import type { VariantProps } from "class-variance-authority"
import { badgeVariants } from "@/components/ui/badge"
import { cn } from "cn"

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual variant (DESIGN.md §7.5 + §2.6 status tints). */
  variant?: BadgeVariant
  /** Badge text. Uppercase is applied by CSS (the ≤11px badge exception, DESIGN §3.3). */
  children?: React.ReactNode
  /**
   * When provided, a close button renders inside the badge.
   * The parent owns removal (e.g. filter the chip out of state).
   */
  onRemove?: () => void
  /** Accessible name for the close button. */
  removeLabel?: string
}

/**
 * Eque badge/tag atom (DESIGN.md §7.5) — 24px sharp chip in Mono 11px
 * uppercase. Neutral and brand cover metadata; the five status variants
 * use the §2.6 tint bg + tint border + 300 text. Removable badges render
 * a keyboard-operable close button; status meaning always pairs the
 * color with the text label (never color alone, §2.6).
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "neutral",
      children,
      onRemove,
      removeLabel = "Remove",
      className,
      ...props
    },
    ref
  ) => {
    return (
      <BadgePrimitive
        ref={ref}
        variant={variant}
        className={cn(onRemove && "pr-1", className)}
        {...props}
      >
        {children}
        {onRemove ? (
          <button
            type="button"
            aria-label={
              typeof children === "string"
                ? `${removeLabel} ${children}`
                : removeLabel
            }
            onClick={onRemove}
            className={cn(
              "-mr-1 flex size-4 cursor-pointer items-center justify-center",
              "text-current transition-colors duration-micro ease-eque",
              "hover:bg-hover-overlay focus-visible:outline-2 focus-visible:outline-solid",
              "focus-visible:outline-primary focus-visible:outline-offset-1"
            )}
          >
            <X className="size-3" strokeWidth={2} strokeLinecap="square" aria-hidden="true" />
          </button>
        ) : null}
      </BadgePrimitive>
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
