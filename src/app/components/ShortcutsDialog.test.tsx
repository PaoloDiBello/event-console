import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { ShortcutsDialog } from './ShortcutsDialog'

/** Controlled harness so the Escape path exercises real open/close state. */
function Harness({ initiallyOpen = true }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen)
  return (
    <ShortcutsDialog
      open={open}
      onOpenChange={setOpen}
    />
  )
}

describe('ShortcutsDialog', () => {
  it('lists the shortcuts grouped by where they work', () => {
    render(<Harness />)
    const dialog = screen.getByRole('dialog', { name: 'Keyboard shortcuts' })

    for (const group of ['Anywhere', 'Registry', 'Agenda']) {
      expect(within(dialog).getByRole('heading', { name: group })).toBeInTheDocument()
    }

    expect(within(dialog).getByText('New event')).toBeInTheDocument()
    expect(within(dialog).getByText('Focus search')).toBeInTheDocument()
    expect(within(dialog).getByText('Move between events')).toBeInTheDocument()
  })

  it('closes with Escape', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stays out of the tree while closed', () => {
    render(<Harness initiallyOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
