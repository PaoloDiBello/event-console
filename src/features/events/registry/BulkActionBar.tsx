import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatCount, pluralize } from '@/shared/lib/format'

interface BulkActionBarProps {
  count: number
  /** Selected rows the current search and filters no longer show. */
  outsideCount?: number
  /** Rows the current search and filters leave in total. */
  matching: number
  /** Rows on the page, so the offer only appears once the page is full. */
  pageSize: number
  onSelectAll: () => void
  onClear: () => void
  onDelete: () => void
}

/**
 * The floating selection bar. It hovers just above the grid's footer instead of
 * taking a row in the layout, so selecting a row never resizes the table under
 * the pointer.
 *
 * The visible count is decorative for assistive tech; a separate live region
 * announces the change, because the selection can move from the header checkbox
 * or from a row that does not have focus.
 */
export function BulkActionBar({
  count,
  outsideCount = 0,
  matching,
  pageSize,
  onSelectAll,
  onClear,
  onDelete,
}: BulkActionBarProps) {
  // Ticking the header only ever selects the page. On a 2,000-page result set
  // that is the wrong unit for a bulk action, so offer the rest of the match —
  // but only once the reader has shown they mean "all of this", not one row.
  const canSelectAll = count < matching && count >= Math.min(pageSize, matching)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3">
      <div
        role="toolbar"
        aria-label="Actions for selected rows"
        className="pointer-events-auto flex max-w-full flex-col gap-1 rounded-lg border border-line-strong bg-raised/95 p-1.5 shadow-2xl shadow-black/70 backdrop-blur"
      >
        {canSelectAll ? (
          <button
            type="button"
            onClick={onSelectAll}
            className="rounded-xs px-1.5 py-1 text-left text-xs font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            Select all {formatCount(matching)} matching
          </button>
        ) : null}

        <div className="flex items-center gap-1.5 pr-1.5 pl-1.5">
          <span className="flex items-center gap-2 text-xs whitespace-nowrap text-muted">
            <span
              aria-hidden="true"
              className="tnum grid h-5 min-w-5 place-items-center rounded-xs bg-accent/15 px-1 font-mono text-[10px] font-semibold text-accent"
            >
              {formatCount(count)}
            </span>
            <span aria-hidden="true">selected</span>
            {/* The selection outlives a filter change, so say when part of it is
                no longer on screen. Hidden on a phone, where the confirm dialog
                carries the same warning and the bar has no room for both. */}
            {outsideCount > 0 ? (
              <span aria-hidden="true" className="hidden text-faint sm:inline">
                · {outsideCount} outside this view
              </span>
            ) : null}
          </span>
          <span role="status" className="sr-only">
            {formatCount(count)} {count === 1 ? 'row' : 'rows'} selected
            {outsideCount > 0
              ? `, ${formatCount(outsideCount)} of them outside the current search and filters`
              : ''}
          </span>

          <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            aria-label="Clear selection"
            className="gap-1 px-2"
          >
            <X aria-hidden="true" className="size-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            aria-label={`Delete ${formatCount(count)} selected ${pluralize(count, 'event')}`}
            className="gap-1.5 px-2.5 font-semibold whitespace-nowrap"
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
            Delete {formatCount(count)}
          </Button>
        </div>
      </div>
    </div>
  )
}
