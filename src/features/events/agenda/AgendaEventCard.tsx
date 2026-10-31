import { Pencil } from 'lucide-react'
import type { EventRecord } from '@/features/events/model'
import { formatMinute } from '@/shared/lib/dates'
import { CategoryLabel, PriorityLabel, StatusBadge } from '@/features/events/components/EventLabels'

/**
 * Content for one timeline card. The focusable wrapper, keyboard handling and
 * announcements live in <Timeline>, so this stays a pure presentation bit.
 */
export function AgendaEventCard({ event }: { event: EventRecord }) {
  return (
    <>
      <span className="flex w-14 shrink-0 flex-col justify-center border-r border-line pr-3">
        <span className="tnum font-mono text-sm text-ink">{formatMinute(event.startMinute)}</span>
        <span className="tnum font-mono text-[10px] text-faint">{event.durationMin}m</span>
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <span className="flex min-w-0 items-center gap-2">
          <CategoryLabel category={event.category} className="hidden shrink-0 md:inline-flex" />
          <span className="truncate text-sm font-medium text-ink">{event.title}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2 truncate text-[11px] text-faint">
          <span className="truncate">{event.owner}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{event.location}</span>
        </span>
      </span>

      <span className="hidden w-[196px] shrink-0 items-center justify-end gap-3 pr-1 sm:flex">
        <PriorityLabel priority={event.priority} />
        <StatusBadge status={event.status} />
        <Pencil
          aria-hidden="true"
          className="size-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </span>
    </>
  )
}
