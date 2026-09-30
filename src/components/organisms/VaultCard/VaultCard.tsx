"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { formatTvl } from "@/lib/utils";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Divider } from "@/components/atoms/Divider/Divider";
import { Heading, Text } from "@/components/atoms/Typography/Typography";
import { ApyPill } from "@/components/molecules/ApyPill/ApyPill";
import { RiskLevelIndicator } from "@/components/molecules/RiskLevelIndicator/RiskLevelIndicator";

/**
 * Minimal vault shape the card renders. Structural on purpose: mock-data
 * `Vault` objects map onto it 1:1 in stories, but the component never
 * imports mock data itself (registry self-containment).
 */
export interface VaultCardData {
  /** Stable id, used for keys and callbacks. */
  id: string;
  /** Display name, e.g. "USDC Lending Prime". */
  name: string;
  /** Primary deposit token symbol, e.g. "USDC". */
  depositToken: string;
  /**
   * Asset icon image URL. Omitted → generic letter tile (token artwork
   * is out of scope for the kit — generic glyphs only).
   */
  iconSrc?: string;
  /** Set for LP vaults — renders as merged pair icons. */
  pairToken?: string;
  /** LP pair icon image URL. Omitted → generic letter tile. */
  pairIconSrc?: string;
  /** APY components in percent units (base + reward + boost = total). */
  apyBase: number;
  apyReward: number;
  apyBoost: number;
  /** Total value locked, USD. */
  tvl: number;
  /**
   * Risk classification. Optional — omit when the data source doesn't
   * provide one rather than inventing a label; the indicator is skipped.
   */
  risk?: "low" | "medium" | "high";
  /** Drives interactivity only — no status badge is rendered. */
  status: "active" | "deprecated";
  /** Chain display name, e.g. "Arbitrum" (aria-labels; not rendered). */
  chain: string;
  /**
   * Chain icon image URL, overlaid on the asset icon's bottom-left
   * corner. Omitted → no overlay.
   */
  chainIconSrc?: string;
  /** One-line strategy description. */
  strategy: string;
  /** Strategy/ecosystem icon image URL. Omitted → no icon. */
  strategyIconSrc?: string;
  /** Custom tags, e.g. ["Stocks", "LP Token"] — stacked top-right. */
  tags?: string[];
  audited: boolean;
}

export interface VaultCardProps {
  vault: VaultCardData;
  /**
   * Featured treatment (DESIGN.md §7.3): 32px padding, corner brackets,
   * and the pixel shadow. Reserve for one hero vault per list.
   */
  featured?: boolean;
  /**
   * Makes the card interactive: the vault name becomes a stretched-link
   * button covering the whole card (hover border/bg shift per §7.3).
   * Omit for a static card — only the CTA stays clickable.
   */
  onSelect?: (vault: VaultCardData) => void;
  /** Primary CTA handler. */
  onDeposit?: (vault: VaultCardData) => void;
  /** CTA label for active vaults. */
  depositLabel?: string;
  /** Extra classes merged onto the card (tailwind-merge wins). */
  className?: string;
}

const corner = "pointer-events-none absolute h-5 w-5 border-primary" as const;

/**
 * Square letter tile standing in for a token glyph (token artwork is
 * out of scope for the kit — generic glyphs only).
 */
function AssetTile({ symbol }: { symbol: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center bg-surface-raised font-mono text-sm font-bold text-primary"
    >
      {symbol.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * Eque vault card organism (TASKS.md 4.1, DESIGN.md §7.3) — asset
 * icon (merged pair for LP vaults, chain icon overlaid bottom-left),
 * vault name, strategy line with ecosystem icon, custom tags, APY pill,
 * TVL, risk indicator, audit chip, and a full-width CTA. All artwork
 * arrives via `*IconSrc` URL props; omitted icons fall back to generic
 * letter tiles (or nothing, for the chain/strategy icons).
 */
function VaultCard({
  vault,
  featured = false,
  onSelect,
  onDeposit,
  depositLabel = "Deposit",
  className,
}: VaultCardProps) {
  const interactive = typeof onSelect === "function";
  const deprecated = vault.status === "deprecated";

  return (
    <article
      data-slot="vault-card"
      data-featured={featured || undefined}
      className={cn(
        "relative flex flex-col border border-border-subtle bg-surface",
        featured ? "p-8 shadow-pixel" : "p-6",
        interactive &&
          !deprecated &&
          "transition-colors duration-150 hover:border-primary-a40 hover:bg-surface-raised focus-within:border-primary-a40",
        className
      )}
    >
      {featured ? (
        <span aria-hidden="true">
          <span className={cn(corner, "top-0 left-0 border-t-2 border-l-2")} />
          <span className={cn(corner, "top-0 right-0 border-t-2 border-r-2")} />
          <span
            className={cn(corner, "bottom-0 left-0 border-b-2 border-l-2")}
          />
          <span
            className={cn(corner, "right-0 bottom-0 border-b-2 border-r-2")}
          />
        </span>
      ) : null}

      {/* Custom tags, stacked top-right */}
      {vault.tags && vault.tags.length > 0 ? (
        <div className="mb-4 flex flex-col items-end gap-1.5">
          {vault.tags.map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Asset icon + name; chain icon layered on the icon's bottom-left */}
      <div className="flex items-center gap-3">
        <span
          role="img"
          aria-label={
            vault.pairToken
              ? `${vault.depositToken} / ${vault.pairToken} on ${vault.chain}`
              : `${vault.depositToken} on ${vault.chain}`
          }
          className="relative flex shrink-0"
        >
          {vault.iconSrc ? (
            <img
              src={vault.iconSrc}
              alt=""
              className="size-10 shrink-0 object-cover"
            />
          ) : (
            <AssetTile symbol={vault.depositToken} />
          )}
          {vault.pairToken ? (
            <span className="-ml-3">
              {vault.pairIconSrc ? (
                <img
                  src={vault.pairIconSrc}
                  alt=""
                  className="size-10 shrink-0 object-cover"
                />
              ) : (
                <AssetTile symbol={vault.pairToken} />
              )}
            </span>
          ) : null}
          {vault.chainIconSrc ? (
            <img
              src={vault.chainIconSrc}
              alt=""
              className="absolute -bottom-1.5 -left-1.5 size-4 object-cover"
            />
          ) : null}
        </span>
        <Heading as="h4" className="text-xl">
          {interactive && !deprecated ? (
            <button
              type="button"
              onClick={() => onSelect(vault)}
              aria-label={`View ${vault.name}`}
              className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {vault.name}
            </button>
          ) : (
            vault.name
          )}
        </Heading>
      </div>

      {/* Strategy line with ecosystem icon */}
      <div className="mt-2.5 flex items-center gap-2">
        {vault.strategyIconSrc ? (
          <img
            src={vault.strategyIconSrc}
            alt=""
            className="size-3.5 shrink-0 object-cover"
          />
        ) : null}
        <Text variant="body-s" className="text-text-secondary">
          {vault.strategy}
        </Text>
      </div>

      {/* APY hero + TVL */}
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
            APY
          </p>
          <ApyPill
            apyBase={vault.apyBase}
            apyReward={vault.apyReward}
            apyBoost={vault.apyBoost}
            className="mt-1.5"
          />
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
            TVL
          </p>
          <p className="mt-1.5 font-mono text-xl text-text-primary tabular-nums">
            {formatTvl(vault.tvl)}
          </p>
        </div>
      </div>

      {/* Risk + audit — rendered only when there's something to show. */}
      {vault.risk || vault.audited ? (
        <div className="mt-4 flex items-center gap-3">
          {vault.risk ? <RiskLevelIndicator level={vault.risk} /> : null}
          {vault.audited ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
              Audited
            </span>
          ) : null}
        </div>
      ) : null}

      <Divider className="my-5" />

      {/* CTA sits above the stretched title link */}
      <div className="relative mt-auto">
        <Button
          variant="primary"
          className="w-full"
          disabled={deprecated}
          onClick={() => onDeposit?.(vault)}
        >
          {deprecated ? "Deprecated" : depositLabel}
        </Button>
      </div>
    </article>
  );
}

export { VaultCard };
