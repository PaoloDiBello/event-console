import { describe, expect, it } from 'vitest'
import { daysFromToday } from '@/lib/dates'
import {
  AGENDA_EVENT_COUNT,
  AGENDA_WINDOW_DAYS,
  DATASET_SIZE,
  generateEvents,
} from './generate'

describe('generateEvents', () => {
  const events = generateEvents()

  it('builds the advertised 100,000 unique rows', () => {
    expect(events).toHaveLength(DATASET_SIZE)
    expect(new Set(events.map((event) => event.id)).size).toBe(DATASET_SIZE)
  })

  it('puts exactly the agenda slice inside the default window', () => {
    const inWindow = events.filter((event) => {
      const offset = daysFromToday(event.date)
      return offset >= 0 && offset < AGENDA_WINDOW_DAYS
    })

    expect(inWindow).toHaveLength(AGENDA_EVENT_COUNT)
    expect(AGENDA_EVENT_COUNT).toBeGreaterThanOrEqual(10_000)
  })

  it('is deterministic for a given seed', () => {
    const again = generateEvents()
    expect(again[0]).toEqual(events[0])
    expect(again[again.length - 1]).toEqual(events[events.length - 1])
  })

  it('keeps start times on five-minute marks inside the working day', () => {
    for (const event of events.slice(0, 500)) {
      expect(event.startMinute).toBeGreaterThanOrEqual(6 * 60)
      expect(event.startMinute).toBeLessThan(21 * 60)
      expect(event.startMinute % 5).toBe(0)
    }
  })
})
