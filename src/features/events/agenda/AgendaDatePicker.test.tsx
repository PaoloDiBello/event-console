import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AgendaDatePicker } from './AgendaDatePicker'

function renderPicker() {
  const onChange = vi.fn()
  render(
    <AgendaDatePicker
      value="2026-11-10"
      min="2026-11-10"
      max="2026-12-24"
      onChange={onChange}
    />,
  )
  return { onChange, user: userEvent.setup() }
}

describe('AgendaDatePicker', () => {
  it('opens a calendar and jumps to a selected day', async () => {
    const { onChange, user } = renderPicker()

    await user.click(screen.getByRole('button', { name: /jump to date/i }))
    const dialog = await screen.findByRole('dialog', { name: /choose a date/i })

    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /November 9th, 2026/i })).toBeDisabled()

    await user.click(within(dialog).getByRole('button', { name: /November 13th, 2026/i }))

    expect(onChange).toHaveBeenCalledWith('2026-11-13')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes with Escape and returns to the trigger', async () => {
    const { user } = renderPicker()
    const trigger = screen.getByRole('button', { name: /jump to date/i })

    await user.click(trigger)
    expect(await screen.findByRole('dialog', { name: /choose a date/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('jumps back to the first selectable day from the Today shortcut', async () => {
    const { onChange, user } = renderPicker()

    await user.click(screen.getByRole('button', { name: /jump to date/i }))
    const dialog = await screen.findByRole('dialog', { name: /choose a date/i })
    await user.click(within(dialog).getByRole('button', { name: 'Today' }))

    expect(onChange).toHaveBeenCalledWith('2026-11-10')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
