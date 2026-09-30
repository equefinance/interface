"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const headingVariants = cva("", {
  variants: {
    level: {
      display: "type-display",
      h1: "type-h1",
      h2: "type-h2",
      h3: "type-h3",
      h4: "type-h4",
      h5: "type-h5",
    },
  },
  defaultVariants: {
    level: "h2",
  },
})

export type HeadingLevel = NonNullable<
  VariantProps<typeof headingVariants>["level"]
>

const headingElement: Record<HeadingLevel, "h1" | "h2" | "h3" | "h4" | "h5"> =
  {
    display: "h1",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
  }

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Type-scale level (DESIGN.md §3.2). */
  level?: HeadingLevel
  /** Semantic element; defaults to the level (`display` → `h1`). */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  children?: React.ReactNode
}

/**
 * Eque heading (1.13) — Spline Sans Mono at the §3.2 scale with fluid
 * `clamp()` sizes. Sentence case, left-aligned, `text-primary` by
 * default (§3.3); override color/align via `className`.
 */
const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = "h2", as, className, ...props }, ref) => {
    const Tag = (as ?? headingElement[level]) as "h1"
    return (
      <Tag
        ref={ref as React.Ref<HTMLHeadingElement>}
        data-slot="heading"
        data-level={level}
        className={cn(headingVariants({ level }), className)}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

const textVariants = cva("", {
  variants: {
    variant: {
      lead: "type-lead",
      "body-l": "type-body-l",
      "body-m": "type-body-m",
      "body-s": "type-body-s",
      caption: "type-caption",
    },
  },
  defaultVariants: {
    variant: "body-m",
  },
})

export type TextVariant = NonNullable<
  VariantProps<typeof textVariants>["variant"]
>

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Type-scale variant (DESIGN.md §3.2). */
  variant?: TextVariant
  /** Semantic element; defaults to `p`. */
  as?: "p" | "span" | "div"
  children?: React.ReactNode
}

/**
 * Eque body text (1.13) — Google Sans (Inter fallback) paragraphs at
 * the §3.2 scale. Default `body-m` caps at `max-w-prose`-width
 * contexts per the §3.3 65ch line-length rule (set the container, not
 * the atom); `caption` renders `text-tertiary` meta text.
 */
const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant = "body-m", as = "p", className, ...props }, ref) => {
    const Tag = as as "p"
    return (
      <Tag
        ref={ref as React.Ref<HTMLParagraphElement>}
        data-slot="text"
        data-variant={variant}
        className={cn(textVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export interface MonoNumberProps extends React.HTMLAttributes<HTMLElement> {
  /** Semantic element; defaults to `span`. */
  as?: "span" | "div" | "td"
  children?: React.ReactNode
}

/**
 * Eque mono number (1.13) — Spline Sans Mono with tabular figures for
 * metrics, prices, and table numbers so digits align (§3.3). Inherits
 * surrounding size; pairs with `lib` formatters in stories.
 */
const MonoNumber = React.forwardRef<HTMLElement, MonoNumberProps>(
  ({ as = "span", className, ...props }, ref) => {
    const Tag = as as "span"
    return (
      <Tag
        ref={ref as React.Ref<HTMLElement>}
        data-slot="mono-number"
        className={cn("font-heading tabular-nums text-text-primary", className)}
        {...props}
      />
    )
  }
)
MonoNumber.displayName = "MonoNumber"

export { Heading, headingVariants, Text, textVariants, MonoNumber }
