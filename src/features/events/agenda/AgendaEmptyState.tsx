import { AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

interface AgendaEmptyStateProps {
  query: string
  onClearQuery: () => void
}

export function AgendaEmptyState({ query, onClearQuery }: AgendaEmptyStateProps) {
  return (
    <EmptyState
      className="h-full px-6 py-16"
      icon={<AlertTriangle aria-hidden="true" className="size-7 text-faint" />}
      title={query ? 'No events match this filter' : 'Nothing scheduled in this window'}
      hint={
        query
          ? 'Try a different title, owner or category — or clear the filter.'
          : 'Widen the window, or add an event with the New event button.'
      }
      action={
        query ? (
          <button
            type="button"
            onClick={onClearQuery}
            className="inline-flex h-8 items-center rounded-sm border border-line-strong bg-raised px-3 text-xs text-ink hover:border-accent/40 hover:text-accent"
          >
            Clear filter
          </button>
        ) : undefined
      }
    />
  )
}
