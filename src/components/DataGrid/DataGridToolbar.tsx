import type { Table } from '@tanstack/react-table'
import { Filter, Loader2, SlidersHorizontal, X } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { buttonClass } from '@/components/ui/buttonStyles'
import { toolbarClass } from '@/components/ui/surfaces'
import { pluralize } from '@/shared/lib/format'
import { DataGridColumnMenu } from './DataGridColumnMenu'
import { DataGridFilterChips } from './DataGridFilterChips'
import { DataGridSearch } from './DataGridSearch'
import type { FilterChip } from './utils'

interface DataGridToolbarProps<TData> {
  table: Table<TData>
  search: string
  onSearchChange: (value: string) => void
  onClearColumnFilters: () => void
  onRemoveColumnFilter: (columnId: string) => void
  chips: readonly FilterChip[]
  activeFilterCount: number
  isPending: boolean
  /** Whether the filter row is expanded. */
  filterRowOpen: boolean
  /** False when no visible column can be filtered. */
  canToggleFilterRow: boolean
  onToggleFilterRow: () => void
  searchPlaceholder?: string
  searchRef: RefObject<HTMLInputElement | null>
  toolbarActions?: ReactNode
  disabled?: boolean
}

export function DataGridToolbar<TData>({
  table,
  search,
  onSearchChange,
  onClearColumnFilters,
  onRemoveColumnFilter,
  chips,
  activeFilterCount,
  isPending,
  filterRowOpen,
  canToggleFilterRow,
  onToggleFilterRow,
  searchPlaceholder,
  searchRef,
  toolbarActions,
  disabled = false,
}: DataGridToolbarProps<TData>) {
  return (
    <>
      <div className={toolbarClass}>
        <DataGridSearch
          search={search}
          onSearchChange={onSearchChange}
          searchRef={searchRef}
          placeholder={searchPlaceholder}
          disabled={disabled}
        />

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onClearColumnFilters}
              title="Clear all column filters"
              className={buttonClass({
                variant: 'primary',
                size: 'md',
                className: 'px-2.5',
              })}
            >
              <SlidersHorizontal aria-hidden="true" className="size-3.5" />
              Clear {activeFilterCount} {pluralize(activeFilterCount, 'filter')}
              <X aria-hidden="true" className="size-3.5" />
            </button>
          ) : null}

          {isPending ? (
            <span role="status" className="inline-flex items-center gap-1.5 text-xs text-faint">
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              Computing
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {toolbarActions}
          {canToggleFilterRow ? (
            <button
              type="button"
              onClick={onToggleFilterRow}
              aria-label="Filters"
              aria-expanded={filterRowOpen}
              title={filterRowOpen ? 'Hide column filters' : 'Show column filters'}
              className={buttonClass({
                variant: filterRowOpen ? 'secondary' : 'ghost',
                size: 'md',
                className: 'w-9 px-0 sm:w-auto sm:px-2.5',
              })}
            >
              <Filter aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          ) : null}
          <DataGridColumnMenu table={table} disabled={disabled} />
        </div>
      </div>

      <DataGridFilterChips
        chips={chips}
        onRemove={onRemoveColumnFilter}
        disabled={disabled}
      />
    </>
  )
}
