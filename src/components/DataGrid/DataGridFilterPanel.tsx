import * as Dialog from '@radix-ui/react-dialog'
import type { Column, Table } from '@tanstack/react-table'
import { SlidersHorizontal, X } from 'lucide-react'
import { buttonClass } from '@/components/ui/buttonStyles'
import { DataGridColumnFilter } from './DataGridColumnFilter'
import { columnLabel } from './utils'

interface DataGridFilterPanelProps<TData> {
  table: Table<TData>
  /** Number of columns with an applied filter, shown on the trigger. */
  activeCount: number
  disabled?: boolean
  onFilterChange: (
    column: Column<TData, unknown>,
    value: string | string[] | undefined,
  ) => void
  onClearAll: () => void
  getFacetCounts?: (columnId: string) => Record<string, number>
}

/**
 * The phone/tablet home for column filters.
 *
 * Below `md` the table header is too narrow to hold one control per column, so
 * the filter row is replaced by this sheet. It reuses the exact same controls,
 * which keeps the desktop row and the phone sheet from drifting apart — and it
 * makes every filterable column reachable without scrolling the table sideways.
 *
 * Rendered only below `md`; above that the in-table row is the faster surface.
 */
export function DataGridFilterPanel<TData>({
  table,
  activeCount,
  disabled = false,
  onFilterChange,
  onClearAll,
  getFacetCounts,
}: DataGridFilterPanelProps<TData>) {
  const filterColumns = table
    .getAllLeafColumns()
    .filter((column) => column.columnDef.meta?.filter)

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={activeCount > 0 ? `Filters, ${activeCount} applied` : 'Filters'}
          title="Filter by column"
          className={buttonClass({ size: 'md', className: 'gap-1.5 px-2 sm:gap-2 sm:px-3 md:hidden' })}
        >
          <SlidersHorizontal aria-hidden="true" className="size-3.5" />
          <span>Filters</span>
          {activeCount > 0 ? (
            <>
              {/* A dot, not a number, on a phone: the badge widened the button
                  enough to push Columns onto a second row at 320px, and the
                  count is in the accessible name and the chip strip below. */}
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-accent sm:hidden"
              />
              <span className="tnum hidden min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold text-canvas sm:inline-flex">
                {activeCount}
              </span>
            </>
          ) : null}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/65 backdrop-blur-[3px] md:hidden" />
        <Dialog.Content
          aria-label="Filters"
          className="dialog-content fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-hidden rounded-t-lg border border-line-strong bg-surface shadow-2xl shadow-black/70 md:hidden"
        >
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <SlidersHorizontal aria-hidden="true" className="size-4 text-accent" />
            <Dialog.Title className="text-sm font-semibold text-ink">Filters</Dialog.Title>
            <Dialog.Description className="sr-only">
              Narrow the registry by one or more columns.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close filters"
                className="ml-auto inline-flex size-9 items-center justify-center rounded-xs text-faint transition-colors hover:bg-raised hover:text-ink"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="scrollbar-thin max-h-[calc(85dvh-7.5rem)] space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
            {filterColumns.map((column) => (
              <div key={column.id} className="space-y-1.5">
                <span className="font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
                  {columnLabel(column)}
                </span>
                <DataGridColumnFilter
                  column={column}
                  disabled={disabled}
                  onChange={onFilterChange}
                  getFacetCounts={getFacetCounts}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-line bg-raised/40 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClearAll}
              disabled={disabled || activeCount === 0}
              className={buttonClass({
                variant: 'ghost',
                size: 'md',
                className: 'px-2 text-muted disabled:opacity-40',
              })}
            >
              Clear all
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className={buttonClass({
                  size: 'md',
                  className: 'ml-auto px-4 font-semibold',
                })}
              >
                Done
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
