import { flexRender, type Column, type Table } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface DataGridHeaderProps<TData> {
  table: Table<TData>
  showFilterRow: boolean
  isLoading: boolean
  onSort: (column: Column<TData, unknown>, event: unknown) => void
  onFilterChange: (column: Column<TData, unknown>, value: string | undefined) => void
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp aria-hidden="true" className="size-3 text-accent" />
  if (direction === 'desc') return <ArrowDown aria-hidden="true" className="size-3 text-accent" />
  return <ChevronsUpDown aria-hidden="true" className="size-3 text-faint/60" />
}

function headerLabel<TData>(column: Column<TData, unknown>): string {
  return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id
}

export function DataGridHeader<TData>({
  table,
  showFilterRow,
  isLoading,
  onSort,
  onFilterChange,
}: DataGridHeaderProps<TData>) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const sorted = header.column.getIsSorted()
            const align = header.column.columnDef.meta?.align
            return (
              <th
                key={header.id}
                scope="col"
                aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                className={cn(
                  'sticky top-0 z-20 h-10 border-b border-line bg-surface p-0',
                  'font-mono text-[10px] font-medium tracking-[0.14em] text-faint uppercase',
                )}
              >
                {header.isPlaceholder ? null : (
                  <button
                    type="button"
                    disabled={!header.column.getCanSort() || isLoading}
                    onClick={(event) => onSort(header.column, event)}
                    className={cn(
                      'flex h-10 w-full items-center gap-1.5 px-3 text-inherit',
                      align === 'right' && 'justify-end',
                      align === 'center' && 'justify-center',
                      header.column.getCanSort()
                        ? 'cursor-pointer transition-colors hover:text-ink'
                        : 'cursor-default',
                    )}
                  >
                    <span className="truncate">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    {header.column.getCanSort() ? <SortIcon direction={sorted} /> : null}
                  </button>
                )}
              </th>
            )
          })}
        </tr>
      ))}

      {showFilterRow ? (
        <tr>
          {table.getHeaderGroups()[0]?.headers.map((header) => {
            const column = header.column
            const meta = column.columnDef.meta
            const value = column.getFilterValue()
            const align = meta?.align
            const label = headerLabel(column)

            return (
              <th
                key={`${header.id}-filter`}
                scope="col"
                className="sticky top-10 z-20 border-b border-line bg-surface px-2 py-1.5 font-normal"
              >
                {meta?.filter === 'select' ? (
                  <select
                    aria-label={`Filter by ${label}`}
                    value={typeof value === 'string' ? value : ''}
                    disabled={isLoading}
                    onChange={(event) => onFilterChange(column, event.target.value || undefined)}
                    className={cn(
                      'h-7 w-full rounded-xs border border-line bg-canvas px-1.5 text-[11px] text-muted',
                      'focus:border-accent/60 focus:text-ink focus:outline-none disabled:opacity-50',
                    )}
                  >
                    <option value="">All</option>
                    {(meta.filterOptions ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : meta?.filter === 'text' || meta?.filter === 'date' ? (
                  <input
                    type={meta.filter === 'date' ? 'date' : 'text'}
                    aria-label={`Filter by ${label}`}
                    value={typeof value === 'string' ? value : ''}
                    placeholder={meta.filter === 'text' ? 'Filter…' : undefined}
                    disabled={isLoading}
                    onChange={(event) => onFilterChange(column, event.target.value || undefined)}
                    className={cn(
                      'h-7 w-full rounded-xs border border-line bg-canvas px-1.5 text-[11px] text-ink placeholder:text-faint/70',
                      'focus:border-accent/60 focus:outline-none disabled:opacity-50',
                      align === 'right' && 'text-right',
                    )}
                  />
                ) : null}
              </th>
            )
          })}
        </tr>
      ) : null}
    </thead>
  )
}
