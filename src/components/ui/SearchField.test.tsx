import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SearchField } from './SearchField'

function Harness() {
  const [value, setValue] = useState('')
  return (
    <SearchField
      value={value}
      onValueChange={setValue}
      clearLabel="Clear search"
      aria-label="Search"
    />
  )
}

describe('SearchField', () => {
  it('clears the query with Escape while keeping focus', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByRole('searchbox', { name: 'Search' })
    await user.type(input, 'billing')
    expect(input).toHaveValue('billing')

    await user.keyboard('{Escape}')

    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })

  it('leaves the field on Escape when it is already empty', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByRole('searchbox', { name: 'Search' })
    await user.click(input)
    expect(input).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(input).not.toHaveFocus()
  })

  it('runs a caller key handler first and respects its prevention', async () => {
    const user = userEvent.setup()
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') event.preventDefault()
    })
    const onValueChange = vi.fn()

    render(
      <SearchField
        value="kept"
        onValueChange={onValueChange}
        clearLabel="Clear search"
        aria-label="Search"
        onKeyDown={onKeyDown}
      />,
    )

    await user.click(screen.getByRole('searchbox', { name: 'Search' }))
    await user.keyboard('{Escape}')

    expect(onKeyDown).toHaveBeenCalled()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
