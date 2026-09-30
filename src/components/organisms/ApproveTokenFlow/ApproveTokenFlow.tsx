"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/atoms/Button/Button"
import { cn } from "cn"

export type ApproveStepStatus = "pending" | "active" | "loading" | "done"

export interface ApproveTokenFlowProps {
  /** Token symbol being approved, e.g. "USDC". */
  tokenSymbol: string
  /** Status of the approve step. */
  approveStatus?: ApproveStepStatus
  /** Status of the deposit step. */
  depositStatus?: ApproveStepStatus
  /** Fires when the approve button is clicked. */
  onApprove?: () => void
  /** Fires when the deposit button is clicked. */
  onDeposit?: () => void
  /** Extra classes merged onto the root. */
  className?: string
}

interface StepDef {
  key: "approve" | "deposit"
  title: string
  description: string
  status: ApproveStepStatus
  action?: React.ReactNode
}

function StepGlyph({ status }: { status: ApproveStepStatus }) {
  if (status === "done") {
    return <Check aria-hidden="true" className="size-4 text-success" />
  }
  if (status === "loading") {
    return (
      <Loader2
        aria-hidden="true"
        className="size-4 animate-spin text-primary"
      />
    )
  }
  return null
}

/**
 * Approve Token Flow (3.4) — two-step composite (Approve → Deposit).
 * Each step shows a numbered marker (check when done, spinner when
 * loading), a title, explainer copy, and its action button; the
 * upcoming step stays inert until the previous one completes.
 * Presentational: the host drives step statuses (see `SimulatedFlow`).
 */
function ApproveTokenFlow({
  tokenSymbol,
  approveStatus = "active",
  depositStatus = "pending",
  onApprove,
  onDeposit,
  className,
}: ApproveTokenFlowProps) {
  const steps: StepDef[] = [
    {
      key: "approve",
      title: `Approve ${tokenSymbol}`,
      description: `Let the Eque vault contract move your ${tokenSymbol}. This is a one-time permission — Eque can never mint or lock tokens beyond what you approve.`,
      status: approveStatus,
      action:
        approveStatus === "active" || approveStatus === "loading" ? (
          <Button
            onClick={onApprove}
            loading={approveStatus === "loading"}
            disabled={approveStatus === "loading"}
          >
            Approve {tokenSymbol}
          </Button>
        ) : null,
    },
    {
      key: "deposit",
      title: "Deposit",
      description: `Move your ${tokenSymbol} into the vault and start earning. Deposit settles at the next epoch boundary.`,
      status: depositStatus,
      action:
        depositStatus === "active" || depositStatus === "loading" ? (
          <Button
            variant="primary"
            onClick={onDeposit}
            loading={depositStatus === "loading"}
            disabled={depositStatus === "loading"}
          >
            Deposit {tokenSymbol}
          </Button>
        ) : null,
    },
  ]

  return (
    <ol className={cn("flex flex-col", className)}>
      {steps.map((step, i) => {
        const isDone = step.status === "done"
        const isCurrent =
          step.status === "active" || step.status === "loading"
        return (
          <li
            key={step.key}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "relative flex gap-4 pb-6 last:pb-0",
              i < steps.length - 1 &&
                "before:absolute before:top-9 before:bottom-0 before:left-[15px] before:w-px before:bg-border-subtle"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center border font-heading text-xs",
                isDone
                  ? "border-success-border bg-success-bg text-success-bright"
                  : isCurrent
                    ? "border-primary bg-primary-a08 text-primary"
                    : "border-subtle bg-surface text-text-tertiary"
              )}
            >
              {isDone || step.status === "loading" ? (
                <StepGlyph status={step.status} />
              ) : (
                i + 1
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
              <p
                className={cn(
                  "font-heading text-sm font-medium",
                  isCurrent || isDone
                    ? "text-text-primary"
                    : "text-text-tertiary"
                )}
              >
                {step.title}
              </p>
              <p className="font-body text-sm text-text-secondary">
                {step.description}
              </p>
              {step.action ? <div className="mt-2">{step.action}</div> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { ApproveTokenFlow }
