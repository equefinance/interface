"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Pagination as UiPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from "@/components/atoms/Button/Button"
import { cn } from "cn"

export interface PaginationProps {
  /** Current page, 1-based. */
  page: number
  /** Total page count. Renders nothing when < 2. */
  pageCount: number
  /** Fires with the new 1-based page. */
  onPageChange?: (page: number) => void
  /** Pages shown on each side of the current page (default 1). */
  siblingCount?: number
  /** Compact mobile variant: prev/next + "Page X of Y". */
  compact?: boolean
  /** Extra classes merged onto the nav (tailwind-merge wins). */
  className?: string
}

const DOTS = "dots"
type PageToken = number | typeof DOTS

function getRange(
  page: number,
  pageCount: number,
  siblingCount: number
): PageToken[] {
  const totalSlots = siblingCount * 2 + 5
  if (pageCount <= totalSlots) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  const left = Math.max(2, page - siblingCount)
  const right = Math.min(pageCount - 1, page + siblingCount)
  const tokens: PageToken[] = [1]
  if (left > 2) tokens.push(DOTS)
  for (let p = left; p <= right; p++) tokens.push(p)
  if (right < pageCount - 1) tokens.push(DOTS)
  tokens.push(pageCount)
  return tokens
}

/**
 * Eque pagination molecule (2.16) — controlled page numbers with
 * prev/next, ellipsis collapsing, and disabled edge states. The
 * compact variant is the mobile treatment: prev/next flanking a
 * "Page X of Y" readout.
 */
function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  compact = false,
  className,
}: PaginationProps) {
  const go = (next: number) => {
    const clamped = Math.min(Math.max(1, next), pageCount)
    if (clamped !== page) onPageChange?.(clamped)
  }

  if (pageCount < 2) return null

  if (compact) {
    return (
      <nav
        aria-label="pagination"
        data-slot="pagination"
        data-compact="true"
        className={cn("flex items-center justify-center gap-3", className)}
      >
        <Button
          variant="icon"
          size="sm"
          aria-label="Go to previous page"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Button>
        <span className="font-heading text-xs whitespace-nowrap text-text-secondary">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="icon"
          size="sm"
          aria-label="Go to next page"
          disabled={page >= pageCount}
          onClick={() => go(page + 1)}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </nav>
    )
  }

  const tokens = getRange(page, pageCount, siblingCount)
  const edgeClass = (disabled: boolean) =>
    disabled ? "pointer-events-none opacity-50" : undefined

  return (
    <UiPagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go(page - 1)
            }}
            aria-disabled={page <= 1}
            className={edgeClass(page <= 1)}
          />
        </PaginationItem>
        {tokens.map((token, i) =>
          token === DOTS ? (
            <PaginationItem key={`dots-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={token}>
              <PaginationLink
                href="#"
                isActive={token === page}
                onClick={(e) => {
                  e.preventDefault()
                  go(token)
                }}
              >
                {token}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go(page + 1)
            }}
            aria-disabled={page >= pageCount}
            className={edgeClass(page >= pageCount)}
          />
        </PaginationItem>
      </PaginationContent>
    </UiPagination>
  )
}

export { Pagination }
