"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

const Select = SelectPrimitive.Root

/**
 * Eque select trigger variants (DESIGN.md §7.2, TASKS.md 1.3).
 *
 * Same 44px / `rounded-sm` / surface treatment as the text input so the two
 * sit side-by-side in forms without visual drift:
 *
 * - `default`: border `border-default`, hover `border-strong`,
 *   focus border `primary` + halo shadow. A mouse click also focuses the
 *   trigger, so the open popup is always paired with the focus treatment —
 *   no separate `data-open` styling needed.
 * - `error` / `success`: locked border in every state (no halo — a teal glow
 *   on a red field would send mixed signals); pair with a message in the atom.
 *
 * Focus uses the DESIGN border+halo treatment *instead of* the global
 * `:focus-visible` outline (removed here with its replacement present, per
 * AGENTS.md §6) so the trigger never shows a doubled ring.
 */
const selectTriggerVariants = cva(
  "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-sm border bg-surface px-4 font-body text-base text-text-primary transition-colors duration-micro ease-eque outline-none hover:border-border-strong focus:border-primary focus:shadow-halo focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface disabled:text-disabled disabled:opacity-60 data-placeholder:text-text-muted [&[aria-expanded=true]_svg]:rotate-180 [&_svg]:pointer-events-none [&_svg]:shrink-0",
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

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 truncate text-left", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  status,
  children,
  ref,
  ...props
}: Omit<SelectPrimitive.Trigger.Props, "ref"> &
  VariantProps<typeof selectTriggerVariants> & {
    ref?: React.Ref<HTMLButtonElement>
  }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      ref={ref}
      className={cn(selectTriggerVariants({ status, className }))}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="size-4 shrink-0 text-text-secondary transition-transform duration-default ease-eque" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-sm border border-primary bg-primary-dark p-1 text-text-primary shadow-pixel duration-default ease-eque data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        "px-3 py-2 font-heading text-xs font-medium text-text-tertiary",
        className
      )}
      {...props}
    />
  )
}

/**
 * Option row: 44px minimum (touch target, DESIGN §9), DESIGN §7.7 table-row
 * language — `hover-overlay` wash on highlight, `primary-a08` tint + check
 * on the selected value (status is never color alone, DESIGN §9). Rows stay
 * sharp (`rounded-none` per DESIGN §6.1) inside the `rounded-sm` popup.
 */
function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-none px-3 py-2 pr-10 font-heading text-sm text-text-primary outline-none select-none data-highlighted:bg-hover-overlay data-selected:bg-primary-a16 data-disabled:cursor-not-allowed data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-3 flex items-center justify-center" />
        }
      >
        <CheckIcon className="text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border-subtle", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-primary-dark py-1 text-text-secondary [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-primary-dark py-1 text-text-secondary [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  selectTriggerVariants,
}
