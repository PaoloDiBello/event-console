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
  onSort: (column: Column<TData, unknown>, event: unknown) => void
  onFilterChange: (column: Column<TData, unknown>, value: string | undefined) => void
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
  onSort,
  onFilterChange,
}: DataGridTableProps<TData>) {
  const headerRowCount = showFilterRow ? 2 : 1
  const bodyRowCount = isLoading ? 10 : rows.length === 0 ? 1 : filteredCount
  const sortDescription =
    sorting.length > 0
      ? `by ${sorting[0]!.id} ${sorting[0]!.desc ? 'descending' : 'ascending'}`
      : 'by default'

  return (
    <table
      aria-rowcount={bodyRowCount + headerRowCount}
      className="w-full min-w-[1040px] table-fixed border-separate border-spacing-0 text-sm"
    >
      <caption className="sr-only">
        {caption}. {formatCount(filteredCount)} rows, sorted {sortDescription}.
      </caption>
      <colgroup>
        {visibleColumns.map((column) => (
          <col
            key={column.id}
            style={
              column.columnDef.meta?.width ? { width: column.columnDef.meta.width } : undefined
            }
          />
        ))}
      </colgroup>

      <DataGridHeader
        table={table}
        showFilterRow={showFilterRow}
        isLoading={isLoading}
        onSort={onSort}
        onFilterChange={onFilterChange}
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
      />
    </table>
  )
}
