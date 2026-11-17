import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DensityMenu } from './DensityMenu'

describe('DensityMenu', () => {
  it('names the control and spells out every choice', async () => {
    const user = userEvent.setup()
    render(<DensityMenu value="comfortable" onValueChange={vi.fn()} />)

    // The trigger says what it changes and which value is active; the old
    // "Comp / Comf / Spac" buttons made the reader decode the toolbar.
    await user.click(screen.getByRole('button', { name: 'Row density: Comfortable' }))

    expect(await screen.findByRole('menuitemradio', { name: /Compact/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /Spacious/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /Comfortable/ })).toBeChecked()
  })

  it('reports the chosen density', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DensityMenu value="comfortable" onValueChange={onValueChange} />)

    await user.click(screen.getByRole('button', { name: 'Row density: Comfortable' }))
    await user.click(await screen.findByRole('menuitemradio', { name: /Spacious/ }))

    expect(onValueChange).toHaveBeenCalledWith('spacious')
  })
})
