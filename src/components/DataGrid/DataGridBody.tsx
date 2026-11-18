import { flexRender, type Column, type Row } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
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
  /** Whether `x` may toggle the focused row's selection. */
  selectableRows?: boolean
  /** Rows between the anchor and a shift-click / Shift+Arrow target. */
  onSelectRange?: (ids: string[]) => void
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
  selectableRows = false,
  onSelectRange,
  onRowFocus,
  onRowActivate,
}: DataGridBodyProps<TData>) {
  const columnCount = Math.max(visibleColumns.length, 1)
  const activatable = Boolean(onRowActivate)
  const visibleIds = new Set(visibleColumns.map((column) => column.id))

  /**
   * Range selection: `anchor` is the row the user last stood on, `edge` is
   * where a run of Shift+Arrow keys has reached. Keeping them apart is what
   * lets the range grow key by key instead of restarting from the new row.
   */
  const anchorRef = useRef(0)
  const edgeRef = useRef(0)
  /** The next focus came from extending a range, so it must not move the anchor. */
  const keepAnchorRef = useRef(false)
  const rangeEnabled = selectableRows && Boolean(onSelectRange)

  const focusRow = (index: number) => {
    if (keepAnchorRef.current) keepAnchorRef.current = false
    else {
      anchorRef.current = index
      edgeRef.current = index
    }
    onRowFocus(index)
  }

  const selectRange = () => {
    if (!onSelectRange) return
    const from = Math.min(anchorRef.current, edgeRef.current)
    const to = Math.max(anchorRef.current, edgeRef.current)
    onSelectRange(rows.slice(from, to + 1).map((row) => row.id))
  }

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
      case 'ArrowUp': {
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        const from = virtualRowIndexOf(event)
        const next = Math.max(0, Math.min(rows.length - 1, from + step))
        if (event.shiftKey && rangeEnabled) {
          // Extend from the anchor the run started at, so holding Shift with
          // the arrows paints a contiguous block.
          edgeRef.current = next
          selectRange()
          keepAnchorRef.current = true
        }
        // Through `focusRow`, not `onRowFocus`: a plain step has to move the
        // anchor, and the row it lands on will not report its focus again.
        focusRow(next)
        break
      }
      case 'x':
      case 'X':
        // Keyboard parity with the checkbox: tick the row you are on instead of
        // tabbing out of the row model and back in for every record.
        if (!selectableRows || !row.getCanSelect()) break
        event.preventDefault()
        row.toggleSelected()
        break
      case 'Home':
        event.preventDefault()
        focusRow(0)
        break
      case 'End':
        event.preventDefault()
        focusRow(rows.length - 1)
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
            const isSelected = row.getIsSelected()
            const rowClassName = getRowClassName?.(row.original) ?? ''
            return (
              <tr
                key={row.id}
                data-row-index={virtualRow.index}
                data-selected={isSelected ? '' : undefined}
                aria-rowindex={rowNumber + headerRowCount}
                        aria-keyshortcuts={
                  activatable
                    ? `${rangeEnabled ? 'Shift+ArrowUp Shift+ArrowDown ' : ''}Enter Space`
                    : undefined
                }
                tabIndex={activatable ? (isActive ? 0 : -1) : undefined}
                style={{ height: rowHeight }}
                onClick={(event: MouseEvent<HTMLTableRowElement>) => {
                  if (event.shiftKey && rangeEnabled) {
                    edgeRef.current = virtualRow.index
                    selectRange()
                    keepAnchorRef.current = true
                    focusRow(virtualRow.index)
                    return
                  }
                  if (activatable) onRowActivate?.(row.original)
                }}
                onFocus={
                  activatable
                    ? (event) => {
                        if (event.target === event.currentTarget && !isActive) {
                          focusRow(virtualRow.index)
                        }
                      }
                    : undefined
                }
                onKeyDown={(event) => handleRowKeyDown(event, row)}
                className={cn(
                  'group transition-colors hover:bg-raised',
                  'focus-visible:bg-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent/60',
                  activatable && 'cursor-pointer',
                  isSelected && 'bg-accent/[0.045]',
                  rowClassName,
                )}
              >
                {row
                  .getVisibleCells()
                  .filter((cell) => visibleIds.has(cell.column.id))
                  .map((cell, cellIndex) => {
                  const align = cell.column.columnDef.meta?.align
                  const compact = cell.column.columnDef.meta?.compact
                  const pinned = cellIndex === 0
                  return (
                    <td
                      key={cell.id}
                      data-pinned={pinned ? '' : undefined}
                      className={cn(
                        'overflow-hidden border-b border-line/60 text-muted',
                        compact ? 'px-1' : 'px-3',
                        pinned &&
                          `${pinnedColumnClass} z-10 border-l-2 bg-surface group-hover:bg-raised group-focus-visible:bg-raised`,
                        // The selection gutter lives on the pinned cell: the
                        // row tint sits behind it, and the sticky cell paints
                        // its own opaque background. The 2px border is always
                        // present so selecting never nudges the checkbox.
                        pinned && (isSelected ? 'border-l-accent' : 'border-l-transparent'),
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
