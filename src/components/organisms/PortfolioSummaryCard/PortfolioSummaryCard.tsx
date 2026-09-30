"use client";

import * as React from "react";
import { cn } from "cn";
import {
  StatCard,
  type StatCardTrend,
} from "@/components/molecules/StatCard/StatCard";

export interface PortfolioSummaryCardProps {
  /** Total deposited across vaults, in USD. */
  totalDeposited: number;
  /** Total earned (yield) across vaults, in USD. */
  totalEarned: number;
  /** Estimated daily yield, in USD. */
  dailyYield: number;
  /** Estimated monthly yield, in USD. */
  monthlyYield: number;
  /** Optional trend captions per stat. */
  depositedTrend?: StatCardTrend;
  /** Optional trend captions per stat. */
  earnedTrend?: StatCardTrend;
  /** Pending state: every stat shows its skeleton block. */
  loading?: boolean;
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string;
}

const usd = (v: number) =>
  v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Eque portfolio summary card (TASKS.md 5.2) — total deposited, total
 * earned, and daily/monthly yield as a responsive grid of Stat Cards
 * (2.1), each with an optional trend caption. `loading` swaps every
 * value for its skeleton block.
 */
function PortfolioSummaryCard({
  totalDeposited,
  totalEarned,
  dailyYield,
  monthlyYield,
  depositedTrend,
  earnedTrend,
  loading = false,
  className,
}: PortfolioSummaryCardProps) {
  const stats = [
    {
      label: "Total deposited",
      value: usd(totalDeposited),
      trend: depositedTrend,
    },
    { label: "Total earned", value: usd(totalEarned), trend: earnedTrend },
    { label: "Daily yield", value: usd(dailyYield) },
    { label: "Monthly yield", value: usd(monthlyYield) },
  ];

  return (
    <section
      data-slot="portfolio-summary-card"
      aria-label="Portfolio summary"
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {stats.map((s) => (
        <StatCard
          key={s.label}
          label={s.label}
          value={s.value}
          trend={s.trend}
          loading={loading}
        />
      ))}
    </section>
  );
}

export { PortfolioSummaryCard };
