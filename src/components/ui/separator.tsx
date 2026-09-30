"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const separatorVariants = cva("shrink-0 bg-border-subtle", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

/**
 * Eque separator primitive (TASKS.md 1.12, DESIGN.md §4.3 + §5.4).
 *
 * The 1px hairline (`#1A222D` → `border-subtle`) for section breaks
 * and card dividers. Base UI owns the semantics (`role="separator"`
 * + `aria-orientation`); this file owns only the token styling.
 */
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props &
  VariantProps<typeof separatorVariants>) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(separatorVariants({ orientation }), className)}
      {...props}
    />
  )
}

export { Separator, separatorVariants }
