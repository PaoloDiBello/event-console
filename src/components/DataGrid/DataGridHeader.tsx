import { flexRender, type Column, type Table } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { cn } from '@/shared/lib/cn'
import { DataGridColumnFilter } from './DataGridColumnFilter'
import { isBlank } from './model/accessors'
import { pinnedColumnClass } from './pinnedColumn'

interface DataGridHeaderProps<TData> {
  table: Table<TData>
  /** Columns actually rendered; `hideBelow` columns are absent on a phone. */
  visibleColumns: readonly Column<TData, unknown>[]
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
  visibleColumns,
  showFilterRow,
  isLoading,
  onSort,
  onFilterChange,
  getFacetCounts,
}: DataGridHeaderProps<TData>) {
  const visibleIds = new Set(visibleColumns.map((column) => column.id))
  /**
   * One tab stop for the header row, parked on the column that is currently
   * sorting. Tabbing through eight sort buttons to reach the rows was the cost
   * of the arrows being individually focusable; the arrows now move between
   * them instead.
   */
  const sortableIds = visibleColumns
    .filter((column) => column.getCanSort())
    .map((column) => column.id)
  const sortedId = table.getState().sorting[0]?.id
  const tabStopId = sortedId && sortableIds.includes(sortedId) ? sortedId : sortableIds[0]

  const moveHeaderFocus = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const buttons = Array.from(
      event.currentTarget.closest('tr')?.querySelectorAll<HTMLButtonElement>('[data-sort-header]') ??
        [],
    )
    const index = buttons.indexOf(event.currentTarget)
    if (index === -1) return
    const next = buttons[index + (event.key === 'ArrowRight' ? 1 : -1)]
    if (!next) return
    event.preventDefault()
    next.focus()
  }

  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers
            .filter((header) => visibleIds.has(header.column.id))
            .map((header, headerIndex) => {
            const sorted = header.column.getIsSorted()
            const filterValue = header.column.getFilterValue()
            const filtered = !isBlank(filterValue)
            const align = header.column.columnDef.meta?.align
            const compact = header.column.columnDef.meta?.compact
            // The first rendered column is pinned at every width. In the
            // registry that is the 32px selection gutter, so the checkboxes
            // stay reachable while the rest of the row scrolls under it.
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
                  pinned && `${pinnedColumnClass} z-30`,
                )}
              >
                {header.isPlaceholder ? null : (
                  <>
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        disabled={isLoading}
                        data-sort-header=""
                        tabIndex={header.column.id === tabStopId ? 0 : -1}
                        onKeyDown={moveHeaderFocus}
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
          {table
            .getHeaderGroups()[0]
            ?.headers.filter((header) => visibleIds.has(header.column.id))
            .map((header, headerIndex) => (
              <th
                key={`${header.id}-filter`}
                scope="col"
                data-pinned={headerIndex === 0 ? '' : undefined}
                className={cn(
                  'sticky top-10 z-20 border-b border-line bg-surface py-1.5 font-normal',
                  header.column.columnDef.meta?.compact ? 'px-1' : 'px-2',
                  headerIndex === 0 && `${pinnedColumnClass} z-30`,
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
