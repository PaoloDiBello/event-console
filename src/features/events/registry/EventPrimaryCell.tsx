import { useSearchQuery } from '@/components/DataGrid/searchContext'
import { useGridLayout } from '@/components/DataGrid/layoutContext'
import { HighlightText } from '@/components/ui/HighlightText'
import { CategoryLabel, PriorityLabel, StatusBadge } from '@/features/events/components/EventLabels'
import type { EventRecord } from '@/features/events/model'
import { formatDayShort, formatMinute } from '@/shared/lib/dates'

/**
 * The row's primary cell, in two shapes.
 *
 * On a wide screen the table has columns for When, Status and Priority, so this
 * cell carries the title and the id. A phone cannot fit those columns: reaching
 * Status meant scrolling right, and the scroll carried the title off screen, so
 * every row read "… 2026 SCHEDULED Low" with no way to tell which event it was.
 * Below `md` the same facts therefore move in here, and the row keeps both its
 * identity and its state without a horizontal scroll.
 */
export function EventPrimaryCell({ event }: { event: EventRecord }) {
  const query = useSearchQuery()
  const layout = useGridLayout()

  if (layout === 'narrow') {
    return (
      <div className="flex min-w-0 flex-col gap-0.5 leading-tight">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 flex-1 truncate font-medium text-ink">
            <HighlightText text={event.title} query={query} />
          </p>
          <StatusBadge status={event.status} className="shrink-0" />
        </div>
        <div className="flex min-w-0 items-center gap-1.5 truncate font-mono text-[11px] text-faint">
          <span className="shrink-0">{formatDayShort(event.date)}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{formatMinute(event.startMinute)}</span>
          <span aria-hidden="true">·</span>
          <CategoryLabel category={event.category} className="shrink-0 text-[11px]" />
          <span aria-hidden="true">·</span>
          <PriorityLabel priority={event.priority} className="shrink-0 text-[11px]" />
          <span aria-hidden="true" className="shrink-0">
            ·
          </span>
          <span className="truncate">{event.location}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-ink" title={event.title}>
        <HighlightText text={event.title} query={query} />
      </p>
      <p className="truncate font-mono text-[10px] text-faint">
        {event.id} · {event.location}
      </p>
    </div>
  )
}
