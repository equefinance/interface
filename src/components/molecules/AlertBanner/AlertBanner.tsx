"use client"

import * as React from "react"
import {
  CircleCheck,
  Info,
  OctagonAlert,
  TriangleAlert,
  X,
} from "lucide-react"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/atoms/Button/Button"
import { cn } from "cn"

export type AlertStatus = "info" | "success" | "warning" | "error"

export interface AlertBannerProps {
  /** Status drives the tint, 2px left rail, and glyph. */
  status?: AlertStatus
  /** Bold headline (Body S, 500). */
  title: string
  /** Supporting copy (Body S, secondary). */
  message?: React.ReactNode
  /** Show a dismiss affordance. */
  dismissible?: boolean
  /** Fires when the dismiss button is pressed. */
  onDismiss?: () => void
  /** Extra classes merged onto the alert (tailwind-merge wins). */
  className?: string
}

const statusConfig: Record<
  AlertStatus,
  { Icon: typeof Info; frame: string; glyph: string; label: string }
> = {
  info: {
    Icon: Info,
    frame: "border-info-border bg-info-bg border-l-2 border-l-info",
    glyph: "text-info",
    label: "Information",
  },
  success: {
    Icon: CircleCheck,
    frame: "border-success-border bg-success-bg border-l-2 border-l-success",
    glyph: "text-success",
    label: "Success",
  },
  warning: {
    Icon: TriangleAlert,
    frame: "border-warning-border bg-warning-bg border-l-2 border-l-warning",
    glyph: "text-warning",
    label: "Warning",
  },
  error: {
    Icon: OctagonAlert,
    frame: "border-error-border bg-error-bg border-l-2 border-l-error",
    glyph: "text-error",
    label: "Error",
  },
}

/**
 * Eque alert/banner molecule (2.11) — one variant per status color
 * per DESIGN.md §7.6: status glyph + title + message, tinted bg
 * (10%), tinted border (32%) plus a 2px status rail on the left.
 * Status is never color alone: the glyph and `data-status` carry it
 * too. Optional dismiss button.
 */
function AlertBanner({
  status = "info",
  title,
  message,
  dismissible = false,
  onDismiss,
  className,
}: AlertBannerProps) {
  const { Icon, frame, glyph, label } = statusConfig[status]
  return (
    <Alert data-status={status} className={cn(frame, className)}>
      <Icon aria-hidden="true" className={glyph} />
      <span className="sr-only">{label}: </span>
      <AlertTitle>{title}</AlertTitle>
      {message ? <AlertDescription>{message}</AlertDescription> : null}
      {dismissible ? (
        <AlertAction>
          <Button
            type="button"
            variant="icon"
            size="sm"
            aria-label={`Dismiss ${label.toLowerCase()} alert`}
            onClick={onDismiss}
            className="border-transparent"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  )
}

export { AlertBanner }
