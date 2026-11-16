import { flexRender, type Column, type Row } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { pinnedColumnClass } from './pinnedColumn'
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
  /** Index within the page that owns the grid's single tab stop. */
  activeRowIndex: number
  onRowFocus: (index: number) => void
  onRowActivate?: (row: TData) => void
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
  activeRowIndex,
  onRowFocus,
  onRowActivate,
}: DataGridBodyProps<TData>) {
  const columnCount = Math.max(visibleColumns.length, 1)
  const activatable = Boolean(onRowActivate)

  /**
   * Roving focus: only the active row is in the tab order, and the arrows move
   * between rows. Keeping the model on the row instead of on a cell means the
   * whole record reads as one control, the way it does in the agenda.
   */
  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: Row<TData>) => {
    // The row can contain a button; only handle keys aimed at the row itself.
    if (event.target !== event.currentTarget || !onRowActivate) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        onRowFocus(Math.min(rows.length - 1, virtualRowIndexOf(event) + 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        onRowFocus(Math.max(0, virtualRowIndexOf(event) - 1))
        break
      case 'Home':
        event.preventDefault()
        onRowFocus(0)
        break
      case 'End':
        event.preventDefault()
        onRowFocus(rows.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onRowActivate(row.original)
        break
      default:
        break
    }
  }

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
          <SpacerRow height={paddingTop} colSpan={columnCount} />

          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index]
            if (!row) return null
            const rowNumber = pageIndex * pageSize + virtualRow.index + 1
            const isActive = virtualRow.index === activeRowIndex
            const rowClassName = getRowClassName?.(row.original) ?? ''
            return (
              <tr
                key={row.id}
                data-row-index={virtualRow.index}
                aria-rowindex={rowNumber + headerRowCount}
                aria-keyshortcuts={activatable ? 'Enter Space' : undefined}
                tabIndex={activatable ? (isActive ? 0 : -1) : undefined}
                style={{ height: rowHeight }}
                onClick={activatable ? () => onRowActivate?.(row.original) : undefined}
                onFocus={
                  activatable
                    ? (event) => {
                        if (event.target === event.currentTarget && !isActive) {
                          onRowFocus(virtualRow.index)
                        }
                      }
                    : undefined
                }
                onKeyDown={(event) => handleRowKeyDown(event, row)}
                className={cn(
                  'group transition-colors hover:bg-raised',
                  'focus-visible:bg-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent/60',
                  activatable && 'cursor-pointer',
                  rowClassName,
                )}
              >
                {row.getVisibleCells().map((cell, cellIndex) => {
                  const align = cell.column.columnDef.meta?.align
                  const pinned = cellIndex === 0
                  return (
                    <td
                      key={cell.id}
                      data-pinned={pinned ? '' : undefined}
                      className={cn(
                        'overflow-hidden border-b border-line/60 px-3 text-muted',
                        pinned &&
                          `${pinnedColumnClass} sm:z-10 sm:bg-surface sm:group-hover:bg-raised sm:group-focus-visible:bg-raised`,
                        // Mirror the row's own highlight (the saved-event tint)
                        // onto the pinned cell, which paints over it otherwise.
                        pinned && rowClassName,
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

          <SpacerRow height={paddingBottom} colSpan={columnCount} />
        </>
      )}
    </tbody>
  )
}

/** The row's position in the page, read back from the DOM node the key hit. */
function virtualRowIndexOf(event: KeyboardEvent<HTMLTableRowElement>): number {
  return Number(event.currentTarget.dataset.rowIndex ?? 0)
}

/** Virtualizer padding: a zero-height row would still cost a DOM node. */
function SpacerRow({ height, colSpan }: { height: number; colSpan: number }) {
  if (height <= 0) return null
  return (
    <tr aria-hidden="true" style={{ height }}>
      <td colSpan={colSpan} style={{ padding: 0, border: 0 }} />
    </tr>
  )
}
