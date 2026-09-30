import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Eque input variants (DESIGN.md §7.2, TASKS.md 1.2).
 *
 * Single 44px height, `rounded-sm` (0.25rem — the only permitted radius
 * besides sharp per DESIGN §6.1), surface bg, hairline border.
 *
 * - `default`: border `border-default`, hover `border-strong`,
 *   focus border `primary` + halo shadow.
 * - `error`: border `error` in every state (no halo — a teal glow on a red
 *   field would send mixed signals); pair with an error message in the atom.
 * - `success`: border `success` in every state; shown only after validation.
 *
 * Focus uses the DESIGN border+halo treatment *instead of* the global
 * `:focus-visible` outline (removed here with its replacement present, per
 * AGENTS.md §6) so inputs never show a doubled ring.
 */
const inputVariants = cva(
  "h-11 w-full min-w-0 rounded-sm border bg-surface px-4 font-body text-base text-text-primary transition-colors duration-micro ease-eque outline-none placeholder:text-text-muted hover:border-border-strong focus:border-primary focus:shadow-halo focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface disabled:text-disabled disabled:opacity-60",
  {
    variants: {
      status: {
        default: "border-border-default",
        error:
          "border-error hover:border-error focus:border-error focus:shadow-none",
        success:
          "border-success hover:border-success focus:border-success focus:shadow-none",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
)

function Input({
  className,
  status,
  type,
  ref,
  ...props
}: Omit<InputPrimitive.Props, "ref"> &
  VariantProps<typeof inputVariants> & {
    ref?: React.Ref<HTMLInputElement>
  }) {
  return (
    <InputPrimitive
      data-slot="input"
      type={type}
      ref={ref as React.Ref<HTMLElement>}
      className={cn(inputVariants({ status, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
