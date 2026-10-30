import { AlertTriangle, Loader2, Search, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Timeline } from '@/components/Timeline'
import type { EventRecord } from '@/data/types'
import { formatMinute } from '@/lib/dates'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/data/types'
import { useEvents, useEventStatus } from '@/store/events'
import { buildTimeline, TIMELINE_SCOPES, type TimelineScope } from '@/app/timelineData'
import { PageHeader } from '@/app/ui/PageHeader'
import { TimelineEventCard } from '@/app/ui/TimelineEventCard'

interface TimelinePageProps {
  onEdit: (event: EventRecord) => void
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-line bg-raised px-1 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  )
}

export function TimelinePage({ onEdit }: TimelinePageProps) {
  const events = useEvents()
  const status = useEventStatus()
  const [scope, setScope] = useState<TimelineScope>(45)
  const [query, setQuery] = useState('')

  const data = useMemo(() => buildTimeline(events, scope, query), [events, scope, query])

  const getItemId = useCallback((event: EventRecord) => event.id, [])
  const getItemLabel = useCallback(
    (event: EventRecord) =>
      `${formatMinute(event.startMinute)}, ${event.title}. ${STATUS_LABEL[event.status]}, ${PRIORITY_LABEL[event.priority]} priority. Owner ${event.owner}.`,
    [],
  )
  const renderItem = useCallback((event: EventRecord) => <TimelineEventCard event={event} />, [])
  const isLoading = status === 'loading' || status === 'idle'

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Agenda"
        description={`The next ${scope} days, grouped by day and virtualized. Arrow keys move between events and days; every move is announced with its day and position.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-line bg-surface/60 px-2.5 py-2">
            <span className="font-mono text-[10px] tracking-wider text-faint uppercase">Window</span>
            <div role="group" aria-label="Timeline window" className="flex rounded-sm border border-line bg-canvas p-0.5">
              {TIMELINE_SCOPES.map((days) => (
                <button
                  key={days}
                  type="button"
                  aria-pressed={scope === days}
                  onClick={() => setScope(days)}
                  className={cn(
                    'rounded-xs px-2 py-1 font-mono text-[11px] transition-colors',
                    scope === days
                      ? 'bg-accent/15 text-accent'
                      : 'text-muted hover:bg-raised hover:text-ink',
                  )}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter the agenda…"
              aria-label="Filter timeline events"
              className="h-10 w-56 rounded-md border border-line bg-surface/60 pr-8 pl-8 text-xs text-ink placeholder:text-faint focus:border-accent/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear timeline filter"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-xs p-1 text-faint hover:text-ink"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            ) : null}
          </div>

          <p className="tnum rounded-md border border-line bg-surface/60 px-3 py-2 font-mono text-[11px] text-muted">
            <span className="text-ink">{formatCount(data.total)}</span> events ·{' '}
            <span className="text-ink">{formatCount(data.groups.length)}</span> days ·{' '}
            <span className="text-rose">{formatCount(data.atRisk)}</span> at risk
          </p>

          <div className="hidden items-center gap-1.5 pl-1 text-[10px] text-faint xl:flex">
            <Key>↑</Key>
            <Key>↓</Key>
            <span>move</span>
            <span aria-hidden="true" className="mx-1 text-line-strong">
              /
            </span>
            <Key>←</Key>
            <Key>→</Key>
            <span>day</span>
            <span aria-hidden="true" className="mx-1 text-line-strong">
              /
            </span>
            <Key>↵</Key>
            <span>edit</span>
          </div>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <div className="flex h-full flex-col gap-2 rounded-lg border border-line bg-surface/60 p-4">
            <p className="mb-1 inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-faint uppercase">
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              Loading agenda
            </p>
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-md border border-line/70 bg-raised/60"
                style={{ opacity: 1 - index * 0.12 }}
              />
            ))}
          </div>
        ) : (
          <Timeline
            groups={data.groups}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            renderItem={renderItem}
            onItemActivate={onEdit}
            ariaLabel={`Upcoming events, next ${scope} days, grouped by day`}
            emptyState={
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
                    onClick={() => setQuery('')}
                    className="mt-4 inline-flex h-8 items-center rounded-sm border border-line-strong bg-raised px-3 text-xs text-ink hover:border-accent/40 hover:text-accent"
                  >
                    Clear filter
                  </button>
                ) : null}
              </>
            }
          />
        )}
      </div>
    </div>
  )
}
