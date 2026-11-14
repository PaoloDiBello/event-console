import { describe, expect, it } from 'vitest'
import { describeEnd, toEventDraft } from './formValues'
import type { EventFormValues } from './schema'

const values: EventFormValues = {
  title: '  Deploy billing-api  ',
  date: '2026-11-02',
  startTime: '09:30',
  durationMin: '90',
  category: 'deploy',
  status: 'scheduled',
  priority: 'high',
  owner: '  Nora Haddad  ',
  location: '  ',
  notes: '  Ship it  ',
}

describe('toEventDraft', () => {
  it('trims text, maps the time and applies location defaults', () => {
    expect(toEventDraft(values)).toEqual({
      title: 'Deploy billing-api',
      date: '2026-11-02',
      startMinute: 570,
      durationMin: 90,
      category: 'deploy',
      status: 'scheduled',
      priority: 'high',
      owner: 'Nora Haddad',
      location: 'Remote',
      notes: 'Ship it',
    })
  })

  it('uses Unassigned for a blank owner and omits blank notes', () => {
    const draft = toEventDraft({ ...values, owner: '   ', notes: '   ' })

    expect(draft.owner).toBe('Unassigned')
    expect(draft).not.toHaveProperty('notes')
  })
})

describe('describeEnd', () => {
  it('adds the duration to the start time', () => {
    expect(describeEnd('09:30', '90')).toEqual({ label: 'Ends 11:00', spills: false })
  })

  it('labels an event that runs past midnight', () => {
    expect(describeEnd('23:30', '120')).toEqual({ label: 'Ends 01:30 (next day)', spills: true })
  })

  it('stays quiet while the time is still incomplete', () => {
    expect(describeEnd('9', '60')).toBeNull()
    expect(describeEnd('', '60')).toBeNull()
  })
})
