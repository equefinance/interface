"use client";

import * as React from "react";
import { LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/atoms/Button/Button";
import { Select } from "@/components/atoms/Select/Select";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { Pagination } from "@/components/molecules/Pagination/Pagination";
import {
  SearchFilterBar,
  type ActiveFilters,
  type FilterDef,
} from "@/components/molecules/SearchFilterBar/SearchFilterBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VaultCard, type VaultCardData } from "@/components/organisms/VaultCard/VaultCard";
import {
  VaultTableRow,
  type VaultTableRowData,
} from "@/components/organisms/VaultTableRow/VaultTableRow";

export type VaultListView = "grid" | "table";
type SortKey = "apy-desc" | "tvl-desc" | "name-asc";

const SORT_OPTIONS = [
  { value: "apy-desc", label: "Highest APY" },
  { value: "tvl-desc", label: "Highest TVL" },
  { value: "name-asc", label: "Name A–Z" },
] as const;

export interface VaultListGridProps {
  /** Full vault list; filtering, sorting, and paging happen inside. */
  vaults: VaultCardData[];
  /** Initial view (uncontrolled). */
  defaultView?: VaultListView;
  /** Initial search text (uncontrolled). */
  defaultSearchValue?: string;
  /** Initial active filters (uncontrolled). */
  defaultActiveFilters?: ActiveFilters;
  /** Rows/cards per page. */
  pageSize?: number;
  /** Shows loading skeletons instead of results. */
  loading?: boolean;
  /** Card/row select handler (vault detail navigation). */
  onSelect?: (vault: VaultCardData) => void;
  /** Deposit CTA handler. */
  onDeposit?: (vault: VaultCardData) => void;
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string;
}

const totalApy = (v: VaultCardData) => v.apyBase + v.apyReward + v.apyBoost;

function matchesSearch(v: VaultCardData, q: string): boolean {
  const hay = `${v.name} ${v.depositToken} ${v.pairToken ?? ""}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function GridSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col border border-border-subtle bg-surface p-6"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-10" />
        <Skeleton className="h-5 w-2/3" />
      </div>
      <Skeleton className="mt-5 h-8 w-24" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-6 h-10 w-full" />
    </div>
  );
}

/**
 * Eque vault list/grid organism (TASKS.md 4.3) — Search & Filter Bar
 * (2.8) plus sort control and a grid/table view toggle above either a
 * responsive Vault Card grid or a dense Vault Table Row table, with
 * Pagination, loading skeletons, and an empty-results state.
 */
function VaultListGrid({
  vaults,
  defaultView = "grid",
  defaultSearchValue = "",
  defaultActiveFilters = {},
  pageSize = 6,
  loading = false,
  onSelect,
  onDeposit,
  className,
}: VaultListGridProps) {
  const [search, setSearch] = React.useState(defaultSearchValue);
  const [activeFilters, setActiveFilters] =
    React.useState<ActiveFilters>(defaultActiveFilters);
  const [view, setView] = React.useState<VaultListView>(defaultView);
  const [sort, setSort] = React.useState<SortKey>("apy-desc");
  const [page, setPage] = React.useState(1);

  const filters: FilterDef[] = React.useMemo(() => {
    const chains = [...new Set(vaults.map((v) => v.chain))].sort();
    const chainIconOf = (chain: string) =>
      vaults.find((v) => v.chain === chain)?.chainIconSrc;
    return [
      {
        id: "chain",
        label: "Chain",
        options: chains.map((c) => {
          const iconSrc = chainIconOf(c);
          return {
            value: c,
            label: (
              <span className="flex items-center gap-1.5">
                {iconSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element -- consumer-supplied chain art
                  <img
                    src={iconSrc}
                    alt=""
                    aria-hidden="true"
                    width={16}
                    height={16}
                    className="size-4 shrink-0"
                  />
                ) : null}
                <span>{c}</span>
              </span>
            ),
          };
        }),
      },
      {
        id: "risk",
        label: "Risk",
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ],
      },
      {
        id: "status",
        label: "Status",
        options: [
          { value: "active", label: "Active" },
          { value: "deprecated", label: "Deprecated" },
        ],
      },
    ];
  }, [vaults]);

  const filtered = React.useMemo(() => {
    const q = search.trim();
    const list = vaults.filter((v) => {
      if (q && !matchesSearch(v, q)) return false;
      if (activeFilters.chain && v.chain !== activeFilters.chain) return false;
      if (activeFilters.risk && v.risk !== activeFilters.risk) return false;
      if (activeFilters.status && v.status !== activeFilters.status)
        return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "tvl-desc") return b.tvl - a.tvl;
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      return totalApy(b) - totalApy(a);
    });
  }, [vaults, search, activeFilters, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const resetPage = () => setPage(1);
  const clearAll = () => {
    setSearch("");
    setActiveFilters({});
    resetPage();
  };

  // The row only knows its subset shape — resolve back to the full
  // vault object before calling the consumer's handler.
  const handleRowSelect = onSelect
    ? (row: VaultTableRowData) => {
        const full = vaults.find((v) => v.id === row.id);
        if (full) onSelect(full);
      }
    : undefined;

  return (
    <div data-slot="vault-list-grid" className={cn("flex flex-col", className)}>
      {/* Controls: search + filters, sort, view toggle */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1 basis-64">
          <SearchFilterBar
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              resetPage();
            }}
            searchPlaceholder="Search vaults…"
            searchLabel="Search vaults"
            filters={filters}
            activeFilters={activeFilters}
            onFilterChange={(filterId, value) => {
              setActiveFilters((prev) => ({ ...prev, [filterId]: value }));
              resetPage();
            }}
            onClearAll={clearAll}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            aria-label="Sort vaults"
            value={sort}
            onValueChange={(v) => {
              setSort(v as SortKey);
              resetPage();
            }}
            options={[...SORT_OPTIONS]}
            className="w-40"
          />
          <div
            role="group"
            aria-label="View"
            className="flex shrink-0 border border-border-subtle"
          >
            {(
              [
                { key: "grid", label: "Grid view", Icon: LayoutGrid },
                { key: "table", label: "Table view", Icon: Rows3 },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={view === key}
                onClick={() => {
                  setView(key);
                  resetPage();
                }}
                className={cn(
                  "p-2 outline-none transition-colors duration-micro ease-eque focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary focus-visible:outline-offset-2",
                  view === key
                    ? "bg-primary-a08 text-primary"
                    : "text-text-tertiary hover:text-text-primary"
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="mt-4 font-mono text-xs text-text-tertiary" aria-live="polite">
        {loading
          ? "Loading vaults…"
          : `${filtered.length} vault${filtered.length === 1 ? "" : "s"}`}
      </p>

      {/* Results */}
      {loading ? (
        view === "grid" ? (
          <div
            className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading vaults"
          >
            {Array.from({ length: pageSize }).map((_, i) => (
              <GridSkeleton key={i} />
            ))}
          </div>
        ) : (
          <Table className="mt-4" aria-label="Loading vaults">
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} aria-hidden="true">
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No vaults match your filters"
          description="Try adjusting your search or clearing the filters."
          action={
            <Button variant="secondary" onClick={clearAll}>
              Clear filters
            </Button>
          }
          className="mt-4"
        />
      ) : view === "grid" ? (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              onSelect={onSelect}
              onDeposit={onDeposit}
            />
          ))}
        </div>
      ) : (
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Vault</TableHead>
              <TableHead className="text-right">APY</TableHead>
              <TableHead className="text-right">TVL</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((vault) => (
              <VaultTableRow
                key={vault.id}
                vault={vault}
                onSelect={handleRowSelect}
              />
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {!loading && pageCount > 1 ? (
        <Pagination
          page={safePage}
          pageCount={pageCount}
          onPageChange={setPage}
          className="mt-8 justify-center"
        />
      ) : null}
    </div>
  );
}

export { VaultListGrid };
