"use client"

import * as React from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/atoms/Button/Button"
import { Badge } from "@/components/ui/badge"
import { truncateAddress } from "@/lib/utils"
import { cn } from "cn"

export type TransactionStatus = "pending" | "success" | "failed"

export interface TransactionStatusModalProps {
  /** Controlled open state. */
  open?: boolean
  /** Fires when open state changes. */
  onOpenChange?: (open: boolean) => void
  /** Current transaction status. */
  status: TransactionStatus
  /** Headline, e.g. "Depositing 1,250 USDC". */
  title: string
  /** Transaction hash shown as a mono chip. */
  txHash?: string
  /** Block-explorer URL for the transaction. */
  explorerUrl?: string
  /** Failure reason, shown when status is "failed". */
  errorMessage?: string
  /** Fires when the primary action is clicked. */
  onViewExplorer?: () => void
  /** Optional trigger element. */
  trigger?: React.ReactNode
  /** Extra classes merged onto the dialog content. */
  className?: string
}

const STATUS_META: Record<
  TransactionStatus,
  { label: string; glyph: React.ReactNode; badgeVariant: "warning" | "success" | "error" }
> = {
  pending: {
    label: "Pending",
    glyph: (
      <Loader2 aria-hidden="true" className="size-8 animate-spin text-warning" />
    ),
    badgeVariant: "warning",
  },
  success: {
    label: "Confirmed",
    glyph: (
      <CheckCircle2 aria-hidden="true" className="size-8 text-success" />
    ),
    badgeVariant: "success",
  },
  failed: {
    label: "Failed",
    glyph: <XCircle aria-hidden="true" className="size-8 text-error" />,
    badgeVariant: "error",
  },
}

/**
 * Transaction Status Modal (3.3) — Pending → Success/Failed progression
 * for a mock transaction: status glyph + label (never color alone),
 * tx-hash chip, and a block-explorer link. Presentational: the host
 * drives `status` (see the `SimulatedFlow` story).
 */
function TransactionStatusModal({
  open,
  onOpenChange,
  status,
  title,
  txHash,
  explorerUrl,
  errorMessage,
  onViewExplorer,
  trigger,
  className,
}: TransactionStatusModalProps) {
  const meta = STATUS_META[status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {React.isValidElement(trigger) ? (
        <DialogTrigger render={trigger} />
      ) : null}
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader className="items-center text-center">
          <span aria-hidden="true" className="flex justify-center">
            {meta.glyph}
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            <Badge variant={meta.badgeVariant} className="mt-1">
              {meta.label}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {status === "failed" && errorMessage ? (
          <p className="text-center font-body text-sm text-error-bright">
            {errorMessage}
          </p>
        ) : null}

        {txHash ? (
          <div className="flex justify-center">
            <span
              title={txHash}
              className="inline-flex items-center border border-subtle bg-surface-raised px-3 py-1.5 font-heading text-xs text-text-secondary tabular-nums"
            >
              {truncateAddress(txHash, 10, 8)}
            </span>
          </div>
        ) : null}

        <DialogFooter className="flex-col sm:justify-center">
          {explorerUrl ? (
            <Button
              variant="secondary"
              render={
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onViewExplorer}
                />
              }
            >
              View on explorer
            </Button>
          ) : null}
          <DialogTrigger render={<Button variant="tertiary" />}>
            Close
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { TransactionStatusModal }
