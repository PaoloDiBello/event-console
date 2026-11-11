import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
      action={query ? <Button onClick={onClearQuery}>Clear filter</Button> : undefined}
    />
  )
}
