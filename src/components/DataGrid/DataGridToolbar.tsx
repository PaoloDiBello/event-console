import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu'
import type { Table } from '@tanstack/react-table'
import { Columns3, Loader2, Search, SlidersHorizontal, X } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { pluralize } from '@/lib/format'

interface DataGridToolbarProps<TData> {
  table: Table<TData>
  search: string
  onSearchChange: (value: string) => void
  onClearFilters: () => void
  activeFilterCount: number
  isPending: boolean
  searchPlaceholder?: string
  searchRef: RefObject<HTMLInputElement | null>
  toolbarActions?: ReactNode
  disabled?: boolean
}

function columnLabel<TData>(table: Table<TData>, columnId: string): string {
  const column = table.getColumn(columnId)
  const header = column?.columnDef.header
  return typeof header === 'string' ? header : (column?.id ?? columnId)
}

export function DataGridToolbar<TData>({
  table,
  search,
  onSearchChange,
  onClearFilters,
  activeFilterCount,
  isPending,
  searchPlaceholder = 'Search rows…',
  searchRef,
  toolbarActions,
  disabled = false,
}: DataGridToolbarProps<TData>) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && column.columnDef.meta?.hideable !== false)

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface/80 px-3 py-2.5">
      <div className="relative min-w-56 flex-1 sm:max-w-sm">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
        />
        <input
          ref={searchRef}
          type="search"
          value={search}
          disabled={disabled}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search all columns"
          className="h-9 w-full rounded-sm border border-line bg-canvas pr-16 pl-9 text-sm text-ink placeholder:text-faint focus:border-accent/60 focus:outline-none disabled:opacity-50 [&::-webkit-search-cancel-button]:hidden"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-xs p-1 text-faint transition-colors hover:text-ink"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        ) : (
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-xs border border-line bg-raised px-1.5 py-0.5 font-mono text-[10px] text-faint"
          >
            /
          </kbd>
        )}
      </div>

      <div className="flex items-center gap-2">
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-accent/30 bg-accent/10 px-2.5 text-xs font-medium text-accent transition-colors hover:bg-accent/15"
          >
            <SlidersHorizontal aria-hidden="true" className="size-3.5" />
            {activeFilterCount} {pluralize(activeFilterCount, 'filter')}
            <X aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Clear all filters</span>
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="inline-flex h-9 items-center gap-2 rounded-sm border border-line bg-raised px-3 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
            >
              <Columns3 aria-hidden="true" className="size-3.5" />
              Columns
              <span className="rounded-xs bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-faint">
                {table.getVisibleLeafColumns().length}/{table.getAllLeafColumns().length}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="z-50 min-w-52 rounded-md border border-line-strong bg-raised p-1 shadow-2xl shadow-black/60"
          >
            <DropdownMenuLabel className="px-2 py-1.5 font-mono text-[10px] tracking-widest text-faint uppercase">
              Visible columns
            </DropdownMenuLabel>
            {hideableColumns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={() => column.toggleVisibility()}
                // Keep the menu open so several columns can be toggled in a row.
                onSelect={(event) => event.preventDefault()}
                className="flex cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-xs text-muted outline-none select-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink"
              >
                {columnLabel(table, column.id)}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator className="my-1 h-px bg-line" />
            <DropdownMenuItem
              onSelect={() => table.resetColumnVisibility()}
              className="cursor-pointer rounded-xs px-2 py-1.5 text-xs text-faint outline-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink"
            >
              Show all columns
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
