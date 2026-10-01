"use client"

import * as React from "react"
import { Check, Copy, LogOut, Repeat } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { WalletAddressChip } from "@/components/molecules/WalletAddressChip/WalletAddressChip"
import { truncateAddress } from "@/lib/utils"
import { cn } from "cn"

export interface AccountDropdownProps {
  /** Connected wallet address. */
  address: string
  /** Mock balance line, e.g. "12.5 ETH". */
  balance?: string
  /** Current network name (text badge — no chain icon per exclusion rule). */
  networkName?: string
  /** Fires when "Switch network" is clicked (host opens a switcher). */
  onSwitchNetwork?: () => void
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
 * mock balance, a network-switcher entry point, and a disconnect
 * action. Chain shown as a text badge (exclusion rule, AGENTS.md §1).
 */
function AccountDropdown({
  address,
  balance,
  networkName = "Base Sepolia",
  onSwitchNetwork,
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
        <DropdownMenuItem
          onClick={onSwitchNetwork}
          className="justify-between"
        >
          <span className="flex items-center gap-2">
            <Repeat aria-hidden="true" className="size-4 text-text-tertiary" />
            Switch network
          </span>
          <Badge variant="neutral">{networkName}</Badge>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDisconnect}>
          <LogOut aria-hidden="true" className="size-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { AccountDropdown }
