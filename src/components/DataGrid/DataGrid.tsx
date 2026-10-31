import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Inbox,
  RotateCcw,
  SearchX,
  SlidersHorizontal,
} from 'lucide-react'
import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { cn } from '@/lib/cn'
import { formatCount, pluralize } from '@/lib/format'
import { DataGridToolbar } from './DataGridToolbar'
import { DataGridPagination } from './DataGridPagination'
import { buildRows } from './model'
import { activeFilterCount } from './utils'
import type { DataGridProps } from './types'

const DEFAULT_ROW_HEIGHT = 44
const PAGE_SIZE_OPTIONS = [25, 50, 100, 250] as const

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp aria-hidden="true" className="size-3 text-accent" />
  if (direction === 'desc') return <ArrowDown aria-hidden="true" className="size-3 text-accent" />
  return <ChevronsUpDown aria-hidden="true" className="size-3 text-faint/60" />
}

export function DataGrid<TData>({
  data,
  columns,
  getRowId,
  caption,
  isLoading = false,
  error = null,
  onRetry,
  globalFilterFn,
  searchPlaceholder,
  initialSorting,
  initialPageSize = 50,
  initialColumnVisibility,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  emptyTitle = 'Nothing here yet',
  emptyHint = 'Rows will appear here once data is available.',
  getRowClassName,
  focusRowId,
  toolbarActions,
  rowHeight = DEFAULT_ROW_HEIGHT,
}: DataGridProps<TData>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? [])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  )
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  // Search is the one control that can reasonably outrun the 100k-row filter
  // pass: the input stays urgent, the table catches up on the deferred value.
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setGlobalFilter(deferredSearch.trim())
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    )
  }, [deferredSearch])

  // Filter, sort and count the full data set here, then give TanStack only the
  // current page. Its row model stays small even when the source is 100k rows.
  const displayRows = useMemo(
    () => buildRows(data, columns, columnFilters, globalFilter, globalFilterFn, sorting),
    [data, columns, columnFilters, globalFilter, globalFilterFn, sorting],
  )
  const filteredCount = displayRows.length
  const pageCount = Math.max(1, Math.ceil(filteredCount / pagination.pageSize))

  // Filters can shrink the list below the current page without going through
  // the pagination controls; keep the index inside the valid range.
  useEffect(() => {
    setPagination((current) => {
      const maxPage = Math.max(0, Math.ceil(filteredCount / current.pageSize) - 1)
      return current.pageIndex > maxPage ? { ...current, pageIndex: maxPage } : current
    })
  }, [filteredCount])

  const pageRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return displayRows.slice(start, start + pagination.pageSize)
  }, [displayRows, pagination.pageIndex, pagination.pageSize])

  const table = useReactTable({
    data: pageRows,
    columns,
    getRowId,
    state: { sorting, columnFilters, globalFilter, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    // Passing `undefined` here would override TanStack's `'auto'` default and
    // silently turn global search off, so fall back explicitly.
    globalFilterFn: globalFilterFn ?? 'auto',
    // The grid does the work; the table only renders the supplied page.
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    // Turn off the built-in auto reset: page resets are handled next to the
    // filter/sort controls so they are easy to reason about.
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
  })

  const rows = table.getRowModel().rows
  const visibleColumns = table.getVisibleLeafColumns()
  const filterCount = activeFilterCount(columnFilters)
  const hasSearch = globalFilter.length > 0
  const hasFilters = filterCount > 0
  const hasQuery = hasSearch || hasFilters
  const showFilterRow = useMemo(
    () => visibleColumns.some((column) => column.columnDef.meta?.filter),
    [visibleColumns],
  )

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 14,
  })

  const pendingRowScrollRef = useRef<string | null>(null)
  /** Set when a reveal already positioned the page, so the generic reset skips. */
  const skipScrollResetRef = useRef(false)

  /** Scroll to a row and make the virtualizer read the new offset immediately. */
  const scrollToRow = (index: number) => {
    rowVirtualizer.scrollToIndex(index, { align: 'center' })
    // Browsers throttle the async scroll event in background/occluded tabs;
    // dispatching it here keeps the rendered window in sync with scrollTop.
    scrollRef.current?.dispatchEvent(new Event('scroll'))
  }

  // Reveal a specific row (the one just created or edited): if it lives on a
  // different page, go there first, then scroll within the page.
  useEffect(() => {
    if (!focusRowId) return
    const index = displayRows.findIndex((row) => getRowId(row) === focusRowId)
    if (index < 0) return

    const targetPage = Math.floor(index / pagination.pageSize)
    if (targetPage !== pagination.pageIndex) {
      pendingRowScrollRef.current = focusRowId
      setPagination((current) => ({ ...current, pageIndex: targetPage }))
      return
    }
    scrollToRow(index % pagination.pageSize)
    // Only react to a new target row, not to the table's own recomputation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRowId])

  // Scroll after the page's rows are in the DOM. A layout effect is more
  // reliable here than rAF, which browsers throttle in background tabs.
  useLayoutEffect(() => {
    const rowId = pendingRowScrollRef.current
    if (!rowId) return
    const index = displayRows.findIndex((row) => getRowId(row) === rowId)
    if (index < 0) return
    pendingRowScrollRef.current = null
    skipScrollResetRef.current = true
    scrollToRow(index % pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize])

  const virtualRows = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end
      : 0

  const clearColumnFilters = () => {
    setColumnFilters([])
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const clearSearch = () => {
    setSearch('')
    setGlobalFilter('')
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  // Only the empty state resets both: the toolbar keeps search and filters
  // independent so one never silently discards the other.
  const clearAll = () => {
    setSearch('')
    setGlobalFilter('')
    setColumnFilters([])
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const emptyQueryTitle =
    hasSearch && hasFilters
      ? 'No rows match your search and filters'
      : hasSearch
        ? 'No rows match your search'
        : 'No rows match these filters'
  const emptyQueryHint =
    hasSearch && hasFilters
      ? `0 of ${formatCount(data.length)} ${pluralize(data.length, 'row')} matched. Try a broader search or remove a filter.`
      : hasSearch
        ? `0 of ${formatCount(data.length)} ${pluralize(data.length, 'row')} matched. Try a broader search.`
        : `0 of ${formatCount(data.length)} ${pluralize(data.length, 'row')} matched. Clear a filter to see more rows.`
  const emptyQueryAction =
    hasSearch && hasFilters
      ? { label: 'Clear search and filters', onClick: clearAll }
      : hasSearch
        ? { label: 'Clear search', onClick: clearSearch }
        : { label: 'Clear filters', onClick: clearColumnFilters }

  // A fresh page/filter/sort should start at the top of the list, not halfway
  // down a scroll container that is now showing different rows.
  const resetKey = JSON.stringify([sorting, columnFilters, globalFilter, pagination.pageIndex, pagination.pageSize])
  useEffect(() => {
    if (skipScrollResetRef.current) {
      skipScrollResetRef.current = false
      return
    }
    scrollRef.current?.scrollTo({ top: 0 })
  }, [resetKey])

  // "/" jumps to the search box, the way most data tools behave.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) {
        return
      }
      event.preventDefault()
      searchRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const columnCount = Math.max(visibleColumns.length, 1)
  const rangeStart = filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const rangeEnd = Math.min(filteredCount, (pagination.pageIndex + 1) * pagination.pageSize)
  // aria-rowcount/aria-rowindex include the header row(s), so virtualized data
  // rows must be numbered after them (title row, plus the filter row when shown).
  const headerRowCount = showFilterRow ? 2 : 1
  const bodyRowCount = isLoading ? 10 : rows.length === 0 ? 1 : filteredCount

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-surface/70 shadow-2xl shadow-black/30">
      <DataGridToolbar
        table={table}
        search={search}
        onSearchChange={setSearch}
        onClearColumnFilters={clearColumnFilters}
        activeFilterCount={filterCount}
        isPending={isPending}
        searchPlaceholder={searchPlaceholder}
        searchRef={searchRef}
        toolbarActions={toolbarActions}
        disabled={isLoading || Boolean(error)}
      />

      <div className="relative min-h-0 flex-1">
        {error ? (
          <div className="flex h-full items-center justify-center p-8">
            <div
              role="alert"
              className="max-w-md rounded-md border border-rose/25 bg-rose/[0.06] p-6 text-center"
            >
              <AlertTriangle aria-hidden="true" className="mx-auto size-6 text-rose" />
              <h2 className="mt-3 text-sm font-semibold text-ink">Could not load rows</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{error}</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-sm border border-rose/30 bg-rose/10 px-3 text-xs font-medium text-rose transition-colors hover:bg-rose/15"
                >
                  <RotateCcw aria-hidden="true" className="size-3.5" />
                  Retry
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div
            ref={scrollRef}
            aria-busy={isLoading}
            className="scrollbar-thin h-full overflow-auto"
          >
            <table
              aria-rowcount={bodyRowCount + headerRowCount}
              className="w-full min-w-[1040px] table-fixed border-separate border-spacing-0 text-sm"
            >
              <caption className="sr-only">
                {caption}. {formatCount(filteredCount)} rows, sorted{' '}
                {sorting.length > 0 ? `by ${sorting[0]!.id} ${sorting[0]!.desc ? 'descending' : 'ascending'}` : 'by default'}.
              </caption>
              <colgroup>
                {visibleColumns.map((column) => (
                  <col
                    key={column.id}
                    style={column.columnDef.meta?.width ? { width: column.columnDef.meta.width } : undefined}
                  />
                ))}
              </colgroup>

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
                              onClick={(event) => {
                                const handler = header.column.getToggleSortingHandler()
                                if (!handler) return
                                // Sorting 100k rows is a non-urgent update: keep
                                // the UI responsive and show the pending hint.
                                startTransition(() => handler(event))
                                setPagination((current) =>
                                  current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
                                )
                              }}
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
                      return (
                        <th
                          key={`${header.id}-filter`}
                          scope="col"
                          className="sticky top-10 z-20 border-b border-line bg-surface px-2 py-1.5 font-normal"
                        >
                          {meta?.filter === 'select' ? (
                            <select
                              aria-label={`Filter by ${typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}`}
                              value={typeof value === 'string' ? value : ''}
                              disabled={isLoading}
                              onChange={(event) => {
                                column.setFilterValue(event.target.value || undefined)
                                setPagination((current) => ({ ...current, pageIndex: 0 }))
                              }}
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
                              aria-label={`Filter by ${typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}`}
                              value={typeof value === 'string' ? value : ''}
                              placeholder={meta.filter === 'text' ? 'Filter…' : undefined}
                              disabled={isLoading}
                              onChange={(event) => {
                                column.setFilterValue(event.target.value || undefined)
                                setPagination((current) => ({ ...current, pageIndex: 0 }))
                              }}
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

              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }, (_, rowIndex) => (
                    <tr key={`skeleton-${rowIndex}`} style={{ height: rowHeight }}>
                      {visibleColumns.map((column, columnIndex) => (
                        <td key={column.id} className="border-b border-line/60 px-3">
                          <div
                            className="h-2.5 animate-pulse rounded-full bg-line/80"
                            style={{ width: `${45 + ((rowIndex * 13 + columnIndex * 29) % 45)}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={columnCount} className="p-0">
                      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
                        {hasSearch ? (
                          <SearchX aria-hidden="true" className="size-7 text-faint" />
                        ) : hasFilters ? (
                          <SlidersHorizontal aria-hidden="true" className="size-7 text-faint" />
                        ) : (
                          <Inbox aria-hidden="true" className="size-7 text-faint" />
                        )}
                        <p className="mt-3 text-sm font-medium text-ink">
                          {hasQuery ? emptyQueryTitle : emptyTitle}
                        </p>
                        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
                          {hasQuery ? emptyQueryHint : emptyHint}
                        </p>
                        {hasQuery ? (
                          <button
                            type="button"
                            onClick={emptyQueryAction.onClick}
                            className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-sm border border-line-strong bg-raised px-3 text-xs font-medium text-ink transition-colors hover:border-accent/40 hover:text-accent"
                          >
                            {emptyQueryAction.label}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {paddingTop > 0 ? (
                      <tr aria-hidden="true" style={{ height: paddingTop }}>
                        <td colSpan={columnCount} style={{ padding: 0, border: 0 }} />
                      </tr>
                    ) : null}

                    {virtualRows.map((virtualRow) => {
                      const row = rows[virtualRow.index]
                      if (!row) return null
                      const rowNumber = pagination.pageIndex * pagination.pageSize + virtualRow.index + 1
                      return (
                        <tr
                          key={row.id}
                          aria-rowindex={rowNumber + headerRowCount}
                          style={{ height: rowHeight }}
                          className={cn(
                            'group transition-colors hover:bg-raised/70',
                            getRowClassName?.(row.original),
                          )}
                        >
                          {row.getVisibleCells().map((cell) => {
                            const align = cell.column.columnDef.meta?.align
                            return (
                              <td
                                key={cell.id}
                                className={cn(
                                  'overflow-hidden border-b border-line/60 px-3 text-muted',
                                  align === 'right' && 'text-right',
                                  align === 'center' && 'text-center',
                                )}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}

                    {paddingBottom > 0 ? (
                      <tr aria-hidden="true" style={{ height: paddingBottom }}>
                        <td colSpan={columnCount} style={{ padding: 0, border: 0 }} />
                      </tr>
                    ) : null}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DataGridPagination
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        pageCount={pageCount}
        totalRows={filteredCount}
        pageSizeOptions={pageSizeOptions}
        onPageChange={(pageIndex) => setPagination((current) => ({ ...current, pageIndex }))}
        onPageSizeChange={(pageSize) =>
          setPagination((current) => ({ ...current, pageSize, pageIndex: 0 }))
        }
      />

      {/* Screen readers get the result count without having to hunt for it. */}
      <p className="sr-only" role="status">
        {isLoading
          ? 'Loading rows'
          : `${formatCount(filteredCount)} ${pluralize(filteredCount, 'row')} match. Showing ${formatCount(rangeStart)} to ${formatCount(rangeEnd)}.`}
      </p>
    </section>
  )
}
