import { Inbox, SearchX, SlidersHorizontal } from 'lucide-react'
import { formatCount, pluralize } from '@/shared/lib/format'

interface DataGridEmptyProps {
  totalRows: number
  hasSearch: boolean
  hasFilters: boolean
  emptyTitle: string
  emptyHint: string
  onClearSearch: () => void
  onClearFilters: () => void
  onClearAll: () => void
}

interface EmptyCopy {
  title: string
  hint: string
  actionLabel: string
}

/** One place for the three "no rows match" variants. */
function emptyCopy(totalRows: number, hasSearch: boolean, hasFilters: boolean): EmptyCopy {
  const matched = `0 of ${formatCount(totalRows)} ${pluralize(totalRows, 'row')} matched.`

  if (hasSearch && hasFilters) {
    return {
      title: 'No rows match your search and filters',
      hint: `${matched} Try a broader search or remove a filter.`,
      actionLabel: 'Clear search and filters',
    }
  }

  if (hasSearch) {
    return {
      title: 'No rows match your search',
      hint: `${matched} Try a broader search.`,
      actionLabel: 'Clear search',
    }
  }

  return {
    title: 'No rows match these filters',
    hint: `${matched} Clear a filter to see more rows.`,
    actionLabel: 'Clear filters',
  }
}

export function DataGridEmpty({
  totalRows,
  hasSearch,
  hasFilters,
  emptyTitle,
  emptyHint,
  onClearSearch,
  onClearFilters,
  onClearAll,
}: DataGridEmptyProps) {
  const hasQuery = hasSearch || hasFilters
  const copy = emptyCopy(totalRows, hasSearch, hasFilters)
  const onClear = hasSearch && hasFilters ? onClearAll : hasSearch ? onClearSearch : onClearFilters
  const Icon = hasSearch ? SearchX : hasFilters ? SlidersHorizontal : Inbox

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <Icon aria-hidden="true" className="size-7 text-faint" />
      <p className="mt-3 text-sm font-medium text-ink">{hasQuery ? copy.title : emptyTitle}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
        {hasQuery ? copy.hint : emptyHint}
      </p>
      {hasQuery ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-sm border border-line-strong bg-raised px-3 text-xs font-medium text-ink transition-colors hover:border-accent/40 hover:text-accent"
        >
          {copy.actionLabel}
        </button>
      ) : null}
    </div>
  )
}
