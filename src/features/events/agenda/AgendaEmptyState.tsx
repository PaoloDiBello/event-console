import { AlertTriangle } from 'lucide-react'

interface AgendaEmptyStateProps {
  query: string
  onClearQuery: () => void
}

export function AgendaEmptyState({ query, onClearQuery }: AgendaEmptyStateProps) {
  return (
    <>
      <AlertTriangle aria-hidden="true" className="size-7 text-faint" />
      <p className="mt-3 text-sm font-medium text-ink">
        {query ? 'No events match this filter' : 'Nothing scheduled in this window'}
      </p>
      <p className="mt-1 max-w-sm text-xs text-muted">
        {query
          ? 'Try a different title, owner or category — or clear the filter.'
          : 'Widen the window, or add an event with the New event button.'}
      </p>
      {query ? (
        <button
          type="button"
          onClick={onClearQuery}
          className="mt-4 inline-flex h-8 items-center rounded-sm border border-line-strong bg-raised px-3 text-xs text-ink hover:border-accent/40 hover:text-accent"
        >
          Clear filter
        </button>
      ) : null}
    </>
  )
}
