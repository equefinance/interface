"use client"

import * as React from "react"
import {
  Tooltip as TooltipPrimitive,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "cn"

export interface TooltipProps {
  /** Tooltip body. Keep it short — one line where possible. */
  content: React.ReactNode
  /**
   * Trigger element (e.g. an icon button) or plain text. Element
   * children are rendered as-is via the Base UI `render` prop so focus
   * and semantics stay on the real control; string children wrap in a
   * dotted-underline hint span.
   */
  children: React.ReactElement | string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  /** Open delay in ms (DESIGN.md §7.8: 300). */
  delay?: number
  /** Render the sharp arrow notch. Off by default. */
  showArrow?: boolean
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state (e.g. screenshot stories). */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Popup classes, merged over the primitive treatment. */
  contentClassName?: string
  /** Trigger classes (element triggers only). */
  triggerClassName?: string
}

/**
 * Eque tooltip atom (DESIGN.md §7.8) — `surface-high` popup with a
 * hairline border, `rounded-sm` corners, Caption text, 6×10 padding,
 * and a 300ms open delay. Opens on hover and on keyboard focus;
 * Escape dismisses. Decorative arrow glyph is opt-in.
 */
function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delay = 300,
  showArrow = false,
  open,
  defaultOpen,
  onOpenChange,
  contentClassName,
  triggerClassName,
}: TooltipProps) {
  const trigger =
    typeof children === "string" ? (
      <span className="cursor-help underline decoration-border-strong decoration-dotted underline-offset-4">
        {children}
      </span>
    ) : (
      children
    )

  // Base UI reads the open delay from the Provider, not the Root —
  // each atom carries its own so standalone usage keeps the §7.8 300ms.
  return (
    <TooltipProvider delay={delay}>
      <TooltipPrimitive
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
      <TooltipTrigger
        render={trigger}
        className={cn(
          "outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary focus-visible:outline-offset-2",
          triggerClassName
        )}
      />
      <TooltipContent
        side={side}
        align={align}
        showArrow={showArrow}
        className={contentClassName}
      >
        {content}
      </TooltipContent>
      </TooltipPrimitive>
    </TooltipProvider>
  )
}

export { Tooltip }
