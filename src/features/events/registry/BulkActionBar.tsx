import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BulkActionBarProps {
  count: number
  /** Selected rows the current search and filters no longer show. */
  outsideCount?: number
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
export function BulkActionBar({ count, outsideCount = 0, onClear, onDelete }: BulkActionBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3">
      <div
        role="toolbar"
        aria-label="Actions for selected rows"
        className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-line-strong bg-raised/95 py-1.5 pr-1.5 pl-3 shadow-2xl shadow-black/70 backdrop-blur"
      >
        <span className="flex items-center gap-2 text-xs text-muted">
          <span
            aria-hidden="true"
            className="tnum grid h-5 min-w-5 place-items-center rounded-xs bg-accent/15 px-1 font-mono text-[10px] font-semibold text-accent"
          >
            {count}
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            selected
          </span>
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
          {count} {count === 1 ? 'row' : 'rows'} selected
          {outsideCount > 0
            ? `, ${outsideCount} of them outside the current search and filters`
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
          className="gap-1.5 px-2.5 font-semibold"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          Delete {count}
        </Button>
      </div>
    </div>
  )
}
