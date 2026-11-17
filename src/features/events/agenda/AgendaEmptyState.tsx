import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

interface AgendaEmptyStateProps {
  query: string
  atRiskOnly: boolean
  onClearFilters: () => void
  /** Widens the window; absent when it is already the widest one on offer. */
  onWiden?: () => void
  widenLabel?: string
}

export function AgendaEmptyState({
  query,
  atRiskOnly,
  onClearFilters,
  onWiden,
  widenLabel = 'Widen the window',
}: AgendaEmptyStateProps) {
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
          : 'Nothing falls inside this window. Look further ahead, or add an event.'
      }
      action={
        filtering ? (
          <Button onClick={onClearFilters}>
            {atRiskOnlyWithoutQuery ? 'Show every status' : 'Clear filters'}
          </Button>
        ) : // Same rule as the grid: a state that names the way out has to offer
        // it, instead of pointing at a control in the toolbar above.
        onWiden ? (
          <Button onClick={onWiden}>{widenLabel}</Button>
        ) : undefined
      }
    />
  )
}
