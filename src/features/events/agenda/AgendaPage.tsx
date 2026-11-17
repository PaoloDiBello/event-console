import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Timeline } from '@/components/Timeline'
import type { EventRecord } from '@/features/events/model'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/features/events/model'
import { useEventFeed } from '@/features/events/store'
import { formatMinute, shiftIsoDay, todayIso } from '@/shared/lib/dates'
import { buildTimeline, TIMELINE_SCOPES, type TimelineScope } from './agendaData'
import { readAgendaView, writeAgendaView, type AgendaView } from './agendaView'
import { AgendaEmptyState } from './AgendaEmptyState'
import { AgendaError } from './AgendaError'
import { AgendaEventCard } from './AgendaEventCard'
import { AgendaFooter } from './AgendaFooter'
import { AgendaHeader } from './AgendaHeader'
import { AgendaSkeleton } from './AgendaSkeleton'
import { AgendaToolbar } from './AgendaToolbar'

interface AgendaPageProps {
  onEdit: (event: EventRecord) => void
}

export function AgendaPage({ onEdit }: AgendaPageProps) {
  const { events, error, isLoading, reload } = useEventFeed()
  const today = useMemo(() => todayIso(), [])
  const [searchParams, setSearchParams] = useSearchParams()

  // The URL seeds the view once; after that the page owns the state and
  // mirrors every change back, so a link can reopen the same day and filter.
  const [seed] = useState(() => readAgendaView(searchParams, today))
  const [scope, setScope] = useState<TimelineScope>(seed.scope)
  const [query, setQuery] = useState(seed.query)
  const [atRiskOnly, setAtRiskOnly] = useState(seed.atRiskOnly)
  const [selectedDate, setSelectedDate] = useState(seed.day)
  const [jumpRequest, setJumpRequest] = useState<{ day: string; id: number } | null>(null)

  const viewRef = useRef<AgendaView>(seed)
  const lastUrlRef = useRef(searchParams.toString())
  const mirrorView = useCallback(
    (next: Partial<AgendaView>) => {
      viewRef.current = { ...viewRef.current, ...next }
      const params = writeAgendaView(viewRef.current, today)
      const serialized = params.toString()
      // Replacing history with an identical URL would still re-render the
      // route, so only write when the view actually changed.
      if (serialized === lastUrlRef.current) return
      lastUrlRef.current = serialized
      setSearchParams(params, { replace: true })
    },
    [setSearchParams, today],
  )

  // A nav click or Back button can change the URL without this page knowing.
  // Adopt the link's view, and jump when the link points at another day.
  useEffect(() => {
    const current = searchParams.toString()
    if (current === lastUrlRef.current) return
    const previous = viewRef.current
    const next = readAgendaView(searchParams, today)
    lastUrlRef.current = current
    viewRef.current = next
    setScope(next.scope)
    setQuery(next.query)
    setAtRiskOnly(next.atRiskOnly)
    setSelectedDate(next.day)
    if (next.day !== previous.day) {
      setJumpRequest((request) => ({ day: next.day, id: (request?.id ?? 0) + 1 }))
    }
  }, [searchParams, today])

  const maxJumpDate = shiftIsoDay(today, TIMELINE_SCOPES[TIMELINE_SCOPES.length - 1]! - 1)

  const data = useMemo(
    () => buildTimeline(events, scope, query, atRiskOnly),
    [events, scope, query, atRiskOnly],
  )

  const handleScopeChange = (nextScope: TimelineScope) => {
    setScope(nextScope)
    const end = shiftIsoDay(today, nextScope)
    const nextDay = selectedDate >= end ? today : selectedDate
    setSelectedDate(nextDay)
    mirrorView({ scope: nextScope, day: nextDay })
  }

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery)
    mirrorView({ query: nextQuery })
  }

  const toggleAtRisk = () => {
    const next = !atRiskOnly
    setAtRiskOnly(next)
    mirrorView({ atRiskOnly: next })
  }

  const handleJumpDateChange = (day: string) => {
    if (!day) return

    setSelectedDate(day)
    let nextScope = scope
    if (day >= shiftIsoDay(today, scope)) {
      nextScope =
        TIMELINE_SCOPES.find((days) => day < shiftIsoDay(today, days)) ??
        TIMELINE_SCOPES[TIMELINE_SCOPES.length - 1]!
      setScope(nextScope)
    }
    setJumpRequest((current) => ({ day, id: (current?.id ?? 0) + 1 }))
    mirrorView({ day, scope: nextScope })
  }

  const getItemId = useCallback((event: EventRecord) => event.id, [])
  const getItemLabel = useCallback(
    (event: EventRecord) =>
      `${formatMinute(event.startMinute)}, ${event.title}. ${STATUS_LABEL[event.status]}, ${PRIORITY_LABEL[event.priority]} priority. Owner ${event.owner}.`,
    [],
  )
  const renderItem = useCallback((event: EventRecord) => <AgendaEventCard event={event} />, [])
  const clearFilters = useCallback(() => {
    setQuery('')
    setAtRiskOnly(false)
    mirrorView({ query: '', atRiskOnly: false })
  }, [mirrorView])

  const toolbar = (
    <AgendaToolbar
      scope={scope}
      onScopeChange={handleScopeChange}
      query={query}
      onQueryChange={handleQueryChange}
      today={today}
      jumpDate={selectedDate}
      jumpMin={today}
      jumpMax={maxJumpDate}
      onJumpDateChange={handleJumpDateChange}
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <AgendaHeader
        scope={scope}
        total={data.total}
        atRisk={data.atRisk}
        atRiskActive={atRiskOnly}
        onToggleAtRisk={toggleAtRisk}
      />

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <AgendaSkeleton toolbar={toolbar} />
        ) : error ? (
          <AgendaError error={error} onRetry={reload} />
        ) : (
          <Timeline
            groups={data.groups}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            renderItem={renderItem}
            onItemActivate={onEdit}
            ariaLabel={`Upcoming events, next ${scope} days, grouped by day`}
            emptyState={
              <AgendaEmptyState
                query={query}
                atRiskOnly={atRiskOnly}
                onClearFilters={clearFilters}
                // On the widest window there is nothing left to widen, so the
                // empty state offers no button rather than a dead one.
                onWiden={
                  scope === TIMELINE_SCOPES[TIMELINE_SCOPES.length - 1]
                    ? undefined
                    : () => handleScopeChange(TIMELINE_SCOPES[TIMELINE_SCOPES.length - 1]!)
                }
                widenLabel={`Widen to ${TIMELINE_SCOPES[TIMELINE_SCOPES.length - 1]} days`}
              />
            }
            toolbar={toolbar}
            footer={<AgendaFooter total={data.total} dayCount={data.groups.length} />}
            resetKey={`${scope}|${query}|${atRiskOnly}`}
            jumpToDay={jumpRequest?.day}
            jumpRequestId={jumpRequest?.id}
          />
        )}
      </div>
    </div>
  )
}
