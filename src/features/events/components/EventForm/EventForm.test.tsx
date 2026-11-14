import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { todayIso } from '@/shared/lib/dates'
import type { EventRecord } from '@/features/events/model'
import { EventForm } from './EventForm'

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const onOpenChange = vi.fn()
  render(<EventForm open mode="create" onOpenChange={onOpenChange} onSubmit={onSubmit} />)
  return { onOpenChange, onSubmit }
}

const existing: EventRecord = {
  id: 'evt_test',
  title: 'Existing review',
  date: '2026-11-03',
  startMinute: 11 * 60,
  durationMin: 45,
  category: 'review',
  status: 'at_risk',
  priority: 'high',
  owner: 'Mira Okafor',
  location: 'HQ · Room 4',
  notes: 'Bring the incident timeline.',
  search: 'existing review',
}

describe('EventForm', () => {
  it('prefills edit mode from the record', () => {
    render(
      <EventForm
        open
        mode="edit"
        event={existing}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/Title/)).toHaveValue('Existing review')
    expect(screen.getByLabelText(/Date/)).toHaveValue('2026-11-03')
    expect(screen.getByLabelText(/Owner/)).toHaveValue('Mira Okafor')
  })

  it('blocks an empty title, announces the error and focuses the field', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Create event' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(screen.getByLabelText(/Title/)).toHaveFocus()
    expect(screen.getByLabelText(/Title/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('focuses the date when the title is valid but the date is not', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/Title/), 'Valid title')
    fireEvent.change(screen.getByLabelText(/Date/), { target: { value: '' } })
    await user.click(screen.getByRole('button', { name: 'Create event' }))

    expect(await screen.findByText('Date is required')).toBeInTheDocument()
    expect(screen.getByLabelText(/Date/)).toHaveFocus()
  })

  it('submits a trimmed, normalized draft', async () => {
    const user = userEvent.setup()
    const { onSubmit, onOpenChange } = renderForm()

    await user.type(screen.getByLabelText(/Title/), '  Deploy billing-api  ')
    await user.click(screen.getByRole('button', { name: 'Create event' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Deploy billing-api',
        date: todayIso(),
        startMinute: 9 * 60,
        owner: 'Unassigned',
        location: 'Remote',
      }),
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('asks before discarding changes and keeps focus inside the dialog', async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderForm()

    await user.type(screen.getByLabelText(/Title/), 'Unsaved draft')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(await screen.findByText('Discard your unsaved changes?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Keep editing' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus())
    expect(onOpenChange).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(await screen.findByRole('button', { name: 'Discard changes' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('keeps the dialog open and surfaces a save failure', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('The events service is unavailable.'))
    renderForm(onSubmit)

    await user.type(screen.getByLabelText(/Title/), 'Will fail')
    await user.click(screen.getByRole('button', { name: 'Create event' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The events service is unavailable.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create event' })).toBeEnabled()
  })

  it('opens the calendar popover and picks a date from it', async () => {
    const user = userEvent.setup()
    renderForm()

    const openCalendarBtn = screen.getByRole('button', { name: 'Open calendar' })
    await user.click(openCalendarBtn)

    const calendarDialog = await screen.findByRole('dialog', { name: 'Choose event date' })
    expect(calendarDialog).toBeInTheDocument()

    const todayBtn = within(calendarDialog).getByRole('button', { name: 'Today' })
    await user.click(todayBtn)

    expect(screen.queryByRole('dialog', { name: 'Choose event date' })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Date/)).toHaveValue(todayIso())
  })

  it('opens the time popover and picks a quick time', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Open time picker' }))

    const timeDialog = await screen.findByRole('dialog', { name: 'Choose start time' })
    await user.click(within(timeDialog).getByRole('button', { name: '14:00' }))

    expect(screen.queryByRole('dialog', { name: 'Choose start time' })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Start time/)).toHaveValue('14:00')
  })

  it('moves the hour and minute listboxes with the arrow keys', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Open time picker' }))
    const hourList = await screen.findByRole('listbox', { name: 'Hours' })

    // One tab stop per list, and the selected hour owns it on open.
    const selectedHour = within(hourList).getByRole('option', { selected: true })
    expect(selectedHour).toHaveTextContent('09')
    expect(selectedHour).toHaveFocus()
    expect(within(hourList).getAllByRole('option').filter((o) => o.tabIndex === 0)).toHaveLength(1)

    await user.keyboard('{ArrowDown}')
    expect(screen.getByLabelText(/Start time/)).toHaveValue('10:00')
    expect(within(hourList).getByRole('option', { selected: true })).toHaveTextContent('10')
    expect(within(hourList).getByRole('option', { selected: true })).toHaveFocus()

    const minuteList = screen.getByRole('listbox', { name: 'Minutes' })
    within(minuteList).getByRole('option', { selected: true }).focus()
    await user.keyboard('{End}')

    expect(screen.getByLabelText(/Start time/)).toHaveValue('10:55')
    expect(within(minuteList).getByRole('option', { selected: true })).toHaveTextContent('55')
  })

  it('keeps the hour list reachable when the time field is empty', async () => {
    const user = userEvent.setup()
    renderForm()

    fireEvent.change(screen.getByLabelText(/Start time/), { target: { value: '' } })
    await user.click(screen.getByRole('button', { name: 'Open time picker' }))

    const hourList = await screen.findByRole('listbox', { name: 'Hours' })
    expect(within(hourList).queryByRole('option', { selected: true })).not.toBeInTheDocument()

    const options = within(hourList).getAllByRole('option')
    expect(options.filter((option) => option.tabIndex === 0)).toEqual([options[0]])
    expect(options[0]).toHaveFocus()
  })
})
