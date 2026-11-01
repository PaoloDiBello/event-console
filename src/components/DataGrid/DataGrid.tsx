import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { formatCount, pluralize } from '@/shared/lib/format'
import { DataGridEmpty } from './DataGridEmpty'
import { DataGridError } from './DataGridError'
import { DataGridPagination } from './DataGridPagination'
import { DataGridTable } from './DataGridTable'
import { DataGridToolbar } from './DataGridToolbar'
import { useDataGridController } from './hooks/useDataGridController'
import { useDataGridShortcuts } from './hooks/useDataGridShortcuts'
import { useGridScrollReset } from './hooks/useGridScrollReset'
import { useRowReveal } from './hooks/useRowReveal'
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

  const grid = useDataGridController({
    data,
    columns,
    getRowId,
    globalFilterFn,
    initialSorting,
    initialPageSize,
    initialColumnVisibility,
  })

  // TanStack Virtual intentionally exposes non-memoizable instance methods;
  // this component is not compiled by React Compiler.
  // oxlint-disable-next-line react/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: grid.rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 14,
  })

  const { skipScrollResetRef } = useRowReveal({
    focusRowId,
    displayRows: grid.displayRows,
    getRowId,
    pagination: grid.pagination,
    setPage: grid.setPage,
    scrollRef,
    virtualizer: rowVirtualizer,
  })

  useGridScrollReset({ scrollRef, resetKey: grid.resetKey, skipRef: skipScrollResetRef })
  useDataGridShortcuts(searchRef)

  const virtualRows = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end
      : 0

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-surface/70 shadow-2xl shadow-black/30">
      <DataGridToolbar
        table={grid.table}
        search={grid.search}
        onSearchChange={grid.setSearch}
        onClearColumnFilters={grid.clearColumnFilters}
        activeFilterCount={grid.filterCount}
        isPending={grid.isPending}
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
              table={grid.table}
              visibleColumns={grid.visibleColumns}
              caption={caption}
              filteredCount={grid.filteredCount}
              sorting={grid.sorting}
              isLoading={isLoading}
              showFilterRow={grid.showFilterRow}
              rows={grid.rows}
              virtualRows={virtualRows}
              paddingTop={paddingTop}
              paddingBottom={paddingBottom}
              rowHeight={rowHeight}
              pageIndex={grid.pagination.pageIndex}
              pageSize={grid.pagination.pageSize}
              getRowClassName={getRowClassName}
              onSort={grid.sortByColumn}
              onFilterChange={grid.filterByColumn}
              emptyState={
                <DataGridEmpty
                  totalRows={data.length}
                  hasSearch={grid.hasSearch}
                  hasFilters={grid.hasFilters}
                  emptyTitle={emptyTitle}
                  emptyHint={emptyHint}
                  onClearSearch={grid.clearSearch}
                  onClearFilters={grid.clearColumnFilters}
                  onClearAll={grid.clearAll}
                />
              }
            />
          </div>
        )}
      </div>

      <DataGridPagination
        pageIndex={grid.pagination.pageIndex}
        pageSize={grid.pagination.pageSize}
        pageCount={grid.pageCount}
        totalRows={grid.filteredCount}
        pageSizeOptions={pageSizeOptions}
        onPageChange={grid.setPage}
        onPageSizeChange={grid.setPageSize}
      />

      {/* Screen readers get the result count without having to hunt for it. */}
      <p className="sr-only" role="status">
        {isLoading
          ? 'Loading rows'
          : `${formatCount(grid.filteredCount)} ${pluralize(grid.filteredCount, 'row')} match. Showing ${formatCount(grid.rangeStart)} to ${formatCount(grid.rangeEnd)}.`}
      </p>
    </section>
  )
}
