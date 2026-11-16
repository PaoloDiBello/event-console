import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventFeed, type EventFeed } from '@/features/events/store'
import { AgendaPage } from './AgendaPage'

vi.mock('@/features/events/store', () => ({ useEventFeed: vi.fn() }))

const reload = vi.fn()

function feed(overrides: Partial<EventFeed> = {}): EventFeed {
  return {
    events: [],
    status: 'ready',
    error: null,
    isLoading: false,
    reload,
    simulateError: vi.fn(),
    ...overrides,
  }
}

describe('AgendaPage', () => {
  beforeEach(() => {
    reload.mockReset()
  })

  it('replaces the timeline with a retryable error when the load fails', async () => {
    const user = userEvent.setup()
    vi.mocked(useEventFeed).mockReturnValue(
      feed({ status: 'error', error: 'Could not reach the events service.' }),
    )

    render(
      <MemoryRouter>
        <AgendaPage onEdit={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load events')
    expect(screen.queryByText(/Nothing scheduled/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Retry/ }))
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
