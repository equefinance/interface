import * as React from "react"
import { CircleAlert, CircleCheck } from "lucide-react"
import type { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"
import { Input as UiInput } from "@/components/ui/input"

/**
 * Strip anything that isn't a digit or a single decimal point, and cap the
 * fraction length. Keeps a trailing dot (`"12."`) so mid-typing states stay
 * editable. Token amounts are non-negative, so `-` is dropped.
 */
export function sanitizeAmount(raw: string, decimals?: number): string {
  let cleaned = raw.replace(/[^0-9.]/g, "")
  const firstDot = cleaned.indexOf(".")
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "")
  }
  if (decimals !== undefined && firstDot !== -1) {
    if (decimals === 0) {
      cleaned = cleaned.slice(0, firstDot)
    } else {
      const [int, frac = ""] = cleaned.split(".")
      cleaned = frac.length > 0 ? `${int}.${frac.slice(0, decimals)}` : `${int}.`
    }
  }
  return cleaned
}

/**
 * Props for the Eque `Input` atom (TASKS.md 1.2, DESIGN.md §7.2).
 *
 * - `variant: "text"` (default) — free text entry.
 * - `variant: "number"` — amount entry: renders `type="text"` with
 *   `inputMode="decimal"` (no native spinners) and sanitizes every change
 *   through {@link sanitizeAmount}; `decimals` caps fraction digits.
 * - `label` renders above the field (Mono 500 12px, 8px gap); always
 *   associated via `htmlFor` (auto `useId` when no `id` is passed).
 * - `error` (message string) takes precedence over `success` and renders a
 *   Caption message with an error icon (`role="alert"`).
 * - `success` shows the check icon; pair with `successMessage` for a caption.
 *   Show success only after validation, per DESIGN §7.2.
 * - `helperText` renders only when neither `error` nor `successMessage` is set.
 */
export interface InputProps extends Omit<InputPrimitive.Props, "ref"> {
  /** Text entry (default) or decimal amount entry with sanitization. */
  variant?: "text" | "number"
  /** Max fraction digits for `variant="number"` (e.g. a token's decimals). */
  decimals?: number
  /** Label rendered above the field. */
  label?: React.ReactNode
  /** Helper caption rendered below the field when there is no message. */
  helperText?: React.ReactNode
  /** Error message; puts the field in the error state. */
  error?: string
  /** Success state; show only after validation. */
  success?: boolean
  /** Optional success caption (requires `success`). */
  successMessage?: string
  /** Forwarded ref to the underlying `<input>` element. */
  ref?: React.Ref<HTMLInputElement>
}

function Input({
  variant = "text",
  decimals,
  label,
  helperText,
  error,
  success = false,
  successMessage,
  id: idProp,
  className,
  type,
  onChange,
  ref,
  ...props
}: InputProps) {
  const generatedId = React.useId()
  const id = idProp ?? generatedId
  const helperId = `${id}-helper`
  const messageId = `${id}-message`

  const hasError = error !== undefined && error !== ""
  const showSuccess = !hasError && success
  const status = hasError ? "error" : showSuccess ? "success" : "default"
  const showStatusIcon = hasError || showSuccess

  const describedBy =
    [hasError || (showSuccess && successMessage) ? messageId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(" ") || undefined

  const handleChange: NonNullable<InputPrimitive.Props["onChange"]> = (e) => {
    if (variant === "number") {
      const target = e.target as HTMLInputElement
      const cleaned = sanitizeAmount(target.value, decimals)
      if (cleaned !== target.value) target.value = cleaned
    }
    onChange?.(e)
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {label !== undefined ? (
        <label
          htmlFor={id}
          className="font-heading text-xs font-medium text-text-secondary"
        >
          {label}
        </label>
      ) : null}
      <div className="relative w-full">
        <UiInput
          id={id}
          ref={ref}
          status={status}
          type={variant === "number" ? "text" : (type ?? "text")}
          inputMode={variant === "number" ? "decimal" : undefined}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          onChange={handleChange}
          className={cn(showStatusIcon && "pr-11", className)}
          {...props}
        />
        {showStatusIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
          >
            {hasError ? (
              <CircleAlert className="size-4 text-error" />
            ) : (
              <CircleCheck className="size-4 text-success" />
            )}
          </span>
        ) : null}
      </div>
      {hasError ? (
        <p
          role="alert"
          id={messageId}
          className="flex items-center gap-1.5 font-body text-xs text-error-bright"
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      ) : showSuccess && successMessage ? (
        <p
          id={messageId}
          className="flex items-center gap-1.5 font-body text-xs text-success"
        >
          <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
          {successMessage}
        </p>
      ) : helperText ? (
        <p id={helperId} className="font-body text-xs text-tertiary">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

export { Input }
