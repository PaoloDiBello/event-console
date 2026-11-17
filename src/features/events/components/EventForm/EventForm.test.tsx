import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { todayIso } from '@/shared/lib/dates'
import type { EventRecord } from '@/features/events/model'
import { EventForm } from './EventForm'

interface SuggestionProps {
  ownerSuggestions?: readonly string[]
  locationSuggestions?: readonly string[]
}

function renderForm(
  onSubmit = vi.fn().mockResolvedValue(undefined),
  suggestions: SuggestionProps = {},
) {
  const onOpenChange = vi.fn()
  render(
    <EventForm
      open
      mode="create"
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      {...suggestions}
    />,
  )
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

  it('submits the choices picked from the in-app menus', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText(/Title/), 'Menu picks')

    async function pick(label: string, option: string) {
      await user.click(screen.getByRole('button', { name: label }))
      const menu = await screen.findByRole('menu', { name: `${label} options` })
      await user.click(within(menu).getByRole('menuitemradio', { name: option }))
    }

    await pick('Duration', '45 minutes')
    await pick('Category', 'Incident')
    await pick('Status', 'At risk')
    await pick('Priority', 'High')

    // The trigger must show the pick, not just hold it in form state.
    expect(screen.getByRole('button', { name: 'Duration' })).toHaveTextContent('45 minutes')
    expect(screen.getByRole('button', { name: 'Status' })).toHaveTextContent('At risk')

    await user.click(screen.getByRole('button', { name: 'Create event' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMin: 45,
        category: 'incident',
        status: 'at_risk',
        priority: 'high',
      }),
    )
  })

  it('deletes the event only after the confirmation', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <EventForm
        open
        mode="edit"
        event={existing}
        onOpenChange={onOpenChange}
        onSubmit={vi.fn()}
        onDelete={onDelete}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Delete event' }))
    expect(
      await screen.findByText('Delete this event? Undo is waiting in the toast.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep event' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Keep event' }))
    expect(screen.queryByText(/Delete this event\?/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete event' })).toHaveFocus()
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete event' }))
    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(onDelete).toHaveBeenCalledWith(existing)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('offers no delete action while creating', () => {
    renderForm()
    expect(screen.queryByRole('button', { name: 'Delete event' })).not.toBeInTheDocument()
  })

  it('closes without turning the empty title into an error', async () => {
    const user = userEvent.setup()
    renderForm()

    // A pick in another control leaves the auto-focused title, which is exactly
    // what blur validation reports — and what clicking the X does too.
    await user.click(screen.getByRole('button', { name: 'Category' }))
    const menu = await screen.findByRole('menu', { name: 'Category options' })
    await user.click(within(menu).getByRole('menuitemradio', { name: 'Incident' }))
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close dialog' }))

    // Leaving is not submitting: the discard prompt must not argue about a
    // field the user is abandoning.
    expect(await screen.findByText('Discard your unsaved changes?')).toBeInTheDocument()
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Title/)).toHaveAttribute('aria-invalid', 'false')
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

  it('does not report a missing title just because the field was left', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    // Focusing a field and leaving it empty is not a request to save — and it
    // is exactly what clicking Cancel, a menu or the X does on the way out.
    await user.click(screen.getByLabelText(/Title/))
    await user.tab()

    expect(screen.queryByText('Title is required')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Title/)).toHaveAttribute('aria-invalid', 'false')

    // The error still arrives when it means something.
    await user.click(screen.getByRole('button', { name: 'Create event' }))
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('suggests an existing owner while still accepting free text', async () => {
    const user = userEvent.setup()
    renderForm(undefined, {
      ownerSuggestions: ['Mira Okafor', 'Nora Haddad'],
      locationSuggestions: ['HQ · Room 4'],
    })

    const owner = screen.getByLabelText(/Owner/)
    await user.type(owner, 'mir')

    const listbox = await screen.findByRole('listbox', { name: 'Owner' })
    expect(within(listbox).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Mira Okafor',
    ])
    expect(owner).toHaveAttribute('aria-expanded', 'true')

    // The list announces itself on open: the first match is already active, so
    // assistive tech reads it without waiting for an arrow key.
    const firstOption = within(listbox).getAllByRole('option')[0]!
    expect(firstOption).toHaveAttribute('aria-selected', 'true')
    expect(owner).toHaveAttribute('aria-activedescendant', firstOption.id)

    await user.keyboard('{ArrowDown}')
    expect(within(listbox).getByRole('option', { selected: true })).toHaveTextContent('Mira Okafor')
    expect(owner).toHaveAttribute('aria-activedescendant', within(listbox).getByRole('option', { selected: true }).id)

    await user.keyboard('{Enter}')
    expect(owner).toHaveValue('Mira Okafor')
    expect(screen.queryByRole('listbox', { name: 'Owner' })).not.toBeInTheDocument()

    // Free text is still the value of record: nothing is forced on the user.
    await user.clear(owner)
    await user.type(owner, 'Zed Diallo')
    expect(owner).toHaveValue('Zed Diallo')
    expect(screen.queryByRole('listbox', { name: 'Owner' })).not.toBeInTheDocument()
  })

  it('moves through several suggestions and takes the active one', async () => {
    const user = userEvent.setup()
    renderForm(undefined, { ownerSuggestions: ['Mira Okafor', 'Amira Haddad'] })

    const owner = screen.getByLabelText(/Owner/)
    await user.type(owner, 'mir')

    const listbox = await screen.findByRole('listbox', { name: 'Owner' })
    const options = within(listbox).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Mira Okafor', 'Amira Haddad'])
    expect(owner).toHaveAttribute('aria-activedescendant', options[0]!.id)

    await user.keyboard('{ArrowDown}')
    expect(owner).toHaveAttribute('aria-activedescendant', options[1]!.id)
    expect(options[1]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Enter}')
    expect(owner).toHaveValue('Amira Haddad')
    expect(screen.queryByRole('listbox', { name: 'Owner' })).not.toBeInTheDocument()
  })

  it('previews the end time from the start time and duration', () => {
    renderForm()

    expect(screen.getByText('Ends 10:00')).toBeInTheDocument()
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
