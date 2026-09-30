"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Skeleton as SkeletonPrimitive } from "@/components/ui/skeleton"
import { cn } from "cn"

const skeletonVariants = cva("", {
  variants: {
    variant: {
      text: "h-4 w-full",
      card: "h-24 w-full",
      row: "w-full",
    },
  },
  defaultVariants: {
    variant: "text",
  },
})

export type SkeletonVariant = NonNullable<
  VariantProps<typeof skeletonVariants>["variant"]
>

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof skeletonVariants> {
  /**
   * Screen-reader text for the placeholder. Defaults to
   * "Loading content"; stays visually hidden.
   */
  label?: string
}

/**
 * Eque skeleton loader atom (1.11) — sharp `surface-high` pulse blocks
 * for pending content. `text` is a single 16px line, `card` a 96px
 * block, `row` a vault-table-style row (ticker square + two lines +
 * right-aligned figure). The blocks are `aria-hidden`; the wrapper
 * exposes `role="status"` with an author label (a `status` name never
 * comes from contents — same rule as the Spinner atom).
 */
const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(
  ({ variant = "text", label = "Loading content", className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="eque-skeleton"
        data-variant={variant}
        role="status"
        aria-label={label}
        className={cn("block", className)}
        {...props}
      >
        {variant === "row" ? (
          <span className="flex items-center gap-3" aria-hidden="true">
            <span className="size-10 shrink-0 animate-pulse rounded-none bg-surface-high" />
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="h-4 w-3/4 animate-pulse rounded-none bg-surface-high" />
              <span className="h-3 w-1/2 animate-pulse rounded-none bg-surface-high" />
            </span>
            <span className="h-4 w-16 shrink-0 animate-pulse rounded-none bg-surface-high" />
          </span>
        ) : (
          <SkeletonPrimitive className={cn(skeletonVariants({ variant }))} />
        )}
        <span className="sr-only">{label}</span>
      </span>
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton, skeletonVariants }
