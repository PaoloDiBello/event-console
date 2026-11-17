import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { EventRecord } from '@/features/events/model'
import { BulkDeleteDialog } from './BulkDeleteDialog'

function event(index: number): EventRecord {
  return {
    id: `evt_${index}`,
    title: `Event ${index}`,
    date: '2026-11-18',
    startMinute: 9 * 60 + index,
    durationMin: 30,
    category: 'deploy',
    status: 'scheduled',
    priority: 'medium',
    owner: 'Nora Haddad',
    location: 'eu-west-1',
    search: `event ${index}`,
  }
}

const events = Array.from({ length: 7 }, (_, index) => event(index))

describe('BulkDeleteDialog', () => {
  it('names the count and previews the selected events', async () => {
    render(
      <BulkDeleteDialog
        open
        events={events.slice(0, 2)}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(
      await screen.findByRole('heading', { name: 'Delete 2 events?' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Events to delete' })).toHaveTextContent('Event 0')
    expect(screen.getByRole('list', { name: 'Events to delete' })).toHaveTextContent('Event 1')
    expect(screen.getByRole('button', { name: 'Delete 2 events' })).toBeInTheDocument()
  })

  it('caps the preview and reports the rest', async () => {
    render(
      <BulkDeleteDialog open events={events} onOpenChange={vi.fn()} onConfirm={vi.fn()} />,
    )

    const list = await screen.findByRole('list', { name: 'Events to delete' })
    expect(list.querySelectorAll('li')).toHaveLength(6)
    expect(list).toHaveTextContent('and 2 more…')
    expect(list).not.toHaveTextContent('Event 5')
  })

  it('confirms and cancels through the dialog controls', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <BulkDeleteDialog
        open
        events={events.slice(0, 3)}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    )

    const cancel = await screen.findByRole('button', { name: 'Cancel' })
    // The safe action owns the initial focus, so Enter never deletes by accident.
    await waitFor(() => expect(cancel).toHaveFocus())
    await user.click(cancel)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onConfirm).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete 3 events' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('uses the singular for a single event', async () => {
    render(
      <BulkDeleteDialog
        open
        events={events.slice(0, 1)}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(await screen.findByRole('heading', { name: 'Delete 1 event?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete 1 event' })).toBeInTheDocument()
  })
})
