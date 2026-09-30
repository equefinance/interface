"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Eque slider primitive (Slider 1.14, DESIGN.md §6.1 sharp language).
 *
 * - Control: 44px touch target (h-11 horizontal, w-11 vertical),
 *   `touch-none select-none`.
 * - Track: sharp (`rounded-none`), `surface-high` — the same track
 *   language as the progress bar (1.9). Thickness follows size.
 * - Indicator: `primary` fill; dims to `border-strong` when disabled.
 * - Thumb: sharp square with a 2px `primary` border on `surface`;
 *   hover raises the `halo` glow, keyboard focus shows the 2px primary
 *   ring (`has-focus-visible` — focus lands on the nested native
 *   input), drag fills `primary` with the neon glow.
 *
 * Every color, radius, font, and motion token comes from
 * `app/globals.css` — no raw hex, no arbitrary values.
 */

const sliderTrackVariants = cva(
  "relative grow overflow-hidden rounded-none bg-surface-high select-none data-horizontal:w-full data-vertical:h-full",
  {
    variants: {
      size: {
        sm: "data-horizontal:h-1 data-vertical:w-1",
        md: "data-horizontal:h-2 data-vertical:w-2",
        lg: "data-horizontal:h-3 data-vertical:w-3",
      },
    },
    defaultVariants: { size: "md" },
  }
)

const sliderThumbVariants = cva(
  [
    "relative block shrink-0 cursor-grab touch-none rounded-none border-2 border-primary bg-surface select-none",
    "transition-shadow duration-micro ease-eque",
    "hover:shadow-halo",
    "has-focus-visible:outline-2 has-focus-visible:outline-solid has-focus-visible:outline-primary has-focus-visible:outline-offset-2",
    "data-dragging:cursor-grabbing data-dragging:bg-primary data-dragging:shadow-neon",
    "data-disabled:cursor-not-allowed data-disabled:border-border-strong data-disabled:bg-surface-high data-disabled:shadow-none",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "size-3",
        md: "size-4",
        lg: "size-5",
      },
    },
    defaultVariants: { size: "md" },
  }
)

export type SliderSize = NonNullable<
  VariantProps<typeof sliderThumbVariants>["size"]
>

function SliderRoot({
  className,
  thumbAlignment = "edge",
  ...props
}: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      thumbAlignment={thumbAlignment}
      className={cn(
        "data-horizontal:w-full data-vertical:h-full",
        className
      )}
      {...props}
    />
  )
}

function SliderControl({
  className,
  ...props
}: SliderPrimitive.Control.Props) {
  return (
    <SliderPrimitive.Control
      data-slot="slider-control"
      className={cn(
        "relative flex touch-none items-center select-none",
        "data-horizontal:h-11 data-horizontal:w-full",
        "data-vertical:h-full data-vertical:min-h-40 data-vertical:w-11 data-vertical:flex-col data-vertical:justify-center",
        className
      )}
      {...props}
    />
  )
}

function SliderTrack({
  className,
  size,
  ...props
}: SliderPrimitive.Track.Props & VariantProps<typeof sliderTrackVariants>) {
  return (
    <SliderPrimitive.Track
      data-slot="slider-track"
      className={cn(sliderTrackVariants({ size }), className)}
      {...props}
    />
  )
}

function SliderIndicator({
  className,
  ...props
}: SliderPrimitive.Indicator.Props) {
  return (
    <SliderPrimitive.Indicator
      data-slot="slider-indicator"
      className={cn(
        "bg-primary select-none data-horizontal:h-full data-vertical:w-full",
        "data-disabled:bg-border-strong",
        className
      )}
      {...props}
    />
  )
}

function SliderThumb({
  className,
  size,
  ...props
}: SliderPrimitive.Thumb.Props & VariantProps<typeof sliderThumbVariants>) {
  return (
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      className={cn(sliderThumbVariants({ size }), className)}
      {...props}
    />
  )
}

export {
  SliderRoot,
  SliderControl,
  SliderTrack,
  SliderIndicator,
  SliderThumb,
  sliderTrackVariants,
  sliderThumbVariants,
}
