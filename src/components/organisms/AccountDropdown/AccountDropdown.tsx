"use client"

import * as React from "react"
import { Check, Copy, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WalletAddressChip } from "@/components/molecules/WalletAddressChip/WalletAddressChip"
import { truncateAddress } from "@/lib/utils"
import { cn } from "cn"

export interface AccountChain {
  /** Chain id. */
  id: number
  /** Display name (tooltip + aria-label; never rendered as text). */
  name: string
  /** Chain logo image URL. */
  iconSrc: string
}

export interface AccountDropdownProps {
  /** Connected wallet address. */
  address: string
  /** Mock balance line, e.g. "12.5 ETH". */
  balance?: string
  /** Chains offered in the Switch Network section (icon-only buttons). */
  chains?: AccountChain[]
  /** Currently active chain id — gets the highlighted treatment. */
  activeChainId?: number | null
  /** Fires with the newly selected chain id. */
  onChainChange?: (chainId: number) => void
  /** Fires when "Disconnect" is clicked. */
  onDisconnect?: () => void
  /** Block-explorer URL for the address chip. */
  explorerUrl?: string
  /** Extra classes merged onto the trigger wrapper. */
  className?: string
}

/**
 * Account Dropdown (3.2) — dropdown menu triggered from a
 * WalletAddressChip. Shows the truncated address with copy feedback,
 * mock balance, an icon-only Switch Network section, and a disconnect
 * action.
 */
function AccountDropdown({
  address,
  balance,
  chains = [],
  activeChainId = null,
  onChainChange,
  onDisconnect,
  explorerUrl,
  className,
}: AccountDropdownProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
    } catch {
      /* clipboard unavailable in some contexts — still show feedback */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Account menu for ${truncateAddress(address)}`}
            className={cn(
              "cursor-pointer rounded-none outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary",
              className
            )}
          />
        }
      >
        <WalletAddressChip address={address} explorerUrl={explorerUrl} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Connected account</DropdownMenuLabel>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <span className="font-heading text-sm text-text-primary tabular-nums">
            {truncateAddress(address, 8, 6)}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Address copied" : "Copy full address"}
            className="flex cursor-pointer items-center gap-1 rounded-none px-1.5 py-1 font-body text-xs text-text-tertiary outline-none transition-colors duration-micro hover:text-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary"
          >
            {copied ? (
              <Check aria-hidden="true" className="size-3.5 text-success" />
            ) : (
              <Copy aria-hidden="true" className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {balance ? (
          <div className="px-2 pb-1.5">
            <span className="font-body text-xs text-text-tertiary">
              Balance{" "}
            </span>
            <span className="font-heading text-sm text-text-primary tabular-nums">
              {balance}
            </span>
          </div>
        ) : null}
        <DropdownMenuSeparator />
        {chains.length > 0 ? (
          <>
            <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
            <div className="flex items-center gap-2 px-2 pb-1.5">
              {chains.map((c) => {
                const active = c.id === activeChainId
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onChainChange?.(c.id)}
                    title={c.name}
                    aria-label={`Switch to ${c.name}`}
                    aria-pressed={active}
                    className={cn(
                      "flex size-9 cursor-pointer items-center justify-center border outline-none transition-colors duration-micro ease-eque focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary",
                      active
                        ? "border-primary bg-primary-a08"
                        : "border-border-subtle hover:border-border-accent"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- consumer-supplied chain art */}
                    <img
                      src={c.iconSrc}
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                      className="size-5 shrink-0"
                    />
                  </button>
                )
              })}
            </div>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem variant="destructive" onClick={onDisconnect}>
          <LogOut aria-hidden="true" className="size-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { AccountDropdown }
