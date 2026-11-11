import { useCallback, useMemo, useState } from 'react'
import { Timeline } from '@/components/Timeline'
import type { EventRecord } from '@/features/events/model'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/features/events/model'
import { useEventFeed } from '@/features/events/store'
import { formatMinute, shiftIsoDay, todayIso } from '@/shared/lib/dates'
import { buildTimeline, TIMELINE_SCOPES, type TimelineScope } from './agendaData'
import { AgendaEmptyState } from './AgendaEmptyState'
import { AgendaEventCard } from './AgendaEventCard'
import { AgendaFooter } from './AgendaFooter'
import { AgendaHeader } from './AgendaHeader'
import { AgendaSkeleton } from './AgendaSkeleton'
import { AgendaToolbar } from './AgendaToolbar'

interface AgendaPageProps {
  onEdit: (event: EventRecord) => void
}

export function AgendaPage({ onEdit }: AgendaPageProps) {
  const { events, isLoading } = useEventFeed()
  const [scope, setScope] = useState<TimelineScope>(45)
  const [query, setQuery] = useState('')
  const today = useMemo(() => todayIso(), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const [jumpRequest, setJumpRequest] = useState<{ day: string; id: number } | null>(null)
  const maxJumpDate = shiftIsoDay(today, TIMELINE_SCOPES[TIMELINE_SCOPES.length - 1]! - 1)

  const data = useMemo(() => buildTimeline(events, scope, query), [events, scope, query])

  const handleScopeChange = (nextScope: TimelineScope) => {
    setScope(nextScope)
    const end = shiftIsoDay(today, nextScope)
    setSelectedDate((current) => (current >= end ? today : current))
  }

  const handleJumpDateChange = (day: string) => {
    if (!day) return

    setSelectedDate(day)
    if (day >= shiftIsoDay(today, scope)) {
      const nextScope =
        TIMELINE_SCOPES.find((days) => day < shiftIsoDay(today, days)) ??
        TIMELINE_SCOPES[TIMELINE_SCOPES.length - 1]!
      setScope(nextScope)
    }
    setJumpRequest((current) => ({ day, id: (current?.id ?? 0) + 1 }))
  }

  const getItemId = useCallback((event: EventRecord) => event.id, [])
  const getItemLabel = useCallback(
    (event: EventRecord) =>
      `${formatMinute(event.startMinute)}, ${event.title}. ${STATUS_LABEL[event.status]}, ${PRIORITY_LABEL[event.priority]} priority. Owner ${event.owner}.`,
    [],
  )
  const renderItem = useCallback((event: EventRecord) => <AgendaEventCard event={event} />, [])
  const clearQuery = useCallback(() => setQuery(''), [])

  const toolbar = (
    <AgendaToolbar
      scope={scope}
      onScopeChange={handleScopeChange}
      query={query}
      onQueryChange={setQuery}
      jumpDate={selectedDate}
      jumpMin={today}
      jumpMax={maxJumpDate}
      onJumpDateChange={handleJumpDateChange}
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <AgendaHeader scope={scope} total={data.total} atRisk={data.atRisk} />

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <AgendaSkeleton toolbar={toolbar} />
        ) : (
          <Timeline
            groups={data.groups}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            renderItem={renderItem}
            onItemActivate={onEdit}
            ariaLabel={`Upcoming events, next ${scope} days, grouped by day`}
            emptyState={<AgendaEmptyState query={query} onClearQuery={clearQuery} />}
            toolbar={toolbar}
            footer={<AgendaFooter total={data.total} dayCount={data.groups.length} />}
            jumpToDay={jumpRequest?.day}
            jumpRequestId={jumpRequest?.id}
          />
        )}
      </div>
    </div>
  )
}
