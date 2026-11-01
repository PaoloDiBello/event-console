import { useCallback, useMemo, useState } from 'react'
import { Timeline } from '@/components/Timeline'
import type { EventRecord } from '@/features/events/model'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/features/events/model'
import { useEventFeed } from '@/features/events/store'
import { formatMinute } from '@/shared/lib/dates'
import { buildTimeline, type TimelineScope } from './agendaData'
import { AgendaEmptyState } from './AgendaEmptyState'
import { AgendaEventCard } from './AgendaEventCard'
import { AgendaHeader } from './AgendaHeader'
import { AgendaSkeleton } from './AgendaSkeleton'

interface AgendaPageProps {
  onEdit: (event: EventRecord) => void
}

export function AgendaPage({ onEdit }: AgendaPageProps) {
  const { events, isLoading } = useEventFeed()
  const [scope, setScope] = useState<TimelineScope>(45)
  const [query, setQuery] = useState('')

  const data = useMemo(() => buildTimeline(events, scope, query), [events, scope, query])

  const getItemId = useCallback((event: EventRecord) => event.id, [])
  const getItemLabel = useCallback(
    (event: EventRecord) =>
      `${formatMinute(event.startMinute)}, ${event.title}. ${STATUS_LABEL[event.status]}, ${PRIORITY_LABEL[event.priority]} priority. Owner ${event.owner}.`,
    [],
  )
  const renderItem = useCallback((event: EventRecord) => <AgendaEventCard event={event} />, [])
  const clearQuery = useCallback(() => setQuery(''), [])

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <AgendaHeader
        scope={scope}
        onScopeChange={setScope}
        query={query}
        onQueryChange={setQuery}
        total={data.total}
        dayCount={data.groups.length}
        atRisk={data.atRisk}
      />

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <AgendaSkeleton />
        ) : (
          <Timeline
            groups={data.groups}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            renderItem={renderItem}
            onItemActivate={onEdit}
            ariaLabel={`Upcoming events, next ${scope} days, grouped by day`}
            emptyState={<AgendaEmptyState query={query} onClearQuery={clearQuery} />}
          />
        )}
      </div>
    </div>
  )
}
