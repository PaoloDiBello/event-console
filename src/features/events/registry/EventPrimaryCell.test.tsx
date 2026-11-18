import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GridLayoutContext } from '@/components/DataGrid/layoutContext'
import type { EventRecord } from '@/features/events/model'
import { EventPrimaryCell } from './EventPrimaryCell'

const event: EventRecord = {
  id: 'evt_00123',
  title: 'Design review · webhooks',
  date: '2026-12-24',
  startMinute: 6 * 60,
  durationMin: 30,
  category: 'meeting',
  status: 'at_risk',
  priority: 'critical',
  owner: 'Tom Beckett',
  location: 'Remote',
  notes: '',
  search: '',
}

describe('EventPrimaryCell', () => {
  it('carries the state a phone has no column for', () => {
    render(
      <GridLayoutContext.Provider value="narrow">
        <EventPrimaryCell event={event} />
      </GridLayoutContext.Provider>,
    )

    expect(screen.getByText('Design review · webhooks')).toBeInTheDocument()
    // These used to live in the When / Status / Priority columns, which meant a
    // horizontal scroll that carried the title off screen with them.
    expect(screen.getByText('Thu 24 Dec')).toBeInTheDocument()
    expect(screen.getByText('06:00')).toBeInTheDocument()
    expect(screen.getByText('At risk')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(screen.queryByText(/evt_00123/)).not.toBeInTheDocument()
  })

  it('keeps the id line on a wide screen, where the columns already say the rest', () => {
    render(<EventPrimaryCell event={event} />)

    expect(screen.getByText('evt_00123 · Remote')).toBeInTheDocument()
    expect(screen.queryByText('At risk')).not.toBeInTheDocument()
  })
})
