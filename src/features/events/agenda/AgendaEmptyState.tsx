import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

interface AgendaEmptyStateProps {
  query: string
  atRiskOnly: boolean
  onClearFilters: () => void
}

export function AgendaEmptyState({ query, atRiskOnly, onClearFilters }: AgendaEmptyStateProps) {
  const filtering = query !== '' || atRiskOnly
  const atRiskOnlyWithoutQuery = atRiskOnly && query === ''

  return (
    <EmptyState
      className="h-full px-6 py-16"
      icon={<AlertTriangle aria-hidden="true" className="size-7 text-faint" />}
      title={
        filtering
          ? atRiskOnlyWithoutQuery
            ? 'No at-risk events in this window'
            : 'No events match these filters'
          : 'Nothing scheduled in this window'
      }
      hint={
        filtering
          ? 'Try a different search, show every status, or widen the window.'
          : 'Widen the window, or add an event with the New event button.'
      }
      action={
        filtering ? (
          <Button onClick={onClearFilters}>
            {atRiskOnlyWithoutQuery ? 'Show every status' : 'Clear filters'}
          </Button>
        ) : undefined
      }
    />
  )
}
