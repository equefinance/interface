"use client"

import * as React from "react"
import { OctagonAlert, ShieldCheck, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/atoms/Badge/Badge"
import { cn } from "cn"

export type RiskLevel = "low" | "medium" | "high"

export interface RiskLevelIndicatorProps {
  /** Risk tier: drives the badge variant, glyph, and label. */
  level: RiskLevel
  /** Extra classes merged onto the badge (tailwind-merge wins). */
  className?: string
}

const levelConfig: Record<
  RiskLevel,
  { variant: "success" | "warning" | "error"; label: string; Icon: typeof ShieldCheck }
> = {
  low: { variant: "success", label: "Low", Icon: ShieldCheck },
  medium: { variant: "warning", label: "Medium", Icon: TriangleAlert },
  high: { variant: "error", label: "High", Icon: OctagonAlert },
}

/**
 * Eque risk level indicator molecule (2.7) — status badge pairing a
 * glyph with the tier label, so risk is never color alone (§9).
 * Low reads `success`, medium `warning`, high `error`.
 */
function RiskLevelIndicator({ level, className }: RiskLevelIndicatorProps) {
  const { variant, label, Icon } = levelConfig[level]
  return (
    <Badge
      variant={variant}
      data-slot="risk-level"
      data-level={level}
      className={cn("gap-1.5", className)}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </Badge>
  )
}

export { RiskLevelIndicator }
