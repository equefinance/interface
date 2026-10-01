"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "cn";
import { formatTvl } from "@/lib/utils";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Select } from "@/components/atoms/Select/Select";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { PercentageChangeIndicator } from "@/components/molecules/PercentageChangeIndicator/PercentageChangeIndicator";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export interface PerformanceDatum {
  /** Point timestamp (ms). */
  timestamp: number;
  /** TVL in USD. */
  tvl: number;
  /** Asset price in USD. */
  price: number;
  /** APY in percent points. */
  apy: number;
}

export type ChartMetric = "tvl" | "price" | "apy";
export type ChartRangeKey = "7D" | "30D" | "90D" | "ALL";

export interface PerformanceChartProps {
  /** Full history, oldest first — ranges slice from the latest point. */
  data: PerformanceDatum[];
  /** Initial metric (uncontrolled). */
  defaultMetric?: ChartMetric;
  /** Initial range (uncontrolled). */
  defaultRange?: ChartRangeKey;
  /** Title override — defaults to the metric title ("TVL history", …). */
  title?: string;
  /** Shows a skeleton instead of the chart. */
  loading?: boolean;
  /** Chart height in px (default 280). */
  height?: number;
  /** Fires on metric change. */
  onMetricChange?: (metric: ChartMetric) => void;
  /** Fires on range change. */
  onRangeChange?: (range: ChartRangeKey) => void;
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string;
}

const DAY_MS = 86_400_000;

const RANGES: { key: ChartRangeKey; label: string; days: number | null }[] = [
  { key: "7D", label: "7D", days: 7 },
  { key: "30D", label: "30D", days: 30 },
  { key: "90D", label: "90D", days: 90 },
  { key: "ALL", label: "All", days: null },
];

const usd0 = (v: number) =>
  v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const usd2 = (v: number) =>
  v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface MetricConfig {
  label: string;
  title: string;
  dataKey: keyof Pick<PerformanceDatum, "tvl" | "price" | "apy">;
  /** DESIGN.md §7.9 series order, one color per metric. */
  color: string;
  formatFull: (v: number) => string;
  formatAxis: (v: number) => string;
  /** Relative % for TVL/price; percentage points for APY. */
  changeUnit: "pct" | "pp";
}

const METRICS: Record<ChartMetric, MetricConfig> = {
  tvl: {
    label: "TVL",
    title: "TVL history",
    dataKey: "tvl",
    color: "#1FFFC3",
    formatFull: usd0,
    formatAxis: (v) => formatTvl(v),
    changeUnit: "pct",
  },
  price: {
    label: "Asset price",
    title: "Asset price history",
    dataKey: "price",
    color: "#3BE3B6",
    formatFull: usd2,
    formatAxis: (v) => `$${v.toFixed(0)}`,
    changeUnit: "pct",
  },
  apy: {
    label: "APY",
    title: "APY history",
    dataKey: "apy",
    color: "#57C7A9",
    formatFull: (v) => `${v.toFixed(2)}%`,
    formatAxis: (v) => `${v.toFixed(0)}%`,
    changeUnit: "pp",
  },
};

function formatTick(timestamp: number, range: ChartRangeKey): string {
  const d = new Date(timestamp);
  if (range === "7D" || range === "30D")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function ChartTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: { payload?: PerformanceDatum }[];
  metric: ChartMetric;
}) {
  const point = active && payload?.[0]?.payload;
  if (!point) return null;
  const cfg = METRICS[metric];
  return (
    <div className="border border-border-subtle bg-surface-raised px-3 py-2.5">
      <p className="mb-1 font-mono text-xs text-text-tertiary">
        {new Date(point.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <p className="font-mono text-sm font-bold text-primary">
        {cfg.formatFull(point[cfg.dataKey])}
      </p>
    </div>
  );
}

/**
 * Eque performance chart (TASKS.md 5.3, revised 2026-09-28) — area
 * chart with a metric dropdown (TVL / Asset price / APY) and a
 * 7D/30D/90D/All range selector. Switching the metric updates the
 * series, the title, the value formatting, and the change indicator
 * (relative % for TVL/price, percentage points for APY). Loading and
 * empty states included.
 */
function PerformanceChart({
  data,
  defaultMetric = "tvl",
  defaultRange = "30D",
  title,
  loading = false,
  height = 280,
  onMetricChange,
  onRangeChange,
  className,
}: PerformanceChartProps) {
  const [metric, setMetric] = React.useState<ChartMetric>(defaultMetric);
  const [range, setRange] = React.useState<ChartRangeKey>(defaultRange);
  const reduceMotion = usePrefersReducedMotion();
  const gradientId = React.useId();
  const cfg = METRICS[metric];

  const end = data.length > 0 ? data[data.length - 1].timestamp : 0;
  const rangeDays = RANGES.find((r) => r.key === range)?.days ?? null;
  const visible =
    rangeDays == null
      ? data
      : data.filter((d) => d.timestamp >= end - rangeDays * DAY_MS);

  const latest = visible[visible.length - 1];
  const first = visible[0];
  const firstVal = first?.[cfg.dataKey] ?? 0;
  const latestVal = latest?.[cfg.dataKey] ?? 0;
  const changePct = firstVal > 0 ? ((latestVal - firstVal) / firstVal) * 100 : 0;
  const changePp = latestVal - firstVal;

  const handleMetric = (m: ChartMetric) => {
    setMetric(m);
    onMetricChange?.(m);
  };
  const handleRange = (r: ChartRangeKey) => {
    setRange(r);
    onRangeChange?.(r);
  };

  const ppDirection = changePp > 0 ? "up" : changePp < 0 ? "down" : "flat";
  const PpIcon =
    ppDirection === "up"
      ? ArrowUpRight
      : ppDirection === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <figure
      data-slot="performance-chart"
      className={cn("border border-border-subtle bg-surface p-6", className)}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h3 className="font-heading text-base font-semibold text-text-primary">
            {title ?? cfg.title}
          </h3>
          {!loading && latest ? (
            <>
              <span className="font-mono text-sm font-bold text-text-primary">
                {cfg.formatFull(latestVal)}
              </span>
              {cfg.changeUnit === "pct" ? (
                <PercentageChangeIndicator value={changePct} />
              ) : (
                <span
                  data-slot="pp-change"
                  className={cn(
                    "inline-flex items-center gap-1 font-heading text-xs font-medium",
                    ppDirection === "up" && "text-success",
                    ppDirection === "down" && "text-error",
                    ppDirection === "flat" && "text-text-tertiary"
                  )}
                >
                  <PpIcon
                    aria-hidden="true"
                    size={14}
                    strokeWidth={2}
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    className="shrink-0"
                  />
                  {changePp >= 0 ? "+" : ""}
                  {changePp.toFixed(2)} pp
                </span>
              )}
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Select
            aria-label="Chart metric"
            options={(Object.keys(METRICS) as ChartMetric[]).map((m) => ({
              value: m,
              label: METRICS[m].label,
            }))}
            value={metric}
            onValueChange={(v) => handleMetric(v as ChartMetric)}
            className="w-36"
          />
          <div
            role="group"
            aria-label="Time range"
            className="flex border border-border-subtle"
          >
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={range === r.key}
                onClick={() => handleRange(r.key)}
                className={cn(
                  "px-3 py-1.5 font-mono text-xs outline-none transition-colors duration-micro ease-eque focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary focus-visible:outline-offset-2",
                  range === r.key
                    ? "bg-primary-a08 font-bold text-primary"
                    : "text-text-tertiary hover:text-text-primary"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton className="w-full" style={{ height }} label="Loading chart" />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No history yet"
          description="Performance data appears once the vault has onchain activity."
        />
      ) : (
        <div
          role="img"
          aria-label={`${title ?? cfg.title}: ${cfg.formatFull(latestVal)} latest over the selected ${range === "ALL" ? "full" : range} range.`}
        >
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart
              data={visible}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#1A222D" />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={{ stroke: "#1A222D" }}
                tick={{ fill: "#718094", fontSize: 11 }}
                tickFormatter={(t: number) => formatTick(t, range)}
                minTickGap={32}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                tick={{ fill: "#718094", fontSize: 11 }}
                tickFormatter={(v: number) => cfg.formatAxis(v)}
                domain={[(dataMin: number) => dataMin * 0.92, "auto"]}
              />
              <RechartsTooltip
                content={<ChartTooltip metric={metric} />}
                cursor={{ stroke: cfg.color, strokeOpacity: 0.35 }}
              />
              <Area
                type="linear"
                dataKey={cfg.dataKey}
                stroke={cfg.color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: cfg.color,
                  stroke: "#070A0F",
                  strokeWidth: 2,
                }}
                isAnimationActive={!reduceMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}

export { PerformanceChart };
