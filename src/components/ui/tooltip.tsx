"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "cn"

/**
 * Eque tooltip provider. DESIGN.md §7.8 specifies a 300ms open delay —
 * the stock primitive defaults to 0, so the delay is pinned here.
 */
function TooltipProvider({
  delay = 300,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

/**
 * Eque tooltip popup (DESIGN.md §7.8, TASKS.md 1.8).
 *
 * - `surface-high` bg, 1px `border-default`, `rounded-sm` (allowed for
 *   tooltips per §6.1), Caption (`font-body text-xs`) in `text-primary`,
 *   padding 6px × 10px (`py-1.5 px-2.5`).
 * - Open/close is a 200ms fade + zoom using the §8 default duration —
 *   same language as the select popup (Phase 1.3).
 * - The arrow is opt-in (`showArrow` on the atom): a plain rotated
 *   square in `surface-high`, no radius, keeping the sharp language.
 *
 * Every color, radius, font, and motion token comes from
 * `app/globals.css` — no raw hex, no arbitrary values.
 */
function TooltipContent({
  className,
  showArrow = false,
  side = "top",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    showArrow?: boolean
  }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          role="tooltip"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-sm border border-border-default bg-surface-high px-2.5 py-1.5 font-body text-xs text-text-primary data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:duration-default data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:duration-micro",
            className
          )}
          {...props}
        >
          {children}
          {showArrow ? (
            <TooltipPrimitive.Arrow
              data-slot="tooltip-arrow"
              className="z-50 size-2 rotate-45 bg-surface-high data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 data-[side=top]:-bottom-1"
            />
          ) : null}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
