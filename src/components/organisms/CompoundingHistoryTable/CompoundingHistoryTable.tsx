"use client";

import * as React from "react";
import { cn } from "cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { Pagination } from "@/components/molecules/Pagination/Pagination";

export interface CompoundEvent {
  /** Display-ready date, e.g. `"Sep 24, 2026"`. */
  date: string;
  /** Amount compounded, in USD. */
  amountCompounded: number;
  /** Vault balance after compounding, in USD. */
  resultingBalance: number;
  /** Transaction hash. */
  txHash: string;
}

export interface CompoundingHistoryTableProps {
  /** Auto-compound events, newest first. */
  events: CompoundEvent[];
  /** Rows per page (default 8). Pagination appears when exceeded. */
  pageSize?: number;
  /** Pending state: skeleton rows. */
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

const shortHash = (h: string) =>
  h.length > 12 ? `${h.slice(0, 6)}…${h.slice(-4)}` : h;

/**
 * Eque compounding history table (TASKS.md 5.4) — auto-compound
 * events with date, amount compounded, resulting balance, and a tx
 * hash chip, built on the shadcn `table` primitive. Paginates
 * internally when the event list exceeds `pageSize`.
 */
function CompoundingHistoryTable({
  events,
  pageSize = 8,
  loading = false,
  className,
}: CompoundingHistoryTableProps) {
  const [page, setPage] = React.useState(1);
  const pageCount = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = events.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return (
    <div
      data-slot="compounding-history-table"
      className={cn("border border-border-subtle bg-surface", className)}
    >
      <h3 className="px-6 pt-6 font-heading text-base font-semibold text-text-primary">
        Compounding history
      </h3>
      {loading ? (
        <div className="flex flex-col gap-2 p-6" aria-label="Loading history">
          {Array.from({ length: pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No compounding events yet"
          description="Auto-compound events appear here once the strategy starts compounding."
        />
      ) : (
        <>
          <div className="overflow-x-auto p-6 pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">
                    Amount compounded
                  </TableHead>
                  <TableHead className="text-right">
                    Resulting balance
                  </TableHead>
                  <TableHead className="text-right">Tx hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((e) => (
                  <TableRow key={e.txHash}>
                    <TableCell className="whitespace-nowrap text-text-secondary">
                      {e.date}
                    </TableCell>
                    <TableCell className="text-right font-mono text-success">
                      +{usd(e.amountCompounded)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-text-primary">
                      {usd(e.resultingBalance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="neutral"
                        className="font-mono"
                        title={e.txHash}
                      >
                        {shortHash(e.txHash)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {pageCount > 1 ? (
            <div className="flex justify-center border-t border-border-subtle px-6 py-4">
              <Pagination
                page={safePage}
                pageCount={pageCount}
                onPageChange={setPage}
                compact
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export { CompoundingHistoryTable };
