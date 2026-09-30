"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/atoms/Button/Button";
import { Tabs } from "@/components/molecules/Tabs/Tabs";
import { TokenAmountInput } from "@/components/molecules/TokenAmountInput/TokenAmountInput";
import {
  ApproveTokenFlow,
  type ApproveStepStatus,
} from "@/components/organisms/ApproveTokenFlow/ApproveTokenFlow";
import type { Token } from "@/lib/mock-data/tokens";

export type DepositWithdrawTab = "deposit" | "withdraw";

export interface DepositWithdrawPanelProps {
  /** Vault name shown in the panel header. */
  vaultName: string;
  /** Deposit/withdraw token (amount input + balance source). */
  token: Token;
  /** Token icon image URL for the amount input. */
  tokenIconSrc?: string;
  /** Wallet balance of the token (deposit Max). */
  tokenBalance: number;
  /** Max withdrawable, denominated in the token (withdraw Max). */
  withdrawableBalance: number;
  /** Token price in USD for the input estimate. */
  tokenPriceUsd?: number;
  /** Minimum amount per transaction (default 10). */
  minAmount?: number;
  /** Deposit fee in bps, display only (default 10 = 0.10%). */
  depositFeeBps?: number;
  /** Withdraw fee in bps, display only (default 10 = 0.10%). */
  withdrawFeeBps?: number;
  /** Slippage tolerance in bps, display only (default 50 = 0.50%). */
  slippageBps?: number;
  /** Initial tab (uncontrolled). */
  defaultTab?: DepositWithdrawTab;
  /** Deposit requires the approve flow before the deposit step. */
  needsApproval?: boolean;
  /** Approve step status for the inline flow. */
  approveStatus?: ApproveStepStatus;
  /** Deposit step status for the inline flow. */
  depositStatus?: ApproveStepStatus;
  /** Primary CTA loading state (non-approval path). */
  submitting?: boolean;
  /** Fires from the inline approve flow, with the raw decimal amount string. */
  onApprove?: (amount: string) => void;
  /** Fires when the amount is submitted, with the raw decimal amount string. */
  onSubmit?: (tab: DepositWithdrawTab, amount: string) => void;
  /** Fires on tab change. */
  onTabChange?: (tab: DepositWithdrawTab) => void;
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string;
}

const bps = (v: number) => `${(v / 100).toFixed(2)}%`;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd className="font-mono text-xs text-text-secondary">{value}</dd>
    </div>
  );
}

/**
 * Eque deposit/withdraw panel (TASKS.md 4.4) — Deposit/Withdraw tabs,
 * Token Amount Input with balance validation (insufficient balance,
 * below-minimum), fee/slippage info rows with an estimated-receive
 * line, and the approve-token flow as the entry point when the vault
 * needs approval before the first deposit.
 */
function DepositWithdrawPanel({
  vaultName,
  token,
  tokenIconSrc,
  tokenBalance,
  withdrawableBalance,
  tokenPriceUsd,
  minAmount = 10,
  depositFeeBps = 10,
  withdrawFeeBps = 10,
  slippageBps = 50,
  defaultTab = "deposit",
  needsApproval = false,
  approveStatus = "active",
  depositStatus = "pending",
  submitting = false,
  onApprove,
  onSubmit,
  onTabChange,
  className,
}: DepositWithdrawPanelProps) {
  const [tab, setTab] = React.useState<DepositWithdrawTab>(defaultTab);
  const [amount, setAmount] = React.useState("");
  const [flowOpen, setFlowOpen] = React.useState(false);

  const balance = tab === "deposit" ? tokenBalance : withdrawableBalance;
  const parsed = Number.parseFloat(amount);
  const hasAmount = amount.trim() !== "" && Number.isFinite(parsed);

  let error: string | undefined;
  if (hasAmount && parsed <= 0) error = "Enter an amount greater than 0";
  else if (hasAmount && parsed > balance) error = "Insufficient balance";
  else if (hasAmount && parsed < minAmount)
    error = `Minimum ${minAmount} ${token.symbol}`;

  const valid = hasAmount && !error;
  const feeBps = tab === "deposit" ? depositFeeBps : withdrawFeeBps;
  const net = valid ? parsed * (1 - feeBps / 10_000) : 0;

  const handleTabChange = (value: string) => {
    const next = value as DepositWithdrawTab;
    setTab(next);
    setAmount("");
    setFlowOpen(false);
    onTabChange?.(next);
  };

  const ctaLabel =
    tab === "withdraw"
      ? "Withdraw"
      : needsApproval && approveStatus !== "done"
        ? `Approve ${token.symbol}`
        : "Deposit";

  const handleCta = () => {
    if (!valid || submitting) return;
    if (tab === "deposit" && needsApproval && approveStatus !== "done") {
      setFlowOpen(true);
      return;
    }
    onSubmit?.(tab, amount);
  };

  return (
    <section
      data-slot="deposit-withdraw-panel"
      aria-label={`${vaultName} deposit and withdraw`}
      className={cn("border border-border-subtle bg-surface", className)}
    >
      <Tabs
        tabs={[
          { value: "deposit", label: "Deposit" },
          { value: "withdraw", label: "Withdraw" },
        ]}
        value={tab}
        onValueChange={handleTabChange}
        className="border-b border-border-subtle"
      />

      <div className="p-6">
        {flowOpen ? (
          <div>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setFlowOpen(false)}
              className="mb-4 -ml-2"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back
            </Button>
            <ApproveTokenFlow
              tokenSymbol={token.symbol}
              approveStatus={approveStatus}
              depositStatus={depositStatus}
              onApprove={() => onApprove?.(amount)}
              onDeposit={() => {
                if (valid) onSubmit?.("deposit", amount);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <TokenAmountInput
              token={token}
              iconSrc={tokenIconSrc}
              balance={balance}
              tokenPriceUsd={tokenPriceUsd}
              label="Amount"
              value={amount}
              onChange={setAmount}
              error={error}
            />

            <dl className="mt-5 flex flex-col gap-2 border-t border-border-subtle pt-4">
              <InfoRow
                label={tab === "deposit" ? "Deposit fee" : "Withdraw fee"}
                value={bps(feeBps)}
              />
              <InfoRow label="Slippage tolerance" value={bps(slippageBps)} />
              <InfoRow
                label="You receive"
                value={
                  valid
                    ? `≈ ${net.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${tab === "deposit" ? "shares" : token.symbol}`
                    : "—"
                }
              />
            </dl>

            <Button
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={!valid || submitting}
              onClick={handleCta}
              className="mt-6 w-full"
            >
              {ctaLabel}
            </Button>

            {tab === "deposit" && needsApproval && approveStatus !== "done" ? (
              <p className="mt-3 text-center text-xs text-text-tertiary">
                First deposit needs a one-time token approval.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

export { DepositWithdrawPanel };
