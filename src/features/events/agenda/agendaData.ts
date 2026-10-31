import type { TimelineGroup } from '@/components/Timeline'
import type { EventRecord } from '@/features/events/model'
import { formatDayHeading, formatDayShort, shiftIsoDay, todayIso } from '@/shared/lib/dates'

export const TIMELINE_SCOPES = [7, 30, 45] as const
export type TimelineScope = (typeof TIMELINE_SCOPES)[number]

export interface TimelineData {
  groups: TimelineGroup<EventRecord>[]
  total: number
  atRisk: number
}

/**
 * Groups the events that fall inside `[today, today + days)` by calendar day.
 *
 * ISO day strings compare lexicographically, so the window check is two string
 * comparisons instead of date math per row. One pass over 100k events is ~5 ms;
 * the result is memoized on (events, scope, query).
 */
export function buildTimeline(
  events: EventRecord[],
  days: number,
  query: string,
): TimelineData {
  const start = todayIso()
  const end = shiftIsoDay(start, days)
  const needle = query.trim().toLowerCase()

  const byDay = new Map<string, EventRecord[]>()
  let total = 0
  let atRisk = 0

  for (const event of events) {
    if (event.date < start || event.date >= end) continue
    if (needle && !event.search.includes(needle)) continue

    total += 1
    if (event.status === 'at_risk') atRisk += 1

    const bucket = byDay.get(event.date)
    if (bucket) bucket.push(event)
    else byDay.set(event.date, [event])
  }

  const groups: TimelineGroup<EventRecord>[] = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({
      key: date,
      label: formatDayHeading(date),
      shortLabel: formatDayShort(date),
      // Two events can start on the same minute; title keeps the order stable
      // and reproducible instead of depending on generation order.
      items: items.sort(
        (a, b) => a.startMinute - b.startMinute || a.title.localeCompare(b.title),
      ),
    }))

  return { groups, total, atRisk }
}
