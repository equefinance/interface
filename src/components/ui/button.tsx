import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Eque button variants (DESIGN.md §7.1, TASKS.md 1.1).
 *
 * - `primary`: solid fill, stepped (`pixel-notch`) corners, neon glow on hover.
 * - `secondary`: transparent, hairline border, corner `bracket`s.
 * - `tertiary`: borderless text button, underline on hover.
 * - `danger`: solid destructive fill (requires confirmation in the UI layer).
 * - `icon`: square icon-only button; combine with `size` (sm/md/lg).
 *
 * Sizes follow DESIGN.md §7.1: sm 32px / md 44px (default) / lg 56px.
 * Every color, radius, font, shadow, and motion token comes from
 * `app/globals.css` — no raw hex, no arbitrary values.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-none border border-transparent font-heading font-medium tracking-button whitespace-nowrap transition-colors duration-micro ease-eque outline-none select-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "press-feedback pixel-notch bg-primary text-on-primary hover:bg-primary-hover hover:shadow-neon active:translate-y-px active:bg-primary-pressed active:shadow-none disabled:bg-surface-high disabled:text-text-disabled disabled:shadow-none",
        secondary:
          "press-feedback bracket border-border-default bg-transparent text-primary hover:border-border-accent hover:bg-primary-a08 hover:shadow-neon active:translate-y-px active:bg-primary-a16 active:shadow-none disabled:border-border-subtle disabled:text-text-disabled",
        tertiary:
          "bg-transparent text-text-primary hover:text-primary hover:underline hover:decoration-1 hover:underline-offset-4 active:text-primary-pressed disabled:text-text-disabled disabled:no-underline",
        danger:
          "bg-danger text-white hover:bg-danger-bright hover:text-ink-on-fill active:bg-danger-pressed active:text-white disabled:bg-surface-high disabled:text-text-disabled",
        icon:
          "press-feedback border-border-default bg-transparent text-text-primary hover:border-border-accent hover:bg-primary-a08 hover:text-primary active:bg-primary-a16 disabled:border-border-subtle disabled:text-text-disabled",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg:not([class*='size-'])]:size-4",
        md: "h-11 px-6 text-sm [&_svg:not([class*='size-'])]:size-5",
        lg: "h-14 px-8 text-base [&_svg:not([class*='size-'])]:size-5",
      },
    },
    compoundVariants: [
      { variant: "icon", size: "sm", className: "size-8 px-0" },
      { variant: "icon", size: "md", className: "size-11 px-0" },
      { variant: "icon", size: "lg", className: "size-14 px-0" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant,
  size,
  ref,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    ref?: React.Ref<HTMLButtonElement>
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      ref={ref as React.Ref<HTMLElement>}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
