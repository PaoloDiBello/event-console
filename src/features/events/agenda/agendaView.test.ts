import { describe, expect, it } from 'vitest'
import { shiftIsoDay } from '@/shared/lib/dates'
import { readAgendaView, writeAgendaView } from './agendaView'

const today = '2026-11-16'

describe('readAgendaView', () => {
  it('returns the default view for an empty URL', () => {
    expect(readAgendaView(new URLSearchParams(), today)).toEqual({
      query: '',
      scope: 45,
      atRiskOnly: false,
      day: today,
    })
  })

  it('reads a shared query, window, at-risk filter and day', () => {
    const params = new URLSearchParams({
      q: 'billing',
      window: '30',
      at: 'risk',
      day: shiftIsoDay(today, 12),
    })

    expect(readAgendaView(params, today)).toEqual({
      query: 'billing',
      scope: 30,
      atRiskOnly: true,
      day: shiftIsoDay(today, 12),
    })
  })

  it('drops a window that is not a control option', () => {
    const params = new URLSearchParams({ window: '14' })

    expect(readAgendaView(params, today).scope).toBe(45)
  })

  it('rejects a day outside the 45-day horizon', () => {
    const params = new URLSearchParams({ day: shiftIsoDay(today, 45) })

    expect(readAgendaView(params, today).day).toBe(today)
  })

  it('rejects an impossible calendar day', () => {
    const params = new URLSearchParams({ day: '2026-02-31' })

    expect(readAgendaView(params, today).day).toBe(today)
  })

  it('widens the window so a shared day is actually visible', () => {
    const params = new URLSearchParams({
      window: '7',
      day: shiftIsoDay(today, 20),
    })

    expect(readAgendaView(params, today).scope).toBe(30)
  })

  it('caps an oversized query', () => {
    const params = new URLSearchParams({ q: 'x'.repeat(200) })

    expect(readAgendaView(params, today).query).toHaveLength(80)
  })
})

describe('writeAgendaView', () => {
  it('keeps the default view out of the URL', () => {
    const params = writeAgendaView(
      { query: '', scope: 45, atRiskOnly: false, day: today },
      today,
    )

    expect(params.toString()).toBe('')
  })

  it('round-trips a non-default view', () => {
    const view = {
      query: 'billing',
      scope: 7 as const,
      atRiskOnly: true,
      day: shiftIsoDay(today, 2),
    }

    expect(readAgendaView(writeAgendaView(view, today), today)).toEqual(view)
  })
})
