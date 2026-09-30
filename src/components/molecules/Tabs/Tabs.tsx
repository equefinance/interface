"use client"

import * as React from "react"
import {
  Tabs as UiTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "cn"

/** One tab: label in the tab row, optional panel content. */
export interface TabDef {
  /** Stable value identifying the tab. */
  value: string
  /** Tab row label. */
  label: React.ReactNode
  /** Panel rendered when the tab is active. */
  content?: React.ReactNode
  /** Disabled tabs are skipped by keyboard navigation. */
  disabled?: boolean
}

export interface TabsProps {
  /** Tabs to render. */
  tabs: TabDef[]
  /** Controlled active value. */
  value?: string
  /** Uncontrolled initial active value (defaults to the first tab). */
  defaultValue?: string
  /** Fires with the new active value. */
  onValueChange?: (value: string) => void
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string
}

/**
 * Eque tabs molecule (2.9) — underline-active style per DESIGN.md
 * §7.5: active label in primary with a 2px bottom rail, inactive
 * labels secondary, no filled pills. Arrow-key navigation comes
 * from the Base UI primitive (roving tabindex); disabled tabs are
 * skipped.
 */
function Tabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
}: TabsProps) {
  return (
    <UiTabs
      data-slot="eque-tabs"
      value={value}
      defaultValue={defaultValue ?? tabs[0]?.value}
      onValueChange={(next) => onValueChange?.(next)}
      className={cn("w-full", className)}
    >
      <TabsList variant="line" className="w-full justify-start">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            data-value={tab.value}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) =>
        tab.content ? (
          <TabsContent key={tab.value} value={tab.value} className="pt-4">
            {tab.content}
          </TabsContent>
        ) : null
      )}
    </UiTabs>
  )
}

export { Tabs }
