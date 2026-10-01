"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "cn";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";

export interface ApyBreakdownDatum {
  /** X-axis label, e.g. `"Epoch 41"`. */
  label: string;
  /** Base APY, in percent points. */
  base: number;
  /** Reward APY, in percent points. */
  reward: number;
  /** Boosted APY, in percent points. */
  boost: number;
}

export interface ApyBreakdownChartProps {
  /** Chart title (default `"APY breakdown"`). */
  title?: string;
  /** One datum per period, oldest first. */
  data: ApyBreakdownDatum[];
  /** Shows a skeleton instead of the chart. */
  loading?: boolean;
  /** Chart height in px (default 280). */
  height?: number;
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string;
}

/**
 * Chart palette (DESIGN.md §7.9): series order
 * `#1FFFC3 → #3BE3B6 → #57C7A9`, gridlines `#1A222D` (= border-subtle),
 * muted text `#718094`. Hex is required here — SVG presentation
 * attributes can't read Tailwind tokens.
 */
const SERIES = [
  { key: "base", label: "Base", color: "#1FFFC3" },
  { key: "reward", label: "Rewards", color: "#3BE3B6" },
  { key: "boost", label: "Boost", color: "#57C7A9" },
] as const;

interface TooltipRow {
  name: string;
  value: number | string;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipRow[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce(
    (sum, row) => sum + (typeof row.value === "number" ? row.value : 0),
    0
  );
  return (
    <div className="border border-border-subtle bg-surface-raised px-3 py-2.5">
      <p className="mb-2 font-mono text-xs text-text-tertiary">{label}</p>
      <div className="flex flex-col gap-1.5">
        {payload.map((row) => {
          const series = SERIES.find((s) => s.key === row.name);
          return (
            <div
              key={row.name}
              className="flex items-center justify-between gap-6"
            >
              <span className="flex items-center gap-2 text-xs text-text-secondary">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0"
                  style={{ backgroundColor: series?.color ?? row.color }}
                />
                {series?.label ?? row.name}
              </span>
              <span className="font-mono text-xs text-text-primary">
                {typeof row.value === "number"
                  ? `${row.value.toFixed(2)}%`
                  : row.value}
              </span>
            </div>
          );
        })}
        <div className="mt-1 flex items-center justify-between gap-6 border-t border-border-subtle pt-1.5">
          <span className="text-xs text-text-tertiary">Total</span>
          <span className="font-mono text-xs font-bold text-primary">
            {total.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Eque APY breakdown chart (TASKS.md 5.1) — stacked bars of base vs.
 * reward vs. boosted APY per period, in the DESIGN.md §7.9 series
 * color order with `border-subtle` gridlines, square legend swatches,
 * and a custom hover tooltip. Loading and empty states included.
 */
function ApyBreakdownChart({
  title = "APY breakdown",
  data,
  loading = false,
  height = 280,
  className,
}: ApyBreakdownChartProps) {
  const reduceMotion = usePrefersReducedMotion();
  const latest = data[data.length - 1];
  const latestTotal = latest ? latest.base + latest.reward + latest.boost : 0;

  return (
    <figure
      data-slot="apy-breakdown-chart"
      className={cn("border border-border-subtle bg-surface p-6", className)}
    >
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h3 className="font-heading text-base font-semibold text-text-primary">
          {title}
        </h3>
        {!loading && data.length > 0 ? (
          <p className="font-mono text-sm text-text-secondary">
            <span className="mr-2 text-xs text-text-tertiary">Current</span>
            <span className="font-bold text-primary">
              {latestTotal.toFixed(2)}%
            </span>
          </p>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className="w-full" style={{ height }} label="Loading chart" />
      ) : data.length === 0 ? (
        <EmptyState
          title="No APY data yet"
          description="Breakdown appears once the vault completes its first epoch."
        />
      ) : (
        <>
          <div
            role="img"
            aria-label={`${title}: stacked base, rewards, and boost APY across ${data.length} periods, currently ${latestTotal.toFixed(2)} percent total.`}
          >
            <ResponsiveContainer width="100%" height={height}>
              <BarChart
                data={data}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                barCategoryGap="32%"
              >
                <CartesianGrid vertical={false} stroke="#1A222D" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: "#1A222D" }}
                  tick={{ fill: "#718094", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{ fill: "#718094", fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <RechartsTooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(31, 255, 195, 0.04)" }}
                />
                {SERIES.map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    stackId="apy"
                    fill={s.color}
                    radius={0}
                    maxBarSize={32}
                    isAnimationActive={!reduceMotion}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            className="mt-4 flex flex-wrap gap-x-5 gap-y-2"
            aria-label="Legend"
          >
            {SERIES.map((s) => (
              <span
                key={s.key}
                className="flex items-center gap-2 text-xs text-text-secondary"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </span>
            ))}
          </div>
        </>
      )}
    </figure>
  );
}

export { ApyBreakdownChart };
