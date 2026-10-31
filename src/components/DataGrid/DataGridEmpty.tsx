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
  const title =
    hasSearch && hasFilters
      ? 'No rows match your search and filters'
      : hasSearch
        ? 'No rows match your search'
        : 'No rows match these filters'
  const hint =
    hasSearch && hasFilters
      ? `0 of ${formatCount(totalRows)} ${pluralize(totalRows, 'row')} matched. Try a broader search or remove a filter.`
      : hasSearch
        ? `0 of ${formatCount(totalRows)} ${pluralize(totalRows, 'row')} matched. Try a broader search.`
        : `0 of ${formatCount(totalRows)} ${pluralize(totalRows, 'row')} matched. Clear a filter to see more rows.`
  const action =
    hasSearch && hasFilters
      ? { label: 'Clear search and filters', onClick: onClearAll }
      : hasSearch
        ? { label: 'Clear search', onClick: onClearSearch }
        : { label: 'Clear filters', onClick: onClearFilters }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      {hasSearch ? (
        <SearchX aria-hidden="true" className="size-7 text-faint" />
      ) : hasFilters ? (
        <SlidersHorizontal aria-hidden="true" className="size-7 text-faint" />
      ) : (
        <Inbox aria-hidden="true" className="size-7 text-faint" />
      )}
      <p className="mt-3 text-sm font-medium text-ink">{hasQuery ? title : emptyTitle}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
        {hasQuery ? hint : emptyHint}
      </p>
      {hasQuery ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-sm border border-line-strong bg-raised px-3 text-xs font-medium text-ink transition-colors hover:border-accent/40 hover:text-accent"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}
