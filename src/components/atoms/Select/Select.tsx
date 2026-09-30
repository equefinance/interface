import * as React from "react"
import { CircleAlert, CircleCheck } from "lucide-react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "@/lib/utils"
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** One option in the Eque `Select` atom. */
export interface SelectOption {
  /** Stable value passed to `onValueChange`. */
  value: string
  /** Row content (plain text in every story; accepts nodes). */
  label: React.ReactNode
  /** Disabled rows render dimmed and skip highlight/selection. */
  disabled?: boolean
}

/**
 * Props for the Eque `Select` atom (TASKS.md 1.3, DESIGN.md §7.2).
 *
 * Single-select only. The trigger shares the input atom's 44px / `rounded-sm`
 * / surface treatment so the two sit side-by-side in forms without drift.
 * Root props (`value`, `defaultValue`, `onValueChange`, `open`,
 * `defaultOpen`, `onOpenChange`, `disabled`, `name`, …) pass straight through
 * to the Base UI root — the atom adds no event wrapping, so the
 * `BaseUIEvent` handler typing from Phase 1.2 never comes into play here.
 *
 * - `options` renders the popup rows (`label` text, `disabled` rows allowed).
 * - `label` renders above the field (Mono 500 12px, 8px gap); associated via
 *   `htmlFor` (auto `useId` when no `id` is passed).
 * - `error` (message string) takes precedence over `success` and renders a
 *   Caption message with an error icon (`role="alert"`).
 * - `success` shows the validated state; pair with `successMessage`.
 * - `helperText` renders only when neither `error` nor `successMessage` is set.
 */
export interface SelectProps
  extends Omit<
    SelectPrimitive.Root.Props<string, false>,
    "children" | "multiple" | "ref"
  > {
  /** Popup rows. */
  options: SelectOption[]
  /** Placeholder shown before a value is chosen (muted `#718094`). */
  placeholder?: string
  /** Label rendered above the field. */
  label?: React.ReactNode
  /** Helper caption rendered below the field when there is no message. */
  helperText?: React.ReactNode
  /** Error message; puts the trigger in the error state. */
  error?: string
  /** Success state; show only after validation. */
  success?: boolean
  /** Optional success caption (requires `success`). */
  successMessage?: string
  /** Extra classes for the outer wrapper. */
  className?: string
  /** Extra classes for the trigger element. */
  triggerClassName?: string
  /** Forwarded ref to the underlying trigger `<button>`. */
  ref?: React.Ref<HTMLButtonElement>
}

function Select({
  options,
  placeholder,
  label,
  helperText,
  error,
  success = false,
  successMessage,
  id: idProp,
  disabled,
  className,
  triggerClassName,
  ref,
  ...props
}: SelectProps) {
  const generatedId = React.useId()
  const id = idProp ?? generatedId
  const helperId = `${id}-helper`
  const messageId = `${id}-message`

  const hasError = error !== undefined && error !== ""
  const showSuccess = !hasError && success
  const status = hasError ? "error" : showSuccess ? "success" : "default"

  const describedBy =
    [hasError || (showSuccess && successMessage) ? messageId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {label !== undefined ? (
        <label
          htmlFor={id}
          className="font-heading text-xs font-medium text-text-secondary"
        >
          {label}
        </label>
      ) : null}
      <UiSelect disabled={disabled} {...props}>
        <SelectTrigger
          id={id}
          ref={ref}
          status={status}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={triggerClassName}
        >
          <SelectValue placeholder={placeholder}>
            {(current: string | null) =>
              current === null || current === undefined
                ? placeholder
                : (options.find((option) => option.value === current)?.label ??
                  current)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </UiSelect>
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

export { Select }
