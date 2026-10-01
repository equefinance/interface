"use client"

import * as React from "react"
import { Select } from "@/components/atoms/Select"
import { cn } from "cn"

/**
 * Minimal chain shape — structurally compatible with
 * `lib/mock-data/chains.ts`. Kept local so the registry item ships
 * zero mock-data imports.
 */
export interface NetworkChain {
  /** Chain id (e.g. `8453`). */
  id: number
  /** Display name, text only (AGENTS.md §1: no chain icon component). */
  name: string
  /** Per-chain icon image URL. Falls back to the `iconSrc` prop. */
  iconSrc?: string
}

/** Network artwork: 20px sharp image, decorative. Renders nothing when no `iconSrc` is provided. */
function NetworkArt({ src }: { src?: string }) {
  if (!src) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element -- consumer-supplied art, not a bundled asset
    <img
      src={src}
      alt=""
      aria-hidden="true"
      data-slot="network-art"
      width={20}
      height={20}
      className="size-5 shrink-0"
    />
  )
}

export interface NetworkSwitcherProps {
  /** Chains to offer. */
  chains: NetworkChain[]
  /** Selected chain id (controlled). */
  value?: number | null
  /** Initial chain id (uncontrolled). */
  defaultValue?: number | null
  /** Fires with the newly selected chain id. */
  onValueChange?: (chainId: number) => void
  /**
   * Network icon image URL (e.g. `https://…/base.png`). Rendered as
   * decorative 20px artwork before the chain name in the trigger and
   * popup rows. Per-chain `NetworkChain.iconSrc` wins when set. When
   * omitted everywhere, no artwork renders — the name text carries the
   * identity (AGENTS.md §1: no Network Icon component).
   */
  iconSrc?: string
  /**
   * When `false`, the closed trigger shows only the selected chain's
   * icon (no name text) — `[(icon) ˅]`. Popup rows always keep icon +
   * name so the list stays scannable.
   */
  showName?: boolean
  /** Placeholder shown before a chain is chosen. */
  placeholder?: string
  /** Disables the switcher. */
  disabled?: boolean
  /** Field id; auto-generated when omitted (label stays associated). */
  id?: string
  /** Extra classes merged onto the wrapper (tailwind-merge wins). */
  className?: string
}

/**
 * Eque network switcher molecule (2.5) — chain picker built on the
 * `Select` atom. Rows render the `iconSrc` artwork (decorative 20px,
 * consumer-supplied URL) before the chain name text — no icon
 * component is abstracted (AGENTS.md §1); the current chain is
 * highlighted in the popup by the atom's selected-item treatment
 * (primary tint + check indicator). The trigger is compact (`w-auto`);
 *
 * The accessible name comes from a native sr-only `<label>` bound to
 * the trigger id — the same pattern as TokenAmountInput: the Select
 * atom's own `label` slot renders a visible-height wrapper that would
 * break the trigger's compact sizing.
 */
function NetworkSwitcher({
  chains,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  iconSrc,
  showName = true,
  placeholder = "Select network",
  disabled = false,
  id: idProp,
  className,
}: NetworkSwitcherProps) {
  const generatedId = React.useId()
  const id = idProp ?? generatedId

  const [internalValue, setInternalValue] = React.useState<number | null>(
    defaultValue
  )
  const value = valueProp ?? internalValue

  const handleChange = (next: string | null) => {
    if (next == null) return
    const chainId = Number(next)
    if (valueProp === undefined) setInternalValue(chainId)
    onValueChange?.(chainId)
  }

  return (
    <div data-slot="network-switcher" className={cn("w-auto", className)}>
      <label htmlFor={id} className="sr-only">
        Network
      </label>
      <Select
        id={id}
        options={chains.map((chain) => {
          const art = chain.iconSrc ?? iconSrc
          return {
            value: String(chain.id),
            label: (
              <span className="flex items-center gap-1.5">
                <NetworkArt src={art} />
                <span className="font-heading text-sm text-text-primary">
                  {chain.name}
                </span>
              </span>
            ),
            // Icon-only trigger: popup rows keep icon + name.
            triggerLabel: showName ? undefined : <NetworkArt src={art} />,
          }
        })}
        value={value === null ? null : String(value)}
        onValueChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-auto"
        triggerClassName="w-auto"
      />
    </div>
  )
}

export { NetworkSwitcher }
