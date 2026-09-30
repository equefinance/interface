"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "@/components/ui/separator"
import type { VariantProps } from "class-variance-authority"
import { separatorVariants } from "@/components/ui/separator"
import { cn } from "cn"

export type DividerOrientation = NonNullable<
  VariantProps<typeof separatorVariants>["orientation"]
>

export interface DividerProps
  extends React.ComponentProps<typeof SeparatorPrimitive> {
  /** `horizontal` (section break) or `vertical` (column divider). */
  orientation?: DividerOrientation
}

/**
 * Eque divider atom (1.12) — the 1px `border-subtle` hairline for
 * section breaks (horizontal) and column splits (vertical, stretch to
 * the flex-row height). Non-interactive by design; Base UI provides
 * `role="separator"` semantics.
 */
const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = "horizontal", className, ...props }, ref) => {
    return (
      <SeparatorPrimitive
        ref={ref}
        data-slot="eque-divider"
        orientation={orientation}
        className={cn(
          orientation === "vertical" && "h-auto self-stretch",
          className
        )}
        {...props}
      />
    )
  }
)
Divider.displayName = "Divider"

export { Divider }
