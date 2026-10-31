import { flexRender, type Column, type Row } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { DataGridSkeleton } from './DataGridSkeleton'

interface DataGridBodyProps<TData> {
  rows: readonly Row<TData>[]
  visibleColumns: readonly Column<TData, unknown>[]
  virtualRows: readonly VirtualItem[]
  paddingTop: number
  paddingBottom: number
  rowHeight: number
  pageIndex: number
  pageSize: number
  headerRowCount: number
  isLoading: boolean
  emptyState: ReactNode
  getRowClassName?: (row: TData) => string
}

export function DataGridBody<TData>({
  rows,
  visibleColumns,
  virtualRows,
  paddingTop,
  paddingBottom,
  rowHeight,
  pageIndex,
  pageSize,
  headerRowCount,
  isLoading,
  emptyState,
  getRowClassName,
}: DataGridBodyProps<TData>) {
  const columnCount = Math.max(visibleColumns.length, 1)

  return (
    <tbody>
      {isLoading ? (
        <DataGridSkeleton columns={visibleColumns} rowHeight={rowHeight} />
      ) : rows.length === 0 ? (
        <tr>
          <td colSpan={columnCount} className="p-0">
            {emptyState}
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
            const rowNumber = pageIndex * pageSize + virtualRow.index + 1
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
  )
}
