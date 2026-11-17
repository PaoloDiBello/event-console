import type { Column, Row, SortingState, Table } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { ReactNode } from 'react'
import { formatCount } from '@/shared/lib/format'
import { DataGridBody } from './DataGridBody'
import { DataGridHeader } from './DataGridHeader'

interface DataGridTableProps<TData> {
  table: Table<TData>
  visibleColumns: readonly Column<TData, unknown>[]
  caption: string
  filteredCount: number
  sorting: SortingState
  isLoading: boolean
  showFilterRow: boolean
  rows: readonly Row<TData>[]
  virtualRows: readonly VirtualItem[]
  paddingTop: number
  paddingBottom: number
  rowHeight: number
  pageIndex: number
  pageSize: number
  emptyState: ReactNode
  getRowClassName?: (row: TData) => string
  activeRowIndex: number
  /** Enables `x` to toggle the focused row, where the page has a selection. */
  selectableRows: boolean
  onRowFocus: (index: number) => void
  onRowActivate?: (row: TData) => void
  onSort: (column: Column<TData, unknown>, event: unknown) => void
  onFilterChange: (
    column: Column<TData, unknown>,
    value: string | string[] | undefined,
  ) => void
  getFacetCounts?: (columnId: string) => Record<string, number>
}

export function DataGridTable<TData>({
  table,
  visibleColumns,
  caption,
  filteredCount,
  sorting,
  isLoading,
  showFilterRow,
  rows,
  virtualRows,
  paddingTop,
  paddingBottom,
  rowHeight,
  pageIndex,
  pageSize,
  emptyState,
  getRowClassName,
  activeRowIndex,
  selectableRows,
  onRowFocus,
  onRowActivate,
  onSort,
  onFilterChange,
  getFacetCounts,
}: DataGridTableProps<TData>) {
  const headerRowCount = showFilterRow ? 2 : 1
  const bodyRowCount = isLoading ? 10 : rows.length === 0 ? 1 : filteredCount
  const firstSort = sorting[0]
  const sortColumn = firstSort ? table.getColumn(firstSort.id) : undefined
  const sortHeader = sortColumn?.columnDef.header
  // Prefer the visible header ("Nearest to today") over the internal id
  // ("relevance"), so the caption reads like the UI.
  const sortLabel = typeof sortHeader === 'string' ? sortHeader : firstSort?.id
  const sortDescription = firstSort
    ? `by ${sortLabel} ${firstSort.desc ? 'descending' : 'ascending'}`
    : 'by default'

  return (
    <table
      aria-rowcount={bodyRowCount + headerRowCount}
      className="w-full min-w-[640px] table-fixed border-separate border-spacing-0 text-sm sm:min-w-[1040px]"
    >
      <caption className="sr-only">
        {caption}. {formatCount(filteredCount)} rows, sorted {sortDescription}.
      </caption>
      <colgroup>
        {visibleColumns.map((column) => (
          <col
            key={column.id}
            style={{ width: column.getSize() }}
          />
        ))}
      </colgroup>

      <DataGridHeader
        table={table}
        visibleColumns={visibleColumns}
        showFilterRow={showFilterRow}
        isLoading={isLoading}
        onSort={onSort}
        onFilterChange={onFilterChange}
        getFacetCounts={getFacetCounts}
      />
      <DataGridBody
        rows={rows}
        visibleColumns={visibleColumns}
        virtualRows={virtualRows}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
        rowHeight={rowHeight}
        pageIndex={pageIndex}
        pageSize={pageSize}
        headerRowCount={headerRowCount}
        isLoading={isLoading}
        emptyState={emptyState}
        getRowClassName={getRowClassName}
        activeRowIndex={activeRowIndex}
        selectableRows={selectableRows}
        onRowFocus={onRowFocus}
        onRowActivate={onRowActivate}
      />
    </table>
  )
}
