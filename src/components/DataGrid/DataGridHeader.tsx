import { flexRender, type Column, type Table } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { DataGridColumnFilter } from './DataGridColumnFilter'
import { isBlank } from './model/accessors'
import { pinnedColumnClass } from './pinnedColumn'

interface DataGridHeaderProps<TData> {
  table: Table<TData>
  showFilterRow: boolean
  isLoading: boolean
  onSort: (column: Column<TData, unknown>, event: unknown) => void
  onFilterChange: (
    column: Column<TData, unknown>,
    value: string | string[] | undefined,
  ) => void
  getFacetCounts?: (columnId: string) => Record<string, number>
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp aria-hidden="true" className="size-3 text-accent" />
  if (direction === 'desc') return <ArrowDown aria-hidden="true" className="size-3 text-accent" />
  return <ChevronsUpDown aria-hidden="true" className="size-3 text-faint/60" />
}

export function DataGridHeader<TData>({
  table,
  showFilterRow,
  isLoading,
  onSort,
  onFilterChange,
  getFacetCounts,
}: DataGridHeaderProps<TData>) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header, headerIndex) => {
            const sorted = header.column.getIsSorted()
            const filterValue = header.column.getFilterValue()
            const filtered = !isBlank(filterValue)
            const align = header.column.columnDef.meta?.align
            const compact = header.column.columnDef.meta?.compact
            // The first visible column stays put horizontally so a row keeps
            // its identity while the rest of the table scrolls under it. Only
            // from `sm` up: on a phone the column is most of the viewport, and
            // pinning it would leave almost nothing to scroll through.
            const pinned = headerIndex === 0
            return (
              <th
                key={header.id}
                scope="col"
                data-pinned={pinned ? '' : undefined}
                aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                className={cn(
                  'sticky top-0 z-20 h-10 border-b border-line bg-surface p-0 relative',
                  'font-mono text-[10px] font-medium tracking-[0.14em] text-faint uppercase',
                  pinned && `${pinnedColumnClass} sm:z-30`,
                )}
              >
                {header.isPlaceholder ? null : (
                  <>
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={(event) => onSort(header.column, event)}
                        className={cn(
                          'flex h-10 w-full items-center gap-1.5 text-inherit',
                          compact ? 'px-1' : 'px-3',
                          align === 'right' && 'justify-end',
                          align === 'center' && 'justify-center',
                          'cursor-pointer transition-colors hover:text-ink',
                        )}
                      >
                        <span className="truncate">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {filtered ? (
                          <span
                            aria-hidden="true"
                            title="Filtered"
                            className="size-1.5 shrink-0 rounded-full bg-accent"
                          />
                        ) : null}
                        <SortIcon direction={sorted} />
                      </button>
                    ) : (
                      <div
                        className={cn(
                          'flex h-10 w-full items-center gap-1.5 text-inherit',
                          compact ? 'px-1' : 'px-3',
                          align === 'right' && 'justify-end',
                          align === 'center' && 'justify-center',
                        )}
                      >
                        <span className="truncate">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {filtered ? (
                          <span
                            aria-hidden="true"
                            title="Filtered"
                            className="size-1.5 shrink-0 rounded-full bg-accent"
                          />
                        ) : null}
                      </div>
                    )}
                    {header.column.getCanResize() ? (
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onClick={(event) => event.stopPropagation()}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none bg-transparent hover:bg-line-strong"
                      />
                    ) : null}
                  </>
                )}
              </th>
            )
          })}
        </tr>
      ))}

      {showFilterRow ? (
        <tr>
          {table.getHeaderGroups()[0]?.headers.map((header, headerIndex) => (
            <th
              key={`${header.id}-filter`}
              scope="col"
              data-pinned={headerIndex === 0 ? '' : undefined}
              className={cn(
                'sticky top-10 z-20 border-b border-line bg-surface py-1.5 font-normal',
                header.column.columnDef.meta?.compact ? 'px-1' : 'px-2',
                headerIndex === 0 && `${pinnedColumnClass} sm:z-30`,
              )}
            >
              <DataGridColumnFilter
                column={header.column}
                disabled={isLoading}
                onChange={onFilterChange}
                getFacetCounts={getFacetCounts}
              />
            </th>
          ))}
        </tr>
      ) : null}
    </thead>
  )
}
