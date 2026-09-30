import * as React from "react"
import { LoaderCircle } from "lucide-react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import type { VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * Props for the Eque `Button` atom (TASKS.md 1.1, DESIGN.md §7.1).
 *
 * Wraps the restyled shadcn `button` primitive (`components/ui/button.tsx`)
 * and adds the `loading` pending state required by AGENTS.md §7.
 *
 * - `variant`: `primary` (default) · `secondary` · `tertiary` · `danger` · `icon`
 * - `size`: `sm` (32px) · `md` (44px, default) · `lg` (56px)
 * - `icon` buttons are square per size and **must** receive an `aria-label`,
 *   since they render no visible text.
 * - `danger` triggers a destructive action and must be paired with a
 *   confirmation step (dialog) in the UI layer — never fire it directly.
 */
export interface ButtonProps
  extends VariantProps<typeof buttonVariants>,
    Omit<ButtonPrimitive.Props, "ref"> {
  /**
   * Pending state: renders a spinner, disables interaction, and sets
   * `aria-busy`. On `icon` buttons the spinner replaces the icon; otherwise
   * it is prepended to the label.
   */
  loading?: boolean
  /** Forwarded ref to the underlying `<button>` element. */
  ref?: React.Ref<HTMLButtonElement>
}

/**
 * Eque Button — the single clickable action element for the whole kit.
 *
 * Label is always a verb (`Deposit`, `Save changes`) in Spline Sans Mono.
 * One `primary` button per section (DESIGN.md §7.1).
 */
function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ref,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  const spinner = (
    <LoaderCircle className="animate-spin" aria-hidden="true" />
  )

  return (
    <ButtonPrimitive
      data-slot="button"
      ref={ref as React.Ref<HTMLElement>}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {variant === "icon" ? (
        loading ? (
          spinner
        ) : (
          children
        )
      ) : (
        <>
          {loading ? spinner : null}
          {children}
        </>
      )}
    </ButtonPrimitive>
  )
}

export { Button }
