"use client"

import * as React from "react"
import { Slider as BaseSlider } from "@base-ui/react/slider"
import {
  SliderControl,
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  type SliderSize,
} from "@/components/ui/slider"
import { cn } from "cn"

export type { SliderSize }

export interface SliderProps
  extends Omit<
    BaseSlider.Root.Props,
    "children" | "value" | "defaultValue" | "onValueChange" | "thumbAlignment"
  > {
  /** Thumb size: 12 / 16 / 20px squares. */
  size?: SliderSize
  /** Controlled values (one entry per thumb). */
  value?: number[]
  /** Uncontrolled initial values. Defaults to `[50]`. */
  defaultValue?: number[]
  onValueChange?: BaseSlider.Root.Props["onValueChange"]
  /** Accessible names for each thumb input. Falls back to "Value" (single) or "Value N" (multi). */
  thumbLabels?: string[]
  /** Visible caption above the slider. */
  label?: string
  /** Render the current value(s) beside the label. */
  showValue?: boolean
  /** Format a value for the readout and `aria-valuetext`. */
  formatValue?: (value: number) => string
}

/**
 * Eque slider atom (Slider 1.14) — single, range, and multi-thumb
 * selection for DeFi controls (allocation %, slippage, leverage,
 * rebalance bands). Sharp square thumbs (12/16/20px) with a 2px
 * `primary` border on the §6.1 sharp track language shared with the
 * progress bar. Keyboard comes from the nested native range inputs
 * (arrows/Home/End); each thumb carries its own accessible name.
 */
const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      size = "md",
      value,
      defaultValue,
      onValueChange,
      thumbLabels,
      label,
      showValue = false,
      formatValue = (v) => `${v}`,
      min = 0,
      max = 100,
      orientation = "horizontal",
      className,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    // Capture the mount-time default once: Base UI warns if the
    // `defaultValue` reference changes after init, and inline literals
    // (`defaultValue={[50]}`) are a new reference on every render.
    const [initialDefault] = React.useState<number[]>(
      defaultValue ?? [50]
    )
    const [uncontrolled, setUncontrolled] =
      React.useState<number[]>(initialDefault)
    const values = (isControlled ? value : uncontrolled) ?? [50]

    const handleChange: BaseSlider.Root.Props["onValueChange"] = (
      next,
      details
    ) => {
      const nextValues = Array.isArray(next) ? [...next] : [next]
      if (!isControlled) setUncontrolled(nextValues)
      onValueChange?.(next, details)
    }

    const getThumbLabel = (index: number) =>
      thumbLabels?.[index] ??
      (values.length > 1 ? `Value ${index + 1}` : "Value")

    return (
      <SliderRoot
        ref={ref}
        data-slot="eque-slider"
        data-size={size}
        value={isControlled ? value : undefined}
        defaultValue={isControlled ? undefined : initialDefault}
        onValueChange={handleChange}
        min={min}
        max={max}
        orientation={orientation}
        className={cn(
          "flex w-full flex-col gap-2",
          orientation === "vertical" && "w-fit items-center",
          className
        )}
        {...props}
      >
        {label || showValue ? (
          <div className="flex w-full items-baseline justify-between gap-4">
            {label ? (
              <span className="font-body text-xs text-text-secondary">
                {label}
              </span>
            ) : (
              <span />
            )}
            {showValue ? (
              <span className="font-heading text-xs text-text-primary tabular-nums">
                {values.map(formatValue).join(" – ")}
              </span>
            ) : null}
          </div>
        ) : null}
        <SliderControl>
          <SliderTrack size={size}>
            <SliderIndicator />
          </SliderTrack>
          {values.map((_, index) => (
            <SliderThumb
              key={index}
              index={index}
              size={size}
              getAriaLabel={getThumbLabel}
              getAriaValueText={(formatted, thumbValue) =>
                formatValue(thumbValue)
              }
            />
          ))}
        </SliderControl>
      </SliderRoot>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
