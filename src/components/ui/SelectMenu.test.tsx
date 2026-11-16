import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SelectMenu } from './SelectMenu'

const options = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'completed', label: 'Completed' },
]

describe('SelectMenu', () => {
  it('shows the current option and changes it from the in-app menu', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <SelectMenu
        id="status"
        label="Status"
        value="scheduled"
        options={options}
        onValueChange={onValueChange}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Status' })
    expect(trigger).toHaveTextContent('Scheduled')

    await user.click(trigger)
    const menu = await screen.findByRole('menu', { name: 'Status options' })
    expect(within(menu).getByRole('menuitemradio', { name: 'Scheduled' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await user.click(within(menu).getByRole('menuitemradio', { name: 'At risk' }))

    expect(onValueChange).toHaveBeenCalledWith('at_risk')
  })

  it('closes with Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(
      <SelectMenu
        id="status"
        label="Status"
        value="scheduled"
        options={options}
        onValueChange={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Status' })
    await user.click(trigger)
    await screen.findByRole('menu')

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('wires the error state to the trigger', () => {
    render(
      <SelectMenu
        id="status"
        label="Status"
        value="scheduled"
        options={options}
        onValueChange={vi.fn()}
        hasError
        describedBy="status-error"
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Status' })
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('aria-describedby', 'status-error')
  })
})
