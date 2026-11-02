import { useMemo } from 'react'
import { AGENDA_WINDOW_DAYS } from '@/features/events/model'
import type { EventRecord } from '@/features/events/model'
import { daysFromToday } from '@/shared/lib/dates'

interface RegistryStats {
  nextWindow: number
  atRisk: number
}

/**
 * Aggregate the two header counters in one pass. The dataset only spans a few
 * months, so the same date repeats thousands of times; cache the parse per
 * calendar day instead of per row.
 */
export function useRegistryStats(events: readonly EventRecord[]): RegistryStats {
  return useMemo(() => {
    let nextWindow = 0
    let atRisk = 0
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
}
