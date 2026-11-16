import type { Table } from '@tanstack/react-table'
import { Download, Loader2 } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { toolbarClass } from '@/components/ui/surfaces'
import { DataGridColumnMenu } from './DataGridColumnMenu'
import { DataGridFilterChips } from './DataGridFilterChips'
import { DataGridSearch } from './DataGridSearch'
import type { FilterChip } from './utils'

interface DataGridToolbarProps<TData> {
  table: Table<TData>
  search: string
  onSearchChange: (value: string) => void
  onClearColumnFilters: () => void
  onRemoveColumnFilter: (columnId: string, raw?: string) => void
  chips: readonly FilterChip[]
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
  chips,
  isPending,
  searchPlaceholder,
  searchRef,
  toolbarActions,
  onExport,
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
          {isPending ? (
            <span role="status" className="inline-flex items-center gap-1.5 text-xs text-faint">
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              Computing
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
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
