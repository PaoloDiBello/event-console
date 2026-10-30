import { AlertTriangle, CalendarClock, Gauge, RefreshCw } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { DataGrid } from '@/components/DataGrid'
import { AGENDA_WINDOW_DAYS } from '@/data/generate'
import type { EventRecord } from '@/data/types'
import { daysFromToday } from '@/lib/dates'
import { formatCount } from '@/lib/format'
import { useEventError, useEvents, useEventStatus, useEventStore } from '@/store/events'
import { createEventColumns, eventGlobalFilter } from '@/app/gridColumns'
import { PageHeader } from '@/app/ui/PageHeader'

interface GridPageProps {
  onEdit: (event: EventRecord) => void
  highlightedId: string | null
}

/** Stable reference: TanStack rebuilds its row model when `getRowId` changes. */
function getEventRowId(event: EventRecord) {
  return event.id
}

function Stat({
  icon,
  label,
  value,
  tone = 'text-muted',
}: {
  icon: ReactNode
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-line bg-surface/60 px-3 py-2">
      <span className={tone}>{icon}</span>
      <span className="leading-none">
        <span className="tnum block font-mono text-sm text-ink">{value}</span>
        <span className="mt-1 block font-mono text-[10px] tracking-wider text-faint uppercase">
          {label}
        </span>
      </span>
    </div>
  )
}

export function GridPage({ onEdit, highlightedId }: GridPageProps) {
  const events = useEvents()
  const status = useEventStatus()
  const error = useEventError()
  const load = useEventStore((state) => state.load)

  const columns = useMemo(() => createEventColumns(onEdit), [onEdit])

  const stats = useMemo(() => {
    let nextWindow = 0
    let atRisk = 0
    // The dataset only spans a few months, so the same date repeats thousands
    // of times. Cache the parse per calendar day instead of per row.
    const offsets = new Map<string, number>()
    for (const event of events) {
      let offset = offsets.get(event.date)
      if (offset === undefined) {
        offset = daysFromToday(event.date)
        offsets.set(event.date, offset)
      }
      if (offset >= 0 && offset < AGENDA_WINDOW_DAYS) nextWindow += 1
      if (event.status === 'at_risk') atRisk += 1
    }
    return { nextWindow, atRisk }
  }, [events])

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Event registry"
        description="Every meeting, deploy, incident and release in one sortable archive. Filters run in the browser against all 100,000 rows — no server round-trips."
        actions={
          <>
            <Stat
              icon={<CalendarClock aria-hidden="true" className="size-4" />}
              label={`Next ${AGENDA_WINDOW_DAYS} days`}
              value={formatCount(stats.nextWindow)}
              tone="text-sky"
            />
            <Stat
              icon={<AlertTriangle aria-hidden="true" className="size-4" />}
              label="At risk"
              value={formatCount(stats.atRisk)}
              tone="text-rose"
            />
            <button
              type="button"
              onClick={() => void load()}
              disabled={status === 'loading'}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line bg-raised px-3 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
            >
              <RefreshCw
                aria-hidden="true"
                className={status === 'loading' ? 'size-3.5 animate-spin' : 'size-3.5'}
              />
              Reload
            </button>
            <button
              type="button"
              onClick={() => void load({ fail: true })}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line px-2.5 text-xs text-faint transition-colors hover:border-rose/30 hover:text-rose"
              title="Demonstrates the DataGrid error state"
            >
              <Gauge aria-hidden="true" className="size-3.5" />
              Simulate error
            </button>
          </>
        }
      />

      <div className="min-h-0 flex-1">
        <DataGrid
          data={events}
          columns={columns}
          getRowId={getEventRowId}
          caption="Event registry"
          isLoading={status === 'loading' || status === 'idle'}
          error={status === 'error' ? error : null}
          onRetry={() => void load()}
          globalFilterFn={eventGlobalFilter}
          searchPlaceholder="Search 100,000 events…"
          initialSorting={[{ id: 'when', desc: true }]}
          initialPageSize={50}
          initialColumnVisibility={{ location: false, notes: false }}
          focusRowId={highlightedId}
          emptyTitle="No events in the registry"
          emptyHint="Load the dataset, or add the first event with the New event button."
          getRowClassName={(event) =>
            event.id === highlightedId ? 'bg-accent/[0.07] shadow-[inset_2px_0_0_0_var(--color-accent)]' : ''
          }
        />
      </div>
    </div>
  )
}
