"use client"

import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

export type { ToasterProps }
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

/**
 * Eque-styled sonner Toaster. Sharp hairline toasts, bottom-right,
 * 360px wide, z-500 per DESIGN.md §7.6. Mount once near the root;
 * fire toasts via `toast` from "sonner" or the `notify` helpers on
 * the Toaster molecule.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      gap={8}
      icons={{
        success: <CircleCheckIcon className="size-4 shrink-0 text-success" />,
        info: <InfoIcon className="size-4 shrink-0 text-info" />,
        warning: <TriangleAlertIcon className="size-4 shrink-0 text-warning" />,
        error: <OctagonXIcon className="size-4 shrink-0 text-error" />,
        loading: (
          <Loader2Icon className="size-4 shrink-0 animate-spin text-primary" />
        ),
      }}
      style={
        {
          "--width": "360px",
          "--normal-bg": "var(--color-surface)",
          "--normal-text": "var(--color-text-primary)",
          "--normal-border": "var(--color-border-subtle)",
          "--border-radius": "0px",
          zIndex: 500,
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "font-body",
          title: "font-body text-sm font-medium text-text-primary",
          description: "font-body text-sm text-text-secondary",
          actionButton:
            "rounded-none bg-primary font-heading text-xs text-on-primary",
          cancelButton:
            "rounded-none border border-border-default font-heading text-xs text-text-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
