"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "cn";
import { formatTvl } from "@/lib/utils";
import { TableCell, TableRow } from "@/components/ui/table";
import { ApyPill } from "@/components/molecules/ApyPill/ApyPill";
import { RiskLevelIndicator } from "@/components/molecules/RiskLevelIndicator/RiskLevelIndicator";

/**
 * Minimal vault shape the row renders. Structural on purpose: mock-data
 * `Vault` objects map onto it 1:1 in stories, but the component never
 * imports mock data itself (registry self-containment).
 */
export interface VaultTableRowData {
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
}

export interface VaultTableRowProps {
  vault: VaultTableRowData;
  /** Selected state per DESIGN.md §7.7 (primary tint bg). */
  selected?: boolean;
  /**
   * Makes the row click-through: the whole row is mouse-clickable and
   * the vault name renders as a keyboard-operable button.
   * Deprecated vaults never become interactive.
   */
  onSelect?: (vault: VaultTableRowData) => void;
  /** Extra classes merged onto the row (tailwind-merge wins). */
  className?: string;
}

/**
 * Small square letter tile standing in for a token glyph (token artwork
 * is out of scope for the kit — generic glyphs only, AGENTS.md §1).
 */
function AssetTile({ symbol }: { symbol: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center bg-surface-raised font-mono text-xs font-bold text-primary"
    >
      {symbol.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * Eque vault table row organism (TASKS.md 4.2, DESIGN.md §7.7) — the
 * Vault Card's data in dense table form: asset icon + name, APY pill,
 * TVL, risk indicator, and a click-through chevron. Numbers are
 * right-aligned in Spline Sans Mono with tabular figures.
 */
function VaultTableRow({
  vault,
  selected = false,
  onSelect,
  className,
}: VaultTableRowProps) {
  const interactive = typeof onSelect === "function";
  const deprecated = vault.status === "deprecated";
  const clickable = interactive && !deprecated;

  return (
    <TableRow
      data-slot="vault-table-row"
      data-selected={selected || undefined}
      onClick={clickable ? () => onSelect(vault) : undefined}
      className={cn(
        clickable && "cursor-pointer active:bg-primary-a08",
        deprecated && "opacity-60",
        className
      )}
    >
      {/* Vault: icon + name */}
      <TableCell>
        <span className="flex items-center gap-2.5">
          <span
            role="img"
            aria-label={
              vault.pairToken
                ? `${vault.depositToken} / ${vault.pairToken} on ${vault.chain}`
                : `${vault.depositToken} on ${vault.chain}`
            }
            className="flex shrink-0"
          >
            {vault.iconSrc ? (
              <img
                src={vault.iconSrc}
                alt=""
                className="size-8 shrink-0 object-cover"
              />
            ) : (
              <AssetTile symbol={vault.depositToken} />
            )}
            {vault.pairToken ? (
              <span className="-ml-2">
                {vault.pairIconSrc ? (
                  <img
                    src={vault.pairIconSrc}
                    alt=""
                    className="size-8 shrink-0 object-cover"
                  />
                ) : (
                  <AssetTile symbol={vault.pairToken} />
                )}
              </span>
            ) : null}
          </span>
          {clickable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(vault);
              }}
              className="font-heading text-sm font-medium text-text-primary outline-none hover:text-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              {vault.name}
            </button>
          ) : (
            <span className="font-heading text-sm font-medium text-text-primary">
              {vault.name}
            </span>
          )}
        </span>
      </TableCell>

      {/* APY */}
      <TableCell className="text-right">
        <span className="inline-flex justify-end">
          <ApyPill
            apyBase={vault.apyBase}
            apyReward={vault.apyReward}
            apyBoost={vault.apyBoost}
          />
        </span>
      </TableCell>

      {/* TVL */}
      <TableCell className="text-right font-mono text-sm text-text-primary tabular-nums">
        {formatTvl(vault.tvl)}
      </TableCell>

      {/* Risk — omitted when the data source provides no classification. */}
      <TableCell>
        {vault.risk ? (
          <RiskLevelIndicator level={vault.risk} />
        ) : (
          <span className="font-mono text-sm text-text-tertiary">—</span>
        )}
      </TableCell>

      {/* Click-through affordance */}
      <TableCell className="w-10">
        {clickable ? (
          <ChevronRight
            aria-hidden="true"
            className="ml-auto size-4 text-text-tertiary"
          />
        ) : null}
      </TableCell>
    </TableRow>
  );
}

export { VaultTableRow };
