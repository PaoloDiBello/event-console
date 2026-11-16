import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Kbd } from '@/components/ui/Kbd'
import { panelClass } from '@/components/ui/surfaces'
import { formatCount, pluralize } from '@/shared/lib/format'
import { DataGridEmpty } from './DataGridEmpty'
import { DataGridError } from './DataGridError'
import { DataGridPagination } from './DataGridPagination'
import { DataGridScrollFade } from './DataGridScrollFade'
import { DataGridTable } from './DataGridTable'
import { DataGridToolbar } from './DataGridToolbar'
import { useDataGridController } from './hooks/useDataGridController'
import { useDataGridShortcuts } from './hooks/useDataGridShortcuts'
import { useGridScrollReset } from './hooks/useGridScrollReset'
import { useRowReveal } from './hooks/useRowReveal'
import { useScrollEdges } from './hooks/useScrollEdges'
import { DEFAULT_PAGE_SIZE_OPTIONS, type DataGridProps } from './types'

const DEFAULT_ROW_HEIGHT = 44

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
  initialPageIndex,
  initialGlobalFilter,
  columnFilters,
  onColumnFiltersChange,
  onViewStateChange,
  initialColumnVisibility,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  emptyTitle = 'Nothing here yet',
  emptyHint = 'Rows will appear here once data is available.',
  getRowClassName,
  onRowActivate,
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
    initialPageIndex,
    initialGlobalFilter,
    columnFilters,
    onColumnFiltersChange,
    onViewStateChange,
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
  useDataGridShortcuts(searchRef, scrollRef)
  // From `sm` up the first column is pinned, so it owns the left edge and only
  // the right edge can hide content. Below `sm` nothing is pinned, so both
  // edges need the hint.
  const { canScrollLeft, canScrollRight } = useScrollEdges(scrollRef)

  // One tab stop for the whole page of rows, moved with the arrow keys. A new
  // page, sort or filter invalidates the old position, so it starts at the top.
  const [activeRowIndex, setActiveRowIndex] = useState(0)
  useEffect(() => {
    setActiveRowIndex(0)
  }, [grid.resetKey])

  const focusRowAt = useCallback(
    (index: number) => {
      const count = grid.rows.length
      if (count === 0) return
      const next = Math.max(0, Math.min(count - 1, index))
      setActiveRowIndex(next)
      // The target may be outside the rendered window: move the list first,
      // then focus the node once it exists. `preventScroll` keeps the two from
      // fighting over the scroll offset.
      rowVirtualizer.scrollToIndex(next, { align: 'auto' })
      scrollRef.current?.dispatchEvent(new Event('scroll'))
      requestAnimationFrame(() => {
        scrollRef.current
          ?.querySelector<HTMLElement>(`[data-row-index="${next}"]`)
          ?.focus({ preventScroll: true })
      })
    },
    [grid.rows.length, rowVirtualizer],
  )

  const virtualRows = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end
      : 0

  return (
    <section className={panelClass}>
      <DataGridToolbar
        table={grid.table}
        search={grid.search}
        onSearchChange={grid.setSearch}
        onClearColumnFilters={grid.clearColumnFilters}
        onRemoveColumnFilter={grid.removeFilterValue}
        chips={grid.chips}
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
          <>
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
                activeRowIndex={activeRowIndex}
                onRowFocus={focusRowAt}
                onRowActivate={onRowActivate}
                onSort={grid.sortByColumn}
                onFilterChange={grid.filterByColumn}
                getFacetCounts={grid.getFacetCounts}
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
            {canScrollLeft ? <DataGridScrollFade side="left" className="sm:hidden" /> : null}
            {canScrollRight ? <DataGridScrollFade side="right" /> : null}
          </>
        )}
      </div>

      {error ? null : (
        <DataGridPagination
          pageIndex={grid.pagination.pageIndex}
          pageSize={grid.pagination.pageSize}
          pageCount={grid.pageCount}
          totalRows={grid.filteredCount}
          sourceRows={data.length}
          pageSizeOptions={pageSizeOptions}
          onPageChange={grid.setPage}
          onPageSizeChange={grid.setPageSize}
          hint={
            onRowActivate ? (
              <>
                <Kbd className="inline-flex size-4 items-center justify-center p-0">↑</Kbd>
                <Kbd className="inline-flex size-4 items-center justify-center p-0">↓</Kbd>
                <span>move</span>
                <span aria-hidden="true" className="text-line-strong">
                  /
                </span>
                <Kbd className="inline-flex size-4 items-center justify-center p-0">↵</Kbd>
                <span>open</span>
              </>
            ) : undefined
          }
        />
      )}

      {/* Screen readers get the result count without having to hunt for it. */}
      <p className="sr-only" role="status">
        {error
          ? ''
          : isLoading
            ? 'Loading rows'
            : `${formatCount(grid.filteredCount)} ${pluralize(grid.filteredCount, 'row')} match. Showing ${formatCount(grid.rangeStart)} to ${formatCount(grid.rangeEnd)}.`}
      </p>
    </section>
  )
}
