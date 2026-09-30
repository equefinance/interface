"use client"

import * as React from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { Badge } from "@/components/atoms/Badge/Badge"
import { Tooltip } from "@/components/atoms/Tooltip/Tooltip"
import { MonoNumber } from "@/components/atoms/Typography/Typography"
import { truncateAddress } from "@/lib/utils"
import { cn } from "cn"

/**
 * Copy text with a `textarea` + `execCommand` fallback for contexts
 * where the async Clipboard API is unavailable (non-secure origins,
 * denied permissions). Returns whether the copy succeeded.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.setAttribute("readonly", "")
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export interface WalletAddressChipProps {
  /** Full wallet address (`0x…`, 42 chars typical). */
  address: string
  /**
   * Block-explorer URL for the address (e.g.
   * `https://sepolia.basescan.org/address/0x…`). When omitted, no
   * explorer icon renders.
   */
  explorerUrl?: string
  /** Leading chars kept by truncation, incl. `0x` (default 6). */
  leadingChars?: number
  /** Trailing chars kept by truncation (default 4). */
  trailingChars?: number
  /** "Copied" feedback duration in ms (default 1600). */
  copiedDurationMs?: number
  /** Extra classes merged onto the badge (tailwind-merge wins). */
  className?: string
}

/**
 * Eque wallet address chip molecule (2.4) — truncated address
 * (`truncateAddress`) in a neutral badge with tabular Mono, a
 * copy-to-clipboard button, and an optional block-explorer link.
 *
 * Hovering or keyboard-focusing the address opens a Tooltip with the
 * full address. Copying swaps the icon to a success `Check` and flips
 * the button tooltip to "Copied!" for `copiedDurationMs`; an
 * `aria-live` region announces the feedback to screen readers. The
 * explorer anchor opens in a new tab with `rel="noreferrer"`.
 */
function WalletAddressChip({
  address,
  explorerUrl,
  leadingChars = 6,
  trailingChars = 4,
  copiedDurationMs = 1600,
  className,
}: WalletAddressChipProps) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<number | null>(null)

  React.useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    []
  )

  const truncated = truncateAddress(address, leadingChars, trailingChars)

  const handleCopy = async () => {
    const ok = await copyText(address)
    if (!ok) return
    setCopied(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), copiedDurationMs)
  }

  return (
    <Badge
      variant="neutral"
      data-slot="wallet-address-chip"
      className={cn("h-7 gap-1.5 px-2.5 normal-case", className)}
    >
      <Tooltip content={address} side="bottom">
        <MonoNumber
          tabIndex={0}
          data-slot="wallet-address"
          className="text-[11px] text-text-secondary"
        >
          {truncated}
        </MonoNumber>
      </Tooltip>
      <span aria-live="polite" className="flex items-center">
        <Tooltip content={copied ? "Copied!" : "Copy address"} side="bottom">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy address"}
            data-state={copied ? "copied" : "idle"}
            data-slot="wallet-address-copy"
            className="flex size-5 items-center justify-center text-text-tertiary transition-colors duration-micro ease-eque outline-none hover:text-text-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary"
          >
            {copied ? (
              <Check aria-hidden="true" className="size-3.5 text-success" />
            ) : (
              <Copy aria-hidden="true" className="size-3.5" />
            )}
          </button>
        </Tooltip>
      </span>
      {explorerUrl !== undefined ? (
        <Tooltip content="View on explorer" side="bottom">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="View address on explorer"
            data-slot="wallet-address-explorer"
            className="flex size-5 items-center justify-center text-text-tertiary transition-colors duration-micro ease-eque outline-none hover:text-text-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary"
          >
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        </Tooltip>
      ) : null}
    </Badge>
  )
}

export { WalletAddressChip }
