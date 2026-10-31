import { describe, expect, it } from 'vitest'
import type { EventRecord } from '@/features/events/model'
import { shiftIsoDay, todayIso } from '@/shared/lib/dates'
import { buildTimeline, TIMELINE_SCOPES } from './agendaData'

function event(overrides: Partial<EventRecord> & Pick<EventRecord, 'id' | 'date' | 'title'>): EventRecord {
  return {
    startMinute: 9 * 60,
    durationMin: 60,
    category: 'meeting',
    status: 'scheduled',
    priority: 'medium',
    owner: 'Ada Lovelace',
    location: 'Remote',
    search: `${overrides.title} ${overrides.date}`.toLowerCase(),
    ...overrides,
  }
}

const today = todayIso()

describe('buildTimeline', () => {
  it('groups by day in chronological order and sorts items within a day', () => {
    const events = [
      event({ id: 'c', date: shiftIsoDay(today, 1), title: 'Beta', startMinute: 600 }),
      event({ id: 'b', date: today, title: 'Zulu', startMinute: 600 }),
      event({ id: 'a', date: today, title: 'Alpha', startMinute: 540 }),
    ]

    const result = buildTimeline(events, 7, '')

    expect(result.total).toBe(3)
    expect(result.groups.map((group) => group.key)).toEqual([
      today,
      shiftIsoDay(today, 1),
    ])
    expect(result.groups[0]!.items.map((item) => item.id)).toEqual(['a', 'b'])
    expect(result.groups[1]!.items.map((item) => item.id)).toEqual(['c'])
  })

  it('excludes events outside [today, today + days) and counts at-risk items', () => {
    const events = [
      event({ id: 'past', date: shiftIsoDay(today, -1), title: 'Yesterday' }),
      event({ id: 'inside', date: today, title: 'Today', status: 'at_risk' }),
      event({ id: 'edge', date: shiftIsoDay(today, 7), title: 'Next week' }),
    ]

    const result = buildTimeline(events, 7, '')

    expect(result.total).toBe(1)
    expect(result.atRisk).toBe(1)
    expect(result.groups[0]!.items[0]!.id).toBe('inside')
  })

  it('searches the precomputed haystack and returns no groups when nothing matches', () => {
    const events = [
      event({ id: 'a', date: today, title: 'Deploy billing', search: 'deploy billing production' }),
    ]

    expect(buildTimeline(events, 7, '  DEPLOY ').total).toBe(1)
    expect(buildTimeline(events, 7, 'nonexistent').groups).toHaveLength(0)
  })

  it('offers the windows the demo advertises', () => {
    expect(TIMELINE_SCOPES).toEqual([7, 30, 45])
  })
})
