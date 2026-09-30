import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Eque badge variants (DESIGN.md §7.5, TASKS.md 1.7).
 *
 * - 24px tall (`h-6`), `px-2`, sharp (`rounded-none`), 1px border,
 *   Spline Sans Mono 500 11px uppercase (`tracking-badge` 0.04em).
 * - `neutral`: transparent, `border-default`, `text-secondary`.
 * - `brand`: `primary-a08` tint bg, `primary-a32`-ish tint border,
 *   `primary` text (≤10% rule — badges are the small-allowance surface).
 * - Status variants: tint bg + tint border + 300 text from DESIGN §2.6.
 *
 * Every color, radius, font, and motion token comes from
 * `app/globals.css` — no raw hex, no arbitrary values.
 */
const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-none border border-transparent px-2 font-heading text-[11px] font-medium tracking-badge whitespace-nowrap uppercase transition-colors duration-micro ease-eque outline-none select-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary focus-visible:outline-offset-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "border-border-default bg-transparent text-text-secondary",
        brand:
          "border-primary-a32 bg-primary-a08 text-primary",
        success:
          "border-success-border bg-success-bg text-success-bright",
        warning:
          "border-warning-border bg-warning-bg text-warning-bright",
        info: "border-info-border bg-info-bg text-info-bright",
        error:
          "border-error-border bg-error-bg text-error-bright",
        danger:
          "border-danger-border bg-danger-bg text-danger-bright",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
