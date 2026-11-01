import { describe, expect, it } from 'vitest'
import { toEventDraft } from './formValues'
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
