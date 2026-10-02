"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/atoms/Input/Input"
import { Select } from "@/components/atoms/Select/Select"
import { Badge } from "@/components/atoms/Badge/Badge"
import { Button } from "@/components/atoms/Button/Button"
import { cn } from "cn"

/** One selectable value in a filter dropdown. */
export interface FilterOption {
  /** Stable value. */
  value: string
  /** Display label — accepts nodes so options can carry icons. */
  label: React.ReactNode
}

/** One filter dropdown (chain, risk, status, …). */
export interface FilterDef {
  /** Stable id, e.g. `"chain"`. */
  id: string
  /** Dropdown placeholder and chip prefix, e.g. `"Chain"`. */
  label: string
  options: FilterOption[]
}

/** `filterId → selected option value`; missing/null = no filter. */
export type ActiveFilters = Record<string, string | null | undefined>

export interface SearchFilterBarProps {
  /** Controlled search text. */
  searchValue?: string
  /** Uncontrolled initial search text. */
  defaultSearchValue?: string
  /** Fires on every search keystroke. */
  onSearchChange?: (value: string) => void
  /** Search field placeholder. */
  searchPlaceholder?: string
  /** Accessible name for the search field (default `"Search"`). */
  searchLabel?: string
  /** Filter dropdown definitions. */
  filters: FilterDef[]
  /** Controlled active filters. */
  activeFilters?: ActiveFilters
  /** Uncontrolled initial active filters. */
  defaultActiveFilters?: ActiveFilters
  /** Fires when a filter is set or cleared (`null`). */
  onFilterChange?: (filterId: string, value: string | null) => void
  /** Fires after "Clear all" resets every filter. */
  onClearAll?: () => void
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string
}

/**
 * Eque search & filter bar molecule (2.8) — search field plus filter
 * dropdowns (chain, risk, status, …) with active-filter chips. Each
 * chip clears its own filter; "Clear all" resets everything. Search
 * and filters are both controlled/uncontrolled pairs; dropdowns keep
 * the sr-only native `<label>` pattern (the Select atom's own label
 * wrapper would offset the trigger).
 */
function SearchFilterBar({
  searchValue: searchValueProp,
  defaultSearchValue = "",
  onSearchChange,
  searchPlaceholder = "Search…",
  searchLabel = "Search",
  filters,
  activeFilters: activeFiltersProp,
  defaultActiveFilters = {},
  onFilterChange,
  onClearAll,
  className,
}: SearchFilterBarProps) {
  const [searchInner, setSearchInner] = React.useState(defaultSearchValue)
  const search = searchValueProp ?? searchInner

  const [filtersInner, setFiltersInner] =
    React.useState<ActiveFilters>(defaultActiveFilters)
  const active = activeFiltersProp ?? filtersInner

  const baseId = React.useId()
  const searchId = `${baseId}-search`

  const setSearch = (value: string) => {
    if (searchValueProp === undefined) setSearchInner(value)
    onSearchChange?.(value)
  }

  const setFilter = (filterId: string, value: string | null) => {
    if (activeFiltersProp === undefined) {
      setFiltersInner((prev) => ({ ...prev, [filterId]: value }))
    }
    onFilterChange?.(filterId, value)
  }

  const activeEntries = filters.flatMap((f) => {
    const value = active[f.id]
    if (!value) return []
    const option = f.options.find((o) => o.value === value)
    return [{ def: f, value, optionLabel: option?.label ?? value }]
  })

  const clearAll = () => {
    const ids = activeEntries.map((e) => e.def.id)
    if (activeFiltersProp === undefined) setFiltersInner({})
    ids.forEach((id) => onFilterChange?.(id, null))
    onClearAll?.()
  }

  return (
    <div
      data-slot="search-filter-bar"
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={searchId} className="sr-only">
            {searchLabel}
          </label>
          <Input
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10"
          />
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
          />
        </div>
        {filters.map((f) => {
          const filterId = `${baseId}-filter-${f.id}`
          return (
            <div key={f.id} className="md:w-44 md:shrink-0">
              <label htmlFor={filterId} className="sr-only">
                {f.label}
              </label>
              <Select
                id={filterId}
                options={f.options}
                value={active[f.id] ?? undefined}
                onValueChange={(v) => setFilter(f.id, v)}
                placeholder={f.label}
              />
            </div>
          )
        })}
      </div>
      {activeEntries.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeEntries.map(({ def, optionLabel }) => (
            <Badge
              key={def.id}
              variant="neutral"
              data-slot="active-filter-chip"
              data-filter={def.id}
              className="gap-1.5 py-0 pr-1 normal-case tracking-normal"
            >
              <span className="text-text-secondary">
                {def.label}:{" "}
                <span className="text-text-primary">{optionLabel}</span>
              </span>
              <button
                type="button"
                onClick={() => setFilter(def.id, null)}
                aria-label={`Clear ${def.label} filter`}
                className="flex size-5 items-center justify-center text-text-tertiary transition-colors hover:text-text-primary"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </Badge>
          ))}
          <Button variant="tertiary" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export { SearchFilterBar }
