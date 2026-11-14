import { useMemo } from 'react'
import { AGENDA_WINDOW_DAYS } from '@/features/events/model'
import type { EventRecord } from '@/features/events/model'
import { daysFromToday } from '@/shared/lib/dates'

interface RegistryStats {
  nextWindow: number
  atRisk: number
  /** Distinct values the Owner and Location facet filters offer, sorted. */
  owners: string[]
  locations: string[]
}

/**
 * Aggregate the two header counters and the filter facets in one pass. The
 * dataset only spans a few months, so the same date repeats thousands of times;
 * cache the parse per calendar day instead of per row.
 */
export function useRegistryStats(events: readonly EventRecord[]): RegistryStats {
  return useMemo(() => {
    let nextWindow = 0
    let atRisk = 0
    const offsets = new Map<string, number>()
    const owners = new Set<string>()
    const locations = new Set<string>()

    for (const event of events) {
      owners.add(event.owner)
      locations.add(event.location)
      let offset = offsets.get(event.date)
      if (offset === undefined) {
        offset = daysFromToday(event.date)
        offsets.set(event.date, offset)
      }
      if (offset >= 0 && offset < AGENDA_WINDOW_DAYS) nextWindow += 1
      if (event.status === 'at_risk') atRisk += 1
    }

    return {
      nextWindow,
      atRisk,
      owners: [...owners].sort((a, b) => a.localeCompare(b)),
      locations: [...locations].sort((a, b) => a.localeCompare(b)),
    }
  }, [events])
}
