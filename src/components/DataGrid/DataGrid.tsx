import {
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { formatCount, pluralize } from '@/shared/lib/format'
import { hasCommandModifier, isShortcutBlocked, useGlobalKeydown } from '@/shared/lib/keyboard'
import { DataGridEmpty } from './DataGridEmpty'
import { DataGridError } from './DataGridError'
import { DataGridPagination } from './DataGridPagination'
import { DataGridTable } from './DataGridTable'
import { DataGridToolbar } from './DataGridToolbar'
import { buildRows } from './model'
import { activeFilterCount } from './utils'
import type { DataGridProps } from './types'

const DEFAULT_ROW_HEIGHT = 44
const PAGE_SIZE_OPTIONS = [25, 50, 100, 250] as const

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

  const sortByColumn = (column: Column<TData, unknown>, event: unknown) => {
    const handler = column.getToggleSortingHandler()
    if (!handler) return
    // Sorting 100k rows is a non-urgent update: keep the UI responsive and
    // show the pending hint.
    startTransition(() => handler(event))
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    )
  }

  const filterByColumn = (column: Column<TData, unknown>, value: string | undefined) => {
    column.setFilterValue(value)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  // A fresh page/filter/sort should start at the top of the list, not halfway
  // down a scroll container that is now showing different rows.
  const resetKey = JSON.stringify([
    sorting,
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
  ])
  useEffect(() => {
    if (skipScrollResetRef.current) {
      skipScrollResetRef.current = false
      return
    }
    scrollRef.current?.scrollTo({ top: 0 })
  }, [resetKey])

  // "/" jumps to the search box, the way most data tools behave.
  useGlobalKeydown((event) => {
    if (event.key !== '/' || event.defaultPrevented || event.repeat || hasCommandModifier(event)) {
      return
    }
    if (isShortcutBlocked(event.target)) return
    event.preventDefault()
    searchRef.current?.focus()
  })

  const rangeStart = filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const rangeEnd = Math.min(filteredCount, (pagination.pageIndex + 1) * pagination.pageSize)

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
          <DataGridError error={error} onRetry={onRetry} />
        ) : (
          <div
            ref={scrollRef}
            aria-busy={isLoading}
            className="scrollbar-thin h-full overflow-auto"
          >
            <DataGridTable
              table={table}
              visibleColumns={visibleColumns}
              caption={caption}
              filteredCount={filteredCount}
              sorting={sorting}
              isLoading={isLoading}
              showFilterRow={showFilterRow}
              rows={rows}
              virtualRows={virtualRows}
              paddingTop={paddingTop}
              paddingBottom={paddingBottom}
              rowHeight={rowHeight}
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              getRowClassName={getRowClassName}
              onSort={sortByColumn}
              onFilterChange={filterByColumn}
              emptyState={
                <DataGridEmpty
                  totalRows={data.length}
                  hasSearch={hasSearch}
                  hasFilters={hasFilters}
                  emptyTitle={emptyTitle}
                  emptyHint={emptyHint}
                  onClearSearch={clearSearch}
                  onClearFilters={clearColumnFilters}
                  onClearAll={clearAll}
                />
              }
            />
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
