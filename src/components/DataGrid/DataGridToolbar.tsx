import type { Column, Table } from '@tanstack/react-table'
import { Download, Loader2 } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { toolbarClass } from '@/components/ui/surfaces'
import { DataGridColumnMenu } from './DataGridColumnMenu'
import { DataGridFilterChips } from './DataGridFilterChips'
import { DataGridFilterPanel } from './DataGridFilterPanel'
import { DataGridSearch } from './DataGridSearch'
import type { FilterChip } from './utils'

interface DataGridToolbarProps<TData> {
  table: Table<TData>
  search: string
  onSearchChange: (value: string) => void
  onClearColumnFilters: () => void
  onRemoveColumnFilter: (columnId: string, raw?: string) => void
  onFilterChange: (
    column: Column<TData, unknown>,
    value: string | string[] | undefined,
  ) => void
  getFacetCounts?: (columnId: string) => Record<string, number>
  chips: readonly FilterChip[]
  /** Number of columns with an applied filter, shown on the mobile Filters button. */
  filterCount: number
  isPending: boolean
  searchPlaceholder?: string
  searchRef: RefObject<HTMLInputElement | null>
  toolbarActions?: ReactNode
  onExport?: () => void
  disabled?: boolean
}

export function DataGridToolbar<TData>({
  table,
  search,
  onSearchChange,
  onClearColumnFilters,
  onRemoveColumnFilter,
  onFilterChange,
  getFacetCounts,
  chips,
  filterCount,
  isPending,
  searchPlaceholder,
  searchRef,
  toolbarActions,
  onExport,
  disabled = false,
}: DataGridToolbarProps<TData>) {
  return (
    <>
      {/* Search takes the first row on a phone and shares it with the actions
          from `sm` up, where there is room for both. */}
      <div className={toolbarClass}>
        <DataGridSearch
          search={search}
          onSearchChange={onSearchChange}
          searchRef={searchRef}
          placeholder={searchPlaceholder}
          disabled={disabled}
        />

        <div className="flex items-center gap-2">
          {isPending ? (
            <span role="status" className="inline-flex items-center gap-1.5 text-xs text-faint">
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              Computing
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          {/* The in-table filter row is hidden below `md`, so the sheet is the
              only place to reach a column filter on a phone. */}
          <DataGridFilterPanel
            table={table}
            activeCount={filterCount}
            disabled={disabled}
            onFilterChange={onFilterChange}
            onClearAll={onClearColumnFilters}
            getFacetCounts={getFacetCounts}
          />
          {onExport ? (
            <button
              type="button"
              onClick={onExport}
              disabled={disabled}
              aria-label="Export filtered rows to CSV"
              title="Export filtered rows to CSV"
              className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line bg-raised px-2.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
            >
              <Download aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          ) : null}
          {toolbarActions}
          <DataGridColumnMenu table={table} disabled={disabled} />
        </div>
      </div>

      <DataGridFilterChips
        chips={chips}
        onRemove={onRemoveColumnFilter}
        onClearAll={onClearColumnFilters}
        disabled={disabled}
      />
    </>
  )
}
