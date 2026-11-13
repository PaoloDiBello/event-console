import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { todayIso } from '@/shared/lib/dates'
import { DataGridDateFilter } from './DataGridDateFilter'

function renderFilter(value = '') {
  const onChange = vi.fn()
  render(<DataGridDateFilter label="When" value={value} disabled={false} onChange={onChange} />)
  return { onChange, user: userEvent.setup() }
}

describe('DataGridDateFilter', () => {
  it('shows an idle trigger until a day is applied', () => {
    renderFilter()

    const trigger = screen.getByRole('button', { name: 'Filter by When' })
    expect(trigger).toHaveTextContent('Any date')
    expect(screen.queryByRole('button', { name: 'Clear When filter' })).not.toBeInTheDocument()
  })

  it('applies the day picked from the calendar and closes', async () => {
    const { onChange, user } = renderFilter('2026-11-13')

    const trigger = screen.getByRole('button', { name: 'Filter by When, currently 13 Nov 2026' })
    expect(trigger).toHaveTextContent('13 Nov 2026')

    await user.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Filter When by date' })
    await user.click(within(dialog).getByRole('button', { name: /November 20th, 2026/i }))

    expect(onChange).toHaveBeenCalledWith('2026-11-20')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clears the applied day from the trigger', async () => {
    const { onChange, user } = renderFilter('2026-11-13')

    await user.click(screen.getByRole('button', { name: 'Clear When filter' }))

    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('clears the applied day from inside the calendar', async () => {
    const { onChange, user } = renderFilter('2026-11-13')

    await user.click(screen.getByRole('button', { name: /Filter by When/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Filter When by date' })
    await user.click(within(dialog).getByRole('button', { name: 'Clear' }))

    expect(onChange).toHaveBeenCalledWith(undefined)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('jumps to today from the calendar shortcut', async () => {
    const { onChange, user } = renderFilter()

    await user.click(screen.getByRole('button', { name: 'Filter by When' }))
    const dialog = await screen.findByRole('dialog', { name: 'Filter When by date' })
    await user.click(within(dialog).getByRole('button', { name: 'Today' }))

    expect(onChange).toHaveBeenCalledWith(todayIso())
  })
})
