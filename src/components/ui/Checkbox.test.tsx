import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('stays a native checkbox that reports its state', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox aria-label="Pick row" onChange={onChange} />)

    const box = screen.getByRole('checkbox', { name: 'Pick row' })
    expect(box).not.toBeChecked()

    await user.click(box)
    expect(onChange).toHaveBeenCalled()
    expect(box).toBeChecked()
  })

  it('sets the mixed state as a DOM property', () => {
    render(<Checkbox aria-label="Pick all" indeterminate />)

    expect(screen.getByRole('checkbox', { name: 'Pick all' })).toHaveProperty(
      'indeterminate',
      true,
    )
  })
})
